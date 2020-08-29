import { isMainThread, parentPort } from 'worker_threads';
import { httpsGet } from './HttpsGet';
import { roundifyPng } from './RoundifyPng';
import { join, dirname } from 'path';
import { promises, existsSync } from 'fs';
import { fileURLToPath, URL } from 'url';
import envPaths from 'env-paths';

const { readFile, writeFile, mkdir } = promises;
const paths = envPaths('discord', { suffix: 'qt' })

if (!isMainThread) {
  parentPort?.on('message', (request) => {
    const { url } = request;
    handleRequest(url).then(path => {
      parentPort?.postMessage({ url, path })
    })
  })
}

async function handleRequest(url: string) {
  const uri = new URL(url);
  const roundify = uri.searchParams.get('roundify') === 'true';
  const path = join(paths.cache, '.' + uri.pathname + (roundify ? '.round' : ''));
  if (uri.hostname === 'cdn.discordapp.com') {
    if (existsSync(path)) return path;
  }
  await mkdir(dirname(path), {recursive: true});
  let buffer = await (uri.protocol === 'file:' ? readFile(fileURLToPath(url)) : httpsGet(url));
  if (buffer && buffer.length) {
    if (roundify) buffer = await roundifyPng(buffer);
    await writeFile(path, buffer as Buffer);
    return path;
  }
  return null;
}