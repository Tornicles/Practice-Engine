# Practice Engine OS

Coach-facing operating system with **7 working dashboards**. Internal engines stay in compute — they are not left-menu items.

| Area | What the coach does |
|---|---|
| Home | Command center: next action, flywheel health, evidence, commercial gate |
| Development | Practice, assessments, experience, expertise, methodology, improve |
| Clients | Live delivery, follow-ups, capture from real sessions |
| Content | Ideas, create, brand, offers, courses, intelligence |
| Messages | Inbox across channels |
| Help | Product support |
| Settings | Profile, notifications, data |

Methodology stays ahead of commercial work. AI drafts only. Evidence lineage is required before reuse.

This package is independent of the Replit web app, API server, and mobile app under `artifacts/`. Those stay as they are.

## Run

```bash
cd os
npm install
npm run dev
```

AI features (practice client, experience extract, draft replies, help) use `XAI_API_KEY` on the server. Without it, those actions degrade gracefully.

Demo state persists in `localStorage` (`practice-engine-v3`). Reset from Settings → Data.
