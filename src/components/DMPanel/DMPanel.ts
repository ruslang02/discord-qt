import { QWidget, FlexLayout } from "@nodegui/nodegui";
import { DMPanelTitleBar } from "./DMPanelTitleBar";
import './DMPanel.scss';
import { DMPanelUsersList } from "./DMPanelUsersList";

export class DMPanel extends QWidget {
  private titleBar = new DMPanelTitleBar();
  private usersList = new DMPanelUsersList();
  constructor() {
    super();

    this.initComponent();
  }

  private initComponent() {
    this.setLayout(new FlexLayout());
    this.setObjectName('DMPanel');

    const { titleBar, usersList, layout } = this;
    
    [titleBar, usersList]
      .forEach(w => layout?.addWidget(w));
  }
}