## Objetivo
Adicionar o parâmetro `fbc` (Facebook click ID) — e o companheiro `fbp` (browser ID) — aos eventos enviados via Meta CAPI, para melhorar a qualidade da correspondência recomendada pela Meta (potencial +100% de conversões adicionais reportadas para InitiateCheckout, segundo a mensagem).

Email, telefone e external_id já são enviados hoje (com hash SHA-256 na edge function `meta-capi`). Faltam apenas `fbc` e `fbp`, que **não devem ser hasheados**.

## O que muda

### 1. `src/funil/lib/metaPixel.ts`
- Nova função utilitária `readFbCookies()` que lê `_fbc` e `_fbp` do `document.cookie`.
- Se `_fbc` não existir mas a URL atual tiver `?fbclid=...`, construir manualmente no formato oficial: `fb.1.<timestampMs>.<fbclid>` (o Pixel normalmente já grava, mas garantimos fallback para o primeiro pageview).
- `trackMetaEventDual` passa `fbc` e `fbp` dentro de `user_data` no payload enviado à edge function `meta-capi`.

### 2. `src/funil/lib/metaPixel.ts` — tipo `CapiUserData`
- Estender com `fbc?: string | null` e `fbp?: string | null`.

### 3. `supabase/functions/meta-capi/index.ts`
- Estender o tipo `Payload.user_data` com `fbc` e `fbp`.
- Ao montar `user_data` enviado à Graph API, incluir `fbc` e `fbp` **sem hashing** (a Meta exige texto puro nesses dois campos).

## O que NÃO muda
- Nenhuma UI, copy, ou fluxo de checkout.
- Hashing continua idêntico para email/phone/external_id.
- CORS, rate limiting, e assinatura de webhook permanecem.

## Como validar depois
- Abrir o funil com um link contendo `?fbclid=teste123`, avançar até InitiateCheckout, e no Gerenciador de Eventos da Meta > Test Events / Diagnóstico ver que agora aparecem `fbc` e `fbp` na lista de parâmetros recebidos, elevando o Event Match Quality.
