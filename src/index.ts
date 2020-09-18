import i18n from 'i18n';
import { join } from 'path';
import envPaths from 'env-paths';
import { Patches } from './patches';

export const paths = envPaths('discord', { suffix: 'qt' });
console.log(`[dqt] Applied ${Patches.length} patches.`);

import { Application } from './Application';

i18n.configure({
  directory: join(__dirname, 'locales'),
  locales: ['en-US', 'ru-RU'],
  defaultLocale: "en-US",

  logDebugFn: function () { },
  logWarnFn: function () { },
  logErrorFn: function (msg) {
    console.log('error', msg)
  },
  // @ts-ignore
  missingKeyFn: function (locale, value) {
    console.error(`Translation missing for word "${value}" in locale "${locale}".`);
    return value;
  },
});

export const app = new Application();
export const MAX_QSIZE = 16777215;
export const PIXMAP_EXTS = ["BMP", "GIF", "JPG", "JPEG", "PNG", "PBM", "PGM", "PPM", "XBM", "XPM", "SVG"];
app.start();