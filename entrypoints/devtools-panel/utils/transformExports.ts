import * as ts from 'typescript'

/**
 * Creates a transformer that removes all export statements and declarations,
 * converting them to regular statements since IIFE format doesn't support exports.
 */
export function createRemoveExportsTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    return (sourceFile) => {
      function visitor(node: ts.Node): ts.Node | ts.Node[] | undefined {
        // Handle export declarations (export { ... })
        if (ts.isExportDeclaration(node)) {
          // Remove the export declaration entirely
          return undefined
        }

        // Handle export assignments (export = something)
        if (ts.isExportAssignment(node)) {
          // Convert to expression statement
          return ts.factory.createExpressionStatement(node.expression)
        }

        // Handle export modifiers on declarations
        if (ts.canHaveModifiers(node)) {
          const modifiers = ts.getModifiers(node)
          if (
            modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
          ) {
            // Remove export modifier
            const newModifiers = modifiers.filter(
              (mod) => mod.kind !== ts.SyntaxKind.ExportKeyword,
            )

            // Handle different types of declarations
            if (ts.isFunctionDeclaration(node)) {
              return ts.factory.updateFunctionDeclaration(
                node,
                newModifiers,
                node.asteriskToken,
                node.name,
                node.typeParameters,
                node.parameters,
                node.type,
                node.body,
              )
            }

            if (ts.isClassDeclaration(node)) {
              return ts.factory.updateClassDeclaration(
                node,
                newModifiers,
                node.name,
                node.typeParameters,
                node.heritageClauses,
                node.members,
              )
            }

            if (ts.isVariableStatement(node)) {
              return ts.factory.updateVariableStatement(
                node,
                newModifiers,
                node.declarationList,
              )
            }

            if (ts.isInterfaceDeclaration(node)) {
              return ts.factory.updateInterfaceDeclaration(
                node,
                newModifiers,
                node.name,
                node.typeParameters,
                node.heritageClauses,
                node.members,
              )
            }

            if (ts.isTypeAliasDeclaration(node)) {
              return ts.factory.updateTypeAliasDeclaration(
                node,
                newModifiers,
                node.name,
                node.typeParameters,
                node.type,
              )
            }

            if (ts.isEnumDeclaration(node)) {
              return ts.factory.updateEnumDeclaration(
                node,
                newModifiers,
                node.name,
                node.members,
              )
            }

            if (ts.isModuleDeclaration(node)) {
              return ts.factory.updateModuleDeclaration(
                node,
                newModifiers,
                node.name,
                node.body,
              )
            }
          }
        }

        return ts.visitEachChild(node, visitor, context)
      }

      const statements = sourceFile.statements
        .map((stmt) => {
          const result = visitor(stmt)
          if (result === undefined) {
            return undefined
          }
          if (Array.isArray(result)) {
            return result
          }
          return result as ts.Statement
        })
        .filter((stmt): stmt is ts.Statement => stmt !== undefined)
        .flat()

      return ts.factory.updateSourceFile(
        sourceFile,
        statements,
        sourceFile.isDeclarationFile,
        sourceFile.referencedFiles,
        sourceFile.typeReferenceDirectives,
        sourceFile.hasNoDefaultLib,
        sourceFile.libReferenceDirectives,
      )
    }
  }
}
