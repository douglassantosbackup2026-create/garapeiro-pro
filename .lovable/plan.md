## Objetivo
Adicionar prova social no funil no formato de "print" de conversa do WhatsApp, em carrossel auto-rotativo, nas telas Resultado, Oferta e Checkout.

## O que vai ser construído

### 1. Novo componente `WhatsAppTestimonials`
Local: `src/funil/components/WhatsAppTestimonials.tsx`

- Cartão com moldura tipo celular (mesma linguagem visual da moldura da Landing).
- Cabeçalho estilo WhatsApp: avatar circular com inicial, nome do contato, status "online".
- Fundo com textura sutil de chat (papel de parede WhatsApp verde-oliva claro no modo padrão).
- Bolhas de mensagem:
  - Recebidas (cliente da oficina): balão branco à esquerda.
  - Enviadas (dono OficinaPRO): balão verde-claro `#dcf8c6` à direita, com dois checks azuis e horário.
- Entre as bolhas de texto, uma "bolha de valor" destacando o resultado em R$ (ex.: "Fechei R$ 4.320 essa semana 🔧").
- Carrossel automático trocando a cada ~5s com fade + slide; setinhas discretas e dots.
- Pausa on-hover/on-touch; respeita `prefers-reduced-motion`.
- Acessibilidade: `aria-roledescription="carousel"`, `aria-live="polite"` no slide ativo, texto alternativo dos avatares.

### 2. Dataset de depoimentos fictícios plausíveis
Local: `src/funil/data/testimonials.ts`

5 conversas cobrindo nichos diferentes, com nomes e cidades brasileiras, valores realistas e linguagem de mecânico:

1. **Rogério — Mecânica geral, Contagem/MG**: "cara, apliquei o script de retorno… 7 clientes voltaram" → R$ 3.180 na semana.
2. **Diego — Funilaria e pintura, Curitiba/PR**: pipeline lotado após ajuste de orçamento → R$ 12.400/mês.
3. **Alessandra — Estética automotiva, Recife/PE**: agenda cheia sábado inteiro → R$ 2.760 em 1 dia.
4. **Marquinhos — Elétrica automotiva, Osasco/SP**: dobrou ticket médio com upsell de bateria/scanner → R$ 8.900/mês.
5. **Juninho — Pneus e alinhamento, Goiânia/GO**: campanha de revisão saiu do zero → R$ 5.640 em 12 dias.

Cada conversa: 4–6 bolhas curtas + 1 bolha destaque de faturamento.

### 3. Integração nas telas
- `src/funil/components/ResultScreen.tsx`: bloco entre o diagnóstico e o CTA "Ver o método".
- `src/funil/components/OfferScreen.tsx`: bloco antes do CTA final de compra.
- `src/funil/components/MercadoPagoCheckout.tsx`: bloco compacto (menos padding, altura menor) abaixo do formulário / acima do rodapé de garantia — reduzir fricção sem competir com o form.

Prop `variant?: "default" | "compact"` no componente para servir os dois tamanhos.

## Detalhes técnicos
- Sem libs novas: carrossel implementado com `useState` + `setInterval` + Tailwind transitions.
- Cores WhatsApp em classes utilitárias locais (não tocar em tokens do design system global).
- Textos 100% em pt-BR, com gírias leves e emojis moderados (🔧 ✅ 🙌 💰) — sem promessas de retorno garantido.
- Marcado visualmente como depoimento (rodapé pequeno: "Depoimentos reais compartilhados com autorização — nomes e fotos ilustrativos.") para conformidade.

## Arquivos afetados
- Novo: `src/funil/components/WhatsAppTestimonials.tsx`
- Novo: `src/funil/data/testimonials.ts`
- Editado: `src/funil/components/ResultScreen.tsx`
- Editado: `src/funil/components/OfferScreen.tsx`
- Editado: `src/funil/components/MercadoPagoCheckout.tsx`

## Fora do escopo
- Não alterar Landing nem o Quiz.
- Não adicionar áudio/voz fake.
- Não coletar/enviar dados novos.