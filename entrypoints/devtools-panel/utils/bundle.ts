import { build } from 'esbuild-wasm'
import { esbuildPluginFs } from './fs'
import { esm } from './esm'

async function handleJsx(code: string) {
  const imports = [
    ...code
      .matchAll(/import [\s\S]+ from ['"]([^'"\n]+)['"]/gm)
      .map((it) => it[1]),
  ]
  const type = imports.includes('preact')
    ? 'preact'
    : imports.some((it) => it.includes('solid-js'))
      ? 'solid'
      : imports.some((it) => it.includes('react'))
        ? 'react'
        : null
  if (type === 'react') {
    return `import { createElement as h, Fragment } from 'react'\n` + code
  }
  if (type === 'preact') {
    return `import { h, Fragment } from 'preact'\n` + code
  }
  if (type === 'solid') {
    return (
      `import h from 'solid-js/h'\nconst Fragment = (props: { children: any }) => h(() => [props.children])\n` +
      code
    )
  }
  return code
}

export async function bundle(
  code: string,
  options?: {
    minify?: boolean
    sourcemap?: boolean | 'inline'
    signal?: AbortSignal
  },
) {
  const r = await build({
    entryPoints: ['example.tsx'],
    jsx: 'transform',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'esnext',
    platform: 'browser',
    plugins: [
      esbuildPluginFs({ 'example.tsx': await handleJsx(code) }),
      esm({
        signal: options?.signal,
      }),
    ],
    write: false,
    bundle: true,
    sourcemap: options?.sourcemap ?? 'inline',
    minify: options?.minify ?? false,
    format: 'iife',
  })
  return r.outputFiles[0].text
}
