import { QLabel, WidgetEventTypes } from '@nodegui/nodegui';
import { join } from 'path';
import { existsSync, readdir } from 'fs';
import { Page } from './Page';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { app } from '../../..';
import { Events } from '../../../structures/Events';
import { DComboBox } from '../../../components/DComboBox/DComboBox';

export class AppearancePage extends Page {
  title = 'Appearance';

  private header = new QLabel();
  private prmdcx = new SettingsCheckBox(this); // Process MD checkbox
  private enavcx = new SettingsCheckBox(this); // Display avatars checkbox
  private rdavcx = new SettingsCheckBox(this); // Roundify avatars checkbox
  private dbgcx = new SettingsCheckBox(this); // Debug checkbox
  private themeSel = new DComboBox(this); // Theme line edit

  constructor() {
    super();
    this.initPage();
    this.loadConfig();
    app.on(Events.READY, this.loadConfig.bind(this));
  }
  private initPage() {
    const { title, header, enavcx, rdavcx, prmdcx, dbgcx, themeSel, layout } = this;
    header.setObjectName('Header2');
    header.setText(title);
    layout.addWidget(header);
    [
      [prmdcx, 'processMarkDown', 'Process Cool Text™ (Markdown)'],
      [enavcx, 'enableAvatars', 'Enable user avatars'],
      [rdavcx, 'roundifyAvatars', 'Roundify user avatars'],
      [dbgcx, 'debug', '[dev] Debug mode']
    ] // @ts-ignore
      .forEach(([checkbox, id, text]: [SettingsCheckBox, string, string]) => {
        checkbox.setText(text);
        checkbox.addEventListener(WidgetEventTypes.MouseButtonRelease, async () => {
          const checked = checkbox.isChecked();
          checkbox.setChecked(!checked)
          // @ts-ignore
          app.config[id] = !checked;
          app.config.save();
        });
        layout.addWidget(checkbox);
      });
    const themeLabel = new QLabel(this);
    themeLabel.setObjectName('Header3');
    themeLabel.setText('\r\nTheme');
    readdir('./src/themes', {withFileTypes: true}, (err, files) => {
      if (!err) {
        files.forEach(file => {
          if(file.name.search('.theme.scss') > 0) {
            const myThemeName = file.name.replace('.theme.scss','');
            themeSel.addItem(undefined, myThemeName, undefined);
          };
        });
      };
    });
    themeSel.addEventListener('currentTextChanged', async (text) => {
      const path = join(__dirname, 'themes', `${text}.theme.css`);
      if (!existsSync(path)) return;
      app.config.theme = text;
      await app.config.save();
      app.window.loadStyles();
    })
    layout.addWidget(themeLabel)
    layout.addWidget(themeSel)
    layout.addStretch(1);
  }
  private loadConfig() {
    const { enavcx, rdavcx, prmdcx, dbgcx, themeSel } = this;
    const { debug, processMarkDown, enableAvatars, roundifyAvatars, theme } = app.config;
    enavcx.setChecked(enableAvatars as boolean);
    rdavcx.setChecked(roundifyAvatars as boolean);
    prmdcx.setChecked(processMarkDown as boolean);
    dbgcx.setChecked(debug as boolean);
    themeSel.setCurrentText(theme as string);
  }
}
