import {
  AlignmentFlag,
  ContextMenuPolicy,
  CursorShape,
  Direction,
  MouseButton,
  NativeElement,
  QAction,
  QBoxLayout,
  QClipboardMode,
  QLabel,
  QMenu,
  QMouseEvent,
  QPixmap,
  QPoint,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Message, Snowflake } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';
import { DLabel } from '../DLabel/DLabel';
import {
  processAttachments,
  processEmbeds,
  processEmojiPlaceholders,
  processEmojis,
  processInvites,
  processMarkdown,
  processMentions,
} from './MessageUtilities';

const avatarCache = new Map<Snowflake, QPixmap>();
const { error } = createLogger('MessageItem');

/**
 * Represents a widget that holds one message.
 */
export class MessageItem extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);

  private avatar = new QLabel(this);

  private unameLabel = new QLabel(this);

  private dateLabel = new DLabel(this);

  private contentLabel = new DLabel(this);

  private msgLayout = new QBoxLayout(Direction.TopToBottom);

  private infoLayout = new QBoxLayout(Direction.LeftToRight);

  private menu = new QMenu(this);

  private contentNoEmojis?: string;

  message?: Message;

  constructor(parent?: any) {
    super(parent);

    this.setObjectName('MessageItem');
    this.setLayout(this.controls);
    this.initComponent();
    this.initMenu();
  }

  /**
   * Initializes the context menu of the message.
   */
  private initMenu() {
    const { menu } = this;
    menu.setCursor(CursorShape.PointingHandCursor);
    {
      const action = new QAction(menu);
      action.setText(__('QUOTE'));
      action.addEventListener('triggered', () => {
        if (this.message) app.emit(Events.QUOTE_MESSAGE, this.message);
      });
      menu.addAction(action);
    }
    menu.addSeparator();
    {
      const action = new QAction(menu);
      action.setText(__('COPY_TEXT'));
      action.addEventListener('triggered', () => {
        app.clipboard.setText(this.message?.cleanContent || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(`${__('COPY_TEXT')} (source)`);
      action.addEventListener('triggered', () => {
        app.clipboard.setText(this.message?.content || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(__('COPY_MESSAGE_LINK'));
      action.addEventListener('triggered', () => {
        app.clipboard.setText(`https://discord.com/channels/${this.message?.channel.type === 'dm' ? '@me' : this.message?.channel.guild.id}/${this.message?.channel.id}/${this.message?.id}`, QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText(__('COPY_ID'));
      action.addEventListener('triggered', () => {
        app.clipboard.setText(this.message?.id || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
      const ev = new QMouseEvent(e as NativeElement);
      if (ev.button() === MouseButton.RightButton) {
        menu.popup(new QPoint(ev.globalX(), ev.globalY()));
      }
    });
  }

  private p0 = new QPoint(0, 0);

  private initComponent() {
    const {
      controls, avatar, unameLabel, dateLabel, contentLabel, msgLayout, infoLayout,
    } = this;
    controls.setContentsMargins(16, 4, 16, 4);
    controls.setSpacing(10);

    avatar.setObjectName('Avatar');
    avatar.setMinimumSize(48, 0);
    avatar.setAlignment(AlignmentFlag.AlignTop);
    avatar.setCursor(CursorShape.PointingHandCursor);
    avatar.addEventListener(WidgetEventTypes.MouseButtonPress, this.handleUserClick.bind(this));
    if (!app.config.enableAvatars) avatar.hide();

    infoLayout.setSpacing(8);
    infoLayout.setContentsMargins(0, 0, 0, 0);

    msgLayout.setContentsMargins(0, 0, 0, 0);
    msgLayout.setSpacing(1);

    unameLabel.setObjectName('UserNameLabel');
    unameLabel.setCursor(CursorShape.PointingHandCursor);
    unameLabel.addEventListener(WidgetEventTypes.MouseButtonPress, this.handleUserClick.bind(this));
    dateLabel.setObjectName('DateLabel');
    dateLabel.setContextMenuPolicy(ContextMenuPolicy.NoContextMenu);

    contentLabel.setObjectName('Content');
    contentLabel.setAlignment(AlignmentFlag.AlignVCenter);
    contentLabel.setContextMenuPolicy(ContextMenuPolicy.NoContextMenu);

    infoLayout.addWidget(unameLabel);
    infoLayout.addWidget(dateLabel, 1);

    msgLayout.addLayout(infoLayout);
    msgLayout.addWidget(contentLabel, 1);

    controls.addWidget(avatar);
    controls.addLayout(msgLayout, 1);
  }

  /**
   * Handles user clicking the avatar or username link.
   */
  private handleUserClick() {
    if (!this.message) return;
    const { avatar } = this;
    const map = avatar.mapToGlobal(this.p0);
    map.setX(map.x() + avatar.size().width());
    app.emit(Events.OPEN_USER_PROFILE, this.message.author.id, this.message.guild?.id, map);
  }

  private alreadyRendered = false;

  /**
   * Loads all images in the message.
   */
  async renderImages() {
    const { message, avatar } = this;
    if (!message || this.alreadyRendered) return;
    (async () => {
      const cachePixmap = avatarCache.get(message.author.id);
      if (cachePixmap) {
        avatar.setPixmap(cachePixmap);
        return;
      }
      try {
        const image = await pictureWorker.loadImage(
          message.author.displayAvatarURL({ format: 'png', size: 256 }),
        );
        const pixmap = new QPixmap(image).scaled(40, 40, 1, 1);
        avatar.setPixmap(pixmap);
        avatarCache.set(message.author.id, pixmap);
      } catch (e) {
        error(`Couldn't load avatar image for user ${message.author.tag}`);
      }
    })();
    // @ts-ignore
    this.msgLayout.nodeChildren.forEach((w) => w.loadImages && w.loadImages());
    if (this.contentNoEmojis) {
      processEmojis(this.contentNoEmojis).then((content) => this.contentLabel.setText(content));
    }
    this.alreadyRendered = true;
  }

  /**
   * Populates the message widget with message data.
   * @param message Message to process.
   */
  async loadMessage(message: Message): Promise<void> {
    const { unameLabel: userNameLabel, dateLabel, contentLabel } = this;
    const user = message.author;
    const member = message.guild?.members.cache.get(user.id);
    this.message = message;
    userNameLabel.setText(member?.nickname || user.username);
    dateLabel.setText(message.createdAt.toLocaleString());
    if (message.system) this.loadSystemMessage(message);
    else if (message.content.trim() === '') contentLabel.hide();
    else {
      let { content } = message;
      content = await processMarkdown(content);
      content = await processMentions(content, message);
      this.contentNoEmojis = content;
      content = await processEmojiPlaceholders(content);
      contentLabel.setText(content);
    }
    [
      ...processAttachments(message),
      ...processEmbeds(message, this),
      ...await processInvites(message),
    ].forEach((w) => !this.native.destroyed && this.msgLayout.addWidget(w));
  }

  /**
   * Populates the message widget for system messages.
   * @param message Message to process.
   */
  private loadSystemMessage(message: Message) {
    const content = __(`MESSAGE_${message.type}`) || message.type;
    this.dateLabel.hide();
    this.contentLabel.setPlainText(`<i>&nbsp;</i>${content}`);
    this.msgLayout.setDirection(Direction.LeftToRight);
  }
}
