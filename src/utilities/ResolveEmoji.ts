import { CustomStatus } from 'discord.js';
import TWEmoji from 'twemoji';
import fs, { existsSync } from 'fs';
import { app, paths } from '..';
import { join } from 'path';
import { pictureWorker } from '../utilities/PictureWorker';
const { mkdir, writeFile } = fs.promises;

export let EMOJI_PATH: string = '';
setTimeout(() => {
  EMOJI_PATH = join(paths.cache, 'emojis');
  if (!existsSync(EMOJI_PATH))
    mkdir(EMOJI_PATH, { recursive: true });
});

export async function resolveEmoji(status: CustomStatus): Promise<string | null> {
  if (typeof status.emoji_id !== 'string') return null;
  const path = join(EMOJI_PATH, status.emoji_id + '.png');
  if (existsSync(path)) return path;
  const url = await getEmojiURL(status);
  if (!url) return null;
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