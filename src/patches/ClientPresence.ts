import { Activity } from 'discord.js';
import { patchAfter, patchClass } from '../utilities/Patcher';

const ClientPresence = require('discord.js/src/structures/ClientPresence');

const proto = ClientPresence.prototype;
let custom: Activity;

class ClientPresencePatch {
  _parse = patchAfter(proto._parse, async function afterParse(ret: Promise<any>, data: any) {
    const packet = await ret;

    if (data.customStatus) {
      custom = data.customStatus;
    }

    packet.activities = [];

    if (custom) {
      packet.activities.push(custom);
    }

    if (packet.game) {
      packet.activities.push(packet.game);
    }

    delete packet.game;
    const prev = { ...this };

    this.patch(packet);
    this.client.emit('presenceUpdate', prev, this);

    return packet;
  });
}

patchClass(proto, ClientPresencePatch);
