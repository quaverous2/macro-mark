# MacroMark

**Mark food. Track macros.**

MacroMark is a calm, local-first nutrition tracker for people who want to know what they ate without turning food tracking into a second job. It records saved foods by weight, calculates daily carbohydrate, fat, protein, salt, and calories, then preserves a day as a locked record.

There are no feeds, coaching, recipes, streaks, advertisements, calorie-deficit advice, or required MacroMark account.

## The product

Nutrition values are stored per 100 g. Logging a food is deliberately simple:

1. Choose a saved food.
2. Enter the amount eaten in grams.
3. See its calculated macros and the running daily total.

Calories are calculated consistently from macros:

`carbohydrates × 4 + protein × 4 + fat × 9`

Users can set macro targets, switch between target presets (for example, training and rest days), and see their progress for the day. When the day is complete, **Lock day** stores an immutable snapshot in the history. A later edit to a food must never alter a locked day.

## Planned scope

### Version 1

- Create, edit, archive, and search a personal food library.
- Store carbs, fat, protein, salt, and optional notes per 100 g.
- Log a food to today in grams; calculate totals and calories immediately.
- Create and select macro-target presets.
- Lock a day and browse its historical totals and entries.
- Install the app on a phone and use it offline.
- Export all data as JSON and a day/history summary as CSV; import a JSON backup.

### Later, only if it earns its place

- Scan a nutrition-label photo, extract candidate values, and require the user to confirm every field before saving.
- Optional Google Drive backup, initiated by the user. This uses the user's Google account and stores one private backup file in Google Drive's application-data area; MacroMark does not run its own user-account system.
- Optional shareable CSV export for a dietitian, coach, or spreadsheet workflow.

Google Sheets is not the primary store. It is useful as an export destination, but it is too easy to break with manual edits and makes offline phone use worse. A versioned JSON backup is the reliable source of truth.

## Chosen stack

MacroMark will be a **local-first Angular PWA**. This is the best trade-off between a credible addition to a Java/Angular engineering profile, easy phone deployment, and private no-account use.

| Concern | Choice | Why |
| --- | --- | --- |
| Application | Angular with TypeScript, standalone components, signals, strict typing, and reactive forms | Reinforces a production Angular profile while using modern Angular patterns. |
| Phone experience | Angular PWA / service worker and Web App Manifest | Opens from a link, installs to iOS/Android home screens, and works offline. No app-store release is needed for personal use. |
| On-device persistence | IndexedDB via Dexie | Stores foods, daily entries, targets, and locked-day snapshots in the browser; more robust than localStorage. |
| Label capture | Browser camera APIs and Tesseract.js, later | Keeps label images and OCR processing on-device by default. Extracted values remain editable because OCR is not trusted data. |
| Validation | Zod schemas shared around imports and persistence boundaries | Prevents invalid backup files or partially recognised labels from corrupting local data. |
| Testing | Vitest for calculation and persistence logic; Playwright for critical user flows | The calculation rules and “lock day” immutability are the product's highest-risk behaviour. |
| Quality | ESLint, Prettier, strict TypeScript, GitHub Actions | A readable, automated project is more valuable to a hiring manager than unnecessary infrastructure. |
| Deployment | Cloudflare Pages or GitHub Pages | Static hosting, HTTPS, and simple continuous deployment. The installed app works without a backend. |
| Backup, later | Google Drive API with OAuth, restricted to the Drive app-data folder | Optional user-controlled backup without collecting credentials or operating a MacroMark account database. |

## Architecture principles

- **Local first:** the core product works without sign-in or an internet connection.
- **User owns the data:** JSON export/import is available before third-party backup integration.
- **Locked means immutable:** historical nutrition is copied as a snapshot, not recalculated from a changing food library.
- **OCR assists; it never decides:** all scanned values must be reviewed by the user.
- **No premature backend:** a Spring Boot API, PostgreSQL, Docker, and cloud infrastructure are intentionally deferred. They add operational work but do not improve the v1's core single-user experience.

## Future evolution

If people genuinely need cross-device live synchronisation or household sharing, add a Spring Boot API with PostgreSQL and an authenticated sync layer. That would be a separate product decision, not a requirement for a personal tracker. The first release should prove the core workflow before accepting the cost and privacy responsibilities of a backend.

## Definition of done for the first release

A user can install MacroMark on a phone, create foods, record a full day in grams, inspect accurate macro and calorie totals, lock the day, close the app, return later, and export or restore their data without creating an account.
