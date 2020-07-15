import { QWidget, QBoxLayout, Direction } from "@nodegui/nodegui";
import './DMView.scss';
import { DMTitleBar } from "../../components/DMTitleBar/DMTitleBar";

export class DMView extends QWidget {
  private titleBar = new DMTitleBar();
  private root = new QWidget();
  private channelView = new QWidget();
  private membersPanel = new QWidget();

  private controls = new QBoxLayout(Direction.TopToBottom);
  private rootControls = new QBoxLayout(Direction.LeftToRight);

  constructor() {
    super();
    this.initView();
  }

  initView() {
    const { titleBar, channelView, membersPanel, controls, root, rootControls } = this;
    this.setLayout(controls);
    this.setObjectName("DMView");
    root.setLayout(rootControls);
    root.setObjectName('DMViewRoot');

    controls.addWidget(titleBar, 0);
    controls.addWidget(root, 1);

    rootControls.addWidget(channelView, 1);
    rootControls.addWidget(membersPanel, 0);
  }
}