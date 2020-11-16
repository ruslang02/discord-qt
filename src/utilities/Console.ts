/* eslint-disable no-console */
import { app } from '..';

export function createLogger(prefix: string) {
  return {
    debug: (...args: any[]) => {
      if (app.config.debug) {
        console.log(`[${prefix}]`, ...args);
      }
    },
    log: console.log.bind(console, `[${prefix}]`),
    warn: console.log.bind(console, '[warn]', `[${prefix}]`),
    error: console.error.bind(console, '[error]', `[${prefix}]`),
  };
}
