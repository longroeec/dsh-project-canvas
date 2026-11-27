import puppeteer from 'puppeteer-core'
import { resolve } from 'node:path'

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--allow-file-access-from-files', '--no-sandbox'],
})
const page = await browser.newPage()
const logs = []
page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`))
page.on('console', (message) => logs.push(`console.${message.type()}: ${message.text()}`))

await page.goto(`file://${resolve('.scratch/harness.html')}`, { waitUntil: 'load' })
const result = await page.evaluate(() => {
  const errors = []
  try {
    const registration = window.__registration
    if (registration === null) return { ok: false, why: 'bundle never called __ModuleLoader__.load' }
    const React = window.__stubReact()
    const client = registration.factory((name) => {
      if (name === 'react') return React
      throw new Error(`unexpected require ${name}`)
    })
    const record = []
    const ctx = {
      effect(fn) { record.push('effect'); fn() },
      locale: { register() { record.push('locale.register') }, bind() { return (key) => key } },
      slots: {
        inject(name, run) { record.push(`inject:${name}`); run() },
        register(meta) { record.push(`register:${meta && meta.name}`); return () => {} },
      },
    }
    client.apply(ctx)
    return { ok: true, inject: client.inject, record }
  } catch (error) {
    return { ok: false, why: String(error && error.stack ? error.stack : error) }
  }
})
console.log(JSON.stringify(result, null, 2))
console.log('--- page logs ---')
console.log(logs.join('\n') || '(none)')
await browser.close()
