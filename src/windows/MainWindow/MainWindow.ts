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
import { Guild, GuildChannel, Permissions, TextChannel } from 'discord.js';
import { existsSync, promises } from 'fs';
import path from 'path';
import { app } from '../..';
import { ProfilePopup } from '../../components/ProfilePopup/ProfilePopup';
import { UserMenu } from '../../components/UserMenu/UserMenu';
import { AcceptInviteDialog } from '../../dialogs/AcceptInviteDialog';
import { ConfirmLeaveGuildDialog } from '../../dialogs/ConfirmLeaveGuildDialog';
import { CustomStatusDialog } from '../../dialogs/CustomStatusDialog';
import { NicknameChangeDialog } from '../../dialogs/NicknameChangeDialog';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { MainView } from '../../views/MainView/MainView';
import { SettingsView } from '../../views/SettingsView/SettingsView';

const { readFile } = promises;

const { TARGET_COLOR_SPACE } = process.env;

const convertToBGR = TARGET_COLOR_SPACE === 'BGR';

const { error } = createLogger('RootWindow');

export class MainWindow extends QMainWindow {
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
          const settings = app.config.get('userLocalGuildSettings')[guild.id] || {};

          if (options.channel) {
            settings.lastViewedChannel = options.channel.id;

            void app.config.save();
          } else if (!app.config.get('isMobile')) {
            const lastViewedChannelId = settings.lastViewedChannel || '';
            const firstChannel =
              (app.client.channels.resolve(lastViewedChannelId) as GuildChannel) ||
              guild.channels.cache
                .filter((a) => ['text', 'news'].includes(a.type))
                .filter((a) => (a as TextChannel).can(Permissions.FLAGS.VIEW_CHANNEL))
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
      const autoAccount = app.config.get('accounts').find((a) => a.autoLogin);

      if (autoAccount) {
        void app.clientManager.load(autoAccount);
      }

      void this.loadStyles();
    });
  }

  protected initializeWindow() {
    this.setWindowTitle(app.name);
    this.setObjectName('RootWindow');
    this.setMinimumSize(300, 200);
    this.setAttribute(WidgetAttribute.WA_AlwaysShowToolTips, true);
    this.setCentralWidget(this.root);

    Object.values(this.dialogs).forEach((w) => w.hide());

    this.root.addWidget(this.mainView);
    this.root.addWidget(this.settingsView);

    this.root.setCurrentWidget(this.mainView);

    this.addEventListener(WidgetEventTypes.KeyPress, this.handleKeyPress.bind(this));
    this.addEventListener(WidgetEventTypes.KeyRelease, this.handleKeyPress.bind(this));
    this.addEventListener(WidgetEventTypes.Close, () => {
      if (!app.config.get('minimizeToTray')) {
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
    const stylePath = path.join(__dirname, 'themes', `${app.config.get('theme')}.theme.css`);

    if (!existsSync(stylePath)) {
      return;
    }

    try {
      let stylesheet = await readFile(stylePath, 'utf8');

      if (convertToBGR) {
        stylesheet = stylesheet.replace(/#([0-9a-f]+);/g, (_match, hex) => {
          if (hex.length === 3) {
            return `#${hex[2] + hex[1] + hex[0]};`;
          }

          return `#${hex[4] + hex[5] + hex[2] + hex[3] + hex[0] + hex[1]};`;
        });
      }

      if (app.config.get('isMobile')) {
        stylesheet += `
        QScrollBar:horizontal { height: 16px; }
        QScrollBar:vertical { width: 16px; }
        QScrollBar::handle { border-radius: 4px; }
        #MessagesPanel QScrollBar:vertical {
          width: 24px;
        }`;
      }

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
