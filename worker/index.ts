/* eslint-disable no-console */
import envPaths from 'env-paths';
import { existsSync, promises } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, URL } from 'url';
import { isMainThread, parentPort } from 'worker_threads';
import { httpsGet } from './HttpsGet';
import { processPng } from './ProcessPng';

const { readFile, writeFile, mkdir } = promises;
const paths = envPaths('discord', { suffix: 'qt' });

async function handleRequest(url: string) {
  const uri = new URL(url);
  const roundify = uri.searchParams.get('roundify') === 'true';
  const path = join(paths.cache, `.${uri.pathname}${roundify ? '.round' : ''}`);

  if (uri.hostname === 'cdn.discordapp.com') {
    if (existsSync(path)) {
      return path;
    }
  }

  await mkdir(dirname(path), { recursive: true });
  let buffer = await (uri.protocol === 'file:' ? readFile(fileURLToPath(url)) : httpsGet(url));

  if (buffer && buffer.length) {
    buffer = await processPng(buffer, roundify);

    await writeFile(path, buffer as Buffer);

    return path;
  }

  return null;
}

if (!isMainThread) {
  parentPort?.on('message', (request) => {
    const { url } = request;

    handleRequest(url)
      .then((path) => {
        parentPort?.postMessage({ url, path });
        // eslint-disable-next-line no-console
      })
      .catch((e) => console.error('Could not complete request.', e));
  });
}
