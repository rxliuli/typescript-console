<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { em, settings } from '../store'
  import type { Events } from '../store'
  import * as Dialog from '$lib/components/ui/dialog/'
  import * as Select from '$lib/components/ui/select/'
  import { Label } from '$lib/components/ui/label/'

  let open = false

  function useEventBus<T extends keyof Events>(event: T, callback: Events[T]) {
    onMount(() => {
      em.on(event, callback as any)
    })
    onDestroy(() => {
      em.off(event, callback as any)
    })
  }

  useEventBus('openSettings', () => {
    open = true
  })

  const fontSizeOptions = [12, 14, 16, 18, 20]
</script>

<Dialog.Root {open} onOpenChange={(v) => (open = v)}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Settings</Dialog.Title>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="fontSize" class="text-right">Font Size</Label>
        <Select.Root
          selected={{
            value: $settings.fontSize,
            label: $settings.fontSize + 'px',
          }}
          onSelectedChange={(e) => {
            if (e?.value) {
              settings.set({
                ...settings,
                fontSize: e.value,
              })
              em.emit('changeFontSize', e.value)
            }
          }}
        >
          <Select.Trigger class="w-[180px]">
            <Select.Value placeholder="Font Size" />
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              {#each fontSizeOptions as fontSize}
                <Select.Item value={fontSize} label={fontSize + 'px'} />
              {/each}
            </Select.Group>
          </Select.Content>
          <Select.Input name="fontSize" />
        </Select.Root>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
