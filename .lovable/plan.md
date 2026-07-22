## Objetivo

Três melhorias sobre a base funcional atual: (1) notificações automáticas para clientes, (2) restrições finas entre `dono` e `mecanico`, (3) onboarding guiado com botão de dados demo.

---

## 1) Notificações automáticas

O objetivo é acionar os alertas inteligentes que hoje só existem visualmente (retorno 90d, revisão km/tempo, aniversário, pós-venda) sem o dono precisar clicar em cada card.

**Canais**
- **E-mail** para o dono (resumo diário dos alertas da oficina) — via **Resend** (Lovable Emails não disponível porque o projeto usa Supabase externo).
- **WhatsApp para o cliente** — continua via `wa.me` (link clicável), mas gerado em lote no resumo. Envio automático real por Twilio/API oficial fica fora — requer verificação de número business e custo por mensagem; não implementar sem pedido explícito.

**Backend**
- Nova edge function `daily-alerts` (verify_jwt=false, autenticada por header `X-Cron-Secret`) que roda 1×/dia:
  - Para cada oficina com dono cadastrado, chama `get_smart_alerts()` como service_role varrendo `workshops`.
  - Agrupa os alertas por oficina, monta HTML com links `wa.me` pré-preenchidos e envia via Resend para o e-mail do dono (`auth.users.email`).
  - Grava em nova tabela `alert_notifications` (workshop_id, alert_key, enviado_em) para não repetir o mesmo alerta em <7 dias.
- `pg_cron` + `pg_net` disparando a função às 08:00 BRT.
- Preferência por oficina: nova coluna `workshops.notif_email_enabled bool default true` + `workshops.notif_email_horario` (futuro; entra padrão 08:00).
- Segredo novo: `RESEND_API_KEY` (usuário cria conta Resend e verifica domínio próprio ou usa `onboarding@resend.dev` para testes) + `CRON_SECRET` (gerado).

**Frontend**
- Card em `/configuracoes` para o dono ligar/desligar o e-mail diário e testar envio (botão "Enviar resumo agora" chama a mesma edge function com `?preview=1`).

---

## 2) Permissões finas dono × mecânico

Hoje o role `mecanico` só é usado para gate de convite/remoção. Vamos usá-lo para restringir o que o mecânico enxerga/edita.

**Regras alvo**
| Área | Dono | Mecânico |
|---|---|---|
| OS (ver/criar/editar próprias OS atribuídas) | ✅ | ✅ |
| OS de outros mecânicos | ✅ | 👁️ ver, ❌ editar |
| Excluir OS | ✅ | ❌ |
| Financeiro (`/financeiro`, `payments`) | ✅ | ❌ |
| Relatórios (`/relatorios`) | ✅ | ❌ |
| Estoque — leitura | ✅ | ✅ |
| Estoque — editar preços/quantidade | ✅ | ❌ |
| Catálogo de serviços — editar | ✅ | ❌ |
| Convidar/remover equipe | ✅ | ❌ |
| Configurações da oficina (logo, plano, dados) | ✅ | ❌ |

**Backend (RLS)**
- Nova coluna `service_orders.mecanico_id uuid references auth.users` (nullable — OS antigas ficam abertas).
- Policies novas em `service_orders`:
  - SELECT já é por `workshop_id`; adiciono policy adicional que continua permitindo leitura (mecânico vê todas da oficina — regra pedida).
  - UPDATE/DELETE restritiva: `has_role(auth.uid(),ws,'dono') OR mecanico_id = auth.uid()`.
- Policies restritivas novas em `payments`, `parts_inventory` (UPDATE/INSERT/DELETE), `services_catalog` (INSERT/UPDATE/DELETE), `appointments` (INSERT/UPDATE/DELETE do mecânico só nas próprias): `has_role(auth.uid(), current_workshop_id(), 'dono')`.
- Função auxiliar `is_dono()` (SECURITY DEFINER) para não repetir `has_role`.

**Frontend**
- Hook `useRole()` derivado de `user_roles` (já lido no `AuthProvider`).
- `AppLayout` esconde itens de menu vetados ao mecânico (Financeiro, Relatórios, Configurações→Equipe/Plano).
- `router.tsx`: `beforeLoad` nos routes gated retorna redirect para `/` se `role !== 'dono'`.
- Botões de excluir/editar OS ficam disabled com tooltip "Apenas o dono pode".
- Novo campo "Responsável" no wizard de OS (`os.nova.tsx`) e badge na listagem — mecânico pré-preenchido com o próprio user.

---

## 3) Onboarding guiado + dados demo

Hoje `ActivationChecklist` mostra pendências, mas o dono cai em telas vazias. Vamos:

**Tour interativo (primeira sessão)**
- Instalar `@reactour/tour` (~11KB) e envolver `AppLayout` num `TourProvider`.
- 5 passos: Dashboard → Novo cliente → Nova OS → Kanban → Alertas. Persistir dispensa em `profiles.tour_completed_at` (nova coluna).
- Botão "Refazer tour" em Configurações.

**Botão "Popular com dados de demonstração"**
- Em Configurações, card "Ambiente" com dois botões:
  - **Popular demo** → edge function `seed-demo-data` insere 8 clientes fictícios, 12 veículos, 20 OS em vários status, 6 pagamentos, 15 peças em estoque, escopados ao `workshop_id` do dono. Idempotente via prefixo `[DEMO]` no `nome`.
  - **Limpar dados de demonstração** → mesma função com `action:"clear"` deleta apenas registros com prefixo `[DEMO]`.
- Só disponível para `dono`. Confirmação com dialog.

**Copy nos empty states**
- `EmptyState` ganha prop `onPrimaryAction`; quando lista vazia + primeira sessão, oferece "Popular com exemplos" além do CTA principal.

---

## Detalhes técnicos

**Arquivos novos**
- `supabase/functions/daily-alerts/index.ts`
- `supabase/functions/seed-demo-data/index.ts`
- `src/hooks/useRole.ts`
- `src/components/AppTour.tsx`
- Migração SQL única cobrindo: `alert_notifications`, colunas `workshops.notif_*`, `service_orders.mecanico_id`, `profiles.tour_completed_at`, funções `is_dono()` + policies restritivas, `pg_cron` job, seed da coluna `mecanico_id` como NULL.

**Arquivos alterados**
- `src/components/AppLayout.tsx` — filtra menu por role, integra `TourProvider`.
- `src/router.tsx` — `beforeLoad` para gates de role em `/financeiro`, `/relatorios`, sub-rotas de configurações.
- `src/routes/configuracoes.tsx` — cards de notificação, tour e dados demo.
- `src/routes/os.nova.tsx`, `os.$osId.tsx`, `os.$osId.editar.tsx`, `os.kanban.tsx` — campo/badge de responsável, disable de ações para mecânico.
- `src/routes/os.index.tsx`, `financeiro.tsx`, `relatorios.tsx` — respeitar role.
- `src/hooks/useAuth.tsx` — expor `role` e `isDono`.
- `.env.example` — documentar `RESEND_API_KEY` e `CRON_SECRET`.

**Segredos a adicionar**
- `RESEND_API_KEY` — via `add_secret` (usuário obtém em resend.com/api-keys e verifica domínio de envio).
- `CRON_SECRET` — via `generate_secret`.

**Fora de escopo**
- Envio automático real de WhatsApp (só link clicável).
- Notificação push/PWA.
- SMS.
- Papel intermediário "recepcionista" — só `dono` e `mecanico`.
- Migrar OS antigas para atribuir mecânico — ficam sem responsável, editáveis apenas por dono.

**Verificação**
1. Login como `mecanico`: menu não mostra Financeiro/Relatórios; tentar acessar direto pela URL redireciona; PostgREST direto para UPDATE em `payments` retorna 403.
2. Login como `dono`: tudo acessível; botão "Enviar resumo agora" chega no e-mail.
3. Cron dispara `daily-alerts` e grava em `alert_notifications`; segunda execução no mesmo dia é no-op.
4. Botão "Popular demo" cria 20 OS; "Limpar demo" remove só os `[DEMO]`.
5. Primeiro login abre tour; dispensa persiste.

---

## Sugestão de rodadas

Se preferir dividir em duas entregas: **rodada A** = permissões + onboarding/demo (só banco+frontend, entrega no mesmo dia); **rodada B** = notificações (depende de você criar conta Resend e verificar domínio). Posso implementar A imediatamente após aprovação e abrir a rodada B quando você tiver a chave.
