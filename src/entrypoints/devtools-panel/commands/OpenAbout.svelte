<script lang="ts">
  import { Button } from '$lib/components/ui/button/'
  import * as Dialog from '$lib/components/ui/dialog/'
  import { useEventBus } from '../utils/useEventBus'
  import { version } from '../../../../package.json'
  import copy from 'copy-to-clipboard'
  import { version as esbuildVersion } from 'esbuild-wasm/package.json'
  import { version as monacoVersion } from 'monaco-editor/package.json'
  import { version as typescriptVersion } from 'typescript/package.json'

  let open = false
  useEventBus('openAbout', () => {
    open = true
  })

  let aboutRef: HTMLDivElement | undefined
  async function onCopy() {
    const text = [...aboutRef!.children].map((it) => it.textContent).join('\n')
    console.log('aboutRef?.textContent', text)
    copy(text)
    open = false
  }
</script>

<Dialog.Root {open} onOpenChange={(v) => (open = v)}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>About</Dialog.Title>
    </Dialog.Header>
    <div bind:this={aboutRef}>
      <div>Version: {version}</div>
      <div>Copyright © 2024 rxliuli</div>
      <div>TypeScript: {typescriptVersion}</div>
      <div>Monaco-Editor: {monacoVersion}</div>
      <div>ESBuild: {esbuildVersion}</div>
    </div>
    <Dialog.Footer>
      <Button on:click={onCopy}>Copy</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
