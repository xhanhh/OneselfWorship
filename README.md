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
2. Paste the variables downloaded from the Vercel Supabase integration.
3. Add a Prisma Accelerate connection string as `DATABASE_URL`.
4. Add a direct Supabase connection string as `DIRECT_URL`.

```bash
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
```

5. Generate and sync Prisma schema:

```bash
pnpm prisma:generate
pnpm prisma:push
```

> This project uses Prisma Accelerate at runtime and a direct Supabase URL for Prisma CLI operations.

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
