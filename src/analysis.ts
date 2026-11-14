export async function buildAnalysisReport(db: D1Database) {
  const [
    counts,
    overlapCountRow,
    namibiaRow,
    numericCurrRow,
    usRegRow,
    nonUsRegRow,
    pushIdenticalRow,
    ogIdenticalRow,
  ] = await Promise.all([
    db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN bank IS NULL THEN 1 ELSE 0 END) AS missing_bank,
          SUM(CASE WHEN type IS NULL THEN 1 ELSE 0 END) AS missing_type,
          SUM(CASE WHEN category IS NULL THEN 1 ELSE 0 END) AS missing_category,
          SUM(CASE WHEN country IS NULL THEN 1 ELSE 0 END) AS missing_country,
          SUM(CASE WHEN web IS NULL THEN 1 ELSE 0 END) AS missing_web,
          SUM(CASE WHEN phone IS NULL THEN 1 ELSE 0 END) AS missing_phone,
          SUM(CASE WHEN segment IS NULL THEN 1 ELSE 0 END) AS missing_segment,
          SUM(CASE WHEN debit_network IS NULL THEN 1 ELSE 0 END) AS missing_debit_network,
          SUM(CASE WHEN atm_network IS NULL THEN 1 ELSE 0 END) AS missing_atm_network,
          SUM(CASE WHEN currency IS NULL THEN 1 ELSE 0 END) AS missing_currency
        FROM bins`
      )
      .first<Record<string, number>>(),
    db
      .prepare(
        `SELECT COUNT(*) AS overlap_count
         FROM bins longer
         WHERE longer.bin_length > 6
           AND EXISTS (
             SELECT 1 FROM bins shorter
             WHERE shorter.bin IN (
               SUBSTR(longer.bin, 1, 6),
               SUBSTR(longer.bin, 1, 8),
               SUBSTR(longer.bin, 1, 9),
               SUBSTR(longer.bin, 1, 10)
             )
             AND shorter.bin_length < longer.bin_length
           )`
      )
      .first<{ overlap_count: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM bins WHERE country = 'NAMIBIA' AND iso2 = 'NA'`)
      .first<{ cnt: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM bins WHERE currency_raw IS NOT NULL AND currency_raw != currency`
      )
      .first<{ cnt: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS total, SUM(regulated) AS regulated FROM bins WHERE iso2 = 'US'`)
      .first<{ total: number; regulated: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS total, SUM(regulated) AS regulated FROM bins WHERE iso2 != 'US' OR iso2 IS NULL`)
      .first<{ total: number; regulated: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM bins WHERE push_dom != push_cross`)
      .first<{ cnt: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM bins WHERE og_ff_dom != og_ff_cross`)
      .first<{ cnt: number }>(),
  ])

  const total = counts?.total ?? 0

  return {
    repository: {
      url: 'https://github.com/BinBaseDatabase/ultimate-bin-database-2026',
      shipped_file: 'bin_database_sample_2026.csv',
      delimiter: ';',
      encoding: 'UTF-8 (100% ASCII content, 0 embedded newlines)',
      total_records_loaded: total,
      columns_in_csv: 29,
      columns_normalized_in_db: 31,
    },
    readme_vs_actual_discrepancies: [
      {
        topic: 'Record count',
        readme_claim: '3,294,052 records (Full Premium commercial edition)',
        actual_in_repo: `${total} records in bin_database_sample_2026.csv (Sample Edition)`,
      },
      {
        topic: 'Column count (Phase 3 fields)',
        readme_claim: '34 fields including GAMBLING_BLOCKED, DOMESTIC_ONLY, COMBO_CARD, AUTHENTICATION, COST',
        actual_in_repo: '29 fields (Phase 1 + Phase 2 only; the 5 Phase 3 fields are absent from the CSV)',
      },
      {
        topic: 'BIN precision mix',
        readme_claim: '88.6% 8-11 digit BINs in full commercial dataset',
        actual_in_repo: '86.59% 6-digit BINs (8,659) and 13.41% 8-11 digit BINs (1,341) in sample CSV',
      },
      {
        topic: 'Sample download link',
        readme_claim: 'Links ./sample_extended.csv in README table',
        actual_in_repo: 'File is named bin_database_sample_2026.csv',
      },
    ],
    data_quality_findings_and_fixes: [
      {
        issue: 'Leading-zero BIN prefixes',
        detail: 'BINs like 010309 start with 0. Stored as TEXT PRIMARY KEY to prevent numeric truncation.',
      },
      {
        issue: 'Namibia ISO-2 dropped as NaN upstream',
        detail: `3 Namibia BINs (427281, 465802, 470957) had empty iso2 in the CSV because "NA" was parsed as null. Restored iso2="NA" on ${namibiaRow?.cnt ?? 0} rows.`,
      },
      {
        issue: 'Mixed ISO 4217 alphabetic and numeric currency codes',
        detail: `${numericCurrRow?.cnt ?? 0} rows used 3-digit numeric ISO 4217 codes (e.g. 840, 978, 392) instead of alpha-3 codes (USD, EUR, JPY). Normalized into currency while preserving currency_raw.`,
      },
      {
        issue: 'Zero sentinel in iso_num',
        detail: '1,059 rows without a country used iso_num=0 in CSV; converted to SQL NULL.',
      },
      {
        issue: 'Waterfall prefix collisions',
        detail: `${overlapCountRow?.overlap_count ?? 0} longer BINs (8-11 digits) share a prefix with a shorter BIN in the dataset, requiring descending 11 -> 10 -> 9 -> 8 -> 6 lookup.`,
      },
      {
        issue: 'Identical flag pairs in sample',
        detail: `push_dom vs push_cross differences: ${pushIdenticalRow?.cnt ?? 0}; og_ff_dom vs og_ff_cross differences: ${ogIdenticalRow?.cnt ?? 0}. Both pairs are 100% identical across all ${total} sample rows.`,
      },
      {
        issue: 'Durbin regulated flag scope',
        detail: `US regulated BINs: ${usRegRow?.regulated ?? 0}/${usRegRow?.total ?? 0}; Non-US regulated BINs: ${nonUsRegRow?.regulated ?? 0}/${nonUsRegRow?.total ?? 0}.`,
      },
    ],
    null_rates: {
      bank_missing: counts?.missing_bank ?? 0,
      type_missing: counts?.missing_type ?? 0,
      category_missing: counts?.missing_category ?? 0,
      country_missing: counts?.missing_country ?? 0,
      web_missing: counts?.missing_web ?? 0,
      phone_missing: counts?.missing_phone ?? 0,
      segment_missing: counts?.missing_segment ?? 0,
      debit_network_missing: counts?.missing_debit_network ?? 0,
      atm_network_missing: counts?.missing_atm_network ?? 0,
      currency_missing: counts?.missing_currency ?? 0,
    },
  }
}
