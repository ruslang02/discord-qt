import { QLabel, WidgetEventTypes } from '@nodegui/nodegui';
import { app } from '../../..';
import { DTextEdit } from '../../../components/DTextEdit/DTextEdit';
import { Events } from '../../../utilities/Events';
import { __ } from '../../../utilities/StringProvider';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { Page } from './Page';

export class OverlayPage extends Page {
  title = __('SETTINGS_GAMES_OVERLAY');

  private header = new QLabel(this);

  private enableCheckbox = new SettingsCheckBox(this);

  private xInput = new DTextEdit(this);

  private yInput = new DTextEdit(this);

  constructor() {
    super();

    this.initPage();
    app.on(Events.CONFIG_UPDATE, this.handleConfigUpdate.bind(this));
    this.handleConfigUpdate();
  }

  private handleConfigUpdate() {
    const { enable, x, y } = app.config.get('overlaySettings');

    this.enableCheckbox.setChecked(!!enable);
    this.xInput.setText((x ?? 0).toString());
    this.yInput.setText((y ?? 0).toString());
  }

  private initPage() {
    const { enableCheckbox, header, title, xInput, yInput } = this;

    header.setObjectName('Header2');
    header.setText(title);

    const { layout } = this;

    enableCheckbox.setText(__('SETTINGS_GAMES_ENABLE_OVERLAY_LABEL'));
    enableCheckbox.addEventListener(WidgetEventTypes.MouseButtonRelease, () => {
      enableCheckbox.setChecked(!enableCheckbox.isChecked());
      this.updateSettings();
    });

    const xLabel = this.createSubheader('SETTINGS_GAMES_OVERLAY_X_LABEL');
    const yLabel = this.createSubheader('SETTINGS_GAMES_OVERLAY_Y_LABEL');

    xInput.setPlaceholderText('0');
    yInput.setPlaceholderText('0');

    xInput.addEventListener('textEdited', this.updateSettings.bind(this));
    yInput.addEventListener('textEdited', this.updateSettings.bind(this));

    layout.addWidget(header);
    layout.addWidget(enableCheckbox);
    layout.addSpacing(10);
    layout.addWidget(xLabel);
    layout.addWidget(xInput);
    layout.addSpacing(10);
    layout.addWidget(yLabel);
    layout.addWidget(yInput);
    layout.addStretch(1);
  }

  private updateSettings() {
    app.config.set('overlaySettings', {
      enable: this.enableCheckbox.isChecked(),
      x: +this.xInput.text() || 0,
      y: +this.yInput.text() || 0,
    });

    void app.config.save();
  }
}
