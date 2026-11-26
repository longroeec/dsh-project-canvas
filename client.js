/**
 * Project Canvas — browser half.
 *
 * Mirrors the desktop app's interaction model:
 *  - one node type (Idea notes); the note body is the only text, the title is its first 24 characters;
 *  - double-click or F2 opens an inline editor over the card; Ctrl+Enter commits, Esc cancels, blur commits,
 *    and committing an empty body moves the note to the recycle bin;
 *  - blank left-drag pans, Shift+drag marquees, Ctrl+click toggles selection, Space or the middle button pans;
 *  - a connection is two clicks (anchor, then the target note), with relation and colour picked in a popover;
 *  - the wheel pans horizontally with Shift, resizes a single selected card, and otherwise zooms at the cursor.
 *
 * Data goes through the Host plugin's /project-canvas/api, which keeps the harness trust fence.
 */
window.__ModuleLoader__.load({
  id: 'dsh-project-canvas',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useLayoutEffect, useRef, useState } = React

    const NS = 'projectCanvas'
    const API = '/project-canvas/api'
    const PANEL_ID = 'project-canvas'
    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 4
    const TEXT_MIN_ZOOM = 0.35
    const MIN_WIDTH = 140
    const MIN_HEIGHT = 80
    const MAX_WIDTH = 1200
    const MAX_HEIGHT = 900
    const GRID = 24

    const DICTS = {
      en: {
        panel: 'Canvas',
        projects: 'Projects',
        canvases: 'Boards',
        newNote: 'New note',
        delete: 'Delete',
        group: 'Group',
        refresh: 'Refresh',
        fitAll: 'Fit',
        undo: 'Undo',
        redo: 'Redo',
        loading: 'Loading…',
        retry: 'Try again',
        dismiss: 'Dismiss',
        cancel: 'Cancel',
        save: 'Save',
        create: 'Create',
        noDatabase: 'Project Canvas database was not found. Open the Project Canvas desktop app once, then try again.',
        noProjects: 'No Project Canvas projects yet. Create one here, or in the desktop app.',
        boldTool: 'Bold', italicTool: 'Italic', strikeTool: 'Strikethrough', codeTool: 'Inline code',
        bulletTool: 'Bullet list', orderedTool: 'Numbered list', taskTool: 'Checklist',
        clearFormat: 'Clear list mark',
        taskDone: 'Mark as not done',
        taskOpen: 'Mark as done',
        importLegacy: 'Import desktop data',
        imported: 'Imported.',
        storagePath: 'Data file:',
        syncLocked: 'Another computer is using this data file; writes are paused here.',
        noCanvas: 'This project has no board.',
        createFirst: 'Create the first note',
        projectPrefix: 'Project',
        filterProjects: 'Filter projects…',
        emptyCanvas: 'Drag the blank canvas to pan · double-click to create a note · Shift+drag to marquee',
        notePlaceholder: 'Double-click to write…',
        collapsedSuffix: ' (collapsed)',
        syncFailed: 'Could not sync with the Project Canvas database.',
        saving: 'Saving…',
        mainCanvas: 'Main board',
        subCanvas: 'Sub-board',
        noteCount: 'notes',
        searchPlaceholder: 'Search notes…',
        searchEmpty: 'No matching notes.',
        searching: 'Searching…',
        recycleBin: 'Recycle bin',
        recycleEmpty: 'The recycle bin is empty.',
        restore: 'Restore',
        newProject: 'New project',
        projectName: 'Project name',
        rename: 'Rename',
        renameProject: 'Rename project',
        deleteProject: 'Delete project',
        confirmDelete: 'Move the selected notes to the recycle bin?',
        confirmDeleteConnection: 'Remove this connection?',
        confirmDeleteGroup: 'Delete this group? Its notes are kept.',
        confirmDeleteProject: 'Delete this project? Its boards and notes stay in the database.',
        confirmEmptyNote: 'This note has no text. Move it to the recycle bin?',
        untitled: 'Untitled',
        connection: 'Connection',
        selectLine: 'Choose a line',
        startConnect: 'Start connecting',
        apply: 'Apply',
        relation: 'Line type',
        colour: 'Line colour',
        defaultColour: 'Default',
        connectHint: 'Now click the target note',
        connected: 'Connected.',
        cancelled: 'Connection cancelled.',
        alreadyConnected: 'Those notes are already connected.',
        created: 'Created.',
        pasteEmpty: 'Nothing to paste.',
        structuredReadOnly: 'This note holds structured content (document, media, or sub-board). Edit it in the desktop app.',
        editNote: 'Edit note',
        editLine: 'Edit line',
        editorPlaceholder: 'Write a note…',
        more: 'More',
        close: 'Close',
        formatBold: 'Bold',
        formatItalic: 'Italic',
        formatUnderline: 'Underline',
        formatStrike: 'Strikethrough',
        formatBullet: 'Bulleted list',
        formatImageUnsupported: 'Images are not supported here yet',
        reconnected: 'Endpoint reattached.',
        reconnectCancelled: 'Reattach cancelled.',
        reconnectUnchanged: 'That end is already attached there.',
        menuCreate: 'Create note here',
        menuGroup: 'Group selection',
        menuDelete: 'Delete selection',
        menuFit: 'Fit content',
        relation_MainThick1: 'Main line',
        relation_MainThick2: 'Main line 2',
        relation_MainThick3: 'Main line 3',
        relation_Branch: 'Branch',
        relation_References: 'References',
        relation_Related: 'Related',
        accent_none: 'Default',
        accent_branch_a: 'Branch blue',
        accent_branch_b: 'Branch amber',
        accent_branch_c: 'Branch violet',
        accent_branch_d: 'Branch rose',
        accent_branch_e: 'Branch teal',
        accent_emphasis: 'Emphasis green',
      },
      zh: {
        panel: '画布',
        projects: '项目',
        canvases: '画布',
        newNote: '新建便签',
        delete: '删除',
        group: '分组',
        refresh: '刷新',
        fitAll: '适应',
        undo: '撤销',
        redo: '重做',
        loading: '加载中…',
        retry: '重试',
        dismiss: '关闭',
        cancel: '取消',
        save: '保存',
        create: '创建',
        noDatabase: '没有找到 Project Canvas 数据库。请先打开一次桌面端 Project Canvas，再重试。',
        noProjects: '还没有 Project Canvas 项目。可以在这里新建，或在桌面端创建。',
        boldTool: '加粗', italicTool: '斜体', strikeTool: '删除线', codeTool: '行内代码',
        bulletTool: '项目符号', orderedTool: '编号列表', taskTool: '复选框列表',
        clearFormat: '清除列表标记',
        taskDone: '标记为未完成',
        taskOpen: '标记为完成',
        importLegacy: '从桌面端导入',
        imported: '已导入。',
        storagePath: '数据文件：',
        syncLocked: '另一台电脑正在使用这个数据文件，这里的写入已暂停。',
        noCanvas: '这个项目还没有画布。',
        createFirst: '创建第一张便签',
        projectPrefix: '项目',
        filterProjects: '筛选项目…',
        emptyCanvas: '拖拽空白移动画布 · 双击创建便签 · Shift 拖拽框选',
        notePlaceholder: '双击写下内容…',
        collapsedSuffix: '（已折叠）',
        syncFailed: '无法与 Project Canvas 数据库同步。',
        saving: '保存中…',
        mainCanvas: '主画布',
        subCanvas: '局部画布',
        noteCount: '个便签',
        searchPlaceholder: '搜索便签…',
        searchEmpty: '没有匹配的便签。',
        searching: '搜索中…',
        recycleBin: '回收站',
        recycleEmpty: '回收站是空的。',
        restore: '恢复',
        newProject: '新建项目',
        projectName: '项目名',
        rename: '重命名',
        renameProject: '重命名项目',
        deleteProject: '删除项目',
        confirmDelete: '把选中的便签移到回收站？',
        confirmDeleteConnection: '删除这条连线？',
        confirmDeleteGroup: '删除这个分组？组内便签会保留。',
        confirmDeleteProject: '删除这个项目？它的画布和便签仍留在数据库里。',
        confirmEmptyNote: '这张便签没有内容，要移到回收站吗？',
        untitled: '未命名',
        connection: '连线',
        selectLine: '选择线条',
        startConnect: '开始连线',
        apply: '应用',
        relation: '线条类型',
        colour: '线条颜色',
        defaultColour: '默认',
        connectHint: '再点目标便签接入',
        connected: '已连接。',
        cancelled: '连接已取消。',
        alreadyConnected: '这两个便签已经连过了。',
        created: '已创建。',
        pasteEmpty: '没有可粘贴的内容。',
        structuredReadOnly: '这张便签包含结构化内容（文档 / 素材 / 局部画布），请在桌面端编辑。',
        editNote: '编辑便签',
        editLine: '编辑连线',
        editorPlaceholder: '记笔记…',
        more: '更多',
        close: '关闭',
        formatBold: '加粗',
        formatItalic: '斜体',
        formatUnderline: '下划线',
        formatStrike: '删除线',
        formatBullet: '项目符号',
        formatImageUnsupported: '暂不支持插入图片',
        reconnected: '已改接连线端点。',
        reconnectCancelled: '改接已取消。',
        reconnectUnchanged: '该端点已经接在这里。',
        menuCreate: '在此创建便签',
        menuGroup: '从选中创建分组',
        menuDelete: '删除选中',
        menuFit: '适应内容',
        relation_MainThick1: '主线',
        relation_MainThick2: '主线2',
        relation_MainThick3: '主线3',
        relation_Branch: '支线',
        relation_References: '引用',
        relation_Related: '关联',
        accent_none: '默认',
        accent_branch_a: '分支蓝',
        accent_branch_b: '分支琥珀',
        accent_branch_c: '分支紫',
        accent_branch_d: '分支玫瑰',
        accent_branch_e: '分支青',
        accent_emphasis: '强调绿',
      },
    }

    let translate = (key) => DICTS.en[key] ?? key
    const t = (key) => translate(key)

    /** Desktop palette (canvas content keeps the app's own colours; containers use theme tokens). */
    const PALETTE = {
      card: { light: '#EEF7F2', dark: '#24382E' },
      border: { light: '#C5D2C6', dark: '#2F4538' },
      hover: '#7FA88A',
      selected: '#3B7A57',
      title: { light: '#223E36', dark: '#E6F0EA' },
      body: { light: '#2F4A41', dark: '#C3D4C9' },
      meta: { light: '#6A8578', dark: '#9DB3A6' },
      tape: { light: '#8FA79A', dark: '#6F8A7C' },
      fills: {
        light: { 'branch-a': '#E4F0F6', 'branch-b': '#F6F0E4', 'branch-c': '#EFE8F4', 'branch-d': '#F5E8EC', 'branch-e': '#E4F2EF', emphasis: '#E4EFE7' },
        dark: { 'branch-a': '#243448', 'branch-b': '#3A3224', 'branch-c': '#322840', 'branch-d': '#3A2830', 'branch-e': '#24383A', emphasis: '#2A3A30' },
      },
      stripes: {
        light: { 'branch-a': '#4A7A96', 'branch-b': '#B8863A', 'branch-c': '#7A5F96', 'branch-d': '#A85A72', 'branch-e': '#3A8A86', emphasis: '#3B7A57' },
        dark: { 'branch-a': '#6FA0D8', 'branch-b': '#D4A35C', 'branch-c': '#A88BC8', 'branch-d': '#D08098', 'branch-e': '#5FB0B0', emphasis: '#8FB59A' },
      },
      relationColour: {
        MainThick1: '#3B7A57',
        MainThick2: '#4A7AB0',
        MainThick3: '#5A7A96',
        Branch: '#7FA88A',
        References: '#6A7A88',
        Related: '#8FA79A',
      },
      relationWidth: { MainThick1: 3.4, MainThick2: 2.5, MainThick3: 1.85, Branch: 1.05, References: 1.25, Related: 1.25 },
      relationDash: { References: '5 4', Related: '1.6 3.2' },
    }

    /** Paper surface of an uncoloured note: warm off-white with ink text, in both themes. */
    const PAPER = {
      fill: '#F7F2E7', band: '#EFE6D4', border: '#E3D9C6',
      title: '#2B2620', body: '#4B4437', meta: '#8B8172',
    }

    const ACCENT_KEYS = ['branch-a', 'branch-b', 'branch-c', 'branch-d', 'branch-e', 'emphasis']

    /** First-version accent hues, used for the card stripe and every colour swatch. */
    const ACCENT_COLOURS = {
      'branch-a': '#3f6f9e',
      'branch-b': '#4f8a6d',
      'branch-c': '#a2703f',
      'branch-d': '#8a5f9e',
      'branch-e': '#a04e58',
      emphasis: '#c2542f',
    }
    const RELATIONS = ['MainThick1', 'MainThick2', 'MainThick3', 'Branch', 'References', 'Related']
    const ANCHORS = ['Top', 'Right', 'Bottom', 'Left']

    /** Labels the app (or an older build of this plugin) wrote as defaults; they follow renames. */
    const DEFAULT_LABEL_ALIASES = new Set([
      '主线', '主线2', '主线3', '支线', '引用', '关联',
      '主线 · 粗线条1', '主线 · 粗线条2', '主线 · 粗线条3',
      'Main line', 'Main line 2', 'Main line 3', 'Branch', 'References', 'Related',
      'Main · thick 1', 'Main · thick 2', 'Main · thick 3',
    ])

    /** A connection's chip text: the stored label unless it is only a default that was renamed. */
    function connectionLabel(connection) {
      const label = String(connection.label ?? '').trim()
      const fallback = t(`relation_${connection.relationType}`)
      if (label === '' || DEFAULT_LABEL_ALIASES.has(label)) return fallback
      return label
    }

    const isDark = () => {
      try {
        return document.body?.hasAttribute('data-ds-dark-theme') === true
      } catch {
        return false
      }
    }
    const mode = () => (isDark() ? 'dark' : 'light')
    const cardFill = (accentKey) => {
      const m = mode()
      return (accentKey && PALETTE.fills[m][accentKey]) || PALETTE.card[m]
    }
    const stripeColour = (accentKey) => (accentKey && PALETTE.stripes[mode()][accentKey]) || PALETTE.tape[mode()]
    const accentLabel = (key) => t(`accent_${(key ?? 'none').replace(/-/g, '_')}`)

    /** Card text: the body is the note. Legacy structured bodies show their readable part only. */
    function displayContent(node) {
      const raw = node.content
      if (raw === null || raw === undefined || raw === '') return ''
      const text = String(raw)
      const trimmed = text.trim()
      if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return text
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed?.blocks)) {
          const parts = []
          const walk = (blocks) => {
            for (const block of blocks) {
              if (typeof block?.text === 'string') parts.push(block.text)
              if (Array.isArray(block?.content)) walk(block.content)
              if (Array.isArray(block?.items)) walk(block.items)
            }
          }
          walk(parsed.blocks)
          return parts.join(' ')
        }
        if (typeof parsed?.childCanvasId === 'string') return t('mainCanvas')
        if (typeof parsed?.fileName === 'string') return parsed.fileName
        if (typeof parsed?.path === 'string') return String(parsed.path).split(/[\\/]/).pop() ?? parsed.path
        return text
      } catch {
        return text
      }
    }

    /** Compact relative timestamp for the note footer. */
    function relativeTime(iso) {
      if (typeof iso !== 'string' || iso === '') return ''
      const time = Date.parse(iso)
      if (Number.isNaN(time)) return ''
      const minutes = Math.round((Date.now() - time) / 60000)
      const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en'
      try {
        const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
        if (Math.abs(minutes) < 1) return format.format(0, 'minute')
        if (Math.abs(minutes) < 60) return format.format(-minutes, 'minute')
        const hours = Math.round(minutes / 60)
        if (Math.abs(hours) < 24) return format.format(-hours, 'hour')
        const days = Math.round(hours / 24)
        if (Math.abs(days) < 30) return format.format(-days, 'day')
        return new Date(time).toLocaleDateString(locale)
      } catch {
        return new Date(time).toLocaleDateString()
      }
    }

    /** The title the desktop app would derive from a body; such titles are not treated as custom. */
    function derivedTitleOf(node) {
      const text = displayContent(node).trim()
      if (text === '') return ''
      const chars = [...text]
      return chars.length <= 24 ? chars.join('') : `${chars.slice(0, 24).join('')}…`
    }

    /** The user's own title, or '' when the stored title is empty or only a legacy derived one. */
    function customTitleOf(node) {
      const title = String(node.title ?? '').trim()
      if (title === '') return ''
      if (title.startsWith('{') || title.startsWith('[')) return ''
      return title === derivedTitleOf(node) ? '' : title
    }

    const RICH_INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|`[^`\n]+`)/g

    /** Inline Markdown-ish formatting kept as plain text in the database. */
    function renderInline(text, keyPrefix) {
      return String(text).split(RICH_INLINE).map((part, index) => {
        const key = `${keyPrefix}-${index}`
        if (part === '') return null
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
          return h('strong', { key }, part.slice(2, -2))
        }
        if (part.length > 4 && part.startsWith('__') && part.endsWith('__')) {
          return h('u', { key }, part.slice(2, -2))
        }
        if (part.length > 4 && part.startsWith('~~') && part.endsWith('~~')) {
          return h('s', { key }, part.slice(2, -2))
        }
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
          return h('em', { key }, part.slice(1, -1))
        }
        if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
          return h('code', { key, style: { fontFamily: 'monospace', fontSize: '0.95em' } }, part.slice(1, -1))
        }
        return h('span', { key }, part)
      })
    }

    const BLOCK_TASK = /^(\s*)[-*+]\s+\[([ xX])\]\s?(.*)$/
    const BLOCK_ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/
    const BLOCK_BULLET = /^(\s*)[-*+]\s+(.*)$/

    /** Structured body the Host sent, or the same blocks parsed from its text. */
    function noteBlocks(node, text) {
      if (Array.isArray(node.blocks) && node.blocks.length > 0) return node.blocks
      return parseBlockLines(text)
    }

    /** Lines of a note as blocks, mirroring lib/blocks.js; the Host normally sends them. */
    function parseBlockLines(text) {
      return String(text ?? '').split('\n').map((line) => {
        const indent = (match) => Math.max(0, Math.floor(match.replace(/\t/g, '  ').length / 2))
        const task = BLOCK_TASK.exec(line)
        if (task !== null) {
          return { k: 'task', t: task[3], i: indent(task[1]), c: task[2].toLowerCase() === 'x' }
        }
        const ordered = BLOCK_ORDERED.exec(line)
        if (ordered !== null) return { k: 'ol', t: ordered[3], i: indent(ordered[1]), n: Number(ordered[2]) }
        const bullet = BLOCK_BULLET.exec(line)
        if (bullet !== null) return { k: 'ul', t: bullet[2], i: indent(bullet[1]) }
        return { k: 'p', t: line, i: 0 }
      })
    }

    /** Whole note body: paragraphs, bullets, numbered lines, and tickable checkboxes. */
    function renderRichText(blocks, keyPrefix, onToggleTask) {
      if (blocks.length === 0) return null
      let ordinal = 0
      let previous = null
      return blocks.map((block, index) => {
        const indent = Math.max(0, Number(block.i) || 0) * 15
        if (block.k === 'ol') {
          ordinal = previous !== null && previous.k === 'ol' && previous.i === block.i
            ? ordinal + 1
            : (Number(block.n) || 1)
        } else {
          ordinal = 0
        }
        previous = block
        const marker = block.k === 'ul'
          ? h('span', { style: markerStyle }, '•')
          : block.k === 'ol'
            ? h('span', { style: markerStyle }, `${ordinal}.`)
            : block.k === 'task'
              ? checkboxBox(
                block.c === true,
                () => onToggleTask?.(index),
                block.c === true ? t('taskDone') : t('taskOpen'))
              : null
        return h('div', {
          key: `${keyPrefix}-line-${index}`,
          style: { display: 'flex', gap: 5, minHeight: '1em', paddingLeft: indent },
        },
        marker,
        h('span', {
          style: {
            flex: '1 1 auto', minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
            textDecoration: block.k === 'task' && block.c === true ? 'line-through' : undefined,
            opacity: block.k === 'task' && block.c === true ? 0.65 : 1,
          },
        }, renderInline(block.t, `${keyPrefix}-${index}`)))
      })
    }

    const markerStyle = { flex: '0 0 auto', opacity: 0.75, minWidth: 12, userSelect: 'none' }

    /** True for a legacy document/media/canvas payload that plain-text editing would destroy. */
    function isStructuredContent(node) {
      if (node.type === 'Idea' || node.type === undefined) return false
      const text = String(node.content ?? '').trim()
      if (!(text.startsWith('{') || text.startsWith('['))) return false
      try {
        JSON.parse(text)
        return true
      } catch {
        return false
      }
    }

    // ------------------------------------------------------------ transport

    async function callApi(path, init) {
      const response = await fetch(`${API}${path}`, {
        credentials: 'same-origin',
        headers: init?.body === undefined ? undefined : { 'content-type': 'application/json' },
        ...init,
      })
      const text = await response.text()
      let payload
      try { payload = text === '' ? {} : JSON.parse(text) } catch { payload = { message: text } }
      if (!response.ok) {
        const error = new Error(payload.message ?? `HTTP ${response.status}`)
        error.code = payload.code
        throw error
      }
      return payload
    }

    const mutate = (op, payload) =>
      callApi('/mutate', { method: 'POST', body: JSON.stringify({ op, ...payload }) }).then((result) => result.result)

    // ------------------------------------------------------------- geometry

    const ANCHOR_POINT = {
      Top: (node) => ({ x: node.x + node.width / 2, y: node.y }),
      Right: (node) => ({ x: node.x + node.width, y: node.y + node.height / 2 }),
      Bottom: (node) => ({ x: node.x + node.width / 2, y: node.y + node.height }),
      Left: (node) => ({ x: node.x, y: node.y + node.height / 2 }),
    }
    const ANCHOR_NORMAL = {
      Top: { x: 0, y: -1 },
      Right: { x: 1, y: 0 },
      Bottom: { x: 0, y: 1 },
      Left: { x: -1, y: 0 },
    }
    // Link anchors sit outside the border so the resize handles on the border stay reachable.
    const ANCHOR_PLACEMENT = {
      Top: { left: '50%', top: -16, marginLeft: -5 },
      Right: { right: -16, top: '50%', marginTop: -5 },
      Bottom: { left: '50%', bottom: -16, marginLeft: -5 },
      Left: { left: -16, top: '50%', marginTop: -5 },
    }

    const anchorFor = (anchor, node) => (ANCHOR_POINT[anchor] ?? ANCHOR_POINT.Right)(node)
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
    const snap24 = (value) => Math.round(value / GRID) * GRID

    /** Nearest anchor to a world point, the way the desktop app picks the target edge. */
    function nearestAnchor(node, world) {
      let best = 'Right'
      let bestDistance = Infinity
      for (const anchor of ANCHORS) {
        const point = anchorFor(anchor, node)
        const distance = Math.hypot(point.x - world.x, point.y - world.y)
        if (distance < bestDistance) {
          bestDistance = distance
          best = anchor
        }
      }
      return best
    }

    /** Anchor within the app's 12 DIP radius, if any. */
    function hitAnchor(node, world, zoom) {
      const threshold = 12 / Math.max(0.001, zoom)
      let best
      let bestDistance = threshold
      for (const anchor of ANCHORS) {
        const point = anchorFor(anchor, node)
        const distance = Math.hypot(point.x - world.x, point.y - world.y)
        if (distance <= bestDistance) {
          bestDistance = distance
          best = anchor
        }
      }
      return best
    }

    const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
    const RESIZE_CURSOR = { nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize' }
    const HANDLE_POSITION = {
      nw: { left: -4, top: -4 }, n: { left: '50%', top: -4, marginLeft: -4 },
      ne: { right: -4, top: -4 }, e: { right: -4, top: '50%', marginTop: -4 },
      se: { right: -4, bottom: -4 }, s: { left: '50%', bottom: -4, marginLeft: -4 },
      sw: { left: -4, bottom: -4 }, w: { left: -4, top: '50%', marginTop: -4 },
    }

    /** Resize handle under a screen point of the selected node, if any. */
    function hitResizeHandle(node, world, zoom) {
      const threshold = 10 / Math.max(0.001, zoom)
      const left = node.x
      const right = node.x + node.width
      const top = node.y
      const bottom = node.y + node.height
      const nearLeft = Math.abs(world.x - left) <= threshold
      const nearRight = Math.abs(world.x - right) <= threshold
      const nearTop = Math.abs(world.y - top) <= threshold
      const nearBottom = Math.abs(world.y - bottom) <= threshold
      const insideX = world.x >= left - threshold && world.x <= right + threshold
      const insideY = world.y >= top - threshold && world.y <= bottom + threshold
      if (!insideX || !insideY) return undefined
      if (nearLeft && nearTop) return 'nw'
      if (nearRight && nearTop) return 'ne'
      if (nearLeft && nearBottom) return 'sw'
      if (nearRight && nearBottom) return 'se'
      if (nearLeft) return 'w'
      if (nearRight) return 'e'
      if (nearTop) return 'n'
      if (nearBottom) return 's'
      return undefined
    }

    /** Cubic curve between two anchor points, control distance matching the app's clamp. */
    function buildCurve(from, fromAnchor, to, toAnchor) {
      const normalFrom = ANCHOR_NORMAL[fromAnchor] ?? ANCHOR_NORMAL.Right
      const normalTo = ANCHOR_NORMAL[toAnchor] ?? ANCHOR_NORMAL.Left
      const chord = Math.hypot(to.x - from.x, to.y - from.y)
      const bend = clamp(chord * 0.35, 32, 160)
      const c1 = { x: from.x + normalFrom.x * bend, y: from.y + normalFrom.y * bend }
      const c2 = { x: to.x + normalTo.x * bend, y: to.y + normalTo.y * bend }
      return {
        from,
        to,
        c1,
        c2,
        mid: {
          x: 0.125 * from.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * to.x,
          y: 0.125 * from.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * to.y,
        },
      }
    }

    /** Cubic path between two nodes. */
    function connectionPath(connection, nodes) {
      const source = nodes.find((node) => node.id === connection.sourceNodeId)
      const target = nodes.find((node) => node.id === connection.targetNodeId)
      if (source === undefined || target === undefined) return undefined
      return buildCurve(
        anchorFor(connection.sourceAnchor, source), connection.sourceAnchor,
        anchorFor(connection.targetAnchor, target), connection.targetAnchor,
      )
    }

    /** The curve while one endpoint follows the pointer (or snaps to a hovered note). */
    function reconnectCurve(connection, reconnect, nodes) {
      const source = nodes.find((node) => node.id === connection.sourceNodeId)
      const target = nodes.find((node) => node.id === connection.targetNodeId)
      if (source === undefined || target === undefined) return undefined
      if (reconnect.isSourceEnd) {
        const anchor = reconnect.anchor ?? connection.sourceAnchor
        const from = reconnect.hoverNode === undefined
          ? reconnect.floating
          : anchorFor(anchor, reconnect.hoverNode)
        return buildCurve(from, anchor, anchorFor(connection.targetAnchor, target), connection.targetAnchor)
      }
      const anchor = reconnect.anchor ?? connection.targetAnchor
      const to = reconnect.hoverNode === undefined
        ? reconnect.floating
        : anchorFor(anchor, reconnect.hoverNode)
      return buildCurve(anchorFor(connection.sourceAnchor, source), connection.sourceAnchor, to, anchor)
    }

    /** Closest curve parameter and distance for a world point. */
    function closestOnCurve(curve, point, samples = 48) {
      let best = { distance: Infinity, t: 0 }
      for (let step = 0; step <= samples; step += 1) {
        const s = step / samples
        const mt = 1 - s
        const x = mt * mt * mt * curve.from.x + 3 * mt * mt * s * curve.c1.x + 3 * mt * s * s * curve.c2.x + s * s * s * curve.to.x
        const y = mt * mt * mt * curve.from.y + 3 * mt * mt * s * curve.c1.y + 3 * mt * s * s * curve.c2.y + s * s * s * curve.to.y
        const distance = Math.hypot(x - point.x, y - point.y)
        if (distance < best.distance) best = { distance, t: s }
      }
      return best
    }

    const pathOf = (curve) => `M ${curve.from.x} ${curve.from.y} C ${curve.c1.x} ${curve.c1.y}, ${curve.c2.x} ${curve.c2.y}, ${curve.to.x} ${curve.to.y}`

    /** The default line ink follows the theme: white on a dark board, black on a light one. */
    const defaultInk = () => (isDark() ? '#ffffff' : '#000000')

    function connectionColour(connection) {
      const key = connection.strokeKey
      if (key === '#000000') return defaultInk()
      if (typeof key === 'string' && key.startsWith('#')) return key
      if (key && PALETTE.stripes[mode()][key]) return PALETTE.stripes[mode()][key]
      return PALETTE.relationColour[connection.relationType] ?? PALETTE.stripe
    }

    function boundsOf(nodes) {
      if (nodes.length === 0) return undefined
      let left = Infinity
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity
      for (const node of nodes) {
        left = Math.min(left, node.x)
        top = Math.min(top, node.y)
        right = Math.max(right, node.x + node.width)
        bottom = Math.max(bottom, node.y + node.height)
      }
      return { left, top, right, bottom }
    }

    // --------------------------------------------------------------- widgets

    function Button({ children, onClick, primary, danger, disabled, title }) {
      return h('button', {
        type: 'button', title, onClick: disabled ? undefined : onClick, disabled,
        'aria-label': title,
        style: {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          height: 28, padding: '0 10px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
          fontSize: 12, lineHeight: '16px', border: '1px solid var(--dsw-alias-border-l2)',
          color: danger
            ? 'var(--dsw-alias-state-error-primary)'
            : disabled ? 'var(--dsw-alias-label-tertiary)' : 'var(--dsw-alias-label-primary)',
          background: primary ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
          opacity: disabled ? 0.55 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap',
        },
      }, children)
    }

    const inputStyle = {
      width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6,
      border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)',
      color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 12, outline: 'none',
    }

    function field(label, control) {
      return h('label', { style: { display: 'grid', gap: 4, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } },
        h('span', null, label), control)
    }

    function Dialog({ title, children, onClose, footer, width = 420 }) {
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }
        document.addEventListener('keydown', onKey, true)
        return () => document.removeEventListener('keydown', onKey, true)
      }, [onClose])
      const card = h('div', {
        role: 'dialog', 'aria-label': title, 'aria-modal': true,
        style: {
          width, maxWidth: '100%', maxHeight: 'calc(100% - 8px)', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', borderRadius: 12,
          background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)',
          boxShadow: '0 12px 40px var(--dsw-alias-bg-mask-2)',
        },
      },
      h('div', { style: { padding: '12px 16px 8px', fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, title),
      h('div', {
        style: {
          padding: '0 16px', display: 'grid', gap: 10, minHeight: 0,
          overflowY: 'auto', fontSize: 12, color: 'var(--dsw-alias-label-secondary)',
        },
      }, children),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px 14px' } }, footer))
      return h('div', {
        style: {
          position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16, boxSizing: 'border-box',
          background: 'var(--dsw-alias-bg-mask-2)',
        },
        onPointerDown: (event) => { if (event.target === event.currentTarget) onClose() },
      }, card)
    }

    function Swatch({ colour, selected, onClick, title }) {
      return h('button', {
        type: 'button', title, onClick, 'aria-pressed': selected === true,
        style: {
          width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', padding: 0,
          background: colour,
          border: selected === true ? '2px solid var(--dsw-alias-label-primary)' : '1px solid var(--dsw-alias-border-l2)',
        },
      })
    }


    const toolButton = (label, title, onPress, options = {}) => h('button', {
      type: 'button', title, 'aria-label': title, disabled: options.disabled === true,
      onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
      onClick: options.disabled === true ? undefined : onPress,
      style: {
        minWidth: 30, height: 26, padding: '0 6px', borderRadius: 6,
        border: '1px solid transparent', background: 'transparent',
        color: options.disabled === true ? 'var(--dsw-alias-label-tertiary)' : 'var(--dsw-alias-label-primary)',
        cursor: options.disabled === true ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: 13, opacity: options.disabled === true ? 0.45 : 1,
        ...options.style,
      },
    }, label)

    /** A real checkbox: rounded square, filled accent when done, tick inside. */
    function checkboxBox(checked, onToggle, title) {
      return h('button', {
        type: 'button',
        role: 'checkbox',
        'aria-checked': checked === true,
        title,
        onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
        onClick: (event) => { event.stopPropagation(); onToggle() },
        style: {
          flex: '0 0 auto', width: 16, height: 16, marginTop: 3, padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4, cursor: 'pointer',
          border: `1.5px solid ${checked === true ? PALETTE.selected : '#C4B9A4'}`,
          background: checked === true ? PALETTE.selected : 'transparent',
          color: checked === true ? '#fff' : 'transparent',
          fontSize: 10, lineHeight: 1, fontFamily: 'inherit',
          transition: 'background 120ms ease, border-color 120ms ease',
        },
      }, '✓')
    }

    // --------------------------------------------------------- rich body editor

    const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
    const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (ch) => HTML_ESCAPE[ch])

    /** Inline marks rendered as real elements while editing (they stay `**`/`*`/`~~`/`` ` `` in text). */
    function inlineToHtml(text) {
      let out = escapeHtml(text)
      out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      out = out.replace(/~~([^~]+)~~/g, '<s>$1</s>')
      out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
      return out
    }

    /** Walk the editable DOM back to the mark-carrying text the note stores. */
    function htmlToInline(root) {
      const walk = (node) => {
        if (node === null || node === undefined) return ''
        if (node.nodeType === 3) return node.nodeValue ?? ''
        if (node.nodeType !== 1) return ''
        const tag = node.tagName.toLowerCase()
        const inner = Array.from(node.childNodes).map(walk).join('')
        if (tag === 'br') return '\n'
        if (tag === 'strong' || tag === 'b') return `**${inner}**`
        if (tag === 'em' || tag === 'i') return `*${inner}*`
        if (tag === 's' || tag === 'strike' || tag === 'del') return `~~${inner}~~`
        if (tag === 'code') return `\`${inner}\``
        if (tag === 'div' || tag === 'p') return `${inner}\n`
        return inner
      }
      return walk(root).replace(/\n+$/, '')
    }

    /** Blocks as the text the note stores; mirrors lib/blocks.js `toText`. */
    function blocksToEditorText(blocks) {
      return blocks.map((block) => {
        const indent = '  '.repeat(Math.max(0, Number(block.i) || 0))
        if (block.k === 'task') return `${indent}- [${block.c === true ? 'x' : ' '}] ${block.t}`
        if (block.k === 'ol') return `${indent}${Number(block.n) || 1}. ${block.t}`
        if (block.k === 'ul') return `${indent}- ${block.t}`
        return block.t
      }).join('\n')
    }

    /**
     * One editable line per block with its marker outside the editable, the way the desktop note
     * windows behave: the list shape is an element, not text the writer has to type around.
     */
    function RichBodyEditor({ initialText, onChange, onCommitEdit, onCancelEdit, t }) {
      const [blocks, setBlocks] = useState(() => parseBlockLines(initialText))
      const live = useRef(blocks)
      const nodes = useRef([])
      const activeIndex = useRef(0)
      const focusIndex = useRef(undefined)

      const publish = (next) => {
        live.current = next
        setBlocks(next)
        onChange(blocksToEditorText(next))
      }

      const setText = (index, text) => {
        const block = live.current[index]
        if (block === undefined || block.t === text) return
        publish(live.current.map((entry, position) => (position === index ? { ...entry, t: text } : entry)))
      }

      useEffect(() => {
        const index = focusIndex.current
        if (index === undefined) return
        focusIndex.current = undefined
        const element = nodes.current[index]
        if (element === null || element === undefined) return
        element.focus()
        const range = document.createRange()
        range.selectNodeContents(element)
        range.collapse(true)
        const selection = window.getSelection()
        if (selection === null) return
        selection.removeAllRanges()
        selection.addRange(range)
      })

      const markerOf = (block, ordinal) => {
        const base = { flex: '0 0 auto', minWidth: 14, opacity: 0.7, userSelect: 'none', lineHeight: '1.65' }
        if (block.k === 'ul') return h('span', { style: base }, '•')
        if (block.k === 'ol') return h('span', { style: base }, `${ordinal}.`)
        if (block.k === 'task') {
          return checkboxBox(block.c === true, () => {
            publish(live.current.map((entry, position) => (position === activeIndex.current && entry.k === 'task'
              ? { ...entry, c: entry.c !== true } : entry)))
          }, block.c === true ? t('taskDone') : t('taskOpen'))
        }
        return h('span', { style: { ...base, minWidth: 14 } }, '')
      }

      const ordinalAt = (index) => {
        const block = live.current[index]
        if (block === undefined || block.k !== 'ol') return 1
        let ordinal = Number(block.n) || 1
        for (let position = index - 1; position >= 0; position -= 1) {
          const previous = live.current[position]
          if (previous.k === 'ol' && previous.i === block.i) ordinal = (Number(previous.n) || 1) + 1
          else break
        }
        return ordinal
      }

      const commitActive = () => {
        const index = activeIndex.current
        const element = nodes.current[index]
        if (element === null || element === undefined) return
        setText(index, htmlToInline(element))
      }

      const runCommand = (command) => {
        document.execCommand('styleWithCSS', false, false)
        document.execCommand(command)
        commitActive()
      }

      const wrapCode = () => {
        const selection = window.getSelection()
        if (selection === null || selection.rangeCount === 0) return
        const range = selection.getRangeAt(0)
        if (range.collapsed) return
        const code = document.createElement('code')
        code.style.fontFamily = 'monospace'
        code.appendChild(range.extractContents())
        range.insertNode(code)
        selection.removeAllRanges()
        const after = document.createRange()
        after.selectNodeContents(code)
        selection.addRange(after)
        commitActive()
      }

      const setKind = (kind) => {
        const index = activeIndex.current
        publish(live.current.map((entry, position) => {
          if (position !== index) return entry
          if (entry.k === kind) return { ...entry, k: 'p' }
          const next = { ...entry, k: kind }
          if (kind === 'ol') next.n = 1
          if (kind === 'task') next.c = false
          return next
        }))
        focusIndex.current = index
      }

      const onKeyDown = (event, index) => {
        event.stopPropagation()
        if (event.key === 'Escape') { event.preventDefault(); onCancelEdit(); return }
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); onCommitEdit(); return }
        const block = live.current[index]
        if (block === undefined) return
        if (event.key === 'Enter') {
          if (event.shiftKey) return
          event.preventDefault()
          if (block.k !== 'p' && String(block.t).trim() === '') {
            publish(live.current.map((entry, position) => (position === index ? { ...entry, k: 'p', i: 0 } : entry)))
            focusIndex.current = index
            return
          }
          // Split at the caret so text after it moves into the new block.
          let head = block.t
          let tail = ''
          const element = nodes.current[index]
          const selection = window.getSelection()
          if (element !== null && element !== undefined && selection !== null && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const after = range.cloneRange()
            after.selectNodeContents(element)
            after.setStart(range.endContainer, range.endOffset)
            const holder = document.createElement('div')
            holder.appendChild(after.extractContents())
            tail = htmlToInline(holder)
            head = htmlToInline(element)
          }
          const fresh = block.k === 'task' ? { k: 'task', t: tail, i: block.i, c: false }
            : block.k === 'ol' ? { k: 'ol', t: tail, i: block.i, n: ordinalAt(index) + 1 }
              : block.k === 'ul' ? { k: 'ul', t: tail, i: block.i }
                : { k: 'p', t: tail, i: 0 }
          const next = live.current.map((entry, position) => (position === index ? { ...entry, t: head } : entry))
          publish([...next.slice(0, index + 1), fresh, ...next.slice(index + 1)])
          focusIndex.current = index + 1
          return
        }
        if (event.key === 'Tab') {
          event.preventDefault()
          publish(live.current.map((entry, position) => (position === index
            ? { ...entry, i: Math.max(0, (Number(entry.i) || 0) + (event.shiftKey ? -1 : 1)) } : entry)))
          focusIndex.current = index
          return
        }
        if (event.key === 'Backspace') {
          const element = nodes.current[index]
          const caretAtStart = element !== undefined && element !== null
            && window.getSelection()?.anchorOffset === 0
          if (!caretAtStart || index === 0) return
          event.preventDefault()
          const previous = live.current[index - 1]
          const merged = { ...previous, t: `${previous.t}${block.t}` }
          const next = live.current.map((entry, position) => {
            if (position === index - 1) return merged
            if (position === index) return undefined
            return entry
          }).filter((entry) => entry !== undefined)
          publish(next)
          focusIndex.current = index - 1
        }
      }

      const toolbar = h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 2, flex: '0 0 auto',
          padding: '6px 12px', borderTop: '1px solid var(--dsw-alias-border-l2)',
          background: 'var(--dsw-alias-bg-layer-2)',
        },
      },
      toolButton('B', t('boldTool'), () => runCommand('bold'), { style: { fontWeight: 700 } }),
      toolButton('I', t('italicTool'), () => runCommand('italic'), { style: { fontStyle: 'italic' } }),
      toolButton('S', t('strikeTool'), () => runCommand('strikeThrough'), { style: { textDecoration: 'line-through' } }),
      toolButton('</>', t('codeTool'), wrapCode, { style: { fontSize: 11 } }),
      h('span', { style: { width: 1, height: 16, margin: '0 6px', background: 'var(--dsw-alias-border-l2)' } }),
      toolButton('•', t('bulletTool'), () => setKind('ul')),
      toolButton('1.', t('orderedTool'), () => setKind('ol')),
      toolButton('☑', t('taskTool'), () => setKind('task')))

      let ordinal = 0
      let previous = null
      const rows = blocks.map((block, index) => {
        if (block.k === 'ol') ordinal = previous !== null && previous.k === 'ol' && previous.i === block.i
          ? ordinal + 1 : (Number(block.n) || 1)
        else ordinal = 0
        previous = block
        return h('div', {
          key: `${index}-${block.k}-${block.i}`,
          style: {
            display: 'flex', gap: 6, alignItems: 'flex-start',
            paddingLeft: Math.max(0, Number(block.i) || 0) * 15,
          },
        },
        markerOf(block, ordinal),
        h('div', {
          ref: (element) => {
            nodes.current[index] = element
            if (element === null || element.dataset.hydrated === '1') return
            element.dataset.hydrated = '1'
            element.innerHTML = inlineToHtml(block.t)
          },
          contentEditable: true,
          suppressContentEditableWarning: true,
          'data-block': index,
          onFocus: () => { activeIndex.current = index },
          onInput: (event) => setText(index, htmlToInline(event.currentTarget)),
          onKeyDown: (event) => onKeyDown(event, index),
          onBlur: () => commitActive(),
          style: {
            flex: '1 1 auto', minWidth: 0, outline: 'none',
            fontSize: 14, lineHeight: 1.65, color: 'var(--dsw-alias-label-primary)',
            whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', caretColor: PALETTE.selected,
            textDecoration: block.k === 'task' && block.c === true ? 'line-through' : undefined,
            opacity: block.k === 'task' && block.c === true ? 0.7 : 1,
          },
        }))
      })

      return h(React.Fragment, null,
        h('div', {
          'data-rich-editor': true,
          onMouseDown: (event) => {
            if (event.target !== event.currentTarget) return
            event.preventDefault()
            const last = live.current.length - 1
            publish([...live.current, { k: 'p', t: '', i: 0 }])
            focusIndex.current = last + 1
          },
          style: {
            flex: '1 1 auto', minWidth: 0, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 2,
            cursor: 'text', padding: '12px 14px 24px',
          },
        }, rows),
        toolbar)
    }

    // ---------------------------------------------------------------- canvas

    function CanvasView({
      graph, selection, selectedConnection, selectedGroup, editing, pendingLink, focusRequest, highlightId,
      onSelectNodes, onSelectConnection, onSelectGroup, onCreateNote, onMoveNodes, onResizeNode,
      onCommitEdit, onCancelEdit, onEditValue, onBeginEdit, onBeginLink, onCompleteLink, onCancelLink,
      onToggleTask, onAutoFit,
      onOpenConnection, onToggleGroup, onMoveGroup, onCamera, onViewport, onContextMenu, onWheelResize,
      onReconnect, onNewNote, onDeleteNote,
      t,
    }) {
      const hostRef = useRef(null)
      const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
      const [marquee, setMarquee] = useState(undefined)
      const [hover, setHover] = useState(undefined)
      const textRefs = useRef(new Map())
      const [pointer, setPointer] = useState(undefined)
      const [space, setSpace] = useState(false)
      const [reconnect, setReconnect] = useState(undefined)
      const [endpointHover, setEndpointHover] = useState(undefined)
      const [editorMenu, setEditorMenu] = useState(false)
      const gesture = useRef(undefined)
      const initialisedFor = useRef(undefined)
      const cameraTimer = useRef(undefined)
      const wheelCommit = useRef(undefined)
      const bodyRef = useRef(null)
      const editingKey = editing?.nodeId
      const selected = new Set(selection)
      const dark = isDark()

      const nodes = graph?.nodes ?? []
      const connections = graph?.connections ?? []
      const groups = graph?.groups ?? []
      const collapsedMembers = new Set(groups.filter((group) => group.collapsed).flatMap((group) => group.memberIds))
      const editingId = editing?.nodeId

      // Focus the body when the inline editor opens (the title stays optional).
      useEffect(() => {
        if (editingKey === undefined) return
        const area = bodyRef.current
        if (area === null) return
        area.focus()
        area.setSelectionRange(area.value.length, area.value.length)
      }, [editingKey])

      useEffect(() => { setEditorMenu(false) }, [editingKey])
      useEffect(() => {
        if (!editorMenu) return undefined
        const dismiss = (event) => {
          if (event.target instanceof Element
            && event.target.closest?.('[data-editor-menu],[data-editor-more]') !== null) return
          setEditorMenu(false)
        }
        document.addEventListener('pointerdown', dismiss, true)
        return () => document.removeEventListener('pointerdown', dismiss, true)
      }, [editorMenu])

      /** Start dragging one end of a connection (shared by the canvas and the stroke hit). */
      const beginReconnect = (connection, isSourceEnd, world, event) => {
        onSelectConnection(connection.id)
        onSelectNodes([])
        onSelectGroup(undefined)
        gesture.current = {
          kind: 'reconnect', connectionId: connection.id, isSourceEnd,
          fixedNodeId: isSourceEnd ? connection.targetNodeId : connection.sourceNodeId,
          floating: world, hoverNode: undefined, anchor: undefined,
        }
        setReconnect({
          connectionId: connection.id, isSourceEnd, floating: world,
          hoverNode: undefined, anchor: undefined,
        })
        setEndpointHover(`${connection.id}:${isSourceEnd ? 'source' : 'target'}`)
        capture(event)
      }

      const hitNode = (world) => {
        const visible = nodes.filter((node) => !collapsedMembers.has(node.id))
        let best
        for (const node of visible) {
          if (world.x < node.x || world.x > node.x + node.width) continue
          if (world.y < node.y || world.y > node.y + node.height) continue
          if (best === undefined || node.zIndex >= best.zIndex) best = node
        }
        return best
      }

      const hitGroupTitle = (world) => {
        for (let index = groups.length - 1; index >= 0; index -= 1) {
          const group = groups[index]
          if (world.x >= group.x && world.x <= group.x + group.width
            && world.y >= group.y && world.y <= group.y + 28) return group
        }
        return undefined
      }

      const hitGroupBody = (world) => {
        for (let index = groups.length - 1; index >= 0; index -= 1) {
          const group = groups[index]
          const height = group.collapsed ? 36 : group.height
          if (world.x >= group.x && world.x <= group.x + group.width
            && world.y >= group.y && world.y <= group.y + height) return group
        }
        return undefined
      }

      const fitAll = useCallback(() => {
        const host = hostRef.current
        if (host === null) return
        const visible = nodes.filter((node) => !collapsedMembers.has(node.id))
        const bounds = boundsOf(visible)
        if (bounds === undefined) {
          setCamera({ zoom: 1, x: -host.clientWidth / 2, y: -host.clientHeight / 2 })
          return
        }
        const padW = host.clientWidth * 0.05
        const padH = host.clientHeight * 0.05
        const zoom = clamp(Math.min(
          (host.clientWidth - padW * 2) / Math.max(1, bounds.right - bounds.left),
          (host.clientHeight - padH * 2) / Math.max(1, bounds.bottom - bounds.top),
        ), MIN_ZOOM, MAX_ZOOM)
        setCamera({
          zoom,
          x: (bounds.left + bounds.right) / 2 - host.clientWidth / (2 * zoom),
          y: (bounds.top + bounds.bottom) / 2 - host.clientHeight / (2 * zoom),
        })
      }, [nodes, groups])

      useEffect(() => {
        onViewport?.({ fitAll, center: () => {
          const host = hostRef.current
          if (host === null) return undefined
          return { x: camera.x + host.clientWidth / (2 * camera.zoom), y: camera.y + host.clientHeight / (2 * camera.zoom) }
        } })
        return () => onViewport?.(undefined)
      }, [camera, fitAll, onViewport])

      useEffect(() => {
        if (graph === undefined) return
        if (initialisedFor.current === graph.canvas.id) return
        initialisedFor.current = graph.canvas.id
        if (nodes.length === 0) {
          // The desktop app fits an empty board and overwrites the stored camera.
          fitAll()
          return
        }
        setCamera({
          x: graph.canvas.cameraX,
          y: graph.canvas.cameraY,
          zoom: clamp(graph.canvas.zoom || 1, MIN_ZOOM, MAX_ZOOM),
        })
      }, [graph])

      // Camera save: 350 ms debounce, matching the app's 300–400 ms schedule.
      useEffect(() => {
        if (graph === undefined) return undefined
        if (cameraTimer.current !== undefined) clearTimeout(cameraTimer.current)
        cameraTimer.current = setTimeout(() => onCamera?.(camera), 350)
        return () => { if (cameraTimer.current !== undefined) clearTimeout(cameraTimer.current) }
      }, [camera, graph])

      // Flush the pending camera when the board changes or the page unmounts.
      const cameraRef = useRef(camera)
      const cameraSink = useRef(onCamera)
      useEffect(() => { cameraRef.current = camera }, [camera])
      useEffect(() => { cameraSink.current = onCamera }, [onCamera])
      const canvasKey = graph?.canvas?.id
      useEffect(() => {
        if (canvasKey === undefined) return undefined
        return () => { cameraSink.current?.(cameraRef.current) }
      }, [canvasKey])

      useEffect(() => {
        const down = (event) => {
          if (event.code === 'Space' && !event.repeat) {
            const target = event.target
            const tag = target?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
            setSpace(true)
          }
        }
        const up = (event) => { if (event.code === 'Space') setSpace(false) }
        const blur = () => setSpace(false)
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        window.addEventListener('blur', blur)
        return () => {
          window.removeEventListener('keydown', down)
          window.removeEventListener('keyup', up)
          window.removeEventListener('blur', blur)
        }
      }, [])

      useEffect(() => {
        if (focusRequest === undefined || graph === undefined) return
        const host = hostRef.current
        const node = nodes.find((candidate) => candidate.id === focusRequest.nodeId)
        if (host === null || node === undefined) return
        setCamera({
          zoom: 1,
          x: node.x + node.width / 2 - host.clientWidth / 2,
          y: node.y + node.height / 2 - host.clientHeight / 2,
        })
      }, [focusRequest, graph])

      const toWorld = useCallback((clientX, clientY) => {
        const host = hostRef.current
        const rect = host === null ? { left: 0, top: 0 } : host.getBoundingClientRect()
        return {
          x: (clientX - rect.left) / camera.zoom + camera.x,
          y: (clientY - rect.top) / camera.zoom + camera.y,
        }
      }, [camera])

      useEffect(() => {
        const host = hostRef.current
        if (host === null) return undefined
        const onWheel = (event) => {
          event.preventDefault()
          const rect = host.getBoundingClientRect()
          if (event.shiftKey) {
            setCamera((current) => ({ ...current, x: current.x - (event.deltaY > 0 ? 60 : -60) / current.zoom }))
            return
          }
          if (!event.ctrlKey && selection.length === 1 && editingId === undefined) {
            const node = nodes.find((candidate) => candidate.id === selection[0])
            if (node !== undefined) {
              onWheelResize(node, event.deltaY > 0 ? 1.08 : 1 / 1.08)
              return
            }
          }
          const world = {
            x: (event.clientX - rect.left) / camera.zoom + camera.x,
            y: (event.clientY - rect.top) / camera.zoom + camera.y,
          }
          const zoom = clamp(camera.zoom * (event.deltaY > 0 ? 1 / 1.1 : 1.1), MIN_ZOOM, MAX_ZOOM)
          setCamera({
            zoom,
            x: world.x - (event.clientX - rect.left) / zoom,
            y: world.y - (event.clientY - rect.top) / zoom,
          })
        }
        host.addEventListener('wheel', onWheel, { passive: false })
        return () => host.removeEventListener('wheel', onWheel)
      }, [camera, selection, editingId, nodes, onWheelResize])

      // Notes grow with their text: when the body overflows the card, ask for the taller box.
      useLayoutEffect(() => {
        if (zoom < TEXT_MIN_ZOOM) return
        for (const node of nodes) {
          if (editing !== undefined && editing.node?.id === node.id) continue
          const layer = textRefs.current.get(node.id)
          if (layer === undefined) continue
          const extra = layer.scrollHeight - layer.clientHeight
          if (extra <= 2) continue
          onAutoFit?.(node.id, Math.ceil(node.height + extra / zoom))
        }
      })

      const capture = (event) => {
        try { hostRef.current?.setPointerCapture(event.pointerId) } catch { /* pointer gone */ }
      }

      const beginPan = (event) => {
        gesture.current = { kind: 'pan', origin: { x: event.clientX, y: event.clientY, camera } }
        capture(event)
      }

      const onPointerDown = (event) => {
        if (editing !== undefined) return
        const world = toWorld(event.clientX, event.clientY)
        const middleOrSpace = event.button === 1 || space || event.altKey
        if (middleOrSpace) { beginPan(event); return }
        if (event.button !== 0) return

        // 1. Pending connection: this click names the target (or cancels on blank).
        if (pendingLink !== undefined) {
          const target = hitNode(world)
          if (target !== undefined && target.id !== pendingLink.sourceId) {
            onCompleteLink(target, world)
          } else {
            onCancelLink()
          }
          return
        }
        // A press on either outer quarter of an existing connection starts a reattach, even
        // where that end overlaps a note: the end is what the pointer is pointing at.
        const endpoint = hitConnectionEndpoint(world)
        if (endpoint !== undefined) {
          const insideNode = hitNode(world) !== undefined
          const nearTerminal = Math.hypot(
            world.x - endpoint.terminal.x, world.y - endpoint.terminal.y,
          ) * camera.zoom <= 16
          if (!insideNode || nearTerminal) {
            beginReconnect(endpoint.connection, endpoint.isSourceEnd, world, event)
            return
          }
        }

        if (selection.length === 1) {
          const node = nodes.find((candidate) => candidate.id === selection[0])
          if (node !== undefined) {
            // Resize wins over link anchors on the border: the dots keep their own hit area at
            // the edge midpoints, so dragging along an edge or a corner shapes the card.
            const handle = hitResizeHandle(node, world, camera.zoom)
            if (handle !== undefined) {
              event.stopPropagation()
              gesture.current = {
                kind: 'resize', nodeId: node.id, handle,
                origin: { x: event.clientX, y: event.clientY, node },
              }
              capture(event)
              return
            }
            const anchor = hitAnchor(node, world, camera.zoom)
            if (anchor !== undefined) {
              event.stopPropagation()
              onBeginLink(node, anchor)
              return
            }
          }
        }

        // 3. Single click: note, group title bar, connection, then blank.
        const node = hitNode(world)
        if (node !== undefined) {
          const additive = event.metaKey || event.ctrlKey
          let next
          if (additive) {
            next = selected.has(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id]
          } else if (!selected.has(node.id)) {
            next = [node.id]
          } else {
            next = selection
          }
          onSelectNodes(next)
          onSelectConnection(undefined)
          onSelectGroup(undefined)
          const origins = nodes.filter((candidate) => next.includes(candidate.id))
            .map((candidate) => ({ id: candidate.id, x: candidate.x, y: candidate.y, width: candidate.width, height: candidate.height }))
          gesture.current = {
            kind: 'move', origins,
            origin: { x: event.clientX, y: event.clientY },
            moved: false,
          }
          capture(event)
          return
        }

        const groupTitle = hitGroupTitle(world)
        if (groupTitle !== undefined) {
          onSelectGroup(groupTitle.id)
          onSelectNodes([])
          const members = groupTitle.memberIds
            .map((id) => nodes.find((candidate) => candidate.id === id))
            .filter((member) => member !== undefined)
            .map((member) => ({ id: member.id, x: member.x, y: member.y }))
          gesture.current = {
            kind: 'group', groupId: groupTitle.id, members,
            origin: { x: event.clientX, y: event.clientY, groupX: groupTitle.x, groupY: groupTitle.y },
          }
          capture(event)
          return
        }

        if (hitConnectionEndpoint(world) !== undefined) {
          const endpoint = hitConnectionEndpoint(world)
          const { connection, isSourceEnd } = endpoint
          onSelectConnection(connection.id)
          onSelectNodes([])
          onSelectGroup(undefined)
          gesture.current = {
            kind: 'reconnect', connectionId: connection.id, isSourceEnd,
            fixedNodeId: isSourceEnd ? connection.targetNodeId : connection.sourceNodeId,
            floating: world, hoverNode: undefined, anchor: undefined,
          }
          setReconnect({
            connectionId: connection.id, isSourceEnd, floating: world,
            hoverNode: undefined, anchor: undefined,
          })
          capture(event)
          return
        }

        if (hitConnection(world) !== undefined) {
          const connection = hitConnection(world)
          onSelectConnection(connection.id)
          onSelectNodes([])
          onSelectGroup(undefined)
          return
        }

        // 5. Blank: marquee with Shift, pan otherwise.
        onSelectNodes([])
        onSelectConnection(undefined)
        onSelectGroup(undefined)
        if (event.shiftKey) {
          const host = hostRef.current
          const rect = host === null ? { left: 0, top: 0 } : host.getBoundingClientRect()
          gesture.current = {
            kind: 'marquee', start: world,
            origin: { x: event.clientX - rect.left, y: event.clientY - rect.top },
          }
          setMarquee({ x: event.clientX - rect.left, y: event.clientY - rect.top, width: 0, height: 0 })
          capture(event)
          return
        }
        beginPan(event)
      }

      function hitConnection(world) {
        const tolerance = 10 / Math.max(0.001, camera.zoom)
        for (let index = connections.length - 1; index >= 0; index -= 1) {
          const curve = connectionPath(connections[index], nodes)
          if (curve === undefined) continue
          if (distanceToCurve(curve, world) <= tolerance) return connections[index]
        }
        return undefined
      }

      function distanceToCurve(curve, point) {
        return closestOnCurve(curve, point).distance
      }

      /** Which connection end sits under the pointer (t ≤ 0.25 / t ≥ 0.75 within 14 DIP). */
      function hitConnectionEndpoint(world, toleranceDip = 18) {
        const tolerance = toleranceDip / Math.max(0.001, camera.zoom)
        for (let index = connections.length - 1; index >= 0; index -= 1) {
          const connection = connections[index]
          const curve = connectionPath(connection, nodes)
          if (curve === undefined) continue
          const closest = closestOnCurve(curve, world)
          if (closest.distance > tolerance) continue
          if (closest.t > 0.25 && closest.t < 0.75) continue
          const isSourceEnd = closest.t <= 0.25
          const nodeId = isSourceEnd ? connection.sourceNodeId : connection.targetNodeId
          const node = nodes.find((candidate) => candidate.id === nodeId)
          const anchor = isSourceEnd ? connection.sourceAnchor : connection.targetAnchor
          return {
            connection,
            isSourceEnd,
            node,
            terminal: node === undefined ? (isSourceEnd ? curve.from : curve.to) : anchorFor(anchor, node),
          }
        }
        return undefined
      }

      const onPointerMove = (event) => {
        const world = toWorld(event.clientX, event.clientY)
        setPointer(world)
        const active = gesture.current
        if (active === undefined) {
          const node = hitNode(world)
          setHover(node?.id)
          const endpoint = pendingLink === undefined && editing === undefined
            ? hitConnectionEndpoint(world)
            : undefined
          setEndpointHover(endpoint === undefined
            ? undefined
            : `${endpoint.connection.id}:${endpoint.isSourceEnd ? 'source' : 'target'}`)
          return
        }
        if (active.kind === 'pan') {
          const zoom = active.origin.camera.zoom
          setCamera({
            zoom,
            x: active.origin.camera.x - (event.clientX - active.origin.x) / zoom,
            y: active.origin.camera.y - (event.clientY - active.origin.y) / zoom,
          })
          return
        }
        if (active.kind === 'marquee') {
          const host = hostRef.current
          const rect = host === null ? { left: 0, top: 0 } : host.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          setMarquee({
            x: Math.min(active.origin.x, x), y: Math.min(active.origin.y, y),
            width: Math.abs(x - active.origin.x), height: Math.abs(y - active.origin.y),
          })
          return
        }
        if (active.kind === 'move') {
          active.moved = true
          // Capture only once a drag really starts, so a plain click keeps its own
          // target and the second click still reaches the card as a double-click.
          if (active.captured !== true) {
            active.captured = true
            try { hostRef.current?.setPointerCapture(active.pointerId) } catch { /* pointer gone */ }
          }
          const dx = Math.round((event.clientX - active.origin.x) / camera.zoom)
          const dy = Math.round((event.clientY - active.origin.y) / camera.zoom)
          onMoveNodes(active.origins.map((entry) => ({ id: entry.id, x: entry.x + dx, y: entry.y + dy })), false)
          return
        }
        if (active.kind === 'group') {
          const dx = Math.round((event.clientX - active.origin.x) / camera.zoom)
          const dy = Math.round((event.clientY - active.origin.y) / camera.zoom)
          onMoveGroup(active.groupId, {
            x: active.origin.groupX + dx, y: active.origin.groupY + dy,
          }, active.members.map((member) => ({ id: member.id, x: member.x + dx, y: member.y + dy })), false)
          return
        }
        if (active.kind === 'reconnect') {
          active.moved = true
          const hovered = hitNode(world)
          const valid = hovered !== undefined && hovered.id !== active.fixedNodeId
          const anchor = valid ? nearestAnchor(hovered, world) : undefined
          active.floating = world
          active.hoverNode = valid ? hovered : undefined
          active.anchor = anchor
          setReconnect({
            connectionId: active.connectionId, isSourceEnd: active.isSourceEnd,
            floating: world, hoverNode: active.hoverNode, anchor,
          })
          return
        }
        if (active.kind === 'resize') {
          const node = active.origin.node
          const dx = (event.clientX - active.origin.x) / camera.zoom
          const dy = (event.clientY - active.origin.y) / camera.zoom
          const handle = active.handle
          // Corners scale the whole card uniformly; edges stretch a single axis.
          if (handle.length === 2) {
            const factorX = (node.width + (handle.includes('e') ? dx : -dx)) / node.width
            const factorY = (node.height + (handle.includes('s') ? dy : -dy)) / node.height
            let factor = (factorX + factorY) / 2
            factor = Math.max(factor, MIN_WIDTH / node.width, MIN_HEIGHT / node.height)
            factor = Math.min(factor, MAX_WIDTH / node.width, MAX_HEIGHT / node.height)
            const uniformWidth = Math.round(node.width * factor)
            const uniformHeight = Math.round(node.height * factor)
            const uniformX = handle.includes('w') ? node.x + node.width - uniformWidth : node.x
            const uniformY = handle.includes('n') ? node.y + node.height - uniformHeight : node.y
            onResizeNode(active.nodeId, {
              x: Math.round(uniformX), y: Math.round(uniformY),
              width: uniformWidth, height: uniformHeight,
            }, false)
            return
          }
          let x = node.x
          let y = node.y
          let width = node.width
          let height = node.height
          if (handle.includes('e')) width = node.width + dx
          if (handle.includes('s')) height = node.height + dy
          if (handle.includes('w')) { width = node.width - dx; x = node.x + dx }
          if (handle.includes('n')) { height = node.height - dy; y = node.y + dy }
          width = clamp(Math.round(width), MIN_WIDTH, MAX_WIDTH)
          height = clamp(Math.round(height), MIN_HEIGHT, MAX_HEIGHT)
          onResizeNode(active.nodeId, { x: Math.round(x), y: Math.round(y), width, height }, false)
        }
      }

      const finish = (event) => {
        const active = gesture.current
        gesture.current = undefined
        if (active === undefined) return
        try { hostRef.current?.releasePointerCapture(event.pointerId) } catch { /* already released */ }
        const world = toWorld(event.clientX, event.clientY)
        if (active.kind === 'marquee') {
          const hit = nodes.filter((node) => !collapsedMembers.has(node.id)
            && node.x < world.x && node.x + node.width > active.start.x
            && node.y < world.y && node.y + node.height > active.start.y
            && active.start.x < node.x + node.width && world.x > node.x
            && active.start.y < node.y + node.height && world.y > node.y)
            .map((node) => node.id)
          onSelectNodes([...new Set(hit)])
          setMarquee(undefined)
          return
        }
        if (active.kind === 'move' && active.moved) {
          const moved = nodes.filter((node) => active.origins.some((origin) => origin.id === node.id))
            .map((node) => ({ id: node.id, x: node.x, y: node.y }))
          onMoveNodes(moved, true, active.origins.map((origin) => ({ id: origin.id, x: origin.x, y: origin.y })))
        }
        if (active.kind === 'group') {
          const group = groups.find((candidate) => candidate.id === active.groupId)
          if (group !== undefined) {
            onMoveGroup(group.id, { x: group.x, y: group.y }, [], true)
          }
        }
        if (active.kind === 'resize') {
          const node = nodes.find((candidate) => candidate.id === active.nodeId)
          if (node !== undefined) {
            onResizeNode(node.id, { x: node.x, y: node.y, width: node.width, height: node.height }, true, {
              x: active.origin.node.x, y: active.origin.node.y,
              width: active.origin.node.width, height: active.origin.node.height,
            })
          }
        }
        if (active.kind === 'reconnect') {
          setReconnect(undefined)
          // A plain click on the end only selects the connection; a drag reattaches it.
          if (active.moved !== true) return
          const hovered = hitNode(world)
          const valid = hovered !== undefined && hovered.id !== active.fixedNodeId
          if (valid) {
            onReconnect?.({
              connectionId: active.connectionId,
              isSourceEnd: active.isSourceEnd,
              nodeId: hovered.id,
              anchor: nearestAnchor(hovered, world),
            })
          } else {
            onReconnect?.(undefined)
          }
          setReconnect(undefined)
        }
      }

      // Escape cancels an in-progress reattach.
      useEffect(() => {
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          if (gesture.current?.kind === 'reconnect') {
            gesture.current = undefined
            setReconnect(undefined)
            onReconnect?.(undefined)
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onReconnect])

      const onCanvasDoubleClick = (event) => {
        if (editing !== undefined) return
        if (event.target !== event.currentTarget && event.target.dataset?.role !== 'canvas-bg') return
        const world = toWorld(event.clientX, event.clientY)
        if (hitNode(world) !== undefined) return
        const connection = hitConnection(world)
        if (connection !== undefined) {
          onSelectConnection(connection.id)
          onOpenConnection(connection)
          return
        }
        const group = hitGroupBody(world)
        if (group !== undefined) { onToggleGroup(group); return }
        onCreateNote({ x: world.x, y: world.y })
      }

      const openContextMenu = (event) => {
        event.preventDefault()
        const world = toWorld(event.clientX, event.clientY)
        const node = hitNode(world)
        if (node !== undefined && !selected.has(node.id)) onSelectNodes([node.id])
        const connection = node === undefined ? hitConnection(world) : undefined
        const target = node !== undefined
          ? { kind: 'node', id: node.id }
          : connection !== undefined ? { kind: 'connection', id: connection.id } : { kind: 'blank' }
        // The page positions the menu against its own root box, so keep viewport coordinates.
        onContextMenu?.({
          x: event.clientX,
          y: event.clientY,
          world,
          target,
        })
      }

      // ---- rendering ------------------------------------------------------

      const zoom = camera.zoom
      const worldOffset = { x: -camera.x * zoom, y: -camera.y * zoom }

      const groupRectangles = groups.map((group) => {
        const height = group.collapsed ? 36 : group.height
        const isSelected = selectedGroup === group.id
        const label = group.collapsed ? `${group.title}${t('collapsedSuffix')}` : group.title
        return h('g', { key: `g-${group.id}` },
          h('rect', {
            x: group.x, y: group.y, width: group.width, height,
            rx: 16,
            fill: isSelected
              ? `color-mix(in srgb, ${PALETTE.selected} 10%, transparent)`
              : 'color-mix(in srgb, var(--dsw-alias-label-tertiary) 5%, transparent)',
            stroke: isSelected ? PALETTE.selected : 'var(--dsw-alias-border-l3)',
            strokeWidth: isSelected ? 1.6 : 1,
            strokeDasharray: isSelected ? undefined : '6 5',
          }),
          zoom < TEXT_MIN_ZOOM ? null : h('text', {
            x: group.x + 14, y: group.y + 20,
            fontSize: 12.5, fill: 'var(--dsw-alias-label-secondary)',
            style: { letterSpacing: 0.2 },
          }, `${group.collapsed ? '▸' : '▾'} ${label}`))
      })

      const groupRects = h('g', null, groupRectangles)

      const connectionLayer = connections.map((connection) => {
        const reconnecting = reconnect !== undefined && reconnect.connectionId === connection.id
        const curve = reconnecting ? reconnectCurve(connection, reconnect, nodes) : connectionPath(connection, nodes)
        if (curve === undefined) return null
        const isSelected = selectedConnection === connection.id || reconnecting
        const width = (PALETTE.relationWidth[connection.relationType] ?? 1.25) + (isSelected ? 0.9 : 0)
        const dash = reconnecting ? '5 4' : PALETTE.relationDash[connection.relationType]
        const label = connectionLabel(connection)
        const showLabel = !reconnecting && (isSelected || zoom >= 0.85) && zoom >= 0.4
        const labelWidth = Math.max(28, label.length * 11 * zoom * 0.62)
        return h('g', { key: `c-${connection.id}` },
          h('path', {
            d: pathOf(curve), fill: 'none', stroke: connectionColour(connection),
            strokeWidth: width, strokeDasharray: dash, strokeLinecap: 'round',
            opacity: isSelected ? 1 : 0.92,
            style: reconnecting ? { pointerEvents: 'none' } : { pointerEvents: 'stroke', cursor: 'pointer' },
            onPointerDown: (event) => {
              event.stopPropagation()
              if (event.button !== 0) return
              const world = toWorld(event.clientX, event.clientY)
              const closest = closestOnCurve(curve, world)
              // Outer quarters drag the end; the middle half only selects the line.
              if (closest.t <= 0.25 || closest.t >= 0.75) {
                beginReconnect(connection, closest.t <= 0.25, world, event)
              }
            },
            onPointerMove: (event) => {
              const world = toWorld(event.clientX, event.clientY)
              const closest = closestOnCurve(curve, world)
              const quarter = closest.t <= 0.25 || closest.t >= 0.75
              event.currentTarget.style.cursor = quarter ? 'crosshair' : 'pointer'
              if (quarter) {
                setEndpointHover(`${connection.id}:${closest.t <= 0.25 ? 'source' : 'target'}`)
              } else {
                setEndpointHover((current) => (current?.startsWith(`${connection.id}:`) ? undefined : current))
              }
            },
            onPointerLeave: () => {
              setEndpointHover((current) => (current?.startsWith(`${connection.id}:`) ? undefined : current))
            },
            onClick: (event) => {
              event.stopPropagation()
              onSelectConnection(connection.id)
              onSelectNodes([])
              onSelectGroup(undefined)
            },
            onDoubleClick: (event) => {
              event.stopPropagation()
              onSelectConnection(connection.id)
              onOpenConnection(connection)
            },
          }),
          h('path', {
            d: `M ${curve.to.x - 9} ${curve.to.y - 3} L ${curve.to.x} ${curve.to.y} L ${curve.to.x - 9} ${curve.to.y + 3}`,
            fill: 'none', stroke: connectionColour(connection), strokeWidth: width,
            strokeLinecap: 'round', style: { pointerEvents: 'none' },
          }),
          isSelected || endpointHover?.startsWith(`${connection.id}:`)
            ? h('g', { style: { pointerEvents: 'none' } },
              h('circle', {
                cx: curve.from.x, cy: curve.from.y, r: 5,
                fill: 'var(--dsw-alias-bg-base)', stroke: connectionColour(connection), strokeWidth: 1.6,
              }),
              h('circle', {
                cx: curve.to.x, cy: curve.to.y, r: 5,
                fill: 'var(--dsw-alias-bg-base)', stroke: connectionColour(connection), strokeWidth: 1.6,
              }))
            : null,
          showLabel ? h('g', { style: { pointerEvents: 'none' } },
            h('rect', {
              x: curve.mid.x - labelWidth / 2, y: curve.mid.y - 17 * zoom,
              width: labelWidth, height: 17 * zoom, rx: 999,
              fill: 'var(--dsw-alias-bg-layer-2)',
              stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 0.75,
              opacity: 0.96,
            }),
            h('text', {
              x: curve.mid.x, y: curve.mid.y - 4 * zoom, textAnchor: 'middle',
              fontSize: Math.max(9, 10.5 * zoom),
              fill: isSelected ? PALETTE.selected : 'var(--dsw-alias-label-secondary)',
              style: { letterSpacing: 0.2 },
            }, label)) : null)
      })

      const linkPreview = pendingLink === undefined || pointer === undefined ? null : (() => {
        const source = nodes.find((node) => node.id === pendingLink.sourceId)
        if (source === undefined) return null
        const from = anchorFor(pendingLink.anchor, source)
        return h('path', {
          d: `M ${from.x} ${from.y} L ${pointer.x} ${pointer.y}`,
          fill: 'none', stroke: pendingLink.strokeKey === '#000000'
            ? defaultInk()
            : (PALETTE.stripes[mode()][pendingLink.strokeKey]
              ?? PALETTE.relationColour[pendingLink.relationType] ?? PALETTE.selected),
          strokeWidth: PALETTE.relationWidth[pendingLink.relationType] ?? 1.6,
          strokeDasharray: PALETTE.relationDash[pendingLink.relationType],
          opacity: 0.85, style: { pointerEvents: 'none' },
        })
      })()

      const nodeCards = nodes.map((node) => {
        const isSelected = selected.has(node.id)
        const isEditing = editingId === node.id
        const isHover = hover === node.id
        const showText = zoom >= TEXT_MIN_ZOOM
        const accent = node.accentKey
        const isHighlight = highlightId === node.id
        // First-version card: plain surface with a colour stripe down the left edge.
        const accentStripe = accent === null || accent === undefined
          ? 'var(--dsw-alias-border-l3)'
          : (ACCENT_COLOURS[accent] ?? 'var(--dsw-alias-border-l3)')
        const hasAccent = accent !== null && accent !== undefined
        const card = {
          position: 'absolute', inset: 0, boxSizing: 'border-box',
          borderRadius: 10,
          padding: 0,
          display: 'flex', flexDirection: 'column',
          background: hasAccent ? cardFill(accent) : PAPER.fill,
          border: `${isHighlight ? 2 : 1}px solid ${isHighlight
            ? '#C47B2C'
            : isSelected || isEditing ? PALETTE.selected : PAPER.border}`,
          boxShadow: isSelected || isEditing || isHighlight
            ? '0 4px 16px var(--dsw-alias-bg-mask-2)'
            : '0 1px 4px var(--dsw-alias-bg-mask-2)',
          overflow: 'hidden', cursor: 'grab', userSelect: 'none',
        }
        const bodyText = displayContent(node)
        const customTitle = customTitleOf(node)
        const scale = Math.min(1, zoom)
        const showTitleBand = showText && customTitle !== '' && node.height * zoom > 40
        // The colour band is the card's header: full width, and it carries the title.
        const headerBand = showTitleBand || hasAccent ? h('div', {
          style: {
            flex: '0 0 auto', display: 'flex', alignItems: 'center',
            height: showTitleBand ? Math.max(26, 30 * scale) : Math.max(5, 7 * scale),
            padding: showTitleBand ? `0 ${12 * scale}px` : 0,
            background: hasAccent ? accentStripe : PAPER.band,
            color: hasAccent ? '#ffffff' : PAPER.title,
          },
        }, showTitleBand ? h('div', {
          style: {
            minWidth: 0, width: '100%',
            fontSize: 12 * Math.max(0.8, zoom), fontWeight: 600, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          },
        }, customTitle) : null) : null
        const bodyFont = 11 * Math.max(0.75, zoom)
        const bodyPadding = `${(showTitleBand ? 8 : 10) * scale}px ${12 * scale}px ${10 * scale}px`
        const textLayer = showText ? h('div', {
          style: {
            position: 'relative', overflow: 'hidden',
            flex: '1 1 auto', minHeight: 0,
            padding: bodyPadding,
            fontSize: bodyFont, lineHeight: 1.45,
            color: hasAccent ? PALETTE.body[mode()] : PAPER.body,
          },
          ref: (element) => {
            if (element === null) textRefs.current.delete(node.id)
            else textRefs.current.set(node.id, element)
          },
        }, bodyText === ''
          ? h('span', { style: { color: PAPER.meta, fontStyle: 'italic', opacity: 0.9 } }, t('notePlaceholder'))
          : renderRichText(noteBlocks(node, bodyText), `n-${node.id}`,
            (index) => onToggleTask?.(node.id, index))) : null

        const wrapperStyle = {
          position: 'absolute',
          left: node.x * zoom + worldOffset.x,
          top: node.y * zoom + worldOffset.y,
          width: node.width * zoom,
          height: node.height * zoom,
          zIndex: isSelected || isEditing ? 6 : 1,
        }

        const handles = isSelected && selection.length === 1 && !isEditing
          ? RESIZE_HANDLES.map((handle) => h('div', {
            key: handle, role: 'resize-handle', 'data-handle': handle,
            onPointerDown: (event) => {
              if (event.button !== 0) return
              event.stopPropagation()
              gesture.current = {
                kind: 'resize', nodeId: node.id, handle,
                origin: { x: event.clientX, y: event.clientY, node },
              }
              capture(event)
            },
            style: {
              position: 'absolute', width: 9, height: 9, borderRadius: '50%',
              background: 'var(--dsw-alias-bg-base)',
              border: `1.5px solid ${PALETTE.selected}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
              zIndex: 4, cursor: RESIZE_CURSOR[handle],
              ...HANDLE_POSITION[handle],
            },
          }))
          : null

        let anchors = null
        if (reconnect !== undefined) {
          if (reconnect.hoverNode !== undefined && reconnect.hoverNode.id === node.id) {
            anchors = ANCHORS.map((anchor) => anchorDot(anchor, 'MainThick1'))
          }
        } else if (pendingLink !== undefined) {
          if (hover === node.id && pendingLink.sourceId !== node.id) {
            anchors = ANCHORS.map((anchor) => anchorDot(
              anchor, pendingLink.relationType, node,
              () => onCompleteLink(node, anchorFor(anchor, node))))
          }
        } else if (!isEditing && (hover === node.id || (isSelected && selection.length === 1))) {
          anchors = ANCHORS.map((anchor) => anchorDot(anchor, 'MainThick1', node, (picked) => onBeginLink(node, picked)))
        }

        function anchorDot(anchor, relation, targetNode, onClick) {
          return h('div', {
            key: `a-${anchor}`,
            role: 'note-anchor',
            onPointerDown: (event) => {
              if (event.button !== 0) return
              event.stopPropagation()
              if (onClick !== undefined) onClick(anchor)
            },
            style: {
              position: 'absolute', width: 11, height: 11, borderRadius: '50%',
              background: `radial-gradient(circle, ${PALETTE.selected} 0 2.6px, transparent 3.2px), var(--dsw-alias-bg-base)`,
              border: `1.5px solid ${PALETTE.selected}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
              zIndex: 5, cursor: 'crosshair', ...ANCHOR_PLACEMENT[anchor],
            },
          })
        }

        return h('div', {
          key: node.id,
          style: wrapperStyle,
          onPointerDown: (event) => {
            if (event.button !== 0 || editing !== undefined) return
            event.stopPropagation()
            if (pendingLink !== undefined) {
              if (pendingLink.sourceId === node.id) onCancelLink()
              else onCompleteLink(node, toWorld(event.clientX, event.clientY))
              return
            }
            const additive = event.metaKey || event.ctrlKey
            let next
            if (additive) {
              next = selected.has(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id]
            } else if (!selected.has(node.id)) {
              next = [node.id]
            } else {
              next = selection
            }
            onSelectNodes(next)
            onSelectConnection(undefined)
            onSelectGroup(undefined)
            gesture.current = {
              kind: 'move',
              pointerId: event.pointerId,
              origins: nodes.filter((candidate) => next.includes(candidate.id))
                .map((candidate) => ({ id: candidate.id, x: candidate.x, y: candidate.y, width: candidate.width, height: candidate.height })),
              origin: { x: event.clientX, y: event.clientY },
              moved: false,
            }
          },
          onDoubleClick: (event) => { event.stopPropagation(); onBeginEdit(node) },
          onPointerEnter: () => setHover(node.id),
          onPointerLeave: () => setHover((current) => (current === node.id ? undefined : current)),
        },
        h('div', { style: card }, headerBand, textLayer),
        handles,
        anchors)
      })

      const editorScale = Math.min(1, zoom)
      const hostBox = hostRef.current
      const hostWidth = hostBox?.clientWidth ?? 800
      const hostHeight = hostBox?.clientHeight ?? 600
      const editorWidth = editing === undefined
        ? 0
        : Math.min(Math.max(editing.node.width * zoom, 420), Math.max(320, hostWidth - 24))
      const editorHeight = editing === undefined
        ? 0
        : Math.min(Math.max(editing.node.height * zoom, 460), Math.max(320, hostHeight - 24))
      const accentColour = editing?.accentKey ? ACCENT_COLOURS[editing.accentKey] : undefined
      const headerBackground = accentColour ?? 'var(--dsw-alias-bg-layer-2)'
      const headerInk = accentColour === undefined ? 'var(--dsw-alias-label-primary)' : '#ffffff'
      const headerInkMuted = accentColour === undefined ? 'var(--dsw-alias-label-tertiary)' : 'rgba(255,255,255,0.8)'

      const headerButtonStyle = {
        width: 30, height: 30, flex: '0 0 auto', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 6,
        border: 'none', background: 'transparent', color: headerInk,
        cursor: 'pointer', fontSize: 18, lineHeight: 1, fontFamily: 'inherit',
      }

      const applyInline = (prefix, suffix) => {
        if (editing === undefined) return
        const value = editing.body
        const area = bodyRef.current
        if (area === null) {
          onEditValue('body', `${value}${prefix}${suffix}`)
          return
        }
        const start = area.selectionStart ?? value.length
        const end = area.selectionEnd ?? value.length
        const selected = value.slice(start, end)
        const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`
        onEditValue('body', next)
        requestAnimationFrame(() => {
          const target = bodyRef.current
          if (target === null) return
          target.focus()
          const caret = start + prefix.length
          target.setSelectionRange(caret, caret + selected.length)
        })
      }

      /** Prefix (or clear) the list marker on every line the caret or selection touches. */
      const applyList = (kind) => {
        if (editing === undefined) return
        const value = editing.body
        const area = bodyRef.current
        const start = area === null ? value.length : (area.selectionStart ?? value.length)
        const end = area === null ? start : (area.selectionEnd ?? start)
        const from = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
        const to = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end)
        const lines = value.slice(from, to).split('\n')
        const PREFIX = /^([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d{1,9}[.)]\s+)/
        const already = kind !== 'none' && lines.every((line) => {
          const rest = line.replace(/^\s*/, '')
          if (kind === 'ul') return /^[-*+]\s+/.test(rest) && !/^[-*+]\s+\[/.test(rest)
          if (kind === 'task') return /^[-*+]\s+\[[ xX]\]/.test(rest)
          return /^\d{1,9}[.)]\s+/.test(rest)
        })
        let ordinal = 0
        const next = lines.map((line) => {
          const indent = /^\s*/.exec(line)[0]
          const rest = line.slice(indent.length).replace(PREFIX, '')
          ordinal += 1
          if (kind === 'none' || already) return `${indent}${rest}`
          if (kind === 'ol') return `${indent}${ordinal}. ${rest}`
          if (kind === 'task') return `${indent}- [ ] ${rest}`
          return `${indent}- ${rest}`
        }).join('\n')
        onEditValue('body', value.slice(0, from) + next + value.slice(to))
        requestAnimationFrame(() => {
          const target = bodyRef.current
          if (target === null) return
          target.focus()
          target.setSelectionRange(from, from + next.length)
        })
      }


      // A small formatting row above the colours: the list markers are the discoverable entry
      // point, and the inline marks already existed in the renderer but had no button.
      const editorToolbar = editing === undefined ? null : h('div', {
        'data-editor-toolbar': true,
        style: {
          display: 'flex', alignItems: 'center', gap: 2, flex: '0 0 auto',
          padding: '4px 10px', borderTop: '1px solid var(--dsw-alias-border-l2)',
          background: 'var(--dsw-alias-bg-layer-2)',
        },
      },
      toolButton('B', t('boldTool'), () => applyInline('**', '**'), { style: { fontWeight: 700 } }),
      toolButton('I', t('italicTool'), () => applyInline('*', '*'), { style: { fontStyle: 'italic' } }),
      toolButton('S', t('strikeTool'), () => applyInline('~~', '~~'), { style: { textDecoration: 'line-through' } }),
      toolButton('</>', t('codeTool'), () => applyInline('`', '`'), { style: { fontSize: 11 } }),
      h('span', { style: { width: 1, height: 16, margin: '0 6px', background: 'var(--dsw-alias-border-l2)' } }),
      toolButton('•', t('bulletTool'), () => applyList('ul')),
      toolButton('1.', t('orderedTool'), () => applyList('ol')),
      toolButton('☑', t('taskTool'), () => applyList('task')),
      toolButton('⟲', t('clearFormat'), () => applyList('none')))

      const swatchMenu = editing === undefined || !editorMenu ? null : h('div', {
        'data-editor-menu': true,
        style: {
          position: 'absolute', top: 44, right: 8, zIndex: 3,
          padding: 8, borderRadius: 10, minWidth: 176,
          background: 'var(--dsw-alias-bg-layer-2)',
          border: '1px solid var(--dsw-alias-border-l2)',
          boxShadow: '0 10px 26px var(--dsw-alias-bg-mask-2)',
        },
      },
      h('button', {
        type: 'button',
        onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
        onClick: () => {
          setEditorMenu(false)
          // Cancel first so the resulting blur cannot commit a deleted note.
          onCancelEdit()
          onDeleteNote?.(editing.nodeId)
        },
        style: {
          display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px',
          border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer',
          fontSize: 12, color: 'var(--dsw-alias-state-error-primary)', fontFamily: 'inherit',
        },
      }, t('deleteNote')))

      const editor = editing === undefined ? null : h('div', {
        onPointerDown: (event) => event.stopPropagation(),
        onDoubleClick: (event) => event.stopPropagation(),
        onBlur: (event) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
          onCommitEdit()
        },
        style: {
          position: 'absolute', zIndex: 20,
          left: Math.max(8, Math.min(
            (editing.node.x) * zoom + worldOffset.x,
            hostWidth - editorWidth - 8,
          )),
          top: Math.max(8, Math.min(
            (editing.node.y) * zoom + worldOffset.y,
            hostHeight - editorHeight - 8,
          )),
          width: editorWidth,
          height: editorHeight,
          display: 'flex', flexDirection: 'column',
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid var(--dsw-alias-border-l2)',
          background: 'var(--dsw-alias-bg-base)',
          boxShadow: '0 12px 32px var(--dsw-alias-bg-mask-2)',
          fontFamily: 'inherit',
        },
      },
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 auto',
          height: 44, padding: '0 6px', background: headerBackground, color: headerInk,
        },
      },
      h('button', {
        type: 'button', title: t('newNote'), 'aria-label': t('newNote'),
        onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
        onClick: () => { onCommitEdit(); onNewNote?.() },
        style: headerButtonStyle,
      }, '+'),
      h('input', {
        value: editing.title,
        placeholder: t('titlePlaceholder'),
        'aria-label': t('title'),
        onChange: (event) => onEditValue('title', event.target.value),
        onKeyDown: (event) => {
          event.stopPropagation()
          if (event.key === 'Escape') { event.preventDefault(); onCancelEdit(); return }
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); onCommitEdit(); return }
          const area = bodyRef.current
          if (area === null) return
          const value = editing.body
          const write = (nextValue, caret) => {
            onEditValue('body', nextValue)
            requestAnimationFrame(() => {
              const target = bodyRef.current
              if (target === null) return
              target.focus()
              target.setSelectionRange(caret, caret)
            })
          }
          if (event.key === 'Tab') {
            event.preventDefault()
            const from = value.lastIndexOf('\n', area.selectionStart - 1) + 1
            const to = value.indexOf('\n', area.selectionEnd) === -1 ? value.length : value.indexOf('\n', area.selectionEnd)
            const block = value.slice(from, to)
            const next = block.split('\n')
              .map((line) => (event.shiftKey ? line.replace(/^ {1,2}/, '') : `  ${line}`))
              .join('\n')
            write(value.slice(0, from) + next + value.slice(to), from + next.length)
            return
          }
          if (event.key !== 'Enter' || event.shiftKey) return
          const lineStart = value.lastIndexOf('\n', area.selectionStart - 1) + 1
          const line = value.slice(lineStart, area.selectionStart)
          const task = /^(\s*)([-*+])\s+\[[ xX]\]\s?(.*)$/.exec(line)
          const ordered = task === null ? /^(\s*)(\d{1,9})([.)])\s+(.*)$/.exec(line) : null
          const bullet = task === null && ordered === null ? /^(\s*)([-*+])\s+(.*)$/.exec(line) : null
          const match = task ?? ordered ?? bullet
          if (match === null) return
          event.preventDefault()
          const content = task !== null ? task[3] : ordered !== null ? ordered[4] : bullet[3]
          if (String(content).trim() === '') {
            const stripped = match[1]
            write(value.slice(0, lineStart) + stripped + value.slice(area.selectionStart), lineStart + stripped.length)
            return
          }
          const prefix = task !== null
            ? `${task[1]}${task[2]} [ ] `
            : ordered !== null
              ? `${ordered[1]}${Number(ordered[2]) + 1}${ordered[3]} `
              : `${bullet[1]}${bullet[2]} `
          write(`${value.slice(0, area.selectionStart)}\n${prefix}${value.slice(area.selectionEnd)}`,
            area.selectionStart + 1 + prefix.length)
        },
        style: {
          flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none',
          padding: 0, fontSize: 14, fontWeight: 600,
          color: headerInk, fontFamily: 'inherit',
        },
      }),
      h('button', {
        type: 'button', title: t('more'), 'aria-label': t('more'), 'data-editor-more': true,
        onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
        onClick: () => setEditorMenu((open) => !open),
        style: { ...headerButtonStyle, fontSize: 16 },
      }, '⋯'),
      h('button', {
        type: 'button', title: t('close'), 'aria-label': t('close'),
        onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
        onClick: () => onCommitEdit(),
        style: { ...headerButtonStyle, fontSize: 20 },
      }, '×')),

      h('div', {
        style: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
      }, h(RichBodyEditor, {
        initialText: editing.body,
        onChange: (text) => onEditValue('body', text),
        onCommitEdit,
        onCancelEdit,
        t,
      })),

      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto',
          padding: '8px 12px',
          background: 'var(--dsw-alias-bg-layer-2)',
        },
      },
      [null, ...ACCENT_KEYS].map((key) => h('button', {
        key: key ?? 'none',
        type: 'button',
        title: accentLabel(key),
        'aria-label': accentLabel(key),
        'aria-pressed': (editing.accentKey ?? null) === (key ?? null),
        onPointerDown: (event) => { event.preventDefault(); event.stopPropagation() },
        onClick: () => onEditValue('accentKey', key),
        style: {
          width: 22, height: 22, borderRadius: '50%', padding: 0, cursor: 'pointer',
          background: key === null ? 'var(--dsw-alias-card-fill)' : ACCENT_COLOURS[key],
          border: (editing.accentKey ?? null) === (key ?? null)
            ? '2px solid var(--dsw-alias-label-primary)'
            : '1px solid var(--dsw-alias-border-l2)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        },
      }))),

      swatchMenu)

      const marqueeBox = marquee === undefined ? null : h('div', {
        style: {
          position: 'absolute', zIndex: 8, pointerEvents: 'none',
          left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height,
          border: `1.2px dashed ${PALETTE.selected}`,
          background: 'rgba(130,154,135,0.16)',
        },
      })

      const hint = selection.length === 0 && pendingLink === undefined && nodes.length > 0 ? null : null

      const zoomChip = h('div', {
        style: {
          position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 8, alignItems: 'center',
          padding: '4px 10px', borderRadius: 999, fontSize: 11,
          background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)',
          color: 'var(--dsw-alias-label-secondary)',
        },
      },
      h('span', null, `${Math.round(zoom * 100)}%`),
      h('button', {
        type: 'button', title: t('fitAll'), onClick: fitAll,
        style: { border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', fontSize: 11, padding: 0 },
      }, t('fitAll')))

      const guide = nodes.length === 0
        ? h('button', {
          type: 'button',
          onClick: () => {
            const host = hostRef.current
            if (host === null) return
            const world = { x: camera.x + host.clientWidth / (2 * camera.zoom), y: camera.y + host.clientHeight / (2 * camera.zoom) }
            onCreateNote({ x: world.x, y: world.y })
          },
          style: {
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 72px)',
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
            border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)',
            color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit', zIndex: 7,
          },
        }, t('createFirst'))
        : null

      const hintBar = h('div', {
        style: {
          position: 'absolute', left: 12, bottom: 12, fontSize: 11, pointerEvents: 'none',
          color: 'var(--dsw-alias-label-tertiary)', maxWidth: 'calc(100% - 200px)',
        },
      }, pendingLink === undefined ? t('emptyCanvas') : t('connectHint'))

      return h('div', {
        ref: hostRef,
        'data-role': 'canvas-bg',
        onPointerDown,
        onPointerMove,
        onPointerUp: finish,
        onPointerCancel: finish,
        onDoubleClick: onCanvasDoubleClick,
        onContextMenu: openContextMenu,
        style: {
          position: 'absolute', inset: 0, overflow: 'hidden',
          cursor: space ? 'grab' : endpointHover !== undefined ? 'crosshair' : 'default',
          background: 'var(--dsw-alias-bg-base)',
          backgroundImage: zoom < 1 / 3 ? 'none' : 'radial-gradient(var(--dsw-alias-border-l3) 1px, transparent 1px)',
          backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
          backgroundPosition: `${worldOffset.x}px ${worldOffset.y}px`,
          touchAction: 'none',
        },
      },
      h('svg', { style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' } },
        h('g', { transform: `translate(${worldOffset.x} ${worldOffset.y}) scale(${zoom})` },
          groupRects, connectionLayer, linkPreview)),
      nodeCards,
      editor,
      marqueeBox,
      guide,
      zoomChip,
      hintBar,
      hint)
    }

    // ------------------------------------------------------------------ page

    function CanvasPage() {
      const [bootstrap, setBootstrap] = useState(undefined)
      const [fatal, setFatal] = useState(undefined)
      const [banner, setBanner] = useState(undefined)
      const [notice, setNotice] = useState(undefined)
      const [pendingCount, setPendingCount] = useState(0)
      const [projectId, setProjectId] = useState(undefined)
      const [canvasId, setCanvasId] = useState(undefined)
      const [graph, setGraph] = useState(undefined)
      const [selection, setSelection] = useState([])
      const [selectedConnection, setSelectedConnection] = useState(undefined)
      const [selectedGroup, setSelectedGroup] = useState(undefined)
      const [editing, setEditing] = useState(undefined)
      const [pendingLink, setPendingLink] = useState(undefined)
      const [connectionDraft, setConnectionDraft] = useState(undefined)
      const [projectDraft, setProjectDraft] = useState(undefined)
      const [confirm, setConfirm] = useState(undefined)
      const [menu, setMenu] = useState(undefined)
      const [contextMenu, setContextMenu] = useState(undefined)
      const [search, setSearch] = useState({ query: '', open: false, hits: [], loading: false, active: -1 })
      const [recycle, setRecycle] = useState({ open: false, items: [], loading: false })
      const [focusRequest, setFocusRequest] = useState(undefined)
      const [highlightId, setHighlightId] = useState(undefined)
      const [projectFilter, setProjectFilter] = useState('')
      const [historyTick, setHistoryTick] = useState(0)

      const queue = useRef(Promise.resolve())
      const projectRef = useRef(undefined)
      const canvasRef = useRef(undefined)
      const pageRef = useRef(null)
      const bootstrapRef = useRef(undefined)
      const editGuard = useRef(undefined)
      const graphRequest = useRef(0)
      const viewport = useRef(undefined)
      const undoStack = useRef([])
      const redoStack = useRef([])
      const clipboard = useRef(undefined)
      const pasteOffset = useRef(0)
      const wheelTimer = useRef(undefined)
      const wheelNode = useRef(undefined)
      const searchTimer = useRef(undefined)
      const noticeTimer = useRef(undefined)
      const highlightTimer = useRef(undefined)
      const searchInput = useRef(null)
      const initialized = useRef(false)

      useEffect(() => { projectRef.current = projectId }, [projectId])
      useEffect(() => { canvasRef.current = canvasId }, [canvasId])
      useEffect(() => () => {
        if (noticeTimer.current !== undefined) clearTimeout(noticeTimer.current)
        if (wheelTimer.current !== undefined) clearTimeout(wheelTimer.current)
        if (highlightTimer.current !== undefined) clearTimeout(highlightTimer.current)
      }, [])

      const flash = useCallback((message) => {
        setNotice(message)
        if (noticeTimer.current !== undefined) clearTimeout(noticeTimer.current)
        noticeTimer.current = setTimeout(() => setNotice(undefined), 2600)
      }, [])

      const enqueue = useCallback((task) => {
        setPendingCount((count) => count + 1)
        const started = queue.current.then(task)
        queue.current = started.catch(() => {}).then(() => setPendingCount((count) => Math.max(0, count - 1)))
        return started
      }, [])

      const loadBootstrap = useCallback(async ({ resetSelection = false } = {}) => {
        try {
          const data = await callApi('/bootstrap')
          setBootstrap(data)
          bootstrapRef.current = data
          setFatal(undefined)
          setBanner(undefined)
          const projects = data.projects ?? []
          const current = projectRef.current
          if (!initialized.current || resetSelection || !projects.some((project) => project.id === current)) {
            const next = projects[0]
            initialized.current = true
            projectRef.current = next?.id
            setProjectId(next?.id)
            const main = next?.canvases?.find((canvas) => canvas.parentCanvasId === null) ?? next?.canvases?.[0]
            canvasRef.current = main?.id
            setCanvasId(main?.id)
          }
          return data
        } catch (cause) {
          if (bootstrapRef.current === undefined) setFatal(cause)
          else setBanner(cause)
          return undefined
        }
      }, [])

      const loadGraph = useCallback(async (id) => {
        if (id === undefined) { setGraph(undefined); return }
        const requestId = ++graphRequest.current
        try {
          const data = await callApi(`/canvas/${encodeURIComponent(id)}`)
          if (requestId !== graphRequest.current) return
          if (data?.canvas?.id !== id) return
          setGraph(data)
          setBanner(undefined)
        } catch (cause) {
          if (requestId !== graphRequest.current) return
          setBanner(cause)
        }
      }, [])

      useEffect(() => {
        if (contextMenu === undefined) return undefined
        const dismiss = (event) => {
          if (event.target instanceof Element && event.target.closest?.('[data-context-menu]') !== null) return
          setContextMenu(undefined)
        }
        document.addEventListener('pointerdown', dismiss, true)
        return () => document.removeEventListener('pointerdown', dismiss, true)
      }, [contextMenu])

      useEffect(() => { void loadBootstrap() }, [loadBootstrap])
      useEffect(() => {
        setGraph(undefined)
        setSelection([])
        setSelectedConnection(undefined)
        setSelectedGroup(undefined)
        setEditing(undefined)
        setPendingLink(undefined)
        // The desktop app clears the undo stack when the board changes.
        undoStack.current = []
        redoStack.current = []
        setHistoryTick((value) => value + 1)
        void loadGraph(canvasId)
      }, [canvasId, loadGraph])

      useEffect(() => {
        const onVisible = () => { if (document.visibilityState === 'visible') void loadGraph(canvasId) }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
      }, [canvasId, loadGraph])

      const pushHistory = useCallback((entry) => {
        undoStack.current.push(entry)
        if (undoStack.current.length > 100) undoStack.current.shift()
        redoStack.current = []
        setHistoryTick((value) => value + 1)
      }, [])

      const refresh = useCallback(async () => {
        await loadGraph(canvasRef.current)
        await loadBootstrap()
      }, [loadBootstrap, loadGraph])

      const commit = useCallback((task, options = {}) => enqueue(async () => {
        try {
          const result = await task()
          if (options.history !== undefined) pushHistory(options.history(result))
          await refresh()
          if (options.notice !== undefined) flash(options.notice)
          return result
        } catch (cause) {
          setBanner(cause)
          await refresh()
          return undefined
        }
      }), [enqueue, flash, pushHistory, refresh])

      const undo = useCallback(() => {
        const entry = undoStack.current.pop()
        if (entry === undefined) return
        enqueue(async () => {
          try { await entry.undo(); redoStack.current.push(entry); await refresh() } catch (cause) { setBanner(cause) }
          setHistoryTick((value) => value + 1)
        })
      }, [enqueue, refresh])

      const redo = useCallback(() => {
        const entry = redoStack.current.pop()
        if (entry === undefined) return
        enqueue(async () => {
          try { await entry.redo(); undoStack.current.push(entry); await refresh() } catch (cause) { setBanner(cause) }
          setHistoryTick((value) => value + 1)
        })
      }, [enqueue, refresh])

      // ---- note lifecycle --------------------------------------------------

      const createNoteAt = useCallback((point) => {
        const width = 220
        const height = 120
        const x = point === undefined ? undefined : Math.round(point.x - width / 2)
        const y = point === undefined ? undefined : Math.round(point.y - height / 2)
        void commit(() => mutate('create-note', {
          canvasId: canvasRef.current,
          content: '',
          width, height, x, y,
        }), {
          history: (result) => ({
            undo: () => mutate('delete-note', { nodeId: result.id }),
            redo: () => mutate('restore-note', { nodeId: result.id }),
          }),
        }).then((result) => {
          if (result === undefined) return
          setSelection([result.id])
          editGuard.current = undefined
          setEditing({
            nodeId: result.id,
            node: { ...result, width, height, content: null, accentKey: null, title: '' },
            title: '',
            body: '',
            accentKey: null,
          })
        })
      }, [commit])

      const createNoteAtCenter = useCallback(() => {
        const center = viewport.current?.center?.()
        createNoteAt(center)
      }, [createNoteAt])

      const beginEdit = useCallback((node) => {
        setPendingLink(undefined)
        // A structured legacy body would be destroyed by plain-text editing, so it stays read-only.
        if (isStructuredContent(node)) {
          flash(t('structuredReadOnly'))
          return
        }
        editGuard.current = undefined
        setEditing({
          nodeId: node.id,
          node,
          // Legacy rows carry a title derived from the body; treat it as no title.
          title: customTitleOf(node),
          body: node.content ?? '',
          accentKey: node.accentKey ?? null,
        })
      }, [flash, t])

      const commitEdit = useCallback(() => {
        if (editGuard.current !== undefined) {
          editGuard.current = undefined
          setEditing(undefined)
          return
        }
        const current = editing
        if (current === undefined) return
        editGuard.current = 'done'
        setEditing(undefined)
        const title = current.title.trim()
        const body = current.body.trim()
        const accentKey = current.accentKey ?? null
        const before = current.node
        const beforeTitle = customTitleOf(before)
        const beforeBody = String(before.content ?? '').trim()
        const beforeAccent = before.accentKey ?? null
        if (title === '' && body === '') {
          if (beforeTitle === '' && beforeBody === '') {
            // A brand-new card left empty: keep it, like the desktop app after Esc.
            return
          }
          commit(() => mutate('delete-note', { nodeId: before.id }), {
            history: () => ({
              undo: () => mutate('restore-note', { nodeId: before.id }),
              redo: () => mutate('delete-note', { nodeId: before.id }),
            }),
          })
          return
        }
        if (title === beforeTitle && body === beforeBody && accentKey === beforeAccent) return
        commit(() => mutate('update-note', {
          nodeId: before.id, title, content: body, accentKey: accentKey ?? 'none',
        }), {
          history: () => ({
            undo: () => mutate('update-note', {
              nodeId: before.id, title: beforeTitle, content: beforeBody, accentKey: beforeAccent ?? 'none',
            }),
            redo: () => mutate('update-note', {
              nodeId: before.id, title, content: body, accentKey: accentKey ?? 'none',
            }),
          }),
        })
      }, [commit, editing])

      const cancelEdit = useCallback(() => {
        editGuard.current = 'cancel'
        setEditing(undefined)
      }, [])

      const moveNodes = useCallback((changes, done, previous) => {
        setGraph((current) => current === undefined ? current : {
          ...current,
          nodes: current.nodes.map((node) => {
            const change = changes.find((entry) => entry.id === node.id)
            return change === undefined ? node : { ...node, x: change.x, y: change.y }
          }),
        })
        if (done !== true) return
        commit(() => mutate('update-nodes', { positions: changes }), {
          history: previous === undefined ? undefined : () => ({
            undo: () => mutate('update-nodes', { positions: previous }),
            redo: () => mutate('update-nodes', { positions: changes }),
          }),
        })
      }, [commit])

      /** Grow a card to fit its text; silent, so it never floods the undo history. */
      const autoFitNode = useCallback((nodeId, height) => {
        const node = graph?.nodes.find((candidate) => candidate.id === nodeId)
        if (node === undefined || height <= node.height + 1) return
        setGraph((current) => current === undefined ? current : {
          ...current,
          nodes: current.nodes.map((entry) => (entry.id === nodeId ? { ...entry, height } : entry)),
        })
        void mutate('update-note', { nodeId, x: node.x, y: node.y, width: node.width, height }).catch(() => {})
      }, [graph, mutate])

      /** Tick or untick one checkbox line; the text stays the single source of truth. */
      const toggleTask = useCallback((nodeId, index) => {
        const node = graph?.nodes.find((candidate) => candidate.id === nodeId)
        if (node === undefined) return
        const lines = String(node.content ?? '').split('\n')
        const line = lines[index]
        if (line === undefined || !/\[[ xX]\]/.test(line)) return
        const before = lines.join('\n')
        const after = lines.map((entry, position) => (position === index
          ? entry.replace(/\[([ xX])\]/, (match) => (match === '[x]' ? '[ ]' : '[x]'))
          : entry)).join('\n')
        if (after === before) return
        commit(() => mutate('update-note', { nodeId, content: after }), {
          history: () => ({
            undo: () => mutate('update-note', { nodeId, content: before }),
            redo: () => mutate('update-note', { nodeId, content: after }),
          }),
        })
      }, [graph, commit, mutate])

      const resizeNode = useCallback((nodeId, box, done, previous) => {
        setGraph((current) => current === undefined ? current : {
          ...current,
          nodes: current.nodes.map((node) => node.id === nodeId ? { ...node, ...box } : node),
        })
        if (done !== true) return
        commit(() => mutate('update-note', { nodeId, ...box }), {
          history: previous === undefined ? undefined : () => ({
            undo: () => mutate('update-note', { nodeId, ...previous }),
            redo: () => mutate('update-note', { nodeId, ...box }),
          }),
        })
      }, [commit])

      const moveGroup = useCallback((groupId, position, members, done) => {
        setGraph((current) => current === undefined ? current : {
          ...current,
          groups: current.groups.map((group) => group.id === groupId ? { ...group, ...position } : group),
          nodes: current.nodes.map((node) => {
            const change = members.find((entry) => entry.id === node.id)
            return change === undefined ? node : { ...node, x: change.x, y: change.y }
          }),
        })
        if (done !== true) return
        // Group moves are not undoable in the desktop app either.
        commit(() => mutate('update-group', { groupId, x: position.x, y: position.y }))
      }, [commit])

      const toggleGroup = useCallback((group) => {
        commit(() => mutate('update-group', { groupId: group.id, collapsed: !group.collapsed }))
      }, [commit])

      const createGroup = useCallback(() => {
        if (selection.length === 0) {
          flash(t('menuGroup'))
          return
        }
        commit(() => mutate('create-group', { canvasId: canvasRef.current, nodeIds: selection }), {
          notice: t('created'),
          history: (result) => ({
            undo: () => mutate('delete-group', { groupId: result.id }),
            redo: () => mutate('restore-group', { groupId: result.id }),
          }),
        }).then((result) => {
          // The desktop app selects the new group and its members.
          if (result === undefined) return
          setSelectedGroup(result.id)
          setSelection(result.memberIds ?? [])
        })
      }, [commit, flash, selection, t])

      // ---- connection lifecycle --------------------------------------------

      const beginLink = useCallback((node, anchor) => {
        setSelection([node.id])
        setConnectionDraft(undefined)
        setPendingLink({ sourceId: node.id, anchor, relationType: 'MainThick1', strokeKey: '#000000' })
      }, [])

      const completeLink = useCallback((target, world) => {
        const link = pendingLink
        if (link === undefined) return
        setPendingLink(undefined)
        const targetAnchor = nearestAnchor(target, world)
        commit(() => mutate('create-connection', {
          canvasId: canvasRef.current,
          sourceNodeId: link.sourceId,
          targetNodeId: target.id,
          sourceAnchor: link.anchor,
          targetAnchor,
          relationType: link.relationType,
          strokeKey: link.strokeKey,
        }), {
          notice: t('connected'),
          history: (result) => ({
            undo: () => mutate('delete-connection', { connectionId: result.id }),
            redo: () => mutate('create-connection', {
              canvasId: canvasRef.current,
              sourceNodeId: link.sourceId, targetNodeId: target.id,
              sourceAnchor: link.anchor, targetAnchor,
              relationType: link.relationType, strokeKey: link.strokeKey,
            }),
          }),
        })
      }, [commit, flash, graph, pendingLink, t])

      const cancelLink = useCallback(() => {
        setPendingLink(undefined)
        flash(t('cancelled'))
      }, [flash, t])

      const beginConnectionPick = useCallback((connection) => {
        setConnectionDraft({
          mode: 'edit', connectionId: connection.id,
          relationType: connection.relationType,
          strokeKey: connection.strokeKey ?? '#000000',
          label: connection.label ?? '',
        })
      }, [])

      const applyConnectionDraft = useCallback((draft) => {
        const current = connectionDraft
        setConnectionDraft(undefined)
        if (current === undefined) return
        if (current.mode === 'create') {
          setPendingLink({
            sourceId: current.sourceId, anchor: current.anchor,
            relationType: draft.relationType, strokeKey: draft.strokeKey,
          })
          return
        }
        const before = graph?.connections.find((connection) => connection.id === current.connectionId)
        commit(() => mutate('update-connection', {
          connectionId: current.connectionId,
          relationType: draft.relationType,
          strokeKey: draft.strokeKey,
        }), {
          history: before === undefined ? undefined : () => ({
            undo: () => mutate('update-connection', {
              connectionId: before.id, relationType: before.relationType, strokeKey: before.strokeKey ?? '#000000',
            }),
            redo: () => mutate('update-connection', {
              connectionId: before.id, relationType: draft.relationType, strokeKey: draft.strokeKey,
            }),
          }),
        })
      }, [commit, connectionDraft, graph])

      // ---- deletion ---------------------------------------------------------

      const deleteSelected = useCallback(() => {
        if (selectedConnection !== undefined) {
          const connection = graph?.connections.find((entry) => entry.id === selectedConnection)
          const connectionId = selectedConnection
          setSelectedConnection(undefined)
          // The desktop app deletes a connection immediately, without a confirmation.
          commit(() => mutate('delete-connection', { connectionId }), {
            history: connection === undefined ? undefined : () => ({
              undo: () => mutate('create-connection', {
                canvasId: canvasRef.current,
                sourceNodeId: connection.sourceNodeId,
                targetNodeId: connection.targetNodeId,
                sourceAnchor: connection.sourceAnchor,
                targetAnchor: connection.targetAnchor,
                relationType: connection.relationType,
                label: connection.label ?? undefined,
                strokeKey: connection.strokeKey ?? '#000000',
              }),
              redo: () => mutate('delete-connection', { connectionId }),
            }),
          })
          return
        }
        if (selectedGroup !== undefined) {
          setConfirm({ kind: 'group', id: selectedGroup })
          return
        }
        if (selection.length > 0) setConfirm({ kind: 'notes', ids: selection })
      }, [commit, graph, selectedConnection, selectedGroup, selection])

      const confirmDelete = useCallback(() => {
        const target = confirm
        setConfirm(undefined)
        if (target === undefined) return
        if (target.kind === 'notes') {
          const ids = target.ids
          setSelection([])
          commit(() => mutate('delete-nodes', { nodeIds: ids }), {
            history: () => ({
              undo: async () => { for (const id of ids) await mutate('restore-note', { nodeId: id }) },
              redo: () => mutate('delete-nodes', { nodeIds: ids }),
            }),
          })
          return
        }
        if (target.kind === 'connection') {
          setSelectedConnection(undefined)
          commit(() => mutate('delete-connection', { connectionId: target.id }))
          return
        }        if (target.kind === 'group') {
          setSelectedGroup(undefined)
          commit(() => mutate('delete-group', { groupId: target.id }), {
            history: () => ({
              undo: () => mutate('restore-group', { groupId: target.id }),
              redo: () => mutate('delete-group', { groupId: target.id }),
            }),
          })
        }
      }, [commit, confirm])

      // ---- projects ---------------------------------------------------------

      const openProject = useCallback((project) => {
        projectRef.current = project.id
        setProjectId(project.id)
        const main = project.canvases.find((canvas) => canvas.parentCanvasId === null) ?? project.canvases[0]
        canvasRef.current = main?.id
        setCanvasId(main?.id)
        setSelection([])
        setSelectedConnection(undefined)
        setSelectedGroup(undefined)
      }, [])

      const openCreateProject = useCallback(() => {
        const now = new Date()
        const stamp = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
        setProjectDraft({ mode: 'create', name: `${t('projectPrefix')} ${stamp}` })
      }, [t])

      /** Copy a desktop app database into the plugin store (only when the store is empty). */
      const importLegacy = useCallback(() => {
        enqueue(async () => {
          try {
            await mutate('import-legacy', {})
            await loadBootstrap({ resetSelection: true })
            await loadGraph(canvasIdRef.current)
            flash(t('imported'))
          } catch (cause) {
            setBanner(cause)
          }
        })
      }, [enqueue, flash, loadBootstrap, loadGraph, t])

      const saveProjectDraft = useCallback((draft) => {
        const current = projectDraft
        setProjectDraft(undefined)
        if (current === undefined) return
        const name = draft.name.trim() === '' ? t('untitled') : draft.name.trim()
        if (current.mode === 'create') {
          commit(() => mutate('create-project', { name }), { notice: t('created') })
          return
        }
        commit(() => mutate('update-project', { projectId: current.projectId, name }))
      }, [commit, projectDraft, t])

      // ---- search -----------------------------------------------------------

      const runSearch = useCallback(async (query) => {
        if (query.trim() === '') {
          setSearch((current) => ({ ...current, hits: [], loading: false, active: -1 }))
          return
        }
        setSearch((current) => ({ ...current, loading: true }))
        try {
          const params = new URLSearchParams({ q: query, limit: '50' })
          if (projectRef.current !== undefined) params.set('project', projectRef.current)
          const data = await callApi(`/search?${params.toString()}`)
          const hits = data.hits ?? []
          setSearch((current) => ({ ...current, hits, loading: false, active: hits.length === 1 ? 0 : -1 }))
          if (hits.length === 1) openHit(hits[0])
        } catch (cause) {
          setSearch((current) => ({ ...current, hits: [], loading: false }))
          setBanner(cause)
        }
      }, [])

      const openHit = useCallback((hit) => {
        setSearch({ query: '', open: false, hits: [], loading: false, active: -1 })
        projectRef.current = hit.projectId
        setProjectId(hit.projectId)
        canvasRef.current = hit.canvasId
        setCanvasId(hit.canvasId)
        setSelection([hit.nodeId])
        setSelectedConnection(undefined)
        setSelectedGroup(undefined)
        setFocusRequest({ nodeId: hit.nodeId, nonce: Date.now() })
        // The desktop app flashes the located note with a highlight border.
        setHighlightId(hit.nodeId)
        if (highlightTimer.current !== undefined) clearTimeout(highlightTimer.current)
        highlightTimer.current = setTimeout(() => setHighlightId(undefined), 1600)
      }, [])

      // ---- clipboard --------------------------------------------------------

      const copySelection = useCallback(() => {
        if (selection.length === 0) return
        const set = new Set(selection)
        const nodes = (graph?.nodes ?? []).filter((node) => set.has(node.id))
          .map((node) => ({
            id: node.id, content: node.content ?? '', width: node.width, height: node.height, status: node.status,
          }))
        clipboard.current = {
          nodes,
          connections: (graph?.connections ?? []).filter((connection) =>
            set.has(connection.sourceNodeId) && set.has(connection.targetNodeId)).map((connection) => ({
            source: connection.sourceNodeId, target: connection.targetNodeId,
            relationType: connection.relationType, label: connection.label,
            sourceAnchor: connection.sourceAnchor, targetAnchor: connection.targetAnchor,
            strokeKey: connection.strokeKey,
          })),
        }
        pasteOffset.current = 0
        flash(`${nodes.length} × ${t('noteCount')}`)
      }, [flash, graph, selection, t])

      const pasteSelection = useCallback(() => {
        const data = clipboard.current
        if (data === undefined || data.nodes.length === 0) { flash(t('pasteEmpty')); return }
        const center = viewport.current?.center?.() ?? { x: 0, y: 0 }
        pasteOffset.current += 1
        const shift = (pasteOffset.current - 1) * 16 + 24
        commit(async () => {
          const mapping = new Map()
          for (const [index, node] of data.nodes.entries()) {
            const created = await mutate('create-note', {
              canvasId: canvasRef.current,
              content: node.content,
              width: node.width,
              height: node.height,
              x: Math.round(center.x + shift + index * 16 - node.width / 2),
              y: Math.round(center.y + shift + index * 16 - node.height / 2),
            })
            mapping.set(node.id, created.id)
          }
          for (const connection of data.connections) {
            const source = mapping.get(connection.source)
            const target = mapping.get(connection.target)
            if (source === undefined || target === undefined) continue
            await mutate('create-connection', {
              canvasId: canvasRef.current,
              sourceNodeId: source,
              targetNodeId: target,
              sourceAnchor: connection.sourceAnchor,
              targetAnchor: connection.targetAnchor,
              relationType: connection.relationType,
              label: connection.label ?? undefined,
              strokeKey: connection.strokeKey ?? '#000000',
            })
          }
          return [...mapping.values()]
        }).then((ids) => {
          if (ids === undefined) return
          setSelection(ids)
          flash(`${ids.length} × ${t('noteCount')}`)
        })
      }, [commit, flash, t])

      const deleteNoteById = useCallback((nodeId) => {
        setEditing(undefined)
        setSelection([])
        commit(() => mutate('delete-note', { nodeId }), {
          history: () => ({
            undo: () => mutate('restore-note', { nodeId }),
            redo: () => mutate('delete-note', { nodeId }),
          }),
        })
      }, [commit])

      const reconnectConnection = useCallback((payload) => {
        if (payload === undefined) {
          flash(t('reconnectCancelled'))
          return
        }
        const connection = graph?.connections.find((entry) => entry.id === payload.connectionId)
        if (connection === undefined) return
        const beforeNode = payload.isSourceEnd ? connection.sourceNodeId : connection.targetNodeId
        const beforeAnchor = payload.isSourceEnd ? connection.sourceAnchor : connection.targetAnchor
        if (beforeNode === payload.nodeId && beforeAnchor === payload.anchor) {
          flash(t('reconnectUnchanged'))
          return
        }
        const patch = payload.isSourceEnd
          ? { sourceNodeId: payload.nodeId, sourceAnchor: payload.anchor }
          : { targetNodeId: payload.nodeId, targetAnchor: payload.anchor }
        const inverse = payload.isSourceEnd
          ? { sourceNodeId: beforeNode, sourceAnchor: beforeAnchor }
          : { targetNodeId: beforeNode, targetAnchor: beforeAnchor }
        commit(() => mutate('update-connection', { connectionId: payload.connectionId, ...patch }), {
          notice: t('reconnected'),
          history: () => ({
            undo: () => mutate('update-connection', { connectionId: payload.connectionId, ...inverse }),
            redo: () => mutate('update-connection', { connectionId: payload.connectionId, ...patch }),
          }),
        })
      }, [commit, flash, graph, t])

      const applyAccent = useCallback((nodeId, accentKey) => {        const before = graph?.nodes.find((node) => node.id === nodeId)
        setContextMenu(undefined)
        commit(() => mutate('update-note', { nodeId, accentKey: accentKey ?? 'none' }), {
          history: before === undefined ? undefined : () => ({
            undo: () => mutate('update-note', { nodeId, accentKey: before.accentKey ?? 'none' }),
            redo: () => mutate('update-note', { nodeId, accentKey: accentKey ?? 'none' }),
          }),
        })
      }, [commit, graph])

      const deleteConnectionById = useCallback((connectionId) => {
        const connection = graph?.connections.find((entry) => entry.id === connectionId)
        setContextMenu(undefined)
        setSelectedConnection(undefined)
        commit(() => mutate('delete-connection', { connectionId }), {
          history: connection === undefined ? undefined : () => ({
            undo: () => mutate('create-connection', {
              canvasId: canvasRef.current,
              sourceNodeId: connection.sourceNodeId,
              targetNodeId: connection.targetNodeId,
              sourceAnchor: connection.sourceAnchor,
              targetAnchor: connection.targetAnchor,
              relationType: connection.relationType,
              label: connection.label ?? undefined,
              strokeKey: connection.strokeKey ?? '#000000',
            }),
            redo: () => mutate('delete-connection', { connectionId }),
          }),
        })
      }, [commit, graph])

      // ---- recycle ----------------------------------------------------------

      const openRecycle = useCallback(() => {
        setRecycle({ open: true, items: [], loading: true })
        enqueue(async () => {
          try {
            const params = new URLSearchParams({ limit: '200' })
            if (projectRef.current !== undefined) params.set('project', projectRef.current)
            const data = await callApi(`/recycle?${params.toString()}`)
            setRecycle({ open: true, items: data.items ?? [], loading: false })
          } catch (cause) {
            setRecycle({ open: true, items: [], loading: false })
            setBanner(cause)
          }
        })
      }, [enqueue])

      const restoreNote = useCallback((nodeId) => {
        commit(() => mutate('restore-note', { nodeId }), {
          notice: t('restore'),
          history: () => ({
            undo: () => mutate('delete-note', { nodeId }),
            redo: () => mutate('restore-note', { nodeId }),
          }),
        })
        void openRecycle()
      }, [commit, openRecycle, t])

      // ---- keyboard ---------------------------------------------------------

      useEffect(() => {
        const onKey = (event) => {
          const target = event.target
          if (target instanceof Element) {
            const tag = target.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
              || target.isContentEditable
              || target.closest?.('[contenteditable="true"],[role="textbox"],[role="dialog"]') !== null) return
          }
          const mod = event.metaKey || event.ctrlKey
          const key = event.key.toLowerCase()
          if (mod && key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); return }
          if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) { event.preventDefault(); redo(); return }
          if (mod && key === 'g') { event.preventDefault(); createGroup(); return }
          if (mod && key === 'f') { event.preventDefault(); searchInput.current?.focus(); searchInput.current?.select(); return }
          if (mod && event.key === '0') { event.preventDefault(); viewport.current?.fitAll?.(); return }
          if (mod && key === 'c') { copySelection(); return }
          if (mod && key === 'v') { event.preventDefault(); pasteSelection(); return }
          if (event.key === 'Escape') {
            setPendingLink(undefined)
            setContextMenu(undefined)
            setMenu(undefined)
            setSearch((current) => ({ ...current, open: false }))
            return
          }
          if (event.key === 'F2') {
            const node = (graph?.nodes ?? []).find((candidate) => candidate.id === selection[0])
            if (node !== undefined) { event.preventDefault(); beginEdit(node) }
            return
          }
          if (event.key === 'Delete') {
            if (selection.length > 0 || selectedConnection !== undefined || selectedGroup !== undefined) {
              event.preventDefault()
              deleteSelected()
            }
          }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      }, [beginEdit, copySelection, createGroup, deleteSelected, graph, pasteSelection, redo, search, selectedConnection,
        selectedGroup, selection, undo])

      // ---- derived ----------------------------------------------------------

      const storage = bootstrap?.storage
      const storageLock = storage?.lockedBy ?? undefined
      const projects = bootstrap?.projects ?? []
      const project = projects.find((candidate) => candidate.id === projectId)
      const canvases = project?.canvases ?? []
      const noteCount = graph?.nodes.length ?? 0
      const filter = projectFilter.trim().toLowerCase()
      const filteredProjects = filter === ''
        ? projects
        : projects.filter((entry) => entry.name.toLowerCase().includes(filter))
      const canUndo = historyTick >= 0 && undoStack.current.length > 0
      const canRedo = historyTick >= 0 && redoStack.current.length > 0

      const saveCamera = useCallback((next) => {
        if (canvasRef.current === undefined) return
        void mutate('save-camera', { canvasId: canvasRef.current, cameraX: next.x, cameraY: next.y, zoom: next.zoom })
          .catch(() => {})
      }, [])

      const wheelResize = useCallback((node, factor) => {
        const base = wheelNode.current?.id === node.id ? wheelNode.current : {
          id: node.id, x: node.x, y: node.y, width: node.width, height: node.height,
        }
        wheelNode.current = base
        const width = clamp(Math.round(base.width * factor), MIN_WIDTH, MAX_WIDTH)
        const height = clamp(Math.round(base.height * factor), MIN_HEIGHT, MAX_HEIGHT)
        setGraph((current) => current === undefined ? current : {
          ...current,
          nodes: current.nodes.map((candidate) => candidate.id === node.id ? { ...candidate, width, height } : candidate),
        })
        if (wheelTimer.current !== undefined) clearTimeout(wheelTimer.current)
        wheelTimer.current = setTimeout(() => {
          const final = wheelNode.current
          wheelNode.current = undefined
          if (final === undefined) return
          commit(() => mutate('update-note', {
            nodeId: final.id, x: final.x, y: final.y, width, height,
          }), {
            history: () => ({
              undo: () => mutate('update-note', {
                nodeId: final.id, x: final.x, y: final.y, width: final.width, height: final.height,
              }),
              redo: () => mutate('update-note', { nodeId: final.id, x: final.x, y: final.y, width, height }),
            }),
          })
        }, 450)
      }, [commit])

      // ---- early states -----------------------------------------------------

      if (fatal !== undefined) {
        const body = h('div', { style: { fontSize: 12, maxWidth: 420, lineHeight: 1.6 } },
          fatal.code === 'DB_NOT_FOUND' ? t('noDatabase') : t('syncFailed'))
        return h('div', {
          style: {
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, padding: 40, textAlign: 'center',
            color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-base)',
          },
        },
        h('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, t('panel')),
        body,
        h('div', { style: { fontSize: 11, opacity: 0.8, maxWidth: 420, wordBreak: 'break-word' } }, fatal.message),
        h(Button, { primary: true, onClick: () => { setFatal(undefined); void loadBootstrap({ resetSelection: true }) } }, t('retry')))
      }

      if (bootstrap === undefined) {
        return h('div', {
          style: {
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-base)',
          },
        }, t('loading'))
      }

      if (projects.length === 0) {
        return h(React.Fragment, null,
        h('div', {
          style: {
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center',
            color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-base)',
          },
        },
        h('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, t('panel')),
        h('div', { style: { fontSize: 12, maxWidth: 380, lineHeight: 1.6 } }, t('noProjects')),
        h(Button, { primary: true, onClick: () => openCreateProject() }, t('newProject')),
        storage?.legacyAvailable ? h(Button, { onClick: () => importLegacy() }, t('importLegacy')) : null,
        h(Button, { onClick: () => { void loadBootstrap({ resetSelection: true }) } }, t('refresh'))),
        projectDraft === undefined ? null : h(ProjectDialog, {
          key: 'project', t, draft: projectDraft,
          onCancel: () => setProjectDraft(undefined),
          onSave: saveProjectDraft,
        }))
      }

      // ---- header -----------------------------------------------------------

      const headerButtons = [
        h(Button, { key: 'new', primary: true, onClick: createNoteAtCenter }, t('newNote')),
        h(Button, { key: 'group', onClick: createGroup, disabled: selection.length === 0 }, t('group')),
        h(Button, {
          key: 'delete', danger: true,
          disabled: selection.length === 0 && selectedConnection === undefined && selectedGroup === undefined,
          onClick: deleteSelected,
        }, t('delete')),
        h(Button, { key: 'undo', onClick: undo, disabled: !canUndo, title: t('undo') }, '↶'),
        h(Button, { key: 'redo', onClick: redo, disabled: !canRedo, title: t('redo') }, '↷'),
        h(Button, { key: 'fit', onClick: () => viewport.current?.fitAll?.() }, t('fitAll')),
        h(Button, { key: 'recycle', primary: recycle.open, onClick: openRecycle }, t('recycleBin')),
        h(Button, { key: 'refresh', onClick: () => { void loadBootstrap(); void loadGraph(canvasId) } }, t('refresh')),
      ]

      const searchBox = h('div', { style: { position: 'relative', flex: '1 1 160px', minWidth: 140, maxWidth: 320 } },
        h('input', {
          ref: searchInput,
          type: 'search',
          value: search.query,
          placeholder: t('searchPlaceholder'),
          'aria-label': t('searchPlaceholder'),
          onChange: (event) => {
            const value = event.target.value
            setSearch((current) => ({ ...current, query: value, open: true }))
            if (searchTimer.current !== undefined) clearTimeout(searchTimer.current)
            searchTimer.current = setTimeout(() => { void runSearch(value) }, 250)
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              const hit = search.hits[search.active]
              if (hit !== undefined) openHit(hit)
              else void runSearch(search.query)
            }
            if (event.key === 'Escape') setSearch((current) => ({ ...current, open: false }))
          },
          style: { ...inputStyle, height: 28 },
        }),
        search.open && search.query.trim() !== '' ? h('div', {
          style: {
            position: 'absolute', left: 0, right: 0, top: 32, zIndex: 25, maxHeight: 280, overflowY: 'auto',
            borderRadius: 8, padding: 4, background: 'var(--dsw-alias-bg-layer-2)',
            border: '1px solid var(--dsw-alias-border-l2)', boxShadow: '0 8px 24px var(--dsw-alias-bg-mask-2)',
          },
        },
        search.loading ? h('div', { style: { padding: '6px 8px', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('searching')) : null,
        !search.loading && search.hits.length === 0 ? h('div', { style: { padding: '6px 8px', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('searchEmpty')) : null,
        search.hits.map((hit, index) => h('button', {
          key: hit.nodeId,
          type: 'button',
          onClick: () => openHit(hit),
          onDoubleClick: () => openHit(hit),
          style: {
            display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 6,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            background: index === search.active ? 'var(--dsw-alias-bg-layer-3)' : 'transparent',
            color: 'var(--dsw-alias-label-primary)',
          },
        },
        h('div', { style: { fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
          `${t('noteCount') === 'notes' ? 'Note' : '便签'} · ${hit.title || hit.excerpt || t('untitled')}`),
        h('div', {
          style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        }, `${hit.projectName} / ${hit.canvasName} — ${hit.excerpt}`)))) : null)

      const header = h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto', flexWrap: 'wrap',
          padding: '14px 16px 10px', borderBottom: '1px solid var(--dsw-alias-border-l2)',
        },
      },
      h('div', { style: { fontSize: 13, fontWeight: 600 } }, t('panel')),
      h('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } }, `${noteCount} ${t('noteCount')}`),
      pendingCount > 0 ? h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('saving')) : null,
      searchBox,
      h('div', { style: { flex: 1, minWidth: 8 } }),
      headerButtons)

      const lockBar = storageLock === undefined ? null : h('div', {
        role: 'alert',
        style: {
          display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto',
          padding: '6px 16px', fontSize: 12,
          background: 'color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, var(--dsw-alias-bg-base))',
          borderBottom: '1px solid var(--dsw-alias-border-l2)',
          color: 'var(--dsw-alias-state-warn-label)',
        },
      }, `${t('syncLocked')} ${storageLock.host} · PID ${storageLock.pid}`)

      const errorBar = banner === undefined ? null : h('div', {        role: 'alert',
        style: {
          display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto', padding: '6px 16px', fontSize: 12,
          background: 'var(--dsw-alias-bg-mask-2)', borderBottom: '1px solid var(--dsw-alias-border-l2)',
          color: 'var(--dsw-alias-state-error-primary)',
        },
      },
      h('span', { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } },
        `${t('syncFailed')} ${banner.message}`),
      h(Button, { onClick: () => { setBanner(undefined); void loadGraph(canvasId) } }, t('retry')),
      h(Button, { onClick: () => setBanner(undefined) }, t('dismiss')))

      // ---- rail -------------------------------------------------------------

      const projectRows = filteredProjects.map((entry) => {
        const active = entry.id === projectId
        const rowStyle = {
          position: 'relative', display: 'flex', alignItems: 'center', borderRadius: 6, marginBottom: 2,
          background: active ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
        }
        const main = entry.canvases.find((canvas) => canvas.parentCanvasId === null) ?? entry.canvases[0]
        const openButton = h('button', {
          key: 'open', type: 'button', onClick: () => openProject(entry),
          style: {
            flex: 1, minWidth: 0, display: 'block', textAlign: 'left', padding: '6px 8px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit', fontSize: 12,
          },
        },
        h('div', { style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, entry.name),
        h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, `${entry.nodeCount} ${t('noteCount')}`))
        const more = h('button', {
          key: 'more', type: 'button', title: t('rename'),
          onClick: () => setMenu((current) => (current === entry.id ? undefined : entry.id)),
          style: {
            border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 6px',
            color: 'var(--dsw-alias-label-tertiary)', fontSize: 12,
          },
        }, '⋯')
        const menuPanel = menu === entry.id ? h('div', {
          key: 'menu', 'data-project-menu': true,
          style: {
            position: 'absolute', right: 4, top: 26, zIndex: 20, minWidth: 130, padding: 4,
            borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)',
            border: '1px solid var(--dsw-alias-border-l2)', boxShadow: '0 8px 24px var(--dsw-alias-bg-mask-2)',
          },
        },
        h('button', {
          type: 'button',
          onClick: () => { setMenu(undefined); setProjectDraft({ mode: 'rename', projectId: entry.id, name: entry.name }) },
          style: {
            display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 12, borderRadius: 6,
            color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit',
          },
        }, t('renameProject')),
        h('button', {
          type: 'button',
          onClick: () => { setMenu(undefined); setConfirm({ kind: 'project', id: entry.id, name: entry.name }) },
          style: {
            display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 12, borderRadius: 6,
            color: 'var(--dsw-alias-state-error-primary)', fontFamily: 'inherit',
          },
        }, t('deleteProject'))) : null
        return h('div', { key: entry.id, style: rowStyle }, openButton, more, menuPanel)
      })

      const canvasRows = canvases.map((canvas) => h('button', {
        key: canvas.id, type: 'button',
        onClick: () => { canvasRef.current = canvas.id; setCanvasId(canvas.id); setSelection([]) },
        style: {
          display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 6,
          border: 'none', cursor: 'pointer', fontSize: 12, marginBottom: 2,
          background: canvas.id === canvasId ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
          color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit',
        },
      }, h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
        h('span', { style: { opacity: 0.6 } }, canvas.parentCanvasId === null ? '▣' : '▢'),
        h('span', { style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
          canvas.name || t(canvas.parentCanvasId === null ? 'mainCanvas' : 'subCanvas')))))

      const rail = h('div', {
        style: {
          width: 'clamp(150px, 26%, 220px)', flex: '0 0 auto',
          borderRight: '1px solid var(--dsw-alias-border-l2)',
          overflowY: 'auto', padding: '10px 8px', boxSizing: 'border-box',
        },
      },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px 6px' } },
        h('div', { style: { flex: 1, fontSize: 11, letterSpacing: 0.4, color: 'var(--dsw-alias-label-tertiary)' } }, t('projects')),
        h('button', {
          type: 'button', title: t('newProject'),
          onClick: () => openCreateProject(),
          style: {
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--dsw-alias-label-secondary)', fontSize: 14, lineHeight: 1, padding: '0 2px',
          },
        }, '+')),
      projectRows,
      h('input', {
        type: 'search', value: projectFilter, placeholder: t('filterProjects'),
        'aria-label': t('filterProjects'),
        onChange: (event) => setProjectFilter(event.target.value),
        style: { ...inputStyle, height: 24, fontSize: 11, marginTop: 2, marginBottom: 2 },
      }),
      filter !== '' && filteredProjects.length === 0
        ? h('div', { style: { padding: '4px 6px', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
          t('searchEmpty'))
        : null,
      h('div', {
        style: {
          fontSize: 11, letterSpacing: 0.4, color: 'var(--dsw-alias-label-tertiary)',
          padding: '12px 6px 6px',
        },
      }, t('canvases')),
      canvasRows,
      canvases.length === 0 ? h('div', { style: { padding: '6px', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('noCanvas')) : null,
      h('div', {
        title: storage?.dbPath ?? '',
        style: {
          marginTop: 12, padding: '0 6px', fontSize: 10, lineHeight: 1.5,
          color: 'var(--dsw-alias-label-tertiary)', wordBreak: 'break-all',
        },
      }, `${t('storagePath')} ${storage?.dbPath ?? ''}`))

      // ---- board ------------------------------------------------------------

      const board = h('div', { style: { position: 'relative', flex: 1, minWidth: 0 } },
        graph === undefined
          ? h('div', {
            style: {
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--dsw-alias-label-secondary)',
            },
          }, canvasId === undefined ? t('noCanvas') : t('loading'))
          : h(CanvasView, {
            graph,
            selection,
            selectedConnection,
            selectedGroup,
            editing,
            pendingLink,
            focusRequest,
            highlightId,
            t,
            onSelectNodes: (ids) => { setSelection(ids); if (ids.length > 0) { setSelectedGroup(undefined) } },
            onSelectConnection: (id) => { setSelectedConnection(id); if (id !== undefined) { setSelection([]); setSelectedGroup(undefined) } },
            onSelectGroup: (id) => { setSelectedGroup(id); if (id !== undefined) setSelection([]) },
            onCreateNote: createNoteAt,
            onMoveNodes: moveNodes,
            onResizeNode: resizeNode,
            onToggleTask: toggleTask,
            onAutoFit: autoFitNode,
            onBeginEdit: beginEdit,
            onEditValue: (field, value) => setEditing((current) => (current === undefined ? current : { ...current, [field]: value })),
            onCommitEdit: commitEdit,
            onCancelEdit: cancelEdit,
            onBeginLink: beginLink,
            onCompleteLink: completeLink,
            onCancelLink: cancelLink,
            onOpenConnection: beginConnectionPick,
            onToggleGroup: toggleGroup,
            onMoveGroup: moveGroup,
            onCamera: saveCamera,
            onViewport: (value) => { viewport.current = value },
            onContextMenu: (info) => setContextMenu(info),
            onWheelResize: wheelResize,
            onReconnect: reconnectConnection,
            onNewNote: createNoteAtCenter,
            onDeleteNote: deleteNoteById,
          }))

      // ---- recycle panel ----------------------------------------------------

      const recyclePanel = !recycle.open ? null : h('div', {
        style: {
          width: 'clamp(180px, 26%, 260px)', flex: '0 0 auto', display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid var(--dsw-alias-border-l2)', minHeight: 0,
        },
      },
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
          borderBottom: '1px solid var(--dsw-alias-border-l2)',
        },
      },
      h('div', { style: { flex: 1, fontSize: 12, fontWeight: 600 } }, t('recycleBin')),
      h('button', {
        type: 'button', title: t('dismiss'), onClick: () => setRecycle((current) => ({ ...current, open: false })),
        style: {
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--dsw-alias-label-tertiary)', fontSize: 14, padding: 0,
        },
      }, '×')),
      h('div', { style: { flex: 1, overflowY: 'auto', padding: 8 } },
        recycle.loading
          ? h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('loading'))
          : recycle.items.length === 0
            ? h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('recycleEmpty'))
            : recycle.items.map((item) => h('div', {
              key: item.nodeId,
              style: {
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', marginBottom: 4,
                borderRadius: 6, border: '1px solid var(--dsw-alias-border-l2)',
              },
            },
            h('div', { style: { flex: 1, minWidth: 0 } },
              h('div', { style: { fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                item.title || t('untitled')),
              h('div', {
                style: { fontSize: 10, color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
              }, `${item.projectName ?? ''} / ${item.canvasName ?? ''} · ${String(item.deletedAt).slice(0, 16).replace('T', ' ')}`)),
            h('button', {
              type: 'button', onClick: () => restoreNote(item.nodeId),
              style: {
                border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', borderRadius: 6,
                cursor: 'pointer', fontSize: 11, padding: '2px 8px',
                color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit',
              },
            }, t('restore'))))))

      // ---- overlays ---------------------------------------------------------

      const contextItems = []
      if (contextMenu !== undefined) {
        const target = contextMenu.target ?? { kind: 'blank' }
        const node = target.kind === 'node' ? (graph?.nodes ?? []).find((entry) => entry.id === target.id) : undefined
        const connection = target.kind === 'connection'
          ? (graph?.connections ?? []).find((entry) => entry.id === target.id)
          : undefined
        if (node !== undefined) {
          const swatches = [
            h(Swatch, {
              key: 'none', colour: 'var(--dsw-alias-card-fill)', selected: (node.accentKey ?? null) === null,
              title: accentLabel(null), onClick: () => applyAccent(node.id, null),
            }),
            ...ACCENT_KEYS.map((key) => h(Swatch, {
              key, colour: ACCENT_COLOURS[key], selected: node.accentKey === key,
              title: accentLabel(key), onClick: () => applyAccent(node.id, key),
            })),
          ]
          contextItems.push(h('div', {
            key: 'colours',
            style: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 6px 6px' },
          }, swatches))
          contextItems.push(menuEntry(t('editNote'), () => { setContextMenu(undefined); beginEdit(node) }))
          contextItems.push(menuEntry(t('menuDelete'), () => {
            setContextMenu(undefined)
            setSelection([node.id])
            setConfirm({ kind: 'notes', ids: [node.id] })
          }, true))
        } else if (connection !== undefined) {
          contextItems.push(menuEntry(t('editLine'), () => {
            setContextMenu(undefined)
            beginConnectionPick(connection)
          }))
          contextItems.push(menuEntry(t('menuDelete'), () => deleteConnectionById(connection.id), true))
        } else {
          contextItems.push(menuEntry(t('menuCreate'), () => {
            setContextMenu(undefined)
            createNoteAt(contextMenu.world)
          }))
          contextItems.push(menuEntry(t('menuGroup'), () => {
            setContextMenu(undefined)
            createGroup()
          }, false, selection.length === 0))
          contextItems.push(menuEntry(t('menuDelete'), () => {
            setContextMenu(undefined)
            deleteSelected()
          }, true, selection.length === 0 && selectedConnection === undefined && selectedGroup === undefined))
          contextItems.push(menuEntry(t('menuFit'), () => {
            setContextMenu(undefined)
            viewport.current?.fitAll?.()
          }))
        }
      }

      // Anchor the menu at the pointer: viewport coordinates minus the page's own box.
      const pageBox = pageRef.current?.getBoundingClientRect()
      const menuLeft = pageBox === null || pageBox === undefined
        ? contextMenu?.x ?? 0
        : clamp(contextMenu?.x - pageBox.left, 4, Math.max(4, pageBox.width - 190))
      const menuTop = pageBox === null || pageBox === undefined
        ? contextMenu?.y ?? 0
        : clamp(contextMenu?.y - pageBox.top, 4, Math.max(4, pageBox.height - (32 + contextItems.length * 30)))
      const contextPanel = contextMenu === undefined ? null : h('div', {
        'data-context-menu': true,
        style: {
          position: 'absolute', left: menuLeft, top: menuTop, zIndex: 28,
          minWidth: 180, padding: 4, borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)',
          border: '1px solid var(--dsw-alias-border-l2)', boxShadow: '0 8px 24px var(--dsw-alias-bg-mask-2)',
        },
        onPointerDown: (event) => event.stopPropagation(),
      }, contextItems)

      const noticeBar = notice === undefined ? null : h('div', {
        role: 'status', 'aria-live': 'polite',
        style: {
          position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)', zIndex: 20,
          padding: '6px 12px', borderRadius: 999, fontSize: 12, maxWidth: '80%',
          background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)',
          color: 'var(--dsw-alias-label-primary)', boxShadow: '0 6px 20px var(--dsw-alias-bg-mask-2)',
        },
      }, notice)

      const dialogs = [
        connectionDraft === undefined ? null : h(ConnectionDialog, {
          key: 'connection', t, draft: connectionDraft,
          onCancel: () => setConnectionDraft(undefined),
          onApply: applyConnectionDraft,
        }),
        projectDraft === undefined ? null : h(ProjectDialog, {
          key: 'project', t, draft: projectDraft,
          onCancel: () => setProjectDraft(undefined),
          onSave: saveProjectDraft,
        }),
        confirm === undefined ? null : h(ConfirmDialog, {
          key: 'confirm', t, target: confirm,
          onCancel: () => setConfirm(undefined),
          onConfirm: () => {
            if (confirm.kind === 'project') {
              const target = confirm
              setConfirm(undefined)
              commit(() => mutate('delete-project', { projectId: target.id }), { notice: t('deleteProject') })
              return
            }
            confirmDelete()
          },
        }),
      ]

      return h('div', {
        ref: pageRef,
        style: {
          position: 'relative', height: '100%', minHeight: 0, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit',
        },
      },
      header,
      lockBar,
      errorBar,
      h('div', { style: { display: 'flex', flex: 1, minHeight: 0 } }, rail, board, recyclePanel),
      contextPanel,
      noticeBar,
      dialogs)
    }

    const menuItemStyle = {
      display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none',
      background: 'transparent', cursor: 'pointer', fontSize: 12, borderRadius: 6,
      color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit',
    }

    function menuEntry(label, onClick, danger, disabled) {
      return h('button', {
        key: label, type: 'button', onClick: disabled ? undefined : onClick, disabled,
        style: {
          ...menuItemStyle,
          color: danger ? 'var(--dsw-alias-state-error-primary)' : menuItemStyle.color,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'default' : 'pointer',
        },
      }, label)
    }

    // --------------------------------------------------------------- dialogs

    function ConnectionDialog({ t, draft, onCancel, onApply }) {
      const [relationType, setRelationType] = useState(draft.relationType ?? 'MainThick1')
      const [strokeKey, setStrokeKey] = useState(draft.strokeKey ?? '#000000')
      const isCreate = draft.mode === 'create'
      const relationChips = RELATIONS.map((relation) => h('button', {
        key: relation, type: 'button',
        onClick: () => setRelationType(relation),
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999,
          cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
          border: `1px solid ${relationType === relation ? PALETTE.selected : 'var(--dsw-alias-border-l2)'}`,
          background: relationType === relation ? 'var(--dsw-alias-bg-layer-3)' : 'transparent',
          color: 'var(--dsw-alias-label-primary)',
        },
      },
      h('span', {
        style: {
          width: 22, height: 0, borderTop: `${PALETTE.relationWidth[relation]}px ${
            PALETTE.relationDash[relation] === undefined ? 'solid' : 'dashed'} ${PALETTE.relationColour[relation]}`,
        },
      }),
      t(`relation_${relation}`)))
      const swatches = [h(Swatch, {
        key: '#000000', colour: defaultInk(), selected: strokeKey === '#000000', title: t('defaultColour'),
        onClick: () => setStrokeKey('#000000'),
      })].concat(ACCENT_KEYS.map((key) => h(Swatch, {
        key, colour: PALETTE.stripes[mode()][key], selected: strokeKey === key, title: accentLabel(key),
        onClick: () => setStrokeKey(key),
      })))
      const summary = `${t('relation')}: ${t(`relation_${relationType}`)}`
      return h(Dialog, {
        title: isCreate ? t('selectLine') : t('connection'),
        onClose: onCancel,
        footer: [
          h(Button, { key: 'cancel', onClick: onCancel }, t('cancel')),
          h(Button, { key: 'ok', primary: true, onClick: () => onApply({ relationType, strokeKey }) },
            isCreate ? t('startConnect') : t('apply')),
        ],
      },
      h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, summary),
      field(t('relation'), h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } }, relationChips)),
      field(t('colour'), h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } }, swatches)))
    }

    function ProjectDialog({ t, draft, onCancel, onSave }) {
      const [name, setName] = useState(draft.name ?? '')
      const canSave = draft.mode === 'rename' ? name.trim() !== '' : true
      return h(Dialog, {
        title: draft.mode === 'create' ? t('newProject') : t('renameProject'),
        onClose: onCancel,
        footer: [
          h(Button, { key: 'cancel', onClick: onCancel }, t('cancel')),
          h(Button, {
            key: 'save', primary: true, disabled: !canSave,
            onClick: () => onSave({ name: name.trim() }),
          }, draft.mode === 'create' ? t('create') : t('save')),
        ],
      },
      field(t('projectName'), h('input', {
        style: inputStyle, value: name, autoFocus: true,
        placeholder: draft.mode === 'create' ? t('untitled') : '',
        onChange: (event) => setName(event.target.value),
        onKeyDown: (event) => { if (event.key === 'Enter' && canSave) onSave({ name: name.trim() }) },
      })))
    }

    function ConfirmDialog({ t, target, onCancel, onConfirm }) {
      const text = target.kind === 'notes'
        ? t('confirmDelete')
        : target.kind === 'connection'
          ? t('confirmDeleteConnection')
          : target.kind === 'group'
            ? t('confirmDeleteGroup')
            : `${t('confirmDeleteProject')}${target.name ? ` (${target.name})` : ''}`
      return h(Dialog, {
        title: target.kind === 'project' ? t('deleteProject') : t('delete'),
        onClose: onCancel,
        footer: [
          h(Button, { key: 'cancel', onClick: onCancel }, t('cancel')),
          h(Button, { key: 'ok', danger: true, onClick: onConfirm }, t('delete')),
        ],
      }, h('div', null, text))
    }

    // ------------------------------------------------------------------ icon

    function PanelIcon({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 20 20', 'aria-hidden': true,
        style: { display: 'block', color: 'currentColor' },
      },
      h('rect', {
        x: 2, y: 3.5, width: 16, height: 13, rx: 2.5,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, opacity: 0.75,
      }),
      h('rect', { x: 5, y: 7, width: 5, height: 4, rx: 1, fill: 'currentColor', opacity: 0.85 }),
      h('rect', { x: 12, y: 10, width: 3.5, height: 3.5, rx: 1, fill: 'currentColor', opacity: 0.5 }),
      h('path', { d: 'M10 9h2', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'project-canvas: dictionaries')
        const bound = ctx.locale.bind(NS)
        translate = (key) => {
          const value = bound(key)
          return value === undefined || value === key ? (DICTS.en[key] ?? key) : value
        }

        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, CanvasPage))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 20, label: () => translate('panel'), locale: NS,
        }, PanelIcon))
      },
    }
  },
})
