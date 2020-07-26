import { QWidget, QBoxLayout, Direction, QLabel, QPixmap, AlignmentFlag, CursorShape, WidgetEventTypes, TextInteractionFlag } from "@nodegui/nodegui";
import { Message, Collection, MessageAttachment } from "discord.js";
import { pictureWorker } from "../../utilities/PictureWorker";
import open from 'open';
import markdownIt from 'markdown-it';
import { CancelToken } from '../../utilities/CancelToken';
import { app } from '../..';

const EMOJI_REGEX = /<a?:\w+:[0-9]+>/g;

export class MessageItem extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);
  private avatar = new QLabel();
  private userNameLabel = new QLabel();
  private dateLabel = new QLabel();
  private contentLabel = new QLabel();

  private msgContainer = new QWidget();
  private msgLayout = new QBoxLayout(Direction.TopToBottom);

  private infoContainer = new QWidget();
  private infoLayout = new QBoxLayout(Direction.LeftToRight);

  private markdownProcessor = markdownIt({
    html: false,
    linkify: true,
    breaks: true
  }).disable(['hr', 'blockquote', 'lheading']).enable('link');

  constructor(parent: any) {
    super(parent);

    this.setObjectName('MessageItem');
    this.setLayout(this.controls);
    this.initComponent();
  }

  private initComponent() {
    const { controls, avatar, userNameLabel, dateLabel, contentLabel, msgContainer, msgLayout, infoContainer, infoLayout } = this;
    controls.setContentsMargins(16, 4, 16, 4);
    controls.setSpacing(16);

    avatar.setObjectName('Avatar');
    avatar.setAlignment(AlignmentFlag.AlignTop);
    if (!app.config.enableAvatars) avatar.hide();

    infoLayout.setSpacing(8);
    infoLayout.setContentsMargins(0, 0, 0, 0);

    msgLayout.setContentsMargins(0, 0, 0, 0);
    msgLayout.setSpacing(2);

    userNameLabel.setObjectName('UserNameLabel');
    dateLabel.setObjectName('DateLabel');

    contentLabel.setObjectName('Content');
    contentLabel.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    contentLabel.setAlignment(AlignmentFlag.AlignVCenter);
    contentLabel.setOpenExternalLinks(true);
    contentLabel.setWordWrap(true);
    contentLabel.addEventListener(WidgetEventTypes.HoverLeave, () => contentLabel.setProperty('toolTip', ''));

    infoContainer.setLayout(infoLayout);
    msgContainer.setLayout(msgLayout);

    infoLayout.addWidget(userNameLabel);
    infoLayout.addWidget(dateLabel, 1);

    msgLayout.addWidget(infoContainer);
    msgLayout.addWidget(contentLabel, 1);

    controls.addWidget(avatar);
    controls.addWidget(msgContainer, 1);
  }

  private async processEmojis(content: string): Promise<string> {
    const { contentLabel } = this;
    const emoIds = content.match(EMOJI_REGEX) || [];
    const size = content.replace(EMOJI_REGEX, '').replace(/<\/?p>/g, '').trim() === '' ? 32 : 32;
    for (const emo of emoIds) {
      const [type, name, id] = emo.replace('<', '').replace('>', '').split(':');
      const format = type === 'a' ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${id}.${format}`;
      const buffer = await pictureWorker.loadImage(url, {roundify: false, format, size: 32});
      if(!buffer) continue;

      content = content.replace(emo, `<a href='${url}'><img width=${size} src='data:image/${format};base64,${buffer.toString('base64')}'></a>`);
      contentLabel.addEventListener('linkHovered', (link: string) => {
        if (link === url) contentLabel.setProperty('toolTip', `:${name}:`);
      })
    }
    return content;
  }

  private async processAttachments(attachments: Collection<string, MessageAttachment>) {
    for (const attach of attachments.values()) {
      const qimage = new QLabel();
      const pixmap = new QPixmap();

      let url = attach.proxyURL;
      let width = attach.width;
      let height = attach.height;
      if(width === null || height === null) continue;
      const ratio = width / height;

      if(width > 400) {
        width = 400;
        height = width / ratio;
      }
      if(height > 300) {
        height = 300;
        width = height * ratio;
      }
      width = Math.ceil(width);
      height = Math.ceil(height);
      url += `?width=${width}&height=${height}`;
      const image = await pictureWorker.loadImage(url);
      if(!image) return;
      pixmap.loadFromData(image);
      qimage.setCursor(CursorShape.PointingHandCursor);
      qimage.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
        open(attach.url);
      })
      qimage.setPixmap(pixmap);
      this.msgLayout.addWidget(qimage);
    }
  }

  private async processMarkdown(content: string) {
    if (!app.config.processMarkDown) return content.replace(/\n/g, '<br/>');
    const { markdownProcessor } = this;
    content = content
      .replace(/<\/?p>/g, '')
      .split('\n')
      .map(line => line.startsWith("> ") ? line.replace("> ", "<span>▎</span>") : line)
      .join('\n')
      .trim();
    return markdownProcessor.render(content);
  }

  async loadMessage(message: Message, token?: CancelToken) {
    const { avatar, userNameLabel, dateLabel, contentLabel } = this;
    userNameLabel.setText(message.member?.nickname || message.author.username);
    if(token?.cancelled) return;
    dateLabel.setText(message.createdAt.toLocaleString());
    contentLabel.setCursor(CursorShape.IBeamCursor);
    if (message.content.trim() == "")
      contentLabel.hide();
    else {
      let content = message.content;
      if(token?.cancelled) return;
      content = await this.processMarkdown(content);
      if(token?.cancelled) return;
      content = await this.processEmojis(content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      contentLabel.setText('<style>* {vertical-align: middle;}</style>' + content);
    }
    if(token?.cancelled) return;
    await this.processAttachments(message.attachments);
    if(token?.cancelled) return;
    if (!app.config.enableAvatars) return;
    const image = await pictureWorker.loadImage(message.author.avatarURL({format: 'png', size: 64}) || message.author.defaultAvatarURL, {size: 64});
    if (image) {
      const pixmap = new QPixmap();
      if(token?.cancelled) return;
      pixmap.loadFromData(image);
      avatar.setPixmap(pixmap.scaled(40, 40, 1, 1));
    }
  }
}