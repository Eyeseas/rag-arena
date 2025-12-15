export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    const value = localStorage.getItem(key)
    if (!value) return defaultValue ?? null
    try {
      return JSON.parse(value)
    } catch {
      return value as T
    }
  },

  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },

  clear(): void {
    localStorage.clear()
  },
}
