import { expect, it } from 'vitest'
import { bundle } from './bundle'

it('dummy test', async () => {
  const code = `
    import { add } from 'es-toolkit/compat'
    
    console.log(add(1, 2))
  `
  const r = await bundle(code)
  expect(r).include('(1, 2)')
})

it('bundle with abort signal', async () => {
  const code = `
    import { add } from 'es-toolkit/compat'
    
    console.log(add(1, 2))
  `
  const controller = new AbortController()
  controller.abort()
  await expect(bundle(code, { signal: controller.signal })).rejects.toThrow(
    'Aborted',
  )
})

it('bundle with react jsx', async () => {
  const code = `
    import { createRoot } from 'react-dom/client'

    function App() {
      return <h1>Hello World</h1>
    }

    createRoot(document.body).render(<App />)
  `
  const r = await bundle(code)
  expect(r).include('react')
})

it('bundle with preact jsx', async () => {
  const code = `
    import { render } from 'preact'

    function App() {
      return <h1>Hello World</h1>
    }

    render(<App />, document.body)
  `
  const r = await bundle(code)
  expect(r).include('preact')
})

it('bundle with solid jsx', async () => {
  const code = `
    import { render } from "solid-js/web";

    function App() {
      return <h1>Hello World</h1>;
    }

    render(<App />, document.body);
  `
  const r = await bundle(code)
  expect(r).include('solid-js')
})
