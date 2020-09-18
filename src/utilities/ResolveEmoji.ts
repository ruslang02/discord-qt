import { join, basename } from 'path';
import TWEmoji from 'twemoji';
import { app, paths } from '..';
import { pictureWorker } from '../utilities/PictureWorker';
import { CustomStatus } from '../structures/CustomStatus';

export const EMOJI_PATH = join(paths.cache, 'emojis');

export async function resolveEmoji(status: CustomStatus): Promise<string | null> {
  status.emoji_id = (status.emoji_id || '').toString();
  status.emoji_name = (status.emoji_name || '').toString();
  let fname = status.emoji_id;
  const url = await getEmojiURL(status);
  if (!url) return null;
  if (fname === '') fname = `tw/${basename(url).split('.')[0]}`;
  return pictureWorker.loadImage(url, { roundify: false });
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