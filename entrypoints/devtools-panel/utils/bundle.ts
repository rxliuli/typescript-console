import { build, initialize } from 'esbuild-wasm'
import { esbuildPluginFs } from './fs'
import { esm } from './esm'
import { transformTopLevelAwait } from './transformTopLevelAwait'
import wasmUrl from 'esbuild-wasm/esbuild.wasm?url'
import { serializeError } from 'serialize-error'
import MagicString from 'magic-string'

function transformJSX(code: string) {
  const imports = [
    ...code
      .matchAll(/import [\s\S]+ from ['"]([^'"\n]+)['"]/gm)
      .map((it) => it[1]),
  ]
  const s = new MagicString(code)
  const type = imports.includes('preact')
    ? 'preact'
    : imports.some((it) => it.includes('solid-js'))
      ? 'solid'
      : imports.some((it) => it.includes('react'))
        ? 'react'
        : null
  if (!type) {
    return code
  }
  if (type === 'react') {
    s.prepend(`import { createElement as h, Fragment } from 'react'\n`)
  }
  if (type === 'preact') {
    s.prepend(`import { h, Fragment } from 'preact'\n`)
  }
  if (type === 'solid') {
    s.prepend(
      `import h from 'solid-js/h'\nconst Fragment = (props: { children: any }) => h(() => [props.children])\n`,
    )
  }
  const map = s.generateMap({
    source: 'example.tsx',
  })
  return (
    s.toString() +
    '\n//# sourceMappingURL=data:application/json;base64,' +
    map.toString().split(',')[1]
  )
}

let isInit = false
export async function initializeEsbuild() {
  if (isInit) {
    return
  }
  import.meta.env.BROWSER && console.log('Initializing esbuild...')
  try {
    await initialize({
      wasmURL: wasmUrl,
      // Firefox Extension Page CSP disable blob worker
      worker: import.meta.env.CHROME,
    })
  } catch (error) {
    if (
      serializeError(error as Error).message !==
      'Cannot call "initialize" more than once'
    ) {
      throw error
    }
  }
  isInit = true
}

export async function bundle(
  code: string,
  options?: {
    minify?: boolean
    sourcemap?: boolean | 'inline'
    signal?: AbortSignal
  },
) {
  await initializeEsbuild()
  const before = transformJSX(code)
  const after = transformTopLevelAwait(before, 'example.tsx')
  const r = await build({
    entryPoints: ['example.tsx'],
    jsx: 'transform',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'esnext',
    platform: 'browser',
    plugins: [
      esbuildPluginFs({
        'example.tsx': after,
      }),
      esm({
        signal: options?.signal,
      }),
    ],
    treeShaking: true,
    write: false,
    bundle: true,
    sourcemap: 'inline',
    minify: false,
    format: 'iife',
  })
  return r.outputFiles[0].text
}
