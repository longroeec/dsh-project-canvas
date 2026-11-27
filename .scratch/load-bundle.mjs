import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
const { window } = dom
let registered = null
window.__ModuleLoader__ = {
  load(entry) { registered = entry },
}

const source = readFileSync('client.js', 'utf8')
try {
  // eslint-disable-next-line no-new-func
  const run = new Function('window', 'document', 'globalThis', 'self', 'process', source)
  run(window, window.document, window, window, { env: { NODE_ENV: 'production' } })
  console.log('evaluated ok; registered:', registered?.id ?? '(none)')
} catch (error) {
  console.log('THROWS:', error && error.message)
  console.log((error && error.stack || '').split('\n').slice(0, 6).join('\n'))
}
