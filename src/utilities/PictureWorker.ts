import { Worker } from 'worker_threads';
import { app } from '..';
import path, { extname } from 'path';
import { createLogger } from './Console';
import { URL } from 'url';

type Options = {
  roundify?: boolean
};

const logger = createLogger('[PW]');

class PictureWorker {
  worker: Worker;

  callbacks = new Map<string, (path: string | null) => void>();

  constructor() {
    this.worker = new Worker(path.join(__dirname, 'worker.js'));
    this.worker.on('message', this.resolveImage.bind(this));
  }

  loadImage(url?: string | null, options?: Options): Promise<string | null> {
    const { callbacks, worker } = this;
    if (!url || (url || '').toString().trim() === '') return Promise.resolve(null);

    options = { roundify: app.config.roundifyAvatars, ...(options || {}) };

    const uri = new URL(url);
    if (uri.hostname === 'cdn.discordapp.com') {
      if (extname(uri.pathname).toLowerCase() !== '.png') options.roundify = false;
    } else if (uri.protocol !== 'file:') options.roundify = false;

    uri.searchParams.append('roundify', options.roundify ? 'true' : 'false');
    url = uri.href;

    return new Promise(resolve => {
      if (!url) return;
      const cb = callbacks.get(url);
      if (cb !== undefined) {
        callbacks.set(url, (b) => {
          cb(b);
          resolve(b);
        });
        return;
      }
      worker.postMessage({ url });
      callbacks.set(url, resolve);
    })
  }

  private resolveImage(result: any) {
    const { url, path } = result as {url: string, path: string};
    if (typeof url !== 'string') return;
    const callback = this.callbacks.get(url);
    if (!callback) return;
    if (!path || !path.length) return callback(null);
    this.callbacks.delete(url);
    return callback(path);
  }
}
export const pictureWorker = new PictureWorker();