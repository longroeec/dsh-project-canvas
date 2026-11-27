import { createHeadlessEditor } from '@lexical/headless'
import { ListNode, ListItemNode } from '@lexical/list'
import { importBlocks, exportBlocks } from '../src/editor/index.js'
import { parseBlocks, blocksToText } from '../src/editor/text.js'

const editor = createHeadlessEditor({ nodes: [ListNode, ListItemNode], onError: (e) => { throw e } })

const text = ['- 能分类', '- 能记录', '1. 先拍照', '2. 再归档', '- [ ] 写导入脚本', '- [x] 连上 OneDrive', '普通一段 **加粗** 和 `代码`', '缩进项', ''].join('\n').replace('缩进项', '  - 缩进项')

await new Promise((resolve) => {
  editor.update(() => { importBlocks(parseBlocks(text)) }, { discrete: true, onUpdate: resolve })
})

let out
editor.getEditorState().read(() => { out = blocksToText(exportBlocks()) })
console.log('out:', JSON.stringify(out))
console.log('equal:', out === text)
