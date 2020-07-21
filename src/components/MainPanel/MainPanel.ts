import { QBoxLayout, Direction, QWidget, QScrollArea, QLabel } from "@nodegui/nodegui";
import { MessagesPanel } from "../MessagesPanel/MessagesPanel";
import { InputPanel } from "../InputPanel/InputPanel";
import { MembersList } from '../MembersList/MembersList';

export class MainPanel extends QWidget {
  layout = new QBoxLayout(Direction.LeftToRight);
  channelPanel = new QWidget();
  channelLayout = new QBoxLayout(Direction.TopToBottom);
  messages = new MessagesPanel();
  inputPanel = new InputPanel();
  membersList = new MembersList();

  constructor() {
    super();

    this.setLayout(this.layout);
    this.initComponent();
  }

  private initComponent() {
    const { channelLayout, channelPanel, layout, messages, inputPanel, membersList } = this;
    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);
    channelLayout.setContentsMargins(0, 0, 0, 0);
    channelLayout.setSpacing(0);
    channelLayout.addWidget(messages, 1);
    channelLayout.addWidget(inputPanel);
    channelPanel.setLayout(channelLayout);
    layout.addWidget(channelPanel, 1);
    layout.addWidget(membersList);
    membersList.hide();
  }
}