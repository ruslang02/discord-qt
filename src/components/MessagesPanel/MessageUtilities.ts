import { AlignmentFlag, CursorShape, Direction, QBoxLayout, QGridLayout, QLabel, QPixmap, QWidget, WidgetEventTypes } from '@nodegui/nodegui';
import { Collection, Message, MessageAttachment, MessageEmbedImage, MessageMentions, TextChannel } from 'discord.js';
import markdownIt from 'markdown-it';
import { pathToFileURL } from 'url';
import { app, MAX_QSIZE } from '../..';
import { MarkdownStyles } from '../../structures/MarkdownStyles';
import { pictureWorker } from '../../utilities/PictureWorker';
import { resolveEmoji } from '../../utilities/ResolveEmoji';

const MD = markdownIt({
  html: false,
  linkify: true,
  breaks: true
}).disable(['hr', 'blockquote', 'lheading']).enable('link');

const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;
const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-z]/g;

export async function processMentions(content: string, message: Message) {
  let newContent = content;
  const userMatches = content.match(MessageMentions.USERS_PATTERN) || [];
  const roleMatches = content.match(MessageMentions.ROLES_PATTERN) || [];
  const channelMatches = content.match(MessageMentions.CHANNELS_PATTERN) || [];

  await Promise.all([
    ...userMatches.map(async (match) => {
      const id = match.replace(/<@!?/g, '').replace('>', '');
      const member = await message.guild?.members.fetch(id);
      if (member)
        newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${member.nickname || member.user.username}</a>`);
      else {
        const user = await app.client.users.fetch(id);
        if (user)
          newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${user.username}</a>`);
      }
    }),
    ...roleMatches.map(async (match) => {
      const id = match.replace(/<@&/g, '').replace('>', '');
      const role = await message.guild?.roles.fetch(id);
      if (role)
        newContent = newContent.replace(match, `<span style='color: ${role.hexColor}'>@${role.name}</span>`);
    }),
    ...channelMatches.map(async (match) => {
      const id = match.replace(/<#/g, '').replace('>', '');
      const channel = await app.client.channels.fetch(id) as TextChannel;
      if (channel)
        newContent = newContent.replace(match, `<a href='dq-channel://${channel.id}'>#${channel.name}</a>`);
    })
  ]);
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
  const size = content.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 48 : 32;
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
    const container = new QWidget();
    const cLayout = new QBoxLayout(Direction.LeftToRight);
    const body = new QWidget();
    cLayout.addWidget(body);
    cLayout.addStretch(1);
    cLayout.setContentsMargins(0, 0, 0, 0);
    container.setLayout(cLayout)
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
        auname.setText(`${MarkdownStyles}<a style='color: white;' href='${embed.author.url}'>${embed.author.name}</a>`);
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
        title.setText(`${MarkdownStyles}<a href='${embed.url}'>${embed.title}</a>`);
      } else {
        title.setText(embed.title);
      }
      layout.addWidget(title);
    }
    if (embed.description) {
      const descr = new QLabel(body);
      descr.setObjectName('EmbedDescription');
      descr.setText(`${MarkdownStyles}${processMarkdown(embed.description)}`);
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

      const fValue = new QLabel(body);
      fValue.setObjectName('EmbedFieldValue');
      fValue.setText(`${MarkdownStyles}${processMarkdown(field.value)}`);

      flayout.addWidget(fTitle);
      flayout.addWidget(fValue);
      fieldWidget.setLayout(flayout)
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
      container.loadImages = async function () {
        const path = await pictureWorker.loadImage(image.proxyURL);
        path && qImage.setPixmap(new QPixmap(path).scaled(width, height, 1, 1));
        qImage.setInlineStyle('background-color: transparent');
      }
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

function getCorrectSize(width?: number | null, height?: number | null) {
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

export function processAttachments(attachments: Collection<string, MessageAttachment>): QLabel[] {
  return attachments.map(attach => {
    const { width, height } = getCorrectSize(attach.width, attach.height);
    const url = `${attach.proxyURL}?width=${width}&height=${height}`;
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
      qimage.setInlineStyle('background-color: transparent');
    }
    return qimage;
  });
}