import { setupTypeAcquisition } from '@typescript/ata'
import * as ts from 'typescript'
import { expose } from 'comlink'
import { isWebWorker } from './utils/isWebWorker'

let ta: ReturnType<typeof setupTypeAcquisition>

function initTypeAcquisition(
  addLibraryToRuntime: (code: string, path: string) => void,
) {
  ta = setupTypeAcquisition({
    projectName: 'TypeScript Playground',
    typescript: ts,
    logger: console,
    delegate: {
      receivedFile: (code: string, path: string) => {
        addLibraryToRuntime(code, path)
        // console.log('Received file', code, path)
      },
      progress: (dl: number, ttl: number) => {
        // console.log({ dl, ttl })
      },
      started: () => {
        console.log('ATA start')
      },
      finished: (f) => {
        console.log('ATA done')
      },
    },
  })
}

export const typeAcquisition = {
  init: initTypeAcquisition,
  dl: (code: string) => {
    if (!ta) {
      throw new Error('TypeAcquisition not initialized')
    }
    return ta(code)
  },
}

if (isWebWorker()) {
  expose(typeAcquisition)
}
