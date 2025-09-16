import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react(), tsconfigPaths()] as any,
        test: {
          exclude: ['**/*.unit.test.ts', 'node_modules/**'],
          browser: {
            enabled: true,
            provider: 'playwright',
            // https://vitest.dev/guide/browser/playwright
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
      },
      {
        plugins: [tsconfigPaths()] as any,
        test: {
          include: ['**/*.unit.test.ts'],
          exclude: ['*.test.ts', 'node_modules/**'],
        },
      },
    ],
  },
})
