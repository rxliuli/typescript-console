import { EventEmitter } from 'eventemitter3'

import { create } from 'zustand'
import { localStore } from './utils/localStoreReact'

export interface Events {
  runScript: () => void
  openSettings: () => void
  openAbout: () => void

  openFile: () => void
  saveFile: () => void

  changeFontSize: (fontSize: number) => void
  setExecuting: (isExecuting: boolean) => void
}

export const em = new EventEmitter<Events>()

// zustand store for execution state
export interface ExecutionStore {
  isExecuting: boolean
  controller: AbortController | null
  start: (c: AbortController) => void
  stop: () => void
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  isExecuting: false,
  controller: null,
  start: (ctrl) => set({ isExecuting: true, controller: ctrl }),
  stop: () => {
    const ctrl = get().controller
    if (ctrl) {
      ctrl.abort()
    }
    set({ isExecuting: false, controller: null })
  },
}))

export const settings = localStore('settings', {
  fontSize: 14,
})
