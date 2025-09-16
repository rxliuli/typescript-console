let _container: HTMLElement | null = null

export function getShadowRoot() {
  if (!_container) {
    throw new Error('Shadow root not found')
  }
  return _container
}

export function ShadowProvider(props: {
  children: React.ReactNode
  container: HTMLElement
}) {
  _container = props.container
  return props.children
}
