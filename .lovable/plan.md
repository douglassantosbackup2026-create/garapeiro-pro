## Upload de logo da oficina

Adicionar à tela **Configurações** um card "Logo da oficina" que permite enviar, visualizar e remover o logo, salvo no bucket público `workshop-logos` (já existente) e referenciado em `workshops.logo_url` (coluna já existente).

### Onde aparece
- **Configurações** (`/configuracoes`): novo card no topo, com preview circular, botão "Enviar logo" e botão "Remover".
- **AppLayout** (sidebar desktop + topo mobile): exibir o logo ao lado do nome da oficina quando `workshop.logo_url` existir; caso contrário, manter o ícone padrão atual.

### Fluxo de upload
1. Usuário escolhe arquivo (PNG, JPG ou WEBP, até 2 MB).
2. Validação de tipo e tamanho no cliente; toast de erro se inválido.
3. Upload para `workshop-logos/{workshop_id}/logo-{timestamp}.{ext}` com `upsert: true`.
4. `getPublicUrl` → salvar em `workshops.logo_url` via `useUpdateWorkshop`.
5. Invalida cache `["workshop"]` → preview e sidebar atualizam imediatamente.
6. Ao remover: `supabase.storage.remove([path])` + `update({ logo_url: null })`.

### Detalhes técnicos
- Novo hook `useUploadLogo` em `src/hooks/useWorkshop.ts` encapsulando upload + update + invalidate.
- Card com estados: vazio (placeholder + botão), carregando (spinner no botão), com logo (preview 96px + trocar/remover).
- Sem mudanças no banco — bucket e coluna já existem; políticas públicas de insert/update/delete já estão configuradas.

### Arquivos afetados
- `src/hooks/useWorkshop.ts` — adicionar `useUploadLogo` e `useRemoveLogo`.
- `src/routes/configuracoes.tsx` — novo card Logo no topo.
- `src/components/AppLayout.tsx` — exibir `logo_url` quando disponível.