# WeWIN Cambridge (Next.js monolith)

Full-stack Next.js app (IELTS/Chinese stack): App Router, Prisma 7 + Neon, Zod, signed cookie auth, Vercel.

## Quick start

```bash
cp .env.example .env
# set DATABASE_URL + SESSION_SECRET

npm install
npx prisma db push
npm run seed:admin
npm run import:curriculum   # optional — Excel in data/curriculum/
npm run dev
```

Login: `admin@wewin.local` / `change-me` (change via `ADMIN_*` env).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js turbopack |
| `npm run build` | `prisma generate && next build` |
| `npm run seed:admin` | Admin + ADMIN/TEACHER/STUDENT roles |
| `npm run import:curriculum` | Import chủ đề/tuần từ Excel + match assets |

## Legacy folders

`frontend/` and `backend/` are the previous Nest + NextAuth split — kept as reference. Primary app is the repo root (`src/`, `prisma/`).

## Deploy

Vercel (`vercel.json`, region `sin1`). Env: `DATABASE_URL`, `SESSION_SECRET`, optional Cloudinary / Groq / parent SSO.
