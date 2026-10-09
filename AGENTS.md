# Project Instructions

## Project

PT-Gen Universal is an Edge-first Hono service that parses media metadata and emits JSON,
BBCode, and Markdown across Cloudflare, Vercel, Netlify, EdgeOne, Node.js, and Bun runtimes.

## Commands

- Install with `pnpm install --frozen-lockfile`.
- Run locally with `pnpm run dev` (default: `http://localhost:3000`).
- Run the complete local/CI gate with `pnpm run check`.
- Run focused tests with `pnpm exec vitest run <test-file>`.

## Stack

- TypeScript, Hono, Vitest, Wrangler/workerd, Cheerio, and pnpm 9.
- Node.js 20.19.0 or newer is required.

## Structure

- `lib/`: scrapers, normalizers, formatters, shared types, and utilities.
- `src/`: controllers, runtime adapters, cache, middleware, services, and storage.
- `__tests__/`: unit, API, integration, and fixture coverage.
- `scripts/`: deterministic homepage and runtime smoke checks.

## Conventions

- Preserve V1 compatibility when changing the internal or V2 schema.
- Keep platform-neutral code free of Node-only globals and modules.
- Treat Rexxar, awards, and IMDb ratings as optional enrichment; core HTML results must survive
  enrichment failure.
- Keep original poster URLs in JSON and expose derived CDN URLs through `poster_proxy`.
- Update `README.md` and `.env.example` when changing runtime configuration.
