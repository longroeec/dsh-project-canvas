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
  if (message.type() === 'error' || message.type() === 'warning') logs.push(`${message.type()}: ${message.text()}`)
})
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// dismiss the first-run welcome if it is showing
for (const label of ['继续', 'Continue']) {
  const clicked = await page.evaluate((text) => {
    const button = [...document.querySelectorAll('button')].find((el) => (el.textContent ?? '').trim() === text)
    if (!button) return false
    button.click()
    return true
  }, label)
  if (clicked) { await new Promise((r) => setTimeout(r, 3000)); break }
}

const state = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button, a')]
    .map((el) => (el.textContent ?? '').trim())
    .filter((text) => text !== '')
  return {
    hasCanvas: buttons.includes('画布'),
    buttons: [...new Set(buttons)].slice(0, 30),
    body: (document.body.innerText ?? '').slice(0, 200),
  }
})
console.log(JSON.stringify(state, null, 2))
console.log('--- logs ---')
console.log(logs.slice(0, 20).join('\n') || '(none)')
await browser.close()
