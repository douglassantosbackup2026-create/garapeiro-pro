## Problema

O checkout mostra "Failed to send a request to the Edge Function" e o console repete `FunctionsFetchError: Failed to fetch` em `funil-api` (touchLeadStep / upsertLead). Isso é bloqueio de CORS — o navegador nem consegue ler a resposta, por isso vira "Failed to fetch".

A função `supabase/functions/funil-api/index.ts` só permite:
- localhost/127.0.0.1 quando `ALLOWED_ORIGINS` não está setado, ou
- origens listadas exatamente na env `ALLOWED_ORIGINS`.

O segredo `ALLOWED_ORIGINS` **está setado** no projeto, então a lógica cai no ramo estrito. A URL de preview (`https://id-preview--d83852d3-be63-4a10-a582-778b5f6b599e.lovable.app`) provavelmente não está na lista, então o preflight OPTIONS volta sem `Access-Control-Allow-Origin` e o fetch falha.

## Correção

Ajustar `funil-api/index.ts` para, além da allowlist exata, aceitar automaticamente qualquer subdomínio `*.lovable.app` e `*.lovable.dev` (que é onde ficam preview/published/branches do Lovable), sem mexer no comportamento para o domínio final (`oficinapro.life`).

Mudanças:

1. `corsHeadersFor(req)`: se `origin` casar com `^https:\/\/[a-z0-9-]+\.lovable\.(app|dev)$`, também setar `Access-Control-Allow-Origin: <origin>`.
2. `isOriginAllowed(req)`: mesma regra — retornar `true` para subdomínios `lovable.app`/`lovable.dev`.
3. Manter `ALLOWED_ORIGINS` como allowlist adicional para o domínio custom (`oficinapro.life`, `www.oficinapro.life`).
4. Redeploy da função `funil-api`.

Nenhuma mudança de frontend, schema ou outras funções.

## Verificação

- Após redeploy, recarregar `/quiz?step=checkout` no preview: `touchLeadStep`/`upsertLead` devem responder 200 e o banner "Failed to send…" some.
- Testar também o "Continuar para o pagamento" para confirmar que `upsertLead` + criação do pedido MP fluem.

## Fora de escopo

- Não mexer em `mercado-pago` nem `workshop-api` (não aparecem no erro atual).
- Não alterar copy do funil.