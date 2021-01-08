import { QLabel, QVariant } from '@nodegui/nodegui';
import { existsSync, promises } from 'fs';
import { getLocale, setLocale } from 'i18n';
import { basename, join } from 'path';
import { __ } from '../../../utilities/StringProvider';
import { app } from '../../..';
import { DComboBox } from '../../../components/DComboBox/DComboBox';
import { Events } from '../../../utilities/Events';
import { createLogger } from '../../../utilities/Console';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { Page } from './Page';

const { readdir, readFile } = promises;
const { error, warn } = createLogger(basename(__filename, '.ts'));

export class AppearancePage extends Page {
  title = __('APPEARANCE');

  private header = new QLabel();

  private ismbcx = new SettingsCheckBox(this); // Process MD checkbox

  private prmdcx = new SettingsCheckBox(this); // Process MD checkbox

  private enavcx = new SettingsCheckBox(this); // Display avatars checkbox

  private rdavcx = new SettingsCheckBox(this); // Roundify avatars checkbox

  private dbgcx = new SettingsCheckBox(this); // Debug checkbox

  private themeSel = new DComboBox(this); // Theme combo box

  private langSel = new DComboBox(this); // Language combo box

  private zoomSel = new DComboBox(this); // Zoom level combo box

  private langs: string[] = [];

  constructor() {
    super();
    void this.initPage();
    this.layout.setSpacing(5);
    app.on(Events.READY, this.loadConfig.bind(this));
  }

  private async initPage() {
    const {
      title,
      header,
      enavcx,
      rdavcx,
      ismbcx,
      prmdcx,
      dbgcx,
      themeSel,
      langSel,
      zoomSel,
      layout,
    } = this;

    header.setObjectName('Header2');
    header.setText(title);
    layout.addWidget(header);

    this.addSimpleCheckbox(ismbcx, 'isMobile', __('OPTIMIZE_FOR_MOBILE'));
    this.addSimpleCheckbox(prmdcx, 'processMarkDown', __('PROCESS_MARKDOWN_DESCRIPTION'));
    this.addSimpleCheckbox(enavcx, 'enableAvatars', __('ENABLE_AVATARS_DESCRIPTION'));
    this.addSimpleCheckbox(rdavcx, 'roundifyAvatars', __('ROUNDIFY_AVATARS_DESCRIPTION'));
    this.addSimpleCheckbox(dbgcx, 'debug', __('DEBUG_MODE_DESCRIPTION'));

    const themeLabel = new QLabel(this);

    themeLabel.setObjectName('Header3');
    themeLabel.setText(`\r\n${__('THEME')}`);

    const langLabel = new QLabel(this);

    langLabel.setObjectName('Header3');
    langLabel.setText(`\r\n${__('LANGUAGE')}`);

    const zoomLabel = new QLabel(this);

    zoomLabel.setObjectName('Header3');
    zoomLabel.setText(`\r\n${__('ACCESSIBILITY_ZOOM_LEVEL_LABEL')}`);

    zoomSel.addItems(['1.0', '1.5', '2.0', '2.5', '3.0']);

    await this.loadThemes();
    await this.loadLanguages();
    this.loadConfig();

    themeSel.addEventListener('currentTextChanged', async (text) => {
      const path = join(__dirname, 'themes', `${text}.theme.css`);

      if (!existsSync(path)) {
        return;
      }

      app.config.set('theme', text);
      await app.config.save();
      await app.window.loadStyles();
    });

    langSel.addEventListener('currentIndexChanged', async (index) => {
      const locale = langSel.itemData(index).toString();
      const path = join(__dirname, 'locales', `${locale}.json`);

      if (!existsSync(path)) {
        return;
      }

      app.config.set('locale', locale);
      await app.config.save();
      setLocale(locale);
    });

    zoomSel.addEventListener('currentTextChanged', async (text) => {
      app.config.set('zoomLevel', text);
      await app.config.save();
    });

    layout.addWidget(themeLabel);
    layout.addWidget(themeSel);
    layout.addWidget(langLabel);
    layout.addWidget(langSel);
    layout.addWidget(this.addRestartRequiredLabel());
    layout.addWidget(zoomLabel);
    layout.addWidget(zoomSel);
    layout.addWidget(this.addRestartRequiredLabel());
    layout.addStretch(1);
  }

  private async loadThemes() {
    try {
      const themes = await readdir('./dist/themes', { withFileTypes: true });

      themes.forEach((theme) => {
        if (theme.name.endsWith('.theme.css')) {
          const myThemeName = theme.name.replace('.theme.css', '');

          this.themeSel.addItem(undefined, myThemeName, undefined);
        }
      });
    } catch (e) {
      error("Couldn't load themes.", e);
    }
  }

  private async loadLanguages() {
    try {
      const locales = await readdir('./dist/locales', { withFileTypes: true });

      this.langs = await Promise.all(
        locales.map(async (locale) => {
          const localeName = locale.name.replace('.json', '');

          try {
            const file = JSON.parse(
              (await readFile(join('./dist/locales/', locale.name))).toString()
            );

            this.langSel.addItem(undefined, file['locale.name'], new QVariant(localeName));
          } catch (e) {
            warn(`[AppearancePage] Locale file "${locale.name}" can not be read.`);
          }

          return localeName;
        })
      );
    } catch (e) {
      error("Couldn't load languages.", e);
    }
  }

  private loadConfig() {
    const { ismbcx, enavcx, rdavcx, prmdcx, dbgcx, themeSel, langSel, zoomSel } = this;

    ismbcx.setChecked('isMobile');
    enavcx.setChecked('enableAvatars');
    rdavcx.setChecked('roundifyAvatars');
    prmdcx.setChecked('processMarkDown');
    dbgcx.setChecked('debug');

    const theme = app.config.get('theme');

    if (typeof theme === 'string') {
      themeSel.setCurrentText(theme);
    }

    zoomSel.setCurrentText(app.config.get('zoomLevel'));

    langSel.setCurrentIndex(this.langs.indexOf(getLocale()));
  }
}
