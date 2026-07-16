
# Roadmap de melhorias — OficinaPRO

Baseado nas suas respostas: você quer **ganhar dinheiro melhor, organizar a oficina, controlar estoque e não perder cliente**, operando sozinho e usando WhatsApp como único canal com o cliente.

Proponho 6 entregas em ordem de impacto. Cada uma é independente — você implementa na ordem que quiser.

---

## 1. Kanban de OS (organizar a oficina) — *quick win*

Uma tela `/os/kanban` com 4 colunas arrastáveis: **Aguardando aprovação · Em execução · Pronto · Entregue**. Arrastar o card muda o status da OS (já existe no banco). Cada card mostra placa, cliente, valor e dias parado.

**Por quê:** você bate o olho e vê o que está travando, sem abrir uma a uma.

---

## 2. Controle de pagamentos e fiado

Hoje a OS tem `total_geral` mas nenhum registro do que foi pago. Adicionar:
- Tabela `payments` (OS, valor, data, forma de pagamento).
- Status financeiro derivado: **em aberto / parcial / pago**.
- Na página da OS: botão "Registrar pagamento" + histórico.
- Card no Início: **"A receber"** já existe, mas vai passar a refletir o saldo real (total − pago), não o total bruto.
- Lista `/financeiro` com filtro "fiado" e botão de cobrança via WhatsApp ("Olá {cliente}, sua OS #{numero} tem saldo de R$ X em aberto").

**Por quê:** ataca direto o "ganhar dinheiro / cobrar melhor".

---

## 3. Estoque de peças com baixa automática

- Tabela `parts_inventory` (nome, sku, custo, preço de venda, qtd em estoque, estoque mínimo).
- Página `/estoque` com lista, busca, edição inline de saldo e alerta visual quando `qtd ≤ mínimo`.
- Na criação/edição de OS: o autocomplete de peças sugere itens do estoque, puxa preço automaticamente e **dá baixa** quando a OS vai para "Entregue".
- Margem de lucro por OS: cálculo `total − custo das peças` exibido na OS e no Início.

**Por quê:** controla custo real e evita peça em falta no meio do serviço.

---

## 4. Orçamento em PDF + link WhatsApp

- Botão "Gerar orçamento" na OS → PDF estilizado com logo da oficina, dados, lista de serviços/peças, validade, total.
- Geração no cliente (jspdf + html2canvas) — sem custo de servidor.
- Botão "Enviar orçamento" abre WhatsApp do cliente com o link público do PDF e a mensagem template já configurada.

**Por quê:** profissionaliza, evita orçamento "no zap solto" e fecha mais.

---

## 5. Lembretes automáticos (não perder cliente)

Reaproveita o motor de alertas que já existe e adiciona:
- **Revisão por KM:** ao cadastrar próxima revisão (KM-alvo), aparece nos Alertas quando o veículo se aproxima.
- **Troca de óleo recorrente:** lembrete a cada N meses ou KM, configurável por cliente.
- **Aniversário do cliente:** card com mensagem pronta de parabéns + cupom opcional.
- **Pesquisa de satisfação:** 24h após "Entregue", aparece um alerta para mandar "Como foi seu atendimento? 1-5".

Tudo via clique → WhatsApp, sem disparo automático (sem custo de API).

**Por quê:** transforma o "Alertas" em um motor de receita recorrente.

---

## 6. Dashboard financeiro do mês

Página `/financeiro` (ou expansão do Início) com:
- Faturamento do mês (entregue) vs. mês anterior.
- A receber (fiado real).
- Top 5 serviços do mês.
- Top 5 clientes do mês.
- Gráfico de OS por dia (últimos 30 dias).

**Por quê:** visão de negócio em uma tela só.

---

## Detalhes técnicos

- Mantém o padrão atual: TanStack Router + React Query + Supabase, sem auth (workshop_id fixo).
- Migrations novas: `payments`, `parts_inventory`, novos campos em `vehicles` (km_proxima_revisao, intervalo_revisao_meses) e `clients` (data_aniversario).
- PDF: `jspdf` + `jspdf-autotable` (puro client-side).
- Drag-and-drop do Kanban: `@dnd-kit/core` (leve, acessível).

---

## Sugestão de ordem de execução

```text
Sprint 1 (rápido, alto impacto):  [1] Kanban  +  [2] Pagamentos/Fiado
Sprint 2 (operação):              [3] Estoque  +  [4] Orçamento PDF
Sprint 3 (fidelização):           [5] Lembretes  +  [6] Dashboard financeiro
```

Me diga **por qual começar** (ou se quer eu já implementar a Sprint 1 inteira) que eu sigo.
