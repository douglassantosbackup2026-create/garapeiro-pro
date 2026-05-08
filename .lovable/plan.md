# MecânicoPRO — Plano de Construção

SaaS mobile-first para mecânicos autônomos e pequenas oficinas brasileiras. Estilo industrial-moderno, navegação inferior no mobile e sidebar no desktop. **Banco de dados real Supabase), sem telas de login/cadastro nesta fase** — o app entra direto no Dashboard usando uma "oficina padrão" criada no seed inicial. A autenticação pode ser plugada depois sem refatorar o schema.

## Backend — Supabase

Habilitar Supabase e criar as tabelas via migration. **Sem RLS por usuário ainda** (sem auth), mas as tabelas já carregam `workshop_id` para isolamento futuro. RLS permissiva temporária (`USING (true)`) com comentário avisando que precisa ser apertada quando o login for adicionado.

### Schema

- `workshops` — id, nome, telefone, endereço, logo_url, mensagem_orcamento, mensagem_atualizacao, mensagem_retorno, plano (enum: gratuito/solo/oficina), criada_em
- `clients` — id, workshop_id (FK), nome, telefone, email, criada_em
- `vehicles` — id, workshop_id, client_id (FK), placa, marca, modelo, ano, cor, km, criada_em
- `service_orders` — id, workshop_id, numero (sequencial por workshop), vehicle_id, client_id, status (enum), data_entrada, previsao_entrega, forma_pagamento, observacoes, total_servicos, total_pecas, total_geral, criada_em, atualizada_em
- `service_order_services` — id, service_order_id, descricao, valor
- `service_order_parts` — id, service_order_id, nome, quantidade, valor_unitario, valor_total
- `dismissed_alerts` — id, workshop_id, client_id, dispensado_em (TTL 30 dias)
- **Trigger** para gerar `numero` sequencial por workshop ao inserir OS (`#0001`, `#0042`)
- **Trigger** `updated_at` em `service_orders`
- **Storage bucket público** `workshop-logos` para upload de logo

### Seed

Edge migration insere 1 workshop padrão "Oficina Demo" + 3 clientes, 5 veículos, 8 OS variadas em diferentes status, e dados que disparam 2 alertas de retorno (>90 dias). Em `src/lib/workshop.ts`, expor `DEFAULT_WORKSHOP_ID` (constante hardcoded com o UUID do seed) usado em toda a app enquanto não há login.

## Acesso aos Dados

- Cliente Supabase do navegador (`@/integrations/supabase/client`) usado direto em hooks com **TanStack Query**
- Hooks dedicados em `src/hooks/`: `useClients`, `useVehicles`, `useServiceOrders`, `useDashboardStats`, `useReturnAlerts`, `useWorkshop`
- Mutations com `invalidateQueries` para refresh automático
- Sem `createServerFn` neste momento (sem auth, sem segredo a proteger)

## Identidade Visual

- **Paleta industrial-moderna:** grafite escuro `#1a1d21`, laranja sinal `#ff6b1a` (CTA/FAB), verde dinheiro, amarelo/azul/roxo/cinza/vermelho para status
- **Tipografia:** Space Grotesk (títulos) + Inter (corpo)
- **Placa brasileira:** badge fundo branco, borda preta grossa, texto preto monoespaçado
- **Tokens semânticos** em `src/styles.css` (oklch); zero cores hardcoded
- **Mobile-first:** alvos de toque ≥44px, contraste alto

## Arquitetura de Rotas (TanStack file-based)

```text
src/routes/
  __root.tsx              shell + QueryClient + layout responsivo
  index.tsx               Dashboard (entrada direta, sem login)
  os.index.tsx            Lista de OS
  os.nova.tsx             Wizard 3 passos
  os.$osId.tsx            Detalhe OS
  veiculos.index.tsx
  veiculos.$vehicleId.tsx
  clientes.index.tsx
  clientes.$clientId.tsx
  alertas.tsx
  configuracoes.tsx
```

## Layout Responsivo

- **Mobile (<768px):** bottom nav fixa com 5 ícones (Início / OS / Veículos / Clientes / Configurações)
- **Desktop (≥768px):** sidebar shadcn à esquerda + nome da oficina no topo

## Telas (10)

1. **Dashboard** — saudação, data, sino com badge, grid 2x2 (Hoje laranja / A receber verde / Veículos azul / Clientes roxo), OS recentes (5), Alertas de Retorno, FAB laranja com modal (Nova OS / Novo Cliente)
2. **OS — Lista** — chips de filtro, busca por placa/cliente/nº, cards com nº, placa-badge, cliente, serviço principal, valor, status, WhatsApp
3. **Nova OS** — wizard 3 passos com barra de progresso:
  - **P1:** input placa com máscara (AAA-0000 e Mercosul) + busca (lê de `vehicles`; se não existe, mock retorna marca/modelo/ano de uma lista comum); cliente vinculado/novo; KM
  - **P2:** serviços (+chips de sugestões), peças (qtd × valor → total auto), resumo financeiro com Total grande verde
  - **P3:** date picker, observações, chips forma de pagamento, toggle "Enviar para aprovação" → gera link WhatsApp
4. **Detalhe OS** — cards Veículo/Cliente/Serviços+Peças/Informações; barra com 3 ações (Enviar orçamento, Atualizar status, Marcar entregue); template WhatsApp completo
5. **Veículos** — busca, cards com placa-badge, dados, proprietário, última visita, nº OS
6. **Detalhe Veículo** — placa grande, dados, proprietário com WhatsApp, **timeline** vertical (prontuário) das OS, CTA "Nova OS para este veículo"
7. **Clientes** — busca, cards com avatar inicial colorido, contato, nº veículos, badge "Há mais de 90 dias"
8. **Detalhe Cliente** — contato, lista de veículos + adicionar, histórico de OS, botão WhatsApp
9. **Alertas de Retorno** — lista de inativos >90 dias, mensagem WhatsApp pré-formatada, "Marcar como contatado" (insere em `dismissed_alerts`)
10. **Configurações** — Minha Oficina (nome, telefone, endereço, upload logo, mensagens padrão); Assinatura (badge + upgrade placeholder); Notificações (toggles); Atalhos WhatsApp (3 templates editáveis); botões "Limpar dados de demonstração" / "Restaurar dados de demo"

## Funcionalidades Transversais

- **Status de OS** com cores: Aguardando aprovação (amarelo), Em andamento (azul), Aguardando peça (roxo), Concluído (verde), Entregue (cinza), Cancelado (vermelho)
- **WhatsApp helper** em `src/lib/whatsapp.ts`: `buildWhatsappUrl(telefone, texto)` → `https://wa.me/55{telefone_limpo}?text={encoded}`; templates centralizados que leem mensagens personalizadas do workshop
- **Busca de placa mockada:** após 7 chars válidos → consulta `vehicles` por placa; se não achar → loading 800ms + mock retorna marca/modelo/ano de lista comum; se nada → libera campos manuais
- **Cálculo "A receber":** soma de `total_geral` em OS com status ≠ Entregue/Cancelado
- **Detector de inatividade:** clientes cuja OS mais recente é >90 dias e não estão em `dismissed_alerts` (TTL 30 dias)
- **Validação Zod** em todos os formulários (placa, telefone BR, valores)
- **Empty states** com ícone, mensagem motivacional e CTA em todas as listas
- **Componentes reutilizáveis:** `<PlacaBadge/>`, `<StatusBadge/>`, `<WhatsAppButton/>`, `<EmptyState/>`, `<CurrencyInput/>`, `<PlateInput/>`

## Entrega em Fases

1. Habilitar Supabase + migration completa (tabelas, enums, triggers, bucket, RLS permissiva) + seed
2. Design system (tokens, fontes, componentes base) + layout responsivo (bottom nav + sidebar)
3. Hooks Query/Mutation para todas as entidades + helper WhatsApp
4. Telas Clientes e Veículos (lista + detalhe + formulários)
5. Wizard de Nova OS + Lista de OS com filtros + Detalhe OS
6. Dashboard com métricas reais + Alertas de Retorno
7. Configurações (oficina, mensagens, upload logo, gestão de dados de demo)
8. Polish: empty states, animações sutis, microcopy PT-BR

Quando o login for adicionado depois, basta: (1) trocar `DEFAULT_WORKSHOP_ID` por workshop do usuário logado, (2) endurecer as RLS policies para `workshop_id = auth.uid()`, e (3) adicionar telas de auth — sem mexer em nenhuma feature já construída.