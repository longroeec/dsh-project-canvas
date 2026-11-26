/**
 * Schema for the plugin-owned canvas database.
 *
 * The tables mirror the Project Canvas desktop schema (v5) so an existing `app.db` can be
 * imported row for row, and so tools keep working against the same shape.
 */

export const SCHEMA_VERSION = 5

const DDL = `
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color_token TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_canvas_id TEXT,
    owner_node_id TEXT,
    name TEXT NOT NULL,
    camera_x REAL NOT NULL DEFAULT 0,
    camera_y REAL NOT NULL DEFAULT 0,
    zoom REAL NOT NULL DEFAULT 1,
    background_token TEXT,
    grid_type TEXT NOT NULL DEFAULT 'dots',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(parent_canvas_id) REFERENCES canvases(id)
);

CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    canvas_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content_json TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    z_index INTEGER NOT NULL DEFAULT 0,
    status TEXT,
    collapsed INTEGER NOT NULL DEFAULT 0,
    style_json TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(canvas_id) REFERENCES canvases(id)
);

CREATE INDEX IF NOT EXISTS idx_nodes_canvas ON nodes(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvases_project ON canvases(project_id);

CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    canvas_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'related',
    direction TEXT NOT NULL DEFAULT 'forward',
    label TEXT,
    line_style TEXT NOT NULL DEFAULT 'curve',
    source_anchor TEXT NOT NULL DEFAULT 'Right',
    target_anchor TEXT NOT NULL DEFAULT 'Left',
    style_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(canvas_id) REFERENCES canvases(id),
    FOREIGN KEY(source_node_id) REFERENCES nodes(id),
    FOREIGN KEY(target_node_id) REFERENCES nodes(id)
);

CREATE INDEX IF NOT EXISTS idx_connections_canvas ON connections(canvas_id);
CREATE INDEX IF NOT EXISTS idx_connections_nodes ON connections(source_node_id, target_node_id);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    canvas_id TEXT NOT NULL,
    title TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    collapsed INTEGER NOT NULL DEFAULT 0,
    style_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(canvas_id) REFERENCES canvases(id)
);

CREATE TABLE IF NOT EXISTS group_memberships (
    group_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(group_id, node_id),
    FOREIGN KEY(group_id) REFERENCES groups(id),
    FOREIGN KEY(node_id) REFERENCES nodes(id)
);

CREATE INDEX IF NOT EXISTS idx_groups_canvas ON groups(canvas_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_node ON group_memberships(node_id);

CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
    node_id UNINDEXED,
    project_id UNINDEXED,
    canvas_id UNINDEXED,
    title,
    body,
    tokenize = 'trigram'
);

CREATE TABLE IF NOT EXISTS search_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operation_history (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    canvas_id TEXT,
    op_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    summary TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_operation_history_project_time
    ON operation_history(project_id, created_at DESC);
`

/** Create every table the plugin needs, when the target file is new. */
export function ensureSchema(db) {
  db.exec(DDL)
  db.exec("INSERT OR REPLACE INTO search_meta(key, value) VALUES ('tokenizer', 'trigram')")
  db.exec("INSERT OR REPLACE INTO search_meta(key, value) VALUES ('strategy', 'fts5-trigram-with-like-fallback')")
  const row = db.prepare('PRAGMA user_version').get()
  const version = Number(row?.user_version ?? 0)
  if (version < SCHEMA_VERSION) db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`)
}
