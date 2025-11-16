import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEventBus } from '../utils/useEventBus'
import copy from 'copy-to-clipboard'
import esbuildPkg from 'esbuild-wasm/package.json'
import monacoPkg from 'monaco-editor/package.json'
import typescriptPkg from 'typescript/package.json'
import { version } from '../../../package.json'

export function OpenAbout() {
  const [open, setOpen] = useState(false)

  useEventBus('openAbout', () => {
    setOpen(true)
  })

  const handleCopy = async () => {
    const text = [
      `Version: ${version}`,
      'Copyright © 2024 rxliuli',
      `TypeScript: ${typescriptPkg.version}`,
      `Monaco-Editor: ${monacoPkg.version}`,
      `ESBuild: ${esbuildPkg.version}`,
    ].join('\n')

    console.log('aboutRef?.textContent', text)
    copy(text)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
        </DialogHeader>
        <div>
          <div>Version: {version}</div>
          <div>Copyright © 2024 rxliuli</div>
          <div>TypeScript: {typescriptPkg.version}</div>
          <div>Monaco-Editor: {monacoPkg.version}</div>
          <div>ESBuild: {esbuildPkg.version}</div>
        </div>
        <DialogFooter>
          <Button onClick={handleCopy}>Copy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
