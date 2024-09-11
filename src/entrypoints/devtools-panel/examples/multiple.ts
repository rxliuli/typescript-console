// @ts-nocheck
;(async () => {
  async function moduleResolver(specifiers: string[]) {
    const modules = await Promise.all(
      specifiers.map((specifier) => import(specifier)),
    )
    throw new Error('Not implemented')
  }
  ;(function ({ h, render }, htm) {
    const html = htm.bind(h)

    function App(props: { name: string }) {
      return html`<h1>Hello ${props.name}!</h1>`
    }

    render(html`<${App} name="World" />`, document.body)
  })(...(await moduleResolver(['https://esm.sh/preact', 'https://esm.sh/htm'])))
})()

import { h, render } from 'preact'
import htm from 'htm'

// Initialize htm with Preact
const html = htm.bind(h)

function App(props: { name: string }) {
  return html`<h1>Hello ${props.name}!</h1>`
}

render(html`<${App} name="World" />`, document.body)
