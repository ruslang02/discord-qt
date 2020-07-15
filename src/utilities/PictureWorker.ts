import { Worker } from 'worker_threads';
import { app } from '..';
import path from 'path';

type Options = {
  roundify?: boolean,
  size?: number,
};

/*
 * This REALLY needs a cache system!
 */
class PictureWorker {
  worker: Worker;
  //id: number = 0;
  defaultOptions: Options = {};
  cache = new Map<string, Buffer>();

  callbacks = new Map<string, (buffer: Buffer | null) => void>();

  constructor() {
    this.worker = new Worker(path.join(__dirname, 'worker.js'));
    this.worker.on('message', this.resolveImage.bind(this));
    this.worker.on('online', () =>
      this.defaultOptions = {
        roundify: app.config.roundifyAvatars,
        size: 64,
      }
    )
  }

  loadImage(url: string, options?: Options): Promise<Buffer | null> {
    const { callbacks, defaultOptions, cache, worker } = this;
    if (url === null)
      return Promise.resolve(null);
    options = { ...defaultOptions, ...(options || {}) };
    const cached = cache.get(`${path.basename(url)}.${options.size}.${options.roundify ? 1 : 0}`);
    if (cached !== undefined)
      return Promise.resolve(cached);
    return new Promise(resolve => {
      const cb = callbacks.get(url);
      if (cb !== undefined) {
        // this does not work :(
        callbacks.set(url, (b) => {
          cb(b);
          resolve(b);
        });
        return;
      }
      worker.postMessage({ url, options });
      callbacks.set(url, resolve);
    })
  }

  private resolveImage(result: any) {
    if (typeof result.url !== 'string')
      return;
    const callback = this.callbacks.get(result.url);
    if (!callback)
      return;
    if (!(result.buffer instanceof Uint8Array) ||
      result.buffer === null ||
      result.buffer.buffer === null)
      return callback(null);

    this.callbacks.delete(result.id);
    const buffer = Buffer.alloc(result.buffer.length);
    for (let i = 0; i < result.buffer.length; i++)
      buffer[i] = result.buffer[i];
    this.cache.set(`${path.basename(result.url)}.${result.options.size}.${result.options.roundify ? 1 : 0}`, buffer);
    return callback(buffer);
  }
}
export const pictureWorker = new PictureWorker();