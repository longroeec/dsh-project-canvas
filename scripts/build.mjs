/**
 * Bundles the browser half into the single `client.js` the module loader fetches.
 *
 * `react` stays external on purpose: the Host provides it inside `factory(require)`, so the bundle
 * must not ship a second copy.
 */
import { build } from 'esbuild'

await build({
  entryPoints: ['src/entry.js'],
  outfile: 'client.js',
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  platform: 'browser',
  external: ['react'],
  legalComments: 'none',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
})
