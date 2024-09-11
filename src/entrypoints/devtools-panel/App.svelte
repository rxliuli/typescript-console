<script lang="ts">
  import { Toaster } from '$lib/components/ui/sonner'
  import { ModeWatcher } from 'mode-watcher'
  import Toolbar from './Toolbar.svelte'
  import Editor from './Editor.svelte'
  import OpenSettings from './commands/OpenSettings.svelte'
  import OpenAbout from './commands/OpenAbout.svelte'
</script>

<div class="w-full h-screen flex flex-col">
  <Toolbar />
  <Editor />
  <Toaster richColors />
  <ModeWatcher />
  <OpenSettings />
  <OpenAbout />
</div>

<style>
</style>
