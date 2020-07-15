import https from "https";
import axios from 'axios';

export async function httpsGet(url: string | null, options: { size: number }): Promise<Buffer | null> {
  if (url === null) return null;
  const pngURL = url
    .replace(/(\.jpg)|(\.webp)|(\.gif)/g, '.png')
    .replace(/\?size=\d+/g, '') + `?size=${options.size}`;
    return (await axios.get(pngURL, {responseType: 'arraybuffer'})).data;
  /*return new Promise((resolve) => {
    https.get(pngURL, (res) => {
      const data: Uint8Array[] = []
      res.on('data', chunk => data.push(chunk));
      res.on('error', (err) => { console.error(err); resolve(null); });
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', (err) => { console.error(err); resolve(null); })
  })*/
}