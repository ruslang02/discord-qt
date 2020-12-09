/* eslint-disable no-console */
import { app } from '..';

export function createLogger(prefix: string) {
  return {
    debug: (...args: any[]) => {
      if (app.config.get('debug')) {
        console.log(`[${prefix}]`, ...args);
      }
    },
    error: console.error.bind(console, '[error]', `[${prefix}]`),
    log: console.log.bind(console, `[${prefix}]`),
    trace: console.trace.bind(console, `[${prefix}]`),
    warn: console.warn.bind(console, '[warn]', `[${prefix}]`),
  };
}
