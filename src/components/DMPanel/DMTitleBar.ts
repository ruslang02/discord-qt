import { DLineEdit } from "../DLineEdit/DLineEdit";
import { DTitleBar } from "../DTitleBar/DTitleBar";
import { DMUsersList } from './DMUsersList';
import { __ } from "i18n";

export class DMTitleBar extends DTitleBar {
  filterInput = new DLineEdit();

  constructor(usersList: DMUsersList) {
    super();
    this.setProperty('type', 'search');
    this.controls.setContentsMargins(10, 10, 10, 10);
    this.filterInput.setPlaceholderText(__('ACTIVITY_FEED_SHARE_MODAL_SEARCH_PLACEHOLDER'));
    this.filterInput.addEventListener('textEdited', (text) => {
      usersList.filter(text);
    });
    this.controls.addWidget(this.filterInput);
  }
}