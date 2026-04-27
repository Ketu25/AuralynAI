# Auralyn — period tracker (web)

## Run locally

```bash
cp .env.example .env
# Set AUTH_SECRET to a long random string, e.g. openssl rand -base64 32
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account, complete onboarding, then log periods from the dashboard.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Auth.js (NextAuth v5) with credentials + bcrypt
- Prisma 6 + SQLite by default (`DATABASE_URL=file:./dev.db`)

For production, point `DATABASE_URL` at PostgreSQL and run migrations against that database.

## Product note

All predictions and phase content are **estimates** for wellness support, not medical advice. See in-app disclaimers and `/legal/*`.
