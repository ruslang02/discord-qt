import { QWidget, QLineEdit, QGraphicsDropShadowEffect, QColor, FlexLayout } from "@nodegui/nodegui";

export class DMPanelTitleBar extends QWidget {
  filterInput = new QLineEdit();
  shadow = new QGraphicsDropShadowEffect();

  constructor() {
    super();
    this.setLayout(new FlexLayout())
    this.setObjectName('TitleBar');

    this.initInput();
    this.initShadow();
  }

  initInput() {
    const { filterInput: input } = this;
    input.setObjectName('UserFilterInput');
    input.setPlaceholderText('Find or start a conversation');

    this.layout?.addWidget(this.filterInput);
  }

  initShadow() {
    const { shadow } = this;
    shadow.setBlurRadius(5);
    shadow.setColor(new QColor(12, 12, 12, 255));
    shadow.setXOffset(-2);
    shadow.setYOffset(0);

    this.setGraphicsEffect(shadow);
  }
}