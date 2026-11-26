/**
 * Structured note body.
 *
 * A note keeps a list of line blocks instead of one string, so list lines carry their kind
 * (`p` paragraph, `ul` bullet, `ol` ordered, `task` checkbox), their indent level, and, for
 * tasks, the checked state. Text stays the single editable surface: `parse` reads the
 * markdown-ish lines the editor produces, `toText` writes them back, so the textarea, the
 * agent tools, and imported desktop rows all keep working through one conversion.
 *
 * Stored shape: {"v": 1, "blocks": [{ "k": "ul", "t": "…", "i": 0 }, …]}
 */

export const BLOCK_DOC_VERSION = 1

const TASK = /^(\s*)[-*+]\s+\[([ xX])\]\s?(.*)$/
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/
const BULLET = /^(\s*)[-*+]\s+(.*)$/

const INDENT_WIDTH = 2

function indentOf(leading) {
  return Math.max(0, Math.floor(String(leading ?? '').replace(/\t/g, '  ').length / INDENT_WIDTH))
}

/** Read one note body into blocks; anything unrecognised is a paragraph. */
export function parse(text) {
  return String(text ?? '').split('\n').map((line) => {
    const task = TASK.exec(line)
    if (task !== null) {
      return {
        k: 'task',
        t: task[3].replace(/\s+$/, ''),
        i: indentOf(task[1]),
        c: task[2].toLowerCase() === 'x',
      }
    }
    const ordered = ORDERED.exec(line)
    if (ordered !== null) {
      return {
        k: 'ol',
        t: ordered[3].replace(/\s+$/, ''),
        i: indentOf(ordered[1]),
        n: Number(ordered[2]),
      }
    }
    const bullet = BULLET.exec(line)
    if (bullet !== null) {
      return { k: 'ul', t: bullet[2].replace(/\s+$/, ''), i: indentOf(bullet[1]) }
    }
    return { k: 'p', t: line.replace(/\s+$/, ''), i: 0 }
  })
}

const indentText = (block) => ' '.repeat(Math.max(0, Number(block.i) || 0) * INDENT_WIDTH)

/** Render blocks back to the text the editor edits. */
export function toText(blocks) {
  return (blocks ?? []).map((block) => {
    const indent = indentText(block)
    const text = String(block.t ?? '')
    if (block.k === 'task') return `${indent}- [${block.c === true ? 'x' : ' '}] ${text}`
    if (block.k === 'ol') return `${indent}${Number(block.n) || 1}. ${text}`
    if (block.k === 'ul') return `${indent}- ${text}`
    return text
  }).join('\n')
}

/** Plain text of a body: what search, excerpts, and the FTS row index. */
export function plain(blocks) {
  return (blocks ?? []).map((block) => String(block.t ?? '')).join('\n')
}

/** True when a stored value is one of our block documents. */
export function isDoc(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trimStart()
  if (!trimmed.startsWith('{')) return false
  try {
    const parsed = JSON.parse(trimmed)
    return parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.blocks)
  } catch {
    return false
  }
}

/** Blocks of a stored value: our document, or legacy plain text parsed on the way in. */
export function blocksOf(value) {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value.map(normaliseBlock)
  if (isDoc(value)) {
    try {
      return JSON.parse(value).blocks.map(normaliseBlock)
    } catch {
      return []
    }
  }
  return parse(value)
}

function normaliseBlock(block) {
  if (block === null || typeof block !== 'object') return { k: 'p', t: String(block ?? ''), i: 0 }
  const kind = block.k === 'ul' || block.k === 'ol' || block.k === 'task' ? block.k : 'p'
  const next = { k: kind, t: String(block.t ?? ''), i: Math.max(0, Number(block.i) || 0) }
  if (kind === 'ol') next.n = Number(block.n) || 1
  if (kind === 'task') next.c = block.c === true
  return next
}

/** Stored value of a note body: the block document, or null for an empty body. */
export function encode(text) {
  const blocks = parse(text)
  if (blocks.length === 1 && blocks[0].k === 'p' && blocks[0].t === '') return null
  return JSON.stringify({ v: BLOCK_DOC_VERSION, blocks })
}

/** Editable text of a stored value. */
export function decode(value) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') return toText(blocksOf(value))
  if (typeof value === 'string' && isDoc(value)) return toText(blocksOf(value))
  return value
}

/** Plain text of a stored value, for search and indexes. */
export function plainOf(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' && !isDoc(value)) return value
  return plain(blocksOf(value))
}
