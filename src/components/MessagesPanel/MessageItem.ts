import {
  AlignmentFlag,
  ContextMenuPolicy,
  CursorShape,
  Direction,
  FocusReason,
  Key,
  KeyboardModifier,
  MouseButton,
  NativeElement,
  QAction,
  QBoxLayout,
  QClipboardMode,
  QKeyEvent,
  QLabel,
  QMenu,
  QMouseEvent,
  QPixmap,
  QPoint,
  QWidget,
  WidgetAttribute,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Message, Snowflake } from 'discord.js';
import { app } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events } from '../../utilities/Events';
import { PhraseID } from '../../utilities/PhraseID';
import { pictureWorker } from '../../utilities/PictureWorker';
import { __ } from '../../utilities/StringProvider';
import { DLabel } from '../DLabel/DLabel';
import { DTextEditMultiline } from '../DTextEdit/DTextEditMultiline';
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

    this.setAttribute(WidgetAttribute.WA_DeleteOnClose, true);
    this.setObjectName('MessageItem');
    this.setLayout(this.controls);
    this.initComponent();
    this.initMenu();
  }

  /**
   * Add an entry to the context menu
   */
  private addMenuEntry(text: string, callback: () => void) {
    const { menu } = this;
    const action = new QAction(menu);

    action.setText(text);
    action.addEventListener('triggered', callback);
    menu.addAction(action);

    return action;
  }

  /**
   * Initializes the context menu of the message.
   */
  private initMenu() {
    const { menu } = this;

    menu.setCursor(CursorShape.PointingHandCursor);

    const editMessage = this.addMenuEntry(__('EDIT_MESSAGE'), () => this.triggerEdit());

    this.addMenuEntry(__('QUOTE'), () => {
      if (this.message) {
        app.emit(Events.QUOTE_MESSAGE, this.message);
      }
    });

    const deleteMessage = this.addMenuEntry(__('DELETE_MESSAGE'), async () => {
      await this.message?.delete();
      this.hide();
    });

    menu.addSeparator();

    this.addMenuEntry(__('COPY_TEXT'), () => {
      app.clipboard.setText(this.message?.cleanContent || '', QClipboardMode.Clipboard);
    });

    this.addMenuEntry(`${__('COPY_TEXT')} (source)`, () => {
      app.clipboard.setText(this.message?.content || '', QClipboardMode.Clipboard);
    });

    this.addMenuEntry(__('COPY_MESSAGE_LINK'), () => {
      const channelType =
        this.message?.channel.type === 'dm' ? '@me' : this.message?.channel.guild.id;

      const txt = `https://discord.com/channels/${channelType}/${this.message?.channel.id}/${this.message?.id}`;

      app.clipboard.setText(txt, QClipboardMode.Clipboard);
    });

    this.addMenuEntry(__('COPY_ID'), () => {
      app.clipboard.setText(this.message?.id || '', QClipboardMode.Clipboard);
    });

    this.contentLabel.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.contentLabel.addEventListener('customContextMenuRequested', ({ x, y }) => {
      const map = this.contentLabel.mapToGlobal(this.p0);

      deleteMessage.setProperty('visible', this.message?.deletable ?? false);
      editMessage.setProperty('visible', this.message?.editable ?? false);
      menu.popup(new QPoint(map.x() + x, map.y() + y));
    });
  }

  private triggerEdit() {
    const editField = new DTextEditMultiline();
    const cancelAction = new DLabel();
    const saveAction = new DLabel();
    const actionsLayout = new QBoxLayout(Direction.LeftToRight);

    const hide = () => {
      this.msgLayout.removeWidget(editField);
      this.contentLabel.show();
      editField.close();
      cancelAction.close();
      saveAction.close();
    };

    const edit = () => {
      this.message
        ?.edit(editField.toPlainText())
        .then((msg) => {
          void this.loadMessage(msg);
        })
        .catch(error.bind(this, 'Failed to edit the message.'));
    };

    actionsLayout.setSpacing(5);
    this.contentLabel.hide();
    editField.setText(this.message?.content || '');
    editField.addEventListener(WidgetEventTypes.KeyPress, (e) => {
      const event = new QKeyEvent(e as NativeElement);

      if (event.key() === Key.Key_Escape) {
        hide();
      }

      if (
        event.key() === Key.Key_Return &&
        (event.modifiers() & KeyboardModifier.ShiftModifier) === KeyboardModifier.ShiftModifier
      ) {
        edit();
        hide();
      }
    });

    cancelAction.setText(`<a href='#'>${__('EDIT_TEXTAREA_HELP_CANCEL')}</a> (escape)`);
    saveAction.setText(` • <a href='#'>${__('EDIT_TEXTAREA_HELP_SAVE')}</a> (shift+enter)`);
    cancelAction.addEventListener('linkActivated', () => {
      hide();
    });

    saveAction.addEventListener('linkActivated', () => {
      edit();
      hide();
    });

    actionsLayout.addWidget(cancelAction);
    actionsLayout.addWidget(saveAction);
    actionsLayout.addStretch(1);
    cancelAction.setWordWrap(false);
    saveAction.setWordWrap(false);

    this.msgLayout.addWidget(editField);
    this.msgLayout.addLayout(actionsLayout);

    editField.setFocus(FocusReason.TabFocusReason);
  }

  private p0 = new QPoint(0, 0);

  private initComponent() {
    const { controls, avatar, unameLabel, dateLabel, contentLabel, msgLayout, infoLayout } = this;

    controls.setContentsMargins(16, 4, 16, 4);
    controls.setSpacing(10);

    avatar.setObjectName('Avatar');
    avatar.setMinimumSize(48, 0);
    avatar.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    avatar.setAlignment(AlignmentFlag.AlignTop);
    avatar.setCursor(CursorShape.PointingHandCursor);
    avatar.addEventListener('customContextMenuRequested', ({ x, y }) => {
      if (!this.message) {
        return;
      }

      app.emit(
        Events.OPEN_USER_MENU,
        this.message.member || this.message.author,
        avatar.mapToGlobal(new QPoint(x, y))
      );
    });

    avatar.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
      const ev = new QMouseEvent(e as NativeElement);

      if (ev.button() === MouseButton.LeftButton) {
        this.handleUserClick();
      }
    });

    if (!app.config.get('enableAvatars')) {
      avatar.hide();
    }

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
    if (!this.message) {
      return;
    }

    const { avatar } = this;
    const map = avatar.mapToGlobal(this.p0);

    map.setX(map.x() + avatar.size().width());
    app.emit(Events.OPEN_USER_PROFILE, this.message.author.id, this.message.guild?.id, map);
  }

  private alreadyRendered = false;

  /**
   * Loads all images in the message.
   */
  renderImages() {
    const { message } = this;

    if (!message || this.alreadyRendered) {
      return;
    }

    // @ts-ignore
    this.msgLayout.nodeChildren.forEach((w) => w.loadImages && w.loadImages());

    if (this.contentNoEmojis) {
      processEmojis(this.contentNoEmojis, this)
        .then(
          (content) =>
            !this.native.destroyed && this.contentLabel.setText(content.replace(/\n/g, '<br />'))
        )
        .catch(error.bind(error, "Couldn't load emoji."));
    }

    this.alreadyRendered = true;
    void this.loadAvatar();
  }

  /**
   * Loads user avatar asynchronously.
   */
  async loadAvatar() {
    const { message, avatar } = this;

    if (!message || this.native.destroyed || avatar.native.destroyed) {
      return;
    }

    const cachePixmap = avatarCache.get(message.author.id);

    if (cachePixmap) {
      avatar.setPixmap(cachePixmap);

      return;
    }

    try {
      const image = await pictureWorker.loadImage(
        message.author.displayAvatarURL({ format: 'png', size: 256 })
      );

      if (this.native.destroyed || avatar.native.destroyed) {
        return;
      }

      const pixmap = new QPixmap(image).scaled(40, 40, 1, 1);

      avatar.setPixmap(pixmap);
      avatarCache.set(message.author.id, pixmap);
    } catch (e) {
      error(`Couldn't load avatar image for user ${message.author.tag}`);
    }
  }

  /**
   * Populates the message widget with message data.
   * @param message Message to process.
   */
  async loadMessage(message: Message): Promise<MessageItem> {
    const { unameLabel: userNameLabel, dateLabel, contentLabel } = this;
    const user = message.author;
    const member = message.guild?.members.cache.get(user.id);

    this.message = message;
    userNameLabel.setText(member?.nickname || user.username);
    dateLabel.setText(message.createdAt.toLocaleString());

    if (message.system && message.type !== undefined) {
      this.loadSystemMessage(message);
    } else if (message.content.trim() === '') {
      contentLabel.hide();
    } else {
      let { content } = message;

      content = await processMarkdown(content);
      content = await processMentions(content, message);
      this.contentNoEmojis = content;
      content = await processEmojiPlaceholders(content);

      if (this.native.destroyed) {
        return this;
      }

      contentLabel.setText(content.replace(/\n/g, '<br />'));
    }

    [
      ...processAttachments(message, this),
      ...processEmbeds(message, this),
      ...(await processInvites(message, this)),
    ].forEach((w) => !this.native.destroyed && this.msgLayout.addWidget(w));

    return this;
  }

  /**
   * Populates the message widget for system messages.
   * @param message Message to process.
   */
  private loadSystemMessage(message: Message) {
    const content = __(`MESSAGE_${message.type}` as PhraseID) || message.type;

    this.dateLabel.hide();
    this.contentLabel.setPlainText(`<i>&nbsp;</i>${content}`);
    this.msgLayout.setDirection(Direction.LeftToRight);
  }

  close() {
    this.hide();
    super.close();

    return true;
  }
}
