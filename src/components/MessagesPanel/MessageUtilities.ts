/**
 * A set of functions to handle rendering of different parts of a message.
 */
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
import { GuildChannel, Message, MessageEmbedImage, MessageMentions } from 'discord.js';
import { __ } from 'i18n';
import markdownIt from 'markdown-it';
import open from 'open';
import { extname, join } from 'path';
import { pathToFileURL } from 'url';
import { app, MAX_QSIZE, PIXMAP_EXTS } from '../..';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { DLabel } from '../DLabel/DLabel';
import { MessageItem } from './MessageItem';

const MD = markdownIt({
  html: false,
  linkify: true,
  breaks: true,
})
  .disable(['hr', 'blockquote', 'lheading', 'list'])
  .enable('link');

const { debug, error } = createLogger('MessageUtilities');

const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;
const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-z]/g;
const EMOJI_PLACEHOLDER = join(__dirname, 'assets/icons/emoji-placeholder.png');

const unescape = (str: string) =>
  str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const escape = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Calculates the thumbnail size.
 * @param w Original width.
 * @param h Original height.
 */
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

/**
 * Processes user/role/channel mentions in the string.
 * @param content String to process.
 * @param message Message that is linked to the content.
 */
export async function processMentions(content: string, message: Message) {
  // const { guild } = message;
  let newContent = content;
  const uContent = unescape(content);
  const userMatches = uContent.match(MessageMentions.USERS_PATTERN) || [];
  const roleMatches = uContent.match(MessageMentions.ROLES_PATTERN) || [];
  const channelMatches = uContent.match(MessageMentions.CHANNELS_PATTERN) || [];
  const uIds = message.mentions.users.map((u) => u.id);
  if (uIds.length) {
    try {
      await message.guild?.members.fetch({
        user: uIds,
      });
    } catch (e) {}
  }
  await Promise.all([
    ...userMatches.map(async (match) => {
      const id = match.replace(/<@!?/g, '').replace(/>/g, '');
      if (message.guild) {
        const member = message.guild.members.resolve(id);
        const memberName =
          member?.nickname ||
          member?.user.username ||
          app.client.users.resolve(id)?.username ||
          'unknown-user';
        newContent = newContent.replace(
          escape(match),
          `<a href='dq-user://${id}'>@${memberName}</a>`,
        );
      } else {
        let userName: string;
        try {
          const user = await app.client.users.fetch(id);
          userName = user.username;
        } catch (e) {
          userName = 'unknown-user';
        }
        newContent = newContent.replace(
          escape(match),
          `<a href='dq-user://${id}'>@${userName}</a>`,
        );
      }
    }),
    ...roleMatches.map(async (match) => {
      const id = match.replace(/<@&/g, '').replace(/>/g, '');
      const role = await message.guild?.roles.fetch(id);
      if (role) {
        newContent = newContent.replace(
          escape(match),
          `<span style='color: ${role.hexColor}'>@${role.name}</span>`,
        );
      }
    }),
    ...channelMatches.map(async (match) => {
      const id = match.replace(/<#/g, '').replace(/>/g, '');
      const channel = app.client.channels.resolve(id) as GuildChannel;
      const channelName = channel?.name || 'invalid-channel';
      newContent = newContent.replace(
        escape(match),
        `<a href='dq-channel://${id}'>#${channelName}</a>`,
      );
    }),
  ]);
  return newContent;
}

/**
 * Processes MarkDown in the string.
 * @param content String to process.
 */
export function processMarkdown(content: string) {
  if (!app.config.processMarkDown) {
    return content.replace(/\n/g, '<br/>');
  }
  return MD.render(content)
    .replace(/<\/?p>/g, '')
    .split('\n')
    .map((line) => (line.startsWith('&gt; ') ? line.replace('&gt; ', '<span>▎</span>') : line))
    .join('\n')
    .trim();
}

/**
 * Replaces emoji strings with placeholder squares.
 * @param content String to process.
 */
export async function processEmojiPlaceholders(content: string): Promise<string> {
  let newContent = content;
  const uContent = unescape(content);
  const emoIds = uContent.match(EMOJI_REGEX) || [];
  const size =
    uContent
      .replace(EMOJI_REGEX, '')
      .replace(/<\/?p>/g, '')
      .trim() === ''
      ? 48
      : 24;
  for (const emo of emoIds) {
    newContent = newContent.replace(
      escape(emo),
      `<img width="${size}" height="${size}" src="${pathToFileURL(EMOJI_PLACEHOLDER)}" />`,
    );
  }
  return newContent;
}

/**
 * Replaces emoji strings with actual emoji images.
 * @param content String to process.
 */
export async function processEmojis(content: string): Promise<string> {
  let newContent = content;
  const uContent = unescape(content);
  const emoIds = uContent.match(EMOJI_REGEX) || [];
  const size =
    uContent
      .replace(EMOJI_REGEX, '')
      .replace(/<\/?p>/g, '')
      .trim() === ''
      ? 48
      : 24;
  const promises: Promise<any>[] = emoIds.map((emo) => {
    const [type, name, id] = emo.replace('<', '').replace('>', '').split(':');
    const format = type === 'a' ? 'gif' : 'png';
    return resolveEmoji({ emoji_id: id, emoji_name: name })
      .then((emojiPath) => {
        // @ts-ignore
        const uri = new URL(app.client.rest.cdn.Emoji(id, format));
        uri.searchParams.append('emoji_name', name);

        const pix = new QPixmap(emojiPath);
        const larger = pix.width() > pix.height() ? 'width' : 'height';

        newContent = newContent.replace(
          escape(emo),
          `<a href='${uri.href}'><img ${larger}=${size} src='${pathToFileURL(emojiPath)}'></a>`,
        );
      })
      .catch(() => {
        debug(`Emoji <:${name}:${id}> was not resolved.`);
      });
  });
  try {
    await Promise.all(promises);
  } catch (e) {}
  return newContent;
}

/**
 * Renders embeds in the message.
 * @param message Message to process.
 * @param item Parent widget to insert embeds into.
 */
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
    body.setMinimumSize(520, 0);
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
        pictureWorker
          .loadImage(embed.author.proxyIconURL)
          .then(
            (path) => !item.native.destroyed && auimage.setPixmap(new QPixmap(path).scaled(24, 24)),
          )
          .catch(() => {
            error(`Couldn't load avatar picture of embed ${embed.title}.`);
          });
        aulayout.addWidget(auimage);
      }
      const auname = new DLabel(body);
      auname.setObjectName('EmbedAuthorName');
      if (embed.author.url) {
        auname.setText(
          `<a style='color: white;' href='${embed.author.url}'>${embed.author.name}</a>`,
        );
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
      processMentions(description, message)
        .then((pdescription) => {
          if (!item.native.destroyed) {
            descr.setText(pdescription);
          }
        })
        .catch(() => error("Couldn't process mentions in embed description."));
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
      const image = embed.image || (embed.thumbnail as MessageEmbedImage);
      const { width, height } = getCorrectSize(image.width, image.height);
      const qImage = new QLabel(item);
      qImage.setCursor(CursorShape.PointingHandCursor);
      qImage.setFixedSize(width, height);
      qImage.setObjectName('EmbedImage');
      qImage.setInlineStyle('background-color: #2f3136');
      // body.setMaximumSize(width + 32, MAX_QSIZE);
      // @ts-ignore
      container.loadImages = async function loadImages() {
        if (item.native.destroyed || !image.proxyURL) {
          return;
        }
        try {
          const path = await pictureWorker.loadImage(image.proxyURL);
          if (item.native.destroyed) {
            return;
          }
          if (path) {
            qImage.setPixmap(new QPixmap(path).scaled(width, height, 1, 1));
          }
          qImage.setInlineStyle('background-color: transparent');
        } catch (e) {
          error(`Image in embed ${embed.title} could not be downloaded.`);
        }
      };
      layout.addWidget(qImage);
      body.adjustSize();
    }
    return container;
  });
}

/**
 * Retrieves and displays information about invitation links.
 * @param message Message to process.
 */
export async function processInvites(message: Message, msgItem: MessageItem): Promise<QWidget[]> {
  const invites = message.content.match(INVITE_REGEX) || [];
  const widgets: QWidget[] = [];
  for (const inviteLink of invites) {
    const item = new QWidget(msgItem);
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
    avatar.setFixedSize(50, 50);
    avatar.setObjectName('Icon');
    avatar.setInlineStyle('font-size: 18px;');
    avatar.setAlignment(AlignmentFlag.AlignCenter);
    const infoLayout = new QBoxLayout(Direction.TopToBottom);
    const nameLabel = new QLabel(item);
    nameLabel.setAlignment(AlignmentFlag.AlignVCenter);
    nameLabel.setObjectName('Name');
    const infoLabel = new QLabel(item);
    infoLabel.setInlineStyle('font-size: small; color: #72767d;');
    infoLayout.addStretch(1);
    infoLayout.addWidget(nameLabel);
    infoLayout.addWidget(infoLabel);
    infoLayout.addStretch(1);
    mainLayout.addWidget(avatar);
    mainLayout.addLayout(infoLayout, 1);
    layout.addWidget(helperText);
    layout.addLayout(mainLayout, 1);
    widgets.push(item);
    app.client
      .fetchInvite(inviteLink)
      .then((invite) => {
        if (msgItem.native.destroyed) {
          return;
        }
        avatar.setText(invite.guild?.nameAcronym || '');
        infoLabel.setText(`${__('TOTAL_MEMBERS')}: ${invite.memberCount}`);
        nameLabel.setText(invite.guild?.name || '');
        // @ts-ignore
        item.loadImages = async function loadImages() {
          const iconUrl = invite.guild?.iconURL({ size: 256, format: 'png' });
          if (!iconUrl) {
            return;
          }
          try {
            const path = await pictureWorker.loadImage(iconUrl);
            if (msgItem.native.destroyed) {
              return;
            }
            avatar.setPixmap(new QPixmap(path).scaled(50, 50, 1, 1));
            avatar.setObjectName('');
          } catch (e) {
            error(`Guild image in invite to "${invite.guild?.name}" could not be loaded.`);
          }
        };
      })
      .catch(error.bind("Couldn't load the invite."));
  }
  return widgets;
}

/**
 * Processes attachments in the message.
 * @param message Message to process.
 */
export function processAttachments(message: Message, item: MessageItem): QLabel[] {
  const { attachments } = message;
  return attachments.map((attach) => {
    const { width, height } = getCorrectSize(attach.width, attach.height);
    const url = `${attach.proxyURL}?width=${width}&height=${height}`;
    const isImage = PIXMAP_EXTS.includes(extname(attach.url).slice(1).toUpperCase());
    const qimage = new DLabel(item);
    qimage.setFixedSize(width, height);
    qimage.setInlineStyle('background-color: #2f3136; border-radius: 3px;');
    qimage.setCursor(CursorShape.PointingHandCursor);
    qimage.setAlignment(AlignmentFlag.AlignCenter);
    qimage.setProperty(
      'toolTip',
      `${attach.name || attach.url}<br />
    Size: ${attach.size} bytes
    ${attach.width && attach.height ? `<br />Resolution: ${attach.width}x${attach.height}` : ''}
    `,
    );
    qimage.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      void open(attach.url);
    });
    if (!isImage) {
      qimage.setPixmap(new QPixmap(join(__dirname, 'assets/icons/file.png')));
      qimage.setFixedSize(160, 80);
    } else {
      // @ts-ignore
      qimage.loadImages = async function loadImages() {
        if (!isImage) {
          return;
        }
        try {
          const image = await pictureWorker.loadImage(url);
          if (item.native.destroyed) {
            return;
          }
          qimage.setPixmap(new QPixmap(image));
          qimage.setInlineStyle('background-color: transparent');
        } catch (e) {
          error(`Image attachment in message ${message.id} could not be loaded.`);
        }
      };
    }
    return qimage;
  });
}
