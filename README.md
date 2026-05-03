# CraveCast (Smart Recipe Generator)

CraveCast is a Next.js app that generates and curates recipes using OpenAI (text + images + TTS), with Google OAuth (NextAuth), MongoDB for persistence, and Supabase Storage for media.

## Features
- AI recipe generation + optional “demo mode” fallbacks when OpenAI quota/rate limits hit
- AI image generation (or public placeholder URLs when quota is exceeded)
- Text-to-speech narration (TTS)
- Recipe browsing with search, tags, sorting, and infinite scroll
- Auth via Google OAuth (NextAuth v4)

## Tech
- Next.js 14 (pages router), React 18, TypeScript (strict)
- Tailwind CSS + Headless UI
- MongoDB (Mongoose)
- Supabase Storage (images/audio)
- OpenAI SDK

## Quickstart
```bash
npm install
docker compose up -d
npm run dev
```

By default this repo runs dev on `http://localhost:3002` (see `package.json`).

## Environment variables
Copy `.env.example` to `.env.local` and fill in values:
```bash
cp .env.example .env.local
```

Common keys:
- `MONGO_URI` (local docker compose uses `mongodb://root:123456@localhost:27018/cravecast?authSource=admin`)
- `NEXTAUTH_URL` (match your dev port)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`

## Scripts
- `npm run dev` – start dev server
- `npm run compileTS` – typecheck (includes Cypress tsconfig)
- `npm run lint` – eslint
- `npm run all_tests` – Jest test suite
- `npm run test:e2e` – Cypress E2E

## Notes / Troubleshooting
- If you see OpenAI `429` / `insufficient_quota`, the app will fall back to demo recipes/images; tags are best-effort.
- If Supabase Storage is unreachable in dev, uploads are skipped and the app uses direct image URLs instead.
