const getTimestamp = () => {
  return new Date().toLocaleTimeString([]);
};

interface LoggerEventTarget {
  dispatchEvent?: (event: unknown) => void;
}

const getEventTarget = (): LoggerEventTarget | null => {
  const target = globalThis as LoggerEventTarget;
  return typeof target.dispatchEvent === 'function' ? target : null;
};

const dispatchLoggerUpdate = (entry: LogEntry): void => {
  const target = getEventTarget();
  if (!target) return;

  const eventCtor = (
    globalThis as { CustomEvent?: new (name: string, init?: { detail: unknown }) => unknown }
  ).CustomEvent;
  if (!eventCtor) return;

  target.dispatchEvent?.(new eventCtor('logger_update', { detail: entry }));
};

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
  data?: unknown;
  formattedData?: string;
}

export const logger = {
  entries: [] as LogEntry[],
  _pushEntry: (level: LogEntry['level'], source: string, message: string, data?: unknown) => {
    let formattedData = '';

    if (data) {
      try {
        formattedData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      } catch {
        formattedData = '[Unserializable Data]';
      }
    }

    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level,
      source,
      message,
      data,
      formattedData,
    };

    logger.entries.push(entry);

    if (logger.entries.length > 100) {
      logger.entries.shift();
    }

    dispatchLoggerUpdate(entry);
  },
  info: (source: string, message: string, data?: unknown) => {
    const timestamp = getTimestamp();
    logger._pushEntry('INFO', source, message, data);

    console.log(`[${timestamp}] INFO [${source}] ${message}`, data ?? '');
  },
  warn: (source: string, message: string, data?: unknown) => {
    const timestamp = getTimestamp();
    logger._pushEntry('WARN', source, message, data);

    console.warn(`[${timestamp}] WARN [${source}] ${message}`, data ?? '');
  },
  error: (source: string, message: string, error?: unknown) => {
    const timestamp = getTimestamp();
    logger._pushEntry('ERROR', source, message, error);

    console.error(`[${timestamp}] ERROR [${source}] ${message}`, error ?? '');
  },
};
