import { messager } from '@/lib/message'

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  browser.action.onClicked.addListener(async () => {
    await messager.sendMessage('show', undefined)
  })
})
