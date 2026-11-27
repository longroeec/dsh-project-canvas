import { createHeadlessEditor } from '@lexical/headless'
import { ListNode, ListItemNode } from '@lexical/list'
import { importBlocks, exportBlocks } from '../src/editor/index.js'
import { parseBlocks } from '../src/editor/text.js'

const editor = createHeadlessEditor({ nodes: [ListNode, ListItemNode], onError: (e) => { throw e } })
await new Promise((resolve) => editor.update(() => importBlocks(parseBlocks('- a\n  - b\n- c')), { discrete: true, onUpdate: resolve }))
editor.getEditorState().read(() => console.log(JSON.stringify(exportBlocks())))
