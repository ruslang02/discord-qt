import { QWidget, QBoxLayout, Direction, QSize, QLabel, QTextEdit, WidgetEventTypes, QKeyEvent, KeyboardModifier, Key, QFileDialog, FileMode, QPixmap, NativeElement, QDragMoveEvent, AlignmentFlag, QModelIndex, QMouseEvent, MouseButton, QPoint } from "@nodegui/nodegui";
import './InputPanel.scss';
import { DIconButton } from "../DIconButton/DIconButton";
import path, { basename, join, extname } from 'path';
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Client, Channel, TextChannel, Guild, User, Permissions, Emoji } from "discord.js";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { pathToFileURL, fileURLToPath } from 'url';
import { pictureWorker } from '../../utilities/PictureWorker';
import { EmojiPicker } from '../EmojiPicker/EmojiPicker';

const PIXMAP_EXTS = ["BMP", "GIF", "JPG", "JPEG", "PNG", "PBM", "PGM", "PPM", "XBM", "XPM", "SVG"];

export class InputPanel extends QWidget {
  channel?: TextChannel | DMChannel;
  root = new QWidget();
  rootLayout = new QBoxLayout(Direction.LeftToRight);
  private input = new QTextEdit();
  private typingLabel = new QLabel();

  private attachPanel = new QWidget();
  private attachLayout = new QBoxLayout(Direction.LeftToRight);
  private files = new Set<string>();

  private addBtn = new DIconButton({
    iconPath: path.join(__dirname, './assets/icons/plus-circle.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Embed files'
  });

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
      if (!['dm', 'guild'].includes(view) || !options) return;
      const channel = options.dm || options.channel || null;
      if (!channel) return;
      this.channel = channel;
      this.files.clear();
      this.renderAttachPanel();
      if (channel.type === 'text') {
        const canEmbed = !!(channel as TextChannel).permissionsFor(app.client.user as User)?.has(Permissions.FLAGS.ATTACH_FILES)
        this.addBtn.setEnabled(canEmbed);
      } else this.addBtn.setEnabled(true);
      input.setPlaceholderText(`Message ${channel.type === 'dm' ?
        `@${(<DMChannel>channel).recipient.username}` :
        `#${(<TextChannel>channel).name}`
        }`);
      // TODO: How do you make the input focus programmatically???
      setTimeout(() => {
        input.setProperty('focus', 'true');
        input.activateWindow();
        input.show();
        input.raise();
      }, 100)
    });

    app.on(Events.NEW_CLIENT, (client: Client) => {
      client.on('typingStart', (typingChannel: DMChannel | Channel, user) => {
        if (this.channel?.id !== typingChannel.id)
          return;
        typingLabel.setText(`<b>${user.username}</b> is typing...`);
        setTimeout(() => typingLabel.setText(''), 2000);
      });
    })
  }

  addFiles(files: string[]) {
    files.forEach(f => this.files.add(f));
    this.renderAttachPanel();
  }

  private renderAttachPanel() {
    const { attachLayout, attachPanel } = this;
    ([...attachLayout.nodeChildren.values()] as QWidget[]).forEach(w => { w.hide(); attachLayout.removeWidget(w); })
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
        if((event.button() & MouseButton.RightButton) === MouseButton.RightButton) {
          this.files.delete(file);
          this.renderAttachPanel();
        }
      })
      const url = pathToFileURL(file);
      if (!PIXMAP_EXTS.includes(extname(file).replace(/\./g, '').toUpperCase()))
        loadDefault();
      else pictureWorker.loadImage(url.href, { roundify: false }).then(buffer => {
        if (!buffer) return;
        const pix = new QPixmap();
        pix.loadFromData(buffer);
        if (pix.width() < 1) loadDefault();
        else attach.setPixmap(pix.scaled(120, 60, 1, 1));
      });
      attachLayout.insertWidget(attachLayout.nodeChildren.size, attach);
    }
    if (this.files.size) attachPanel.show(); else attachPanel.hide();
  }
  private p0 = new QPoint(0, 0);
  private initComponent() {
    const { input, root, rootLayout, typingLabel, attachLayout, attachPanel, addBtn } = this;
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    root.setLayout(rootLayout);

    this.layout?.setContentsMargins(16, 0, 16, 0)
    rootLayout.setContentsMargins(0, 0, 12, 0);
    rootLayout.setSpacing(0);

    addBtn.setFixedSize(56, 44);
    addBtn.addEventListener('clicked', () => {
      const dialog = new QFileDialog(this, 'Select an attachment to add');
      dialog.setFileMode(FileMode.ExistingFile);
      dialog.exec();
      dialog.selectedFiles().forEach(f => this.files.add(f));
      this.renderAttachPanel();
    })
    input.setObjectName('Input');
    const emojiBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/emoticon.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Emoji'
    });
    const emojiPicker = new EmojiPicker(this, Direction.BottomToTop);
    emojiPicker.events.on('emoji', (emoji: Emoji) => {
      this.input.insertPlainText(emoji.toString());
    });
    emojiPicker.addEventListener(WidgetEventTypes.Hide, () => emojiBtn.setIcon(emojiBtn.qiconOff));
    emojiBtn.setFixedSize(38, 44);
    emojiBtn.addEventListener('clicked', () => {
      const map = emojiBtn.mapToGlobal(this.p0);
      map.setX(map.x() - emojiPicker.size().width() + emojiBtn.size().width());
      map.setY(map.y() - emojiPicker.size().height());
      emojiPicker.popup(map);
    })
    input.setAcceptRichText(false);
    input.setMaximumSize(MAX_QSIZE, 42);
    input.setMinimumSize(0, 42);
    input.setAcceptDrops(true);
    input.addEventListener(WidgetEventTypes.DragEnter, (e) => {
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
    });
    input.addEventListener(WidgetEventTypes.KeyPress, (native) => {
      if (!native) return;
      const event = new QKeyEvent(native);
      const message = input.toPlainText();
      if (
        event.key() === Key.Key_Return &&
        (event.modifiers() & KeyboardModifier.ShiftModifier) !== KeyboardModifier.ShiftModifier &&
        message.trim() !== ''
      ) {
        if (this.channel) {
          this.channel.send(message, {
            files: [...this.files.values()].map(attachment => ({ attachment, name: basename(attachment) }))
          });
          this.files.clear();
          this.renderAttachPanel();
        }
        setTimeout(() => input.clear());
      } else
        setTimeout(() => {
          const textHeight = (input.toPlainText().split('\n').length || 1) * 24 + 18;
          const maxHeight = app.window.size().height() / 2;
          const height = Math.min(textHeight, maxHeight);
          input.setMaximumSize(MAX_QSIZE, height);
          input.setMinimumSize(0, height);
        })
    });

    rootLayout.addWidget(addBtn);
    rootLayout.addWidget(input, 1);
    rootLayout.addWidget(emojiBtn);

    typingLabel.setObjectName('TypingLabel');
    attachPanel.setLayout(attachLayout);
    attachPanel.setObjectName('AttachmentPanel');
    attachLayout.setContentsMargins(0, 5, 0, 5);
    attachLayout.addStretch(1);
    attachPanel.hide();
    this.layout?.addWidget(attachPanel);
    this.layout?.addWidget(root);
    this.layout?.addWidget(typingLabel);
  }
}