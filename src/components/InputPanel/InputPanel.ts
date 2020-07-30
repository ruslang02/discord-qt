import { QWidget, QBoxLayout, Direction, QSize, QLineEdit, QLabel, QTextEdit, WidgetEventTypes, QKeyEvent, KeyboardModifier, Key, SizeConstraint } from "@nodegui/nodegui";
import './InputPanel.scss';
import { DIconButton } from "../DIconButton/DIconButton";
import path from 'path';
import { app, MAX_QSIZE } from "../..";
import { DMChannel, Client, Channel, TextChannel, Guild } from "discord.js";
import { ViewOptions } from '../../views/ViewOptions';
import { Events } from "../../structures/Events";

export class InputPanel extends QWidget {
  channel?: TextChannel | DMChannel;
  root = new QWidget();
  rootLayout = new QBoxLayout(Direction.LeftToRight);
  private input = new QTextEdit();
  private typingLabel = new QLabel();
  constructor() {
    super();
    this.setObjectName('InputContainer');
    this.root.setObjectName('InputPanel');
    this.initComponent();
    this.setEvents();
  }

  private setEvents() {
    const { input, typingLabel } = this;
    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (!['dm', 'guild'].includes(view) || !options) return;
      const channel = options.dm || options.channel || null;
      if (!channel) return;
      this.channel = channel;
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

  private initComponent() {
    const { input, root, rootLayout, typingLabel } = this;
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    root.setLayout(rootLayout);

    this.layout?.setContentsMargins(16, 0, 16, 0)
    rootLayout.setContentsMargins(0, 0, 12, 0);
    rootLayout.setSpacing(0);
    
    const addBtn = new DIconButton({
      iconPath: path.join(__dirname, './assets/icons/plus-circle.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'Embed files'
    });
    addBtn.setFixedSize(56, 44);
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

    this.layout?.addWidget(root);
    this.layout?.addWidget(typingLabel);
  }
}