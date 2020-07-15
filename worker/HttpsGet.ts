import https from "https";

export function httpsGet(url: string | null, options: { size: number }): Promise<Buffer | null> {
  if (url === null) return Promise.resolve(null);
  const pngURL = url
    .replace(/(\.jpg)|(\.webp)|(\.gif)/g, '.png')
    .replace('?size=2048', '') + `?size=${options.size}`;
  return new Promise((resolve) => {
    https.get(pngURL, (res) => {
      const data: Uint8Array[] = []
      res.on('data', chunk => data.push(chunk));
      res.on('error', (err) => { console.error(err); resolve(null); });
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', (err) => { console.error(err); resolve(null); })
  })
}