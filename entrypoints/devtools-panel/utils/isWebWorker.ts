export function isWebWorker() {
  return (
    typeof self === 'object' &&
    typeof (self as any).WorkerGlobalScope === 'function' &&
    self instanceof (self as any).WorkerGlobalScope
  )
}