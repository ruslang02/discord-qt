/* eslint-disable no-console */
import './patches';
import 'opusscript';
import i18n from 'i18n';
import { join } from 'path';
import { Application } from './Application';

i18n.configure({
  directory: join(__dirname, 'locales'),
  locales: ['de-DE', 'en-US', 'ru-RU'],
  defaultLocale: 'en-US',

  logDebugFn() {},
  logWarnFn() {},
  logErrorFn(msg) {
    console.log('[i18n]', msg);
  },
  // @ts-ignore
  missingKeyFn(locale, value) {
    console.error('[i18n]', `Translation missing for word "${value}" in locale "${locale}".`);
    return value;
  },
});
export const app = new Application();
export const MAX_QSIZE = 16777215;
export const PIXMAP_EXTS = [
  'BMP',
  'GIF',
  'JPG',
  'JPEG',
  'PNG',
  'PBM',
  'PGM',
  'PPM',
  'XBM',
  'XPM',
  'SVG',
];
app.start().catch(console.error);

process.on('unhandledRejection', console.error.bind(console, 'Promise rejected.'));
process.on('beforeExit', () => app.quit());
process.on('exit', () => app.quit());

// @ts-ignore
global.app = app;
