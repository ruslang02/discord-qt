import { PNG } from "pngjs";

export function roundifyPng(buf: Buffer): Promise<Buffer | null> {
  return new Promise((resolve) => {
    new PNG({ filterType: 4 }).parse(buf, (err, that) => {
      if (err) {
        console.error(err);
        resolve(null);
      }
      for (var y = 0; y < that.height; y++) {
        for (var x = 0; x < that.width; x++) {
          var idx = (that.width * y + x) << 2;
          var radius = that.height / 2;
          if (y >= Math.sqrt(Math.pow(radius, 2) - Math.pow(x - radius, 2)) + radius || y <= -(Math.sqrt(Math.pow(radius, 2) - Math.pow(x - radius, 2))) + radius) {
            that.data[idx + 3] = 0;
          }
        }
      }
      resolve(PNG.sync.write(that));
    }).on('error', () => resolve(null));
  });
}