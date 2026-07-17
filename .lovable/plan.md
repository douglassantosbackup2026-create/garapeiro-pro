## Diagnóstico

O erro continua no domínio publicado porque as Edge Functions estão rejeitando a origem `https://oficinapro.life`.

Teste direto nas funções retornou:

```text
403 {"error":"Origin not allowed"}
```

Isso confirma que o problema atual não é mais o preview, nem o Mercado Pago em si: é a allowlist de CORS/origem para o domínio oficial.

## Plano

1. Atualizar o CORS das funções usadas no checkout:
   - `funil-api`
   - `mercado-pago`

2. Garantir que estes domínios sejam sempre aceitos, mesmo se o segredo `ALLOWED_ORIGINS` estiver incompleto:
   - `https://oficinapro.life`
   - `https://www.oficinapro.life`
   - previews Lovable já liberados: `*.lovableproject.com`, `*.lovable.app`, `*.lovable.dev`

3. Manter o `ALLOWED_ORIGINS` como allowlist adicional, sem depender exclusivamente dele.

4. Redeploy das Edge Functions alteradas.

5. Validar com chamada real usando `Origin: https://oficinapro.life` para confirmar resposta `200` antes de você testar novamente no checkout.

## Arquivos envolvidos

- `supabase/functions/funil-api/index.ts`
- `supabase/functions/mercado-pago/index.ts`

## Resultado esperado

O checkout em `https://oficinapro.life/quiz?step=checkout` deve parar de exibir “Failed to send a request to the Edge Function” nas chamadas de lead/checkout.