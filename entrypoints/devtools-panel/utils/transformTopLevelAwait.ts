import * as ts from 'typescript'
import { SourceMapGenerator } from 'source-map'
import { isWebWorker } from './isWebWorker'
import { expose } from 'comlink'

export function createTopLevelAwaitTransformer(
  resultVariableName: string,
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    return (sourceFile) => {
      let hasTopLevelAwait = false

      function visitor(node: ts.Node): ts.Node {
        if (ts.isAwaitExpression(node) && isAtTopLevel(node)) {
          hasTopLevelAwait = true
        }
        return ts.visitEachChild(node, visitor, context)
      }

      ts.visitNode(sourceFile, visitor)

      if (!hasTopLevelAwait) {
        return sourceFile
      }

      const imports = sourceFile.statements.filter(
        (s) => ts.isImportDeclaration(s) || ts.isImportEqualsDeclaration(s),
      )

      const body = sourceFile.statements.filter(
        (s) => !ts.isImportDeclaration(s) && !ts.isImportEqualsDeclaration(s),
      )

      const originalPositions = new Map<ts.Node, { pos: number; end: number }>()
      body.forEach((stmt) => {
        originalPositions.set(stmt, { pos: stmt.pos, end: stmt.end })
      })

      const processedBody = body.map((statement, index) => {
        if (index === body.length - 1) {
          if (ts.isExpressionStatement(statement)) {
            const returnStmt = ts.factory.createReturnStatement(
              statement.expression,
            )
            ts.setTextRange(returnStmt, statement)
            return returnStmt
          }
          if (ts.isIdentifier(statement as any)) {
            const returnStmt = ts.factory.createReturnStatement(
              statement as any,
            )
            ts.setTextRange(returnStmt, statement)
            return returnStmt
          }
        }
        return statement
      })

      const asyncBody = ts.factory.createBlock(
        processedBody as ts.Statement[],
        true,
      )
      if (body.length > 0) {
        ts.setTextRange(asyncBody, {
          pos: body[0].pos,
          end: body[body.length - 1].end,
        })
      }

      const asyncArrowFunction = ts.factory.createArrowFunction(
        [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        undefined,
        asyncBody,
      )

      const iife = ts.factory.createCallExpression(
        ts.factory.createParenthesizedExpression(asyncArrowFunction),
        undefined,
        [],
      )

      const resultVariable = ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              resultVariableName,
              undefined,
              undefined,
              iife,
            ),
          ],
          ts.NodeFlags.Const,
        ),
      )

      const resultExpression = ts.factory.createExpressionStatement(
        ts.factory.createIdentifier(resultVariableName),
      )

      const newStatements = [...imports, resultVariable, resultExpression]

      return ts.factory.updateSourceFile(
        sourceFile,
        newStatements,
        sourceFile.isDeclarationFile,
        sourceFile.referencedFiles,
        sourceFile.typeReferenceDirectives,
        sourceFile.hasNoDefaultLib,
        sourceFile.libReferenceDirectives,
      )
    }
  }
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

export function transformTopLevelAwait(
  code: string,
  fileName = 'example.tsx',
): string {
  const resultVariableName = '__result__' + Math.random().toString(16).slice(2)
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  let hasTopLevelAwait = false
  function checkTopLevelAwait(node: ts.Node) {
    if (ts.isAwaitExpression(node) && isAtTopLevel(node)) {
      hasTopLevelAwait = true
    }
    ts.forEachChild(node, checkTopLevelAwait)
  }
  checkTopLevelAwait(sourceFile)

  if (!hasTopLevelAwait) {
    return code
  }

  const originalStatements = sourceFile.statements.slice()
  const nonImportStatements = originalStatements.filter(
    (s) => !ts.isImportDeclaration(s) && !ts.isImportEqualsDeclaration(s),
  )

  const transformer = createTopLevelAwaitTransformer(resultVariableName)
  const result = ts.transform(sourceFile, [transformer])
  const transformedSourceFile = result.transformed[0]

  const generator = new SourceMapGenerator({
    file: fileName,
  })

  generator.setSourceContent(fileName, code)

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  })

  const output = printer.printFile(transformedSourceFile)

  const outputLines = output.split('\n')

  let asyncBodyStartLine = -1
  for (let i = 0; i < outputLines.length; i++) {
    if (
      outputLines[i].includes(`const ${resultVariableName} = (async () => {`)
    ) {
      break
    }
  }

  if (asyncBodyStartLine !== -1 && nonImportStatements.length > 0) {
    nonImportStatements.forEach((stmt, index) => {
      const originalStart = ts.getLineAndCharacterOfPosition(
        sourceFile,
        stmt.getStart(sourceFile),
      )
      const originalEnd = ts.getLineAndCharacterOfPosition(
        sourceFile,
        stmt.getEnd(),
      )

      const generatedLine = asyncBodyStartLine + originalStart.line

      generator.addMapping({
        generated: {
          line: generatedLine + 1,
          column: 4,
        },
        source: fileName,
        original: {
          line: originalStart.line + 1,
          column: originalStart.character,
        },
      })

      if (originalEnd.line > originalStart.line) {
        for (
          let line = originalStart.line + 1;
          line <= originalEnd.line;
          line++
        ) {
          const lineStart = ts.getLineAndCharacterOfPosition(
            sourceFile,
            sourceFile.getLineStarts()[line],
          )
          generator.addMapping({
            generated: {
              line: asyncBodyStartLine + line + 1,
              column: 4,
            },
            source: fileName,
            original: {
              line: line + 1,
              column: lineStart.character,
            },
          })
        }
      }
    })
  }

  result.dispose()

  const map = generator.toString()
  const base64Map =
    typeof btoa !== 'undefined'
      ? btoa(map)
      : Buffer.from(map).toString('base64')
  const dataUrl = `data:application/json;charset=utf-8;base64,${base64Map}`

  return output + '\n//# sourceMappingURL=' + dataUrl
}

export function transformTopLevelAwaitWithDetailedMapping(
  code: string,
  fileName = 'example.tsx',
  resultVariableName: string,
): string {
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  let hasTopLevelAwait = false
  function checkTopLevelAwait(node: ts.Node) {
    if (ts.isAwaitExpression(node) && isAtTopLevel(node)) {
      hasTopLevelAwait = true
    }
    ts.forEachChild(node, checkTopLevelAwait)
  }
  checkTopLevelAwait(sourceFile)

  if (!hasTopLevelAwait) {
    return code
  }

  const transformer = createTopLevelAwaitTransformer(resultVariableName)
  const result = ts.transform(sourceFile, [transformer])
  const transformedSourceFile = result.transformed[0]

  const generator = new SourceMapGenerator({
    file: fileName,
  })

  generator.setSourceContent(fileName, code)

  let outputCode = ''
  let currentOutputLine = 0
  let currentOutputColumn = 0

  const mappings: Array<{
    generated: { line: number; column: number }
    original: { line: number; column: number }
    name?: string
  }> = []

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  })

  outputCode = printer.printFile(transformedSourceFile)

  const lines = code.split('\n')
  const outputLines = outputCode.split('\n')

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('//')) {
      outputLines.forEach((outputLine, outputLineIndex) => {
        if (outputLine.includes(trimmedLine)) {
          generator.addMapping({
            generated: {
              line: outputLineIndex + 1,
              column: outputLine.indexOf(trimmedLine),
            },
            source: fileName,
            original: {
              line: lineIndex + 1,
              column: line.indexOf(trimmedLine),
            },
          })
        }
      })
    }
  })

  result.dispose()

  const map = generator.toString()
  const base64Map =
    typeof btoa !== 'undefined'
      ? btoa(map)
      : Buffer.from(map).toString('base64')
  const dataUrl = `data:application/json;charset=utf-8;base64,${base64Map}`

  return outputCode + '\n//# sourceMappingURL=' + dataUrl
}

if (isWebWorker()) {
  expose(transformTopLevelAwait)
}
