import { describe, expect, it } from 'vitest'
import { applyTransforms } from './bundle'

describe('applyTransforms', () => {
  it('should remove export keyword from function declarations', () => {
    const input = `
export function hello() {
  return 'world'
}

function normal() {
  return 'normal'
}
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export function')
    expect(output).toContain('function hello()')
    expect(output).toContain('function normal()')
  })

  it('should remove export keyword from variable declarations', () => {
    const input = `
export const message = 'hello'
export let count = 0
export var flag = true

const normal = 'normal'
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export const')
    expect(output).not.toContain('export let')
    expect(output).not.toContain('export var')
    expect(output).toContain('const message')
    expect(output).toContain('let count')
    expect(output).toContain('var flag')
    expect(output).toContain('const normal')
  })

  it('should remove export declarations', () => {
    const input = `
const value = 42
export { value }
export { value as aliasedValue }
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export {')
    expect(output).toContain('const value')
  })

  it('should convert export assignments to expression statements', () => {
    const input = `
const result = { foo: 'bar' }
export = result
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export =')
    expect(output).toContain('result;')
  })

  it('should remove export from class declarations', () => {
    const input = `
export class MyClass {
  constructor() {}
}

class NormalClass {
  constructor() {}
}
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export class')
    expect(output).toContain('class MyClass')
    expect(output).toContain('class NormalClass')
  })

  it('should remove export from interface declarations', () => {
    const input = `
export interface MyInterface {
  prop: string
}

interface NormalInterface {
  prop: number
}
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export interface')
    expect(output).toContain('interface MyInterface')
    expect(output).toContain('interface NormalInterface')
  })

  it('should remove export from type alias declarations', () => {
    const input = `
export type MyType = string | number

type NormalType = boolean
`

    const output = applyTransforms(input)
    expect(output).not.toContain('export type')
    expect(output).toContain('type MyType')
    expect(output).toContain('type NormalType')
  })
})
