import { formatWithCursor } from 'prettier/standalone'
import prettierPluginESTree from 'prettier/plugins/estree'
import prettierPluginTypescript from 'prettier/plugins/typescript'
import { expose } from 'comlink'
import { isWebWorker } from './isWebWorker'

export function formatCode(code: string, cursorOffset: number) {
  return formatWithCursor(code, {
    cursorOffset,
    parser: 'typescript',
    plugins: [prettierPluginESTree, prettierPluginTypescript],
    semi: false,
    singleQuote: true,
  })
}

if (isWebWorker()) {
  expose(formatCode)
}
