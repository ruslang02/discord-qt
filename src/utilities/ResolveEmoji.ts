import { CustomStatus } from 'discord.js';
import TWEmoji from 'twemoji';
import fs, { existsSync } from 'fs';
import { app, paths } from '..';
import { join, basename } from 'path';
import { pictureWorker } from '../utilities/PictureWorker';
const { mkdir, writeFile } = fs.promises;

export let EMOJI_PATH: string = '';
setTimeout(() => {
  EMOJI_PATH = join(paths.cache, 'emojis');
  if (!existsSync(EMOJI_PATH + '/tw'))
    mkdir(EMOJI_PATH + '/tw', { recursive: true });
});

export async function resolveEmoji(status: CustomStatus): Promise<string | null> {
  status.emoji_id = (status.emoji_id || '').toString();
  status.emoji_name = (status.emoji_name || '').toString();
  let fname = status.emoji_id;
  const url = await getEmojiURL(status);
  if (!url) return null;
  if (fname === '') fname = `tw/${basename(url).split('.')[0]}`;
  const path = join(EMOJI_PATH, fname + '.png');
  if (existsSync(path)) return path;
  //@ts-ignore
  const buf = await pictureWorker.loadImage(url, { roundify: false })
  if (!buf) return null;
  await writeFile(path, buf);
  return path;
}

export function getEmojiURL(status: CustomStatus): Promise<string | null> {
  return new Promise(resolve => {
    if (!status.emoji_id) {
      if (!status.emoji_name) return resolve(null);
      TWEmoji.parse(status.emoji_name, {
        // @ts-ignore
        callback: async (icon, { base, size, ext }) => {
          const url = `${base}${size}/${icon}${ext}`;
          resolve(url);
        }
      })
      return resolve(null);
    }
    // @ts-ignore
    const emojiUrl = app.client.rest.cdn.Emoji(status.emoji_id, 'png');
    resolve(emojiUrl);
  })
}