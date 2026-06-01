import { describe, expect, it, beforeAll } from 'vitest'
import { inlineWorker } from './worker'
import esbuild from 'esbuild-wasm'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('inlineWorker plugin', () => {
  let tempDir: string

  beforeAll(async () => {
    await esbuild.initialize({})
  })

  const createTempFiles = async (
    files: Record<string, string>,
  ): Promise<string> => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'worker-test-'))
    for (const [name, content] of Object.entries(files)) {
      const filePath = path.join(tempDir, name)
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, content)
    }
    return tempDir
  }

  const cleanup = async () => {
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
  }

  it('should transform Worker with URL pattern', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
        worker.postMessage("hello");
      `,
      'worker.js': `
        self.onmessage = (e) => {
          console.log(e.data);
        };
      `,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      // Should contain Blob creation instead of URL pattern
      expect(output).toContain('URL.createObjectURL')
      expect(output).toContain('new Blob')
      // Should not contain the original URL pattern
      expect(output).not.toContain('import.meta.url')
    } finally {
      await cleanup()
    }
  })

  it('should handle file without Worker pattern', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        console.log("no worker here");
      `,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      expect(output).toContain('no worker here')
      expect(output).not.toContain('URL.createObjectURL')
    } finally {
      await cleanup()
    }
  })

  it('should skip if worker file does not exist', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        const worker = new Worker(new URL("./nonexistent.js", import.meta.url), { type: "module" });
      `,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      // Original pattern should remain since worker file doesn't exist
      expect(output).toContain('import.meta.url')
    } finally {
      await cleanup()
    }
  })

  it('should handle multiple workers in same file', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        const worker1 = new Worker(new URL("./worker1.js", import.meta.url), { type: "module" });
        const worker2 = new Worker(new URL("./worker2.js", import.meta.url), { type: "module" });
      `,
      'worker1.js': `self.postMessage("worker1");`,
      'worker2.js': `self.postMessage("worker2");`,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      // Should have two Blob creations
      const blobMatches = output.match(/new Blob/g)
      expect(blobMatches?.length).toBe(2)
      expect(output).not.toContain('import.meta.url')
    } finally {
      await cleanup()
    }
  })

  it('should escape special characters in worker code', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
      `,
      'worker.js': `
        const template = \`hello \${world}\`;
        const backslash = "\\\\";
        const backtick = "\`";
      `,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      expect(output).toContain('URL.createObjectURL')
      // Build should succeed without syntax errors
      expect(output).toContain('new Blob')
    } finally {
      await cleanup()
    }
  })

  it('should handle Worker without options', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        const worker = new Worker(new URL("./worker.js", import.meta.url));
      `,
      'worker.js': `self.postMessage("test");`,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      expect(output).toContain('URL.createObjectURL')
      expect(output).not.toContain('import.meta.url')
    } finally {
      await cleanup()
    }
  })

  it('should handle .ts worker files', async () => {
    const dir = await createTempFiles({
      'main.ts': `
        const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
      `,
      'worker.ts': `
        const message: string = "hello from ts";
        self.postMessage(message);
      `,
    })

    try {
      const result = await esbuild.build({
        entryPoints: [path.join(dir, 'main.ts')],
        bundle: true,
        write: false,
        format: 'esm',
        plugins: [inlineWorker()],
      })

      const output = result.outputFiles[0].text
      expect(output).toContain('URL.createObjectURL')
      expect(output).not.toContain('import.meta.url')
    } finally {
      await cleanup()
    }
  })
})
