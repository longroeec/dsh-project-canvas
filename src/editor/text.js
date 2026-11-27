/**
 * Text ⇄ blocks for the editor (document version 2).
 *
 * Mirrors `lib/blocks.js`: the note keeps its mark-carrying text, the editor parses that text into
 * line blocks, hands them to Lexical, and writes them back the same way, so storage, tools, and
 * search never learn about the editor.
 */

export const TASK_LINE = /^(\s*)[-*+]\s+\[([ xX])\]\s?(.*)$/
export const ORDERED_LINE = /^(\s*)(\d{1,9})[.)]\s+(.*)$/
export const BULLET_LINE = /^(\s*)[-*+]\s+(.*)$/
export const HEADING_LINE = /^(#{1,3})\s+(.*)$/
export const QUOTE_LINE = /^\s*>\s?(.*)$/
export const DIVIDER_LINE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
export const FENCE_LINE = /^\s*```(\S*)\s*$/

const indentOf = (leading) => Math.max(0, Math.floor(String(leading ?? '').replace(/\t/g, '  ').length / 2))

export function parseBlocks(text) {
  const lines = String(text ?? '').split('\n')
  const blocks = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const fence = FENCE_LINE.exec(line)
    if (fence !== null) {
      const body = []
      index += 1
      while (index < lines.length && !FENCE_LINE.test(lines[index])) {
        body.push(lines[index])
        index += 1
      }
      blocks.push({ k: 'code', t: body.join('\n'), i: 0, lang: fence[1] })
      continue
    }
    const heading = HEADING_LINE.exec(line)
    if (heading !== null) {
      blocks.push({ k: `h${heading[1].length}`, t: heading[2], i: 0 })
      continue
    }
    const quote = QUOTE_LINE.exec(line)
    if (quote !== null) {
      blocks.push({ k: 'quote', t: quote[1], i: 0 })
      continue
    }
    if (DIVIDER_LINE.test(line)) {
      blocks.push({ k: 'divider', t: '', i: 0 })
      continue
    }
    const task = TASK_LINE.exec(line)
    if (task !== null) {
      blocks.push({ k: 'task', t: task[3], i: indentOf(task[1]), c: task[2].toLowerCase() === 'x' })
      continue
    }
    const ordered = ORDERED_LINE.exec(line)
    if (ordered !== null) {
      blocks.push({ k: 'ol', t: ordered[3], i: indentOf(ordered[1]), n: Number(ordered[2]) })
      continue
    }
    const bullet = BULLET_LINE.exec(line)
    if (bullet !== null) {
      blocks.push({ k: 'ul', t: bullet[2], i: indentOf(bullet[1]) })
      continue
    }
    blocks.push({ k: 'p', t: line, i: 0 })
  }
  return blocks
}

export function blocksToText(blocks) {
  return blocks.map((block) => {
    const indent = '  '.repeat(Math.max(0, Number(block.i) || 0))
    if (block.k === 'task') return `${indent}- [${block.c === true ? 'x' : ' '}] ${block.t}`
    if (block.k === 'ol') return `${indent}${Number(block.n) || 1}. ${block.t}`
    if (block.k === 'ul') return `${indent}- ${block.t}`
    if (block.k === 'h1' || block.k === 'h2' || block.k === 'h3') return `${'#'.repeat(Number(block.k[1]))} ${block.t}`
    if (block.k === 'quote') return `> ${block.t}`
    if (block.k === 'divider') return '---'
    if (block.k === 'code') return `\`\`\`${block.lang ?? ''}\n${block.t}\n\`\`\``
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
