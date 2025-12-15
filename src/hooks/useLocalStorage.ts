import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`useLocalStorage: Failed to read ${key}`, error)
            return initialValue
        }
    })

    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            if (storedValue === null || storedValue === undefined) {
                window.localStorage.removeItem(key)
            } else {
                window.localStorage.setItem(key, JSON.stringify(storedValue))
            }
        } catch (error) {
            console.warn(`useLocalStorage: Failed to persist ${key}`, error)
        }
    }, [key, storedValue])

    return [storedValue, setStoredValue]
}

export function useLocalStorageString(key: string, initialValue: string | null): [string | null, (value: string | null) => void] {
    const [storedValue, setStoredValue] = useState<string | null>(() => {
        if (typeof window === 'undefined') return initialValue
        try {
            return window.localStorage.getItem(key) ?? initialValue
        } catch {
            return initialValue
        }
    })

    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            if (storedValue) {
                window.localStorage.setItem(key, storedValue)
            } else {
                window.localStorage.removeItem(key)
            }
        } catch (error) {
            console.warn(`useLocalStorage: Failed to persist ${key}`, error)
        }
    }, [key, storedValue])

    return [storedValue, setStoredValue]
}
