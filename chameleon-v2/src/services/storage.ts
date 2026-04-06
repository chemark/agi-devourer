const memoryStore = new Map<string, string>()

function getStore() {
  const storage = globalThis.localStorage

  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return storage
  }

  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value)
    },
    removeItem: (key: string) => {
      memoryStore.delete(key)
    },
    clear: () => {
      memoryStore.clear()
    },
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = getStore().getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  getStore().setItem(key, JSON.stringify(value))
}

export function resetStorage() {
  const storage = getStore()

  if (typeof storage.clear === 'function') {
    storage.clear()
    return
  }

  memoryStore.clear()
}
