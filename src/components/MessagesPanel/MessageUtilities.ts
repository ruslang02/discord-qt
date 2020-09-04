import { MessageMentions } from 'discord.js';
import markdownIt from 'markdown-it';
import { app } from '../..';
import { QPixmap } from '@nodegui/nodegui';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { pathToFileURL } from 'url';

const MD = markdownIt({
  html: false,
  linkify: true,
  breaks: true
}).disable(['hr', 'blockquote', 'lheading']).enable('link');
const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;

export async function processMentions(content: string) {
  let newContent = content;
  const userMatches = content.match(MessageMentions.USERS_PATTERN);
  if (userMatches) {
    await Promise.all(
      userMatches.map(async (match) => {
        const id = match.replace('<@', '').replace('>', '');
        const user = await app.client.users.fetch(id);
        if (user)
          newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${user.username}</a>`);
      })
    );
  }
  return newContent;
}

export function processMarkdown(content: string) {
  if (!app.config.processMarkDown) return content.replace(/\n/g, '<br/>');
  content = content
    .replace(/<\/?p>/g, '')
    .split('\n')
    .map(line => line.startsWith("> ") ? line.replace("> ", "<span>▎</span>") : line)
    .join('\n')
    .trim();
  return MD.render(content);
}

export async function processEmojis(content: string): Promise<string> {
  const emoIds = content.match(EMOJI_REGEX) || [];
  const size = content.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 32 : 32;
  for (const emo of emoIds) {
    const [type, name, id] = emo.replace('<', '').replace('>', '').split(':');
    const format = type === 'a' ? 'gif' : 'png';
    try {
      const emojiPath = await resolveEmoji({ emoji_id: id, emoji_name: name });
      if (!emojiPath) continue;
      // @ts-ignore
      const url = app.client.rest.cdn.Emoji(id, format);
      const uri = new URL(url);
      uri.searchParams.append('emojiname', name);

      const pix = new QPixmap(emojiPath);
      const larger = pix.width() > pix.height() ? 'width' : 'height'

      content = content.replace(emo, `<a href='${uri.href}'><img ${larger}=${size} src='${pathToFileURL(emojiPath)}'></a>`);
    } catch (e) { }
  }
  return content;
}
