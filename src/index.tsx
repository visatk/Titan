import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { buildAnalysisReport } from './analysis'
import {
  computeStats,
  lookupBatchBins,
  lookupSingleBin,
  searchBins,
} from './db'
import { renderer } from './renderer'
import type { SearchFilters } from './types'
import { AnalyticsPage, BinDetailPage, DocsPage, HomePage } from './ui'

type AppEnv = {
  Bindings: CloudflareBindings
}

const app = new Hono<AppEnv>()

app.use('/api/*', cors())
app.use(renderer)

function parseBoolParam(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined
  const val = raw.trim().toLowerCase()
  if (val === 'true' || val === '1' || val === 'y' || val === 'yes') return true
  if (val === 'false' || val === '0' || val === 'n' || val === 'no') return false
  return undefined
}

function parseIntParam(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const num = Number.parseInt(raw, 10)
  return Number.isFinite(num) ? num : undefined
}

function getOrigin(url: string): string {
  return new URL(url).origin
}

app.get('/', async (c) => {
  const origin = getOrigin(c.req.url)
  const [summaryRow, initialResult] = await Promise.all([
    c.env.DB.prepare(
      `SELECT
        COUNT(*) AS total,
        COUNT(DISTINCT brand) AS brands,
        COUNT(DISTINCT country) AS countries,
        COUNT(DISTINCT bank) AS banks
      FROM bins`
    ).first<{ total: number; brands: number; countries: number; banks: number }>(),
    lookupSingleBin(c.env.DB, '50612402005'),
  ])

  const summary = {
    total: summaryRow?.total ?? 0,
    brands: summaryRow?.brands ?? 0,
    countries: summaryRow?.countries ?? 0,
    banks: summaryRow?.banks ?? 0,
  }

  return c.render(<HomePage summary={summary} initialResult={initialResult} />, {
    title: 'Titan BIN Lookup API — Open-Source 6 to 11-Digit Card & Issuer Intelligence',
    description: `Free open-source BIN/IIN lookup tool and REST API covering ${summary.total.toLocaleString()} BINs across ${summary.brands} brands and ${summary.countries} countries with 11->10->9->8->6 waterfall matching.`,
    canonicalUrl: `${origin}/`,
    origin,
    activeNav: 'home',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Titan BIN Lookup API',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cloudflare Workers',
        license: 'https://opensource.org/licenses/MIT',
        url: `${origin}/`,
        description:
          'Open-source 6 to 11-digit Bank Identification Number (BIN/IIN) lookup tool, batch REST API, and issuer intelligence explorer.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does 11 -> 10 -> 9 -> 8 -> 6 waterfall BIN lookup work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Titan checks candidate prefixes in descending length order (11, 10, 9, 8, then 6 digits) so specialized sub-ranges always take precedence over broader 6-digit BINs.',
            },
          },
          {
            '@type': 'Question',
            name: 'How are leading-zero BINs and Namibia ISO codes handled?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'BINs are stored as TEXT primary keys to preserve leading zeros, Namibia ISO-2 codes dropped upstream as NaN are restored to NA, and numeric ISO 4217 currency codes are normalized to alpha-3 codes.',
            },
          },
        ],
      },
    ],
  })
})

app.get('/docs', (c) => {
  const origin = getOrigin(c.req.url)
  return c.render(<DocsPage origin={origin} />, {
    title: 'API Documentation — Titan BIN Lookup API (OpenAPI 3.1)',
    description:
      'Interactive REST API documentation, OpenAPI 3.1 schema, cURL/JavaScript/Python snippets, and live request tester for Titan BIN Lookup API.',
    canonicalUrl: `${origin}/docs`,
    origin,
    activeNav: 'docs',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Titan BIN Lookup REST API Documentation',
      description:
        'Endpoint reference, waterfall BIN lookup guide, batch queries, and filterable search specification.',
      url: `${origin}/docs`,
    },
  })
})

app.get('/analytics', async (c) => {
  const origin = getOrigin(c.req.url)
  const [stats, analysis] = await Promise.all([
    computeStats(c.env.DB),
    buildAnalysisReport(c.env.DB),
  ])

  return c.render(<AnalyticsPage stats={stats} analysis={analysis} />, {
    title: 'Dataset Audit & Live Statistics — Titan BIN Lookup API',
    description: `Live Cloudflare D1 statistics and data quality audit across ${stats.total_records.toLocaleString()} BIN records, ${stats.unique_counts.brands} brands, and ${stats.unique_counts.countries} countries.`,
    canonicalUrl: `${origin}/analytics`,
    origin,
    activeNav: 'analytics',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'BinBase 2026 Sample BIN Database (Normalized D1 Edition)',
      description:
        'Normalized 10,000-record 6 to 11-digit Bank Identification Number dataset with issuer, country, currency, and payout capability indicators.',
      license: 'https://opensource.org/licenses/MIT',
      url: `${origin}/analytics`,
    },
  })
})

app.get('/bin/:pan', async (c) => {
  const origin = getOrigin(c.req.url)
  const pan = c.req.param('pan')
  const result = await lookupSingleBin(c.env.DB, pan)

  const record = result?.record
  const title = record
    ? `BIN ${record.bin} (${record.brand}) — ${record.issuer.name ?? 'Issuer'} ${record.country.iso2 ?? ''} | Titan BIN API`
    : `BIN Lookup ${pan} | Titan BIN API`
  const description = record
    ? `BIN ${record.bin} details: ${record.brand} ${record.type ?? ''} card issued by ${record.issuer.name ?? 'undisclosed bank'} in ${record.country.name ?? 'unknown country'} (${record.currency ?? 'N/A'}).`
    : `Waterfall BIN/IIN lookup results for ${pan}.`

  if (result && !result.matched) {
    c.status(404)
  } else if (!result) {
    c.status(400)
  }

  return c.render(<BinDetailPage query={pan} result={result} />, {
    title,
    description,
    canonicalUrl: `${origin}/bin/${encodeURIComponent(record?.bin ?? pan)}`,
    origin,
    activeNav: 'bin',
  })
})

app.get('/robots.txt', (c) => {
  const origin = getOrigin(c.req.url)
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
  return c.text(body, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

app.get('/sitemap.xml', (c) => {
  const origin = getOrigin(c.req.url)
  const staticUrls = ['/', '/docs', '/analytics', '/openapi.json']
  const sampleBins = [
    '/bin/50612402005',
    '/bin/5172331270',
    '/bin/422998988',
    '/bin/40005200',
    '/bin/010309',
    '/bin/427281',
  ]
  const urls = [...staticUrls, ...sampleBins]
    .map(
      (path) =>
        `  <url>\n    <loc>${origin}${path}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

app.get('/api/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT COUNT(*) AS total FROM bins').first<{
    total: number
  }>()
  return c.json({
    status: 'ok',
    database: 'bin-database',
    records: row?.total ?? 0,
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/lookup', async (c) => {
  const query = c.req.query('bin') ?? c.req.query('pan')
  if (!query) {
    return c.json(
      { error: 'Missing required query parameter: bin or pan' },
      400
    )
  }
  const result = await lookupSingleBin(c.env.DB, query)
  if (!result) {
    return c.json(
      { error: 'Input must contain at least 6 numeric digits' },
      400
    )
  }
  if (!result.matched) {
    return c.json(result, 404)
  }
  return c.json(result)
})

app.get('/api/lookup/:pan', async (c) => {
  const pan = c.req.param('pan')
  const result = await lookupSingleBin(c.env.DB, pan)
  if (!result) {
    return c.json(
      { error: 'Input must contain at least 6 numeric digits' },
      400
    )
  }
  if (!result.matched) {
    return c.json(result, 404)
  }
  return c.json(result)
})

app.post('/api/lookup/batch', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON request body' }, 400)
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as { bins?: unknown }).bins)
  ) {
    return c.json(
      { error: 'Request body must be JSON with a "bins" string array' },
      400
    )
  }

  const rawBins = (body as { bins: unknown[] }).bins
  if (rawBins.length === 0 || rawBins.length > 100) {
    return c.json(
      { error: 'Provide between 1 and 100 BINs/PANs per batch request' },
      400
    )
  }

  const stringBins = rawBins.map((item) => String(item ?? ''))
  const { results, invalid } = await lookupBatchBins(c.env.DB, stringBins)

  return c.json({
    requested: stringBins.length,
    matched_count: results.filter((r) => r.matched).length,
    invalid_count: invalid.length,
    invalid,
    results,
  })
})

app.get('/api/bins', async (c) => {
  const limitRaw = parseIntParam(c.req.query('limit')) ?? 25
  const offsetRaw = parseIntParam(c.req.query('offset')) ?? 0

  const filters: SearchFilters = {
    prefix: c.req.query('prefix'),
    brand: c.req.query('brand'),
    type: c.req.query('type'),
    category: c.req.query('category'),
    segment: c.req.query('segment'),
    country: c.req.query('country'),
    iso2: c.req.query('iso2'),
    bank: c.req.query('bank'),
    currency: c.req.query('currency'),
    bin_length: parseIntParam(c.req.query('bin_length')),
    regulated: parseBoolParam(c.req.query('regulated')),
    fast_funds_dom: parseBoolParam(c.req.query('fast_funds_dom')),
    fast_funds_cross: parseBoolParam(c.req.query('fast_funds_cross')),
    push_funds: parseBoolParam(c.req.query('push_funds')),
    moneysend: parseBoolParam(c.req.query('moneysend')),
    visa_direct: parseBoolParam(c.req.query('visa_direct')),
    token: parseBoolParam(c.req.query('token')),
    pull_dom: parseBoolParam(c.req.query('pull_dom')),
    comm_l2: parseBoolParam(c.req.query('comm_l2')),
    comm_l3: parseBoolParam(c.req.query('comm_l3')),
    limit: Math.min(Math.max(limitRaw, 1), 100),
    offset: Math.max(offsetRaw, 0),
  }

  const data = await searchBins(c.env.DB, filters)
  return c.json(data)
})

app.get('/api/bins/:pan', async (c) => {
  const pan = c.req.param('pan')
  const result = await lookupSingleBin(c.env.DB, pan)
  if (!result) {
    return c.json(
      { error: 'Input must contain at least 6 numeric digits' },
      400
    )
  }
  if (!result.matched) {
    return c.json(result, 404)
  }
  return c.json(result)
})

app.get('/api/stats', async (c) => {
  const stats = await computeStats(c.env.DB)
  return c.json(stats)
})

app.get('/api/analysis', async (c) => {
  const report = await buildAnalysisReport(c.env.DB)
  return c.json(report)
})

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Endpoint not found', path: c.req.path }, 404)
  }
  return c.text('Not Found', 404)
})

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(
    { error: 'Internal server error', message: err.message },
    500
  )
})

export default app
