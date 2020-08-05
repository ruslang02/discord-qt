import { CustomStatus } from 'discord.js';
import TWEmoji from 'twemoji';
import { app } from '..';

export function resolveEmoji(status: CustomStatus): Promise<string> {
  return new Promise(resolve => {
    if (!status.emoji_id) {
      if (!status.emoji_name) return resolve('');
      TWEmoji.parse(status.emoji_name, {
        // @ts-ignore
        callback: async (icon, { base, size, ext }) => {
          const url = `${base}${size}/${icon}${ext}`;
          resolve(url);
        }
      })
      return resolve('');
    }
    // @ts-ignore
    const emojiUrl = app.client.rest.cdn.Emoji(status.emoji_id, 'png');
    resolve(emojiUrl);
  })
}