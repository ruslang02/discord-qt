import { QLabel, WidgetEventTypes } from '@nodegui/nodegui';
import { __ } from 'i18n';
import { app } from '../../..';
import { Events } from '../../../utilities/Events';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { Page } from './Page';
import { IConfig } from '../../../utilities/IConfig';

/**
 * Represents the System page in the settings view.
 */
export class SystemPage extends Page {
  title = __('SYSTEM');

  private header = new QLabel(this);

  private toTrayCheckbox = new SettingsCheckBox(this);

  constructor() {
    super();

    void this.initPage();

    app.on(Events.READY, this.loadConfig.bind(this));
  }

  private addCheckbox(checkbox: SettingsCheckBox, configId: keyof IConfig, text: string) {
    const { layout } = this;

    checkbox.setText(text);
    checkbox.addEventListener(WidgetEventTypes.MouseButtonRelease, () => {
      const checked = checkbox.isChecked();

      checkbox.setChecked(!checked);

      app.configManager.set(configId, !checked);
      void app.configManager.save();
    });

    layout.addWidget(checkbox);
  }

  private async initPage() {
    const { layout, title, header, toTrayCheckbox } = this;

    header.setObjectName('Header2');
    header.setText(title);

    layout.addWidget(header);
    this.addCheckbox(toTrayCheckbox, 'minimizeToTray', __('MINIMIZE_TO_TRAY'));
    layout.addStretch(1);
  }

  private loadConfig() {
    const { toTrayCheckbox } = this;
    const { minimizeToTray } = app.config;

    toTrayCheckbox.setChecked(minimizeToTray);
  }
}
