/**
 * Project Canvas — Host half.
 *
 * Registers two things on the DeepSeek Harness host:
 *  1. Canvas tools on `ctx.tools`, so the agent can read a board, search notes, and add, edit,
 *     connect, or delete notes through the same store the browser panel uses.
 *  2. A small JSON API on `ctx.webServer` that the main-panel page calls. Every route asks the
 *     composition's `connection` service for a rejection first, which applies the Host/Origin
 *     fence and browser authentication.
 *
 * This file deliberately imports only Node built-ins: a workspace-installed bundle cannot resolve
 * `@deepseek-ai/*` packages, so tool definitions are written as plain registry definitions.
 */

import { CanvasStore, CanvasStoreError, defaultDbPath, defaultPluginDbPath } from './lib/store.js'

export const name = 'project-canvas'
export const inject = ['tools', 'webServer', 'connection']

const API = '/project-canvas/api'
const MAX_BODY_BYTES = 256 * 1024
const RELATIONS = ['MainThick1', 'MainThick2', 'MainThick3', 'Branch', 'References', 'Related']

/** Plain tool definition; the registry validates output against `output.schema`. */
function tool(definition) {
  return {
    ...definition,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
  }
}

function requireText(args, key) {
  const value = args?.[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CanvasStoreError(`"${key}" is required and must be a non-empty string`, 'INVALID_ARGUMENT')
  }
  return value.trim()
}

function optionalText(args, key) {
  const value = args?.[key]
  if (value === undefined || value === null) return undefined
  return typeof value === 'string' ? value.trim() : String(value)
}

function optionalNumber(args, key) {
  const value = args?.[key]
  if (value === undefined || value === null || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) {
    throw new CanvasStoreError(`"${key}" must be a finite number`, 'INVALID_ARGUMENT')
  }
  return parsed
}

/** Resolve one project from an id or a (case-insensitive) name; without one, the most recent. */
function resolveProject(store, selector) {
  const projects = store.listProjects()
  if (projects.length === 0) {
    throw new CanvasStoreError('There are no Project Canvas projects yet', 'NO_PROJECTS')
  }
  if (selector === undefined || selector === null || String(selector).trim() === '') return projects[0]
  const needle = String(selector).trim().toLowerCase()
  const found = projects.find((project) => project.id === selector)
    ?? projects.find((project) => project.name.toLowerCase() === needle)
    ?? projects.find((project) => project.name.toLowerCase().includes(needle))
  if (found === undefined) {
    throw new CanvasStoreError(`No project matches ${selector}`, 'PROJECT_NOT_FOUND')
  }
  return found
}

/** Resolve a canvas from an id or name within a project; without one, the project's main canvas. */
function resolveCanvas(store, projectId, selector) {
  if (selector === undefined || selector === null || String(selector).trim() === '') {
    const main = store.mainCanvas(projectId)
    if (main === undefined) throw new CanvasStoreError('The project has no canvas', 'CANVAS_NOT_FOUND')
    return main
  }
  const canvases = store.listCanvases(projectId)
  const needle = String(selector).trim().toLowerCase()
  const found = canvases.find((canvas) => canvas.id === selector)
    ?? canvases.find((canvas) => canvas.name.toLowerCase() === needle)
  if (found === undefined) throw new CanvasStoreError(`No canvas matches ${selector}`, 'CANVAS_NOT_FOUND')
  return found
}

/** Model-facing rendering of the canvas graph: readable, bounded, with ids for follow-up calls. */
function describeCanvas(store, canvasId, { includeContent = true } = {}) {
  const graph = store.graph(canvasId)
  const canvas = graph.canvas
  const project = store.one('SELECT id, name FROM projects WHERE id = ? LIMIT 1', canvas.projectId)
  const lines = [
    `Canvas "${canvas.name}" (id ${canvas.id}) in project "${project?.name ?? '?'}" (id ${canvas.projectId})`,
    `Camera (${Math.round(canvas.cameraX)}, ${Math.round(canvas.cameraY)}) at ${canvas.zoom}x; ` +
      `${graph.nodes.length} notes, ${graph.connections.length} connections, ${graph.groups.length} groups.`,
  ]
  if (graph.nodes.length === 0) {
    lines.push('No notes yet.')
  } else {
    lines.push('', 'Notes:')
    for (const node of graph.nodes) {
      const text = includeContent
        ? String(node.content ?? node.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)
        : ''
      lines.push(`- ${node.id} | "${node.title}" | at (${Math.round(node.x)}, ${Math.round(node.y)}) ` +
        `${Math.round(node.width)}x${Math.round(node.height)}` +
        `${node.accentKey ? ` | accent ${node.accentKey}` : ''}${text ? ` | ${text}` : ''}`)
    }
  }
  if (graph.connections.length > 0) {
    lines.push('', 'Connections:')
    for (const connection of graph.connections) {
      lines.push(`- ${connection.id} | ${connection.sourceNodeId} -> ${connection.targetNodeId} | ` +
        `${connection.relationType}${connection.label ? ` (${connection.label})` : ''}`)
    }
  }
  if (graph.groups.length > 0) {
    lines.push('', 'Groups:')
    for (const group of graph.groups) {
      lines.push(`- ${group.id} | "${group.title}" | ${group.memberIds.length} members`)
    }
  }
  return lines.join('\n')
}

function canvasIdOfNode(store, nodeId) {
  const row = store.one('SELECT canvas_id FROM nodes WHERE id = ? AND deleted_at IS NULL LIMIT 1', nodeId)
  if (row === undefined) throw new CanvasStoreError(`Node ${nodeId} is not a live note`, 'NODE_NOT_FOUND')
  return row.canvas_id
}

/** One operation shared by the panel API and the tools, per the plugin user-action rule. */
function mutation(store, op, payload) {
  switch (op) {
    case 'create-note': {
      // The browser panel names the canvas it is showing; tools may name a project or canvas.
      const explicit = typeof payload.canvasId === 'string' && payload.canvasId.trim() !== ''
      const canvas = explicit
        ? store.canvas(payload.canvasId.trim())
        : resolveCanvas(store, resolveProject(store, payload.project).id, payload.canvas)
      return store.createNode({
        canvasId: canvas.id,
        content: payload.content,
        title: payload.title,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        status: payload.status,
        accentKey: payload.accentKey,
      })
    }
    case 'update-note':
      return store.updateNode({
        id: payload.nodeId ?? payload.id,
        content: payload.content,
        title: payload.title,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        status: payload.status,
        accentKey: payload.accentKey,
        deleted: payload.deleted,
      })
    case 'delete-note':
      return store.deleteNode(payload.nodeId ?? payload.id)
    case 'create-connection': {
      const canvasId = payload.canvasId ?? canvasIdOfNode(store, payload.sourceNodeId)
      return store.createConnection({
        canvasId,
        sourceNodeId: payload.sourceNodeId,
        targetNodeId: payload.targetNodeId,
        relationType: payload.relationType,
        label: payload.label,
        sourceAnchor: payload.sourceAnchor,
        targetAnchor: payload.targetAnchor,
        strokeKey: payload.strokeKey,
      })
    }
    case 'delete-connection':
      return store.deleteConnection(payload.connectionId ?? payload.id)
    case 'update-connection':
      return store.updateConnection({
        id: payload.connectionId ?? payload.id,
        relationType: payload.relationType,
        label: payload.label,
        sourceNodeId: payload.sourceNodeId,
        targetNodeId: payload.targetNodeId,
        sourceAnchor: payload.sourceAnchor,
        targetAnchor: payload.targetAnchor,
        strokeKey: payload.strokeKey,
      })
    case 'create-project':
      return store.createProject({ name: payload.name, description: payload.description })
    case 'update-project':
      return store.updateProject({
        id: payload.projectId ?? payload.id,
        name: payload.name,
        description: payload.description,
        favorite: payload.favorite,
      })
    case 'delete-project':
      return store.deleteProject(payload.projectId ?? payload.id)
    case 'create-group':
      return store.createGroup({
        canvasId: payload.canvasId,
        nodeIds: payload.nodeIds,
        title: payload.title,
      })
    case 'update-group':
      return store.updateGroup({
        id: payload.groupId ?? payload.id,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        collapsed: payload.collapsed,
        title: payload.title,
        moveMembers: payload.moveMembers,
      })
    case 'delete-group':
      return store.deleteGroup(payload.groupId ?? payload.id)
    case 'restore-group':
      return store.restoreGroup(payload.groupId ?? payload.id)
    case 'restore-note':
      return store.restoreNode(payload.nodeId ?? payload.id)
    case 'update-nodes':
      return store.updateNodes(payload.positions)
    case 'delete-nodes':
      return store.deleteNodes(payload.nodeIds)
    case 'save-camera':
      return store.saveCamera({
        canvasId: payload.canvasId,
        cameraX: payload.cameraX,
        cameraY: payload.cameraY,
        zoom: payload.zoom,
      })
    case 'import-legacy':
      return store.importLegacy(payload.path ?? legacyPath)
    default:
      throw new CanvasStoreError(`Unknown operation ${op}`, 'UNKNOWN_OPERATION')
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.byteLength
    if (size > MAX_BODY_BYTES) {
      req.resume()
      return null
    }
    chunks.push(chunk)
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks, size).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

function sendFailure(res, error) {
  const status = error instanceof CanvasStoreError && error.code === 'NODE_NOT_FOUND' ? 404 : 400
  sendJson(res, status, {
    code: error?.code ?? 'PROJECT_CANVAS_ERROR',
    message: error?.message ?? String(error),
  })
}

function failureText(error) {
  const code = error?.code ?? 'PROJECT_CANVAS_ERROR'
  return `Error (${code}): ${error?.message ?? String(error)}`
}

export function apply(ctx, config) {
  const configured = config?.dbPath ?? process.env.PROJECT_CANVAS_DB
  const dbPath = typeof configured === 'string' && configured.trim() !== '' ? configured.trim() : defaultPluginDbPath()
  const legacyConfigured = config?.legacyDbPath ?? process.env.PROJECT_CANVAS_LEGACY_DB
  const legacyPath = typeof legacyConfigured === 'string' && legacyConfigured.trim() !== ''
    ? legacyConfigured.trim()
    : defaultDbPath()
  const store = new CanvasStore(dbPath, { legacyPath, lock: config?.lock !== false })

  // Disposing the plugin releases the SQLite handle.
  ctx.effect(() => () => store.close(), 'project-canvas: database handle')

  const trust = ctx.get('connection')
  const rejected = (req, res) => {
    if (trust === undefined) return false
    const rejection = trust.requestRejection(req)
    if (rejection === undefined) return false
    res.statusCode = rejection
    res.end()
    return true
  }

  // ------------------------------------------------------------------ API

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API}/bootstrap`,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('allow', 'GET')
        res.end()
        return
      }
      try {
        const projects = store.listProjects()
        sendJson(res, 200, {
          dbPath,
          storage: store.storageInfo(),
          projects: projects.map((project) => ({
            ...project,
            canvases: store.listCanvases(project.id),
          })),
        })
      } catch (error) {
        sendFailure(res, error)
      }
    },
  }), 'project-canvas: bootstrap')

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: `${API}/canvas`,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('allow', 'GET')
        res.end()
        return
      }
      const pathname = new URL(String(req.url), 'http://localhost').pathname
      const canvasId = decodeURIComponent(pathname.slice(`${API}/canvas`.length).replace(/^\/+/, ''))
      if (canvasId === '') {
        sendJson(res, 400, { code: 'INVALID_ARGUMENT', message: 'canvas id is required' })
        return
      }
      try {
        const graph = store.graph(canvasId)
        const project = store.one('SELECT id, name FROM projects WHERE id = ? LIMIT 1', graph.canvas.projectId)
        sendJson(res, 200, { project: project ?? null, ...graph })
      } catch (error) {
        sendFailure(res, error)
      }
    },
  }), 'project-canvas: canvas graph')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API}/recycle`,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('allow', 'GET')
        res.end()
        return
      }
      try {
        const url = new URL(String(req.url), 'http://localhost')
        const projectId = url.searchParams.get('project') ?? undefined
        const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50))
        sendJson(res, 200, { items: store.listRecycle({ projectId, limit }) })
      } catch (error) {
        sendFailure(res, error)
      }
    },
  }), 'project-canvas: recycle bin')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API}/search`,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('allow', 'GET')
        res.end()
        return
      }
      try {
        const url = new URL(String(req.url), 'http://localhost')
        const query = (url.searchParams.get('q') ?? '').trim()
        if (query === '') {
          sendJson(res, 400, { code: 'INVALID_ARGUMENT', message: 'q is required' })
          return
        }
        const projectSelector = url.searchParams.get('project') ?? undefined
        const projectId = projectSelector === undefined || projectSelector === ''
          ? undefined
          : resolveProject(store, projectSelector).id
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20))
        sendJson(res, 200, { hits: store.search(query, { projectId, limit }) })
      } catch (error) {
        sendFailure(res, error)
      }
    },
  }), 'project-canvas: search')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API}/mutate`,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('allow', 'POST')
        res.end()
        return
      }
      const body = await readBody(req)
      if (body === null) {
        sendJson(res, 400, { code: 'INVALID_BODY', message: 'expected a small JSON object' })
        return
      }
      try {
        const result = mutation(store, body.op, body)
        sendJson(res, 200, { ok: true, result })
      } catch (error) {
        sendFailure(res, error)
      }
    },
  }), 'project-canvas: mutations')

  // ---------------------------------------------------------------- tools

  ctx.tools.register(tool({
    name: 'project_canvas_list',
    description: 'List the user\'s Project Canvas boards and the projects they belong to.',
    parameters: { type: 'object', properties: {} },
    async execute() {
      try {
        const projects = store.listProjects()
        if (projects.length === 0) return 'No Project Canvas projects yet.'
        const lines = [`Database: ${dbPath}`]
        for (const project of projects) {
          lines.push(`- ${project.name} (id ${project.id}) | ${project.canvasCount} canvases, ` +
            `${project.nodeCount} notes | updated ${project.updatedAt}`)
          for (const canvas of store.listCanvases(project.id)) {
            lines.push(`  - ${canvas.name} (id ${canvas.id})${canvas.parentCanvasId ? ' [sub-canvas]' : ''}`)
          }
        }
        return lines.join('\n')
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_read',
    description: 'Read one canvas: its notes with world positions and text, its connections, and its groups.',
    parameters: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project id or name; defaults to the most recently updated project.' },
        canvas: { type: 'string', description: 'Canvas id or name; defaults to the project\'s main canvas.' },
        includeContent: { type: 'boolean', description: 'Include each note\'s text (default true).' },
      },
    },
    async execute(args) {
      try {
        const project = resolveProject(store, optionalText(args, 'project'))
        const canvas = resolveCanvas(store, project.id, optionalText(args, 'canvas'))
        return describeCanvas(store, canvas.id, { includeContent: args?.includeContent !== false })
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_search',
    description: 'Search note titles and bodies across Project Canvas boards.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to look for.' },
        project: { type: 'string', description: 'Restrict to one project id or name.' },
        limit: { type: 'number', description: 'Maximum results, 1-50 (default 20).' },
      },
      required: ['query'],
    },
    async execute(args) {
      try {
        const query = requireText(args, 'query')
        const projectSelector = optionalText(args, 'project')
        const project = projectSelector === undefined ? undefined : resolveProject(store, projectSelector)
        const limit = Math.min(50, Math.max(1, Math.round(optionalNumber(args, 'limit') ?? 20)))
        const hits = store.search(query, { projectId: project?.id, limit })
        if (hits.length === 0) return `No notes match "${query}".`
        return [
          `${hits.length} match(es) for "${query}":`,
          ...hits.map((hit) => `- ${hit.nodeId} | "${hit.title}" in ${hit.projectName} / ${hit.canvasName}` +
            ` | ${hit.excerpt}`),
        ].join('\n')
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_create_note',
    description: 'Create an Idea note on a canvas and return its id and position.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The note body (may be empty when a title is given).' },
        project: { type: 'string', description: 'Project id or name; defaults to the most recently updated project.' },
        canvas: { type: 'string', description: 'Canvas id or name; defaults to the project\'s main canvas.' },
        title: { type: 'string', description: 'Optional title; leave empty for none.' },
        x: { type: 'number', description: 'World X; defaults to the middle of the current viewport.' },
        y: { type: 'number', description: 'World Y; defaults to the middle of the current viewport.' },
        width: { type: 'number', description: 'Note width in world units (default 220).' },
        height: { type: 'number', description: 'Note height in world units (default 120).' },
        accentKey: { type: 'string', description: 'Branch colour: branch-a…branch-e or emphasis.' },
      },
    },
    async execute(args) {
      try {
        const content = optionalText(args, 'content') ?? ''
        const title = optionalText(args, 'title') ?? ''
        if (content === '' && title === '') {
          throw new CanvasStoreError('A note needs a title or a body', 'INVALID_ARGUMENT')
        }
        const project = resolveProject(store, optionalText(args, 'project'))
        const canvas = resolveCanvas(store, project.id, optionalText(args, 'canvas'))
        const result = store.createNode({
          canvasId: canvas.id,
          content,
          title,
          x: optionalNumber(args, 'x'),
          y: optionalNumber(args, 'y'),
          width: optionalNumber(args, 'width'),
          height: optionalNumber(args, 'height'),
          accentKey: optionalText(args, 'accentKey'),
        })
        return `Created note ${result.id} "${result.title}" on canvas ${canvas.name} ` +
          `at (${Math.round(result.x)}, ${Math.round(result.y)}). ` +
          'The desktop app shows new notes after reopening the project or restarting.'
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_update_note',
    description: 'Change one note\'s text, title, position, size, status, or colour.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'Id of the note to change.' },
        content: { type: 'string', description: 'New body text; an empty string clears it.' },
        title: { type: 'string', description: 'New title; an empty string clears it.' },
        x: { type: 'number', description: 'New world X.' },
        y: { type: 'number', description: 'New world Y.' },
        width: { type: 'number', description: 'New width in world units.' },
        height: { type: 'number', description: 'New height in world units.' },
        status: { type: 'string', description: 'New status token, for example unsorted or done.' },
        accentKey: { type: 'string', description: 'Branch colour: branch-a…branch-e, emphasis, or none.' },
      },
      required: ['nodeId'],
    },
    async execute(args) {
      try {
        const result = store.updateNode({
          id: requireText(args, 'nodeId'),
          content: optionalText(args, 'content'),
          title: optionalText(args, 'title'),
          x: optionalNumber(args, 'x'),
          y: optionalNumber(args, 'y'),
          width: optionalNumber(args, 'width'),
          height: optionalNumber(args, 'height'),
          status: optionalText(args, 'status'),
          accentKey: optionalText(args, 'accentKey'),
        })
        return `Updated note ${result.id} (${result.title}).`
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_connect',
    description: 'Connect two notes on the same canvas.',
    parameters: {
      type: 'object',
      properties: {
        sourceNodeId: { type: 'string', description: 'Note the connection starts at.' },
        targetNodeId: { type: 'string', description: 'Note the connection ends at.' },
        relationType: {
          type: 'string',
          enum: RELATIONS,
          description: 'MainThick1, MainThick2, MainThick3, Branch, References, or Related (default Related).',
        },
        label: { type: 'string', description: 'Optional label; defaults to the relation\'s Chinese name.' },
        sourceAnchor: { type: 'string', enum: ['Top', 'Right', 'Bottom', 'Left'], description: 'Default Right.' },
        targetAnchor: { type: 'string', enum: ['Top', 'Right', 'Bottom', 'Left'], description: 'Default Left.' },
        strokeKey: { type: 'string', description: 'Colour key: branch-a…branch-e, emphasis, #rrggbb. Defaults to #000000 like the desktop app.' },
      },
      required: ['sourceNodeId', 'targetNodeId'],
    },
    async execute(args) {
      try {
        const result = mutation(store, 'create-connection', {
          sourceNodeId: requireText(args, 'sourceNodeId'),
          targetNodeId: requireText(args, 'targetNodeId'),
          relationType: optionalText(args, 'relationType'),
          label: optionalText(args, 'label'),
          sourceAnchor: optionalText(args, 'sourceAnchor'),
          targetAnchor: optionalText(args, 'targetAnchor'),
          strokeKey: optionalText(args, 'strokeKey'),
        })
        return `Created connection ${result.id} (${result.relationType}) from ${result.sourceNodeId} ` +
          `to ${result.targetNodeId}.`
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_delete_note',
    description: 'Move one note to the recycle bin and drop its connections.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'Id of the note to delete.' },
      },
      required: ['nodeId'],
    },
    async execute(args) {
      try {
        const result = store.deleteNode(requireText(args, 'nodeId'))
        return `Moved note ${result.id} to the recycle bin.`
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_project',
    description: 'Create, rename, favourite, or delete a Project Canvas project.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'rename', 'delete', 'favorite'], description: 'What to do.' },
        project: { type: 'string', description: 'Project id or name (rename, delete, favorite).' },
        name: { type: 'string', description: 'New project name (create, rename).' },
        favorite: { type: 'boolean', description: 'Favourite state (favorite).' },
      },
      required: ['action'],
    },
    async execute(args) {
      try {
        const action = requireText(args, 'action')
        if (!['create', 'rename', 'delete', 'favorite'].includes(action)) {
          throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
        }
        if (action === 'create') {
          const created = store.createProject({ name: requireText(args, 'name') })
          return `Created project "${created.name}" (id ${created.id}) with main canvas ${created.canvasId}.`
        }
        const project = resolveProject(store, requireText(args, 'project'))
        if (action === 'rename') {
          const updated = store.updateProject({ id: project.id, name: requireText(args, 'name') })
          return `Renamed project to "${updated.name}".`
        }
        if (action === 'favorite') {
          const updated = store.updateProject({ id: project.id, favorite: args?.favorite === true })
          return `Project "${updated.name}" is ${updated.favorite ? 'now a favourite' : 'no longer a favourite'}.`
        }
        if (action === 'delete') {
          const deleted = store.deleteProject(project.id)
          return `Deleted project "${deleted.name}".`
        }
        throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_group',
    description: 'Create a group around notes, move or collapse a group, or delete and restore one.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'delete', 'restore'], description: 'What to do.' },
        groupId: { type: 'string', description: 'Group id (update, delete, restore).' },
        canvas: { type: 'string', description: 'Canvas id or name (create).' },
        nodeIds: { type: 'array', items: { type: 'string' }, description: 'Notes to group (create).' },
        title: { type: 'string', description: 'Group title (create, update).' },
        x: { type: 'number', description: 'New world X (update); moves members too.' },
        y: { type: 'number', description: 'New world Y (update); moves members too.' },
        width: { type: 'number', description: 'New width (update).' },
        height: { type: 'number', description: 'New height (update).' },
        collapsed: { type: 'boolean', description: 'Collapse or expand the group (update).' },
      },
      required: ['action'],
    },
    async execute(args) {
      try {
        const action = requireText(args, 'action')
        if (!['create', 'update', 'delete', 'restore'].includes(action)) {
          throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
        }
        if (action === 'create') {
          const project = resolveProject(store, optionalText(args, 'project'))
          const canvas = resolveCanvas(store, project.id, optionalText(args, 'canvas'))
          const group = store.createGroup({
            canvasId: canvas.id,
            nodeIds: args?.nodeIds,
            title: optionalText(args, 'title'),
          })
          return `Created group ${group.id} "${group.title}" with ${group.memberIds.length} notes.`
        }
        const groupId = requireText(args, 'groupId')
        if (action === 'update') {
          const group = store.updateGroup({
            id: groupId,
            x: optionalNumber(args, 'x'),
            y: optionalNumber(args, 'y'),
            width: optionalNumber(args, 'width'),
            height: optionalNumber(args, 'height'),
            collapsed: args?.collapsed,
            title: optionalText(args, 'title'),
          })
          return `Updated group ${group.id}${group.collapsed === 1 ? ' (collapsed)' : ''}.`
        }
        if (action === 'delete') {
          store.deleteGroup(groupId)
          return `Deleted group ${groupId}; its notes are kept.`
        }
        if (action === 'restore') {
          store.restoreGroup(groupId)
          return `Restored group ${groupId}.`
        }
        throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_connection',
    description: 'Change a connection\'s relation type, label, anchors, colour, or endpoints; delete it.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['update', 'delete'], description: 'What to do.' },
        connectionId: { type: 'string', description: 'Connection id.' },
        sourceNodeId: { type: 'string', description: 'Reattach the source end to this note (update).' },
        targetNodeId: { type: 'string', description: 'Reattach the target end to this note (update).' },
        relationType: {
          type: 'string',
          enum: RELATIONS,
          description: 'New relation type (update).',
        },
        label: { type: 'string', description: 'New label (update); defaults to the relation name.' },
        sourceAnchor: { type: 'string', enum: ['Top', 'Right', 'Bottom', 'Left'], description: 'Source anchor (update).' },
        targetAnchor: { type: 'string', enum: ['Top', 'Right', 'Bottom', 'Left'], description: 'Target anchor (update).' },
        strokeKey: { type: 'string', description: 'Colour key: branch-a…branch-e, emphasis, #rrggbb, or none.' },
      },
      required: ['action', 'connectionId'],
    },
    async execute(args) {
      try {
        const action = requireText(args, 'action')
        const connectionId = requireText(args, 'connectionId')
        if (action === 'delete') {
          store.deleteConnection(connectionId)
          return `Deleted connection ${connectionId}.`
        }
        if (action === 'update') {
          const updated = store.updateConnection({
            id: connectionId,
            relationType: optionalText(args, 'relationType'),
            label: optionalText(args, 'label'),
            sourceNodeId: optionalText(args, 'sourceNodeId'),
            targetNodeId: optionalText(args, 'targetNodeId'),
            sourceAnchor: optionalText(args, 'sourceAnchor'),
            targetAnchor: optionalText(args, 'targetAnchor'),
            strokeKey: optionalText(args, 'strokeKey'),
          })
          return `Updated connection ${updated.id}: ${updated.relationType}` +
            `${updated.label ? ` (${updated.label})` : ''}.`
        }
        throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_recycle',
    description: 'List notes in the recycle bin, or restore one note from it.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'restore'], description: 'What to do.' },
        project: { type: 'string', description: 'Restrict the list to one project id or name.' },
        nodeId: { type: 'string', description: 'Note to restore.' },
        limit: { type: 'number', description: 'Maximum entries to list, 1-200 (default 50).' },
      },
      required: ['action'],
    },
    async execute(args) {
      try {
        const action = requireText(args, 'action')
        if (action === 'list') {
          const projectSelector = optionalText(args, 'project')
          const projectId = projectSelector === undefined ? undefined : resolveProject(store, projectSelector).id
          const limit = Math.min(200, Math.max(1, Math.round(optionalNumber(args, 'limit') ?? 50)))
          const items = store.listRecycle({ projectId, limit })
          if (items.length === 0) return 'The recycle bin is empty.'
          return [
            `${items.length} note(s) in the recycle bin:`,
            ...items.map((item) => `- ${item.nodeId} | "${item.title}" in ${item.projectName ?? '?'} / ` +
              `${item.canvasName ?? '?'} | deleted ${item.deletedAt}`),
          ].join('\n')
        }
        if (action === 'restore') {
          const restored = store.restoreNode(requireText(args, 'nodeId'))
          return `Restored note ${restored.id}.`
        }
        throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
      } catch (error) {
        return failureText(error)
      }
    },
  }))

  ctx.tools.register(tool({
    name: 'project_canvas_storage',
    description: 'Report where the canvas data lives, or import an existing Project Canvas database into this empty store.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['info', 'import'], description: 'What to do.' },
        path: { type: 'string', description: 'Database file to import from (import); defaults to the desktop app database.' },
      },
      required: ['action'],
    },
    async execute(args) {
      try {
        const action = requireText(args, 'action')
        if (action === 'info') {
          const info = store.storageInfo()
          return [
            `Canvas database: ${info.dbPath}`,
            `Projects: ${info.projects}; live notes: ${info.notes}`,
            info.legacyPath === null
              ? 'No legacy database is configured.'
              : `Desktop database: ${info.legacyPath} (${info.legacyAvailable ? 'available' : 'missing'})`,
            info.lockedBy === null
              ? 'No other session holds the write lock.'
              : `Write lock held by ${info.lockedBy.host} (pid ${info.lockedBy.pid}); writes are disabled here.`,
          ].join('\n')
        }
        if (action === 'import') {
          const source = optionalText(args, 'path') ?? legacyPath
          const result = store.importLegacy(source)
          const summary = Object.entries(result.counts)
            .map(([table, count]) => `${table} ${count}`)
            .join(', ')
          return `Imported from ${result.source}: ${summary}.`
        }
        throw new CanvasStoreError(`Unknown action ${action}`, 'UNKNOWN_OPERATION')
      } catch (error) {
        return failureText(error)
      }
    },
  }))
}
