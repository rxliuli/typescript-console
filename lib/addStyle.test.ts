import { describe, expect, it } from 'vitest'
import { addStyle } from './addStyle'

describe('addStyle', () => {
  it('should add a style to the shadow root', () => {
    const div = document.createElement('div')
    div.attachShadow({ mode: 'open' })
    document.body.appendChild(div)
    const root = div.shadowRoot!
    addStyle(root, ['.test { color: red; }'])
    const span = document.createElement('span')
    span.classList.add('test')
    root.appendChild(span)
    expect(getComputedStyle(root.querySelector('span')!).color).toBe(
      'rgb(255, 0, 0)',
    )
  })
})
