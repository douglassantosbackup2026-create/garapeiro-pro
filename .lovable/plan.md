## Auditoria de segurança — OficinaPRO

Verificação dos 5 pontos solicitados. Nota geral: **projeto está bem acima da média**, com base sólida (Supabase SDK, Zod, RLS, CSP). Encontrei 4 pontos de atenção reais e algumas melhorias.

---

### 1) SQL Injection — OK ✅
Todas as consultas usam o SDK do Supabase (`supabase.from(...).select().eq(...)`) ou RPCs parametrizadas. Nenhum uso de `rpc("execute_sql")` ou concatenação de strings SQL. As funções SQL (`get_smart_alerts`, `has_role`, `current_workshop_id`) usam `SET search_path = public` e parâmetros tipados.

**Nenhuma correção necessária.**

---

### 2) XSS — 1 ponto de atenção ⚠️
- Renderização usa JSX (auto-escape). Nenhum uso perigoso de `innerHTML` no código do app.
- Único `dangerouslySetInnerHTML`: `src/components/ui/chart.tsx:73` — é o componente padrão do shadcn, injeta CSS gerado a partir de config estático (não input do usuário). **Aceitável**, mas fica como risco se alguém passar valores dinâmicos ali.

**Correção sugerida:** adicionar comentário de segurança no `chart.tsx` deixando explícito que `config.color/theme` nunca podem vir de input externo, e validar (regex hex/hsl) antes de injetar. Aplicar sanitização com regex simples nos valores de cor antes de montarem o CSS.

---

### 3) CSRF — parcialmente coberto ⚠️
- SPA + Supabase usa **tokens Bearer (JWT)** no header `Authorization`, não cookies de sessão. Isso **elimina CSRF clássico** para as chamadas ao Supabase e às edge functions autenticadas (`workshop-api`, parte da `mercado-pago`).
- Edge functions **públicas** (`funil-api`, `mercado-pago` para checkout de lead anônimo) não têm token de usuário — hoje protegidas apenas por allowlist de Origin/CORS. Isso já bloqueia navegador cross-origin, mas não bloqueia requests server-to-server forjados.

**Correções sugeridas:**
- Adicionar rate limiting simples (por IP/whatsapp) na `funil-api` para dificultar abuso do endpoint público de lead.
- Reforçar header `Referer`/`Origin` obrigatório nos endpoints públicos: rejeitar quando ambos ausentes (hoje `isOriginAllowed` retorna `true` quando não há Origin).
- Adicionar `SameSite=Strict` implicitamente já é OK pois não há cookies de sessão próprios.

---

### 4) Validação frontend + backend — OK com 1 gap ✅⚠️
- **Frontend:** `src/lib/schemas.ts` usa Zod em todos os formulários (Login, Cadastro, Cliente, Veículo, OS, Peça, etc.) com limites de tamanho e tipos.
- **Backend (edge functions):** `workshop-api`, `mercado-pago` e `funil-api` fazem `safeParse` em todo request. ✅
- **Gap:** os hooks CRUD (ex.: `useServicesCatalog`) chamam `supabase.from(...).insert()` direto do browser confiando 100% na RLS + constraints. Como as tabelas têm CHECKs mínimos, um usuário autenticado poderia inserir strings gigantes/campos fora do esperado que passem pela RLS.

**Correções sugeridas:**
- Aplicar `parseOrThrow(SchemaCorrespondente, input)` em todos os hooks de escrita (`useClients`, `useVehicles`, `useServiceOrders`, `useParts`, `usePayments`, `useAppointments`) — vários já fazem, alguns não. Padronizar.
- Adicionar constraints `CHECK (length(coluna) <= N)` nas colunas de texto principais (nome, observações, descrição) via migration para defesa em profundidade no banco.

---

### 5) Headers de segurança — OK ✅
Configurados em 3 lugares consistentes: `public/_headers` (Cloudflare/Netlify), `vercel.json` e `vite.config.ts` (dev):
- `Content-Security-Policy` completo, com allowlist específica (Supabase, Mercado Pago, gpteng). ✅
- `X-Frame-Options: DENY` + `frame-ancestors 'none'`. ✅
- `X-Content-Type-Options: nosniff`. ✅
- `Strict-Transport-Security` com preload. ✅
- `Referrer-Policy: strict-origin-when-cross-origin`. ✅
- `Permissions-Policy` restritivo. ✅

**Melhoria opcional:** remover `'unsafe-inline'` do `script-src` migrando o script inline do `index.html`/Mercado Pago para nonce/hash. Impacto: alto trabalho, ganho marginal enquanto MP exigir inline. **Manter como está.**

**Melhoria pequena:** o `_headers` está com `X-XSS-Protection: 1; mode=block` — header obsoleto (deprecado em navegadores modernos). Pode ser removido.

---

## Plano de correção (o que aplicar se aprovar)

1. **`src/components/ui/chart.tsx`**: validar `color/theme` com regex (`/^#[0-9a-f]{3,8}$|^hsl\(...\)$|^[a-z-]+$/i`) antes de gerar CSS; ignorar valores fora do padrão.
2. **`supabase/functions/funil-api/index.ts`** e **`mercado-pago/index.ts`**: exigir header `Origin` presente (não permitir requests sem Origin em produção); adicionar rate limit em memória por IP (janela deslizante — ex.: 20 req/min por IP no `upsertLead`).
3. **Hooks de escrita** (`useClients`, `useVehicles`, `useServiceOrders`, `useParts`, `usePayments`, `useAppointments`, `useWorkshop`): passar todo input por `parseOrThrow(Schema, input)` antes do `insert/update`.
4. **Migration** adicionando `CHECK (char_length(...) <= N)` nas colunas de texto livre principais: `clients.nome`, `clients.observacoes`, `vehicles.observacoes`, `service_orders.observacoes`, `service_order_services.descricao`, `service_order_parts.nome`, `services_catalog.nome/descricao`.
5. **`public/_headers`** e **`vercel.json`**: remover `X-XSS-Protection` (obsoleto).

## Fora do escopo
- Remover `'unsafe-inline'` do CSP (exige refatoração ampla do MP Bricks).
- Migrar auth para cookies HttpOnly (não faz sentido — Supabase SPA usa Bearer).

Confirma que quero aplicar as 5 correções acima? Posso separar por prioridade se preferir.
