import * as ts from 'typescript'

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
