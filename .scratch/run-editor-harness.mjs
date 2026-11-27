import puppeteer from 'puppeteer-core'
import { resolve } from 'node:path'

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
})
const page = await browser.newPage()
const logs = []
page.on('pageerror', (error) => logs.push(`PAGEERROR: ${error.message}`))
page.on('console', (message) => { if (message.type() === 'error') logs.push(`console.error: ${message.text()}`) })
await page.goto(`file://${resolve('.scratch/editor-harness.html')}`, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 2500))
const result = await page.evaluate(() => window.__result)
console.log(JSON.stringify(result, null, 2))
console.log('--- logs ---')
console.log(logs.slice(0, 10).join('\n') || '(none)')
await browser.close()
