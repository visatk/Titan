import type { BinRecord, BinRow, LookupResult, SearchFilters } from './types'

const WATERFALL_LENGTHS = [11, 10, 9, 8, 6] as const
const MAX_SQL_PARAMS = 80

function parseNetworks(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function formatBinRecord(row: BinRow): BinRecord {
  return {
    bin: row.bin,
    bin_length: row.bin_length,
    brand: row.brand,
    type: row.type,
    category: row.category,
    segment: row.segment,
    pan_length: row.pan_len,
    currency: row.currency,
    currency_raw: row.currency_raw,
    regulated: row.regulated === 1,
    issuer: {
      name: row.bank,
      website: row.web,
      phone: row.phone,
    },
    country: {
      name: row.country,
      iso2: row.iso2,
      iso3: row.iso3,
      iso_numeric: row.iso_num,
    },
    networks: {
      debit: parseNetworks(row.debit_network),
      atm: parseNetworks(row.atm_network),
    },
    capabilities: {
      commercial_l2: row.comm_l2 === 1,
      commercial_l3: row.comm_l3 === 1,
      fast_funds_domestic: row.ff_dom === 1,
      fast_funds_cross_border: row.ff_cross === 1,
      mastercard_moneysend: row.ms_ind === 1,
      push_funds_domestic: row.push_dom === 1,
      push_funds_cross_border: row.push_cross === 1,
      visa_money_transfer: row.mt_ind === 1,
      online_gambling_ff_domestic: row.og_ff_dom === 1,
      online_gambling_ff_cross_border: row.og_ff_cross === 1,
      pull_domestic: row.pull_dom === 1,
      tokenized: row.token === 1,
    },
  }
}

export function extractWaterfallPrefixes(rawInput: string): {
  sanitized: string
  prefixes: string[]
} | null {
  const sanitized = rawInput.replace(/\D/g, '')
  if (sanitized.length < 6) {
    return null
  }
  const head = sanitized.slice(0, 11)
  const prefixes = WATERFALL_LENGTHS.filter((len) => head.length >= len).map((len) =>
    head.slice(0, len)
  )
  return { sanitized, prefixes }
}

function buildLookupResult(
  rawInput: string,
  sanitized: string,
  prefixes: string[],
  row: BinRow | null
): LookupResult {
  const isFullPan = sanitized.length >= 12
  return {
    query: rawInput,
    sanitized_digits: sanitized,
    checked_prefixes: prefixes,
    matched: row !== null,
    matched_bin: row ? row.bin : null,
    matched_length: row ? row.bin_length : null,
    pan_length_valid: row && isFullPan ? sanitized.length === row.pan_len : null,
    record: row ? formatBinRecord(row) : null,
  }
}

export async function lookupSingleBin(db: D1Database, rawInput: string): Promise<LookupResult | null> {
  const parsed = extractWaterfallPrefixes(rawInput)
  if (!parsed) return null

  const { sanitized, prefixes } = parsed
  const placeholders = prefixes.map(() => '?').join(', ')
  const sql = `SELECT * FROM bins WHERE bin IN (${placeholders}) ORDER BY bin_length DESC LIMIT 1`
  const row = await db.prepare(sql).bind(...prefixes).first<BinRow>()

  return buildLookupResult(rawInput, sanitized, prefixes, row ?? null)
}

export async function lookupBatchBins(
  db: D1Database,
  inputs: string[]
): Promise<{ results: LookupResult[]; invalid: string[] }> {
  const invalid: string[] = []
  const parsedInputs: Array<{ raw: string; sanitized: string; prefixes: string[] }> = []
  const uniquePrefixes = new Set<string>()

  for (const raw of inputs) {
    const parsed = extractWaterfallPrefixes(raw)
    if (!parsed) {
      invalid.push(raw)
      continue
    }
    parsedInputs.push({ raw, ...parsed })
    for (const prefix of parsed.prefixes) {
      uniquePrefixes.add(prefix)
    }
  }

  const matchedByBin = new Map<string, BinRow>()
  const prefixList = Array.from(uniquePrefixes)

  for (let i = 0; i < prefixList.length; i += MAX_SQL_PARAMS) {
    const chunk = prefixList.slice(i, i + MAX_SQL_PARAMS)
    const placeholders = chunk.map(() => '?').join(', ')
    const sql = `SELECT * FROM bins WHERE bin IN (${placeholders})`
    const { results } = await db.prepare(sql).bind(...chunk).all<BinRow>()
    for (const row of results) {
      matchedByBin.set(row.bin, row)
    }
  }

  const results = parsedInputs.map(({ raw, sanitized, prefixes }) => {
    let bestRow: BinRow | null = null
    for (const prefix of prefixes) {
      const candidate = matchedByBin.get(prefix)
      if (candidate) {
        bestRow = candidate
        break
      }
    }
    return buildLookupResult(raw, sanitized, prefixes, bestRow)
  })

  return { results, invalid }
}

export async function searchBins(db: D1Database, filters: SearchFilters) {
  const clauses: string[] = []
  const params: Array<string | number> = []

  const addUpperEq = (col: string, val?: string) => {
    if (!val) return
    clauses.push(`UPPER(${col}) = ?`)
    params.push(val.trim().toUpperCase())
  }

  const addBoolFlag = (col: string, val?: boolean) => {
    if (val === undefined) return
    clauses.push(`${col} = ?`)
    params.push(val ? 1 : 0)
  }

  if (filters.prefix) {
    const digits = filters.prefix.replace(/\D/g, '')
    if (digits) {
      clauses.push(`bin LIKE ?`)
      params.push(`${digits}%`)
    }
  }

  addUpperEq('brand', filters.brand)
  addUpperEq('type', filters.type)
  addUpperEq('category', filters.category)
  addUpperEq('segment', filters.segment)
  addUpperEq('country', filters.country)
  addUpperEq('iso2', filters.iso2)
  addUpperEq('currency', filters.currency)

  if (filters.bank) {
    clauses.push(`UPPER(bank) LIKE ?`)
    params.push(`%${filters.bank.trim().toUpperCase()}%`)
  }

  if (filters.bin_length !== undefined) {
    clauses.push(`bin_length = ?`)
    params.push(filters.bin_length)
  }

  addBoolFlag('regulated', filters.regulated)
  addBoolFlag('ff_dom', filters.fast_funds_dom)
  addBoolFlag('ff_cross', filters.fast_funds_cross)
  addBoolFlag('push_dom', filters.push_funds)
  addBoolFlag('ms_ind', filters.moneysend)
  addBoolFlag('mt_ind', filters.visa_direct)
  addBoolFlag('token', filters.token)
  addBoolFlag('pull_dom', filters.pull_dom)
  addBoolFlag('comm_l2', filters.comm_l2)
  addBoolFlag('comm_l3', filters.comm_l3)

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  const countSql = `SELECT COUNT(*) AS total FROM bins ${whereSql}`
  const dataSql = `SELECT * FROM bins ${whereSql} ORDER BY bin ASC LIMIT ? OFFSET ?`

  const [countRes, rowsRes] = await Promise.all([
    db.prepare(countSql).bind(...params).first<{ total: number }>(),
    db.prepare(dataSql).bind(...params, filters.limit, filters.offset).all<BinRow>(),
  ])

  return {
    total: countRes?.total ?? 0,
    limit: filters.limit,
    offset: filters.offset,
    items: rowsRes.results.map(formatBinRecord),
  }
}

export async function computeStats(db: D1Database) {
  const [
    summary,
    byLength,
    byType,
    bySegment,
    topBrands,
    topCountries,
    topBanks,
    topCurrencies,
    panLengths,
  ] = await Promise.all([
    db
      .prepare(
        `SELECT
          COUNT(*) AS total_records,
          COUNT(DISTINCT brand) AS unique_brands,
          COUNT(DISTINCT bank) AS unique_banks,
          COUNT(DISTINCT country) AS unique_countries,
          COUNT(DISTINCT currency) AS unique_currencies,
          SUM(regulated) AS regulated_count,
          SUM(comm_l2) AS comm_l2_count,
          SUM(comm_l3) AS comm_l3_count,
          SUM(ff_dom) AS ff_dom_count,
          SUM(ff_cross) AS ff_cross_count,
          SUM(ms_ind) AS ms_ind_count,
          SUM(push_dom) AS push_dom_count,
          SUM(push_cross) AS push_cross_count,
          SUM(mt_ind) AS mt_ind_count,
          SUM(og_ff_dom) AS og_ff_dom_count,
          SUM(og_ff_cross) AS og_ff_cross_count,
          SUM(pull_dom) AS pull_dom_count,
          SUM(token) AS token_count
        FROM bins`
      )
      .first<Record<string, number>>(),
    db
      .prepare(`SELECT bin_length, COUNT(*) AS count FROM bins GROUP BY bin_length ORDER BY bin_length ASC`)
      .all<{ bin_length: number; count: number }>(),
    db
      .prepare(`SELECT COALESCE(type, 'UNSPECIFIED') AS type, COUNT(*) AS count FROM bins GROUP BY type ORDER BY count DESC`)
      .all<{ type: string; count: number }>(),
    db
      .prepare(`SELECT COALESCE(segment, 'UNSPECIFIED') AS segment, COUNT(*) AS count FROM bins GROUP BY segment ORDER BY count DESC`)
      .all<{ segment: string; count: number }>(),
    db
      .prepare(`SELECT brand, COUNT(*) AS count FROM bins GROUP BY brand ORDER BY count DESC LIMIT 15`)
      .all<{ brand: string; count: number }>(),
    db
      .prepare(
        `SELECT country, iso2, COUNT(*) AS count FROM bins WHERE country IS NOT NULL GROUP BY country, iso2 ORDER BY count DESC LIMIT 15`
      )
      .all<{ country: string; iso2: string | null; count: number }>(),
    db
      .prepare(
        `SELECT bank, COUNT(*) AS count FROM bins WHERE bank IS NOT NULL GROUP BY bank ORDER BY count DESC LIMIT 15`
      )
      .all<{ bank: string; count: number }>(),
    db
      .prepare(
        `SELECT currency, COUNT(*) AS count FROM bins WHERE currency IS NOT NULL GROUP BY currency ORDER BY count DESC LIMIT 15`
      )
      .all<{ currency: string; count: number }>(),
    db
      .prepare(`SELECT pan_len, COUNT(*) AS count FROM bins GROUP BY pan_len ORDER BY pan_len ASC`)
      .all<{ pan_len: number; count: number }>(),
  ])

  const total = summary?.total_records ?? 0

  return {
    total_records: total,
    unique_counts: {
      brands: summary?.unique_brands ?? 0,
      banks: summary?.unique_banks ?? 0,
      countries: summary?.unique_countries ?? 0,
      currencies: summary?.unique_currencies ?? 0,
    },
    distributions: {
      bin_length: byLength.results,
      card_type: byType.results,
      segment: bySegment.results,
      pan_length: panLengths.results,
    },
    top: {
      brands: topBrands.results,
      countries: topCountries.results,
      banks: topBanks.results,
      currencies: topCurrencies.results,
    },
    capabilities: {
      regulated: summary?.regulated_count ?? 0,
      commercial_l2: summary?.comm_l2_count ?? 0,
      commercial_l3: summary?.comm_l3_count ?? 0,
      fast_funds_domestic: summary?.ff_dom_count ?? 0,
      fast_funds_cross_border: summary?.ff_cross_count ?? 0,
      mastercard_moneysend: summary?.ms_ind_count ?? 0,
      push_funds_domestic: summary?.push_dom_count ?? 0,
      push_funds_cross_border: summary?.push_cross_count ?? 0,
      visa_money_transfer: summary?.mt_ind_count ?? 0,
      online_gambling_ff_domestic: summary?.og_ff_dom_count ?? 0,
      online_gambling_ff_cross_border: summary?.og_ff_cross_count ?? 0,
      pull_domestic: summary?.pull_dom_count ?? 0,
      tokenized: summary?.token_count ?? 0,
    },
  }
}
