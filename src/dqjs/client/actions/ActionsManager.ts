import { DQClient } from '../Client';
import { UserSettingsUpdateAction } from './UserSettingsUpdate';

const ActionsManager = require('discord.js/src/client/actions/ActionsManager');

export class DQActionsManager extends ActionsManager {
  constructor(client: DQClient) {
    super(client);
    this.register(UserSettingsUpdateAction);
  }
}