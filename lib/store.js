/**
 * ProjectCanvas data access for the Project Canvas plugin.
 *
 * The plugin owns its database (schema v5, mirroring the desktop app so legacy data imports
 * row for row):
 *  - `type` is the C# enum name, case-sensitive (`Idea`) — legacy rows keep theirs;
 *  - timestamps are `DateTimeOffset` "O" strings with seven fractional digits and `+00:00`;
 *  - deleting is a soft delete through `deleted_at`;
 *  - `nodes_fts` is not trigger-driven, so it is maintained inside the same transaction;
 *  - the file uses the rollback journal (not WAL): keep transactions short and never change it.
 */

import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { CanvasLock } from './lock.js'
import { blocksOf, decode as decodeBody, encode as encodeBody, plainOf } from './blocks.js'
import { ensureSchema } from './schema.js'

/** Idea notes are the only node type the desktop app still renders as a note. */
const NODE_TYPE = 'Idea'
const DEFAULT_WIDTH = 220
const DEFAULT_HEIGHT = 120
const TITLE_LIMIT = 24
const BUSY_TIMEOUT_MS = 5000

/** Relation labels the desktop app itself writes for a new connection. */
const RELATION_LABELS = {
  MainThick1: '主线',
  MainThick2: '主线2',
  MainThick3: '主线3',
  Branch: '支线',
  References: '引用',
  Related: '关联',
}
const RELATIONS = Object.keys(RELATION_LABELS)
const ANCHORS = ['Top', 'Right', 'Bottom', 'Left']

/** Default database path the desktop app creates (import source only). */
export function defaultDbPath() {
  const localAppData = process.env.LOCALAPPDATA
  if (localAppData) return join(localAppData, 'ProjectCanvas', 'app.db')
  return join(homedir(), 'AppData', 'Local', 'ProjectCanvas', 'app.db')
}

/** Where the plugin keeps its own canvas database. */
export function defaultPluginDbPath() {
  const home = process.env.DSH_HOME && String(process.env.DSH_HOME).trim() !== ''
    ? String(process.env.DSH_HOME)
    : join(homedir(), '.dsh')
  return join(home, 'project-canvas', 'canvas.db')
}

/** Timestamp in the exact shape the desktop app writes and sorts on. */
export function appTimestamp(date = new Date()) {
  const iso = date.toISOString()
  return `${iso.slice(0, 19)}.${iso.slice(20, 23)}0000+00:00`
}

/** Title the desktop app derives from a note body (used only to recognise legacy rows). */
export function titleFor(text) {
  const chars = [...String(text ?? '').trim()]
  if (chars.length <= TITLE_LIMIT) return chars.join('')
  return `${chars.slice(0, TITLE_LIMIT).join('')}…`
}

/** Titles are user text now: trim and cap, never derive or ellipsize. */
function truncateTitle(text) {
  return [...String(text ?? '').trim()].slice(0, 200).join('')
}

/** Body text the app stores in the FTS index: the raw content with JSON punctuation blanked. */
function ftsBody(content) {
  return String(content ?? '').replace(/"/g, ' ').replace(/[{}\[\]]/g, ' ')
}

/** Compact note text for listings. */
function clip(text, max = 160) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim()
  return value.length <= max ? value : `${value.slice(0, max)}…`
}

export class CanvasStoreError extends Error {
  constructor(message, code = 'PROJECT_CANVAS_ERROR') {
    super(message)
    this.name = 'CanvasStoreError'
    this.code = code
  }
}

/**
 * Lazily opened connection to the plugin's canvas database.
 * A missing file is created with the full schema; when `legacyPath` names a desktop database,
 * its rows are imported once into the new, empty store so existing boards carry over.
 * A failure closes the handle so the next call retries with a clean one.
 */
export class CanvasStore {
  /**
   * @param {string} dbPath absolute path to the plugin database
   * @param {{ create?: boolean, legacyPath?: string, autoImport?: boolean, lock?: boolean, host?: string, staleMs?: number }} [options]
   */
  constructor(dbPath, options = {}) {
    this.dbPath = dbPath
    this.create = options.create !== false
    this.legacyPath = options.legacyPath
    this.autoImport = options.autoImport !== false
    this.useLock = options.lock !== false
    this.host = options.host
    this.staleMs = options.staleMs
    this.lockedBy = undefined
    this.lock = undefined
    this.handle = undefined
  }

  get() {
    if (this.handle !== undefined) return this.handle
    const isEmptyFile = !existsSync(this.dbPath)
    if (isEmptyFile && !this.create) {
      throw new CanvasStoreError(
        `Canvas database not found at ${this.dbPath}. Set the plugin's dbPath config, or import an existing Project Canvas database.`,
        'DB_NOT_FOUND',
      )
    }
    let db
    try {
      if (isEmptyFile) mkdirSync(dirname(this.dbPath), { recursive: true })
      // `timeout` arms SQLite's busy handler.
      db = new DatabaseSync(this.dbPath, { timeout: BUSY_TIMEOUT_MS })
      db.exec('PRAGMA foreign_keys = ON')
      const hasSchema = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'projects' LIMIT 1").get()
      if (hasSchema === undefined) {
        if (!this.create) {
          throw new CanvasStoreError(`The file at ${this.dbPath} is not a canvas database`, 'DB_INVALID')
        }
        ensureSchema(db)
      }
      const integrity = db.prepare('PRAGMA quick_check').get()
      const status = Object.values(integrity ?? {})[0]
      if (status !== 'ok') {
        throw new CanvasStoreError(
          `The canvas database at ${this.dbPath} failed its integrity check. Restore a previous version from the sync folder's history, or point dbPath at another file.`,
          'DB_CORRUPT',
        )
      }
    } catch (error) {
      try { db?.close() } catch { /* the handle never became usable */ }
      if (error instanceof CanvasStoreError) throw error
      throw new CanvasStoreError(`Cannot open ${this.dbPath}: ${error.message}`, 'DB_OPEN_FAILED')
    }
    this.handle = db
    // A database in a synced folder may be open on another machine: take the cross-machine lock.
    if (this.useLock) {
      this.lock = new CanvasLock(this.dbPath, { host: this.host, staleMs: this.staleMs })
      const result = this.lock.acquire()
      if (!result.ok) this.lockedBy = result.owner
    }
    // Carry an existing desktop database over, once, into the new empty store.
    if (this.lockedBy === undefined && this.autoImport && this.legacyPath !== undefined && existsSync(this.legacyPath)) {
      try {
        if (this.listProjects().length === 0) this.importLegacy(this.legacyPath)
      } catch {
        // A failed or partial import must not make the plugin unusable.
      }
    }
    return db
  }

  /** Re-check the cross-machine lock; a released or expired lock is taken over here. */
  refreshLock() {
    if (!this.useLock || this.handle === undefined) return
    this.lock ??= new CanvasLock(this.dbPath, { host: this.host, staleMs: this.staleMs })
    const result = this.lock.acquire()
    this.lockedBy = result.ok ? undefined : result.owner
  }

  /** Storage facts for the UI and the agent. */
  storageInfo() {
    if (this.handle !== undefined) this.refreshLock()
    let projects = 0
    let notes = 0
    try {
      projects = this.listProjects().length
      notes = this.query('SELECT COUNT(*) AS count FROM nodes WHERE deleted_at IS NULL')[0]?.count ?? 0
    } catch {
      // A missing or unreadable store reports zeroes instead of failing the page.
    }
    return {
      dbPath: this.dbPath,
      legacyPath: this.legacyPath ?? null,
      legacyAvailable: this.legacyPath !== undefined && existsSync(this.legacyPath),
      projects: Number(projects),
      notes: Number(notes),
      lockedBy: this.lockedBy ?? null,
    }
  }

  /**
   * Copy every row from a Project Canvas desktop database into this empty store.
   * The source is opened read-only and never modified.
   */
  importLegacy(sourcePath) {
    if (!existsSync(sourcePath)) {
      throw new CanvasStoreError(`No database at ${sourcePath}`, 'DB_NOT_FOUND')
    }
    if (this.listProjects().length > 0) {
      throw new CanvasStoreError('This canvas store already has projects; import runs only into an empty store', 'TARGET_NOT_EMPTY')
    }
    const source = new DatabaseSync(sourcePath, { readOnly: true })
    try {
      const tables = ['projects', 'canvases', 'nodes', 'connections', 'groups', 'group_memberships', 'operation_history']
      const rows = {}
      for (const table of tables) {
        try {
          rows[table] = source.prepare(`SELECT * FROM ${table}`).all()
        } catch {
          rows[table] = []
        }
      }
      const counts = {}
      this.write((db) => {
        for (const table of tables) {
          const entries = rows[table]
          counts[table] = entries.length
          if (entries.length === 0) continue
          const columns = Object.keys(entries[0])
          const statement = db.prepare(
            `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          )
          for (const entry of entries) statement.run(...columns.map((column) => entry[column]))
        }
        // The FTS index is plugin-owned: rebuild it from the imported live notes.
        db.exec('DELETE FROM nodes_fts')
        const index = db.prepare('INSERT INTO nodes_fts(node_id, project_id, canvas_id, title, body) VALUES (?, ?, ?, ?, ?)')
        for (const node of rows.nodes) {
          if (node.deleted_at !== null) continue
          index.run(node.id, node.project_id, node.canvas_id, node.title ?? '', ftsBody(plainOf(node.content_json)))
        }
      })
      return { source: sourcePath, counts }
    } finally {
      try { source.close() } catch { /* already closed */ }
    }
  }

  close() {
    if (this.handle === undefined) return
    try { this.handle.close() } catch { /* already closed */ }
    this.handle = undefined
    this.lock?.release()
    this.lock = undefined
    this.lockedBy = undefined
  }

  /** Run `body` inside one write transaction; short by design (rollback journal). */
  write(body) {
    const db = this.get()
    if (this.lockedBy !== undefined) this.refreshLock()
    if (this.lockedBy !== undefined) {
      throw new CanvasStoreError(
        `Another session (${this.lockedBy.host}, pid ${this.lockedBy.pid}) is using this canvas database. Close DeepSeek Harness there, or wait for the lock to expire, then refresh.`,
        'SYNC_LOCKED',
      )
    }
    db.exec('BEGIN IMMEDIATE')
    try {
      const result = body(db)
      db.exec('COMMIT')
      return result
    } catch (error) {
      try { db.exec('ROLLBACK') } catch { /* the failed statement already ended it */ }
      throw error instanceof CanvasStoreError
        ? error
        : new CanvasStoreError(error.message, 'DB_WRITE_FAILED')
    }
  }

  query(sql, ...params) {
    try {
      return this.get().prepare(sql).all(...params)
    } catch (error) {
      // Keep storage-level failures (corrupt file, missing file, lock) identifiable.
      if (error instanceof CanvasStoreError) throw error
      throw new CanvasStoreError(error.message, 'DB_QUERY_FAILED')
    }
  }

  one(sql, ...params) {
    return this.query(sql, ...params)[0]
  }

  // ---------------------------------------------------------------- reads

  listProjects() {
    const rows = this.query(`
      SELECT p.id, p.name, p.description, p.is_favorite, p.updated_at,
             (SELECT COUNT(*) FROM canvases c
               WHERE c.project_id = p.id AND c.deleted_at IS NULL) AS canvas_count,
             (SELECT COUNT(*) FROM nodes n
               WHERE n.project_id = p.id AND n.deleted_at IS NULL) AS node_count
        FROM projects p
       WHERE p.deleted_at IS NULL
       ORDER BY p.is_favorite DESC, p.updated_at DESC`)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      favorite: Number(row.is_favorite) === 1,
      updatedAt: row.updated_at,
      canvasCount: Number(row.canvas_count),
      nodeCount: Number(row.node_count),
    }))
  }

  listCanvases(projectId) {
    const rows = this.query(`
      SELECT id, project_id, parent_canvas_id, owner_node_id, name, updated_at
        FROM canvases
       WHERE project_id = ? AND deleted_at IS NULL
       ORDER BY parent_canvas_id IS NOT NULL, name`, projectId)
    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      parentCanvasId: row.parent_canvas_id ?? null,
      ownerNodeId: row.owner_node_id ?? null,
      name: row.name,
      updatedAt: row.updated_at,
    }))
  }

  mainCanvas(projectId) {
    const row = this.one(`
      SELECT id, project_id, name, camera_x, camera_y, zoom
        FROM canvases
       WHERE project_id = ? AND parent_canvas_id IS NULL AND deleted_at IS NULL
       LIMIT 1`, projectId)
    return row === undefined ? undefined : this.canvasHeader(row)
  }

  canvas(canvasId) {
    const row = this.one(`
      SELECT id, project_id, parent_canvas_id, name, camera_x, camera_y, zoom
        FROM canvases
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`, canvasId)
    if (row === undefined) throw new CanvasStoreError(`Canvas ${canvasId} does not exist`, 'CANVAS_NOT_FOUND')
    return this.canvasHeader(row)
  }

  canvasHeader(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      parentCanvasId: row.parent_canvas_id ?? null,
      name: row.name,
      cameraX: Number(row.camera_x),
      cameraY: Number(row.camera_y),
      zoom: Number(row.zoom) || 1,
    }
  }

  nodes(canvasId) {
    const rows = this.query(`
      SELECT id, type, title, content_json, x, y, width, height, z_index, status, style_json,
             created_at, updated_at
        FROM nodes
       WHERE canvas_id = ? AND deleted_at IS NULL
       ORDER BY z_index, rowid`, canvasId)
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      content: decodeBody(row.content_json),
      blocks: blocksOf(row.content_json),
      x: Number(row.x),
      y: Number(row.y),
      width: Number(row.width),
      height: Number(row.height),
      zIndex: Number(row.z_index),
      status: row.status ?? null,
      accentKey: accentOf(row.style_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  connections(canvasId) {
    const rows = this.query(`
      SELECT id, source_node_id, target_node_id, relation_type, label, source_anchor, target_anchor,
             style_json, updated_at
        FROM connections
       WHERE canvas_id = ? AND deleted_at IS NULL
       ORDER BY rowid`, canvasId)
    return rows.map((row) => ({
      id: row.id,
      sourceNodeId: row.source_node_id,
      targetNodeId: row.target_node_id,
      relationType: row.relation_type,
      label: row.label ?? null,
      sourceAnchor: row.source_anchor,
      targetAnchor: row.target_anchor,
      strokeKey: strokeOf(row.style_json),
      updatedAt: row.updated_at,
    }))
  }

  groups(canvasId) {
    const rows = this.query(`
      SELECT id, title, x, y, width, height, collapsed, updated_at
        FROM groups
       WHERE canvas_id = ? AND deleted_at IS NULL
       ORDER BY rowid`, canvasId)
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      x: Number(row.x),
      y: Number(row.y),
      width: Number(row.width),
      height: Number(row.height),
      collapsed: Number(row.collapsed) === 1,
      memberIds: this.query(
        'SELECT node_id FROM group_memberships WHERE group_id = ? ORDER BY created_at', row.id,
      ).map((member) => member.node_id),
      updatedAt: row.updated_at,
    }))
  }

  /** Whole canvas graph: header, notes, connections, and groups. */
  graph(canvasId) {
    return {
      canvas: this.canvas(canvasId),
      nodes: this.nodes(canvasId),
      connections: this.connections(canvasId),
      groups: this.groups(canvasId),
    }
  }

  /** Text search over live notes, matching the app's LIKE behaviour. */
  search(text, { projectId, limit = 20 } = {}) {
    const needle = String(text ?? '').trim()
    if (needle === '') return []
    const pattern = `%${needle}%`
    const rows = projectId === undefined
      ? this.query(`
          SELECT n.id, n.project_id, n.canvas_id, n.title, n.content_json, c.name AS canvas_name,
                 p.name AS project_name
            FROM nodes n
            JOIN canvases c ON c.id = n.canvas_id
            JOIN projects p ON p.id = n.project_id
           WHERE n.deleted_at IS NULL AND (n.title LIKE ? OR n.content_json LIKE ?)
           ORDER BY n.updated_at DESC
           LIMIT ?`, pattern, pattern, limit)
      : this.query(`
          SELECT n.id, n.project_id, n.canvas_id, n.title, n.content_json, c.name AS canvas_name,
                 p.name AS project_name
            FROM nodes n
            JOIN canvases c ON c.id = n.canvas_id
            JOIN projects p ON p.id = n.project_id
           WHERE n.deleted_at IS NULL AND n.project_id = ?
             AND (n.title LIKE ? OR n.content_json LIKE ?)
           ORDER BY n.updated_at DESC
           LIMIT ?`, projectId, pattern, pattern, limit)
    return rows.map((row) => ({
      nodeId: row.id,
      title: row.title,
      excerpt: clip(plainOf(row.content_json)),
      projectId: row.project_id,
      projectName: row.project_name,
      canvasId: row.canvas_id,
      canvasName: row.canvas_name,
    }))
  }

  // --------------------------------------------------------------- writes

  /**
   * Create an Idea note. `x`/`y` are world coordinates; when omitted the note lands in the
   * middle of the canvas's current viewport. Title and body are independent and both optional;
   * the desktop app derives the title from the body, but this plugin stores what the user typed.
   */
  createNode({ canvasId, content, title, x, y, width, height, status, accentKey }) {
    const text = content === undefined || content === null ? '' : String(content).trim()
    const canvas = this.canvas(canvasId)
    const size = {
      width: positiveNumber(width, DEFAULT_WIDTH),
      height: positiveNumber(height, DEFAULT_HEIGHT),
    }
    const position = {
      x: finiteNumber(x) ?? round(canvas.cameraX + Math.max(320, 1100 / canvas.zoom) / 2 - size.width / 2),
      y: finiteNumber(y) ?? round(canvas.cameraY + Math.max(280, 700 / canvas.zoom) / 2 - size.height / 2),
    }
    const id = randomUUID()
    const now = appTimestamp()
    const finalTitle = title === undefined || title === null ? '' : truncateTitle(title)
    const accent = accentKey === undefined ? null : styleForAccent(accentKey)

    this.write((db) => {
      // An empty body keeps NULL, the way the desktop app stores a note with no text.
      db.prepare(`
        INSERT INTO nodes(id, project_id, canvas_id, type, title, content_json, x, y, width, height,
                          z_index, status, collapsed, style_json, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, NULL)`).run(
        id, canvas.projectId, canvasId, NODE_TYPE, finalTitle, encodeBody(text),
        position.x, position.y, size.width, size.height,
        status === undefined ? 'unsorted' : status, accent, now, now,
      )
      syncSearchIndex(db, { id, projectId: canvas.projectId, canvasId, title: finalTitle, body: text })
      touchCanvas(db, canvasId, now)
    })
    return { id, projectId: canvas.projectId, canvasId, title: finalTitle, x: position.x, y: position.y }
  }

  /** Patch a note; only the supplied fields change, and the FTS row follows the text. */
  updateNode({ id, content, title, x, y, width, height, status, accentKey, deleted }) {
    const row = this.one(`
      SELECT id, project_id, canvas_id, title, content_json, x, y, width, height, status, style_json,
             deleted_at
        FROM nodes WHERE id = ? LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Node ${id} does not exist`, 'NODE_NOT_FOUND')
    if (row.deleted_at !== null && deleted !== false) {
      throw new CanvasStoreError(`Node ${id} is in the recycle bin`, 'NODE_DELETED')
    }

    const nextContent = content === undefined
      ? row.content_json
      : encodeBody(String(content))
    const next = {
      // Title and body are independent; only an explicit title changes it.
      title: title === undefined ? row.title : truncateTitle(title),
      content: nextContent,
      x: finiteNumber(x) ?? Number(row.x),
      y: finiteNumber(y) ?? Number(row.y),
      width: positiveNumber(width, Number(row.width)),
      height: positiveNumber(height, Number(row.height)),
      status: status === undefined ? row.status : status,
      style: accentKey === undefined ? row.style_json : styleForAccent(accentKey),
      deletedAt: deleted === true ? appTimestamp() : (deleted === false ? null : row.deleted_at),
    }
    const now = appTimestamp()
    this.write((db) => {
      // Editing a legacy note normalises it to an Idea row, as the desktop app does on activation.
      db.prepare(`
        UPDATE nodes
           SET type = ?, title = ?, content_json = ?, x = ?, y = ?, width = ?, height = ?, status = ?,
               style_json = ?, updated_at = ?, deleted_at = ?
         WHERE id = ?`).run(
        NODE_TYPE, next.title, next.content, next.x, next.y, next.width, next.height, next.status,
        next.style, now, next.deletedAt, id,
      )
      syncSearchIndex(db, {
        id: row.id,
        projectId: row.project_id,
        canvasId: row.canvas_id,
        title: next.title,
        body: next.deletedAt === null ? plainOf(next.content) : '',
        deleted: next.deletedAt !== null,
      })
      touchCanvas(db, row.canvas_id, now)
    })
    return { id, deleted: next.deletedAt !== null, title: next.title }
  }

  /** Soft-delete a note and every connection touching it, as the app's delete command does. */
  deleteNode(id) {
    const row = this.one(`
      SELECT id, project_id, canvas_id, title FROM nodes WHERE id = ? AND deleted_at IS NULL LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Node ${id} is not a live note`, 'NODE_NOT_FOUND')
    const now = appTimestamp()
    this.write((db) => {
      db.prepare('UPDATE nodes SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id)
      db.prepare(`
        UPDATE connections SET deleted_at = ?, updated_at = ?
         WHERE deleted_at IS NULL AND (source_node_id = ? OR target_node_id = ?)`).run(now, now, id, id)
      db.prepare('DELETE FROM nodes_fts WHERE node_id = ?').run(id)
      touchCanvas(db, row.canvas_id, now)
      recordOperation(db, {
        projectId: row.project_id,
        canvasId: row.canvas_id,
        opType: 'plugin_delete_node',
        entityType: 'node',
        entityId: id,
        summary: `插件删除便签「${row.title}」`,
        now,
      })
    })
    return { id, deleted: true }
  }

  /** Connect two live notes on one canvas. The desktop app defaults to a black line. */
  createConnection({ canvasId, sourceNodeId, targetNodeId, relationType, label, sourceAnchor, targetAnchor, strokeKey }) {
    if (sourceNodeId === targetNodeId) {
      throw new CanvasStoreError('A connection needs two different notes', 'INVALID_ARGUMENT')
    }
    if (canvasId === undefined || canvasId === null || canvasId === '') {
      const owner = this.one('SELECT canvas_id FROM nodes WHERE id = ? AND deleted_at IS NULL LIMIT 1', sourceNodeId)
      if (owner === undefined) throw new CanvasStoreError(`Node ${sourceNodeId} is not a live note`, 'NODE_NOT_FOUND')
      canvasId = owner.canvas_id
    }
    const canvas = this.canvas(canvasId)
    const findNode = (nodeId) => {
      const node = this.one(`
        SELECT id, canvas_id, x, y, width, height FROM nodes
         WHERE id = ? AND deleted_at IS NULL LIMIT 1`, nodeId)
      if (node === undefined) throw new CanvasStoreError(`Node ${nodeId} is not a live note`, 'NODE_NOT_FOUND')
      if (node.canvas_id !== canvasId) {
        throw new CanvasStoreError(`Node ${nodeId} lives on another canvas`, 'NODE_OFF_CANVAS')
      }
      return node
    }
    const source = findNode(sourceNodeId)
    const target = findNode(targetNodeId)
    const relation = relationType === undefined ? 'Related' : String(relationType)
    if (!RELATIONS.includes(relation)) {
      throw new CanvasStoreError(`Unknown relationType ${relation}; use one of ${RELATIONS.join(', ')}`, 'INVALID_ARGUMENT')
    }
    // The desktop app allows several connections between the same pair of notes.
    const pickAnchor = (value, fallback) => (ANCHORS.includes(value) ? value : fallback)
    const id = randomUUID()
    const now = appTimestamp()
    const style = styleForStroke(strokeKey === undefined || strokeKey === null ? '#000000' : strokeKey)
    this.write((db) => {
      db.prepare(`
        INSERT INTO connections(id, project_id, canvas_id, source_node_id, target_node_id, relation_type,
                                direction, label, line_style, source_anchor, target_anchor, style_json,
                                created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, 'forward', ?, 'curve', ?, ?, ?, ?, ?, NULL)`).run(
        id, canvas.projectId, canvasId, sourceNodeId, targetNodeId, relation,
        label === undefined ? RELATION_LABELS[relation] : String(label),
        pickAnchor(sourceAnchor, 'Right'), pickAnchor(targetAnchor, 'Left'), style, now, now,
      )
      touchCanvas(db, canvasId, now)
    })
    return {
      id,
      sourceNodeId,
      targetNodeId,
      relationType: relation,
      sourceAnchor: pickAnchor(sourceAnchor, 'Right'),
      targetAnchor: pickAnchor(targetAnchor, 'Left'),
      source: { x: Number(source.x), y: Number(source.y), width: Number(source.width), height: Number(source.height) },
      target: { x: Number(target.x), y: Number(target.y), width: Number(target.width), height: Number(target.height) },
    }
  }

  deleteConnection(id) {
    const row = this.one(`
      SELECT id, canvas_id FROM connections WHERE id = ? AND deleted_at IS NULL LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Connection ${id} is not live`, 'CONNECTION_NOT_FOUND')
    const now = appTimestamp()
    this.write((db) => {
      db.prepare('UPDATE connections SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id)
      touchCanvas(db, row.canvas_id, now)
    })
    return { id, deleted: true }
  }

  /** Change a connection's relation, label, anchors, colour, or either endpoint. */
  updateConnection({ id, relationType, label, sourceNodeId, targetNodeId, sourceAnchor, targetAnchor, strokeKey }) {
    const row = this.one(`
      SELECT id, project_id, canvas_id, source_node_id, target_node_id, relation_type, label,
             source_anchor, target_anchor, style_json
        FROM connections WHERE id = ? AND deleted_at IS NULL LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Connection ${id} is not live`, 'CONNECTION_NOT_FOUND')
    const canvas = this.canvas(row.canvas_id)
    const nextSource = sourceNodeId === undefined ? row.source_node_id : String(sourceNodeId)
    const nextTarget = targetNodeId === undefined ? row.target_node_id : String(targetNodeId)
    if (nextSource === nextTarget) {
      throw new CanvasStoreError('A connection needs two different notes', 'INVALID_ARGUMENT')
    }
    for (const nodeId of [nextSource, nextTarget]) {
      const node = this.one(`
        SELECT id, canvas_id FROM nodes WHERE id = ? AND deleted_at IS NULL LIMIT 1`, nodeId)
      if (node === undefined) throw new CanvasStoreError(`Node ${nodeId} is not a live note`, 'NODE_NOT_FOUND')
      if (node.canvas_id !== canvas.id) throw new CanvasStoreError(`Node ${nodeId} lives on another canvas`, 'NODE_OFF_CANVAS')
    }
    const relation = relationType === undefined ? row.relation_type : String(relationType)
    if (!RELATIONS.includes(relation)) {
      throw new CanvasStoreError(`Unknown relationType ${relation}; use one of ${RELATIONS.join(', ')}`, 'INVALID_ARGUMENT')
    }
    const nextLabel = label !== undefined
      ? String(label)
      : relation === row.relation_type ? row.label : RELATION_LABELS[relation]
    const nextSourceAnchor = ANCHORS.includes(sourceAnchor) ? sourceAnchor : row.source_anchor
    const nextTargetAnchor = ANCHORS.includes(targetAnchor) ? targetAnchor : row.target_anchor
    const nextStyle = strokeKey === undefined ? row.style_json : styleForStroke(strokeKey)
    const now = appTimestamp()
    this.write((db) => {
      db.prepare(`
        UPDATE connections
           SET source_node_id = ?, target_node_id = ?, relation_type = ?, label = ?,
               source_anchor = ?, target_anchor = ?, style_json = ?, updated_at = ?
         WHERE id = ?`).run(
        nextSource, nextTarget, relation, nextLabel, nextSourceAnchor, nextTargetAnchor, nextStyle, now, id,
      )
      touchCanvas(db, row.canvas_id, now)
    })
    return {
      id,
      sourceNodeId: nextSource,
      targetNodeId: nextTarget,
      relationType: relation,
      label: nextLabel,
      sourceAnchor: nextSourceAnchor,
      targetAnchor: nextTargetAnchor,
    }
  }

  // -------------------------------------------------------------- projects

  /** Create a project and its main canvas, the way the desktop app does. */
  createProject({ name, description }) {
    const trimmed = String(name ?? '').trim()
    if (trimmed === '') throw new CanvasStoreError('A project needs a name', 'INVALID_ARGUMENT')
    const id = randomUUID()
    const canvasId = randomUUID()
    const now = appTimestamp()
    this.write((db) => {
      db.prepare(`
        INSERT INTO projects(id, name, description, is_favorite, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, 0, ?, ?, NULL)`).run(id, trimmed, description === undefined ? null : String(description), now, now)
      db.prepare(`
        INSERT INTO canvases(id, project_id, parent_canvas_id, owner_node_id, name, camera_x, camera_y, zoom,
                             grid_type, created_at, updated_at, deleted_at)
        VALUES (?, ?, NULL, NULL, '主画布', 0, 0, 1, 'dots', ?, ?, NULL)`).run(canvasId, id, now, now)
    })
    return { id, name: trimmed, canvasId }
  }

  updateProject({ id, name, description, favorite }) {
    const row = this.one('SELECT id, name, description, is_favorite FROM projects WHERE id = ? AND deleted_at IS NULL LIMIT 1', id)
    if (row === undefined) throw new CanvasStoreError(`Project ${id} does not exist`, 'PROJECT_NOT_FOUND')
    const nextName = name === undefined ? row.name : String(name).trim()
    if (nextName === '') throw new CanvasStoreError('A project name cannot be empty', 'INVALID_ARGUMENT')
    const nextDescription = description === undefined ? row.description : (String(description).trim() === '' ? null : String(description))
    const nextFavorite = favorite === undefined ? Number(row.is_favorite) : (favorite === true || favorite === 1 ? 1 : 0)
    const now = appTimestamp()
    this.write((db) => {
      db.prepare(`
        UPDATE projects SET name = ?, description = ?, is_favorite = ?, updated_at = ? WHERE id = ?`)
        .run(nextName, nextDescription, nextFavorite, now, id)
    })
    return { id, name: nextName, favorite: nextFavorite === 1 }
  }

  /** Soft-delete a project only; the app never cascades to canvases or notes. */
  deleteProject(id) {
    const row = this.one('SELECT id, name FROM projects WHERE id = ? AND deleted_at IS NULL LIMIT 1', id)
    if (row === undefined) throw new CanvasStoreError(`Project ${id} does not exist`, 'PROJECT_NOT_FOUND')
    const now = appTimestamp()
    this.write((db) => {
      db.prepare('UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id)
    })
    return { id, deleted: true, name: row.name }
  }

  // ---------------------------------------------------------------- groups

  /** Group the given notes using the app's padding and minimum size. */
  createGroup({ canvasId, nodeIds, title }) {
    const ids = Array.isArray(nodeIds) ? [...new Set(nodeIds.map(String))] : []
    if (ids.length === 0) throw new CanvasStoreError('Select at least one note to group', 'INVALID_ARGUMENT')
    const canvas = this.canvas(canvasId)
    const nodes = ids.map((id) => {
      const node = this.one(`
        SELECT id, canvas_id, x, y, width, height FROM nodes
         WHERE id = ? AND deleted_at IS NULL LIMIT 1`, id)
      if (node === undefined) throw new CanvasStoreError(`Node ${id} is not a live note`, 'NODE_NOT_FOUND')
      if (node.canvas_id !== canvasId) throw new CanvasStoreError(`Node ${id} lives on another canvas`, 'NODE_OFF_CANVAS')
      return node
    })
    const minX = Math.min(...nodes.map((node) => Number(node.x))) - 24
    const minY = Math.min(...nodes.map((node) => Number(node.y))) - 40
    const maxX = Math.max(...nodes.map((node) => Number(node.x) + Number(node.width))) + 24
    const maxY = Math.max(...nodes.map((node) => Number(node.y) + Number(node.height))) + 24
    const id = randomUUID()
    const now = appTimestamp()
    this.write((db) => {
      db.prepare(`
        INSERT INTO groups(id, project_id, canvas_id, title, x, y, width, height, collapsed, style_json,
                           created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, NULL)`).run(
        id, canvas.projectId, canvasId,
        title === undefined || String(title).trim() === '' ? '分组' : String(title).trim(),
        minX, minY, Math.max(200, maxX - minX), Math.max(120, maxY - minY), now, now,
      )
      const insertMember = db.prepare(`
        INSERT OR IGNORE INTO group_memberships(group_id, node_id, created_at) VALUES (?, ?, ?)`)
      for (const node of nodes) insertMember.run(id, node.id, now)
      touchCanvas(db, canvasId, now)
    })
    return {
      id,
      canvasId,
      title: title === undefined || String(title).trim() === '' ? '分组' : String(title).trim(),
      x: minX,
      y: minY,
      width: Math.max(200, maxX - minX),
      height: Math.max(120, maxY - minY),
      memberIds: nodes.map((node) => node.id),
    }
  }

  /** Move, resize, rename, or collapse a group; moving carries its members, as the app does. */
  updateGroup({ id, x, y, width, height, collapsed, title, moveMembers = true }) {
    const row = this.one(`
      SELECT id, canvas_id, title, x, y, width, height, collapsed FROM groups
       WHERE id = ? AND deleted_at IS NULL LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Group ${id} does not exist`, 'GROUP_NOT_FOUND')
    const now = appTimestamp()
    const nextX = finiteNumber(x) ?? Number(row.x)
    const nextY = finiteNumber(y) ?? Number(row.y)
    const dx = nextX - Number(row.x)
    const dy = nextY - Number(row.y)
    const next = {
      x: nextX,
      y: nextY,
      width: positiveNumber(width, Number(row.width)),
      height: positiveNumber(height, Number(row.height)),
      title: title === undefined ? row.title : (String(title).trim() === '' ? row.title : String(title).trim()),
      collapsed: collapsed === undefined ? Number(row.collapsed) : (collapsed === true ? 1 : 0),
    }
    const members = this.query('SELECT node_id FROM group_memberships WHERE group_id = ?', id)
    this.write((db) => {
      db.prepare(`
        UPDATE groups SET title = ?, x = ?, y = ?, width = ?, height = ?, collapsed = ?, updated_at = ?
         WHERE id = ?`).run(next.title, next.x, next.y, next.width, next.height, next.collapsed, now, id)
      if (moveMembers && (dx !== 0 || dy !== 0)) {
        const move = db.prepare(`
          UPDATE nodes SET x = x + ?, y = y + ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
        for (const member of members) move.run(dx, dy, now, member.node_id)
      }
      touchCanvas(db, row.canvas_id, now)
    })
    return { id, ...next, movedBy: { dx, dy } }
  }

  /** Soft-delete a group and keep its members, as the app's delete command does. */
  deleteGroup(id) {
    const row = this.one(`
      SELECT id, project_id, canvas_id, title FROM groups WHERE id = ? AND deleted_at IS NULL LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Group ${id} does not exist`, 'GROUP_NOT_FOUND')
    const now = appTimestamp()
    this.write((db) => {
      db.prepare('UPDATE groups SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id)
      touchCanvas(db, row.canvas_id, now)
      recordOperation(db, {
        projectId: row.project_id,
        canvasId: row.canvas_id,
        opType: 'plugin_delete_group',
        entityType: 'group',
        entityId: id,
        summary: `插件删除分组「${row.title}」（保留成员）`,
        now,
      })
    })
    return { id, deleted: true }
  }

  restoreGroup(id) {
    const row = this.one('SELECT id, canvas_id FROM groups WHERE id = ? LIMIT 1', id)
    if (row === undefined) throw new CanvasStoreError(`Group ${id} does not exist`, 'GROUP_NOT_FOUND')
    const now = appTimestamp()
    this.write((db) => {
      db.prepare('UPDATE groups SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now, id)
      touchCanvas(db, row.canvas_id, now)
    })
    return { id, deleted: false }
  }

  // ------------------------------------------------- recycle bin and bulk

  /** Deleted notes, newest first, with the project and canvas they belong to. */
  listRecycle({ projectId, limit = 50 } = {}) {
    const rows = projectId === undefined
      ? this.query(`
          SELECT n.id, n.project_id, n.canvas_id, n.title, n.deleted_at, p.name AS project_name,
                 c.name AS canvas_name
            FROM nodes n
            LEFT JOIN projects p ON p.id = n.project_id
            LEFT JOIN canvases c ON c.id = n.canvas_id
           WHERE n.deleted_at IS NOT NULL
           ORDER BY n.deleted_at DESC
           LIMIT ?`, limit)
      : this.query(`
          SELECT n.id, n.project_id, n.canvas_id, n.title, n.deleted_at, p.name AS project_name,
                 c.name AS canvas_name
            FROM nodes n
            LEFT JOIN projects p ON p.id = n.project_id
            LEFT JOIN canvases c ON c.id = n.canvas_id
           WHERE n.deleted_at IS NOT NULL AND n.project_id = ?
           ORDER BY n.deleted_at DESC
           LIMIT ?`, projectId, limit)
    return rows.map((row) => ({
      nodeId: row.id,
      title: row.title,
      projectId: row.project_id,
      projectName: row.project_name ?? null,
      canvasId: row.canvas_id,
      canvasName: row.canvas_name ?? null,
      deletedAt: row.deleted_at,
    }))
  }

  /** Bring a note back and restore the connections whose other end is still live. */
  restoreNode(id) {
    const row = this.one(`
      SELECT id, project_id, canvas_id, title, content_json, deleted_at FROM nodes WHERE id = ? LIMIT 1`, id)
    if (row === undefined) throw new CanvasStoreError(`Node ${id} does not exist`, 'NODE_NOT_FOUND')
    if (row.deleted_at === null) return { id, deleted: false }
    const now = appTimestamp()
    this.write((db) => {
      db.prepare('UPDATE nodes SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now, id)
      db.prepare(`
        UPDATE connections SET deleted_at = NULL, updated_at = ?
         WHERE deleted_at IS NOT NULL AND (source_node_id = ? OR target_node_id = ?)
           AND EXISTS (SELECT 1 FROM nodes s WHERE s.id = connections.source_node_id AND s.deleted_at IS NULL)
           AND EXISTS (SELECT 1 FROM nodes t WHERE t.id = connections.target_node_id AND t.deleted_at IS NULL)`).run(now, id, id)
      syncSearchIndex(db, {
        id: row.id, projectId: row.project_id, canvasId: row.canvas_id,
        title: row.title, body: decodeBody(row.content_json), blocks: blocksOf(row.content_json),
      })
      touchCanvas(db, row.canvas_id, now)
      recordOperation(db, {
        projectId: row.project_id,
        canvasId: row.canvas_id,
        opType: 'plugin_restore_node',
        entityType: 'node',
        entityId: id,
        summary: `插件恢复便签「${row.title}」`,
        now,
      })
    })
    return { id, deleted: false }
  }

  /** Move several notes at once (one transaction), for a multi-selection drag. */
  updateNodes(positions) {
    const entries = Array.isArray(positions) ? positions : []
    if (entries.length === 0) return { updated: 0 }
    const now = appTimestamp()
    const updated = this.write((db) => {
      const statement = db.prepare(`
        UPDATE nodes SET x = ?, y = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
      let count = 0
      for (const entry of entries) {
        const x = finiteNumber(entry?.x)
        const y = finiteNumber(entry?.y)
        if (x === undefined || y === undefined || typeof entry.id !== 'string') continue
        count += Number(statement.run(x, y, now, entry.id).changes)
      }
      return count
    })
    return { updated }
  }

  /** Soft-delete several notes and their connections in one transaction. */
  deleteNodes(ids) {
    const list = Array.isArray(ids) ? [...new Set(ids.map(String))] : []
    if (list.length === 0) return { deleted: 0 }
    const now = appTimestamp()
    const deleted = this.write((db) => {
      let count = 0
      for (const id of list) {
        const row = db.prepare(`
          SELECT id, project_id, canvas_id, title FROM nodes WHERE id = ? AND deleted_at IS NULL LIMIT 1`).get(id)
        if (row === undefined) continue
        db.prepare('UPDATE nodes SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id)
        db.prepare(`
          UPDATE connections SET deleted_at = ?, updated_at = ?
           WHERE deleted_at IS NULL AND (source_node_id = ? OR target_node_id = ?)`).run(now, now, id, id)
        db.prepare('DELETE FROM nodes_fts WHERE node_id = ?').run(id)
        recordOperation(db, {
          projectId: row.project_id,
          canvasId: row.canvas_id,
          opType: 'plugin_delete_node',
          entityType: 'node',
          entityId: id,
          summary: `插件删除便签「${row.title}」`,
          now,
        })
        count += 1
      }
      return count
    })
    return { deleted }
  }

  /** Persist the canvas camera, as the desktop app's autosave does. */
  saveCamera({ canvasId, cameraX, cameraY, zoom }) {
    const canvas = this.canvas(canvasId)
    const now = appTimestamp()
    const nextX = finiteNumber(cameraX) ?? canvas.cameraX
    const nextY = finiteNumber(cameraY) ?? canvas.cameraY
    const nextZoom = clampNumber(finiteNumber(zoom) ?? canvas.zoom, 0.1, 4)
    this.write((db) => {
      db.prepare('UPDATE canvases SET camera_x = ?, camera_y = ?, zoom = ?, updated_at = ? WHERE id = ?')
        .run(nextX, nextY, nextZoom, now, canvasId)
    })
    return { canvasId, cameraX: nextX, cameraY: nextY, zoom: nextZoom }
  }
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? round(value) : undefined
}

function positiveNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? round(value) : fallback
}

function round(value) {
  return Math.round(value * 100) / 100
}

function accentOf(styleJson) {
  return parseStyle(styleJson)?.accentKey ?? null
}

function strokeOf(styleJson) {
  return parseStyle(styleJson)?.strokeKey ?? null
}

function parseStyle(styleJson) {
  if (typeof styleJson !== 'string' || styleJson === '') return undefined
  try {
    const value = JSON.parse(styleJson)
    return typeof value === 'object' && value !== null ? value : undefined
  } catch {
    return undefined
  }
}

function styleForAccent(accentKey) {
  if (accentKey === null || accentKey === undefined || accentKey === '' || accentKey === 'none') return null
  return JSON.stringify({ accentKey: String(accentKey) })
}

function styleForStroke(strokeKey) {
  if (strokeKey === null || strokeKey === undefined || strokeKey === '' || strokeKey === 'none') return null
  return JSON.stringify({ strokeKey: String(strokeKey) })
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Mirror `UpsertSearchIndexAsync`: delete first, then index only live notes. */
function syncSearchIndex(db, { id, projectId, canvasId, title, body, deleted = false }) {
  db.prepare('DELETE FROM nodes_fts WHERE node_id = ?').run(id)
  if (deleted) return
  db.prepare('INSERT INTO nodes_fts(node_id, project_id, canvas_id, title, body) VALUES (?, ?, ?, ?, ?)')
    .run(id, projectId, canvasId, title ?? '', ftsBody(body))
}

function touchCanvas(db, canvasId, now) {
  db.prepare('UPDATE canvases SET updated_at = ? WHERE id = ?').run(now, canvasId)
  db.prepare(`
    UPDATE projects SET updated_at = ?
     WHERE id = (SELECT project_id FROM canvases WHERE id = ?)`).run(now, canvasId)
}

/** Operation history entry, namespaced so the app shows it without colliding with its own rows. */
function recordOperation(db, { projectId, canvasId, opType, entityType, entityId, summary, now }) {
  db.prepare(`
    INSERT INTO operation_history(id, project_id, canvas_id, op_type, entity_type, entity_id, summary,
                                  payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    randomUUID(), projectId ?? null, canvasId ?? null, opType, entityType ?? null, entityId ?? null,
    summary, JSON.stringify({ source: '@local/project-canvas' }), now,
  )
}
