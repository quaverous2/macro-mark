# MacroMark contributor guide

## Product boundary

MacroMark is a private, local-first nutrition tracker. Version 1 works fully offline, requires no account, and has no backend. Do not introduce Spring Boot, cloud databases, authentication, analytics, advertising, coaching, social features, or synchronization unless the user explicitly changes the product decision.

The user owns their data. JSON export/import is a first-class capability before any third-party backup. Never add credentials, API keys, or hidden network calls to the core tracking flow.

## Development environment

Work inside the Dev Container. It pins Node.js 22.23.2 and npm 12.1.0; do not depend on globally installed host tooling.

```bash
npm install
npm start
npm run build
npm test
```

`node_modules` is a container volume. Do not delete the mount point. If its contents need clearing, remove its children only. Keep dependency changes in `package.json` and commit the matching `package-lock.json`.

The service worker is disabled for normal development. Test the production PWA with:

```bash
npm run build
npx http-server -p 4200 -c-1 dist/macro-mark/browser
```

Use a normal browser window, wait for the service worker to activate, then stop the static server and reload to verify the cached app shell.

## Application architecture

Use Angular standalone components, strict TypeScript, signals for local UI state, reactive forms for editable data, and SCSS. Keep route components focused on composition; move business rules into pure functions and services.

Organize code by feature, with shared domain types and pure calculation functions separate from Angular UI and Dexie persistence. Components must not query Dexie tables directly. Access local storage through narrow repository or service interfaces so persistence can be tested and evolved independently.

Use Dexie only for IndexedDB persistence. Every schema change needs an explicit database version and migration. Use Zod at untrusted boundaries: JSON import, persisted-record hydration, and any future OCR output. Do not silently discard invalid imported data; provide actionable validation errors.

## Nutrition and history invariants

Nutrition values are stored per 100 g. Carbohydrates, fat, protein, and salt use grams. Calories are always calculated, never manually entered:

`carbohydrates × 4 + protein × 4 + fat × 9`

Keep calculation functions deterministic and free of browser, Angular, and database dependencies. Apply display rounding at the presentation boundary, not in stored source values or intermediate calculations.

Locked days are immutable snapshots. Locking must copy every displayed entry and its nutrition values in one IndexedDB transaction. A later edit, archive, or deletion of a food must never change historical entries or totals.

## Testing and quality

Write Vitest unit tests alongside every calculation rule, database migration, import validation rule, and lock-day invariant. At minimum, cover macro scaling, calories, totals, and proof that food edits cannot mutate locked history.

Add Playwright only when a critical browser flow exists to test. Prefer a small number of high-value flows: create food, log grams, lock day, reopen offline, and restore exported data.

Run `npm run build` and `npm test` before handing off a change. Preserve strict TypeScript; do not weaken compiler settings or suppress errors to make a build pass. Format with Prettier and introduce ESLint configuration before adding non-trivial feature code.

## Scope discipline

Keep the interface calm and fast: food library, today, targets, history, and import/export are the v1 surfaces. OCR is assistive only and requires confirmation for every extracted field. Google Drive backup, sharing, and live sync are later decisions, not scaffolding work.
