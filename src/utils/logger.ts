const getTimestamp = () => {
  return new Date().toLocaleTimeString([]);
};

const getEventTarget = (): EventTarget | null => {
  if (typeof window !== 'undefined') return window;
  if (typeof self !== 'undefined') return self;
  return null;
};

const dispatchLoggerUpdate = (entry: LogEntry): void => {
  const target = getEventTarget();
  if (!target || typeof CustomEvent === 'undefined') return;
  target.dispatchEvent(new CustomEvent('logger_update', { detail: entry }));
};

const styles = {
  timestamp: 'color: #888; font-style: italic;',
  logPrefix:
    'background: #5865F2; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
  warnPrefix:
    'background: #FEE75C; color: black; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
  errorPrefix:
    'background: #ED4245; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
  source: 'color: #B9BBBE; font-weight: bold;',
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

    console.groupCollapsed(
      `%c${timestamp}%c %c INFO %c %c[${source}]%c ${message}`,
      styles.timestamp,
      '',
      styles.logPrefix,
      '',
      styles.source,
      '',
    );
    if (data) console.log(data);
    console.groupEnd();
  },
  warn: (source: string, message: string, data?: unknown) => {
    const timestamp = getTimestamp();
    logger._pushEntry('WARN', source, message, data);

    console.group(
      `%c${timestamp}%c %c WARN %c %c[${source}]%c ${message}`,
      styles.timestamp,
      '',
      styles.warnPrefix,
      '',
      styles.source,
      '',
    );
    if (data) console.warn(data);
    console.groupEnd();
  },
  error: (source: string, message: string, error?: unknown) => {
    const timestamp = getTimestamp();
    logger._pushEntry('ERROR', source, message, error);

    const logArgs = [
      `%c${timestamp}%c %c ERROR %c %c[${source}]%c ${message}`,
      styles.timestamp,
      '',
      styles.errorPrefix,
      '',
      styles.source,
      '',
    ];

    if (error !== undefined) {
      logArgs.push(error as string);
    }

    console.error(...logArgs);
  },
};
