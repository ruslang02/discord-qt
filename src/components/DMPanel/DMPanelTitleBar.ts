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
    shadow.setBlurRadius(6);
    shadow.setColor(new QColor('rgb(6,6,6)'));
    shadow.setXOffset(-2);
    shadow.setYOffset(-1);

    this.setGraphicsEffect(shadow);
  }
}