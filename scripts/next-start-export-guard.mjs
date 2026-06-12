#!/usr/bin/env node
/**
 * next.config uses output: "export" → `next start` is not supported by Next.js.
 * APK/cap sync uses folder `out/`; API routes only run under `next dev` (locally or on a full Node host).
 */
console.error(`
next start is not compatible with a local "export" build (no /api).

  Mobile + notifications + local backend:
    npm run dev
    # or for LAN: npm run dev:lan

  Production URL for the app (set NEXT_PUBLIC_APP_URL to this, then npm run build && cap sync):
    Deploy on Vercel — builds with VERCEL=1 so /api routes exist (see next.config.mjs).

  Local production Node (after a full server build):
    VERCEL=1 npm run build
    npm run start:server

  Static preview only (no /api):
    npm run serve:out
`)
process.exit(1)
