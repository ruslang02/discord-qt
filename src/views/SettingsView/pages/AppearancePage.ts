import { Page } from './Page';
import { QLabel, WidgetEventTypes } from '@nodegui/nodegui';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { app } from '../../..';
import { Events } from '../../../structures/Events';

export class AppearancePage extends Page {
  title = 'Appearance';

  private header = new QLabel();
  private prmdcx = new SettingsCheckBox(this); // Process MD checkbox
  private enavcx = new SettingsCheckBox(this); // Display avatars checkbox
  private rdavcx = new SettingsCheckBox(this); // Roundify avatars checkbox
  private lithcx = new SettingsCheckBox(this); // Light theme checkbox
  private dbgcx = new SettingsCheckBox(this); // Debug checkbox

  constructor() {
    super();
    this.initPage();
    this.loadConfig();
    app.on(Events.READY, this.loadConfig.bind(this));
  }
  private initPage() {
    const { title, header, enavcx, rdavcx, lithcx, prmdcx, dbgcx, layout } = this;
    header.setObjectName('Header2');
    header.setText(title);
    [
      [prmdcx, 'processMarkDown', 'Process Cool Text™ (Markdown)'],
      [enavcx, 'enableAvatars', 'Enable user avatars'],
      [rdavcx, 'roundifyAvatars', 'Roundify user avatars'],
      [lithcx, 'lightTheme', 'Light theme'],
      [dbgcx, 'debug', '[dev] Debug mode']
    ] // @ts-ignore
      .forEach(([checkbox, id, text]: [SettingsCheckBox, string, string]) => {
        checkbox.setText(text);
        checkbox.addEventListener(WidgetEventTypes.MouseButtonRelease, async () => {
          const checked = checkbox.isChecked();
          checkbox.setChecked(!checked)
          // @ts-ignore
          app.config[id] = !checked;
          await app.config.save();

          if(id === 'lightTheme') app.window.loadStyles();
        });
        layout.addWidget(checkbox);
      });
    layout.addStretch(1);
  }
  private loadConfig() {
    const { enavcx, rdavcx, lithcx, prmdcx, dbgcx } = this;
    const { debug, processMarkDown, enableAvatars, roundifyAvatars, lightTheme } = app.config;
    enavcx.setChecked(enableAvatars as boolean);
    rdavcx.setChecked(roundifyAvatars as boolean);
    prmdcx.setChecked(processMarkDown as boolean);
    lithcx.setChecked(lightTheme as boolean);
    dbgcx.setChecked(debug as boolean);
  }
}
