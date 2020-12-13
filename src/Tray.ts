import { QAction, QMenu, QSystemTrayIcon, QSystemTrayIconActivationReason } from '@nodegui/nodegui';
import { Constants } from 'discord.js';
import { __ } from './utilities/StringProvider';
import { app } from '.';
import { Events as AppEvents } from './utilities/Events';

export class Tray extends QSystemTrayIcon {
  private menu = new QMenu();

  private accMenu = new QMenu();

  private tagAction = new QAction();

  constructor() {
    super();
    this.initTray();
    app.on(AppEvents.NEW_CLIENT, (client) => {
      const { Events } = Constants;

      this.update();
      client.on(Events.USER_UPDATE, this.update.bind(this));
      client.on(Events.CLIENT_READY, this.update.bind(this));
    });

    app.on(AppEvents.READY, this.update.bind(this));
  }

  private initTray() {
    const { menu } = this;

    this.initTrayMenu();
    this.setIcon(app.icon);
    this.addEventListener('activated', Tray.handleShowApp);
    this.setContextMenu(menu);
    this.setToolTip(app.name);
    this.show();
    this.update();
  }

  private static handleShowApp(reason?: QSystemTrayIconActivationReason) {
    if (reason && reason !== QSystemTrayIconActivationReason.Trigger) {
      return;
    }

    app.window.showNormal();
    app.window.activateWindow();
    app.window.raise();
  }

  private static addItem(menu: QMenu, text: string, callback: () => void) {
    const item = new QAction(menu);

    item.setText(text);
    item.addEventListener('triggered', callback);
    menu.addAction(item);
  }

  private initTrayMenu() {
    const { menu, accMenu, tagAction } = this;

    tagAction.setText(__('NOT_LOGGED_IN'));
    tagAction.setEnabled(false);
    tagAction.setIcon(app.icon);
    menu.addAction(tagAction);

    {
      const item = new QAction(menu);

      item.setText(__('SWITCH_TO'));
      item.setMenu(accMenu);
      menu.addAction(item);
    }

    menu.addSeparator();

    {
      const item = new QAction(menu);
      const overlayMenu = new QMenu(menu);

      Tray.addItem(overlayMenu, __('KEYBIND_TOGGLE_OVERLAY'), () => {
        const { enable, x, y } = app.config.get('overlaySettings');

        app.config.set('overlaySettings', {
          enable: !enable,
          x: x ?? 0,
          y: y ?? 0,
        });

        void app.config.save();
      });

      item.setText(__('OVERLAY'));
      item.setMenu(overlayMenu);
      menu.addAction(item);
    }

    Tray.addItem(menu, __('OPEN'), Tray.handleShowApp.bind(this, undefined));
    Tray.addItem(menu, __('QUIT'), () => app.application.exit(0));
  }

  private update() {
    const { accMenu } = this;

    if (!app.config.get('accounts')) {
      return;
    }

    accMenu.actions.forEach((a) => accMenu.removeAction(a));

    for (const account of app.config.get('accounts')) {
      const item = new QAction();

      item.setText(`${account.username}#${account.discriminator}`);
      item.addEventListener('triggered', () => app.clientManager.load(account));
      accMenu.addAction(item);
    }

    const tag = app.client?.user?.tag;

    this.tagAction.setText(tag ? __('LOGGED_IN_AS', { name: tag }) : __('NOT_LOGGED_IN'));
  }
}
