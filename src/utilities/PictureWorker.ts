import { extname, join } from 'path';
import { URL } from 'url';
import { Worker } from 'worker_threads';
import { app } from '..';
import { createLogger } from './Console';

type Options = {
  roundify?: boolean
};
const { debug } = createLogger('PictureWorker');

class PictureWorker {
  worker: Worker;

  callbacks = new Map<string, any>();

  constructor() {
    this.worker = new Worker(join(__dirname, 'worker.js'));
    this.worker.on('message', this.resolveImage.bind(this));
  }

  loadImage(url: string, options?: Options): Promise<string> {
    const { callbacks, worker } = this;
    if ((url || '').toString().trim() === '') {
      debug('An empty URL was requested.');
      return Promise.reject(new Error('URL was empty or null.'));
    }
    const opts = { roundify: app.config.roundifyAvatars, ...(options || {}) };

    const uri = new URL(url);
    if (uri.hostname === 'cdn.discordapp.com') {
      if (extname(uri.pathname).toLowerCase() !== '.png') opts.roundify = false;
    } else if (uri.protocol !== 'file:') opts.roundify = false;

    uri.searchParams.append('roundify', opts.roundify ? 'true' : 'false');
    const urlHref = uri.href;

    return new Promise((resolve, reject) => {
      const cb = callbacks.get(urlHref);
      if (cb !== undefined) {
        callbacks.set(urlHref, (b: any) => {
          cb(b);
          if (!b) reject(b);
          resolve(b);
        });
        return;
      }
      worker.postMessage({ url: urlHref });
      callbacks.set(urlHref, { resolve, reject });
    });
  }

  private resolveImage(result: any) {
    const { url, path } = result as { url: string, path: string };
    if (typeof url !== 'string') return;
    const { resolve, reject } = this.callbacks.get(url);
    if (!resolve || !reject) return;
    if (!path || !path.length) reject('Couldn\'t get path.');
    else {
      this.callbacks.delete(url);
      resolve(path);
    }
  }
}
export const pictureWorker = new PictureWorker();
