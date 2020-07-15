import { Worker } from 'worker_threads';
import { app } from '..';
import path from 'path';

type Options = {
  roundify?: boolean,
  size?: number,
};

class PictureWorker {
  worker: Worker;
  id: number = 0;
  defaultOptions: Options = {};

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
    return new Promise(resolve => {
      const id = this.id;
      options = {...this.defaultOptions, ...(options || {}), roundify: true};
      setTimeout(() => {
        this.worker.postMessage({ url, options });
      }, id * 10);
      this.callbacks.set(url, resolve);
      this.id += 1;
    })
  }

  private resolveImage(result: any) {
    if (typeof result.url !== 'string')
      return;
    const callback = (this.callbacks.get(result.url) || (() => { }));
    if (!(result.buffer instanceof Uint8Array) ||
      result.buffer === null ||
      result.buffer.buffer === null)
      return callback(null);

    this.callbacks.delete(result.id);
    const buffer = Buffer.from(result.buffer.buffer);
    return callback(buffer);
  }
}
export const pictureWorker = new PictureWorker();