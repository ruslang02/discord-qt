import https from "https";

export function httpsGet(url: string | null): Promise<Buffer | false> {
  if (url === null) return Promise.resolve(false);
  const pngURL = url.replace(/(\.jpg)|(\.webp)|(\.gif)/g, '.png');
  return new Promise((resolve) => {
    https.get(pngURL, (res) => {
      const data: Uint8Array[] = []
      res.on('data', chunk => data.push(chunk));
      res.on('error', (err) => { console.error(err); resolve(false); });
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', (err) => { console.error(err); resolve(false); })
  })
}