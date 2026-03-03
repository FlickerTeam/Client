import { useCallback, useRef } from 'react';

let worker: Worker | null = null;
const pending = new Map<string, (html: string) => void>();

interface ShikiWorkerResponse {
  id: string;
  html: string;
}

function isShikiWorkerResponse(value: unknown): value is ShikiWorkerResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return typeof data.id === 'string' && typeof data.html === 'string';
}

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../utils/shikiWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (!isShikiWorkerResponse(event.data)) {
        return;
      }

      const { id, html } = event.data;
      pending.get(id)?.(html);
      pending.delete(id);
    };
  }
  return worker;
}

export function useShiki() {
  const nextId = useRef(0);

  const highlight = useCallback(
    (text: string, language?: string, theme = 'flicker-shiki-dark'): Promise<string> => {
      return new Promise((resolve) => {
        const id = `shiki-${String(nextId.current)}`;
        nextId.current += 1;
        pending.set(id, resolve);
        getWorker().postMessage({ id, text, language, theme });
      });
    },
    [],
  );

  const dispose = useCallback(() => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    pending.clear();
  }, []);

  return { highlight, dispose };
}
