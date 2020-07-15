import { isMainThread, parentPort } from 'worker_threads';
import { httpsGet } from './HttpsGet';
import { roundifyPng } from './RoundifyPng';
if (!isMainThread) {
  parentPort?.on('message', async (request) => {
    const { url, options } = request;
    const buffer = await httpsGet(url, options);
    if (!buffer || options.roundify === false)
      return parentPort?.postMessage({url, buffer});
    const roundBuffer = await roundifyPng(buffer);
    parentPort?.postMessage({url, buffer: roundBuffer});
  })
}