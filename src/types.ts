export interface BinRow {
  bin: string
  bin_length: number
  brand: string
  bank: string | null
  type: string | null
  category: string | null
  country: string | null
  iso2: string | null
  iso3: string | null
  iso_num: number | null
  web: string | null
  phone: string | null
  pan_len: number
  segment: string | null
  regulated: number
  debit_network: string | null
  atm_network: string | null
  comm_l2: number
  comm_l3: number
  ff_dom: number
  ff_cross: number
  ms_ind: number
  push_dom: number
  push_cross: number
  mt_ind: number
  og_ff_dom: number
  og_ff_cross: number
  pull_dom: number
  token: number
  currency: string | null
  currency_raw: string | null
}

export interface BinRecord {
  bin: string
  bin_length: number
  brand: string
  type: string | null
  category: string | null
  segment: string | null
  pan_length: number
  currency: string | null
  currency_raw: string | null
  regulated: boolean
  issuer: {
    name: string | null
    website: string | null
    phone: string | null
  }
  country: {
    name: string | null
    iso2: string | null
    iso3: string | null
    iso_numeric: number | null
  }
  networks: {
    debit: string[]
    atm: string[]
  }
  capabilities: {
    commercial_l2: boolean
    commercial_l3: boolean
    fast_funds_domestic: boolean
    fast_funds_cross_border: boolean
    mastercard_moneysend: boolean
    push_funds_domestic: boolean
    push_funds_cross_border: boolean
    visa_money_transfer: boolean
    online_gambling_ff_domestic: boolean
    online_gambling_ff_cross_border: boolean
    pull_domestic: boolean
    tokenized: boolean
  }
}

export interface LookupResult {
  query: string
  sanitized_digits: string
  checked_prefixes: string[]
  matched: boolean
  matched_bin: string | null
  matched_length: number | null
  pan_length_valid: boolean | null
  record: BinRecord | null
}

export interface SearchFilters {
  prefix?: string
  brand?: string
  type?: string
  category?: string
  segment?: string
  country?: string
  iso2?: string
  bank?: string
  currency?: string
  bin_length?: number
  regulated?: boolean
  fast_funds_dom?: boolean
  fast_funds_cross?: boolean
  push_funds?: boolean
  moneysend?: boolean
  visa_direct?: boolean
  token?: boolean
  pull_dom?: boolean
  comm_l2?: boolean
  comm_l3?: boolean
  limit: number
  offset: number
}
