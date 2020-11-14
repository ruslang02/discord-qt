/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import { PNG } from 'pngjs';

export function roundifyPng(buf: Buffer): Promise<Buffer | null> {
  return new Promise((resolve) => {
    new PNG({ filterType: 4 })
      .parse(buf, (err, that) => {
        if (err) {
          console.error(err);
          resolve(null);
        }
        for (let y = 0; y < that.height; y += 1) {
          for (let x = 0; x < that.width; x += 1) {
            const idx = (that.width * y + x) << 2;
            const radius = that.height / 2;
            if (
              y >= Math.sqrt(radius ** 2 - (x - radius) ** 2) + radius ||
              y <= -Math.sqrt(radius ** 2 - (x - radius) ** 2) + radius
            ) {
              that.data[idx + 3] = 0;
            }
          }
        }
        resolve(PNG.sync.write(that));
      })
      .on('error', () => resolve(null));
  });
}
