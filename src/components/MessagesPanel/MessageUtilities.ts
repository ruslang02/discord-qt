import { MessageMentions } from 'discord.js';
import markdownIt from 'markdown-it';
import { app, MAX_QSIZE } from '../..';
import { QPixmap, QWidget, QBoxLayout, Direction, QLabel, QGridLayout, AlignmentFlag, CursorShape, WidgetEventTypes } from '@nodegui/nodegui';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { pathToFileURL } from 'url';
import { Message } from 'discord.js';
import { pictureWorker } from '../../utilities/PictureWorker';
import { Collection, MessageAttachment } from 'discord.js';

const MD = markdownIt({
  html: false,
  linkify: true,
  breaks: true
}).disable(['hr', 'blockquote', 'lheading']).enable('link');

const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;
const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-z]/g;

export async function processMentions(content: string) {
  let newContent = content;
  const userMatches = content.match(MessageMentions.USERS_PATTERN);
  if (userMatches) {
    await Promise.all(
      userMatches.map(async (match) => {
        const id = match.replace(/<@!?/g, '').replace('>', '');
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

export function processEmbeds(message: Message): QWidget[] {
  return message.embeds.map(embed => {
    const body = new QWidget();
    const layout = new QBoxLayout(Direction.TopToBottom);
    layout.setSpacing(8);
    layout.setContentsMargins(16, 16, 16, 16);
    body.setObjectName('EmbedBody');
    body.setFlexNodeSizeControlled(false);
    body.setMaximumSize(520, MAX_QSIZE);
    body.setLayout(layout);
    body.setInlineStyle(`border-left: 4px solid ${embed.hexColor || 'rgba(0, 0, 0, 0.3)'};`)
    if (embed.author) {
      const aulayout = new QBoxLayout(Direction.LeftToRight);
      // TODO: add author image
      const auname = new QLabel(body);
      auname.setObjectName('EmbedAuthorName');
      if (embed.author.url) {
        auname.setText(`<a style='color: white; text-decoration: none' href='${embed.author.url}'>${embed.author.name}</a>`);
      } else {
        auname.setText(embed.author.name || '');
      }
      aulayout.addWidget(auname);
      layout.addLayout(aulayout);
    }
    if (embed.title) {
      const title = new QLabel(body);
      title.setObjectName('EmbedTitle');
      if (embed.url) {
        title.setText(`<a style='color: #00b0f4; text-decoration: none' href='${embed.url}'>${embed.title}</a>`);
      } else {
        title.setText(embed.title);
      }
      layout.addWidget(title);
    }
    if (embed.description) {
      const descr = new QLabel(body);
      descr.setObjectName('EmbedDescription');
      descr.setText(`<style>a {color: #00b0f4; text-decoration: none}</style>${processMarkdown(embed.description)}`);
      layout.addWidget(descr);
    }
    const grid = new QGridLayout(body); // TODO: QGridLayout::addLayout
    for (const field of embed.fields) {
      const fieldWidget = new QWidget(body);
      const flayout = new QBoxLayout(Direction.TopToBottom);

      const fTitle = new QLabel(body);
      fTitle.setObjectName('EmbedFieldTitle');
      fTitle.setText(field.name);

      const fValue = new QLabel(body);
      fValue.setObjectName('EmbedFieldValue');
      fValue.setText(`<style>a {color: #00b0f4; text-decoration: none}</style>${processMarkdown(field.value)}`);

      flayout.addWidget(fTitle);
      flayout.addWidget(fValue);
      fieldWidget.setLayout(flayout)
      grid.addWidget(fieldWidget, undefined, undefined, 1, field.inline ? 1 : 2);
    }
    layout.addLayout(grid);
    return body;
  });
}

export async function processInvites(message: Message): Promise<QWidget[]> {
  const invites = message.content.match(INVITE_REGEX) || [];
  const widgets: QWidget[] = [];
  for (const inviteLink of invites) {
    try {
      const invite = await app.client.fetchInvite(inviteLink);
      const item = new QWidget();
      item.setObjectName('InviteContainer');
      item.setMinimumSize(432, 0);
      item.setMaximumSize(432, MAX_QSIZE);
      // @ts-ignore
      item.loadImages = async function () {
        pictureWorker.loadImage(invite.guild?.iconURL({ size: 256, format: 'png' }) || '')
          .then(path => path && avatar.setPixmap(new QPixmap(path).scaled(50, 50, 1, 1)));
      }
      const layout = new QBoxLayout(Direction.TopToBottom);
      item.setLayout(layout);
      layout.setContentsMargins(16, 16, 16, 16);
      layout.setSpacing(12);
      const helperText = new QLabel(item);
      helperText.setText('An invite to join a server');
      helperText.setObjectName('Helper');
      const mainLayout = new QBoxLayout(Direction.LeftToRight);
      const avatar = new QLabel(item);
      const nameLabel = new QLabel(item);
      nameLabel.setText(`${invite.guild?.name || 'A server'} <span style='font-size: small; color: #72767d'>${invite.memberCount} Members</span>`);
      nameLabel.setAlignment(AlignmentFlag.AlignVCenter);
      nameLabel.setObjectName('Name');
      mainLayout.addWidget(avatar);
      mainLayout.addWidget(nameLabel, 1);
      layout.addWidget(helperText);
      layout.addLayout(mainLayout, 1);
      widgets.push(item);
    } catch (e) { }
  }
  return widgets;
}

export function processAttachments(attachments: Collection<string, MessageAttachment>): QLabel[] {
  return attachments.map(attach => {
    let url = attach.proxyURL;
    let width = attach.width || 0;
    let height = attach.height || 0;
    const ratio = width / height;

    if (width > 400) {
      width = 400;
      height = width / ratio;
    }
    if (height > 300) {
      height = 300;
      width = height * ratio;
    }
    width = Math.ceil(width);
    height = Math.ceil(height);
    url += `?width=${width}&height=${height}`;

    const qimage = new QLabel();
    qimage.setFixedSize(width, height);
    qimage.setInlineStyle('background-color: #2f3136');
    qimage.setCursor(CursorShape.PointingHandCursor);
    qimage.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
      open(attach.url);
    })
    // @ts-ignore
    qimage.loadImages = async function () {
      const image = await pictureWorker.loadImage(url);
      image && qimage.setPixmap(new QPixmap(image));
    }
    return qimage;
  });
}