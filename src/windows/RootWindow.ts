import {
  QIcon, QMainWindow, QStackedWidget, WidgetAttribute,
} from '@nodegui/nodegui';
import { existsSync, promises } from 'fs';
import path from 'path';
import { app } from '..';
import { MiniProfile } from '../components/MiniProfile/MiniProfile';
import { AcceptInviteDialog } from '../dialogs/AcceptInviteDialog';
import { CustomStatusDialog } from '../dialogs/CustomStatusDialog';
import { Events as AppEvents } from '../structures/Events';
import { MainView } from '../views/MainView/MainView';
import { SettingsView } from '../views/SettingsView/SettingsView';

const { readFile } = promises;

export class RootWindow extends QMainWindow {
  private root = new QStackedWidget(this);

  dialogs = {
    customStatus: new CustomStatusDialog(this),
    acceptInvite: new AcceptInviteDialog(this),
    miniProfile: new MiniProfile(this),
  };

  private mainView = new MainView();

  private settingsView = new SettingsView();

  constructor() {
    super();
    this.loadStyles();
    this.loadIcon();
    this.initializeWindow();

    app.on(AppEvents.SWITCH_VIEW, (view: string) => {
      switch (view) {
        case 'main':
          this.root.setCurrentWidget(this.mainView);
          break;
        case 'settings':
          this.root.setCurrentWidget(this.settingsView);
          break;
        default:
      }
    });

    app.on(AppEvents.READY, () => {
      const autoAccount = app.config.accounts?.find((a) => a.autoLogin);
      if (autoAccount) app.loadClient(autoAccount);
      this.loadStyles();
    });
  }

  protected initializeWindow() {
    this.setWindowTitle('DiscordQt');
    this.setObjectName('RootWindow');
    this.setMinimumSize(1000, 500);
    this.resize(1200, 600);
    this.setAttribute(WidgetAttribute.WA_AlwaysShowToolTips, true);
    this.setCentralWidget(this.root);
    Object.values(this.dialogs).forEach((w) => w.hide());
    this.root.addWidget(this.mainView);
    this.root.addWidget(this.settingsView);
    this.root.setCurrentWidget(this.mainView);
  }

  async loadStyles() {
    const stylePath = path.join(__dirname, 'themes', `${app.config.theme}.theme.css`);
    if (!existsSync(stylePath)) return;
    const stylesheet = await readFile(stylePath, 'utf8');
    this.setStyleSheet(stylesheet);
  }

  protected loadIcon() {
    const icon = new QIcon(path.resolve(__dirname, './assets/icon.png'));
    this.setWindowIcon(icon);
  }
}
