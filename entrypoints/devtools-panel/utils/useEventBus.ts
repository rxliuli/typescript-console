import { useEffect } from 'react'
import { em, Events } from '../store'

export function useEventBus<T extends keyof Events>(
  event: T,
  callback: Events[T],
) {
  useEffect(() => {
    em.on(event, callback as any)
    return () => {
      em.off(event, callback as any)
    }
  }, [event, callback])
}
