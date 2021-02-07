import { __ } from '../../utilities/StringProvider';
import { DLineEdit } from '../DLineEdit/DLineEdit';
import { DTitleBar } from '../DTitleBar/DTitleBar';
import { DMUsersList } from './DMList';

export class DMTitleBar extends DTitleBar {
  filterInput = new DLineEdit();

  constructor(usersList: DMUsersList) {
    super();

    this.setProperty('type', 'search');
    this.controls.setContentsMargins(10, 10, 10, 10);
    this.filterInput.setPlaceholderText(__('DM_SEARCH_PLACEHOLDER'));

    this.filterInput.addEventListener('textEdited', (text) => {
      void usersList.filter(text);
    });

    this.controls.addWidget(this.filterInput);
  }
}
