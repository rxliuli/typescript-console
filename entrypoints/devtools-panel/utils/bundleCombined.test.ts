import { expect, it, describe } from 'vitest'
import { bundle } from './bundle'

describe('bundle with combined transforms', () => {
  it('should remove exports and handle top-level await in a single pass', async () => {
    const input = `
export const message = 'hello'

export function greet(name: string) {
  return \`\${message}, \${name}!\`
}

const response = await fetch('https://api.example.com/data')
const data = await response.json()

export class MyClass {
  value = data.value
}

greet('world')
`
    
    const output = await bundle(input)
    
    // Should not contain any export statements
    expect(output).not.toContain('export const')
    expect(output).not.toContain('export function')
    expect(output).not.toContain('export class')
    
    // Should contain the declarations without export
    expect(output).toContain('const message')
    expect(output).toContain('function greet')
    expect(output).toContain('class MyClass')
    
    // Should wrap top-level await in an IIFE
    expect(output).toMatch(/var __result__\w+ = \(async \(\) => \{/)
    
    // Should be a valid IIFE format
    expect(output).toMatch(/^\(\(\) => \{/)
  })

  it('should only remove exports if no top-level await is present', async () => {
    const input = `
export const message = 'hello world'

export function sayHello() {
  console.log(message)
}

sayHello()
`
    
    const output = await bundle(input)
    
    // Should not contain exports
    expect(output).not.toContain('export const')
    expect(output).not.toContain('export function')
    
    // Should contain declarations without export (using var due to esbuild transformation)
    expect(output).toContain('var message')
    expect(output).toContain('function sayHello')
    
    // Should not create an async IIFE since there's no top-level await
    expect(output).not.toMatch(/var __result__\w+ = \(async \(\) => \{/)
  })
})