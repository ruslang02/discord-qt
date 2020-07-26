import { Worker } from 'worker_threads';
import { app } from '..';
import path from 'path';
import { createLogger } from './Console';

type Options = {
  roundify?: boolean,
  size?: number,
  format?: string
};

const logger = createLogger('[PW]');

/*
 * This REALLY needs a cache system! (i mean the hdd one)
 */
class PictureWorker {
  worker: Worker;
  defaultOptions: Options = {
    size: 64,
    format: 'png',
  };
  cache = new Map<string, Buffer>();

  callbacks = new Map<string, (buffer: Buffer | null) => void>();

  constructor() {
    this.worker = new Worker(path.join(__dirname, 'worker.js'));
    this.worker.on('message', this.resolveImage.bind(this));
    logger.log(this);
  }

  loadImage(url: string, options?: Options): Promise<Buffer | null> {
    const { callbacks, defaultOptions, cache, worker } = this;
    if (!url || (url || '').toString().trim() === '') return Promise.resolve(null);

    options = { ...defaultOptions, roundify: app.config.roundifyAvatars, ...(options || {}) };

    const uri = new URL(url);
    if(uri.hostname === 'cdn.discordapp.com') {
      uri.search = '';
      uri.pathname = uri.pathname.replace(/(\.jpg)|(\.webp)|(\.gif)/g, '.' + options.format);
      uri.searchParams.set('size', (options.size || 64).toString());
      if(options.format !== 'png') options.roundify = false;
    } else if(uri.protocol !== 'file:') options.roundify = false;
    url = uri.href;

    logger.debug('Loading image', url, options);

    const entry = `${url}.${options.size}.${options.roundify ? 1 : 0}.${options.format}`;
    const cached = cache.get(entry);
    if (cached !== undefined) {
      logger.debug('Found', entry, 'in cache.');
      return Promise.resolve(cached);
    }
    logger.debug('Could not find', entry, 'in cache.');

    return new Promise(resolve => {
      const cb = callbacks.get(url);
      if (cb !== undefined) {
        logger.debug('Found existing callback for', url, 'binding...');
        callbacks.set(url, (b) => {
          cb(b);
          resolve(b);
        });
        return;
      }
      logger.debug('Sending', url, 'to the worker...');
      worker.postMessage({ url, options });
      callbacks.set(url, resolve);
    })
  }

  private resolveImage(result: any) {
    const { id, url, options } = result;
    if (typeof url !== 'string')
      return;
    const callback = this.callbacks.get(url);
    if (!callback) {
      logger.debug('Could not find callback for', url);
      return;
    }
    if (!(result.buffer instanceof Uint8Array) ||
      result.buffer === null ||
      result.buffer.buffer === null) {
      logger.debug('Buffer was empty for', url);
      return callback(null);
    }

    logger.debug('Resolving', url);
    this.callbacks.delete(url);
    const buffer = Buffer.alloc(result.buffer.length);
    for (let i = 0; i < result.buffer.length; i++)
      buffer[i] = result.buffer[i];
    this.cache.set(`${url}.${options.size}.${options.roundify ? 1 : 0}.${options.format}`, buffer);
    return callback(buffer);
  }
}
export const pictureWorker = new PictureWorker();