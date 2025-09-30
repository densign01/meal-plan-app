import { useState, useEffect } from 'react'

/**
 * Custom hook for syncing state with localStorage
 * Automatically persists state changes and restores on mount
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`useLocalStorage: Failed to read ${key} from localStorage`, error)
      return initialValue
    }
  })

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      if (storedValue === null || storedValue === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(storedValue))
      }
    } catch (error) {
      console.warn(`useLocalStorage: Failed to persist ${key} to localStorage`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

/**
 * Simplified version for string-only values (no JSON parsing)
 */
export function useLocalStorageString(key: string, initialValue: string | null): [string | null, (value: string | null) => void] {
  const [storedValue, setStoredValue] = useState<string | null>(() => {
    try {
      return localStorage.getItem(key) ?? initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      if (storedValue) {
        localStorage.setItem(key, storedValue)
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`useLocalStorage: Failed to persist ${key}`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
