import {
  Direction,
  NativeElement,
  QBoxLayout,
  QLabel,
  QMouseEvent,
  QPoint,
  QSize,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { __ } from 'i18n';
import { join } from 'path';
import { DIconButton } from '../components/DIconButton/DIconButton';
import { RootWindow } from '../windows/RootWindow';

export class Dialog extends QWidget {
  protected window = new QWidget(this);

  controls = new QBoxLayout(Direction.TopToBottom);

  protected header = new QLabel(this);

  protected closeBtn = new DIconButton({
    iconPath: join(__dirname, './assets/icons/close.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: __('CLOSE'),
  });

  protected p0 = new QPoint(0, 0);

  constructor(parent?: any) {
    super(parent);

    this.setObjectName('Dialog');
    this.initDialog();
    this.addEventListener(WidgetEventTypes.MouseButtonRelease, (e) => {
      const event = new QMouseEvent(e as NativeElement);
      const pos = this.window.mapToParent(this.p0);
      const size = this.window.size();
      if (
        event.x() < pos.x() || event.x() > pos.x() + size.width()
        || event.y() < pos.y() || event.y() > pos.y() + size.height()
      ) this.hide();
    });

    this.initEvents();
  }

  show() {
    super.show();
    this.raise();
  }

  protected initEvents() {
    (this.nodeParent as RootWindow).addEventListener(
      WidgetEventTypes.Resize,
      this.resizeToWindow.bind(this),
    );
    this.resizeToWindow();
  }

  protected resizeToWindow() {
    const size = (this.nodeParent as RootWindow).size();
    this.setGeometry(0, 0, size.width(), size.height());
  }

  protected initDialog() {
    const {
      window, header, closeBtn, controls,
    } = this;

    controls.setContentsMargins(0, 0, 0, 0);

    const hLayout = new QBoxLayout(Direction.LeftToRight);
    hLayout.addStretch(1);
    const vLayout = new QBoxLayout(Direction.TopToBottom);
    vLayout.addStretch(1);
    vLayout.addWidget(window);
    vLayout.addStretch(1);
    hLayout.addLayout(vLayout);
    hLayout.addStretch(1);

    window.setObjectName('Window');
    window.setMinimumSize(440, 200);
    window.setMaximumSize(440, 660);
    header.setObjectName('Header2');
    closeBtn.addEventListener('clicked', () => this.hide());

    const headLayout = new QBoxLayout(Direction.LeftToRight);
    headLayout.setContentsMargins(16, 16, 16, 16);
    headLayout.addWidget(header, 1);
    headLayout.addWidget(closeBtn);

    controls.addLayout(headLayout, 0);
    window.setLayout(controls);
    this.setLayout(hLayout);
  }
}
