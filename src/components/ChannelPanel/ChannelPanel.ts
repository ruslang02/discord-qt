import { QBoxLayout, Direction, QWidget, QScrollArea, QLabel } from "@nodegui/nodegui";
import { MessagesPanel } from "../MessagesPanel/MessagesPanel";
import { InputPanel } from "../InputPanel/InputPanel";

export class ChannelPanel extends QWidget {
  controls = new QBoxLayout(Direction.TopToBottom);
  messages = new MessagesPanel();
  inputPanel = new InputPanel();

  constructor() {
    super();

    this.setLayout(this.controls);
    this.initComponent();
  }

  private initComponent() {
    const { controls: layout, messages, inputPanel } = this;
    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);
    layout.addWidget(messages, 1);
    layout.addWidget(inputPanel);
  }
}