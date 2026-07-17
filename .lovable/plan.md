## Objetivo
Reescrever a copy do funil (Landing + Quiz + Resultado) usando a estrutura Halbert/Clayton que você trouxe, mantendo a mecânica atual (6→8 perguntas, tela de resultado, oferta). Nada de backend/auth — só copy e estrutura de perguntas.

## O que muda

### 1. Landing (`src/funil/components/Landing.tsx`)
- **Headline nova**: "Descubra por que algumas oficinas fazem R$20.000/mês… enquanto outras mal conseguem clientes — e como mudar isso em até 30 dias."
- **Subhead**: "Mesmo que você esteja começando do zero, sem equipe e sem gastar com anúncios caros."
- **Abertura curta** (Halbert): 2 parágrafos com a pergunta "Por que alguns mecânicos vivem cheios… enquanto outros ficam olhando o portão vazio?" + "Não é sorte. Não é localização. Não é ter o melhor serviço."
- **Big Idea** em destaque: "Existe um sistema previsível que transforma qualquer oficina comum em uma máquina de atrair clientes."
- **Agitação** em bullets: depende de indicação / perde clientes sem perceber / não atrai novos / "e acha que isso é normal".
- **Promessa** em 3 bullets: atrair novos todo dia / trazer antigos de volta / fluxo constante de faturamento.
- **CTA**: "Descubra em 60 segundos quanto sua oficina poderia faturar — teste gratuito".
- Mantém: nichos, mock do celular com notificações, selos de garantia, footer.

### 2. Perguntas do quiz (`src/funil/data/questions.ts`)
Passa de 6 para 8 perguntas. Mantenho o tipo `Question`/`AnswerOption` e o campo `score` (0/1/2) para não quebrar `ResultScreen`/`profiles`.

1. **q1 — Aquisição (volume)**: "Quantos clientes novos sua oficina recebe por semana?" — Nenhum(0) / 1–5(1) / 5–10(2) / +10(2).
2. **q2 — Previsibilidade**: "Você tem um método previsível para atrair novos clientes?" — Sim(2) / Mais ou menos(1) / Não(0).
3. **q3 — Perda**: "Quantos clientes você perdeu nos últimos 3 meses?" — Muitos(0) / Alguns(1) / Não sei(0) / Nenhum(2).
4. **q4 — Recuperação**: "Você faz algo para trazer clientes antigos de volta?" — Sempre(2) / Às vezes(1) / Nunca(0).
5. **q5 — Faturamento**: "Seu faturamento hoje está mais próximo de:" — até R$2k(0) / R$2–5k(1) / R$5–10k(1) / R$10k+(2).
6. **q6 — Consciência**: "Você acredita que poderia faturar mais se tivesse mais clientes?" — Sim(2) / Talvez(1) / Não sei(0).
7. **q7 — Bloqueio**: "O que mais te impede hoje?" — Clientes(0) / Tempo(1) / Estratégia(0) / Dinheiro(1).
8. **q8 — Pré-venda**: "Se existisse um método simples pra trazer clientes todos os dias, você aplicaria?" — Sim(2) / Talvez(1) / Não(0).

Categorias mapeadas para as existentes (`clientes`, `orcamentos`→troco por `clientes`/`retorno` conforme faz sentido, `ticket`, `retorno`, `organizacao`, `tempo`). Verifico `profiles.ts`/`ResultScreen` para garantir que o cálculo de perfil continue funcionando com 8 questões — se depender do id específico, ajusto o mapeamento de categorias sem mudar a lógica.

### 3. Tela de resultado (`src/funil/components/ResultScreen.tsx`)
- Headline: "Seu diagnóstico: você está deixando dinheiro na mesa todos os dias."
- Copy Halbert+Clayton: "Sua oficina tem potencial para faturar entre R$5.000 e R$20.000/mês, mas hoje está travada por: aquisição não previsível / perda de clientes / falta de sistema."
- Transição: "A boa notícia? Isso não depende de sorte nem de investimento alto."
- Bridge para a oferta atual (`OfferScreen`): "Por isso criamos o Método Oficina PRO."
- Mantém CTA existente para checkout — não mexo em preços nem no fluxo de pagamento.

### 4. Modais de transição (`PhaseUnlockModal`, `DecisionMomentModal`)
Só ajusto microcopy para bater com o novo tom ("Você está prestes a descobrir quanto está perdendo…") — sem mudança estrutural.

## Fora de escopo
- Cálculo de perfil / oferta / preços / checkout.
- Meta Pixel, storage do funil, auth.
- Nova arte / imagens.

## Detalhes técnicos
- `questions.ts`: adicionar 2 novas questões exige revisar `src/funil/data/profiles.ts` e `ResultScreen.tsx` para não quebrar leitura por `id`. Se o cálculo somar `score` por categoria, o novo set continua compatível; se depender de `q1..q6` hardcoded, ajusto para iterar sobre `questions`.
- Progresso do quiz (`QuizShell`) já usa `questions.length`, então passa a 8 automaticamente.
- Sem migrations, sem edge functions.

## Entrega
Copy pronta para rodar tráfego pago, com o quiz agitando dor em cada pergunta e a tela de resultado servindo de ponte para a oferta atual.
