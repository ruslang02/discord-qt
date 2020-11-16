import { Client, Constants, HTTPError } from 'discord.js';
import { __ } from 'i18n';
import { notify } from 'node-notifier';
import { app } from '..';
import { Account } from './Account';
import { clientOptions } from './ClientOptions';
import { createLogger } from './Console';
import { Events as AppEvents } from './Events';
import { pictureWorker } from './PictureWorker';

const { debug, warn, error } = createLogger('discord.js');

export class ClientManager {
  // @ts-ignore
  client: Client;

  /**
   * Initiates discord.js connection.
   * @param account Account to connect.
   */
  async load(account: Account) {
    if (this.client) {
      this.client.destroy();
    }

    this.client = new Client(clientOptions);
    this.bindEvents();
    app.emit(AppEvents.NEW_CLIENT, this.client);

    try {
      await this.client.login(account.token);
      this.client.user
        ?.setCustomStatus(this.client.user.settings?.customStatus || undefined)
        .catch((e) => error("Couldn't update custom status on ready.", e));

      app.emit(AppEvents.SWITCH_VIEW, 'dm');
    } catch (e) {
      if (e instanceof HTTPError) {
        app.emit(AppEvents.LOGIN_FAILED);
        notify({
          title: __('NETWORK_ERROR_REST_REQUEST'),
          message: __('NETWORK_ERROR_CONNECTION'),
          // @ts-ignore
          type: 'error',
          icon: app.iconPath,
          category: 'im',
          hint: 'string:desktop-entry:discord-qt',
          'app-name': app.name,
        });
      }

      debug("Couldn't log in", e);
    }
  }

  private bindEvents() {
    const { Events } = Constants;

    this.client.on(Events.ERROR, error);
    this.client.on(Events.DEBUG, debug);
    this.client.on(Events.RAW, debug);
    this.client.on(Events.WARN, warn);
    this.client.on(Events.MESSAGE_CREATE, async (message: any) => {
      if (message.author === this.client.user) {
        return;
      }

      if (
        message.channel.type !== 'dm' &&
        (message.channel.muted || message.channel.messageNotifications !== 'EVERYTHING')
      ) {
        return;
      }

      notify({
        title: message.member?.nickname || message.author.username,
        message: message.cleanContent,
        // @ts-ignore
        type: 'error',
        icon: await pictureWorker.loadImage(
          message.author.displayAvatarURL({ size: 64, format: 'png' }),
          { roundify: false },
        ),
        category: 'im',
        hint: 'string:desktop-entry:discord',
        'app-name': app.name,
      });
    });
  }
}
