import { DLineEdit } from "../DLineEdit/DLineEdit";
import { DTitleBar } from "../DTitleBar/DTitleBar";
import { DMUsersList } from './DMUsersList';

export class DMTitleBar extends DTitleBar {
  filterInput = new DLineEdit();

  constructor(usersList: DMUsersList) {
    super();
    this.setProperty('type', 'search');
    this.controls.setContentsMargins(10, 10, 10, 10);
    this.filterInput.setPlaceholderText('Find or start a conversation');
    this.filterInput.addEventListener('textEdited', (text) => {
      usersList.filter(text);
    });
    this.controls.addWidget(this.filterInput);
  }
}