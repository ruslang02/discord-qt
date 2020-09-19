import { extname, join } from 'path';
import { URL } from 'url';
import { Worker } from 'worker_threads';
import { app } from '..';

type Options = {
  roundify?: boolean
};

class PictureWorker {
  worker: Worker;

  callbacks = new Map<string, any>();

  constructor() {
    this.worker = new Worker(join(__dirname, 'worker.js'));
    this.worker.on('message', this.resolveImage.bind(this));
  }

  loadImage(url?: string | null, options?: Options): Promise<string | null> {
    const { callbacks, worker } = this;
    if (!url || (url || '').toString().trim() === '') return Promise.resolve(null);

    const opts = { roundify: app.config.roundifyAvatars, ...(options || {}) };

    const uri = new URL(url);
    if (uri.hostname === 'cdn.discordapp.com') {
      if (extname(uri.pathname).toLowerCase() !== '.png') opts.roundify = false;
    } else if (uri.protocol !== 'file:') opts.roundify = false;

    uri.searchParams.append('roundify', opts.roundify ? 'true' : 'false');
    const urlHref = uri.href;

    return new Promise((resolve) => {
      const cb = callbacks.get(urlHref);
      if (cb !== undefined) {
        callbacks.set(urlHref, (b: any) => {
          cb(b);
          resolve(b);
        });
        return;
      }
      worker.postMessage({ url: urlHref });
      callbacks.set(urlHref, resolve);
    });
  }

  private resolveImage(result: any) {
    const { url, path } = result as { url: string, path: string };
    if (typeof url !== 'string') return;
    const callback = this.callbacks.get(url);
    if (!callback) return;
    if (!path || !path.length) callback(null);
    else {
      this.callbacks.delete(url);
      callback(path);
    }
  }
}
export const pictureWorker = new PictureWorker();
