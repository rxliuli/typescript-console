import { injectAndExecuteCode } from '@/lib/ext/injectAndExecuteCode'
import { messager } from '@/lib/messager'

browser.devtools.panels.create(
  'TypeScript Console',
  'icon/128.png',
  'devtools-panel.html',
  () => {
    messager.onMessage('executeCode', (ev) => injectAndExecuteCode(ev.data))
  },
)
