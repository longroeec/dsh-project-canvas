/**
 * Structured note body, version 2.
 *
 * A note keeps a list of line blocks instead of one string: paragraphs, headings, quotes, list
 * lines, check items, code fences, and dividers. Text stays the single editable surface — `parse`
 * reads the markdown-ish lines the editor produces and `toText` writes them back — so the panel,
 * the agent tools, and imported desktop rows all keep working through one conversion.
 *
 * Stored shape: {"v": 2, "blocks": [{ "k": "ul", "t": "…", "i": 0 }, …]}
 * Version 1 documents (only p/ul/ol/task) read through the same parser.
 */

export const BLOCK_DOC_VERSION = 2

const HEADING = /^(#{1,3})\s+(.*)$/
const QUOTE = /^\s*>\s?(.*)$/
const TASK = /^(\s*)[-*+]\s+\[([ xX])\]\s?(.*)$/
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/
const BULLET = /^(\s*)[-*+]\s+(.*)$/
const DIVIDER = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
const FENCE = /^\s*```(\S*)\s*$/

const INDENT_WIDTH = 2

function indentOf(leading) {
  return Math.max(0, Math.floor(String(leading ?? '').replace(/\t/g, '  ').length / INDENT_WIDTH))
}

/** Read one note body into blocks; anything unrecognised is a paragraph. */
export function parse(text) {
  const lines = String(text ?? '').split('\n')
  const blocks = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const fence = FENCE.exec(line)
    if (fence !== null) {
      const body = []
      index += 1
      while (index < lines.length && !FENCE.test(lines[index])) {
        body.push(lines[index])
        index += 1
      }
      blocks.push({ k: 'code', t: body.join('\n'), i: 0, lang: fence[1] })
      continue
    }
    const heading = HEADING.exec(line)
    if (heading !== null) {
      blocks.push({ k: `h${heading[1].length}`, t: heading[2].replace(/\s+$/, ''), i: 0 })
      continue
    }
    const quote = QUOTE.exec(line)
    if (quote !== null) {
      blocks.push({ k: 'quote', t: quote[1].replace(/\s+$/, ''), i: 0 })
      continue
    }
    if (DIVIDER.test(line)) {
      blocks.push({ k: 'divider', t: '', i: 0 })
      continue
    }
    const task = TASK.exec(line)
    if (task !== null) {
      blocks.push({ k: 'task', t: task[3].replace(/\s+$/, ''), i: indentOf(task[1]), c: task[2].toLowerCase() === 'x' })
      continue
    }
    const ordered = ORDERED.exec(line)
    if (ordered !== null) {
      blocks.push({ k: 'ol', t: ordered[3].replace(/\s+$/, ''), i: indentOf(ordered[1]), n: Number(ordered[2]) })
      continue
    }
    const bullet = BULLET.exec(line)
    if (bullet !== null) {
      blocks.push({ k: 'ul', t: bullet[2].replace(/\s+$/, ''), i: indentOf(bullet[1]) })
      continue
    }
    blocks.push({ k: 'p', t: line.replace(/\s+$/, ''), i: 0 })
  }
  return blocks
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
    if (block.k === 'h1' || block.k === 'h2' || block.k === 'h3') return `${'#'.repeat(Number(block.k[1]))} ${text}`
    if (block.k === 'quote') return `> ${text}`
    if (block.k === 'divider') return '---'
    if (block.k === 'code') return `\`\`\`${block.lang ?? ''}\n${text}\n\`\`\``
    return text
  }).join('\n')
}

/** Plain text of a body: what search, excerpts, and the FTS row index. */
export function plain(blocks) {
  return (blocks ?? []).map((block) => (block.k === 'divider' ? '' : String(block.t ?? ''))).join('\n')
}

/** True when a stored value is one of our block documents. */
export function isDoc(value) {
  if (typeof value !== 'string') return false
  if (!value.trimStart().startsWith('{')) return false
  try {
    const parsed = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.blocks)
  } catch {
    return false
  }
}

const BLOCK_KINDS = new Set(['p', 'ul', 'ol', 'task', 'h1', 'h2', 'h3', 'quote', 'code', 'divider'])

function normaliseBlock(block) {
  if (block === null || typeof block !== 'object') return { k: 'p', t: String(block ?? ''), i: 0 }
  const next = {
    k: BLOCK_KINDS.has(block.k) ? block.k : 'p',
    t: String(block.t ?? ''),
    i: Math.max(0, Number(block.i) || 0),
  }
  if (next.k === 'ol') next.n = Number(block.n) || 1
  if (next.k === 'task') next.c = block.c === true
  if (next.k === 'code') next.lang = typeof block.lang === 'string' ? block.lang : ''
  return next
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
  if (isDoc(value)) return toText(blocksOf(value))
  return value
}

/** Plain text of a stored value, for search and indexes. */
export function plainOf(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' && !isDoc(value)) return value
  return plain(blocksOf(value))
}
