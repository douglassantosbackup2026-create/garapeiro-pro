## Adaptação do Meta Pixel

O script JS já está implementado em `src/funil/lib/metaPixel.ts` com o mesmo ID `4269485799969770` e é inicializado globalmente no `src/main.tsx` (dispara `init` + `PageView`). Ou seja, a parte `<script>` do snippet já está coberta.

O que falta do snippet oficial é apenas o fallback `<noscript>` com a imagem de tracking, para usuários com JavaScript desabilitado.

### Mudança

**`index.html`** — adicionar o fallback `<noscript>` dentro do `<body>` (não no `<head>`, conforme regra do HTML5 do projeto), logo após a abertura do `<body>`:

```html
<noscript>
  <img
    height="1"
    width="1"
    style="display:none"
    src="https://www.facebook.com/tr?id=4269485799969770&ev=PageView&noscript=1"
    alt=""
  />
</noscript>
```

### Notas técnicas

- Não é preciso duplicar o `<script>` inline — o `initMetaPixel()` em `src/main.tsx` já roda em todas as rotas e faz exatamente o que o snippet oficial faz.
- A CSP em `public/_headers` e `vercel.json` já permite `img-src https://www.facebook.com`, então o pixel `<img>` do noscript carrega sem ajuste adicional.
- Nenhuma outra alteração necessária (CAPI, eventos Lead/Purchase e demais integrações permanecem como estão).
