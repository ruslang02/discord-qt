import { Direction, QBoxLayout, QWidget } from '@nodegui/nodegui';
import { DMTitleBar } from './DMTitleBar';
import { DMUsersList } from './DMUsersList';

export class DMPanel extends QWidget {
  private actionsMenu = new QWidget();

  private usersList = new DMUsersList();

  private titleBar = new DMTitleBar(this.usersList);

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

    controls.addWidget(titleBar);
    controls.addWidget(actionsMenu);
    controls.addWidget(usersList, 1);

    titleBar.raise();
  }
}
