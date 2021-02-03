import {
  Direction,
  QBoxLayout,
  QLabel,
  QListWidget,
  QMenu,
  QPoint,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { app, MAX_QSIZE } from '../..';
import { createLogger } from '../../utilities/Console';
import { __ } from '../../utilities/StringProvider';
import { DColorButton } from '../DColorButton/DColorButton';
import { DColorButtonColor } from '../DColorButton/DColorButtonColor';
import { DLineEdit } from '../DLineEdit/DLineEdit';

const { error } = createLogger('RecipientPopup');

export class RecipientPopup extends QMenu {
  private controls = new QBoxLayout(Direction.TopToBottom);

  private title = new QLabel(this);

  private description = new QLabel(this);

  private search = new DLineEdit(this);

  private addBtn = new DColorButton(DColorButtonColor.BLURPLE);

  private friendList = new QListWidget(this);

  private p0 = new QPoint(0, 0);

  private p?: QPoint;

  constructor(parent?: any) {
    super(parent);

    this.initComponent();

    this.addEventListener(WidgetEventTypes.Resize, () => {
      if (!this.isVisible() || !this.p) {
        return;
      }

      this.realign();
    });
  }

  private initComponent() {
    const { title, description, search, addBtn, friendList, controls } = this;

    this.setMinimumSize(250, 0);
    this.setMaximumSize(MAX_QSIZE, MAX_QSIZE);
    this.setObjectName('RecipientPopup');

    title.setObjectName('Header2');
    title.setText(__('SELECT_FRIENDS'));

    description.setObjectName('Label');
    description.setText(
      __('ADD_X_MORE_FRIENDS', {
        num: 9,
      })
    );

    search.setPlaceholderText(__('TYPE_USERNAME_OF_FRIEND'));

    addBtn.setText(__('ADD'));

    const searchLayout = new QBoxLayout(Direction.LeftToRight);

    searchLayout.addWidget(search);
    searchLayout.addWidget(addBtn);

    controls.addWidget(title);
    controls.addWidget(description);
    controls.addLayout(searchLayout);
    controls.addWidget(friendList);

    this.setLayout(controls);
  }

  private realign(p = this.p) {
    if (!p) {
      return this.p0;
    }

    const { window: w } = app;
    const tsize = this.size();
    const wp0 = w.mapToGlobal(this.p0);
    const wSize = w.size();
    const point = p;
    const diff = new QPoint(
      wp0.x() + wSize.width() - p.x() - tsize.width(),
      wp0.y() + wSize.height() - p.y() - tsize.height()
    );

    if (diff.x() < 0) {
      point.setX(point.x() + diff.x());
    }

    if (diff.y() < 0) {
      point.setY(point.y() + diff.y());
    }

    this.move(point.x(), point.y());

    return point;
  }

  popup(p: QPoint) {
    this.p = p;
    super.popup(this.realign());
  }

  static updateFriends() {
    error('Please wait for relationships to be implemented before using this feature.');
  }
}
