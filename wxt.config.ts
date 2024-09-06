import { defineConfig, UserManifest } from 'wxt'
import path from 'path'

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  runner: {
    disabled: true,
  },
  manifest: {
    name: 'TypeScript Console',
    description: 'Run and debug TypeScript code in the Chrome DevTools.',
  },
  vite: () => ({
    resolve: {
      alias: {
        $lib: path.resolve('./src/lib'),
      },
    },
  }),
})
