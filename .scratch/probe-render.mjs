import puppeteer from 'puppeteer-core'

const url = process.argv[2]
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
const logs = []
page.on('pageerror', (error) => logs.push(`PAGEERROR: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') logs.push(`console.error: ${message.text()}`)
})
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((resolve) => setTimeout(resolve, 6000))

// Render the panel component directly, bypassing the login gate.
const result = await page.evaluate(async () => {
  const loader = window.__ModuleLoader__
  const source = await fetch('/plugins/dsh-project-canvas/client.js').then((r) => r.text()).catch((error) => `/${error}`)
  return {
    loaderMode: loader?.mode ?? null,
    pending: Array.isArray(loader?.pendingQueue) ? loader.pendingQueue.map((entry) => entry.id) : null,
    fetchOk: typeof source === 'string' && source.length > 1000,
    fetchLength: typeof source === 'string' ? source.length : 0,
  }
})
console.log(JSON.stringify(result, null, 2))
console.log('--- logs ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
