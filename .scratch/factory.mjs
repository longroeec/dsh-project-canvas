import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/' })
const { window } = dom
let registered = null
window.__ModuleLoader__ = { load(entry) { registered = entry } }
const source = readFileSync('client.js', 'utf8')
new Function('window', 'document', 'process', source)(window, window.document, { env: { NODE_ENV: 'production' } })

const React = {
  createElement: (...args) => ({ type: args[0], props: args[1] }),
  Fragment: 'fragment',
  useRef: (v) => ({ current: v }),
  useState: (v) => [v, () => {}],
  useEffect: () => {},
  useLayoutEffect: () => {},
  useCallback: (fn) => fn,
}
try {
  const client = registered.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected require ${name}`)
  })
  console.log('factory ok; inject:', client.inject, 'apply?', typeof client.apply)
} catch (error) {
  console.log('FACTORY THROWS:', error.message)
  console.log((error.stack || '').split('\n').slice(0, 5).join('\n'))
}
