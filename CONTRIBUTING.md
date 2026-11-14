# Contributing to Titan BIN Database API

Thank you for your interest in contributing to **Titan BIN Database API**!

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize and seed the local Cloudflare D1 database**:
   ```bash
   npm run db:migrate:local
   npm run db:seed:local
   ```
   To regenerate `seed/0001_seed_bins.sql` from a CSV file (such as `ultimate-bin-database-2026/bin_database_sample_2026.csv`), run:
   ```bash
   python3 scripts/generate_seed.py
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build and verify**:
   ```bash
   npm run build
   ```

## Guidelines

- Keep TypeScript types strict and run `npm run cf-typegen` whenever `wrangler.jsonc` bindings change.
- Preserve leading-zero BIN prefixes (`TEXT` primary key) and descending `11 → 10 → 9 → 8 → 6` waterfall lookup semantics.
- Avoid adding external runtime dependencies unless strictly necessary so Worker bundle sizes remain minimal.
- Ensure all API endpoints remain documented in `public/openapi.json` and on `/docs`.
