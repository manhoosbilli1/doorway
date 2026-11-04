# Doorway

A private reading and research workspace, deployed on Sites using React, Vinext, Cloudflare D1 and R2. No Supabase or Vercel account is needed for the hosted version. The application source is open; hosted books, files and records are private and scoped to the signed-in user.

## Live app

https://doorway-reading-shoaib.krish-shoaib55.chatgpt.site

Sign in with the ChatGPT account that owns the Site. Upload a book PDF from **Add book**, then choose **Read** and write your reason for opening it. The book at the right edge opens a reading companion with books, chapter notes and research tools. Hover to open, move away to close, or pin it. Tap it on touch devices. Use **End session** to record reading duration. Uploads support PDF, DOCX, DOC, TeX and TXT, up to 512 MB per file (chunked uploads).

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


## Candlelit reading

Workspaces default to a dark, warm reading atmosphere with soft page edges, a pointer-following pool of light, subtle firelight and drifting embers. Nearby text remains visible. Reading uses native scrolling and the existing bounded PDF renderer; pointer lighting updates CSS without rerendering PDF pages. The reading companion opens like a book and supports touch, keyboard focus, Escape and pinning. It contains controls for candlelight, motion and light size; settings are saved per workspace. Reduced-motion preferences disable the ambient and opening animations. Motion also pauses while the page is hidden. Focus follows the pointer or selected book, not gaze. The fire is a stylized CSS effect, without audio or video.

This update passes 18 automated geometry, component and saving tests plus TypeScript and the production build. Browser visual and frame-rate QA remains blocked by the saved browser permission policy. These checks do not establish a frame-rate guarantee on Safari, mobile or lower-memory devices.


## The reading room

The library is now an illustrated oak room with an animated rocking chair, reader and cat, drifting embers and shimmering hearth light. Interactive leather book spines represent the actual library and keep the reading-intention step. Atlas contains navigation; Housekeeping contains search, filters and room motion. Other pages and dialogs use a parchment folio theme. The Reading companion contains workspace management and layout, and each PDF has a This volume book with page navigation, zoom, annotations and closing controls. Persistent reader bars have been removed.

Closing a book or ending a session plays a hand-and-cover gesture followed by a return to the room. Closing the currently reading book also logs its active session; returning to the room preserves other open books and saved positions. Repeated closing gestures are guarded. Reduced-motion preferences skip the closing animation and pause room motion; motion can also be paused manually. The artwork is generated raster art with lightweight CSS animation, not a rendered 3D environment or a video. There is no fireplace audio.

Artwork is stored as encoded WebP source under assets/room and decoded during predev/prebuild by scripts/copy-room-assets.mjs. The three optimized assets total approximately 410 KiB. Their original prompts are recorded in the delivered doorway-artwork.md. Browser visual and frame-rate checks remain unavailable under the saved browser permission policy.


## Shelves, notes, bookmarks and folder import

Choose **Import a folder** from the shelf or Housekeeping, then select a folder containing PDFs and EPUBs. Import runs sequentially in the signed-in browser, including subfolders. It reports errors, skips matching names and sizes, checks existing records conservatively, and pauses on a sync error. Files larger than 512 MiB and formats other than PDF/EPUB are not imported. Keep the tab open; you can stop after the current book and resume later. The application cannot choose the local folder without the browser's file-picker action. PDFs and EPUBs remain private in R2, not GitHub.

Shelves group by genre and each spine opens its book. The intention prompt is non-blocking and saved with the session. PDF page bookmarks appear as folded corners and can be jumped to from This volume. EPUBs are read section by section; progress and bookmarks therefore refer to sections, not printed page numbers. EPUB images are bounded per section, active content is sanitized, and simultaneous large EPUB readers are queued to limit memory. EPUB rendering supports bookmarks and linked notes; PDF-specific passage highlights and movable sticky overlays are not available in EPUBs.

Writing desk provides in-place formatted editing backed by Markdown, with standalone notes or notes associated with a book and page. It supports common headings, lists, emphasis, quotes and code; complex Obsidian plugins and advanced Markdown are outside the current editor. Notes can be downloaded as .md files. Firelight follows only the last-focused book.

Validation includes format and metadata checks on first, middle and last sections of all 19 local EPUBs, 60 PDF.js renders across six real PDFs, simulated component tests, API tests and a production build. Browser interaction, animation and performance testing remains blocked by the saved browser permission policy.


PDF text selection uses the PDF text layer. The reader captures selections on adjacent rendered pages as page-relative highlight rectangles, with a message when a page has no selectable text. Image-only scanned pages need OCR before text can be selected; OCR is not included. Browser-origin permission restrictions prevented end-to-end mouse and touch verification.


For scanned or otherwise unselectable PDF pages, use **This volume → Mark an area** and drag over the passage. Enter the question and, optionally, a transcription or comment; the marked rectangle is saved with the book and remains aligned when zooming. This does not perform OCR or make the image text selectable. Press Escape or choose Cancel to leave marking mode.

## Fitted cabinets and movable sections (November 2026)

The default library places live book spines inside the ten compartments of the original room painting. Books keep matching leather bindings and consistent proportions; hover or keyboard focus reveals the full title and cover. **Look closer** enlarges the room, with horizontal panning on narrow screens. Cabinet pages limit the visible shelf contents to 160 volumes. **Arrange** supports dragging into a section or before another volume, as well as dropdown controls for touch and keyboard. Section names and order can be changed; moving a volume does not change its bibliographic genre. Personal Markdown notebooks and chapter notes have their own shelf volumes and share the opening sequence. The selected Markdown note is remembered across sessions.

The illustrated reader rises, walks toward the selected shelf, reaches, returns with a book and opens it. The viewport pans on narrow screens. Closing places a remembered volume on the side table, which can reopen it. Chair rocking and cat-petting resume. This uses generated sprite artwork and CSS, not a physically simulated 3D human. **Skip animation**, Room motion, and the operating system's reduced-motion preference avoid the longer sequence. The earlier pre-genre shelf presentation is preserved under **Housekeeping → Library presentation → Earlier book presentation**.

Dropping a book requires a reason and removes it from shelves, all reading workspaces and the side table. Its record, bookmarks and notes remain in **Atlas → Dropped**, where it can be restored. Reimporting an already-dropped file does not put it back on the shelf.

Folder import accepts a selected folder or a folder dropped onto its dialog, reads every subfolder batch, and reports file and upload progress. Already-present files are skipped quickly; metadata rechecking is an optional checkbox. To resume after interruption, select the same folder again. An interrupted individual upload restarts; resumability is at completed-book level. Selecting files in the signed-in app is still required; this release did not bulk-upload the owner's local library on their behalf.

Current validation: 58 automated checks pass, including real PDF text layers, all 19 local EPUBs, a 10,007-volume shelf model, bounded cabinet pages, moves, section editing, dropped-book preservation, saved notebook opening, folder traversal, and animation cancellation/reduced motion. Local authenticated API checks verify section/order/table/note persistence and revision protection. TypeScript and production packaging are checked during publication. Actual browser visual, drag, scrolling and frame-rate QA remains unavailable because of the saved browser access restriction; no smoothness guarantee is implied.
