# Doorway

A private reading and research workspace, deployed on Sites using React, Vinext, Cloudflare D1 and R2. No Supabase or Vercel account is needed for the hosted version. The application source is open; hosted books, files and records are private and scoped to the signed-in user.

## Live app

https://doorway-reading-shoaib.krish-shoaib55.chatgpt.site

Sign in with the ChatGPT account that owns the Site. Upload a book PDF from **Add book**, then choose **Read** and write your reason for opening it. The right-edge dock adds up to six books, chapter notes, solutions and research annotations. Use **End session** to record reading duration. Uploads support PDF, DOCX, DOC, TeX and TXT, up to 512 MB per file (chunked uploads).

## Development

Requires Node 22.13 or later.

```sh
npm ci
npm run dev
```

The Sites starter supplies a mock identity for local previews. Apply local D1 migrations before using the preview:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_nervous_night_thrasher.sql
```

Consult the starter's preview scripts/configuration for the current local D1 command. Production authentication is enforced by Sites and every API checks the signed-in user. SQL migrations under `drizzle/` are applied by Sites during publication. Build with `npm run build`. Production publication uses the Sites workflow; a GitHub commit alone does not deploy the Site.

## Data protection

D1 stores workspace records with a revision number; stale writes receive HTTP 409 rather than overwriting another device's data. Edits are backed up in browser storage, saves are serialized, and the UI provides an export on failure. Reload after a conflict. Files are stored privately in R2 and served only under the signed-in user's key. User-supplied DOCX previews are sanitized. Never put books, private notes, credentials or environment files in this source repository.

## Features and limits

Library categories, domains and levels, progress, covers, ratings, mandatory completion reflection, reading intentions and logs, multi-book reading, chapter notes, original/corrected solution comparison, question/passage/comment annotations, lecture references and reflections, and research journals are included.

Selected answers now draw saved page overlays. Movable sticky notes use normalized page coordinates. Named workspaces preserve books, fractional scroll positions, zoom, layout, writing and attached notes. PDF rendering is virtualized and canvas resolution bounded. Metadata comes from PDF information, ISBN/title lookup through Open Library, or a first-page cover fallback. Remaining limits: the magnifier is page zoom; TeX previews show source rather than compiled mathematics; legacy DOC needs conversion for preview; lecture links open externally; completion uses a 3,000-word approximation of ten pages. Concurrent edits are detected, not automatically merged. Very large PDFs or six readers can use substantial memory. The first release should be treated as an initial usable version, not a claim that every item in the original brief is finished.

The original implementation notes are preserved in `ORIGINAL-README.md`.

## Reader verification

Run `node --test tests/core.test.mjs tests/components.test.mjs` and `node tests/api-smoke.mjs` with the local preview running. For real-book rendering, set `DOORWAY_TEST_BOOKS` to a local Books folder and run `node tests/pdf-stress.mjs`. Test books are never committed.

Verification for this release: 16 geometry/component/save tests passed; private API smoke tests passed; six actual PDFs (101–1,448 pages, including a 101 MB upload) loaded concurrently and 60 sampled pages rendered successfully using PDF.js 6.3.289. Corrupt PDF rejection and a synthetic mixed-size 1,000-page PDF passed. Open Library returned a real ISBN match with a cover and correctly returned no match for a fictional title. Browser interaction QA was blocked by the browser tool permission policy, even after user approval; native rendering and simulated component tests do not prove Safari scrolling performance.
