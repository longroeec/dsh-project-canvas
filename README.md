# Project Canvas

A DeepSeek Harness bundle that brings the Project Canvas boards into the Web GUI and gives the agent canvas tools. Interaction follows the desktop app; notes add an explicit optional title.

## What it adds

- **A full page** in the main column, opened from the **Canvas** icon in the left sidebar next to **Plugins**. The rail lists projects (filterable) and their boards; the canvas draws notes with the first-version card look (a plain surface with a colour stripe down the left edge), connections as typed curves, and groups as dashed frames.
- **Notes**: double-click empty space to create a note centred on the pointer, or use **New note** for the viewport centre. Double-click a note (or press F2) to edit it **in place**: the card opens a title field and a body field. The title is optional and stored separately from the body; leaving both empty and committing removes the note. Editing opens a note window: a header tinted with the note's colour carrying new-note, more (delete) and close controls; a large body that starts focused; and a bottom row of colour swatches that recolours the note live. `Ctrl+Enter` commits, `Esc` cancels, and clicking away commits; the card shows the chosen colour as a header band that carries the note title, and colours are also available from the note's context menu.
- **Canvas**: blank drag pans, Shift+drag marquees, middle-drag or Space+drag also pans, Ctrl+click toggles selection, and `Ctrl+0` fits the content. The wheel resizes a single selected card, `Ctrl`+wheel zooms at the cursor (0.1×–4×), and `Shift`+wheel pans horizontally.
- **Connections**: click a selected note's edge dot, choose a line type and colour (defaults: main thick 1, black), then click the target note; the nearest edge attaches and the label is drawn on the curve. Double-click or right-click a connection to edit or delete it. To reattach one end, drag it from the end region (the outer quarter of the curve) onto another note; the floating end snaps to that note's nearest edge. Parallel connections between the same notes are allowed.
- **Groups**: group the selection with the toolbar or `Ctrl+G`; the new group is selected with its notes. Drag a group by its title bar to carry its notes, double-click inside a group to collapse or expand it, and Delete removes the group while keeping the notes.
- **Projects**: create (name defaults to `Project HHmmss`), rename, or delete from a project's `⋯` menu; the project filter narrows long lists.
- **Search** covers the current project's note titles and bodies (limit 50), auto-opens a single hit, and flashes the located note.
- **Recycle bin** lists deleted notes with their board and deletion time, newest first (limit 200), and restores a note together with connections whose other end is still live.
- **Undo/redo** (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) for notes, connections, and groups; the stack clears when the board changes. Copy and paste (`Ctrl+C` / `Ctrl+V`) duplicate notes with the connections whose both ends are selected.
- **Agent tools** on the same data: `project_canvas_list`, `project_canvas_read`, `project_canvas_search`, `project_canvas_create_note`, `project_canvas_update_note`, `project_canvas_delete_note`, `project_canvas_connect`, `project_canvas_connection`, `project_canvas_group`, `project_canvas_project`, `project_canvas_recycle`.
- Both surfaces call one Host implementation, so tool writes and page edits share the same rules.

## Where the data lives

The plugin owns its database; it no longer depends on the desktop app to run.

- Default file: `$DSH_HOME/project-canvas/canvas.db` (usually `~/.dsh/project-canvas/canvas.db`), created with the full schema on first use.
- **First run migrates your boards**: when the store is empty and the desktop database `%LocalAppData%\ProjectCanvas\app.db` exists, its rows are imported once. The desktop file is opened read-only and never modified.
- The schema mirrors the desktop v5 tables, so notes stay `Idea` rows with the same timestamp format and `nodes_fts` index.
- The data file is portable: copying `canvas.db` to another machine (or pointing `dbPath` at a synced folder) carries every project, board, note, connection, and group. The `project_canvas_storage` tool and the rail footer show the active file, and `action: "import"` imports another database into an empty store.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `dbPath` | empty | Absolute path of the plugin's `canvas.db`. Empty uses `$DSH_HOME/project-canvas/canvas.db`. Point it at a synced folder to use the same boards on several computers (close DSH on the other machine before switching). |
| `legacyDbPath` | empty | Desktop database to import on first run and by `project_canvas_storage` import. Empty uses `%LocalAppData%\ProjectCanvas\app.db`. |
| `lock` | true | Cross-machine lock beside the database (`<dbPath>.lock`). Keep it on when the file is in a synced folder; turn it off only for a single-machine setup. |

Both can also be set through `PROJECT_CANVAS_DB` and `PROJECT_CANVAS_LEGACY_DB`. If you keep two machines in sync, use a single-writer habit: DSH caches nothing, but two running copies can still overwrite each other's last write.

## Moving to another computer

1. Install the bundle there (market entry, `npm i`-style spec, or a Git install of this package).
2. Copy `canvas.db` into `~/.dsh/project-canvas/` (or set `dbPath` to the copied file, or to a synced folder used by both machines).
3. Open the Canvas page: projects and boards are read from that file.

## One shared database on several computers (OneDrive and similar)

A database file in a synced folder lets an office and a home machine use the same boards. It is **not** real-time collaboration, and SQLite in a cloud folder needs care:

1. On the first machine set `dbPath` to a synced path, for example `C:\Users\you\OneDrive\dsh-canvas\canvas.db` (or `PROJECT_CANVAS_DB`). The plugin creates the file there and imports the desktop database once.
2. Install the bundle on the second machine and point `dbPath` at the same synced file.
3. **Edit on one machine at a time.** The session that opens the file writes `<dbPath>.lock` with its host name and a heartbeat. The other session can read, but shows a warning bar and refuses writes until the first closes or the lock expires (10 minutes without a heartbeat for a crashed session).
4. Let the sync client finish before switching machines, and close DeepSeek Harness normally so the lock is released. Do not power off in the middle of a write.

Limits and recovery:

- A cloud client can upload a half-written file. The plugin runs `PRAGMA quick_check` on open and reports `DB_CORRUPT` instead of writing over a damaged file; restore an earlier version from the sync service's version history.
- If the service creates a conflict copy (`canvas (1).db`), both machines wrote independently and the plugin does not merge them. Keep the newer file, point `dbPath` at it, and discard the other.
- For a fully manual transfer, use `project_canvas_storage` (`export`/`import`) or copy the file while DSH is closed.
- After a crash the lock can outlive the session for up to 10 minutes; if you are certain no other machine has the file open, delete `canvas.db.lock` and refresh.
- Set `lock: false` only for a single-machine setup; it disables the cross-machine warning and refusal.

## Privacy

- The published package contains code, locales, README, and the icon only; `.gitignore` keeps `canvas.db`, attachments, and logs out of the repository.
- Canvas data stays in the local database (`~/.dsh/project-canvas/canvas.db`). The plugin makes no outbound network request: the page calls its own Host routes, and the Host only reads and writes that local file.
- Data reaches other people only when you share it: agent tools return note text into the conversation, which your configured model provider receives like any other message; copying or syncing `canvas.db` moves the boards to wherever you put the file.
- The Canvas page and its API sit behind the harness connection fence, which rejects unauthenticated requests. Exposing the harness web server beyond loopback is a separate decision and applies to every page, not only this plugin.

## Publishing to a plugin market

DSH has no built-in store: a market is an index JSON that a user adds under **Plugins → Discover**. This package is already prepared for publication:

- name `dsh-project-canvas`, `license: MIT`, `engines.dsh`, `repository`, `homepage`, `author` set in `package.json`;
- `pnpm pack` contains only runtime files (`index.js`, `client.js`, `lib/`, `locale/`, `icon.svg`, `cordis.patch.yml`, `README.md`, `LICENSE`);
- a ready-to-fill index lives in [`market/index.example.json`](market/index.example.json) and validates against DSH's format-1 validator;
- step-by-step push instructions are in [`docs/PUBLISH.md`](docs/PUBLISH.md).

The index entry that matters:

```json
"versions": [
  {
    "version": "0.1.0",
    "publishTimestamp": 1795690329,
    "engines": { "dsh": ">=0.2.2-rc.5 <1.0.0" },
    "source": {
      "type": "git",
      "url": "https://github.com/<your-user>/dsh-project-canvas",
      "commit": "<40-hex-sha>"
    }
  }
]
```

`publishTimestamp` is **Unix seconds**, not milliseconds. For npm, use `"source": { "type": "npm" }` and keep `version` equal to the published package. Git installs update only from the same repository and path, so each release needs a new commit and a new index entry.

## Note title and body

The desktop app has no title field: it always derives `nodes.title` from the first 24 characters of the body. This plugin stores **an independent, optional title** in the same column:

- typing a title saves it verbatim (capped at 200 characters, never ellipsized);
- editing the body never changes the title;
- clearing the title field stores an empty title;
- rows written by the desktop app with a derived title (body prefix) are recognised and shown as untitled, so old boards do not show the same text twice. Saving such a note normalises its stored title to what you typed.

## Deliberate differences from the desktop app

- **Titles are explicit and optional** (see above); the desktop app derives them from the body.
- **No sub-board creation or entry**: sub-boards are listed in the rail and can be opened there, but a note that points at one is not navigable.
- **Copy/paste uses an in-memory clipboard**, because the browser cannot write the desktop app's custom clipboard format.
- **Structured legacy notes** (document, media, or sub-board payloads) are shown as readable text and are read-only here.
- **Undo covers group creation and deletion too**, and a multi-note drag is one undo step; the desktop app leaves group operations outside its stack.
- The project star/favourite toggle is not shown, matching the desktop UI.

## Verification

Checked locally against a copy of a real database: projects, notes (independent title/body, empty notes, batch moves), connections (parallel allowed, endpoint reattach, width/dash/label data), groups, recycle restore, camera, FTS sync, foreign keys, operation history, all five HTTP routes with their error codes, and all eleven tool definitions. The client parses, its slot registration is tested, and route liveness is confirmed. Rendered interaction and the Plugins-page icon are not verified here.
