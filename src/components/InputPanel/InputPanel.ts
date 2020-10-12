import {
  DialogCode,
  Direction,
  FileMode,
  FocusReason,
  Key,
  KeyboardModifier,
  NativeElement,
  QBoxLayout,
  QDragMoveEvent,
  QFileDialog,
  QKeyEvent,
  QLabel,
  QPoint,
  QSize,
  QTextEdit,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  Client,

  DMChannel,
  Emoji,
  Message,
  MessageOptions,
  NewsChannel,
  Permissions,
  TextChannel,
} from 'discord.js';
import { __ } from 'i18n';
import { join } from 'path';
import { fileURLToPath, URL } from 'url';
import { app, MAX_QSIZE } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';
import { getEmojiURL } from '../../utilities/ResolveEmoji';
import { ViewOptions } from '../../views/ViewOptions';
import { DIconButton } from '../DIconButton/DIconButton';
import { EmojiPicker } from '../EmojiPicker/EmojiPicker';
import { AttachmentsPanel } from './AttachmentsPanel';

const { error } = createLogger('InputPanel');

/**
 * Message input widget.
 */
export class InputPanel extends QWidget {
  channel?: TextChannel | DMChannel | NewsChannel;

  root = new QWidget(this);

  rootLayout = new QBoxLayout(Direction.LeftToRight);

  private input = new QTextEdit(this);

  private typingLabel = new QLabel(this);

  private statusLabel = new QLabel(this);

  private attachments = new AttachmentsPanel(this);

  private emojiBtn = new DIconButton({
    iconPath: join(__dirname, './assets/icons/emoticon.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('EMOJI'),
  });

  private emojiPicker = new EmojiPicker(this, Direction.BottomToTop);

  private p0 = new QPoint(0, 0);

  private dialog = new QFileDialog(this, __('UPLOAD_A_MEDIA_FILE'));

  private addBtn = new DIconButton({
    iconPath: join(__dirname, './assets/icons/plus-circle.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('UPLOAD_A_MEDIA_FILE'),
  });

  constructor() {
    super();
    this.setObjectName('InputContainer');
    this.root.setObjectName('InputPanel');
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    this.initComponent();
    this.setEvents();
    this.setAcceptDrops(true);
  }

  private setEvents() {
    app.on(AppEvents.SWITCH_VIEW, this.handleSwitchView.bind(this));
    app.on(AppEvents.NEW_CLIENT, this.handleClientEvents.bind(this));

    app.on(AppEvents.QUOTE_MESSAGE, this.handleQuoteMessage.bind(this));
  }

  private handleSwitchView(view: string, options?: ViewOptions) {
    const { input } = this;
    if (!['dm', 'guild'].includes(view)) return;
    const channel = <DMChannel | undefined>options?.dm
      || <TextChannel | NewsChannel | undefined>options?.channel
      || undefined;
    if (!channel) {
      input.setPlaceholderText('');
      return;
    }
    this.channel = channel;
    this.attachments.clear();
    if (channel.type === 'text') {
      this.addBtn.setEnabled(channel.can(Permissions.FLAGS.ATTACH_FILES));
    } else this.addBtn.setEnabled(true);
    input.setPlaceholderText(
      __('TEXTAREA_PLACEHOLDER', {
        channel: channel.type === 'dm'
          ? `@${(<DMChannel>channel).recipient.username}`
          : `#${(<TextChannel>channel).name}`,
      }),
    );

    input.setFocus(FocusReason.TabFocusReason);
  }

  private handleClientEvents(client: Client) {
    client.setInterval(() => this.channel && this.updateTyping(this.channel as TextChannel), 100);
  }

  private updateTyping(channel: TextChannel) {
    const { typingLabel } = this;
    if (this.channel?.id !== channel.id) return;
    const typers = [...channel._typing.values()]
      .map((e) => channel.guild.member(e.user.id)?.nickname || e.user.username)
      .filter((m) => !!m) as string[];
    let i18nString;
    switch (typers.length) {
      case 0:
        typingLabel.setText('');
        return;
      case 1:
        i18nString = 'ONE_USER_TYPING';
        break;
      case 2:
        i18nString = 'TWO_USERS_TYPING';
        break;
      case 3:
        i18nString = 'THREE_USERS_TYPING';
        break;
      default:
        i18nString = 'SEVERAL_USERS_TYPING';
    }
    typingLabel.setText(__(i18nString, { a: typers[0], b: typers[1], c: typers[2] }));
  }

  private handleQuoteMessage(message: Message) {
    const { input } = this;
    input.insertPlainText(`> ${message.cleanContent.replace(/\n/g, '\n> ')}\n${message.author.toString()}`);
    input.setFocus(FocusReason.TabFocusReason);
    this.adjustInputSize();
  }

  private initComponent() {
    const {
      input,
      root,
      rootLayout,
      typingLabel,
      statusLabel,
      addBtn,
      attachments,
      dialog,
      emojiPicker,
      emojiBtn,
    } = this;
    root.setLayout(rootLayout);
    dialog.setFileMode(FileMode.ExistingFile);

    this.layout?.setContentsMargins(16, 0, 16, 0);
    this.layout?.setSpacing(0);
    rootLayout.setContentsMargins(0, 0, 12, 0);
    rootLayout.setSpacing(0);

    addBtn.setFixedSize(56, 44);
    addBtn.addEventListener('clicked', () => {
      if (dialog.exec() === DialogCode.Accepted) this.attachments.addFiles(dialog.selectedFiles());
    });
    input.setObjectName('Input');
    emojiPicker.events.on('emoji', async (emoji: Emoji, special: boolean) => {
      if (special) {
        try {
          const url = await getEmojiURL({
            emoji_id: emoji.id || undefined,
            emoji_name: emoji.name,
          });
          const path = await pictureWorker.loadImage(url, { roundify: false });
          this.attachments.addFiles([path]);
        } catch (e) { error(e); }
      } else input.insertPlainText(emoji.toString());
      emojiPicker.close();
      input.setFocus(FocusReason.TabFocusReason);
    });
    emojiPicker.addEventListener(WidgetEventTypes.Hide, () => emojiBtn.setIcon(emojiBtn.qiconOff));
    emojiBtn.setFixedSize(38, 44);
    emojiBtn.addEventListener('clicked', this.handleEmojiOpen.bind(this));
    input.setMaximumSize(MAX_QSIZE, 42);
    input.setMinimumSize(0, 42);
    input.setAcceptDrops(true);
    input.addEventListener(WidgetEventTypes.DragEnter, this.handleDrag.bind(this));
    input.addEventListener(WidgetEventTypes.KeyRelease, this.handleKeyRelease.bind(this));

    rootLayout.addWidget(addBtn);
    rootLayout.addWidget(input, 1);
    rootLayout.addWidget(emojiBtn);

    typingLabel.setObjectName('TypingLabel');
    statusLabel.setObjectName('StatusLabel');
    const bottomLayout = new QBoxLayout(Direction.LeftToRight);
    bottomLayout.addWidget(typingLabel, 1);
    bottomLayout.addWidget(statusLabel);
    this.layout?.addWidget(attachments);
    this.layout?.addWidget(root);
    (this.layout as QBoxLayout).addLayout(bottomLayout);
  }

  private handleEmojiOpen() {
    const { emojiBtn, emojiPicker } = this;
    const map = emojiBtn.mapToGlobal(this.p0);
    map.setX(map.x() - emojiPicker.size().width() + emojiBtn.size().width());
    map.setY(map.y() - emojiPicker.size().height());
    emojiPicker.popup(map);
  }

  private handleDrag(e?: any) {
    const ev = new QDragMoveEvent(e as NativeElement);
    try {
      const mimeData = ev.mimeData();
      if (mimeData.hasUrls()) {
        const url = new URL(mimeData.text());
        if (url.protocol !== 'file:') return;
        this.attachments.addFiles([fileURLToPath(url.href)]);
      }
      ev.accept();
    } catch (ex) { }
  }

  private handleKeyRelease(native?: any) {
    const { input } = this;
    if (!native) return;
    const event = new QKeyEvent(native);
    const message = input.toPlainText();
    if (
      event.key() === Key.Key_Return
      && (event.modifiers() & KeyboardModifier.ShiftModifier) !== KeyboardModifier.ShiftModifier
      && (message.trim() !== '' || this.attachments.getFiles().length)
    ) this.sendMessage();
    else if (
      event.key() === Key.Key_E
      && (event.modifiers() & KeyboardModifier.ControlModifier) === KeyboardModifier.ControlModifier
    ) this.handleEmojiOpen();
    else setTimeout(this.adjustInputSize.bind(this), 0);
  }

  /**
   * Adjusts input's height to match the content size.
   * TODO: process wraps.
   */
  private adjustInputSize() {
    const { input } = this;
    const textHeight = (input.toPlainText().split('\n').length || 1) * 24 + 18;
    const maxHeight = app.window.size().height() / 2;
    const height = Math.min(textHeight, maxHeight);
    input.setMaximumSize(MAX_QSIZE, height);
    input.setMinimumSize(0, height);
  }

  /**
   * Sends the message.
   */
  private async sendMessage() {
    const { input, statusLabel } = this;
    const message = input.toPlainText().trim();
    setTimeout(() => {
      input.clear();
      this.adjustInputSize();
    });
    if (this.channel) {
      const msgOptions = {
        files: this.attachments.getFiles(),
      };
      statusLabel.setText(__('TWO_FA_ENTER_SMS_TOKEN_SENDING'));
      statusLabel.setInlineStyle('color: #dcddde');
      try {
        if (message.startsWith('/')) await this.execCommand(message, msgOptions);
        else {
          await this.channel.send(message, msgOptions);
        }
        statusLabel.setText('');
      } catch (e) {
        statusLabel.setInlineStyle('color: #f04747');
        statusLabel.setText(e.message);
      }
      this.attachments.clear();
    }
  }

  /**
   * Executes a special command starting with /.
   * @param content Command to process.
   * @param msgOptions Extra data to add to the Message.
   */
  private execCommand(content: string, msgOptions: MessageOptions) {
    if (!this.channel) return;
    const { input } = this;
    const command = content.toLowerCase().trim().slice(1).split(' ')[0];
    const msg = content.replace(`/${command}`, '').trim();

    switch (command) {
      case 'shrug':
        this.channel.send(`${msg} ¯\\_(ツ)_/¯`, msgOptions);
        break;
      case 'tableflip':
        this.channel.send(`${msg} (╯°□°）╯︵ ┻━┻`, msgOptions);
        break;
      case 'unflip':
        this.channel.send(`${msg} ┬─┬ ノ( ゜-゜ノ)`, msgOptions);
        break;
      case 'me':
        this.channel.send(`*${msg}*`, msgOptions);
        break;
      default:
        this.channel.send(input.toPlainText(), msgOptions);
        break;
    }
  }
}
