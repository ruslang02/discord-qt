import { Emoji } from 'discord.js';
import { QIcon } from '@nodegui/nodegui';
import { join } from 'path';
import { existsSync, promises } from 'fs';
import { pictureWorker } from './PictureWorker';
import { paths } from '..';
const { writeFile, mkdir } = promises;
export let EMOJI_PATH: string = '';
export async function getEmoji(emoji: Emoji): Promise<string | null> {
  const path = join(EMOJI_PATH, emoji.id + '.png');
  if (existsSync(path)) return path;
  const buf = await pictureWorker.loadImage(emoji.url || '', { roundify: false })
  if (!buf) return null;
  await writeFile(path, buf);
  return path;
}

setTimeout(() => {
  EMOJI_PATH = join(paths.cache, 'emojis');
  if (!existsSync(EMOJI_PATH))
    mkdir(EMOJI_PATH, { recursive: true });
});
