import {
  KeyboardModifier,
  NativeElement,
  QIcon, QKeyEvent, QMainWindow, QStackedWidget, WidgetAttribute, WidgetEventTypes,
} from '@nodegui/nodegui';
import { existsSync, promises } from 'fs';
import path from 'path';
import { app } from '..';
import { ProfilePopup } from '../components/ProfilePopup/ProfilePopup';
import { AcceptInviteDialog } from '../dialogs/AcceptInviteDialog';
import { CustomStatusDialog } from '../dialogs/CustomStatusDialog';
import { Events as AppEvents } from '../utilities/Events';
import { MainView } from '../views/MainView/MainView';
import { SettingsView } from '../views/SettingsView/SettingsView';

const { readFile } = promises;

export class RootWindow extends QMainWindow {
  private root = new QStackedWidget(this);

  dialogs = {
    customStatus: new CustomStatusDialog(this),
    acceptInvite: new AcceptInviteDialog(this),
    miniProfile: new ProfilePopup(this),
  };

  private mainView = new MainView();

  private settingsView = new SettingsView();

  shiftKeyPressed = false;

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
      if (autoAccount) app.clientManager.load(autoAccount);
      this.loadStyles();
    });
  }

  protected initializeWindow() {
    this.setWindowTitle(app.name);
    this.setObjectName('RootWindow');
    this.setMinimumSize(1000, 500);
    this.resize(1200, 600);
    this.setAttribute(WidgetAttribute.WA_AlwaysShowToolTips, true);
    this.setCentralWidget(this.root);
    Object.values(this.dialogs).forEach((w) => w.hide());
    this.root.addWidget(this.mainView);
    this.root.addWidget(this.settingsView);
    this.root.setCurrentWidget(this.mainView);
    this.addEventListener(WidgetEventTypes.KeyPress, this.handleKeyPress.bind(this));
    this.addEventListener(WidgetEventTypes.KeyRelease, this.handleKeyPress.bind(this));
  }

  private handleKeyPress(e: any) {
    const event = new QKeyEvent(e as NativeElement);
    this.shiftKeyPressed = (event.modifiers() & KeyboardModifier.ShiftModifier)
      === KeyboardModifier.ShiftModifier;
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
