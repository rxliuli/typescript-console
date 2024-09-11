<script lang="ts">
  import * as Menubar from '$lib/components/ui/menubar'
  import { em } from './store'
  import { PlayIcon } from 'lucide-svelte'
  import * as Tooltip from '$lib/components/ui/tooltip'
  import Button from '$lib/components/ui/button/button.svelte'
</script>

<Menubar.Root class="toolbar">
  <Menubar.Menu>
    <Menubar.Trigger>TypeScript Console</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item on:click={() => em.emit('openAbout')}>About</Menubar.Item>
      <Menubar.Item on:click={() => em.emit('openSettings')}
        >Settings</Menubar.Item
      >
    </Menubar.Content>
  </Menubar.Menu>
  <Menubar.Menu>
    <Menubar.Item on:click={() => em.emit('runScript')}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button size="icon" variant="ghost" builders={[builder]}>
            <PlayIcon class="w-4 h-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Run ⌘S</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Menubar.Item>
  </Menubar.Menu>
</Menubar.Root>
