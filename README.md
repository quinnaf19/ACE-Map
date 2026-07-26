# Manhattan ACE Violation Explorer

An interactive Leaflet map of **765,297 issued NYC Automated Camera Enforcement
(ACE) violations in Manhattan**, covering June 20, 2024 through June 15, 2026.

The application maps aggregated stop/intersection totals rather than rendering
hundreds of thousands of overlapping individual markers. The issued-violation
totals remain exact and can be filtered by bus route, standardized stop name,
and NYC Department of City Planning 2020 Neighborhood Tabulation Area (NTA).

## Run in VS Code

1. Open this folder in VS Code.
2. Open the integrated terminal.
3. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

4. Open the local address printed in the terminal, normally
   `http://localhost:3000`.

Create a production build with:

```bash
npm run build
npm run start
```

Node.js 22.13 or newer is required. The basemap uses OpenStreetMap tiles, so an
internet connection is needed while viewing the map.

## Data files

- `public/data/stops.json`: issued violations aggregated by route,
  standardized stop/intersection, and NTA.
- `public/data/manhattan-ntas.geojson`: Manhattan 2020 NTA boundaries.

The source analysis retained only coordinate-confirmed Manhattan records and
excluded records dated before the supplied route implementation date. Stop
labels standardize punctuation, common street suffixes, and reversed
intersection order.

Neighborhood source: NYC Department of City Planning 2020 NTAs.
https://www.nyc.gov/content/planning/pages/resources/datasets/neighborhood-tabulation

## Main application files

- `app/MapExplorer.tsx`: filters, map layers, aggregation, and interactions.
- `app/globals.css`: responsive layout and styling.
- `app/page.tsx`: page entry point.

This is a descriptive visualization. It does not estimate ACE's causal effects
or the underlying prevalence of bus-lane obstruction.

## Deploy with Cloudflare Workers Builds

This project produces a Cloudflare Worker plus static assets. Connect it under
**Workers & Pages → Create → Import a repository**, and choose a **Worker**
deployment rather than a static Pages deployment.

Use these build settings:

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node version: `22.16.0` (also pinned in `.node-version`)

Do not enter a Pages output directory such as `.next`, `out`, or `dist/client`.
The Vinext build creates `.wrangler/deploy/config.json`, which directs Wrangler
to the generated Worker and its static assets.

If the repository is nested inside another repository, set Cloudflare's root
directory to the folder that directly contains this `package.json`.
