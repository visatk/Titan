import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export interface PageMetaProps {
  title?: string
  description?: string
  canonicalUrl?: string
  origin?: string
  keywords?: string
  activeNav?: 'home' | 'docs' | 'analytics' | 'bin'
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: PageMetaProps
    ): Response | Promise<Response>
  }
}

export const renderer = jsxRenderer(
  ({
    children,
    title = 'Titan BIN Lookup API — Open-Source 6 to 11-Digit Card & Issuer Intelligence',
    description = 'Free open-source BIN/IIN lookup tool, REST API, and dataset explorer built on Cloudflare Workers and D1 with 11->10->9->8->6 waterfall matching.',
    canonicalUrl = 'https://titan-bin-api.workers.dev/',
    origin = 'https://titan-bin-api.workers.dev',
    keywords = 'BIN lookup, IIN lookup, BIN database API, credit card BIN checker, open source BIN API, Cloudflare D1, payment routing, Visa Direct, Mastercard MoneySend',
    activeNav = 'home',
    jsonLd,
  }) => {
    const ogImage = `${origin}/og-image.svg`
    return (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="keywords" content={keywords} />
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
          <meta name="theme-color" content="#0b1020" />
          <link rel="canonical" href={canonicalUrl} />
          <link rel="icon" href="/favicon.ico" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Titan BIN Lookup API" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={ogImage} />

          {jsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          )}

          <ViteClient />
          <Link href="/src/style.css" rel="stylesheet" />
        </head>
        <body>
          <nav class="navbar" aria-label="Primary Navigation">
            <div class="nav-inner">
              <a href="/" class="brand">
                <span class="brand-dot" aria-hidden="true"></span>
                <span>Titan BIN API</span>
                <span class="badge-oss">MIT</span>
              </a>
              <div class="nav-links">
                <a href="/" class={activeNav === 'home' ? 'nav-link active' : 'nav-link'}>
                  Lookup &amp; Explorer
                </a>
                <a href="/docs" class={activeNav === 'docs' ? 'nav-link active' : 'nav-link'}>
                  API Docs
                </a>
                <a
                  href="/analytics"
                  class={activeNav === 'analytics' ? 'nav-link active' : 'nav-link'}
                >
                  Dataset Audit
                </a>
                <a href="/openapi.json" class="nav-link" target="_blank" rel="noopener">
                  OpenAPI 3.1
                </a>
              </div>
            </div>
          </nav>

          {children}

          <footer class="footer">
            <div class="footer-inner">
              <div>
                <strong>Titan BIN Lookup API</strong> — Open-source card &amp; issuer intelligence
                powered by Hono, Cloudflare Workers &amp; D1.
              </div>
              <div class="footer-links">
                <a href="/">Lookup</a>
                <a href="/docs">API Docs</a>
                <a href="/analytics">Dataset Audit</a>
                <a href="/openapi.json">OpenAPI Spec</a>
                <a href="/sitemap.xml">Sitemap</a>
              </div>
            </div>
          </footer>
        </body>
      </html>
    )
  }
)
