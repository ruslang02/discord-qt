import { basename, join } from 'path';
import TWEmoji from 'twemoji';
import { app } from '..';
import { CustomStatus } from '../structures/CustomStatus';
import { paths } from '../structures/Paths';
import { pictureWorker } from './PictureWorker';

export const EMOJI_PATH = join(paths.cache, 'emojis');

export function getEmojiURL(status: CustomStatus): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!status.emoji_id) {
      if (!status.emoji_name) {
        reject(new Error('Incorrect input data.'));
        return;
      }
      TWEmoji.parse(status.emoji_name, {
        // @ts-ignore
        callback: async (icon, { base, size, ext }) => {
          const url = `${base}${size}/${icon}${ext}`;
          resolve(url);
        },
      });
    }
    // @ts-ignore
    const emojiUrl = app.client.rest.cdn.Emoji(status.emoji_id, 'png');
    resolve(emojiUrl);
  });
}

export async function resolveEmoji(status: CustomStatus): Promise<string | null> {
  const st = status;
  st.emoji_id = (status.emoji_id || '').toString();
  st.emoji_name = (status.emoji_name || '').toString();
  let fname = st.emoji_id;
  const url = await getEmojiURL(st);
  if (fname === '') fname = `tw/${basename(url).split('.')[0]}`;
  return pictureWorker.loadImage(url, { roundify: false });
}
