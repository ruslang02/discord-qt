import { QWidget, QBoxLayout, Direction, QSize, QLineEdit, QLabel, QTextEdit, WidgetEventTypes, QKeyEvent, KeyboardModifier, Key, SizeConstraint } from "@nodegui/nodegui";
import './InputPanel.scss';
import { DIconButton } from "../DIconButton/DIconButton";
import path from 'path';
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Client, Channel, TextChannel } from "discord.js";

export class InputPanel extends QWidget {
  channel?: TextChannel | DMChannel;
  root = new QWidget();
  rootLayout = new QBoxLayout(Direction.LeftToRight);
  private input = new QTextEdit();
  private typingLabel = new QLabel();
  constructor() {
    super();
    this.root.setObjectName('InputPanel');
    this.initComponent();
    this.setEvents();
  }

  private setEvents() {
    const { input, typingLabel } = this;
    app.on('dmOpen', (dm: DMChannel) => {
      this.channel = dm;
      input.setPlaceholderText(`Message @${dm.recipient.username}`);
      setTimeout(() => {
        input.setProperty('focus', 'true');
        input.activateWindow();
        input.show();
        input.raise();
      }, 100)
    });

    app.on('client', (client: Client) => {
      client.on('typingStart', (typingChannel: TextChannel, user) => {
        if (this.channel?.id !== typingChannel.id)
          return;
        typingLabel.setText(`<b>${user.username}</b> is typing...`);
      });
      client.on('typingStop', (typingChannel: TextChannel, user) => {
        if (this.channel?.id === typingChannel.id)
          typingLabel.setText('');
      });
    })
  }

  private initComponent() {
    const { input, root, rootLayout, typingLabel } = this;
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    root.setLayout(rootLayout);

    this.layout?.setContentsMargins(16, 0, 16, 0)
    rootLayout.setContentsMargins(0, 0, 12, 0);
    rootLayout.setSpacing(0);
    
    const addBtn = new DIconButton({
      iconPath: path.join(__dirname, '../assets/icons/plus-circle.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Embed files'
    });
    addBtn.setFixedSize(56, 44);
    input.setObjectName('Input');
    const emojiBtn = new DIconButton({
      iconPath: path.join(__dirname, '../assets/icons/emoticon.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Emoji'
    });
    emojiBtn.setFixedSize(38, 44);
    input.setAcceptRichText(false);
    input.setMaximumSize(MAX_QSIZE, 40);
    input.setMinimumSize(0, 40);
    input.addEventListener(WidgetEventTypes.KeyPress, (native) => {
      if (!native) return;
      const event = new QKeyEvent(native);
      const message = input.toPlainText();
      if (
        event.key() === Key.Key_Return &&
        (event.modifiers() & KeyboardModifier.ShiftModifier) !== KeyboardModifier.ShiftModifier &&
        message.trim() !== ''
      ) {
        if (this.channel)
          this.channel.send(message);
          setTimeout(() => input.clear());
      } else 
      setTimeout(() => {
        const height = (input.toPlainText().split('\n').length || 1) * 22 + 18;
        input.setMaximumSize(MAX_QSIZE, height);
        input.setMinimumSize(0, height);
      })
    });

    rootLayout.addWidget(addBtn);
    rootLayout.addWidget(input, 1);
    rootLayout.addWidget(emojiBtn);

    typingLabel.setObjectName('TypingLabel');

    this.layout?.addWidget(root);
    this.layout?.addWidget(typingLabel);
  }
}