/**
 * Text ⇄ blocks for the editor.
 *
 * The note keeps its mark-carrying text (see `lib/blocks.js`); the editor parses that text into
 * line blocks, hands them to Lexical, and writes them back the same way, so storage, tools, and
 * search never learn about the editor.
 */

export const TASK_LINE = /^(\s*)[-*+]\s+\[([ xX])\]\s?(.*)$/
export const ORDERED_LINE = /^(\s*)(\d{1,9})[.)]\s+(.*)$/
export const BULLET_LINE = /^(\s*)[-*+]\s+(.*)$/

const indentOf = (leading) => Math.max(0, Math.floor(String(leading ?? '').replace(/\t/g, '  ').length / 2))

export function parseBlocks(text) {
  return String(text ?? '').split('\n').map((line) => {
    const task = TASK_LINE.exec(line)
    if (task !== null) {
      return { k: 'task', t: task[3], i: indentOf(task[1]), c: task[2].toLowerCase() === 'x' }
    }
    const ordered = ORDERED_LINE.exec(line)
    if (ordered !== null) return { k: 'ol', t: ordered[3], i: indentOf(ordered[1]), n: Number(ordered[2]) }
    const bullet = BULLET_LINE.exec(line)
    if (bullet !== null) return { k: 'ul', t: bullet[2], i: indentOf(bullet[1]) }
    return { k: 'p', t: line, i: 0 }
  })
}

export function blocksToText(blocks) {
  return blocks.map((block) => {
    const indent = '  '.repeat(Math.max(0, Number(block.i) || 0))
    if (block.k === 'task') return `${indent}- [${block.c === true ? 'x' : ' '}] ${block.t}`
    if (block.k === 'ol') return `${indent}${Number(block.n) || 1}. ${block.t}`
    if (block.k === 'ul') return `${indent}- ${block.t}`
    return block.t
  }).join('\n')
}

/** Split a line into marked runs: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``. */
export function parseInline(text) {
  const runs = []
  const source = String(text ?? '')
  const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*\n]+\*)/
  let rest = source
  while (rest !== '') {
    const match = pattern.exec(rest)
    if (match === null) {
      runs.push({ text: rest })
      break
    }
    if (match.index > 0) runs.push({ text: rest.slice(0, match.index) })
    const token = match[0]
    if (token.startsWith('**')) runs.push({ text: token.slice(2, -2), bold: true })
    else if (token.startsWith('~~')) runs.push({ text: token.slice(2, -2), strike: true })
    else if (token.startsWith('`')) runs.push({ text: token.slice(1, -1), code: true })
    else runs.push({ text: token.slice(1, -1), italic: true })
    rest = rest.slice(match.index + token.length)
  }
  return runs.length === 0 ? [{ text: '' }] : runs
}

/** Join marked runs back into one line. */
export function inlineToText(runs) {
  return runs.map((run) => {
    if (run.code) return `\`${run.text}\``
    if (run.strike) return `~~${run.text}~~`
    if (run.bold && run.italic) return `***${run.text}***`
    if (run.bold) return `**${run.text}**`
    if (run.italic) return `*${run.text}*`
    return run.text
  }).join('')
}
