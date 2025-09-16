import type { Plugin } from 'esbuild-wasm'

/**
 * esbuild 的浏览器文件系统插件
 * copy: https://github.com/hyrious/esbuild-repl/blob/main/src/helpers/fs.ts
 * @param modules
 */
export function esbuildPluginFs(files: Record<string, string>): Plugin {
  return {
    name: 'esbuild-plugin-fs',
    setup({ onResolve, onLoad }) {
      onResolve({ filter: /()/ }, (args) => {
        const name = args.path.replace(/^\.\//, '')
        const code = files[name]
        if (code) {
          return { path: name, namespace: 'fs', pluginData: code }
        }
      })
      // noinspection ES6ShorthandObjectProperty
      onLoad({ filter: /()/, namespace: 'fs' }, (args) => {
        const mod: string = args.pluginData
        if (mod) {
          return { contents: mod, loader: 'default' }
        }
        return
      })
    },
  }
}
