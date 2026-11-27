import { build } from 'esbuild'
await build({
  entryPoints: ['.scratch/editor-test-entry.js'],
  outfile: '.scratch/editor-test.js',
  bundle: true, format: 'iife', target: ['es2020'], platform: 'browser',
  loader: { '.css': 'text' }, legalComments: 'none',
})
console.log('built test bundle')
