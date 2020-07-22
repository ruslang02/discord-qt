import { QPushButton, QBoxLayout, Direction, QLabel, AlignmentFlag, QIcon, CursorShape, QSize, QWidget } from '@nodegui/nodegui';
import { join } from 'path';

export class SettingsCheckBox extends QWidget {
  layout = new QBoxLayout(Direction.LeftToRight);
  label = new QLabel(this);
  checkbox = new QPushButton(this);
  unch = new QIcon(join(__dirname, './assets/icons/checkbox-blank-outline.png'));
  ch = new QIcon(join(__dirname, './assets/icons/checkbox-marked.png'));

  constructor(parent: any) {
    super(parent);
    this.initComponent();
    this.setChecked(false);
  }

  text() { return this.label.text(); }

  setText(text: string) {
    this.label.setText(text);
  }
  private _checked = false;

  isChecked() { return this._checked; }

  setChecked(checked: boolean) {
    this.checkbox.setIcon(checked ? this.ch : this.unch);
    this._checked = checked
  }

  private initComponent() {
    const { layout, label, checkbox } = this;
    this.setObjectName('SCheckBox');
    this.setLayout(layout);
    this.setCursor(CursorShape.PointingHandCursor);
    layout.setContentsMargins(2, 10, 2, 10);
    label.setAlignment(AlignmentFlag.AlignVCenter);
    checkbox.setObjectName('CheckBox');
    checkbox.setIconSize(new QSize(24, 24));
    layout.addWidget(label, 1);
    layout.addWidget(checkbox);
  }
}