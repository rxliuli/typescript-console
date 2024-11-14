import { transformImports } from '../transformImports'
import { expect, it } from 'vitest'

it('transform import', () => {
  const code = `
import { h, render } from 'preact'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
`
  const transformed = transformImports(code)
  expect(transformed).include('define(["preact"]')
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
  expect(transformed).include('define(["preact", "preact/hooks"]')
})
it('include sourcemap', () => {
  const code = `
import { h, render } from 'preact'

const app = h('h1', null, 'Hello World!')
render(app, document.body)
`
  const transformed = transformImports(code)
  expect(transformed).include('//# sourceMappingURL=data:application/json;')
})
it('default import', async () => {
  const code = `
import htm from 'htm'
console.log(htm)
  `
  const transformed = transformImports(code)
  expect(transformed).include('define(["htm"]')
})
it('mixed import', async () => {
  const code = `
import _, { add as add1 } from 'lodash-es'
import add2 from 'lodash-es/add'

console.log(_.add(1, 2), add1(1, 2), add2(1, 2))
`
  const transformed = transformImports(code)
  expect(transformed).include(
    'define(["lodash-es", "lodash-es", "lodash-es/add"]',
  )
})
