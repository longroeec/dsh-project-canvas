/**
 * Bundle entry: registers the browser half with the harness module loader.
 *
 * Everything else is bundled in; only `react` comes from the Host, which keeps the plugin on the
 * loader's trust fence and lets Lexical (and later editors) ship as ordinary imports.
 */
import { createClient } from './plugin.js'

window.__ModuleLoader__.load({
  id: 'dsh-project-canvas',
  factory(require) {
    return createClient(require('react'))
  },
})
