/**
 * The note body editor.
 *
 * Lexical owns the document (selection, IME, undo, paste); this module only maps its node tree to
 * the note's block text and draws the toolbar, so the Host, the tools, and storage stay unchanged.
 */
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $getNearestNodeFromDOMNode,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  createEditor,
} from 'lexical'
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  registerList,
} from '@lexical/list'
import { registerRichText } from '@lexical/rich-text'
import { createEmptyHistoryState, registerHistory } from '@lexical/history'
import { blocksToText, inlineToText, parseBlocks, parseInline } from './text.js'

const LIST_TYPES = { ul: 'bullet', ol: 'number', task: 'check' }
const BLOCK_KINDS = { bullet: 'ul', number: 'ol', check: 'task' }

const STYLE_ID = 'pc-editor-style'
const CSS = `
.pc-editable { flex: 1 1 auto; overflow-y: auto; padding: 12px 14px 24px; outline: none; min-height: 0; font-size: 14px; line-height: 1.65; color: var(--dsw-alias-label-primary); caret-color: #3B7A57; }
.pc-editable p { margin: 0; }
.pc-editable ul, .pc-editable ol { margin: 0; padding-left: 22px; }
.pc-editable li { margin: 0; }
.pc-editable li::marker { color: var(--dsw-alias-label-tertiary); }
.pc-editable code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.94em; background: var(--dsw-alias-bg-layer-3); border-radius: 4px; padding: 0 3px; }
.pc-editable ul { list-style: none; }
.pc-editable ul:not(:has(> li[role="checkbox"])) { list-style: disc; }
.pc-editable li[role="checkbox"] { position: relative; padding-left: 22px; }
.pc-editable li[role="checkbox"]::before { content: ''; position: absolute; left: 3px; top: 4px; width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid #C4B9A4; cursor: pointer; }
.pc-editable li[role="checkbox"][aria-checked="true"]::before { background: #3B7A57; border-color: #3B7A57; }
.pc-editable li[role="checkbox"][aria-checked="true"] { opacity: 0.72; text-decoration: line-through; }
.pc-toolbar { display: flex; align-items: center; gap: 2px; padding: 6px 12px; border-top: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.pc-tool { min-width: 30px; height: 26px; padding: 0 6px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; cursor: pointer; }
.pc-tool:hover { background: var(--dsw-alias-bg-layer-3); }
.pc-split { width: 1px; height: 16px; margin: 0 6px; background: var(--dsw-alias-border-l2); }
`

/** Build the Lexical tree from the note's line blocks. */
export function importBlocks(blocks) {
  const root = $getRoot()
  root.clear()
  let list = null
  let listKind = null
  for (const block of blocks) {
    const kind = block.k === 'p' ? null : LIST_TYPES[block.k]
    if (kind === null) {
      list = null
      listKind = null
      const paragraph = $createParagraphNode()
      for (const run of parseInline(block.t)) paragraph.append(textOf(run))
      root.append(paragraph)
      continue
    }
    if (list === null || listKind !== kind) {
      list = $createListNode(kind)
      listKind = kind
      root.append(list)
    }
    const item = $createListItemNode(block.k === 'task' ? block.c === true : undefined)
    item.setIndent(Math.max(0, Number(block.i) || 0))
    for (const run of parseInline(block.t)) item.append(textOf(run))
    list.append(item)
  }
  if (root.getChildrenSize() === 0) root.append($createParagraphNode())
}

function textOf(run) {
  const node = $createTextNode(run.text)
  let format = 0
  if (run.bold) format |= IS_BOLD
  if (run.italic) format |= IS_ITALIC
  if (run.strike) format |= IS_STRIKETHROUGH
  if (run.code) format |= IS_CODE
  if (format !== 0) node.setFormat(format)
  return node
}

/** Read the Lexical tree back as line blocks. */
export function exportBlocks() {
  const blocks = []
  for (const child of $getRoot().getChildren()) {
    if ($isListNode(child)) {
      const kind = BLOCK_KINDS[child.getListType()] ?? 'ul'
      let ordinal = 0
      for (const item of child.getChildren()) {
        if (!$isListItemNode(item)) continue
        ordinal += 1
        const text = inlineToText(runsOf(item))
        if (kind === 'task') blocks.push({ k: 'task', t: text, i: item.getIndent(), c: item.getChecked() === true })
        else if (kind === 'ol') blocks.push({ k: 'ol', t: text, i: item.getIndent(), n: ordinal })
        else blocks.push({ k: 'ul', t: text, i: item.getIndent() })
      }
      continue
    }
    blocks.push({ k: 'p', t: inlineToText(runsOf(child)), i: 0 })
  }
  if (blocks.length === 0) blocks.push({ k: 'p', t: '', i: 0 })
  return blocks
}

function runsOf(node) {
  const runs = []
  const walk = (current) => {
    if ($isTextNode(current)) {
      const format = current.getFormat()
      runs.push({
        text: current.getTextContent(),
        bold: (format & IS_BOLD) !== 0,
        italic: (format & IS_ITALIC) !== 0,
        strike: (format & IS_STRIKETHROUGH) !== 0,
        code: (format & IS_CODE) !== 0,
      })
      return
    }
    if ($isElementNode(current)) {
      for (const child of current.getChildren()) walk(child)
      return
    }
    if (current.getTextContent() !== '') runs.push({ text: current.getTextContent() })
  }
  walk(node)
  return runs
}

function ensureStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

/**
 * Mount the editor into `container`; returns a handle whose `destroy()` removes it again.
 * `onChange` receives the note text after every edit.
 */
export function mountBodyEditor(container, { initialText, onChange, onCommit, onCancel, t }) {
  ensureStyle()
  const editable = document.createElement('div')
  editable.className = 'pc-editable'
  editable.contentEditable = 'true'
  editable.spellcheck = false
  editable.setAttribute('aria-label', t('noteBody'))

  const toolbar = document.createElement('div')
  toolbar.className = 'pc-toolbar'

  container.appendChild(editable)
  container.appendChild(toolbar)

  const editor = createEditor({
    namespace: 'dsh-project-canvas',
    nodes: [ListNode, ListItemNode],
    onError(error) {
      // eslint-disable-next-line no-console
      console.error('[project-canvas] editor error', error)
    },
  })
  editor.setRootElement(editable)

  const unregister = [
    registerRichText(editor),
    registerList(editor),
    registerHistory(editor, createEmptyHistoryState(), 1200),
  ]

  editor.update(() => importBlocks(parseBlocks(initialText)), { discrete: true })

  const emit = () => {
    editor.getEditorState().read(() => {
      onChange(blocksToText(exportBlocks()))
    })
  }
  unregister.push(editor.registerUpdateListener(() => emit()))

  const button = (label, title, onPress) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'pc-tool'
    element.textContent = label
    element.title = title
    element.setAttribute('aria-label', title)
    element.addEventListener('mousedown', (event) => event.preventDefault())
    element.addEventListener('click', (event) => { event.preventDefault(); onPress() })
    return element
  }

  const split = () => {
    const element = document.createElement('span')
    element.className = 'pc-split'
    return element
  }

  toolbar.append(
    button('B', t('boldTool'), () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')),
    button('I', t('italicTool'), () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')),
    button('S', t('strikeTool'), () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')),
    button('</>', t('codeTool'), () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')),
    split(),
    button('•', t('bulletTool'), () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)),
    button('1.', t('orderedTool'), () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)),
    button('☑', t('taskTool'), () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)),
  )

  const onClick = (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const item = target.closest('li[role="checkbox"]')
    if (item === null) return
    const box = item.getBoundingClientRect()
    if (event.clientX - box.left > 24) return
    event.preventDefault()
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(item)
      if ($isListItemNode(node)) node.setChecked(node.getChecked() !== true)
    })
  }
  editable.addEventListener('click', onClick)

  const onKeyDown = (event) => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); onCommit() }
  }
  editable.addEventListener('keydown', onKeyDown)

  return {
    focus() {
      editable.focus()
      const selection = window.getSelection()
      if (selection === null) return
      const range = document.createRange()
      range.selectNodeContents(editable)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    },
    destroy() {
      editable.removeEventListener('keydown', onKeyDown)
      editable.removeEventListener('click', onClick)
      for (const off of unregister) {
        if (typeof off === 'function') off()
      }
      editor.setRootElement(null)
      container.replaceChildren()
    },
  }
}
