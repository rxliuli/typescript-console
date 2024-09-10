<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import { transform, initialize } from 'esbuild-wasm'
  import wasmUrl from 'esbuild-wasm/esbuild.wasm?url'
  import { Toaster } from '$lib/components/ui/sonner'
  import { toast } from 'svelte-sonner'
  import { serializeError } from 'serialize-error'
  import { transformImports } from './utils/transformImports'

  let editor: Monaco.editor.IStandaloneCodeEditor
  let monaco: typeof Monaco
  let editorContainer: HTMLElement

  const STORAGE_KEY = 'devtools-editor-content'

  function saveEditorContent() {
    if (editor) {
      const content = editor.getValue()
      localStorage.setItem(STORAGE_KEY, content)
    }
  }

  function loadEditorContent(): string {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      "console.log('Hello from Monaco!') // Cmd/Ctrl+S to execute\n" +
        '// Add breakpoint in the line above to debug\n' +
        '// debugger'
    )
  }

  let isInit = false

  async function compileCode(code: string) {
    if (!isInit) {
      try {
        await initialize({
          wasmURL: wasmUrl,
        })
      } catch (error) {
        if (
          serializeError(error).message !==
          'Cannot call "initialize" more than once'
        ) {
          throw error
        }
      }
      isInit = true
    }
    if (code.includes('import')) {
      code = transformImports(code)
    }
    const result = await transform(code, {
      loader: 'ts',
      sourcemap: 'inline',
    })
    return result.code
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      const code = editor.getValue()
      try {
        const buildCode = await compileCode(code)
        await injectAndExecuteCode(buildCode)
        toast.success('Code executed successfully')
      } catch (error) {
        console.error('Error:', error)
        toast.error('Compilation Error', {
          description: serializeError(error).message,
          duration: 10000, // 显示10秒
          style:
            'background: #FEF2F2; color: #991B1B; border: 1px solid #F87171;',
        })
      }
    }
  }

  async function injectAndExecuteCode(code: string) {
    // 使用 Chrome DevTools 协议注入并执行代码
    const [, isException] = await browser.devtools.inspectedWindow.eval(code)
    if (isException && isException.isException) {
      throw new Error(isException.value)
    }
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
    const monaco = (await import('./monaco')).monaco
    const typescriptDefaults = monaco.languages.typescript.typescriptDefaults
    typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      typeRoots: ['node_modules/@types'],
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      strict: true,
      esModuleInterop: true,
    })

    const initialTheme = detectTheme()
    editor = monaco.editor.create(editorContainer, {
      value: loadEditorContent(),
      language: 'typescript',
      theme: initialTheme,
    })

    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown)

    // 添加主题变化监听器
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', updateEditorTheme)

    // 添加内容变化监听器
    editor.onDidChangeModelContent(() => {
      saveEditorContent()
    })
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

    // 保存编辑器内容
    saveEditorContent()
  })
</script>

<div class="w-full h-screen">
  <div class="w-full h-full" bind:this={editorContainer} />
  <Toaster richColors />
</div>

<style>
</style>
