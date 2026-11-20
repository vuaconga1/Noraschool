# Legacy split stack

The previous architecture lived in:

- `frontend/` — Next.js 16 + NextAuth proxying Nest JWT
- `backend/` — NestJS 11 + TypeORM (Railway Docker)

The canonical app is now the **repo root** monolith (`src/`, `prisma/`, `package.json`). Keep these folders only as reference until you are confident cutover is done, then delete them.

Primary deploy: **Vercel** via root `vercel.json`. Root `Dockerfile` / `railway.toml` targeted the Nest API and are obsolete for the monolith.
