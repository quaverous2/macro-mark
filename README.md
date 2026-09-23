# MacroMark

**Mark food. Track macros.**

MacroMark is a calm, local-first nutrition tracker for recording saved foods by weight, seeing accurate daily macro totals, and preserving completed days as immutable records. It has no feeds, coaching, recipes, streaks, advertisements, calorie-deficit advice, or required account.

## Product behaviour

Nutrition values are stored per 100 g. Logging a food is deliberately simple:

1. Choose a saved food.
2. Enter the amount eaten in grams.
3. See its calculated macros and the running daily total.

Calories are calculated consistently from macros:

`carbohydrates × 4 + protein × 4 + fat × 9`

## Current pages

### Today

Today is the daily log for the device's local calendar date. If the food library is empty, it explains how to get started and links to **Manage foods**. Otherwise, **Add row** opens a searchable inline picker of saved foods. Choosing a food creates a separate daily row at `0 g`, so the same food can be logged more than once.

Enter an amount from `0` to `10,000 g` with up to two decimal places. The spreadsheet-like table immediately scales carbohydrates, fat, protein, salt, and calculated calories; the total remains anchored at the bottom of the screen. Changes save locally after a short pause and when the field loses focus. A daily row can be removed without affecting the saved food.

Each row copies the food name and its per-100 g nutrition when it is added. This prevents later food-library changes from altering what was logged. When the local date changes, Today starts a fresh log and the previous day's positive entries become available in History.

### Foods

Foods is the personal food library. It lists saved foods newest first, provides case-insensitive name search, and displays each food's per-100 g nutrition and calculated calories. **Add food** opens a focused form for name, fat, carbohydrates, protein, and optional salt; all nutrition values are grams per 100 g. Duplicate normalized food names are rejected to keep the library unambiguous.

### History

History is a read-only, newest-first view of completed past local days. A day appears only when it contains at least one food with an amount above `0 g`; the current day and blank drafts are excluded. Its collapsed card shows the date plus total calories, carbohydrates, fat, protein, and salt. Tap or click a card to expand its consumed foods, grams, scaled macros, salt, and calories.

Historical cards are collapsed whenever History opens and their expanded state is not stored. Past logs cannot be changed through the persistence layer, preserving their snapshots as an audit trail.

## Planned version 1 scope

- Create, edit, archive, and search a personal food library.
- Store carbohydrates, fat, protein, salt, and optional notes per 100 g.
- Log a food to today in grams and calculate macros and calories immediately.
- Create and select macro-target presets.
- Lock a day and browse its historical totals and entries.
- Install the app on a phone and use it offline.
- Export all data as JSON; export a day/history summary as CSV; import a JSON backup.

## Technology

MacroMark is an Angular 21 local-first PWA built with standalone components, signals, strict TypeScript, reactive forms, and SCSS.

| Concern | Choice |
| --- | --- |
| Offline application shell | Angular service worker and Web App Manifest |
| On-device data | IndexedDB via Dexie |
| Boundary validation | Zod |
| Unit tests | Vitest |
| Critical browser flows | Playwright, when introduced |
| Formatting | Prettier |
| Deployment | Cloudflare Pages or GitHub Pages |

The app intentionally has no backend in v1. A Spring Boot API and PostgreSQL are only justified if a later product decision requires cross-device synchronization or sharing.

## Development

Open the repository in its Dev Container. It pins Node.js and npm, forwards port 4200, and stores `node_modules` in a container volume.

Install dependencies and start the development server:

```bash
npm install
npm start
```

Open `http://localhost:4200`. The development server reloads after source changes.

Useful commands:

```bash
npm run build
npm test
npx ng generate component feature/component-name
```

## PWA testing

Service workers are enabled only in production builds. Test the offline application shell with:

```bash
npm run build
npx http-server -p 4200 -c-1 dist/macro-mark/browser
```

Open `http://localhost:4200` in a normal browser window, wait for the service worker to activate, then stop the server and reload. The cached application shell should still render.

## Architecture principles

- **Local first:** core use works without sign-in or an internet connection.
- **User owns the data:** JSON export/import precedes third-party backup.
- **Locked means immutable:** historical nutrition is copied as a snapshot, never recalculated from mutable foods.
- **OCR assists; it never decides:** any future nutrition-label scan requires user review of every field.
- **No premature backend:** infrastructure that does not improve the single-user offline experience is deferred.

## Later, only if it earns its place

- Nutrition-label capture using browser camera APIs and Tesseract.js, with mandatory confirmation of every extracted value.
- User-initiated Google Drive backup to the private application-data area; no MacroMark account system.
- Shareable CSV export for a dietitian, coach, or spreadsheet workflow.

## Definition of done

A user can install MacroMark on a phone, create foods, record a full day in grams, inspect accurate macro and calorie totals, lock the day, close the app, return later, and export or restore their data without creating an account.
