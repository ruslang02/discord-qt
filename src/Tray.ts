import {
  QAction, QMenu, QSystemTrayIcon, QSystemTrayIconActivationReason,
} from '@nodegui/nodegui';
import { Constants } from 'discord.js';
import { app } from '.';
import { Events as AppEvents } from './structures/Events';

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
    if (reason && reason !== QSystemTrayIconActivationReason.Trigger) return;
    app.window.showNormal();
    app.window.activateWindow();
    app.window.raise();
  }

  private initTrayMenu() {
    const {
      menu, accMenu, tagAction,
    } = this;
    tagAction.setText('Not logged in');
    tagAction.setEnabled(false);
    tagAction.setIcon(app.icon);
    menu.addAction(tagAction);

    {
      const item = new QAction(menu);
      item.setText('Switch to...');
      item.setMenu(accMenu);
      menu.addAction(item);
    }
    menu.addSeparator();
    {
      const item = new QAction(menu);
      item.setText('Open');
      item.addEventListener('triggered', Tray.handleShowApp.bind(this, undefined));
      menu.addAction(item);
    }
    {
      const item = new QAction(menu);
      item.setText('Quit');
      item.addEventListener('triggered', () => app.application.exit(0));
      menu.addAction(item);
    }
  }

  private update() {
    const { accMenu } = this;
    if (!app.config.accounts) return;
    accMenu.actions.forEach((a) => accMenu.removeAction(a));
    for (const account of app.config.accounts) {
      const item = new QAction();
      item.setText(`${account.username}#${account.discriminator}`);
      item.addEventListener('triggered', () => app.loadClient(account));
      accMenu.addAction(item);
    }
    const tag = app.client?.user?.tag;
    this.tagAction.setText(tag ? `Logged in as ${tag}` : 'Not logged in');
  }
}
