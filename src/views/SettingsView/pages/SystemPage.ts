import { QLabel } from '@nodegui/nodegui';
import { promises } from 'fs';
import { __ } from 'i18n';
import { notify } from 'node-notifier';
import { basename } from 'path';
import { app } from '../../..';
import { DColorButton } from '../../../components/DColorButton/DColorButton';
import { createLogger } from '../../../utilities/Console';
import { Events } from '../../../utilities/Events';
import { paths } from '../../../utilities/Paths';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { Page } from './Page';

const { rmdir } = promises;
const { error } = createLogger(basename(__filename, '.ts'));

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

  private async initPage() {
    const { layout, title, header, toTrayCheckbox } = this;

    header.setObjectName('Header2');
    header.setText(title);

    layout.addWidget(header);
    this.addSimpleCheckbox(toTrayCheckbox, 'minimizeToTray', __('MINIMIZE_TO_TRAY'));

    const clearCacheBtn = new DColorButton();

    clearCacheBtn.setText(__('CLEAR_CACHE'));
    clearCacheBtn.setMinimumSize(0, 36);
    clearCacheBtn.addEventListener('clicked', () => {
      rmdir(paths.cache, { recursive: true })
        .then(() => {
          notify({
            title: __('CLEAR_CACHE_SUCCESS'),
            message: __('CLEAR_CACHE_MOTIVATIONAL_MESSAGE'),
            icon: app.iconPath,
            // @ts-ignore
            type: 'info',
            category: 'im',
            hint: 'string:desktop-entry:discord-qt',
            'app-name': app.name,
          });
        })
        .catch(error.bind(this, "Couldn't clear cache directory."));
    });

    layout.addWidget(clearCacheBtn);
    layout.addStretch(1);
  }

  private loadConfig() {
    const { toTrayCheckbox } = this;

    toTrayCheckbox.setChecked('minimizeToTray');
  }
}
