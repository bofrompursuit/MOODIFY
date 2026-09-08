# MOODIFY

AI mood board generator. Describe a vibe, get a curated, drag-to-reorder
mood board pulled from stock photos, live web discovery, and custom AI
imagery — exportable as a PNG.

## Flow

1. **Brief input** — a dark-mode search box with preset chips (Cyberpunk
   Editorial, Scandinavian Interior, etc). Submitting a brief calls
   `POST /api/mood-board`.
2. **Keyword extraction** — `src/lib/extractKeywords.ts` sends the brief to
   Claude to get `{ stock_keywords, baseten_prompt, nimble_search_query }`.
   Without `ANTHROPIC_API_KEY`, a local heuristic extractor stands in so the
   rest of the pipeline still runs.
3. **Multi-source fetch** — `src/lib/aggregate.ts` fans out to Unsplash,
   Pexels, and Nimble in parallel, de-dupes, and returns up to 16 tiles.
4. **Masonry board** — `MoodBoardGrid` renders a 4-column, drag-and-drop
   reorderable grid (`@hello-pangea/dnd` + `framer-motion`). Each tile has a
   regenerate menu to re-source it from any of the four providers
   individually via `POST /api/regenerate-tile`.
5. **Export** — `ExportButton` rasterizes the board to a PNG with
   `html-to-image`.
6. **CRM sync** — every generation is best-effort logged to a Salesforce
   `Mood_Board__c` record (`src/lib/salesforce.ts`) when creds are present;
   otherwise it just logs locally and the request still succeeds.

The `/api/status` endpoint (surfaced as pills under the title) reports which
integrations are actually live vs. running on their fallback.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in whatever keys you have
npm run dev
```

The app is fully functional with **zero** keys configured — every
integration degrades gracefully. See `.env.example` for what each key
unlocks, and notes on where Baseten's and Nimble's endpoints are
account/deployment-specific and may need adjusting from your dashboard.

## Deploy

Standard Next.js app, deployed on Vercel. Push env vars via `vercel env add`
or the dashboard, matching `.env.example`.
