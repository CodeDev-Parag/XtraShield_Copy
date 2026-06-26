import { useState, useEffect } from 'react';

export function usePersistedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
  defaultValue: F
): F {
  const result = store(callback) as F;
  const [data, setData] = useState<F>(defaultValue);

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
}
