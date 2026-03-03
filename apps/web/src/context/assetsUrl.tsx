import { useCallback, useState } from 'react';
import * as z from 'zod';

const getInitialUrls = (): string[] => {
  const saved = localStorage.getItem('selectedAssetsUrl');
  try {
    const parsed: unknown = JSON.parse(saved ?? '');
    return Array.isArray(parsed)
      ? z.array(z.string()).min(1).parse(parsed)
      : ['https://cdn.oldcordapp.com'];
  } catch {
    return ['https://cdn.oldcordapp.com'];
  }
};

const urls = getInitialUrls();
let currentIndex = 0;

const listeners = new Set<() => void>();

export const useAssetsUrl = (path: string) => {
  const [, setTick] = useState(0);

  const nextAssetsCdn = useCallback(() => {
    currentIndex = (currentIndex + 1) % urls.length;
    listeners.forEach((l) => {
      l();
    });
  }, []);

  useCallback(() => {
    const handleChange = () => {
      setTick((t) => t + 1);
    };
    listeners.add(handleChange);
    return () => listeners.delete(handleChange);
  }, []);

  const baseUrl = urls[currentIndex];
  const normalizedBase = baseUrl?.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return {
    url: `${normalizedBase ?? 'https://cdn.oldcordapp.com'}${normalizedPath}`,
    rollover: nextAssetsCdn,
  };
};
