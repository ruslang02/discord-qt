import { Direction, QBoxLayout, QLabel, QWidget, WidgetEventTypes } from '@nodegui/nodegui';
import { __ } from 'i18n';
import { app, MAX_QSIZE } from '../../..';
import { createLogger } from '../../../utilities/Console';
import { IConfig } from '../../../utilities/IConfig';
import { SettingsCheckBox } from '../SettingsCheckBox';

const { debug } = createLogger('[SettingsView]');

export abstract class Page extends QWidget {
  abstract title: string;

  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.setObjectName('Page');
    this.setLayout(this.layout);
    this.setMaximumSize(740, MAX_QSIZE);
    this.layout.setContentsMargins(40, 60, 40, 80);
    this.layout.setSpacing(0);
  }

  onOpened(): void {
    debug('Opened', this.title);
  }

  onClosed(): void {
    debug('Closed', this.title);
  }

  /**
   * Add a simple checkbox to the layout
   * @param checkbox Checkbox element to add
   * @param configId Config ID controlled by the checkbox
   * @param text Text to display
   */
  protected addSimpleCheckbox(checkbox: SettingsCheckBox, configId: keyof IConfig, text: string) {
    const { layout } = this;

    checkbox.setText(text);
    checkbox.addEventListener(WidgetEventTypes.MouseButtonRelease, () => {
      const checked = checkbox.isChecked();

      checkbox.setChecked(!checked);

      app.config.set(configId, !checked);
      void app.config.save();
    });

    layout.addWidget(checkbox);
  }

  protected addRestartRequiredLabel() {
    const restartNotice = new QLabel(this);

    restartNotice.setText(__('OPTION_RESTART_REQUIRED'));
    restartNotice.setInlineStyle('color: #f04747');

    return restartNotice;
  }
}
