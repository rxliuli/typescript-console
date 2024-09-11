import { Writable, writable } from 'svelte/store'

export function localStore<T>(key: string, initial: T): Writable<T> {
  // 接收本地存储的键和初始值
  const toString = (value: T) => JSON.stringify(value, null, 2) // 辅助函数
  const toObj = JSON.parse // 辅助函数

  if (localStorage.getItem(key) === null) {
    // 本地存储中不存在该项
    localStorage.setItem(key, toString(initial)) // 使用初始值初始化本地存储
  }

  const saved = toObj(localStorage.getItem(key)!) // 转换为对象

  const { subscribe, set, update } = writable(saved) // 创建底层的可写 store

  return {
    subscribe,
    set: (value) => {
      localStorage.setItem(key, toString(value)) // 也将其作为字符串保存到本地存储中
      return set(value)
    },
    update,
  }
}
