# Doorway reading studio

The reading companion now contains the workspace name editor and searchable, subject-grouped book picker. Each picker item and shelf preview shows reading progress; spines carry a small progress line. Library titles are cleaned without modifying original documents. Shelf placements are recorded before metadata changes can reorder them; leather poses are deterministic from each volume's ID.

## Page tools (PDFs)

The floating palette supports V to select/scroll, P for persistent pressure-sensitive ink, L for an ephemeral fading laser, E for whole-stroke/object erasing, and H for explicit text highlighting. A rectangle marker supports scanned pages without OCR. Saved highlights can stand alone or answer a question. Ctrl/Cmd-Z undoes new page annotations; Shift adds redo. Undo history lasts for the open pane; the annotations themselves persist.

Drop or paste pictures on a page, or use the attachment button for images and videos. Drag their header, resize the corner, or use the keyboard arrows on these handles. Files are private, served with byte ranges, and tied to book/page records. Video decoding remains browser/codec dependent; H.264 MP4 and WebM are the recommended formats. Video positions are checkpointed; playback is never started automatically.

Equation objects support 1D vector fields, 2D functions and vector fields, 3D surfaces and vector fields, vector systems, complex curves and mappings. Edit the caption to choose a mode and equation. Scroll the graph to zoom; drag a 3D graph to rotate. Parameters a, b, c, positions, dimensions and hue are editable and wheel-adjustable. The interpreter has no eval, property access, imports, or assignments; expression and sampling budgets are bounded. Numerical calculus is approximate.

The calculator includes RAD/DEG, inverse/hyperbolic trigonometry, powers, logarithms, factorials, permutations/combinations, complex numbers, numerical differentiation/integration, statistics, memory and history. It is an original calculator UI, not an emulator of a particular TI or Casio model.

## Room

The whiteboard below the room has handwritten editable sticky notes, deadlines, completed tasks, recent reading and a seven-day active reading breakdown by book and subject. Completed tasks move to a tray and hide after two days; the archive toggle restores their visibility. The timer counts only the active book in a visible, focused window, pauses after two idle minutes, and can be paused manually. It estimates attention from browser interaction rather than claiming gaze detection. Historical wall-clock sessions are labeled separately.

Room sounds are opt-in. Hearth crackles and original gentle keys, water, and noise are synthesized locally. Personal audio uploads and an editable direct radio stream are also supported. Default radio is SomaFM Groove Salad for this private personal installation; see https://somafm.com/groovesalad/directstreamlinks.html before any public reuse. Synthesized sounds pause in a hidden tab. Crackle events animate the glow; reduced-motion settings disable motion.

## Storage and validation

Workspace payloads over 1.5 MB move to private R2 snapshots with a D1 revision pointer; small records retain the existing schema. Compare-and-swap saves prevent concurrent overwrites and retain two previous large snapshots during reads. The existing 8 MB workspace request limit still applies, with an explicit export/cleanup error. Uploaded media does not count against that JSON limit. No schema migration is needed.

Automated checks cover existing import/PDF/EPUB behavior, selection geometry, pressure/laser/eraser handling, undo/redo, lazy annotation canvas memory, equations and numerical results, time accounting, shelf stability, and whiteboard persistence. Local authenticated integration checks cover >2 MB annotation round-trips, concurrent saves, media MIME/ranges and access control. Browser visual, physical pen, touch latency, animation quality and actual video playback are not verified because browser access remains blocked by the session's saved policy.
