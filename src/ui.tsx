import type { LookupResult } from './types'

interface HomeSummary {
  total: number
  brands: number
  countries: number
  banks: number
}

export function CardProfileView({ result }: { result: LookupResult }) {
  if (!result.matched || !result.record) {
    return (
      <div class="profile-box">
        <strong>No matching BIN found</strong>
        <p class="subtitle">
          Checked descending waterfall prefixes: <code>{result.checked_prefixes.join(' → ')}</code>
        </p>
      </div>
    )
  }

  const r = result.record
  const capList: Array<[string, boolean]> = [
    ['Fast Funds Domestic', r.capabilities.fast_funds_domestic],
    ['Fast Funds Cross-Border', r.capabilities.fast_funds_cross_border],
    ['Push Funds Domestic', r.capabilities.push_funds_domestic],
    ['Push Funds Cross-Border', r.capabilities.push_funds_cross_border],
    ['Visa Direct (MT)', r.capabilities.visa_money_transfer],
    ['MC MoneySend', r.capabilities.mastercard_moneysend],
    ['Online Gambling FF Dom', r.capabilities.online_gambling_ff_domestic],
    ['Online Gambling FF Cross', r.capabilities.online_gambling_ff_cross_border],
    ['Pull Domestic', r.capabilities.pull_domestic],
    ['Tokenized Wallet', r.capabilities.tokenized],
    ['Commercial L2', r.capabilities.commercial_l2],
    ['Commercial L3', r.capabilities.commercial_l3],
  ]

  return (
    <div class="profile-box">
      <div class="profile-header">
        <div>
          <div class="pill-row">
            <span class="pill info">BIN {r.bin}</span>
            <span class="pill on">{r.brand}</span>
            {r.type && <span class="pill info">{r.type}</span>}
            {r.segment && <span class="pill">{r.segment}</span>}
            {r.regulated && <span class="pill warn">US Durbin Regulated</span>}
          </div>
          <h3 style="margin-top: 0.65rem;">
            {r.issuer.name ?? 'Issuer Undisclosed'} {r.country.iso2 ? `(${r.country.iso2})` : ''}
          </h3>
          <div class="subtitle" style="font-size: 0.88rem;">
            Matched {result.matched_length}-digit prefix from checked waterfall:{' '}
            <code>{result.checked_prefixes.join(' → ')}</code>
          </div>
        </div>
        <div class="pill-row">
          <a href={`/api/lookup/${encodeURIComponent(r.bin)}`} class="btn btn-secondary btn-sm">
            View JSON
          </a>
        </div>
      </div>

      <div class="kv-grid">
        <div class="kv-item">
          <div class="kv-label">Category / Tier</div>
          <div class="kv-val">{r.category ?? '—'}</div>
        </div>
        <div class="kv-item">
          <div class="kv-label">Country</div>
          <div class="kv-val">
            {r.country.name ?? '—'}{' '}
            {r.country.iso2 ? `(${r.country.iso2} / ${r.country.iso3 ?? '—'})` : ''}
          </div>
        </div>
        <div class="kv-item">
          <div class="kv-label">Currency</div>
          <div class="kv-val">
            {r.currency ?? '—'}
            {r.currency_raw && r.currency_raw !== r.currency ? ` (raw: ${r.currency_raw})` : ''}
          </div>
        </div>
        <div class="kv-item">
          <div class="kv-label">Expected PAN Length</div>
          <div class="kv-val">
            {r.pan_length} digits
            {result.pan_length_valid !== null && (
              <span> {result.pan_length_valid ? '✓ Valid' : '✗ Length Mismatch'}</span>
            )}
          </div>
        </div>
        <div class="kv-item">
          <div class="kv-label">Issuer Website</div>
          <div class="kv-val">{r.issuer.website ?? '—'}</div>
        </div>
        <div class="kv-item">
          <div class="kv-label">Issuer Phone</div>
          <div class="kv-val">{r.issuer.phone ?? '—'}</div>
        </div>
        <div class="kv-item">
          <div class="kv-label">Debit Networks</div>
          <div class="kv-val">{r.networks.debit.length ? r.networks.debit.join(', ') : '—'}</div>
        </div>
        <div class="kv-item">
          <div class="kv-label">ATM Networks</div>
          <div class="kv-val">{r.networks.atm.length ? r.networks.atm.join(', ') : '—'}</div>
        </div>
      </div>

      <div>
        <div class="kv-label" style="margin-bottom: 0.45rem;">
          Payout &amp; Routing Capabilities
        </div>
        <div class="pill-row">
          {capList.map(([label, enabled]) => (
            <span class={enabled ? 'pill on' : 'pill'}>
              {enabled ? '✓ ' : '· '}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HomePage({
  summary,
  initialResult,
}: {
  summary: HomeSummary
  initialResult: LookupResult | null
}) {
  return (
    <main class="container">
      <section class="hero">
        <span class="eyebrow">Open Source · Cloudflare Workers + D1 · MIT License</span>
        <h1>High-Precision BIN / IIN Lookup &amp; Payment Intelligence API</h1>
        <p class="subtitle">
          Look up 6 to 11-digit Bank Identification Numbers with descending{' '}
          <code>11 → 10 → 9 → 8 → 6</code> waterfall matching, issuer metadata, Durbin regulation
          flags, and Visa Direct / Mastercard MoneySend payout indicators.
        </p>
        <div class="hero-actions">
          <a href="#lookup" class="btn btn-primary">
            Try Live Lookup
          </a>
          <a href="/docs" class="btn btn-secondary">
            Read API Docs
          </a>
          <a href="/analytics" class="btn btn-secondary">
            View Dataset Audit
          </a>
        </div>
      </section>

      <section class="grid-4" aria-label="Database Metrics">
        <div class="card">
          <div class="stat-value">{summary.total.toLocaleString()}</div>
          <div class="stat-label">Normalized BIN Records</div>
        </div>
        <div class="card">
          <div class="stat-value">{summary.brands}</div>
          <div class="stat-label">Card Networks &amp; Schemes</div>
        </div>
        <div class="card">
          <div class="stat-value">{summary.countries}</div>
          <div class="stat-label">Issuing Countries</div>
        </div>
        <div class="card">
          <div class="stat-value">{summary.banks.toLocaleString()}</div>
          <div class="stat-label">Distinct Issuing Banks</div>
        </div>
      </section>

      <section class="card" id="lookup">
        <h2>Instant Waterfall BIN / PAN Lookup</h2>
        <p class="subtitle" style="margin-bottom: 0.9rem;">
          Enter any 6–11 digit BIN prefix or 12–19 digit card PAN. Non-digit characters are
          automatically stripped before waterfall resolution.
        </p>

        <form class="lookup-form" id="lookup-form">
          <input
            type="text"
            class="input lookup-input"
            id="bin-input"
            aria-label="BIN or PAN number"
            placeholder="e.g. 50612402005, 4229989881234567, 010309"
            value="50612402005"
          />
          <button type="submit" class="btn btn-primary">
            Lookup BIN
          </button>
        </form>

        <div class="chips" aria-label="Sample BINs">
          <button type="button" class="chip" data-bin="50612402005">
            11-digit: 50612402005
          </button>
          <button type="button" class="chip" data-bin="5172331270">
            10-digit: 5172331270
          </button>
          <button type="button" class="chip" data-bin="4229989881234567">
            9-digit PAN: 4229989881234567
          </button>
          <button type="button" class="chip" data-bin="400052009999">
            8-digit overlap: 400052009999
          </button>
          <button type="button" class="chip" data-bin="010309">
            Leading zero: 010309
          </button>
          <button type="button" class="chip" data-bin="427281">
            Namibia NA fix: 427281
          </button>
        </div>

        <div id="visual-result">{initialResult && <CardProfileView result={initialResult} />}</div>

        <details style="margin-top: 1rem;">
          <summary>Raw JSON API Response</summary>
          <pre id="lookup-json">
            {initialResult ? JSON.stringify(initialResult, null, 2) : '{}'}
          </pre>
        </details>
      </section>

      <section class="card" id="explorer">
        <h2>Interactive BIN Directory &amp; Filter Explorer</h2>
        <p class="subtitle" style="margin-bottom: 0.9rem;">
          Query <code>GET /api/bins</code> directly against Cloudflare D1 by scheme, country,
          type, currency, or payout capabilities.
        </p>

        <form id="filter-form">
          <div class="filter-bar">
            <input class="input" type="text" id="f-brand" placeholder="Brand (e.g. VISA)" />
            <input class="input" type="text" id="f-iso2" placeholder="Country ISO2 (e.g. US)" />
            <select id="f-type" aria-label="Card Type">
              <option value="">All Types</option>
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
              <option value="CHARGE CARD">CHARGE CARD</option>
            </select>
            <select id="f-segment" aria-label="Segment">
              <option value="">All Segments</option>
              <option value="PERSONAL">PERSONAL</option>
              <option value="COMMERCIAL">COMMERCIAL</option>
            </select>
            <input class="input" type="text" id="f-currency" placeholder="Currency (e.g. USD)" />
            <select id="f-cap" aria-label="Capability">
              <option value="">Any Capability</option>
              <option value="fast_funds_dom=true">Fast Funds Domestic</option>
              <option value="push_funds=true">Push Funds</option>
              <option value="visa_direct=true">Visa Direct</option>
              <option value="moneysend=true">MC MoneySend</option>
              <option value="token=true">Tokenized</option>
              <option value="regulated=true">US Durbin Regulated</option>
            </select>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary btn-sm">
              Search D1
            </button>
            <span id="filter-status" class="subtitle" style="font-size: 0.86rem;">
              Click Search D1 to browse matching records.
            </span>
          </div>
        </form>

        <div class="table-wrap" style="margin-top: 0.9rem;">
          <table>
            <thead>
              <tr>
                <th>BIN</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Category</th>
                <th>Issuer</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody id="explorer-tbody"></tbody>
          </table>
        </div>
      </section>

      <section class="card" id="faq">
        <h2>Frequently Asked Questions</h2>
        <details open>
          <summary>How does 11 → 10 → 9 → 8 → 6 waterfall BIN lookup work?</summary>
          <p>
            Modern card issuing uses 8 to 11-digit sub-ranges for specific products and currencies
            that share a 6-digit prefix with legacy BINs. When you query a PAN or prefix, Titan
            checks D1 using <code>WHERE bin IN (?, ?, ?, ?, ?) ORDER BY bin_length DESC LIMIT 1</code>{' '}
            so the most specific BIN range always wins.
          </p>
        </details>
        <details>
          <summary>How are leading-zero BINs and Namibia ISO codes handled?</summary>
          <p>
            BINs are stored as <code>TEXT PRIMARY KEY</code> so prefixes like <code>010309</code>{' '}
            never lose leading zeros. During ETL normalization, the 3 Namibia BINs whose{' '}
            <code>iso2</code> was dropped as <code>NaN</code> upstream are restored to{' '}
            <code>NA</code>, and 52 numeric ISO 4217 currency codes (such as <code>840</code>) are
            normalized to alpha-3 codes (<code>USD</code>).
          </p>
        </details>
        <details>
          <summary>Can I self-host this open-source project on my own Cloudflare account?</summary>
          <p>
            Yes. The project is MIT-licensed and deploys directly with Wrangler CLI. Create a D1
            database, apply <code>migrations/0001_init.sql</code>, seed{' '}
            <code>seed/0001_seed_bins.sql</code>, and run <code>npm run deploy</code>.
          </p>
        </details>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function () {
            const form = document.getElementById('lookup-form');
            const input = document.getElementById('bin-input');
            const visual = document.getElementById('visual-result');
            const jsonPre = document.getElementById('lookup-json');

            function el(tag, cls, text) {
              const node = document.createElement(tag);
              if (cls) node.className = cls;
              if (text !== undefined && text !== null) node.textContent = text;
              return node;
            }

            function renderProfile(data) {
              visual.innerHTML = '';
              const box = el('div', 'profile-box');
              if (!data.matched || !data.record) {
                box.appendChild(el('strong', '', data.error || 'No matching BIN found'));
                if (data.checked_prefixes) {
                  const p = el('p', 'subtitle', 'Checked prefixes: ' + data.checked_prefixes.join(' → '));
                  box.appendChild(p);
                }
                visual.appendChild(box);
                return;
              }
              const r = data.record;
              const header = el('div', 'profile-header');
              const left = el('div');
              const pills = el('div', 'pill-row');
              pills.appendChild(el('span', 'pill info', 'BIN ' + r.bin));
              pills.appendChild(el('span', 'pill on', r.brand));
              if (r.type) pills.appendChild(el('span', 'pill info', r.type));
              if (r.segment) pills.appendChild(el('span', 'pill', r.segment));
              if (r.regulated) pills.appendChild(el('span', 'pill warn', 'US Durbin Regulated'));
              left.appendChild(pills);

              const title = el('h3', '', (r.issuer.name || 'Issuer Undisclosed') + (r.country.iso2 ? ' (' + r.country.iso2 + ')' : ''));
              title.style.marginTop = '0.65rem';
              left.appendChild(title);
              left.appendChild(el('div', 'subtitle', 'Matched ' + data.matched_length + '-digit prefix · Checked: ' + data.checked_prefixes.join(' → ')));
              header.appendChild(left);

              const actions = el('div', 'pill-row');
              const detailLink = el('a', 'btn btn-secondary btn-sm', 'Permalink Page');
              detailLink.href = '/bin/' + encodeURIComponent(r.bin);
              const jsonLink = el('a', 'btn btn-secondary btn-sm', 'View JSON');
              jsonLink.href = '/api/lookup/' + encodeURIComponent(r.bin);
              actions.appendChild(detailLink);
              actions.appendChild(jsonLink);
              header.appendChild(actions);
              box.appendChild(header);

              const grid = el('div', 'kv-grid');
              const items = [
                ['Category / Tier', r.category || '—'],
                ['Country', (r.country.name || '—') + (r.country.iso2 ? ' (' + r.country.iso2 + ' / ' + (r.country.iso3 || '—') + ')' : '')],
                ['Currency', (r.currency || '—') + (r.currency_raw && r.currency_raw !== r.currency ? ' (raw: ' + r.currency_raw + ')' : '')],
                ['Expected PAN Length', r.pan_length + ' digits' + (data.pan_length_valid === true ? ' ✓ Valid' : data.pan_length_valid === false ? ' ✗ Mismatch' : '')],
                ['Issuer Website', r.issuer.website || '—'],
                ['Issuer Phone', r.issuer.phone || '—'],
                ['Debit Networks', r.networks.debit.length ? r.networks.debit.join(', ') : '—'],
                ['ATM Networks', r.networks.atm.length ? r.networks.atm.join(', ') : '—'],
              ];
              items.forEach(([label, val]) => {
                const kv = el('div', 'kv-item');
                kv.appendChild(el('div', 'kv-label', label));
                kv.appendChild(el('div', 'kv-val', val));
                grid.appendChild(kv);
              });
              box.appendChild(grid);

              const capTitle = el('div', 'kv-label', 'Payout & Routing Capabilities');
              capTitle.style.marginBottom = '0.45rem';
              box.appendChild(capTitle);

              const capRow = el('div', 'pill-row');
              const caps = [
                ['Fast Funds Domestic', r.capabilities.fast_funds_domestic],
                ['Fast Funds Cross-Border', r.capabilities.fast_funds_cross_border],
                ['Push Funds Domestic', r.capabilities.push_funds_domestic],
                ['Push Funds Cross-Border', r.capabilities.push_funds_cross_border],
                ['Visa Direct (MT)', r.capabilities.visa_money_transfer],
                ['MC MoneySend', r.capabilities.mastercard_moneysend],
                ['Online Gambling FF Dom', r.capabilities.online_gambling_ff_domestic],
                ['Online Gambling FF Cross', r.capabilities.online_gambling_ff_cross_border],
                ['Pull Domestic', r.capabilities.pull_domestic],
                ['Tokenized Wallet', r.capabilities.tokenized],
                ['Commercial L2', r.capabilities.commercial_l2],
                ['Commercial L3', r.capabilities.commercial_l3],
              ];
              caps.forEach(([label, enabled]) => {
                capRow.appendChild(el('span', enabled ? 'pill on' : 'pill', (enabled ? '✓ ' : '· ') + label));
              });
              box.appendChild(capRow);
              visual.appendChild(box);
            }

            async function runLookup(val) {
              jsonPre.textContent = 'Loading...';
              try {
                const res = await fetch('/api/lookup/' + encodeURIComponent(val));
                const data = await res.json();
                jsonPre.textContent = JSON.stringify(data, null, 2);
                renderProfile(data);
              } catch (err) {
                jsonPre.textContent = 'Request failed: ' + err.message;
              }
            }

            form.addEventListener('submit', (e) => {
              e.preventDefault();
              runLookup(input.value);
            });

            document.querySelectorAll('.chip').forEach((btn) => {
              btn.addEventListener('click', () => {
                input.value = btn.dataset.bin || '';
                runLookup(input.value);
              });
            });

            // Filter Explorer
            const filterForm = document.getElementById('filter-form');
            const tbody = document.getElementById('explorer-tbody');
            const statusEl = document.getElementById('filter-status');

            async function runSearch() {
              const params = new URLSearchParams();
              const brand = document.getElementById('f-brand').value.trim();
              const iso2 = document.getElementById('f-iso2').value.trim();
              const type = document.getElementById('f-type').value;
              const segment = document.getElementById('f-segment').value;
              const currency = document.getElementById('f-currency').value.trim();
              const cap = document.getElementById('f-cap').value;
              if (brand) params.set('brand', brand);
              if (iso2) params.set('iso2', iso2);
              if (type) params.set('type', type);
              if (segment) params.set('segment', segment);
              if (currency) params.set('currency', currency);
              if (cap) {
                const [k, v] = cap.split('=');
                params.set(k, v);
              }
              params.set('limit', '15');

              statusEl.textContent = 'Querying D1...';
              try {
                const res = await fetch('/api/bins?' + params.toString());
                const data = await res.json();
                statusEl.textContent = 'Showing ' + data.items.length + ' of ' + data.total.toLocaleString() + ' matching records';
                tbody.innerHTML = '';
                data.items.forEach((item) => {
                  const tr = document.createElement('tr');
                  const cells = [
                    item.bin,
                    item.brand,
                    item.type || '—',
                    item.category || '—',
                    item.issuer.name || '—',
                    item.country.iso2 || item.country.name || '—',
                    item.currency || '—',
                  ];
                  cells.forEach((text, idx) => {
                    const td = document.createElement('td');
                    if (idx === 0) {
                      const code = document.createElement('code');
                      code.textContent = text;
                      td.appendChild(code);
                    } else {
                      td.textContent = text;
                    }
                    tr.appendChild(td);
                  });
                  const actionTd = document.createElement('td');
                  const a = document.createElement('a');
                  a.href = '/bin/' + encodeURIComponent(item.bin);
                  a.textContent = 'Inspect';
                  actionTd.appendChild(a);
                  tr.appendChild(actionTd);
                  tbody.appendChild(tr);
                });
              } catch (err) {
                statusEl.textContent = 'Search failed: ' + err.message;
              }
            }

            filterForm.addEventListener('submit', (e) => {
              e.preventDefault();
              runSearch();
            });
            runSearch();
          })();
          `,
        }}
      />
    </main>
  )
}

export function BinDetailPage({
  query,
  result,
}: {
  query: string
  result: LookupResult | null
}) {
  return (
    <main class="container">
      <div style="margin-bottom: 1rem;">
        <a href="/">← Back to BIN Lookup</a>
      </div>
      <section class="hero">
        <span class="eyebrow">BIN Intelligence Record</span>
        <h1>
          BIN / PAN Lookup: <code>{query}</code>
        </h1>
        <p class="subtitle">
          Server-rendered BIN profile resolved using descending <code>11 → 10 → 9 → 8 → 6</code>{' '}
          waterfall matching on Cloudflare D1.
        </p>
      </section>

      <section class="card">
        {result ? (
          <>
            <CardProfileView result={result} />
            <h3 style="margin-top: 1.25rem;">API Equivalent</h3>
            <pre>{`curl -s "${`/api/lookup/${encodeURIComponent(query)}`}"`}</pre>
            <details style="margin-top: 0.9rem;">
              <summary>Full JSON Payload</summary>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
          </>
        ) : (
          <p class="subtitle">Input must contain at least 6 numeric digits.</p>
        )}
      </section>
    </main>
  )
}

export function DocsPage({ origin }: { origin: string }) {
  return (
    <main class="container">
      <section class="hero">
        <span class="eyebrow">REST API · OpenAPI 3.1.0</span>
        <h1>Titan BIN API Documentation</h1>
        <p class="subtitle">
          Fast, edge-cached JSON endpoints backed by Cloudflare D1. Zero API key required for
          self-hosted deployments.
        </p>
        <div class="hero-actions">
          <a href="/openapi.json" class="btn btn-primary btn-sm" target="_blank" rel="noopener">
            Download OpenAPI 3.1 Spec
          </a>
          <a href="/" class="btn btn-secondary btn-sm">
            Open Lookup Explorer
          </a>
        </div>
      </section>

      <div class="docs-layout">
        <aside class="docs-sidebar" aria-label="API Endpoints Navigation">
          <div class="docs-nav-title">Getting Started</div>
          <a href="#overview" class="docs-nav-link">
            Base URL &amp; Waterfall Logic
          </a>
          <a href="#health" class="docs-nav-link">
            GET /api/health
          </a>

          <div class="docs-nav-title">Lookup Endpoints</div>
          <a href="#lookup-path" class="docs-nav-link">
            GET /api/lookup/:pan
          </a>
          <a href="#lookup-query" class="docs-nav-link">
            GET /api/lookup?bin=
          </a>
          <a href="#lookup-batch" class="docs-nav-link">
            POST /api/lookup/batch
          </a>

          <div class="docs-nav-title">Search &amp; Analytics</div>
          <a href="#search-bins" class="docs-nav-link">
            GET /api/bins
          </a>
          <a href="#stats" class="docs-nav-link">
            GET /api/stats
          </a>
          <a href="#analysis" class="docs-nav-link">
            GET /api/analysis
          </a>
        </aside>

        <div>
          <section class="card" id="overview">
            <h2>Base URL &amp; Waterfall Specification</h2>
            <p class="subtitle">
              All API endpoints return <code>application/json</code> with CORS enabled. Inputs are
              sanitized to digits and matched in descending prefix order:
              <code>11 → 10 → 9 → 8 → 6</code>.
            </p>
            <pre>{`Base URL: ${origin}
OpenAPI:  ${origin}/openapi.json`}</pre>
          </section>

          <section class="card" id="lookup-path">
            <h2>
              <span class="method-badge method-get">GET</span>
              <code>/api/lookup/:pan</code>
            </h2>
            <p class="subtitle">
              Resolves a 6–11 digit BIN prefix or 12–19 digit card PAN. Also validates PAN length
              when 12+ digits are supplied. (Alias: <code>/api/bins/:pan</code>)
            </p>
            <pre>{`# cURL
curl -s "${origin}/api/lookup/4229989881234567"

# JavaScript
const res = await fetch("${origin}/api/lookup/4229989881234567");
const data = await res.json();

# Python
import requests
data = requests.get("${origin}/api/lookup/4229989881234567").json()`}</pre>
            <div class="try-box">
              <div class="lookup-form">
                <input
                  type="text"
                  class="input"
                  id="try-single-input"
                  value="400052009999"
                  aria-label="PAN to test"
                />
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-try="single"
                >
                  Run Request
                </button>
              </div>
              <pre id="try-single-out">Click "Run Request" to execute live against D1.</pre>
            </div>
          </section>

          <section class="card" id="lookup-query">
            <h2>
              <span class="method-badge method-get">GET</span>
              <code>/api/lookup?bin=...</code>
            </h2>
            <p class="subtitle">
              Query-string alternative supporting either <code>?bin=</code> or <code>?pan=</code>.
              Returns <code>400</code> for fewer than 6 digits and <code>404</code> if unmatched.
            </p>
            <pre>{`curl -s "${origin}/api/lookup?bin=010309"`}</pre>
          </section>

          <section class="card" id="lookup-batch">
            <h2>
              <span class="method-badge method-post">POST</span>
              <code>/api/lookup/batch</code>
            </h2>
            <p class="subtitle">
              Accepts up to 100 BINs/PANs in a JSON array, deduplicates candidate prefixes across
              chunked D1 queries, and returns individual match results plus invalid counts.
            </p>
            <pre>{`curl -s -X POST "${origin}/api/lookup/batch" \\
  -H "Content-Type: application/json" \\
  -d '{"bins": ["50612402005", "400052009999", "010309"]}'`}</pre>
            <div class="try-box">
              <button type="button" class="btn btn-primary btn-sm" data-try="batch">
                Run Sample Batch Request
              </button>
              <pre id="try-batch-out">Click to test batch lookup of 3 BINs.</pre>
            </div>
          </section>

          <section class="card" id="search-bins">
            <h2>
              <span class="method-badge method-get">GET</span>
              <code>/api/bins</code>
            </h2>
            <p class="subtitle">
              Paginated multi-filter search across card metadata and payout capabilities.
            </p>
            <div class="table-wrap" style="margin-top: 0.75rem;">
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>prefix</code>, <code>bin_length</code></td>
                    <td>string / int</td>
                    <td>BIN starts-with prefix or exact length (6, 8, 9, 10, 11)</td>
                  </tr>
                  <tr>
                    <td><code>brand</code>, <code>type</code>, <code>category</code>, <code>segment</code></td>
                    <td>string</td>
                    <td>Scheme (VISA), card type (DEBIT), tier (PLATINUM), PERSONAL/COMMERCIAL</td>
                  </tr>
                  <tr>
                    <td><code>country</code>, <code>iso2</code>, <code>bank</code>, <code>currency</code></td>
                    <td>string</td>
                    <td>Country name, 2-letter ISO (e.g. US, NA), partial bank match, ISO-4217 currency</td>
                  </tr>
                  <tr>
                    <td>
                      <code>regulated</code>, <code>fast_funds_dom</code>, <code>fast_funds_cross</code>,{' '}
                      <code>push_funds</code>, <code>moneysend</code>, <code>visa_direct</code>,{' '}
                      <code>token</code>, <code>pull_dom</code>, <code>comm_l2</code>, <code>comm_l3</code>
                    </td>
                    <td>boolean</td>
                    <td>Filter by regulatory or payout/routing indicator (<code>true</code>/<code>false</code>)</td>
                  </tr>
                  <tr>
                    <td><code>limit</code>, <code>offset</code></td>
                    <td>int</td>
                    <td>Pagination controls (<code>limit</code> 1–100, default 25)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="try-box">
              <button type="button" class="btn btn-primary btn-sm" data-try="search">
                Run Sample Search (VISA · US · Fast Funds · limit=2)
              </button>
              <pre id="try-search-out">Click to execute filtered D1 search.</pre>
            </div>
          </section>

          <section class="card" id="stats">
            <h2>
              <span class="method-badge method-get">GET</span>
              <code>/api/stats</code>
            </h2>
            <p class="subtitle">
              Returns live aggregations from D1 across brands, countries, issuing banks,
              currencies, BIN precision lengths, and capability flags.
            </p>
            <div class="try-box">
              <button type="button" class="btn btn-primary btn-sm" data-try="stats">
                Fetch Live Stats
              </button>
              <pre id="try-stats-out">Click to load /api/stats.</pre>
            </div>
          </section>

          <section class="card" id="analysis">
            <h2>
              <span class="method-badge method-get">GET</span>
              <code>/api/analysis</code>
            </h2>
            <p class="subtitle">
              Returns the complete dataset audit comparing upstream README claims to the shipped
              CSV, null rates, prefix overlaps, and normalization fixes.
            </p>
            <div class="try-box">
              <button type="button" class="btn btn-primary btn-sm" data-try="analysis">
                Fetch Audit Report
              </button>
              <pre id="try-analysis-out">Click to load /api/analysis.</pre>
            </div>
          </section>

          <section class="card" id="health">
            <h2>
              <span class="method-badge method-get">GET</span>
              <code>/api/health</code>
            </h2>
            <p class="subtitle">Lightweight health check verifying D1 availability and row count.</p>
          </section>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function () {
            async function run(url, opts, targetId) {
              const out = document.getElementById(targetId);
              out.textContent = 'Running...';
              try {
                const res = await fetch(url, opts);
                const data = await res.json();
                out.textContent = JSON.stringify(data, null, 2);
              } catch (err) {
                out.textContent = 'Error: ' + err.message;
              }
            }
            document.querySelectorAll('[data-try]').forEach((btn) => {
              btn.addEventListener('click', () => {
                const kind = btn.dataset.try;
                if (kind === 'single') {
                  const val = document.getElementById('try-single-input').value;
                  run('/api/lookup/' + encodeURIComponent(val), undefined, 'try-single-out');
                } else if (kind === 'batch') {
                  run('/api/lookup/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bins: ['50612402005', '400052009999', '010309'] }),
                  }, 'try-batch-out');
                } else if (kind === 'search') {
                  run('/api/bins?brand=VISA&iso2=US&fast_funds_dom=true&limit=2', undefined, 'try-search-out');
                } else if (kind === 'stats') {
                  run('/api/stats', undefined, 'try-stats-out');
                } else if (kind === 'analysis') {
                  run('/api/analysis', undefined, 'try-analysis-out');
                }
              });
            });
          })();
          `,
        }}
      />
    </main>
  )
}

export function AnalyticsPage({
  stats,
  analysis,
}: {
  stats: {
    total_records: number
    unique_counts: { brands: number; banks: number; countries: number; currencies: number }
    distributions: {
      bin_length: Array<{ bin_length: number; count: number }>
      card_type: Array<{ type: string; count: number }>
      segment: Array<{ segment: string; count: number }>
    }
    top: {
      brands: Array<{ brand: string; count: number }>
      countries: Array<{ country: string; iso2: string | null; count: number }>
    }
    capabilities: Record<string, number>
  }
  analysis: {
    readme_vs_actual_discrepancies: Array<{
      topic: string
      readme_claim: string
      actual_in_repo: string
    }>
    data_quality_findings_and_fixes: Array<{ issue: string; detail: string }>
    null_rates: Record<string, number>
  }
}) {
  const total = stats.total_records || 1

  return (
    <main class="container">
      <section class="hero">
        <span class="eyebrow">Live D1 Analytics &amp; Audit</span>
        <h1>BinBase 2026 Dataset Analysis</h1>
        <p class="subtitle">
          Computed live from Cloudflare D1 across {stats.total_records.toLocaleString()} normalized
          BIN records, including upstream repository discrepancies and data-cleaning verification.
        </p>
      </section>

      <section class="grid-4">
        <div class="card">
          <div class="stat-value">{stats.total_records.toLocaleString()}</div>
          <div class="stat-label">Total BIN Records</div>
        </div>
        <div class="card">
          <div class="stat-value">{stats.unique_counts.brands}</div>
          <div class="stat-label">Unique Brands</div>
        </div>
        <div class="card">
          <div class="stat-value">{stats.unique_counts.countries}</div>
          <div class="stat-label">Unique Countries</div>
        </div>
        <div class="card">
          <div class="stat-value">{stats.unique_counts.currencies}</div>
          <div class="stat-label">Normalized Currencies</div>
        </div>
      </section>

      <section class="grid-2">
        <div class="card">
          <h2>BIN Precision Distribution</h2>
          {stats.distributions.bin_length.map((row) => {
            const pct = ((row.count / total) * 100).toFixed(2)
            return (
              <div class="bar-row">
                <div class="bar-meta">
                  <span>{row.bin_length}-digit BINs</span>
                  <span>
                    {row.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style={`width: ${Math.max(Number(pct), 1)}%`}></div>
                </div>
              </div>
            )
          })}
        </div>

        <div class="card">
          <h2>Top Card Brands</h2>
          {stats.top.brands.slice(0, 8).map((row) => {
            const pct = ((row.count / total) * 100).toFixed(1)
            return (
              <div class="bar-row">
                <div class="bar-meta">
                  <span>{row.brand}</span>
                  <span>
                    {row.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style={`width: ${Math.max(Number(pct), 1)}%`}></div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section class="grid-2">
        <div class="card">
          <h2>Top Issuing Countries</h2>
          {stats.top.countries.slice(0, 8).map((row) => {
            const pct = ((row.count / total) * 100).toFixed(1)
            return (
              <div class="bar-row">
                <div class="bar-meta">
                  <span>
                    {row.country} {row.iso2 ? `(${row.iso2})` : ''}
                  </span>
                  <span>
                    {row.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style={`width: ${Math.max(Number(pct), 1)}%`}></div>
                </div>
              </div>
            )
          })}
        </div>

        <div class="card">
          <h2>Fintech &amp; Payout Capability Coverage</h2>
          {Object.entries(stats.capabilities).map(([key, count]) => {
            const pct = ((count / total) * 100).toFixed(2)
            return (
              <div class="bar-row">
                <div class="bar-meta">
                  <span>{key}</span>
                  <span>
                    {count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style={`width: ${Math.max(Number(pct), 0.8)}%`}></div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section class="card">
        <h2>Upstream README vs. Actual CSV Discrepancies</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>README Claim</th>
                <th>Actual Repository File</th>
              </tr>
            </thead>
            <tbody>
              {analysis.readme_vs_actual_discrepancies.map((item) => (
                <tr>
                  <td>
                    <strong>{item.topic}</strong>
                  </td>
                  <td>{item.readme_claim}</td>
                  <td>{item.actual_in_repo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2>Data Quality Findings &amp; ETL Normalizations</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Finding / Fix</th>
                <th>Verified Detail</th>
              </tr>
            </thead>
            <tbody>
              {analysis.data_quality_findings_and_fixes.map((item) => (
                <tr>
                  <td>
                    <strong>{item.issue}</strong>
                  </td>
                  <td>{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
