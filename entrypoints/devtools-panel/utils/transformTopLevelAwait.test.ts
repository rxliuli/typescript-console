import { expect, it } from 'vitest'
import { transformTopLevelAwait } from './transformTopLevelAwait'

it('simple await', () => {
  const code = transformTopLevelAwait(`
    console.log(1)
    await new Promise(res => setTimeout(res, 1000))
    console.log(2)
  `)
  expect(code).include('(async () => {')
})
it('await value', async () => {
  expect(await eval(`Promise.resolve(1)`)).eq(1)
  const code = transformTopLevelAwait(`await Promise.resolve(1)`)
  expect(code).include('(async () => {')
  const r = await eval(code)
  expect(r).eq(1)
})
it('no includes await', () => {
  const c = `
    console.log(1)
    console.log(2)
  `
  const code = transformTopLevelAwait(c)
  expect(code).include('console.log(1)')
  expect(code).include('console.log(2)')
})
it('includes imports', async () => {
  const code = transformTopLevelAwait(`
    import { add } from 'es-toolkit/compat'

    await Promise.resolve(add(1, 2))
  `)
  expect(code).include(`import { add } from 'es-toolkit/compat'`)
})
it('includes await but not in start', async () => {
  const c = `
  const r = await Promise.resolve(1)
  r
  `.trim()
  const code = transformTopLevelAwait(c)
  const r = await eval(code)
  expect(r).eq(1)
})
