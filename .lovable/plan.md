## Objetivo

Deixar o fluxo de autenticação por e-mail/senha 100% funcional (login, cadastro, confirmação de e-mail, redirect pós-login) e destravar o build.

## 1. Corrigir erros de build (bloqueadores)

**a) `package.json` — script `build:dev` ausente**
O deploy roda `npm run build:dev` e falha. Adicionar:
```json
"build:dev": "vite build --mode development"
```

**b) `src/funil/lib/storage.ts` — TS2367 (linhas 60-61)**
O tipo `FunnelPersisted.version` é literal `3`, então comparar com `2` é erro de tipo. Fazer o parse como `unknown` e validar a versão numericamente:
```ts
const data = JSON.parse(raw) as FunnelPersisted & { version: number };
if (!data || (data.version !== 2 && data.version !== 3)) return null;
if (data.version === 2) { ... }
```

## 2. Ajustes no fluxo de autenticação e-mail/senha

**a) `src/routes/cadastro.tsx`**
- Tratar erro `User already registered` com mensagem clara em PT-BR e link para `/login`.
- Tratar `Password should be at least 6 characters` / senha fraca com mensagem PT-BR.
- Após signUp sem sessão (confirmação obrigatória) já mostra tela "Confirme seu e-mail" — manter, mas adicionar botão "Reenviar e-mail" chamando `supabase.auth.resend({ type: "signup", email })`.

**b) `src/routes/login.tsx`**
- Já trata `Invalid login credentials` e `Email not confirmed`. Adicionar botão "Reenviar e-mail de confirmação" quando o erro for `Email not confirmed`.
- Traduzir demais erros comuns (`Too many requests`, `User not found`).

**c) `src/routes/recuperar-senha.tsx` e `src/routes/reset-password.tsx`**
- Verificar rapidamente que `resetPasswordForEmail` usa `redirectTo: ${origin}/reset-password` e que `reset-password` lida com `type=recovery`. Ajustar se estiver divergente.

**d) `useAuth.tsx`**
- Nenhuma alteração estrutural. Sessão já persiste via `localStorage` + `onAuthStateChange`.

## 3. Configuração Supabase (ação do usuário, fora do código)

Depois do deploy, no painel Supabase → Authentication → URL Configuration:
- **Site URL**: `https://oficina-pro26.lovable.app`
- **Redirect URLs**: adicionar
  - `https://oficina-pro26.lovable.app/**`
  - `https://id-preview--d83852d3-be63-4a10-a582-778b5f6b599e.lovable.app/**`
  - `http://localhost:8080/**`

Isso é o que geralmente causa "link de confirmação inválido" ou redirect quebrado após clicar no e-mail. Vou listar isso ao final para você aplicar.

## 4. Fora do escopo

- OAuth social (Google/Facebook/Apple) — não pediu.
- Templates customizados de e-mail com domínio próprio — não pediu.
- Mudança de arquitetura (roles, RLS) — já auditado e OK.

## Arquivos alterados

- `package.json`
- `src/funil/lib/storage.ts`
- `src/routes/cadastro.tsx`
- `src/routes/login.tsx`
- `src/routes/recuperar-senha.tsx` e `src/routes/reset-password.tsx` (só se divergentes)
