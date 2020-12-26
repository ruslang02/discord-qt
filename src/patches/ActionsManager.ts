import {
  MessageAcknowledgedAction,
  UserNoteUpdateAction,
  UserSettingsUpdateAction,
} from './Actions';
import { patchAfter, patchClass } from '../utilities/Patcher';

const ActionsManager = require('discord.js/src/client/actions/ActionsManager');

const proto = ActionsManager.prototype;

class ActionsManagerPatch {
  _imported = false;

  register = patchAfter(proto.register, function afterRegister() {
    if (!this._imported) {
      this.MessageAcknowledged = new MessageAcknowledgedAction(this.client);
      this.UserNoteUpdate = new UserNoteUpdateAction(this.client);
      this.UserSettingsUpdate = new UserSettingsUpdateAction(this.client);

      this._imported = true;
    }
  });
}

patchClass(proto, ActionsManagerPatch);
