import { transformImports } from '../transformImports'
import { describe, expect, it } from 'vitest'
import { packages } from '@babel/standalone'

it('transform import', () => {
  const code = `
import { h, render } from 'preact'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
`

  const transformed = transformImports(code)

  expect(transformed).include('await import("https://esm.sh/preact"));')
})

it('multiple imports', () => {
  const code = `
import { h, render } from 'preact'
import { useState } from 'preact/hooks'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
console.log(1)
`

  const transformed = transformImports(code)

  expect(transformed).include('await import("https://esm.sh/preact")')
  expect(transformed).include('await import("https://esm.sh/preact/hooks")')
})

it('include sourcemap', () => {
  const code = `
import { h, render } from 'preact'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
`

  const transformed = transformImports(code)

  expect(transformed).include('# sourceMappingURL=data:application/json;base64')
})

it("don't transform http import", () => {
  const code = `
import { h, render } from 'https://cdn.jsdelivr.net/npm/preact@10.23.2/+esm'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
`
  const transformed = transformImports(code)

  expect(transformed).not.include('https://esm.sh')
})

