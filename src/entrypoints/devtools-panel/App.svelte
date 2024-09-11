<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import { transform, initialize } from 'esbuild-wasm'
  import wasmUrl from 'esbuild-wasm/esbuild.wasm?url'
  import { Toaster } from '$lib/components/ui/sonner'
  import { toast } from 'svelte-sonner'
  import { serializeError } from 'serialize-error'
  import type { transformImports } from './utils/transformImports'
  import TransformImportsWorker from './utils/transformImports?worker'
  import type { typeAcquisition } from './initTypeAcquisition'
  import TypeAcquisitionWorker from './initTypeAcquisition?worker'
  import { wrap, proxy } from 'comlink'

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
      '// Cmd/Ctrl+S to execute\n' +
        "console.log('Hello from Monaco!')\n" +
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
      const worker = new TransformImportsWorker()
      const f = wrap<typeof transformImports>(worker)
      code = await f(code)
    }
    const result = await transform(code, {
      loader: 'ts',
      sourcemap: 'inline',
      format: 'iife',
    })
    return result.code
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      const code = editor.getValue()
      try {
        const buildCode = await compileCode(code)
        console.log('buildCode', buildCode)
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

  function handleResize() {
    editor.layout()
  }

  onMount(async () => {
    const monaco = (await import('./monaco')).monaco
    const defaults = monaco.languages.typescript.typescriptDefaults
    defaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      strict: true,
      esModuleInterop: true,
    })

    const initialTheme = detectTheme()
    editor = monaco.editor.create(editorContainer, {
      language: 'typescript',
      theme: initialTheme,
    })
    const model = monaco.editor.createModel(
      loadEditorContent(),
      'typescript',
      monaco.Uri.file('example.ts'),
    )
    editor.setModel(model)

    const worker = new TypeAcquisitionWorker()
    const ta = wrap<typeof typeAcquisition>(worker)
    await ta.init(proxy(addLibraryToRuntime))

    // 添加内容变化监听器
    editor.onDidChangeModelContent(async () => {
      saveEditorContent()
      // 判断是否有错误
      const value = editor.getValue()
      await ta.dl(value)
    })
    // editor 初始化完成后，执行一次 ta
    ta.dl(editor.getValue())

    function addLibraryToRuntime(code: string, _path: string) {
      const path = 'file://' + _path
      defaults.addExtraLib(code, path)
      console.log(`[ATA] Adding ${path} to runtime`, { code })
    }
    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown)

    // 添加主题变化监听器
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', updateEditorTheme)

    // 添加窗口尺寸变化监听器
    window.addEventListener('resize', handleResize)
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

    window.removeEventListener('resize', handleResize)

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
