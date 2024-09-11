import { packages } from '@babel/standalone'
import { groupBy } from 'lodash-es'
import type { ImportDeclaration, Statement } from '@babel/types'
import { expose } from 'comlink'

export function transformImports(code: string) {
  const { parser, types, generator } = packages
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
    sourceFilename: 'example.ts',
  })

  const grouped = groupBy(ast.program.body, (it) =>
    types.isImportDeclaration(it),
  )
  const imports = (grouped.true ?? []) as ImportDeclaration[]
  const nonImportBody = (grouped.false ?? []) as Statement[]
  if (imports.length === 0) {
    return code
  }

  const t = types
  const dynamicImports = imports.map((imp) => {
    return t.awaitExpression(
      t.callExpression(t.import(), [
        t.stringLiteral(
          imp.source.value.startsWith('https://')
            ? imp.source.value
            : `https://esm.sh/${imp.source.value}`,
        ),
      ]),
    )
  })

  const params = imports.map((imp) =>
    t.objectPattern(
      imp.specifiers.map((spec) =>
        t.objectProperty(
          t.identifier(spec.local.name),
          t.identifier(spec.local.name),
          false,
          true,
        ),
      ),
    ),
  )

  const newAst = t.program([
    t.expressionStatement(
      t.callExpression(
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.arrowFunctionExpression(
                  params,
                  t.blockStatement(nonImportBody),
                ),
                dynamicImports,
              ),
            ),
          ]),
          true,
        ),
        [],
      ),
    ),
  ])

  ast.program = newAst

  const result = generator.default(
    ast,
    {
      retainLines: true,
      sourceMaps: true,
      sourceFileName: 'example.ts',
    },
    code,
  )

  const base64Map = btoa(JSON.stringify(result.map))
  const inlineSourceMap = `//# sourceMappingURL=data:application/json;base64,${base64Map}`

  return result.code + '\n' + inlineSourceMap
}

expose(transformImports)
