# Kinlot

A peer-to-peer parking spot marketplace: list your driveway or parking spot, and let others find and reserve it on a map.

**Live demo:** https://park-me2.vercel.app

## Background

This is an experiment in resurrecting an undergrad project as something actually hosted on the web.

The original [ParkMe](https://github.com/ParkMeCSE115a/parkme) was built for CSE 115A (Software Methodology) at UC Santa Cruz by Joseph, Maxim, Alper, Neel, and Soren. It let users find and reserve available parking spots near them, with spot owners listing their own spaces. It worked — but only if you cloned the repo, installed Flutter and Xcode/Android Studio, spun up Postgres in Docker, filled in two `.env` files and a Google Maps API key, and ran the backend and mobile app side by side. Nobody could just *visit* it.

Kinlot is the same idea rebuilt in its simplest form as a single deployable web app, so there's a URL anyone can open.

## How this version differs from the original

| | Original ParkMe (2023) | Kinlot |
|---|---|---|
| Frontend | Flutter mobile app (iOS/Android) | Next.js web app, responsive |
| Backend | Separate Node/tsoa/Express API | Next.js API routes, same repo |
| Database | Postgres in local Docker | Postgres on Neon (hosted, free tier) |
| Maps | Google Maps APIs (key required) | Leaflet + OpenStreetMap (no key) |
| Payments | Planned in-app payment details | Honor system — "did you pay?" confirmation |
| Hosting | None — local only | Vercel, auto-deploys on push |

Same core data model as the original (accounts, spots, rentals), minus the parts that kept it from shipping: no image uploads, no Google Cloud Storage, no native mobile builds.

## Local dev

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Demo account

`npm run seed` creates `demo@parkme2.app` / `demo12345` with two sample listings, so "My spots" isn't empty when exploring the app. It's a public demo login, not a real user.

## Deployment

Deploys automatically on push to `main`. Vercel's free tier can't build from org-owned repos, so it builds from the [iamsorenl/kinlot](https://github.com/iamsorenl/kinlot) mirror — `origin` has both push URLs, so a single `git push` updates the org repo and the mirror together.
