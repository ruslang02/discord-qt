import https from "https";

export async function httpsGet(url: string | null): Promise<Buffer | null> {
  if (url === null) return null;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const data: Uint8Array[] = []
      res.on('data', chunk => data.push(chunk));
      res.on('error', (err) => { console.error(err); resolve(null); });
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', (err) => { console.error(err); resolve(null); })
  });
}