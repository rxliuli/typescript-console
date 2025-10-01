import { build, initialize } from 'esbuild-wasm'
import { esbuildPluginFs } from './fs'
import { esm } from './esm'
import { createTopLevelAwaitTransformer } from './transformTopLevelAwait'
import { createRemoveExportsTransformer } from './transformExports'
import wasmUrl from 'esbuild-wasm/esbuild.wasm?url'
import { serializeError } from 'serialize-error'
import MagicString from 'magic-string'
import * as ts from 'typescript'

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

/**
 * Apply both transforms (remove exports and top-level await) in a single AST pass
 */
export function applyTransforms(
  code: string,
  fileName = 'example.tsx',
): string {
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  // Check if we need top-level await transformation
  let hasTopLevelAwait = false
  function checkTopLevelAwait(node: ts.Node) {
    if (ts.isAwaitExpression(node) && isAtTopLevel(node)) {
      hasTopLevelAwait = true
    }
    ts.forEachChild(node, checkTopLevelAwait)
  }
  checkTopLevelAwait(sourceFile)

  const resultVariableName = '__result__' + Math.random().toString(16).slice(2)

  // Apply both transformers in sequence
  const transformers = [
    createRemoveExportsTransformer(),
    ...(hasTopLevelAwait
      ? [createTopLevelAwaitTransformer(resultVariableName)]
      : []),
  ]

  const result = ts.transform(sourceFile, transformers)
  const transformedSourceFile = result.transformed[0]

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  })

  const output = printer.printFile(transformedSourceFile)
  result.dispose()

  return output
}

function isAtTopLevel(node: ts.Node): boolean {
  let current = node.parent
  while (current) {
    if (
      ts.isFunctionLike(current) ||
      ts.isClassDeclaration(current) ||
      ts.isMethodDeclaration(current)
    ) {
      return false
    }
    current = current.parent
  }
  return true
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
  const after = applyTransforms(before, 'example.tsx')
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
