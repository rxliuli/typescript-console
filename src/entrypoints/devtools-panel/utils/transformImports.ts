import { packages } from '@babel/standalone'
import { groupBy } from 'lodash-es'
import type {
  ImportDeclaration,
  Statement,
  ImportSpecifier,
  Identifier,
} from '@babel/types'
import { expose } from 'comlink'
import defineCode from './define?raw'
import { isWebWorker } from './isWebWorker'
import * as convert from 'convert-source-map'

type ImportType = {
  source: string
} & (
  | {
      type: 'namespace'
      name: string
    }
  | {
      type: 'default'
      name: string
    }
  | {
      type: 'named'
      imports: Record<string, string>
    }
)

function getJsxType(importSources: string[]): 'react' | 'preact' | undefined {
  if (
    importSources.includes('react') ||
    importSources.includes('react/client')
  ) {
    return 'react'
  }
  if (importSources.includes('preact')) {
    return 'preact'
  }
}

export function transformImports(code: string): string {
  const { parser, types, generator } = packages
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    sourceFilename: 'example.tsx',
  })

  const defineAst = parser.parse(defineCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
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

  const parsedImports = imports.flatMap((imp): ImportType[] => {
    // 解析 import 为不同类型，例如 import * as _ from 'lodash-es' 和 import React from 'react'
    // 然后分别处理
    const specifiers = imp.specifiers
    const source = imp.source.value
    const isNamespace =
      specifiers.length === 1 && t.isImportNamespaceSpecifier(specifiers[0])
    const includeDefault = specifiers.some((it) =>
      t.isImportDefaultSpecifier(it),
    )
    if (isNamespace) {
      return [
        {
          type: 'namespace',
          source,
          name: specifiers[0].local.name,
        },
      ]
    }
    const namedImport = specifiers.filter(
      (it) => !t.isImportDefaultSpecifier(it),
    )
    const result: ImportType[] = []
    if (namedImport.length > 0) {
      result.push({
        type: 'named',
        source,
        imports: namedImport.reduce((acc, it) => {
          acc[((it as ImportSpecifier).imported as Identifier).name] =
            it.local.name
          return acc
        }, {} as Record<string, string>),
      } as ImportType)
    }
    if (includeDefault) {
      result.push({
        type: 'default',
        source,
        name: specifiers[0].local.name,
      } as ImportType)
    }
    return result
  })
  const jsx = getJsxType(parsedImports.map((it) => it.source))
  if (jsx === 'react') {
    parsedImports.push({
      type: 'named',
      source: 'react',
      imports: {
        createElement: 'h',
      },
    })
  } else if (jsx === 'preact') {
    parsedImports.push({
      type: 'named',
      source: 'preact',
      imports: {
        h: 'h',
      },
    })
  }
  const params = parsedImports.map((imp) =>
    imp.type === 'named'
      ? t.objectPattern(
          Object.entries(imp.imports).map((spec) =>
            t.objectProperty(t.identifier(spec[0]), t.identifier(spec[1])),
          ),
        )
      : t.identifier(imp.name),
  )

  const newAst = t.program([
    defineAst.program.body[0],
    t.expressionStatement(
      t.callExpression(t.identifier('define'), [
        t.arrayExpression(
          parsedImports.map((it) => {
            if (jsx === 'preact') {
              if (it.source !== 'preact') {
                return t.stringLiteral(
                  `${it.source}?alias=react:preact/compat&deps=preact@latest`,
                )
              }
            }
            return t.stringLiteral(it.source)
          }),
        ),
        t.arrowFunctionExpression(params, t.blockStatement(nonImportBody)),
      ]),
    ),
  ])

  ast.program = newAst

  const result = generator.default(
    ast,
    {
      retainLines: true,
      sourceMaps: true,
      sourceFileName: 'example.tsx',
    },
    code,
  )

  const inlineSourceMap = convert.fromObject(result.map).toComment()
  return result.code + '\n' + inlineSourceMap
}

if (isWebWorker()) {
  expose(transformImports)
}
