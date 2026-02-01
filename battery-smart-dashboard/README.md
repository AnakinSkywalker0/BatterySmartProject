# Battery Smart — Fleet Operations

Admin dashboard for EV fleet and battery swap station operations. Uses Next.js, Prisma (SQLite), and optional n8n/LLM integrations.

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Database (Prisma)**
   - Add to `.env`:
     ```bash
     DATABASE_URL="file:./dev.db"
     ```
   - Create schema and seed:
     ```bash
     pnpm db:push
     pnpm db:seed
     ```

3. **Optional**
   - `OPENAI_API_KEY` — for AI Copilot chat and action suggestions.
   - `N8N_WEBHOOK_URL` — for executing actions via n8n workflows.

4. **Run**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — start dev server
- `pnpm build` — Prisma generate + Next build
- `pnpm db:push` — push Prisma schema to DB (SQLite)
- `pnpm db:seed` — seed stations, alerts, metrics, action logs

## n8n

See `n8n-workflows/README.md` for importing the Battery Smart actions workflow and configuring Twilio, Jira, and inventory APIs.
