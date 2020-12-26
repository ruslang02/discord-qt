import { Client, Snowflake } from 'discord.js';
import { patchAfter, patchClass } from '../utilities/Patcher';

const TextBasedChannel = require('discord.js/src/structures/interfaces/TextBasedChannel');

const proto = TextBasedChannel;

const props = ['lastReadMessageID', 'acknowledged', 'acknowledge'];

class TextBasedChannelPatch {
  _ackToken?: string;

  client?: Client;

  id: Snowflake = '0';

  lastMessageID?: Snowflake;

  get lastReadMessageID() {
    const state = this.client?.read_state.find((s: any) => s.id === this.id);

    return state?.last_message_id || null;
  }

  get acknowledged() {
    return this.lastReadMessageID === this.lastMessageID;
  }

  acknowledge(): any {
    if (!this.lastMessageID) {
      return undefined;
    }

    const { ack } = (this.client as any).api.channels[this.id].messages[this.lastMessageID];

    return ack.post({ data: { token: this._ackToken } }).then((res: any) => {
      if (res.token) {
        this._ackToken = res.token;
      }
    });
  }

  applyToClass = patchAfter(proto.applyToClass, (_r, structure: any, _f, ignore: string[] = []) => {
    for (const prop of props) {
      if (!ignore.includes(prop)) {
        Object.defineProperty(
          structure.prototype,
          prop,
          Object.getOwnPropertyDescriptor(
            TextBasedChannelPatch.prototype,
            prop
          ) as PropertyDescriptor
        );
      }
    }
  });
}

patchClass(proto, TextBasedChannelPatch);
