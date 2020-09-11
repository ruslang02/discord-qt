import { AlignmentFlag, CursorShape, Direction, QBoxLayout, QGridLayout, QLabel, QPixmap, QWidget, WidgetEventTypes } from '@nodegui/nodegui';
import { Collection, Message, MessageAttachment, MessageEmbedImage, MessageMentions, TextChannel } from 'discord.js';
import markdownIt from 'markdown-it';
import { pathToFileURL } from 'url';
import { app, MAX_QSIZE } from '../..';
import { MarkdownStyles } from '../../structures/MarkdownStyles';
import { pictureWorker } from '../../utilities/PictureWorker';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { __ } from 'i18n';
import { DLabel } from '../DLabel/DLabel';
import { GuildChannel } from 'discord.js';
import { join } from 'path';

const MD = markdownIt({
  html: false,
  linkify: true,
  breaks: true
}).disable(['hr', 'blockquote', 'lheading']).enable('link');

const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;
const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-z]/g;
const EMOJI_PLACEHOLDER = join(__dirname, 'assets/icons/emoji-placeholder.png');

export async function processMentions(content: string, message: Message) {
  const guild = message.guild;
  let newContent = content;
  const userMatches = content.match(MessageMentions.USERS_PATTERN) || [];
  const roleMatches = content.match(MessageMentions.ROLES_PATTERN) || [];
  const channelMatches = content.match(MessageMentions.CHANNELS_PATTERN) || [];
  await Promise.all([
    ...userMatches.map(async (match) => {
      const id = match.replace(/<@!?/g, '').replace('>', '');
      if (guild) {
        let memberName: string;
        try {
          const member = await guild.members.fetch(id);
          memberName = member.nickname || member.user.username;
        } catch (e) {
          memberName = 'unknown-member';
        }
        newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${memberName}</a>`);
      } else {
        let userName: string;
        try {
          const user = await app.client.users.fetch(id);
          userName = user.username;
        } catch (e) {
          userName = 'unknown-user';
        }
        newContent = newContent.replace(match, `<a href='dq-user://${id}'>@${userName}</a>`);
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
      const channel = app.client.channels.resolve(id) as GuildChannel;
      let channelName = channel?.name || 'invalid-channel';
      newContent = newContent.replace(match, `<a href='dq-channel://${id}'>#${channelName}</a>`);
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

export async function processEmojiPlaceholders(content: string): Promise<string> {
  const emoIds = content.match(EMOJI_REGEX) || [];
  const size = content.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 48 : 24;
  for (const emo of emoIds) {
    content = content.replace(emo, `<img width="${size}" height="${size}" src="${pathToFileURL(EMOJI_PLACEHOLDER)}" />`);
  }
  return content;
}

export async function processEmojis(content: string): Promise<string> {
  const emoIds = content.match(EMOJI_REGEX) || [];
  const size = content.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 48 : 24;
  for (const emo of emoIds) {
    const [type, name, id] = emo.replace('<', '').replace('>', '').split(':');
    const format = type === 'a' ? 'gif' : 'png';
    try {
      const emojiPath = await resolveEmoji({ emoji_id: id, emoji_name: name });
      if (!emojiPath) continue;
      // @ts-ignore
      const uri = new URL(app.client.rest.cdn.Emoji(id, format));
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
      aulayout.setContentsMargins(0, 0, 0, 0);
      aulayout.setSpacing(8);
      // TODO: add author image
      if (embed.author.proxyIconURL) {
        const auimage = new QLabel(body);
        auimage.setFixedSize(24, 24);
        pictureWorker.loadImage(embed.author.proxyIconURL)
          .then(path => path && auimage.setPixmap(new QPixmap(path).scaled(24, 24)));
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
      let description = embed.description;
      processMentions(description, message).then(pdescription => {
        pdescription = processMarkdown(pdescription);
        descr.setText(pdescription);
      })
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
      helperText.setText(__('GUILD_PROFILE_JOIN_SERVER_BUTTON'));
      helperText.setObjectName('Helper');
      const mainLayout = new QBoxLayout(Direction.LeftToRight);
      const avatar = new QLabel(item);
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