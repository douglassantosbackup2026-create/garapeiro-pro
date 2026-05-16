# MecânicoPRO

Sistema de gestão para oficinas mecânicas: ordens de serviço, clientes, veículos, estoque, financeiro e alertas com integração WhatsApp.

## Requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) com projeto criado

## Configuração local

1. Clone o repositório e instale dependências:

```bash
npm install
```

2. Copie as variáveis de ambiente:

```bash
cp .env.example .env
```

Preencha com as credenciais do painel Supabase (Settings → API).

3. Aplique as migrações no Supabase:

```bash
npx supabase db push
```

4. Faça o deploy das Edge Functions:

```bash
npx supabase functions deploy workshop-api
```

5. No Supabase Auth, configure:

- **Site URL:** `http://localhost:5173` (dev) ou URL de produção
- **Redirect URLs:** `https://seu-dominio.com/reset-password`, rotas `/convite/*`

6. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run build` | Build de produção (SPA estático em `dist/`) |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

## Deploy (SPA estático)

```bash
npm run build
```

A pasta `dist/` gerada pode ser publicada em qualquer host estático: Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.

As operações admin (criar oficina, convites, time) rodam como **Supabase Edge Functions** — sem servidor próprio necessário.

## Stack

- React 19 + TanStack Router + TanStack Query
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Tailwind CSS 4 + shadcn/ui
- Vite (SPA estático)
