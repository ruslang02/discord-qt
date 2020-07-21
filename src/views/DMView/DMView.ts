import { QWidget, QBoxLayout, Direction } from "@nodegui/nodegui";
import './DMView.scss';
import { DMTitleBar } from "../../components/DMTitleBar/DMTitleBar";
import { MainPanel } from "../../components/MainPanel/MainPanel";

export class DMView extends QWidget {
  private titleBar = new DMTitleBar();
  private channelPanel = new MainPanel();

  private controls = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.initView();
  }

  initView() {
    const { titleBar, channelPanel, controls } = this;
    this.setLayout(controls);
    controls.setContentsMargins(0, 0, 0, 0);
    controls.setSpacing(0);
    this.setObjectName("DMView");

    controls.addWidget(titleBar, 0);
    controls.addWidget(channelPanel, 1);
    
    titleBar.raise();
  }
}