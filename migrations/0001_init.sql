-- BinBase Ultimate BIN Database (2026 Sample Edition) Schema
-- Optimized for Cloudflare D1 (SQLite) and descending waterfall BIN lookups (11 -> 10 -> 9 -> 8 -> 6)

DROP TABLE IF EXISTS bins;

CREATE TABLE bins (
  bin TEXT PRIMARY KEY,
  bin_length INTEGER NOT NULL,
  brand TEXT NOT NULL,
  bank TEXT,
  type TEXT,
  category TEXT,
  country TEXT,
  iso2 TEXT,
  iso3 TEXT,
  iso_num INTEGER,
  web TEXT,
  phone TEXT,
  pan_len INTEGER NOT NULL,
  segment TEXT,
  regulated INTEGER NOT NULL DEFAULT 0,
  debit_network TEXT,
  atm_network TEXT,
  comm_l2 INTEGER NOT NULL DEFAULT 0,
  comm_l3 INTEGER NOT NULL DEFAULT 0,
  ff_dom INTEGER NOT NULL DEFAULT 0,
  ff_cross INTEGER NOT NULL DEFAULT 0,
  ms_ind INTEGER NOT NULL DEFAULT 0,
  push_dom INTEGER NOT NULL DEFAULT 0,
  push_cross INTEGER NOT NULL DEFAULT 0,
  mt_ind INTEGER NOT NULL DEFAULT 0,
  og_ff_dom INTEGER NOT NULL DEFAULT 0,
  og_ff_cross INTEGER NOT NULL DEFAULT 0,
  pull_dom INTEGER NOT NULL DEFAULT 0,
  token INTEGER NOT NULL DEFAULT 0,
  currency TEXT,
  currency_raw TEXT
);

CREATE INDEX idx_bins_brand ON bins(brand);
CREATE INDEX idx_bins_iso2 ON bins(iso2);
CREATE INDEX idx_bins_type ON bins(type);
CREATE INDEX idx_bins_segment ON bins(segment);
CREATE INDEX idx_bins_bin_length ON bins(bin_length);
CREATE INDEX idx_bins_currency ON bins(currency);
CREATE INDEX idx_bins_bank ON bins(bank);
