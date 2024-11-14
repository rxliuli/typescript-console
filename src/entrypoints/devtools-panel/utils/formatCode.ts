import { formatWithCursor } from 'prettier/standalone'
// @ts-expect-error
import prettierPluginESTree from 'prettier/plugins/estree.mjs'
// @ts-expect-error
import prettierPluginTypescript from 'prettier/plugins/typescript.mjs'
import { expose } from 'comlink'
import { isWebWorker } from './isWebWorker'

export function formatCode(code: string, cursorOffset: number) {
  return formatWithCursor(code, {
    cursorOffset,
    parser: 'typescript',
    plugins: [prettierPluginESTree, prettierPluginTypescript],
  })
}

if (isWebWorker()) {
  expose(formatCode)
}
