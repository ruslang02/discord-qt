import { QWidget, QBoxLayout, Direction, QSize, QLineEdit, QLabel, QTextEdit, WidgetEventTypes, QKeyEvent, KeyboardModifier, Key, SizeConstraint, QFileDialog, FileMode, QPixmap, AspectRatioMode, QDropEvent, NativeElement, QDragMoveEvent, QDragLeaveEvent } from "@nodegui/nodegui";
import './InputPanel.scss';
import { DIconButton } from "../DIconButton/DIconButton";
import path, { basename } from 'path';
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Client, Channel, TextChannel, Guild, User, Permissions } from "discord.js";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";
import { pathToFileURL } from 'url';
import { pictureWorker } from '../../utilities/PictureWorker';
import { isPunctChar } from 'markdown-it/lib/common/utils';

export class InputPanel extends QWidget {
  channel?: TextChannel | DMChannel;
  root = new QWidget();
  rootLayout = new QBoxLayout(Direction.LeftToRight);
  private input = new QTextEdit();
  private typingLabel = new QLabel();

  private attachPanel = new QWidget();
  private attachLayout = new QBoxLayout(Direction.LeftToRight);
  private files: string[] = [];

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
      this.files = [];
      this.renderAttachPanel();
      if(channel.type === 'text') {
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
    this.files = [...this.files, ...files];
    this.renderAttachPanel();
  }

  private renderAttachPanel() {
    const { attachLayout, attachPanel } = this;
    ([...attachLayout.nodeChildren.values()] as QWidget[]).forEach(w => { w.hide(); attachLayout.removeWidget(w); })
    for (const file of this.files) {
      const attach = new QLabel(attachPanel);
      const url = pathToFileURL(file);
      pictureWorker.loadImage(url.href, { roundify: false }).then(buffer => {
        if (!buffer) return;
        const pix = new QPixmap();
        pix.loadFromData(buffer);
        attach.setPixmap(pix.scaled(120, 60, 1, 1));
      });
      attachLayout.insertWidget(attachLayout.nodeChildren.size, attach);
    }
    if (this.files.length) attachPanel.show(); else attachPanel.hide();
  }
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
      this.files = [...this.files, ...dialog.selectedFiles()];
      this.renderAttachPanel();
    })
    input.setObjectName('Input');
    const emojiBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/emoticon.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Emoji'
    });
    emojiBtn.setFixedSize(38, 44);
    input.setAcceptRichText(false);
    input.setMaximumSize(MAX_QSIZE, 42);
    input.setMinimumSize(0, 42);
    input.setAcceptDrops(true);
    input.addEventListener(WidgetEventTypes.DragEnter, (e) => {
      let ev = new QDragMoveEvent(e as NativeElement);
      console.log('dragEnter', ev.proposedAction());
      let mimeData = ev.mimeData();
      mimeData.text(); //Inspection of text works
      console.log('mimeData', {
        hasColor: mimeData.hasColor(),
        hasHtml: mimeData.hasHtml(),
        hasImage: mimeData.hasImage(),
        hasText: mimeData.hasText(),
        hasUrls: mimeData.hasUrls(),
        html: mimeData.html(),
        text: mimeData.text(),
      }); //Inspection of MIME data works
      let urls = mimeData.urls(); //Get QUrls
      for (let url of urls) {
        let str = url.toString();
        console.log('url', str); //Log out Urls in the event
      }
      ev.accept(); //Accept the drop event, which is crucial for accepting further events
    });
    input.addEventListener(WidgetEventTypes.DragMove, (e) => {
      let ev = new QDragMoveEvent(e as NativeElement);
      ev.accept();
      console.log('dragMove');
    });
    input.addEventListener(WidgetEventTypes.DragLeave, (e) => {
      console.log('dragLeave', e);
      let ev = new QDragLeaveEvent(e as NativeElement);
      ev.accept(); //Ignore the event when it leaves
      console.log('ignored', ev);
    });
    input.addEventListener(WidgetEventTypes.Drop, (e) => {
      let dropEvent = new QDropEvent(e as NativeElement);
      dropEvent.accept()
      let mimeData = dropEvent.mimeData();
      console.log('dropped', dropEvent.type());
      this.addFiles([...mimeData.urls().map(v => v.toString())]);
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
            files: this.files.map(attachment => ({ attachment, name: basename(attachment) }))
          });
          this.files = [];
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
    attachLayout.setContentsMargins(0, 5, 0, 5);
    attachLayout.addStretch(1);
    attachPanel.hide();
    this.layout?.addWidget(attachPanel);
    this.layout?.addWidget(root);
    this.layout?.addWidget(typingLabel);
  }
}