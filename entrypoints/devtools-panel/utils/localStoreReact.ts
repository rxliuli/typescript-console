import { useState, useEffect } from 'react'

export interface Store<T> {
  get(): T
  set(value: T): void
  subscribe(callback: (value: T) => void): () => void
}

class LocalStore<T> implements Store<T> {
  private key: string
  private initialValue: T
  private listeners: ((value: T) => void)[] = []
  private currentValue: T

  constructor(key: string, initialValue: T) {
    this.key = key
    this.initialValue = initialValue

    // Initialize from localStorage or use initial value
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      try {
        this.currentValue = JSON.parse(stored)
      } catch {
        this.currentValue = initialValue
        this.saveToLocalStorage(initialValue)
      }
    } else {
      this.currentValue = initialValue
      this.saveToLocalStorage(initialValue)
    }
  }

  private saveToLocalStorage(value: T) {
    localStorage.setItem(this.key, JSON.stringify(value, null, 2))
  }

  get(): T {
    return this.currentValue
  }

  set(value: T): void {
    this.currentValue = value
    this.saveToLocalStorage(value)
    this.listeners.forEach(listener => listener(value))
  }

  subscribe(callback: (value: T) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

export function localStore<T>(key: string, initial: T): Store<T> {
  return new LocalStore(key, initial)
}

// React hook to use a store
export function useStore<T>(store: Store<T>): [T, (value: T) => void] {
  const [value, setValue] = useState(store.get())

  useEffect(() => {
    const unsubscribe = store.subscribe(setValue)
    return unsubscribe
  }, [store])

  return [value, store.set.bind(store)]
}