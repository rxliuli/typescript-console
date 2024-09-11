import { em, Events } from '../store'

export function useEventBus<T extends keyof Events>(
  event: T,
  callback: Events[T],
) {
  onMount(() => {
    em.on(event, callback)
  })
  onDestroy(() => {
    em.off(event, callback)
  })
}
