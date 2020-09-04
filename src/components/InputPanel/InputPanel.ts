import { QWidget, QBoxLayout, Direction, QSize, QLabel, QTextEdit, WidgetEventTypes, QKeyEvent, KeyboardModifier, Key, QFileDialog, FileMode, QPixmap, NativeElement, QDragMoveEvent, AlignmentFlag, QMouseEvent, MouseButton, QPoint, FocusReason } from "@nodegui/nodegui";
import path, { basename, join, extname } from 'path';
import { pathToFileURL, fileURLToPath, URL } from 'url';
import { DMChannel, Client, Channel, TextChannel, User, Permissions, Emoji, Constants, MessageOptions } from "discord.js";
import { DIconButton } from "../DIconButton/DIconButton";
import { app, MAX_QSIZE } from "../..";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { pictureWorker } from '../../utilities/PictureWorker';
import { EmojiPicker } from '../EmojiPicker/EmojiPicker';
import { Message } from 'discord.js';
import { MessageEmbedOptions } from 'discord.js';


const PIXMAP_EXTS = ["BMP", "GIF", "JPG", "JPEG", "PNG", "PBM", "PGM", "PPM", "XBM", "XPM", "SVG"];

export class InputPanel extends QWidget {
  channel?: TextChannel | DMChannel;
  root = new QWidget(this);
  rootLayout = new QBoxLayout(Direction.LeftToRight);
  private input = new QTextEdit(this);
  private typingLabel = new QLabel(this);
  private statusLabel = new QLabel(this);

  private attachPanel = new QWidget(this);
  private attachLayout = new QBoxLayout(Direction.LeftToRight);
  private emojiBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/emoticon.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Emoji'
  });
  private emojiPicker = new EmojiPicker(this, Direction.BottomToTop);
  private files = new Set<string>();

  private p0 = new QPoint(0, 0);
  private dialog = new QFileDialog(this, 'Select an attachment to add');

  private addBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/plus-circle.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Embed files'
  });

  private quoteEmbed?: MessageEmbedOptions;

  constructor() {
    super();
    this.setObjectName('InputContainer');
    this.root.setObjectName('InputPanel');
    this.initComponent();
    this.setEvents();
    this.setAcceptDrops(true);
  }

  private setEvents() {
    const { input, typingLabel } = this;
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view)) return;
      const channel = options?.dm || options?.channel || null;
      if (!channel) return input.setPlaceholderText('');
      this.channel = channel;
      this.files.clear();
      this.renderAttachPanel();
      if (channel.type === 'text') {
        const canEmbed = !!(channel as TextChannel).permissionsFor(app.client.user as User)?.has(Permissions.FLAGS.ATTACH_FILES)
        this.addBtn.setEnabled(canEmbed);
      } else this.addBtn.setEnabled(true);
      input.setPlaceholderText(
        `Message ${channel.type === 'dm' ?
          `@${(<DMChannel>channel).recipient.username}` :
          `#${(<TextChannel>channel).name}`
        }`
      );

      input.setFocus(FocusReason.TabFocusReason);
    });

    app.on(Events.NEW_CLIENT, (client: Client) => {
      const { Events: DEvents } = Constants;
      client.on(DEvents.TYPING_START, (typingChannel: DMChannel | Channel, user) => {
        if (this.channel?.id !== typingChannel.id) return;
        typingLabel.setText(`<b>${user.username}</b> is typing...`); // TODO: Multiple, guild typing indicators
        setTimeout(() => typingLabel.clear(), 2000);
      });
    });

    app.on(Events.QUOTE_MESSAGE_NOEMBED, (message: Message) => {
      this.input.insertPlainText(`> ${message.cleanContent.replace(/\n/g, '\n> ')}\n${message.author.toString()}`);
      this.input.setFocus(FocusReason.TabFocusReason);
    });
    app.on(Events.QUOTE_MESSAGE_EMBED, (message: Message) => {
      this.quoteEmbed = {
        description: message.cleanContent,
        author: {
          name: message.author.username,
          icon_url: message.author.displayAvatarURL(),
          url: `https://discordapp.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`
        }
      };
      this.renderAttachPanel();
      this.input.setFocus(FocusReason.TabFocusReason);
    });
  }

  addFiles(files: string[]) {
    for (const file of files) this.files.add(file);
    this.renderAttachPanel();
  }

  private renderAttachPanel() {
    const { attachLayout, attachPanel } = this;
    ([...attachLayout.nodeChildren.values()] as QWidget[]).forEach(w => { w.hide(); attachLayout.removeWidget(w); })
    if (this.quoteEmbed) {
      const attach = new QLabel(attachPanel);
      attach.setFixedSize(120, 60);
      attach.setAlignment(AlignmentFlag.AlignCenter);
      attach.setProperty('toolTip', 'Right-click to remove');
      attach.addEventListener(WidgetEventTypes.MouseButtonPress, e => {
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
      attach.setProperty('toolTip', 'Right-click to remove');
      function loadDefault() {
        attach.setPixmap(new QPixmap(join(__dirname, './assets/icons/file.png')));
      }
      attach.addEventListener(WidgetEventTypes.MouseButtonPress, e => {
        const event = new QMouseEvent(e as NativeElement);
        if ((event.button() & MouseButton.RightButton) === MouseButton.RightButton) {
          this.files.delete(file);
          this.renderAttachPanel();
        }
      })
      const url = pathToFileURL(file);
      const ext = extname(file).replace(/\./g, '').toUpperCase();
      if (!PIXMAP_EXTS.includes(ext))
        loadDefault();
      else pictureWorker.loadImage(url.href, { roundify: false }).then(path => {
        if (!path) return;
        const pix = new QPixmap(path);
        if (pix.width() < 1) loadDefault();
        else attach.setPixmap(pix.scaled(120, 60, 1, 1));
      });

      attachLayout.insertWidget(attachLayout.nodeChildren.size, attach);
    }
    if (this.files.size || this.quoteEmbed) attachPanel.show(); else attachPanel.hide();
  }

  private initComponent() {
    const { input, root, rootLayout, typingLabel, statusLabel, attachLayout, attachPanel, addBtn, dialog, emojiPicker, emojiBtn } = this;
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    root.setLayout(rootLayout);
    dialog.setFileMode(FileMode.ExistingFile);

    this.layout?.setContentsMargins(16, 0, 16, 0);
    this.layout?.setSpacing(0);
    rootLayout.setContentsMargins(0, 0, 12, 0);
    rootLayout.setSpacing(0);

    addBtn.setFixedSize(56, 44);
    addBtn.addEventListener('clicked', () => {
      dialog.exec();
      dialog.selectedFiles().forEach(f => this.files.add(f));
      this.renderAttachPanel();
    })
    input.setObjectName('Input');
    emojiPicker.events.on('emoji', (emoji: Emoji) => {
      this.input.insertPlainText(emoji.toString());
      emojiPicker.close();
      // @ts-ignore
      input.setFocus && input.setFocus(FocusReason.TabFocusReason);
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
    let ev = new QDragMoveEvent(e as NativeElement);
    try {
      let mimeData = ev.mimeData();
      if (mimeData.hasUrls()) {
        const url = new URL(mimeData.text());
        if (url.protocol !== 'file:') return;
        this.addFiles([fileURLToPath(url.href)]);
        this.renderAttachPanel();
      }
      ev.accept();
    } catch (e) { }
  }

  private handleKeyRelease(native?: any) {
    const { input } = this;
    if (!native) return;
    const event = new QKeyEvent(native);
    const message = input.toPlainText();
    if (
      event.key() === Key.Key_Return &&
      (event.modifiers() & KeyboardModifier.ShiftModifier) !== KeyboardModifier.ShiftModifier &&
      message.trim() !== ''
    ) this.sendMessage();
    else if (
      event.key() === Key.Key_E &&
      (event.modifiers() & KeyboardModifier.ControlModifier) === KeyboardModifier.ControlModifier
    ) this.handleEmojiOpen();
    else setTimeout(this.adjustInputSize.bind(this), 0);
  }

  private adjustInputSize() {
    const { input } = this;
    const textHeight = (input.toPlainText().split('\n').length || 1) * 24 + 18;
    const maxHeight = app.window.size().height() / 2;
    const height = Math.min(textHeight, maxHeight);
    input.setMaximumSize(MAX_QSIZE, height);
    input.setMinimumSize(0, height);
  }

  private async sendMessage() {
    const { input, statusLabel } = this;
    if (this.quoteEmbed) {
      await this.channel?.send({ embed: this.quoteEmbed });
    }
    this.quoteEmbed = undefined;
    const message = input.toPlainText().trim();
    setTimeout(() => input.clear(), 0);
    if (this.channel) {
      const msgOptions = {
        files: [...this.files.values()].map(attachment => ({ attachment, name: basename(attachment) }))
      };
      statusLabel.setText('Sending...');
      statusLabel.setInlineStyle('color: #dcddde');
      try {
        if (message.startsWith('/'))
          await this.execCommand(message, msgOptions);
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

  private async execCommand(message: string, msgOptions: MessageOptions) {
    if (!this.channel) return;
    const { input } = this;
    const command = message.toLowerCase().trim().slice(1).split(' ')[0];
    message = message.replace(`/${command}`, '').trim();
    switch (command) {
      case 'shrug':
        return this.channel.send(`${message} ¯\\_(ツ)_/¯`, msgOptions);
      case 'tableflip':
        return this.channel.send(`${message} (╯°□°）╯︵ ┻━┻`, msgOptions);
      case 'unflip':
        return this.channel.send(`${message} ┬─┬ ノ( ゜-゜ノ)`, msgOptions);
      case 'me':
        return this.channel.send(`*${message}*`, msgOptions);
      default:
        return this.channel.send(input.toPlainText(), msgOptions);
    }
  }
}