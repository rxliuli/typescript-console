import { onDestroy } from 'svelte'
import { derived } from 'svelte/store'

export function watch(deps: any, fn: any) {
  const unsubscribe = derived(deps, (values) => values).subscribe(fn)
  onDestroy(unsubscribe)
}
