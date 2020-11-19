import {
  KeyboardModifier,
  NativeElement,
  QIcon,
  QKeyEvent,
  QMainWindow,
  QStackedWidget,
  WidgetAttribute,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Guild, GuildChannel } from 'discord.js';
import { existsSync, promises } from 'fs';
import path from 'path';
import { app } from '..';
import { ProfilePopup } from '../components/ProfilePopup/ProfilePopup';
import { UserMenu } from '../components/UserMenu/UserMenu';
import { AcceptInviteDialog } from '../dialogs/AcceptInviteDialog';
import { ConfirmLeaveGuildDialog } from '../dialogs/ConfirmLeaveGuildDialog';
import { CustomStatusDialog } from '../dialogs/CustomStatusDialog';
import { NicknameChangeDialog } from '../dialogs/NicknameChangeDialog';
import { createLogger } from '../utilities/Console';
import { Events as AppEvents } from '../utilities/Events';
import { MainView } from '../views/MainView/MainView';
import { SettingsView } from '../views/SettingsView/SettingsView';

const { readFile } = promises;

const { error } = createLogger('RootWindow');

export class RootWindow extends QMainWindow {
  private root = new QStackedWidget(this);

  dialogs = {
    acceptInvite: new AcceptInviteDialog(this),
    confirmLeaveGuild: new ConfirmLeaveGuildDialog(this),
    customStatus: new CustomStatusDialog(this),
    miniProfile: new ProfilePopup(this),
    nicknameChange: new NicknameChangeDialog(this),
  };

  private mainView = new MainView();

  private settingsView = new SettingsView();

  private userMenu = new UserMenu(this.root);

  shiftKeyPressed = false;

  constructor() {
    super();
    void this.loadStyles();
    this.loadIcon();
    this.initializeWindow();

    app.on(AppEvents.SWITCH_VIEW, (view, options) => {
      switch (view) {
        case 'main':
          this.root.setCurrentWidget(this.mainView);
          break;

        case 'settings':
          this.root.setCurrentWidget(this.settingsView);
          break;

        case 'guild': {
          if (!options) {
            return;
          }

          const guild = options.guild || (options.channel?.guild as Guild);
          const settings = { ...app.config.userLocalGuildSettings[guild.id] };

          if (options.channel) {
            settings.lastViewedChannel = options.channel.id;
            app.config.userLocalGuildSettings[guild.id] = settings;
            void app.configManager.save();
          } else {
            const lastViewedChannelId = settings.lastViewedChannel || '';
            const firstChannel =
              (app.client.channels.resolve(lastViewedChannelId) as GuildChannel) ||
              guild.channels.cache
                .filter((a) => ['text', 'news'].includes(a.type))
                .sort((a, b) => a.rawPosition - b.rawPosition)
                .first();

            app.emit(AppEvents.SWITCH_VIEW, 'guild', {
              guild,
              channel: firstChannel,
            });
          }

          break;
        }

        default:
      }
    });

    app.on(AppEvents.READY, () => {
      const autoAccount = app.config.accounts?.find((a) => a.autoLogin);

      if (autoAccount) {
        void app.clientManager.load(autoAccount);
      }

      void this.loadStyles();
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
    this.addEventListener(WidgetEventTypes.Close, () => {
      if (!app.config.minimizeToTray) {
        app.application.exit(0);
      }
    });
  }

  private handleKeyPress(e: any) {
    const event = new QKeyEvent(e as NativeElement);

    this.shiftKeyPressed =
      (event.modifiers() & KeyboardModifier.ShiftModifier) === KeyboardModifier.ShiftModifier;
  }

  async loadStyles() {
    const stylePath = path.join(__dirname, 'themes', `${app.config.theme}.theme.css`);

    if (!existsSync(stylePath)) {
      return;
    }

    try {
      const stylesheet = await readFile(stylePath, 'utf8');

      this.setStyleSheet(stylesheet);
    } catch (e) {
      error("Couldn't load the stylesheet.", e);
    }
  }

  protected loadIcon() {
    const icon = new QIcon(path.resolve(__dirname, './assets/icon.png'));

    this.setWindowIcon(icon);
  }
}
