import { Plugin } from 'esbuild-wasm'

export function esm(options: { signal?: AbortSignal }): Plugin {
  return {
    name: 'esm',
    setup(build) {
      build.onResolve({ filter: /^[^./]/ }, async (args) => {
        if (args.path.startsWith('http')) {
          return { path: args.path, namespace: 'http-url' }
        }
        return {
          path: `https://esm.sh/${args.path}`,
          namespace: 'http-url',
        }
      })

      build.onResolve({ filter: /.*/, namespace: 'http-url' }, (args) => {
        return {
          path: new URL(args.path, args.importer).toString(),
          namespace: 'http-url',
        }
      })

      build.onLoad({ filter: /.*/, namespace: 'http-url' }, async (args) => {
        if (options.signal?.aborted) {
          throw new Error('Aborted')
        }
        const importPath = args.path.startsWith('/')
          ? 'https://esm.sh' + args.path
          : args.path
        try {
          const response = await fetch(importPath)
          const contents = await response.text()
          return { contents }
        } catch (error) {
          throw new Error(`Failed to fetch ${importPath}: ${error}`)
        }
      })
    },
  }
}
