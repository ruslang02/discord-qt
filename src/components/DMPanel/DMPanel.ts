import { QWidget, QBoxLayout, Direction } from "@nodegui/nodegui";
import { DMPanelTitleBar } from "./DMPanelTitleBar";
import './DMPanel.scss';
import { DMPanelUsersList } from "./DMPanelUsersList";

export class DMPanel extends QWidget {
  private titleBar = new DMPanelTitleBar();
  private actionsMenu = new QWidget();
  private usersList = new DMPanelUsersList();
  private controls = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();

    this.initComponent();
  }

  private initComponent() {
    const { titleBar, actionsMenu, usersList, controls } = this;
    this.setLayout(controls);
    this.setObjectName('DMPanel');
    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 0);

    [titleBar, actionsMenu]
      .forEach(w => controls.addWidget(w));
    controls.addWidget(usersList, 1);

    titleBar.raise();
  }
}