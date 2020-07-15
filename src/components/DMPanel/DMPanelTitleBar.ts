import { DLineEdit } from "../DLineEdit/DLineEdit";
import { DTitleBar } from "../DTitleBar/DTitleBar";

export class DMPanelTitleBar extends DTitleBar {
  filterInput = new DLineEdit();

  constructor() {
    super();

    this.setInlineStyle('background-color: #2f3136');
    this.controls.setContentsMargins(10, 10, 10, 10);
    this.filterInput.setPlaceholderText('Find or start a conversation');
    this.controls.addWidget(this.filterInput);
  }
}