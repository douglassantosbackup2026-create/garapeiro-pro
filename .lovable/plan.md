
# Auditoria de segurança — OficinaPRO

## Diagnóstico (o que a auditoria encontrou)

### 1. RLS — resultado por tabela

Todas as 16 tabelas têm **RLS habilitada**. Verifiquei policies e grants:

| Tabela | SELECT | INSERT | UPDATE | DELETE | Status |
|---|---|---|---|---|---|
| `workshops` | `members view` (id=current_workshop_id) | `authenticated create` (created_by=auth.uid) | `owners update` (has_role dono) | `owners delete` | ✅ + trigger `protect_workshop_entitlements` bloqueia `plano`/`playbook_unlocked_at` |
| `profiles` | próprio + colegas | próprio, workshop_id NULL | próprio, workshop_id imutável | — | ✅ + trigger `profiles_protect_workshop_id` |
| `user_roles` | próprio + colegas | dono via `has_role` | dono | dono | ✅ mecânico NÃO consegue se promover a dono via REST direto (falha em `has_role`) |
| `workshop_invites` | dono | dono | dono | dono | ✅ convidado não lê convite via REST — precisa passar pelo `acceptInvite` da edge |
| `clients`, `vehicles`, `service_orders`, `parts_inventory`, `payments`, `dismissed_alerts` | `workshop_id = current_workshop_id()` (ALL) | idem | idem | idem | ✅ |
| `service_order_services`, `service_order_parts` | `EXISTS (service_orders so WHERE so.id=... AND so.workshop_id=current_workshop_id())` | idem | idem | idem | ✅ FK + workshop_id checados juntos |
| `appointments`, `services_catalog` | `workshop_id = current_workshop_id()` mas `roles={public}` | idem | idem | idem | ⚠ Funciona (anon nunca casa), mas deve ser `authenticated` por clareza |
| `funil_leads`, `funil_orders` | sem policy (só service_role acessa via edge) | idem | idem | idem | ✅ |

**Bloqueio de workshop_id forjado:** com `WITH CHECK (workshop_id = current_workshop_id())`, inserir/atualizar linha com outro `workshop_id` é rejeitado pelo Postgres — validado logicamente contra as policies acima.

### 2. Achados críticos

#### 🔴 CRÍTICO — Escalada em `unlockPlaybook` (`supabase/functions/workshop-api/index.ts` linhas 356-412)
A função aceita QUALQUER `orderId` e só confere se `mp_status='approved'`. Não valida que o pedido pertence ao usuário. **Qualquer usuário autenticado pode desbloquear o playbook da sua oficina passando o `orderId` de qualquer pagamento aprovado alheio.**

#### 🔴 CRÍTICO — Gate de plano só no frontend
`GATED_ROUTES` (`src/lib/plans.ts`) esconde agenda/financeiro/estoque/relatórios na UI, mas nada no backend impede um usuário `plano=gratuito` de:
- criar OS acima de 15/mês (chamando `service_orders` direto via PostgREST)
- inserir em `parts_inventory`, `payments`, `appointments`

#### 🟡 ALTO — `parts_inventory` sem lock (race condition)
`apply_stock_movement()` faz `UPDATE ... quantidade = GREATEST(0, quantidade - X)`. Sem `SELECT ... FOR UPDATE` prévio, duas OS mudando para `entregue` simultaneamente podem sobrepor a leitura. `GREATEST(0, ...)` mascara underflow em vez de errar. CHECK `quantidade >= 0` já existe (bom), mas o `GREATEST` neutraliza.

#### 🟡 ALTO — Bucket `workshop-logos` sem restrições
`storage.buckets`: `public=true`, `file_size_limit=NULL`, `allowed_mime_types=NULL`. Aceita SVG (vetor XSS) e arquivo de qualquer tamanho.

#### 🟡 MÉDIO — Webhook Mercado Pago sem idempotência explícita
`mercado-pago` valida HMAC (bom, com skew de 5min ✅), mas reprocessa o mesmo `payment_id` sem checar se já registrou. Como só faz UPDATE de status, dano é limitado, mas convém adicionar guarda.

#### 🟢 BAIXO — Trigger functions executáveis por `anon`
`apply_stock_movement`, `assign_os_numero`, `profiles_protect_workshop_id`, `set_updated_at`, `set_profiles_updated_at` têm EXECUTE para anon/authenticated. São trigger functions (executam pelo trigger independentemente do grant), mas convém revogar de PUBLIC.

#### 🟢 BAIXO — Policies `appointments`/`services_catalog` com role `public`
Funciona (anon nunca satisfaz), mas trocar para `authenticated` melhora clareza.

### 3. Itens já OK (não precisam mudança)
- Webhook MP valida HMAC + timestamp (`validateMpWebhookSignature`) ✅
- CORS restrito a `oficinapro.life` + Lovable, nunca `*` ✅
- Zod em todos os inputs das edge functions ✅
- URL assinada do playbook expira em 120s ✅
- `funil-api` com rate limit em `upsertLead` e `touchLeadStep` ✅
- CHECK constraints de tamanho/positividade em `service_orders`, `parts_inventory`, `service_order_parts`, `funil_orders` ✅
- Rate limit de login — feito pelo Supabase Auth nativamente, não implementar camada duplicada.

---

## Correções

### Migração 1 — `unlockPlaybook`: vincular pedido ao usuário
Adicionar coluna `owner_user_id uuid` em `funil_orders` (nullable — pedidos antigos não têm). No fluxo:
- `processPayment` (mercado-pago) passa a aceitar `Authorization` opcional; se houver, grava `owner_user_id = auth.uid()`.
- `unlockPlaybook` (workshop-api) rejeita se `order.owner_user_id IS NULL` ou `≠ user.id`, com fallback para checar `payer_email = user.email` (compatibilidade).

### Migração 2 — Gate de plano no banco
Função `public.workshop_plano(_ws uuid) returns text` (SECURITY DEFINER, lê `workshops.plano`).
Novas policies ALL adicionais (permissivas encadeadas via `AS RESTRICTIVE`):
- `parts_inventory`, `payments`, `appointments` INSERT/UPDATE só se `workshop_plano(current_workshop_id()) IN ('solo','oficina')`.
- `service_orders` INSERT restritiva: `plano <> 'gratuito' OR (contagem_mes < 15)` via subquery.

### Migração 3 — Race condition em estoque
Reescrever `apply_stock_movement()`:
```sql
FOR rec IN SELECT inventory_id, SUM(quantidade) qtd ... LOOP
  PERFORM 1 FROM parts_inventory WHERE id = rec.inventory_id FOR UPDATE;
  UPDATE parts_inventory SET quantidade = quantidade - rec.qtd WHERE id = rec.inventory_id;
END LOOP;
```
Remover `GREATEST(0,...)` — deixar CHECK `quantidade >= 0` estourar (bloqueia entrega se estoque insuficiente). Adicionar mensagem de erro amigável via `EXCEPTION WHEN check_violation`.

### Migração 4 — Storage hardening
```sql
UPDATE storage.buckets
   SET file_size_limit = 2097152,   -- 2 MB
       allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp']
 WHERE id = 'workshop-logos';
```
SVG fica bloqueado pelo whitelist. Frontend (`useUploadLogo`) já valida tipo — adicionar mensagem alinhada.

### Migração 5 — Idempotência webhook + limpezas
- Coluna `funil_orders.webhook_processed_at timestamptz` + índice único parcial em `mp_payment_id` já garante update-only.
- Adicionar guard no webhook: `IF webhook_processed_at IS NOT NULL AND mp_status IN ('approved','rejected','cancelled') THEN return`.
- Reescrever policies `appointments` e `services_catalog` para `TO authenticated`.
- `REVOKE EXECUTE ... FROM PUBLIC, anon` para as 5 trigger functions.

### Código (edge functions)
- `workshop-api/index.ts` `unlockPlaybook`: validar `owner_user_id` ou `payer_email`.
- `mercado-pago/index.ts` webhook: checar `webhook_processed_at` antes de UPDATE; setar após.
- `mercado-pago/index.ts` `processPayment`: se `Authorization` header presente, resolver `user.id` e persistir em `owner_user_id`.

### Código (frontend)
- `MercadoPagoCheckout.tsx`: passar `Authorization` no `functions.invoke` quando usuário logado (para vincular pedido).
- Nenhuma outra mudança de UI.

---

## Detalhes técnicos

**Arquivos alterados**
- `supabase/functions/workshop-api/index.ts` — `unlockPlaybook` valida propriedade do pedido.
- `supabase/functions/mercado-pago/index.ts` — idempotência + `owner_user_id`.
- `src/funil/components/MercadoPagoCheckout.tsx` — envia bearer token se logado.
- Migração SQL única (agrupa 1-5 acima).

**Fora de escopo (declarado)**
- Rate limit adicional em `signIn` (o Supabase Auth já limita; camada extra viraria manutenção).
- Migrar `funil_leads`/`funil_orders` para ter policies (mantém acesso apenas via service_role).
- Renomear policies antigas cujo nome tem espaço — puramente estético.

**Verificação após implementar**
1. `supabase--curl_edge_functions` chamando `unlockPlaybook` com `orderId` de outra oficina → deve responder 403.
2. Query direta como usuário `plano=gratuito` tentando INSERT em `parts_inventory` → deve retornar `permission denied`.
3. Simular concorrência: 2 UPDATEs em paralelo de OS `entregue` com mesma peça — segundo deve falhar com CHECK violation em vez de estoque negativo.
4. Upload de `.svg` em workshop-logos via API → deve ser rejeitado pelo bucket.
5. Chamar webhook MP 2x com mesmo `payment_id` → segundo call vira no-op.
6. `supabase--linter` limpa.

Confirma para eu implementar? Posso também dividir em duas rodadas (críticos primeiro, hardening depois) se preferir.
