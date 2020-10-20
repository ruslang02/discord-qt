import {
  ButtonRole, QLabel, QMessageBox, QMessageBoxIcon, QPushButton, QVariant, WidgetEventTypes,
} from '@nodegui/nodegui';
import { existsSync, promises } from 'fs';
import { getLocale, setLocale, __ } from 'i18n';
import { notify } from 'node-notifier';
import { basename, join } from 'path';
import { app } from '../../..';
import { DColorButton } from '../../../components/DColorButton/DColorButton';
import { DComboBox } from '../../../components/DComboBox/DComboBox';
import { Events } from '../../../utilities/Events';
import { paths } from '../../../utilities/Paths';
import { createLogger } from '../../../utilities/Console';
import { SettingsCheckBox } from '../SettingsCheckBox';
import { Page } from './Page';

const { readdir, readFile, rmdir } = promises;
const { warn } = createLogger(basename(__filename, '.ts'));
// @ts-ignore
global.notify = notify;

export class AppearancePage extends Page {
  title = __('APPEARANCE');

  private header = new QLabel();

  private prmdcx = new SettingsCheckBox(this); // Process MD checkbox

  private enavcx = new SettingsCheckBox(this); // Display avatars checkbox

  private rdavcx = new SettingsCheckBox(this); // Roundify avatars checkbox

  private dbgcx = new SettingsCheckBox(this); // Debug checkbox

  private themeSel = new DComboBox(this); // Theme combo box

  private langSel = new DComboBox(this); // Language combo box

  private langs: string[] = [];

  constructor() {
    super();
    this.initPage();
    this.layout.setSpacing(5);
    app.on(Events.READY, this.loadConfig.bind(this));
  }

  private async initPage() {
    const {
      title, header, enavcx, rdavcx, prmdcx, dbgcx, themeSel, langSel, layout,
    } = this;
    header.setObjectName('Header2');
    header.setText(title);
    layout.addWidget(header);
    [
      [prmdcx, 'processMarkDown', __('PROCESS_MARKDOWN_DESCRIPTION')],
      [enavcx, 'enableAvatars', __('ENABLE_AVATARS_DESCRIPTION')],
      [rdavcx, 'roundifyAvatars', __('ROUNDIFY_AVATARS_DESCRIPTION')],
      [dbgcx, 'debug', __('DEBUG_MODE_DESCRIPTION')],
    ] // @ts-ignore
      .forEach(([checkbox, id, text]: [SettingsCheckBox, string, string]) => {
        checkbox.setText(text);
        checkbox.addEventListener(WidgetEventTypes.MouseButtonRelease, async () => {
          const checked = checkbox.isChecked();
          checkbox.setChecked(!checked);
          // @ts-ignore
          app.config[id] = !checked;
          app.config.save();
        });
        layout.addWidget(checkbox);
      });
    const themeLabel = new QLabel(this);
    themeLabel.setObjectName('Header3');
    themeLabel.setText(`\r\n${__('THEME')}`);

    const langLabel = new QLabel(this);
    langLabel.setObjectName('Header3');
    langLabel.setText(`\r\n${__('LANGUAGE')}`);

    await this.loadThemes();
    await this.loadLanguages();
    this.loadConfig();

    themeSel.addEventListener('currentTextChanged', async (text) => {
      const path = join(__dirname, 'themes', `${text}.theme.css`);
      if (!existsSync(path)) return;
      app.config.theme = text;
      await app.config.save();
      app.window.loadStyles();
    });
    langSel.addEventListener('currentIndexChanged', async (index) => {
      const locale = langSel.itemData(index).toString();
      const path = join(__dirname, 'locales', `${locale}.json`);
      if (!existsSync(path)) return;
      app.config.locale = locale;
      await app.config.save();
      setLocale(locale);
      const mbox = new QMessageBox();
      mbox.setText(__('LANGUAGE_RESTART_REQUIRED'));
      mbox.setWindowTitle(app.name);
      mbox.setProperty('icon', QMessageBoxIcon.Information);
      const okBtn = new QPushButton();
      okBtn.setText(__('OKAY'));
      mbox.addButton(okBtn, ButtonRole.ApplyRole);
      mbox.open();
    });
    const clearCacheBtn = new DColorButton();
    clearCacheBtn.setText(__('CLEAR_CACHE'));
    clearCacheBtn.setMinimumSize(0, 36);
    clearCacheBtn.addEventListener('clicked', () => {
      rmdir(paths.cache, { recursive: true }).then(() => {
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
      });
    });
    layout.addWidget(themeLabel);
    layout.addWidget(themeSel);
    layout.addWidget(langLabel);
    layout.addWidget(langSel);
    layout.addSpacing(10);
    layout.addWidget(clearCacheBtn);
    clearCacheBtn.setFlexNodeSizeControlled(false);
    layout.addStretch(1);
  }

  private async loadThemes() {
    const themes = await readdir('./dist/themes', { withFileTypes: true });
    themes.forEach((theme) => {
      if (theme.name.endsWith('.theme.css')) {
        const myThemeName = theme.name.replace('.theme.css', '');
        this.themeSel.addItem(undefined, myThemeName, undefined);
      }
    });
  }

  private async loadLanguages() {
    const locales = await readdir('./dist/locales', { withFileTypes: true });
    this.langs = await Promise.all(locales.map(async (locale) => {
      const localeName = locale.name.replace('.json', '');
      try {
        const file = JSON.parse((await readFile(join('./dist/locales/', locale.name))).toString());
        this.langSel.addItem(undefined, file['locale.name'], new QVariant(localeName));
      } catch (e) {
        warn(`[AppearancePage] Locale file "${locale.name}" can not be read.`);
      }
      return localeName;
    }));
  }

  private loadConfig() {
    const {
      enavcx, rdavcx, prmdcx, dbgcx, themeSel, langSel,
    } = this;
    const {
      debug, processMarkDown, enableAvatars, roundifyAvatars, theme,
    } = app.config;
    enavcx.setChecked(enableAvatars as boolean);
    rdavcx.setChecked(roundifyAvatars as boolean);
    prmdcx.setChecked(processMarkDown as boolean);
    dbgcx.setChecked(debug as boolean);
    if (typeof theme === 'string') themeSel.setCurrentText(theme);
    langSel.setCurrentIndex(this.langs.indexOf(getLocale()));
  }
}
