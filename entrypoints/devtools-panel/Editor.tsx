import { useEffect, useRef, useState } from 'react'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { initialize } from 'esbuild-wasm'
import wasmUrl from 'esbuild-wasm/esbuild.wasm?url'
import { toast } from 'sonner'
import { serializeError } from 'serialize-error'
import type { typeAcquisition } from './utils/initTypeAcquisition'
import TypeAcquisitionWorker from './utils/initTypeAcquisition?worker'
import FormatCodeWorker from './utils/formatCode?worker'
import type { formatCode } from './utils/formatCode'
import { wrap, proxy } from 'comlink'
import { useExecutionStore } from './store'
import { useEventBus } from './utils/useEventBus'
import { useTheme } from 'next-themes'
import { useMount } from 'react-use'
import { bundle } from './utils/bundle'

const STORAGE_KEY = 'devtools-editor-content'

function saveEditorContent(editor: Monaco.editor.IStandaloneCodeEditor | null) {
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

export function Editor() {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  const [isInit, setIsInit] = useState(false)
  const { resolvedTheme } = useTheme()

  const executionStore = useExecutionStore()

  const compileCode = async (code: string, controller: AbortController) => {
    if (!isInit) {
      try {
        await initialize({
          wasmURL: wasmUrl,
        })
      } catch (error) {
        if (
          serializeError(error as Error).message !==
          'Cannot call "initialize" more than once'
        ) {
          throw error
        }
      }
      setIsInit(true)
    }
    return await bundle(code, {
      signal: controller.signal,
    })
  }

  const injectAndExecuteCode = async (code: string) => {
    // 使用 Chrome DevTools 协议注入并执行代码
    return new Promise<void>((resolve, reject) => {
      browser.devtools.inspectedWindow.eval(
        code,
        (result: any, isException: any) => {
          if (isException) {
            reject(new Error(isException.value || 'Evaluation failed'))
          } else {
            resolve()
          }
        },
      )
    })
  }

  const execute = async () => {
    if (executionStore.isExecuting) {
      executionStore.stop()
      toast.info('Execution cancelled')
      return
    }

    const controller = new AbortController()
    executionStore.start(controller)
    try {
      await editorRef.current?.getAction('editor.action.formatDocument')?.run()
      const buildCode = await compileCode(
        editorRef.current?.getValue() || '',
        controller,
      )
      console.log('buildCode', buildCode)
      await injectAndExecuteCode(buildCode)
      toast.success('Code executed successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Abort')) {
        toast.info('Execution aborted')
      } else {
        console.error('Error:', error)
        toast.error('Compilation Error', {
          description: serializeError(error as Error).message,
          duration: 10000,
        })
      }
    } finally {
      executionStore.stop()
    }
  }

  function updateEditorTheme(theme?: string) {
    const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs'
    console.log('updateEditorTheme', editorTheme, editorRef.current)
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: editorTheme,
      })
    }
  }

  // Initialize Monaco Editor
  useMount(() => {
    let mounted = true

    const initializeEditor = async () => {
      if (!editorContainerRef.current) return

      const monaco = (await import('./monaco')).monaco
      if (!mounted) return

      monacoRef.current = monaco
      const defaults = monaco.languages.typescript.typescriptDefaults
      defaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        jsx: monaco.languages.typescript.JsxEmit.Preserve,
        noEmit: true,
        strict: true,
        esModuleInterop: true,
      })
      defaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [1375] })
      monaco.languages.registerDocumentFormattingEditProvider('typescript', {
        provideDocumentFormattingEdits: async (model, _options, token) => {
          const worker = new FormatCodeWorker()
          const f = wrap<typeof formatCode>(worker)
          const formattedCode = await f(model.getValue(), 0)
          return [
            {
              text: formattedCode.formatted,
              range: model.getFullModelRange(),
            },
          ]
        },
      })

      const initialTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs'
      const editor = monaco.editor.create(editorContainerRef.current, {
        language: 'typescript',
        theme: initialTheme,
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
      })

      if (!mounted) {
        editor.dispose()
        return
      }

      editorRef.current = editor
      const model = monaco.editor.createModel(
        loadEditorContent(),
        'typescript',
        monaco.Uri.file('example.tsx'),
      )
      editor.setModel(model)

      const worker = new TypeAcquisitionWorker()
      const ta = wrap<typeof typeAcquisition>(worker)
      await ta.init(proxy(addLibraryToRuntime))

      // 添加内容变化监听器
      editor.onDidChangeModelContent(async () => {
        saveEditorContent(editor)
        // 判断是否有错误
        const value = editor.getValue()
        await ta.dl(value)
      })

      // 添加编辑器特定的键盘事件监听器
      editor.onKeyDown(handleKeyDown)

      // editor 初始化完成后，执行一次 ta
      ta.dl(editor.getValue())

      function addLibraryToRuntime(code: string, _path: string) {
        const path = 'file://' + _path
        defaults.addExtraLib(code, path)
        console.log(`[ATA] Adding ${path} to runtime`, { code })
      }
    }

    initializeEditor()

    return () => {
      mounted = false
      if (monacoRef.current) {
        monacoRef.current.editor.getModels().forEach((model) => model.dispose())
      }
      if (editorRef.current) {
        saveEditorContent(editorRef.current)
        editorRef.current.dispose()
        editorRef.current = null
      }
    }
  })

  // Theme change effect
  useEffect(() => {
    updateEditorTheme(resolvedTheme)
  }, [resolvedTheme])

  // Event listeners - setup once on mount
  const handleResize = () => {
    editorRef.current?.layout()
  }
  function handleKeyDown(event: KeyboardEvent | Monaco.IKeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
      event.preventDefault()
      event.stopPropagation()
      execute()
    }
  }
  useMount(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  // Event bus listeners
  useEventBus('runScript', execute)
  useEventBus('changeFontSize', (fontSize) => {
    editorRef.current?.updateOptions({ fontSize })
  })

  return <div className="w-full h-full flex-1" ref={editorContainerRef} />
}
