import { Page } from './Page';
import { QLabel, WidgetEventTypes } from '@nodegui/nodegui';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { app } from '../../..';

export class AppearancePage extends Page {
  title = 'Appearance';

  private header = new QLabel();
  private prmdcx = new SettingsCheckBox(this); // Process MD checkbox
  private enavcx = new SettingsCheckBox(this); // Display avatars checkbox
  private rdavcx = new SettingsCheckBox(this); // Roundify avatars checkbox
  private fastcx = new SettingsCheckBox(this); // Fast loading checkbox
  private dbgcx = new SettingsCheckBox(this); // Debug checkbox

  constructor() {
    super();
    this.initPage();
    this.loadConfig();
    app.on('config', this.loadConfig.bind(this));
  }
  private initPage() {
    const { title, header, enavcx, rdavcx, prmdcx, fastcx, dbgcx, layout } = this;
    header.setObjectName('Header2');
    header.setText(title);
    prmdcx.setText('Process Cool Text™ (Markdown)');
    enavcx.setText('Enable user avatars');
    rdavcx.setText('Roundify user avatars');
    fastcx.setText('[dev] Process only first 5 guilds/DMs/channels');
    dbgcx.setText('[dev] Debug mode');
    prmdcx.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      const checked = prmdcx.isChecked();
      prmdcx.setChecked(!checked)
      app.config.processMarkDown = !checked;
      app.saveConfig();
    });
    enavcx.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      const checked = enavcx.isChecked();
      enavcx.setChecked(!checked)
      app.config.enableAvatars = !checked;
      app.saveConfig();
    });
    rdavcx.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      const checked = rdavcx.isChecked();
      rdavcx.setChecked(!checked)
      app.config.roundifyAvatars = !checked;
      app.saveConfig();
    });
    fastcx.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      const checked = fastcx.isChecked();
      fastcx.setChecked(!checked)
      app.config.fastLaunch = !checked;
      app.saveConfig();
    });
    dbgcx.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      const checked = dbgcx.isChecked();
      dbgcx.setChecked(!checked)
      app.config.debug = !checked;
      app.saveConfig();
    });
    [header, prmdcx, enavcx, rdavcx, fastcx, dbgcx].forEach(w => layout.addWidget(w));
    layout.addStretch(1);
  }
  private loadConfig() {
    const { enavcx, rdavcx, prmdcx, fastcx, dbgcx } = this;
    const {debug, processMarkDown, enableAvatars, roundifyAvatars, fastLaunch} = app.config;
    enavcx.setChecked(enableAvatars);
    rdavcx.setChecked(roundifyAvatars);
    prmdcx.setChecked(processMarkDown);
    fastcx.setChecked(fastLaunch);
    dbgcx.setChecked(debug);
  }
}
