/**
 * The note body editor, on BlockNote.
 *
 * BlockNote ships the finished editing UI — slash menu, drag handles, formatting toolbar, nested
 * blocks, tables, images — so the plugin only adapts its document to the note's block text. The
 * editor mounts into plain DOM through `editor.mount()`, which keeps the bundle free of a second
 * React copy: the host's React renders the surrounding panel, BlockNote renders itself.
 */
import { BlockNoteEditor } from '@blocknote/core'
import blockNoteCss from '@blocknote/core/style.css'
import { blocksToText, parseBlocks, parseInline } from './text.js'

const STYLE_ID = 'pc-blocknote-style'
const CSS = `
.pc-blocknote { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 8px 4px 24px; }
.pc-blocknote .bn-container { background: transparent; }
.pc-blocknote .bn-editor { background: transparent; padding-inline: 12px; color: var(--dsw-alias-label-primary); }
.pc-blocknote .bn-block-content { font-size: 14px; line-height: 1.7; }
.pc-blocknote [data-content-type="heading"][data-level="1"] { font-size: 21px; }
.pc-blocknote [data-content-type="heading"][data-level="2"] { font-size: 17px; }
.pc-blocknote [data-content-type="heading"][data-level="3"] { font-size: 15px; }
`

/** Inline runs ⇄ BlockNote inline content. */
const toInline = (runs) => runs
  .filter((run) => String(run.text ?? '') !== '')
  .map((run) => ({
    type: 'text',
    text: run.text,
    styles: {
      ...(run.bold ? { bold: true } : {}),
      ...(run.italic ? { italic: true } : {}),
      ...(run.strike ? { strike: true } : {}),
      ...(run.code ? { code: true } : {}),
    },
  }))

const fromInline = (content) => (Array.isArray(content) ? content : [])
  .filter((item) => item !== null && typeof item === 'object')
  .map((item) => {
    if (item.type === 'text') {
      const styles = item.styles ?? {}
      return {
        text: String(item.text ?? ''),
        bold: styles.bold === true,
        italic: styles.italic === true,
        strike: styles.strike === true || styles.strikethrough === true,
        code: styles.code === true,
      }
    }
    return { text: String(item.text ?? ''), bold: false, italic: false, strike: false, code: false }
  })
  .filter((run) => run.text !== '')

/** Note blocks → BlockNote document. */
export function toDocument(blocks) {
  return blocks
    .filter((block) => block.k !== 'p' || String(block.t ?? '') !== '')
    .map((block) => {
      const content = toInline(parseInline(block.t))
      if (block.k === 'h1' || block.k === 'h2' || block.k === 'h3') {
        return { type: 'heading', props: { level: Number(block.k[1]) }, content }
      }
      if (block.k === 'quote') return { type: 'quote', content }
      if (block.k === 'divider') return { type: 'divider' }
      if (block.k === 'code') {
        return { type: 'codeBlock', props: { language: block.lang ?? '' }, content }
      }
      if (block.k === 'ul') return { type: 'bulletListItem', content }
      if (block.k === 'ol') return { type: 'numberedListItem', content }
      if (block.k === 'task') return { type: 'checkListItem', props: { checked: block.c === true }, content }
      return { type: 'paragraph', content }
    })
}

/** BlockNote document → note blocks. */
export function fromDocument(document) {
  const blocks = []
  const walk = (items, indent) => {
    for (const item of items ?? []) {
      const text = fromInline(item.content)
      const runs = text.length === 0 ? [{ text: '' }] : text
      const line = joinInline(runs)
      if (item.type === 'heading') {
        const level = Math.min(3, Math.max(1, Number(item.props?.level) || 1))
        blocks.push({ k: `h${level}`, t: line, i: indent })
      } else if (item.type === 'quote') {
        blocks.push({ k: 'quote', t: line, i: indent })
      } else if (item.type === 'divider') {
        blocks.push({ k: 'divider', t: '', i: indent })
      } else if (item.type === 'codeBlock') {
        blocks.push({ k: 'code', t: plainOfDocumentText(item.content), i: indent, lang: item.props?.language ?? '' })
      } else if (item.type === 'bulletListItem') {
        blocks.push({ k: 'ul', t: line, i: indent })
      } else if (item.type === 'numberedListItem') {
        blocks.push({ k: 'ol', t: line, i: indent, n: 1 })
      } else if (item.type === 'checkListItem') {
        blocks.push({ k: 'task', t: line, i: indent, c: item.props?.checked === true })
      } else {
        blocks.push({ k: 'p', t: line, i: indent })
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        // Nested blocks keep their depth as indentation, the way the note text stores it.
        walk(item.children, indent + 1)
      }
    }
  }
  walk(document, 0)
  if (blocks.length === 0) blocks.push({ k: 'p', t: '', i: 0 })
  return blocks
}

function plainOfDocumentText(content) {
  return (Array.isArray(content) ? content : []).map((item) => String(item.text ?? '')).join('')
}

function joinInline(runs) {
  return runs.map((run) => {
    const text = run.text ?? ''
    if (run.code) return `\`${text}\``
    if (run.strike) return `~~${text}~~`
    if (run.bold && run.italic) return `***${text}***`
    if (run.bold) return `**${text}**`
    if (run.italic) return `*${text}*`
    return text
  }).join('')
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `${blockNoteCss}\n${CSS}`
  document.head.appendChild(style)
}

/** Mount the editor into `container`; returns a handle whose `destroy()` removes it again. */
export function mountBodyEditor(container, { initialText, onChange, onCommit, onCancel, t }) {
  ensureStyle()
  const host = document.createElement('div')
  host.className = 'pc-blocknote'
  host.setAttribute('data-color-scheme', document.body?.hasAttribute('data-ds-dark-theme') === true ? 'dark' : 'light')
  host.setAttribute('aria-label', t('noteBody'))
  container.appendChild(host)

  const editor = BlockNoteEditor.create({ initialContent: toDocument(parseBlocks(initialText)) })
  editor.mount(host)
  const off = editor.onChange(() => {
    try {
      onChange(blocksToText(fromDocument(editor.document)))
    } catch (error) {
      console.error('[project-canvas] body export failed', error)
    }
  })

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onCommit()
    }
  }
  host.addEventListener('keydown', onKeyDown)

  return {
    focus() {
      const editable = host.querySelector('.bn-editor [contenteditable="true"]')
      if (editable instanceof HTMLElement) editable.focus()
    },
    destroy() {
      host.removeEventListener('keydown', onKeyDown)
      if (typeof off === 'function') off()
      editor.unmount()
      container.replaceChildren()
    },
  }
}
