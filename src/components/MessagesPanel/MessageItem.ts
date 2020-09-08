import { AlignmentFlag, ContextMenuPolicy, CursorShape, Direction, MouseButton, NativeElement, QAction, QApplication, QBoxLayout, QClipboardMode, QLabel, QMenu, QMouseEvent, QPixmap, QPoint, QWidget, WidgetEventTypes } from "@nodegui/nodegui";
import { Message, Snowflake } from "discord.js";
import { __ } from "i18n";
import { app } from '../..';
import { Events } from '../../structures/Events';
import { CancelToken } from '../../utilities/CancelToken';
import { pictureWorker } from "../../utilities/PictureWorker";
import { DLabel } from "../DLabel/DLabel";
import { processAttachments, processEmbeds, processEmojis, processInvites, processMarkdown, processMentions } from './MessageUtilities';

const avatarCache = new Map<Snowflake, QPixmap>();

export class MessageItem extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);
  private avatar = new QLabel(this);
  private userNameLabel = new QLabel(this);
  private dateLabel = new DLabel(this);
  private contentLabel = new DLabel(this);

  private msgLayout = new QBoxLayout(Direction.TopToBottom);
  private infoLayout = new QBoxLayout(Direction.LeftToRight);

  private menu = new QMenu(this);
  private clipboard = QApplication.clipboard();

  message?: Message;

  constructor(parent?: any) {
    super(parent);

    this.setObjectName('MessageItem');
    this.setLayout(this.controls);
    this.initComponent();
    this.initMenu();
  }

  private initMenu() {
    const { menu, clipboard } = this;
    menu.setCursor(CursorShape.PointingHandCursor);
    {
      const action = new QAction(menu);
      action.setText(__('QUOTE') + ' (>)');
      action.addEventListener('triggered', () => {
        app.emit(Events.QUOTE_MESSAGE_NOEMBED, this.message);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(__('QUOTE') + ' (embed)');
      action.addEventListener('triggered', () => {
        app.emit(Events.QUOTE_MESSAGE_EMBED, this.message);
      });
      menu.addAction(action);
    }
    menu.addSeparator();
    {
      const action = new QAction(menu);
      action.setText(__('COPY_TEXT'));
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.cleanContent || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(__('COPY_TEXT') + ' (source)');
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.content || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(__('COPY_MESSAGE_LINK'));
      action.addEventListener('triggered', () => {
        clipboard.setText(`https://discord.com/channels/${this.message?.channel.type === 'dm' ? '@me' : this.message?.channel.guild.id}/${this.message?.channel.id}/${this.message?.id}`, QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(__('COPY_ID'));
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.id || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
      const ev = new QMouseEvent(e as NativeElement);
      ev.button() === MouseButton.RightButton && menu.popup(new QPoint(ev.globalX(), ev.globalY()));
    })
  }

  private p0 = new QPoint(0, 0);
  private initComponent() {
    const { controls, avatar, userNameLabel, dateLabel, contentLabel, msgLayout, infoLayout } = this;
    controls.setContentsMargins(16, 4, 16, 4);
    controls.setSpacing(10);

    avatar.setObjectName('Avatar');
    avatar.setMinimumSize(48, 0);
    avatar.setAlignment(AlignmentFlag.AlignTop);
    avatar.setCursor(CursorShape.PointingHandCursor);
    avatar.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      if (!this.message) return;
      const { miniProfile } = app.window.dialogs;
      const map = avatar.mapToGlobal(this.p0);
      map.setX(map.x() + avatar.size().width());
      miniProfile.loadProfile(this.message.member || this.message.author)
      miniProfile.popup(map);
    })
    if (!app.config.enableAvatars) avatar.hide();

    infoLayout.setSpacing(8);
    infoLayout.setContentsMargins(0, 0, 0, 0);

    msgLayout.setContentsMargins(0, 0, 0, 0);
    msgLayout.setSpacing(2);

    userNameLabel.setObjectName('UserNameLabel');
    dateLabel.setObjectName('DateLabel');

    contentLabel.setObjectName('Content');
    contentLabel.setAlignment(AlignmentFlag.AlignVCenter);
    contentLabel.setContextMenuPolicy(ContextMenuPolicy.NoContextMenu);

    infoLayout.addWidget(userNameLabel);
    infoLayout.addWidget(dateLabel, 1);

    msgLayout.addLayout(infoLayout);
    msgLayout.addWidget(contentLabel, 1);

    controls.addWidget(avatar);
    controls.addLayout(msgLayout, 1);
  }

  private alreadyRendered = false;
  async renderImages() {
    const { message, avatar } = this;
    if (!message || this.alreadyRendered) return;
    (async () => {
      const cachePixmap = avatarCache.get(message.author.id);
      if (cachePixmap) return avatar.setPixmap(cachePixmap);
      const image = await pictureWorker.loadImage(
        message.author.displayAvatarURL({ format: 'png', size: 256 })
      );
      if (image) {
        const pixmap = new QPixmap(image).scaled(40, 40, 1, 1);
        avatar.setPixmap(pixmap);
        avatarCache.set(message.author.id, pixmap);
      }
    })();
    // @ts-ignore
    this.msgLayout.nodeChildren.forEach(w => w.loadImages && w.loadImages());
    this.alreadyRendered = true;
  }

  async loadMessage(message: Message, token?: CancelToken) {
    const { userNameLabel, dateLabel, contentLabel } = this;
    const user = message.author;
    const member = message.guild?.member(user)// || await message.guild?.members.fetch({ user });
    this.message = message;
    userNameLabel.setText(member?.nickname || user.username);
    if (token?.cancelled) return;
    dateLabel.setText(message.createdAt.toLocaleString());
    if (message.system) return this.loadSystemMessage(message);
    if (message.content.trim() == "") contentLabel.hide();
    else {
      let content = message.content;
      if (token?.cancelled) return;
      content = await processMarkdown(content);
      if (token?.cancelled) return;
      content = content
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      content = await processMentions(content, message);
      content = await processEmojis(content);
      contentLabel.setText(content);
    }
    if (token?.cancelled) return;
    [
      ...processAttachments(message.attachments),
      ...processEmbeds(message),
      ...await processInvites(message)
    ].forEach(w => this.msgLayout.addWidget(w));
    return message;
  }

  private loadSystemMessage(message: Message) {
    let content = __(`MESSAGE_${message.type}`) || message.type;
    this.dateLabel.hide();
    this.contentLabel.setText('<i>&nbsp;</i>' + content);
    this.msgLayout.setDirection(Direction.LeftToRight);
  }
}