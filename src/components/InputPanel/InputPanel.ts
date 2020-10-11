import {
  AlignmentFlag,
  Direction,
  FileMode,
  FocusReason,
  Key,
  KeyboardModifier,
  MouseButton,
  NativeElement,
  QBoxLayout,
  QDragMoveEvent,
  QFileDialog,
  QKeyEvent,
  QLabel,
  QMouseEvent,
  QPixmap,
  QPoint,
  QSize,
  QTextEdit,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import {
  Client,
  Constants,
  DMChannel,
  Emoji,
  Message,
  MessageEmbedOptions,
  MessageOptions,
  NewsChannel,
  Permissions,
  TextChannel,
} from 'discord.js';
import { __ } from 'i18n';
import { basename, extname, join } from 'path';
import { fileURLToPath, pathToFileURL, URL } from 'url';
import { app, MAX_QSIZE, PIXMAP_EXTS } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';
import { getEmojiURL } from '../../utilities/ResolveEmoji';
import { ViewOptions } from '../../views/ViewOptions';
import { DIconButton } from '../DIconButton/DIconButton';
import { EmojiPicker } from '../EmojiPicker/EmojiPicker';

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

  private attachPanel = new QWidget(this);

  private attachLayout = new QBoxLayout(Direction.LeftToRight);

  private emojiBtn = new DIconButton({
    iconPath: join(__dirname, './assets/icons/emoticon.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('EMOJI'),
  });

  private emojiPicker = new EmojiPicker(this, Direction.BottomToTop);

  private files = new Set<string>();

  private p0 = new QPoint(0, 0);

  private dialog = new QFileDialog(this, __('UPLOAD_A_MEDIA_FILE'));

  private addBtn = new DIconButton({
    iconPath: join(__dirname, './assets/icons/plus-circle.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('UPLOAD_A_MEDIA_FILE'),
  });

  private fileIcon = new QPixmap(join(__dirname, './assets/icons/file.png'))

  private quoteEmbed?: MessageEmbedOptions;

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
    const { input, typingLabel } = this;
    app.on(AppEvents.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) return;
      const channel = <DMChannel | undefined>options?.dm
        || <TextChannel | NewsChannel | undefined>options?.channel
        || undefined;
      if (!channel) {
        input.setPlaceholderText('');
        return;
      }
      this.channel = channel;
      this.files.clear();
      this.renderAttachPanel();
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
    });

    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants;
      client.on(Events.TYPING_START, (typingChannel, user) => {
        if (this.channel?.id !== typingChannel.id) return;
        typingLabel.setText(__('ONE_USER_TYPING', { a: user.username || '' })); // TODO: Multiple, guild typing indicators
        setTimeout(() => typingLabel.clear(), 2000);
      });
    });

    app.on(AppEvents.QUOTE_MESSAGE_NOEMBED, (message: Message) => {
      input.insertPlainText(`> ${message.cleanContent.replace(/\n/g, '\n> ')}\n${message.author.toString()}`);
      input.setFocus(FocusReason.TabFocusReason);
      this.adjustInputSize();
    });
    app.on(AppEvents.QUOTE_MESSAGE_EMBED, (message: Message) => {
      this.quoteEmbed = {
        description: message.cleanContent,
        author: {
          name: message.author.username,
          icon_url: message.author.displayAvatarURL(),
          url: `https://discordapp.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`,
        },
      };
      this.renderAttachPanel();
      input.setFocus(FocusReason.TabFocusReason);
    });
  }

  /**
   * Adds attachments to the message.
   * @param files Files to add.
   */
  addFiles(files: string[]) {
    for (const file of files) this.files.add(file);
    this.renderAttachPanel();
  }

  private renderAttachPanel() {
    const { attachLayout, attachPanel, fileIcon } = this;
    (attachLayout.nodeChildren as Set<QWidget>)
      .forEach((w) => { w.hide(); attachLayout.removeWidget(w); });
    if (this.quoteEmbed) {
      const attach = new QLabel(attachPanel);
      attach.setFixedSize(120, 60);
      attach.setAlignment(AlignmentFlag.AlignCenter);
      attach.setProperty('toolTip', __('RIGHT_CLICK_REMOVE'));
      attach.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
        const event = new QMouseEvent(e as NativeElement);
        if ((event.button() & MouseButton.RightButton) === MouseButton.RightButton) {
          this.quoteEmbed = undefined;
          this.renderAttachPanel();
        }
      });
      attach.setPixmap(new QPixmap(join(__dirname, './assets/icons/reply.png')));
      attachLayout.insertWidget(attachLayout.nodeChildren.size, attach);
    }
    for (const file of this.files) {
      const attach = new QLabel(attachPanel);
      attach.setFixedSize(120, 60);
      attach.setAlignment(AlignmentFlag.AlignCenter);
      attach.setProperty('toolTip', __('RIGHT_CLICK_REMOVE'));
      attach.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
        const event = new QMouseEvent(e as NativeElement);
        if ((event.button() & MouseButton.RightButton) === MouseButton.RightButton) {
          this.files.delete(file);
          this.renderAttachPanel();
        }
      });
      const url = pathToFileURL(file);
      const ext = extname(file).replace(/\./g, '').toUpperCase();
      if (!PIXMAP_EXTS.includes(ext)) attach.setPixmap(fileIcon);
      else {
        pictureWorker.loadImage(url.href, { roundify: false })
          .then((path) => {
            const pix = new QPixmap(path);
            if (pix.width() < 1) attach.setPixmap(fileIcon);
            else attach.setPixmap(pix.scaled(120, 60, 1, 1));
          }).catch(() => {
            error(`Couldn't access file ${file}.`);
            attach.setPixmap(fileIcon);
          });
      }

      attachLayout.insertWidget(attachLayout.nodeChildren.size, attach);
    }
    if (this.files.size || this.quoteEmbed) attachPanel.show(); else attachPanel.hide();
  }

  private initComponent() {
    const {
      input,
      root,
      rootLayout,
      typingLabel,
      statusLabel,
      attachLayout,
      attachPanel,
      addBtn,
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
      dialog.exec();
      dialog.selectedFiles().forEach((f) => this.files.add(f));
      this.renderAttachPanel();
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
          this.files.add(path);
          this.renderAttachPanel();
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
    attachPanel.setLayout(attachLayout);
    attachPanel.setObjectName('AttachmentPanel');
    attachLayout.setContentsMargins(0, 5, 0, 5);
    attachLayout.addStretch(1);
    attachPanel.hide();
    this.layout?.addWidget(attachPanel);
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
        this.addFiles([fileURLToPath(url.href)]);
        this.renderAttachPanel();
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
      && (message.trim() !== '' || this.files.size !== 0)
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
    if (this.quoteEmbed) {
      await this.channel?.send({ embed: this.quoteEmbed });
    }
    this.quoteEmbed = undefined;
    const message = input.toPlainText().trim();
    setTimeout(() => {
      input.clear();
      this.adjustInputSize();
    });
    if (this.channel) {
      const msgOptions = {
        files: [...this.files.values()]
          .map((attachment) => ({ attachment, name: basename(attachment) })),
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
      this.files.clear();
      this.renderAttachPanel();
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
