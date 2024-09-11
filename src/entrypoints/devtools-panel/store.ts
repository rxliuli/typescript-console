import { EventEmitter } from 'eventemitter3'
import { localStore } from './utils/localStore'

export interface Events {
  runScript: () => void
  openSettings: () => void
  openAbout: () => void

  changeFontSize: (fontSize: number) => void
}

export const em = new EventEmitter<Events>()

export const settings = localStore('settings', {
  fontSize: 14,
})
