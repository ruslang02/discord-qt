import {
  AlignmentFlag,
  CursorShape,
  Direction,
  QBoxLayout,
  QGridLayout,
  QLabel,
  QPixmap,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  Collection, GuildChannel, Message, MessageAttachment, MessageEmbedImage, MessageMentions,
} from 'discord.js';
import { __ } from 'i18n';
import markdownIt from 'markdown-it';
import open from 'open';
import { extname, join } from 'path';
import { pathToFileURL } from 'url';
import { app, MAX_QSIZE, PIXMAP_EXTS } from '../..';
import { pictureWorker } from '../../utilities/PictureWorker';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { DLabel } from '../DLabel/DLabel';
import { MessageItem } from './MessageItem';

const MD = markdownIt({
  html: false,
  linkify: true,
  breaks: true,
}).disable(['hr', 'blockquote', 'lheading']).enable('link');

const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;
const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-z]/g;
const EMOJI_PLACEHOLDER = join(__dirname, 'assets/icons/emoji-placeholder.png');

function getCorrectSize(w?: number | null, h?: number | null) {
  let width = w;
  let height = h;
  width = width || 0;
  height = height || 0;
  const ratio = width / height;

  if (width > 400) {
    width = 400;
    height = width / ratio;
  }
  if (height > 300) {
    height = 300;
    width = height * ratio;
  }
  return { width: Math.ceil(width), height: Math.ceil(height) };
}

export async function processMentions(content: string, message: Message) {
  // const { guild } = message;
  let newContent = content;
  const userMatches = content.match(MessageMentions.USERS_PATTERN) || [];
  const roleMatches = content.match(MessageMentions.ROLES_PATTERN) || [];
  const channelMatches = content.match(MessageMentions.CHANNELS_PATTERN) || [];
  await Promise.all([
    ...userMatches.map(async (match) => {
      const id = match.replace(/<@!?/g, '').replace('>', '');
      /* if (guild) {
        let memberName: string;
        try {
          const member = await guild.members.fetch(id);
          memberName = member.nickname || member.user.username;
        } catch (e) {
          memberName = 'unknown-member';
        }
        newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${memberName}</a>`);
      } else { */
      let userName: string;
      try {
        const user = await app.client.users.fetch(id);
        userName = user.username;
      } catch (e) {
        userName = 'unknown-user';
      }
      newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${userName}</a>`);
      // }
    }),
    ...roleMatches.map(async (match) => {
      const id = match.replace(/<@&/g, '').replace('>', '');
      const role = await message.guild?.roles.fetch(id);
      if (role) newContent = newContent.replace(match, `<span style='color: ${role.hexColor}'>@${role.name}</span>`);
    }),
    ...channelMatches.map(async (match) => {
      const id = match.replace(/<#/g, '').replace('>', '');
      const channel = app.client.channels.resolve(id) as GuildChannel;
      const channelName = channel?.name || 'invalid-channel';
      newContent = newContent.replace(match, `<a href='dq-channel://${id}'>#${channelName}</a>`);
    }),
  ]);
  return newContent;
}

export function processMarkdown(content: string) {
  let c = content;
  if (!app.config.processMarkDown) return c.replace(/\n/g, '<br/>');
  c = c
    .replace(/<\/?p>/g, '')
    .split('\n')
    .map((line) => (line.startsWith('> ') ? line.replace('> ', '<span>▎</span>') : line))
    .join('\n')
    .trim();
  return MD.render(c);
}

export async function processEmojiPlaceholders(content: string): Promise<string> {
  let c = content;
  const emoIds = c.match(EMOJI_REGEX) || [];
  const size = c.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 48 : 24;
  for (const emo of emoIds) {
    c = c.replace(emo, `<img width="${size}" height="${size}" src="${pathToFileURL(EMOJI_PLACEHOLDER)}" />`);
  }
  return c;
}

export async function processEmojis(content: string): Promise<string> {
  const emoIds = content.match(EMOJI_REGEX) || [];
  const size = content.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 48 : 24;
  let cnt = content;
  const promises: Promise<any>[] = emoIds.map((emo) => {
    const [type, name, id] = emo.replace('<', '').replace('>', '').split(':');
    const format = type === 'a' ? 'gif' : 'png';
    return resolveEmoji({ emoji_id: id, emoji_name: name })
      .then((emojiPath) => {
        if (!emojiPath) return;
        // @ts-ignore
        const uri = new URL(app.client.rest.cdn.Emoji(id, format));
        uri.searchParams.append('emoji_name', name);

        const pix = new QPixmap(emojiPath);
        const larger = pix.width() > pix.height() ? 'width' : 'height';

        cnt = cnt.replace(emo, `<a href='${uri.href}'><img ${larger}=${size} src='${pathToFileURL(emojiPath)}'></a>`);
      }).catch(() => { });
  });
  await Promise.all(promises);
  return content;
}

export function processEmbeds(message: Message, item: MessageItem): QWidget[] {
  return message.embeds.map((embed) => {
    const container = new QWidget();
    const cLayout = new QBoxLayout(Direction.LeftToRight);
    const body = new QWidget();
    cLayout.addWidget(body);
    cLayout.addStretch(1);
    cLayout.setContentsMargins(0, 0, 0, 0);
    container.setLayout(cLayout);
    const layout = new QBoxLayout(Direction.TopToBottom);
    layout.setSpacing(8);
    layout.setContentsMargins(16, 16, 16, 16);
    body.setObjectName('EmbedBody');
    body.setFlexNodeSizeControlled(false);
    body.setMaximumSize(520, MAX_QSIZE);
    body.setLayout(layout);
    body.setInlineStyle(`border-left: 4px solid ${embed.hexColor || 'rgba(0, 0, 0, 0.3)'};`);
    if (embed.author) {
      const aulayout = new QBoxLayout(Direction.LeftToRight);
      aulayout.setContentsMargins(0, 0, 0, 0);
      aulayout.setSpacing(8);
      if (embed.author.proxyIconURL) {
        const auimage = new QLabel(body);
        auimage.setFixedSize(24, 24);
        pictureWorker.loadImage(embed.author.proxyIconURL)
          .then((path) => !item._destroyed
            && path
            && auimage.setPixmap(new QPixmap(path).scaled(24, 24)));
        aulayout.addWidget(auimage);
      }
      const auname = new DLabel(body);
      auname.setObjectName('EmbedAuthorName');
      if (embed.author.url) {
        auname.setText(`<a style='color: white;' href='${embed.author.url}'>${embed.author.name}</a>`);
      } else {
        auname.setText(embed.author.name || '');
      }
      aulayout.addWidget(auname);
      layout.addLayout(aulayout);
    }
    if (embed.title) {
      const title = new DLabel(body);
      title.setObjectName('EmbedTitle');
      if (embed.url) {
        title.setText(`<a href='${embed.url}'>${embed.title}</a>`);
      } else {
        title.setText(embed.title);
      }
      layout.addWidget(title);
    }
    if (embed.description) {
      const descr = new DLabel(body);
      descr.setObjectName('EmbedDescription');
      const description = processMarkdown(embed.description)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      processMentions(description, message).then((pdescription) => {
        if (!item._destroyed) descr.setText(pdescription);
      });
      layout.addWidget(descr);
    }
    const grid = new QGridLayout(); // TODO: QGridLayout::addLayout
    grid.setContentsMargins(0, 0, 0, 0);
    grid.setSpacing(8);
    for (const field of embed.fields) {
      const fieldWidget = new QWidget(body);
      const flayout = new QBoxLayout(Direction.TopToBottom);
      flayout.setSpacing(2);
      flayout.setContentsMargins(0, 0, 0, 0);
      const fTitle = new QLabel(body);
      fTitle.setObjectName('EmbedFieldTitle');
      fTitle.setText(field.name);

      const fValue = new DLabel(body);
      fValue.setObjectName('EmbedFieldValue');
      fValue.setText(processMarkdown(field.value));

      flayout.addWidget(fTitle);
      flayout.addWidget(fValue);
      fieldWidget.setLayout(flayout);
      grid.addWidget(fieldWidget, grid.rowCount(), 0, 1, field.inline ? 1 : 2);
    }
    layout.addLayout(grid);
    if (embed.image || embed.thumbnail) {
      const image = embed.image || embed.thumbnail as MessageEmbedImage;
      const { width, height } = getCorrectSize(image.width, image.height);
      const qImage = new QLabel();
      qImage.setCursor(CursorShape.PointingHandCursor);
      qImage.setFixedSize(width, height);
      qImage.setObjectName('EmbedImage');
      qImage.setInlineStyle('background-color: #2f3136');
      body.setMaximumSize(width + 32, MAX_QSIZE);
      // @ts-ignore
      container.loadImages = async function loadImages() {
        if (item._destroyed) return;
        const path = await pictureWorker.loadImage(image.proxyURL);
        if (path) qImage.setPixmap(new QPixmap(path).scaled(width, height, 1, 1));
        qImage.setInlineStyle('background-color: transparent');
      };
      layout.addWidget(qImage);
    }
    return container;
  });
}

export async function processInvites(message: Message): Promise<QWidget[]> {
  const invites = message.content.match(INVITE_REGEX) || [];
  const widgets: QWidget[] = [];
  for (const inviteLink of invites) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const invite = await app.client.fetchInvite(inviteLink);
      const item = new QWidget();
      item.setObjectName('InviteContainer');
      item.setMinimumSize(432, 0);
      item.setMaximumSize(432, MAX_QSIZE);
      const layout = new QBoxLayout(Direction.TopToBottom);
      item.setLayout(layout);
      layout.setContentsMargins(16, 16, 16, 16);
      layout.setSpacing(12);
      const helperText = new QLabel(item);
      helperText.setText(__('GUILD_PROFILE_JOIN_SERVER_BUTTON'));
      helperText.setObjectName('Helper');
      const mainLayout = new QBoxLayout(Direction.LeftToRight);
      const avatar = new QLabel(item);
      // @ts-ignore
      item.loadImages = async function loadImages() {
        pictureWorker.loadImage(invite.guild?.iconURL({ size: 256, format: 'png' }) || '')
          .then((path) => {
            if (path) avatar.setPixmap(new QPixmap(path).scaled(50, 50, 1, 1));
          });
      };
      const nameLabel = new QLabel(item);
      nameLabel.setText(`${invite.guild?.name} <span style='font-size: small; color: #72767d'>${__('TOTAL_MEMBERS')}: ${invite.memberCount}</span>`);
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
  return attachments.map((attach) => {
    const { width, height } = getCorrectSize(attach.width, attach.height);
    const url = `${attach.proxyURL}?width=${width}&height=${height}`;
    const isImage = PIXMAP_EXTS.includes(extname(attach.url).slice(1).toUpperCase());
    const qimage = new DLabel();
    qimage.setFixedSize(width, height);
    qimage.setInlineStyle('background-color: #2f3136; border-radius: 3px;');
    qimage.setCursor(CursorShape.PointingHandCursor);
    qimage.setAlignment(AlignmentFlag.AlignCenter);
    qimage.setProperty('toolTip', `${attach.name || attach.url}<br />
    Size: ${attach.size} bytes
    ${attach.width && attach.height ? `<br />Resolution: ${attach.width}x${attach.height}` : ''}
    `);
    qimage.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      open(attach.url);
    });
    if (!isImage) {
      qimage.setPixmap(new QPixmap(join(__dirname, 'assets/icons/file.png')));
    } else {
      // @ts-ignore
      qimage.loadImages = async function loadImages() {
        if (!isImage) return;
        const image = await pictureWorker.loadImage(url);
        if (image) qimage.setPixmap(new QPixmap(image));
        qimage.setInlineStyle('background-color: transparent');
      };
    }
    return qimage;
  });
}
