# 祭扫自己

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# pnpm
pnpm install
```

## Environment (Vercel + Supabase Postgres)

1. Copy `example.env` to `.env.local`.
2. Fill in Supabase/Vercel provided values.
3. Ensure Prisma variables are mapped:

```bash
DATABASE_URL="$POSTGRES_PRISMA_URL"
DIRECT_URL="$POSTGRES_URL_NON_POOLING"
```

4. Generate and sync Prisma schema:

```bash
pnpm prisma:generate
pnpm prisma:push
```

> If you use Prisma migrations locally, keep `DIRECT_URL` set to a non-pooling URL.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm dev
```

## Production

Build the application for production:

```bash
# pnpm
pnpm build
```

Locally preview production build:

```bash
# pnpm
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
