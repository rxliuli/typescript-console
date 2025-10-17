import { defineExtensionMessaging } from '@webext-core/messaging'

export const messager = defineExtensionMessaging<{
  executeCode: (code: string) => Promise<void>
}>()
