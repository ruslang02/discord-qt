import { isMainThread, parentPort } from 'worker_threads';
import { httpsGet } from './HttpsGet';
import { roundifyPng } from './RoundifyPng';
import path from 'path';

const log = console.log.bind(this, '[worker]');
const send = (data: any) => {
  // log(`sending`, new Date().getTime(), path.basename(data.url), data.buffer?.length || 'NULL')
  parentPort?.postMessage(data);
}
if (!isMainThread) {
  parentPort?.on('message', (request) => {
    const { url, options } = request;
    httpsGet(url, options).then(buffer => {
      //log(`received`, new Date().getTime(), path.basename(request.url), buffer?.length || 'NULL');
      if (buffer && options.roundify === true)
        return roundifyPng(buffer).then(buffer => send({ url, buffer }));
      send({ url, buffer });
    });
  })
}