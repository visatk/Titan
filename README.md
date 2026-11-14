# Titan BIN Lookup API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-f38020.svg)](https://developers.cloudflare.com/d1/)
[![Hono](https://img.shields.io/badge/Hono-4.x-e36002.svg)](https://hono.dev/)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1.0-6ba539.svg)](./public/openapi.json)

An open-source, edge-ready **Bank Identification Number (BIN / IIN) Lookup API**, **Web Explorer**, and **Dataset Audit Dashboard** built with **Hono**, **Cloudflare Workers**, and **Cloudflare D1** using the [BinBase 2026 sample dataset](https://github.com/BinBaseDatabase/ultimate-bin-database-2026).

---

## Features

- **6 to 11-Digit Waterfall Lookup (`11 → 10 → 9 → 8 → 6`)**: Automatically strips formatting/non-digit characters, checks all applicable prefix lengths in descending order, preserves leading zeros (`TEXT` primary key), and validates full PAN lengths when a 12–19 digit card number is supplied.
- **Batch & Filtered Search APIs**: Look up up to 100 BINs/PANs in one request (`POST /api/lookup/batch`) or filter across 20+ attributes (`brand`, `iso2`, `type`, `segment`, `bank`, `currency`, `fast_funds_dom`, `push_funds`, `visa_direct`, `moneysend`, `token`, etc.).
- **Data Cleaning & Normalization**:
  - Restores Namibia `iso2 = "NA"` dropped as `NaN` in upstream CSV generation.
  - Normalizes 52 numeric ISO 4217 currency codes (`840`, `978`, `392`, etc.) into alpha-3 codes (`USD`, `EUR`, `JPY`) while keeping `currency_raw`.
  - Converts `0` sentinel values in `iso_num` to SQL `NULL`.
- **Interactive Web App & API Docs**:
  - `/` — Instant BIN lookup tool with card profile breakdown & live filter explorer
  - `/docs` — Interactive API documentation with live "Try It" runner, cURL/JS/Python examples, and `/openapi.json`
  - `/analytics` — Live D1 dataset statistics and README-vs-CSV audit report
  - `/bin/:pan` — SEO-friendly server-rendered BIN detail pages
- **Full Technical SEO**: Canonical URLs, Open Graph & Twitter meta tags, JSON-LD structured data (`WebApplication`, `Dataset`, `TechArticle`), `/robots.txt`, `/sitemap.xml`, and `/og-image.svg`.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize & Seed Local Cloudflare D1

```bash
npm run db:migrate:local
npm run db:seed:local
```

*(Optional)* To regenerate `seed/0001_seed_bins.sql` from a fresh CSV clone:

```bash
git clone --depth 1 https://github.com/BinBaseDatabase/ultimate-bin-database-2026.git
npm run db:seed:gen
```

### 3. Run Locally

```bash
npm run dev
```

### 4. Deploy to Cloudflare Workers + Remote D1

1. Create a remote D1 database (requires a Cloudflare API token with `Account -> D1: Edit`):
   ```bash
   npx wrangler d1 create bin-database
   ```
2. Update `database_id` in `wrangler.jsonc`.
3. Apply migrations, seed the remote database, and deploy:
   ```bash
   npm run db:migrate:remote
   npm run db:seed:remote
   npm run deploy
   ```

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and D1 record count |
| `GET` | `/api/lookup/:pan` | Waterfall BIN lookup (`11 → 10 → 9 → 8 → 6`) |
| `GET` | `/api/lookup?bin=...` | Query-string waterfall lookup (`bin` or `pan`) |
| `POST` | `/api/lookup/batch` | Batch lookup (`{"bins": [...]}` up to 100 items) |
| `GET` | `/api/bins` | Paginated search across brand, country, capabilities, etc. |
| `GET` | `/api/bins/:pan` | Alias for `/api/lookup/:pan` |
| `GET` | `/api/stats` | Live D1 aggregations (brands, countries, banks, flags) |
| `GET` | `/api/analysis` | Dataset audit, null rates, and normalization report |
| `GET` | `/openapi.json` | Machine-readable OpenAPI 3.1.0 specification |

---

## Project Structure

```text
├── migrations/0001_init.sql       # D1 schema & indexes
├── scripts/generate_seed.py       # CSV -> normalized SQL seed generator
├── seed/0001_seed_bins.sql        # 10,000 normalized BIN records
├── public/
│   ├── openapi.json               # OpenAPI 3.1.0 specification
│   └── og-image.svg               # Social preview image
├── src/
│   ├── index.tsx                  # Hono routes, SEO endpoints & SSR pages
│   ├── db.ts                      # D1 queries & waterfall lookup engine
│   ├── analysis.ts                # Live D1 dataset audit builder
│   ├── ui.tsx                     # Reusable SSR views (Home, Docs, Analytics, BIN detail)
│   ├── renderer.tsx               # SEO head tags, Open Graph & JSON-LD layout
│   ├── types.ts                   # Shared TypeScript interfaces
│   └── style.css                  # Responsive dark fintech UI styles
└── wrangler.jsonc                 # Cloudflare Workers & D1 configuration
```

---

## Contributing & License

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
Licensed under the [MIT License](./LICENSE).
