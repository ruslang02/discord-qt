import { QBoxLayout, Direction, QWidget, QDropEvent, WidgetEventTypes, NativeElement, QUrl, QStackedWidget } from "@nodegui/nodegui";
import { MessagesPanel } from "../MessagesPanel/MessagesPanel";
import { InputPanel } from "../InputPanel/InputPanel";
import { MembersList } from '../MembersList/MembersList';

export class MainPanel extends QWidget {
  layout = new QBoxLayout(Direction.LeftToRight);
  channelLayout = new QBoxLayout(Direction.TopToBottom);
  messages = new MessagesPanel(this);
  inputPanel = new InputPanel();
  membersList = new MembersList();

  constructor() {
    super();
    
    this.setLayout(this.layout);
    this.initComponent();
  }

  private initComponent() {
    const { channelLayout, layout, messages, inputPanel, membersList } = this;
    layout.setContentsMargins(0, 0, 0, 0);
    layout.setSpacing(0);
    channelLayout.setContentsMargins(0, 0, 0, 0);
    channelLayout.setSpacing(0);
    const widget = new QWidget(this);
    widget.setLayout(new QBoxLayout(Direction.TopToBottom))
    widget.layout?.setContentsMargins(0, 0, 0, 0);
    widget.layout?.addWidget(messages, 1);
    channelLayout.addWidget(widget, 1);
    channelLayout.addWidget(inputPanel);
    layout.addLayout(channelLayout, 1);
    layout.addWidget(membersList);
    membersList.hide();
  }
}