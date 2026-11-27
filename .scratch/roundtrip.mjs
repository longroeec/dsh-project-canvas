import { createHeadlessEditor } from '@lexical/headless'
import { ListNode, ListItemNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { CodeNode } from '@lexical/code'
import { importBlocks, exportBlocks } from '../src/editor/index.js'
import { parseBlocks, blocksToText } from '../src/editor/text.js'

const editor = createHeadlessEditor({
  nodes: [ListNode, ListItemNode, HeadingNode, QuoteNode, CodeNode],
  onError: (error) => { throw error },
})

const text = [
  '# 标题一', '## 标题二', '普通段落 **加粗** 和 `代码`', '> 引用一句',
  '- 项目一', '1. 第一步', '- [ ] 待办', '- [x] 已完成',
  '```js', 'const a = 1', 'console.log(a)', '```',
  '收尾段落',
].join('\n')

await new Promise((resolve) => {
  editor.update(() => { importBlocks(parseBlocks(text)) }, { discrete: true, onUpdate: resolve })
})
let out
editor.getEditorState().read(() => { out = blocksToText(exportBlocks()) })
console.log('out:', JSON.stringify(out))
console.log('equal:', out === text)
