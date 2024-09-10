// @ts-nocheck
;(async () => {
  ;(function ({ h, render }) {
    const app = h('h1', null, 'Hello World!')
    render(app, document.body)
  })(await import('https://esm.sh/preact'))
})()

import { h, render } from 'https://esm.sh/preact'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
