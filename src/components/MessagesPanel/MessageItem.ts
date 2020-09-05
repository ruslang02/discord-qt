import { AlignmentFlag, ContextMenuPolicy, CursorShape, Direction, MouseButton, NativeElement, QAction, QApplication, QBoxLayout, QClipboardMode, QLabel, QMenu, QMouseEvent, QPixmap, QPoint, QWidget, TextInteractionFlag, WidgetEventTypes, QGridLayout } from "@nodegui/nodegui";
import { Collection, Message, MessageAttachment, Snowflake } from "discord.js";
import open from 'open';
import { URL } from 'url';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../structures/Events';
import { CancelToken } from '../../utilities/CancelToken';
import { pictureWorker } from "../../utilities/PictureWorker";
import { processEmojis, processMarkdown, processMentions, processEmbeds, processAttachments, processInvites } from './MessageUtilities';
import { MessageType } from 'discord.js';

const avatarCache = new Map<Snowflake, QPixmap>();

const MessageTypeText: Map<MessageType, string> = new Map([
  ['GUILD_MEMBER_JOIN', 'joined the server.'],
  ['RECIPIENT_ADD', 'was added to the group DM.'],
  ['RECIPIENT_REMOVE', 'was removed from the group DM.'],
  ['CALL','called.'],
  ['PINS_ADD', 'pinned a message to this channel.']
]);

export class MessageItem extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);
  private avatar = new QLabel(this);
  private userNameLabel = new QLabel(this);
  private dateLabel = new QLabel(this);
  private contentLabel = new QLabel(this);

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
      action.setText('Quote (>)');
      action.addEventListener('triggered', () => {
        app.emit(Events.QUOTE_MESSAGE_NOEMBED, this.message);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText('Quote (embed)');
      action.addEventListener('triggered', () => {
        app.emit(Events.QUOTE_MESSAGE_EMBED, this.message);
      });
      menu.addAction(action);
    }
    menu.addSeparator();
    {
      const action = new QAction(menu);
      action.setText('Copy Message');
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.cleanContent || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText('Copy Message (source)');
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.content || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText('Copy ID');
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
    contentLabel.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    contentLabel.setAlignment(AlignmentFlag.AlignVCenter);
    contentLabel.setWordWrap(true);
    contentLabel.setCursor(CursorShape.IBeamCursor);
    contentLabel.setContextMenuPolicy(ContextMenuPolicy.NoContextMenu);
    contentLabel.addEventListener(WidgetEventTypes.HoverLeave, () => contentLabel.setProperty('toolTip', ''));
    contentLabel.addEventListener('linkActivated', (link) => {
      const url = new URL(link);
      if (url.hostname === 'discord.gg') app.window.dialogs.acceptInvite.checkInvite(link)
      else open(link);
    })
    contentLabel.addEventListener('linkHovered', (link: string) => {
      try {
        const uri = new URL(link);
        const name = uri.searchParams.get('emojiname');
        if (name) contentLabel.setProperty('toolTip', `:${name}:`);
      } catch (e) { }
    });

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
      content = await processMentions(content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      content = await processEmojis(content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      contentLabel.setText('<style>* {vertical-align: middle;} img {max-height: 24px; max-width: 24px;}</style>' + content);
    }
    if (token?.cancelled) return;
    [
      ...processAttachments(message.attachments),
      ...processEmbeds(message),
      ...await processInvites(message)
    ].forEach(w => this.msgLayout.addWidget(w));
  }

  private loadSystemMessage(message: Message) {
    let content = MessageTypeText.get(message.type) || message.type;
    this.dateLabel.hide();
    this.contentLabel.setText('<i>&nbsp;</i>' + content);
    this.msgLayout.setDirection(Direction.LeftToRight);
  }
}