'use client';

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, SetValue<T>, boolean, Error | null] {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      setError(error as Error);
      return initialValue;
    }
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        setError(null);
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
        setError(error as Error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isLoading, error];
}