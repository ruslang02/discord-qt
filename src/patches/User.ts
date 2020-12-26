import { Client, Snowflake } from 'discord.js';
import { patchClass } from '../utilities/Patcher';

const User = require('discord.js/src/structures/User');

class UserPatch {
  client?: Client;

  id: Snowflake = '0';

  get note() {
    return this.client?.user?.notes.get(this.id) || null;
  }

  setNote(note: string) {
    return (this.client as any).api.users('@me').notes(this.id).put({
      data: { note },
    });
  }
}

patchClass(User.prototype, UserPatch);
