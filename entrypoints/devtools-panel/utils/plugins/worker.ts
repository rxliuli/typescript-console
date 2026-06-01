import { Plugin } from 'esbuild-wasm'
import fs from 'fs'
import path from 'path'
import esbuild from 'esbuild-wasm'

/**
 * esbuild plugin to inline Worker files
 * Transforms: new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
 * Into: new Worker(URL.createObjectURL(new Blob([WORKER_CODE], { type: "text/javascript" })))
 */
export function inlineWorker(): Plugin {
  return {
    name: 'inline-worker',
    setup(build) {
      // Match JS/TS files
      build.onLoad({ filter: /\.(js|ts|mjs|cjs)$/ }, async (args) => {
        const source = await fs.promises.readFile(args.path, 'utf8')

        // Pattern to match: new Worker(new URL("./path", import.meta.url), options)
        const workerPattern =
          /new\s+Worker\s*\(\s*new\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)\s*(?:,\s*\{[^}]*\})?\s*\)/g

        let match
        let modified = source
        const workerUrls: string[] = []

        while ((match = workerPattern.exec(source)) !== null) {
          workerUrls.push(match[1])
        }

        if (workerUrls.length === 0) {
          return null // No workers found, let esbuild handle normally
        }

        // Process each worker URL
        for (const workerUrl of workerUrls) {
          const workerPath = path.resolve(path.dirname(args.path), workerUrl)

          if (!fs.existsSync(workerPath)) {
            continue // Worker file not found, skip
          }

          // Build the worker file separately
          const result = await esbuild.build({
            entryPoints: [workerPath],
            bundle: true,
            write: false,
            format: 'esm',
            platform: 'browser',
            minify: true,
            target: 'es2020',
          })

          const workerCode = result.outputFiles[0].text
          // Escape backticks and ${} in worker code for template literal
          const escapedCode = workerCode
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${')

          // Replace the Worker constructor with inline blob
          const workerPatternSpecific = new RegExp(
            `new\\s+Worker\\s*\\(\\s*new\\s+URL\\s*\\(\\s*["']${workerUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\s*,\\s*import\\.meta\\.url\\s*\\)\\s*(?:,\\s*\\{[^}]*\\})?\\s*\\)`,
            'g',
          )

          modified = modified.replace(
            workerPatternSpecific,
            `new Worker(URL.createObjectURL(new Blob([\`${escapedCode}\`], { type: "text/javascript" })))`,
          )
        }

        if (modified !== source) {
          return {
            contents: modified,
            loader: args.path.endsWith('.ts') ? 'ts' : 'js',
          }
        }

        return null
      })
    },
  }
}
