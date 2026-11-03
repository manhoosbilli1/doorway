# Doorway — private reading & research workspace

A React/Vite reading workspace with a multi-PDF reader, reading logs, chapter notes, book classification, lecture tracking, and project journals.

## Quick start

```bash
npm install
npm run dev
```

Without environment variables, Doorway runs in **local demo mode**; data stays in the browser and does not sync between devices. Local file uploads are stored as data URLs in browser storage and are therefore intended only for small test files. For real PDFs use cloud mode.

## Private 24/7 deployment

1. Create a free Supabase project. In SQL Editor run `supabase/schema.sql`.
2. Under Authentication, configure email sign-in and add your Vercel deployment URL to allowed redirects. For single-person use, disable public signups or restrict sign-in externally; email OTP alone does not enforce a single permitted user. RLS restricts each user's records.
3. Add environment variables (`.env.example`) to local `.env` and to Vercel project settings.
4. Push this repo to a **private** GitHub repository and import into Vercel. Framework Vite, build `npm run build`, output `dist`.
5. Upload book PDFs to private Supabase Storage. Alternatively, provide a direct raw URL to a PDF hosted by GitHub. **GitHub raw links to private repositories are not usable directly by the client PDF viewer; public raw links are publicly accessible.** For private books, use Supabase Storage instead.

## Implemented

- Book lists: all, wish list, in progress, completed, dropped; ratings, reasons for dropping, completion notes, difficulty/length and foundational/commentary/reference classification.
- Domain and 5-level difficulty view; reading progress per PDF page; document cover from URL.
- Session entry intention, start/end time and duration log; multiple readers (up to six), remembered pages, selectable PDF text and saved excerpts, question/answer/sticky notes.
- Chapter notes (plain text, PDF, DOCX, TeX); original/corrected exercise files; lectures with mandatory linked book; video progress reflection; project research notes and outcomes.
- Cloud email auth, per-user workspace records, private file bucket, right-edge hover dock, zoom keyboard shortcuts.

## Current limitations

- The PDF viewer highlights selected passages **as saved quote annotations**, not permanent colored PDF overlay coordinates.
- The PDF renderer displays pages; huge scanned books and six open documents can consume substantial memory.
- Legacy DOC is uploadable but does not render in Quick Look. DOCX and TeX previews are basic, without full Word or LaTeX typesetting.
- `beforeunload` dialogs cannot reliably request custom text or save large documents; lecture reflection is prompted on return/resume, and changes auto-save.
- Cross-device live conflict resolution is not implemented. Last writer wins; avoid parallel editing on multiple devices.
- Ten-page completion notes are not validated by page count; approximately 3,000 words are enforced.
- Magnifier is zoom in/out rather than a floating macOS lens.
- Lecture URLs open in a separate browser tab; sites can prevent embedded playback.

## Shortcuts

`Ctrl/Cmd + K`: focus search; `Ctrl/Cmd + =`: zoom in PDF; `Ctrl/Cmd + -`: zoom out; `Esc`: dismiss dock. Hover at the right edge in focus mode for the dock.

## Files

`src/App.jsx`: interface and reading behavior. `src/store.js`: local/cloud persistence and uploads. `supabase/schema.sql`: database and private storage policies.
