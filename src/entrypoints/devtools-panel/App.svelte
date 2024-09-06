<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import initSwc, { transform } from '@swc/wasm-web'
  import wasmUrl from '@swc/wasm-web/wasm_bg.wasm?url'

  let editor: Monaco.editor.IStandaloneCodeEditor
  let monaco: typeof Monaco
  let editorContainer: HTMLElement

  const fConsole = new Proxy({} as typeof console, {
    get(_target, prop: keyof typeof console) {
      return (...args: any[]) => {
        browser.devtools.inspectedWindow.eval(
          `console.${prop}(...${JSON.stringify(args)})`,
        )
      }
    },
  })

  async function compileCode(code: string) {
    await initSwc(wasmUrl)
    const result = await transform(code, {
      jsc: {
        parser: {
          syntax: 'typescript',
        },
      },
      sourceMaps: 'inline',
    })
    return result.code
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      const code = editor.getValue()
      let buildCode: string
      try {
        buildCode = await compileCode(code)
      } catch (e) {
        fConsole.error(e)
        return
      }
      await injectAndExecuteCode(buildCode)
    }
  }

  async function injectAndExecuteCode(code: string) {
    // 使用 Chrome DevTools 协议注入并执行代码
    await browser.devtools.inspectedWindow.eval(code)
  }

  function detectTheme(): 'vs' | 'vs-dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'vs-dark'
      : 'vs'
  }

  function updateEditorTheme() {
    const theme = detectTheme()
    monaco.editor.setTheme(theme)
  }

  onMount(async () => {
    monaco = (await import('./monaco')).default

    const initialTheme = detectTheme()
    editor = monaco.editor.create(editorContainer, {
      value: "console.log('Hello from Monaco! (the editor, not the city...)')",
      language: 'typescript',
      theme: initialTheme,
    })

    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown)

    // 添加主题变化监听器
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', updateEditorTheme)
  })

  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose())
    editor?.dispose()
    // 移除键盘事件监听器
    window.removeEventListener('keydown', handleKeyDown)

    // 移除主题变化监听器
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .removeEventListener('change', updateEditorTheme)
  })
</script>

<div class="w-full h-screen">
  <div class="w-full h-full" bind:this={editorContainer} />
</div>

<style>
</style>
