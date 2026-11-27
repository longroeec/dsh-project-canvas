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
page.on('console', (message) => logs.push(`${message.type().toUpperCase()}: ${message.text()}`))
page.on('requestfailed', (request) => logs.push(`REQFAIL: ${request.url()} ${request.failure()?.errorText}`))

await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((resolve) => setTimeout(resolve, 6000))

const state = await page.evaluate(() => {
  const loader = window.__ModuleLoader__
  return {
    loaderKeys: loader ? Object.keys(loader) : null,
    hasCanvasEntry: [...document.querySelectorAll('button, a, div')]
      .some((element) => (element.textContent ?? '').trim() === '画布'),
    bodyText: (document.body.innerText ?? '').slice(0, 400),
    registrations: Array.isArray(loader?.pendingQueue) ? loader.pendingQueue.length : null,
  }
})
console.log(JSON.stringify(state, null, 2))
console.log('--- logs ---')
console.log(logs.slice(0, 40).join('\n') || '(none)')
await browser.close()
