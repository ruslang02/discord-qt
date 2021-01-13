import { Constants, DQConstants } from 'discord.js';
import { patchBefore, patchClass } from '../utilities/Patcher';
import { GroupDMChannel } from './GroupDMChannel';

const Channel = require('discord.js/src/structures/Channel');

class ChannelPatchStatic {
  create = patchBefore(Channel.create, (client, data, guild): GroupDMChannel | undefined => {
    const { ChannelTypes } = Constants as DQConstants;

    if (!data.guild_id && !guild && data.type === ChannelTypes.GROUP) {
      return new GroupDMChannel(client, data);
    }

    return undefined;
  });
}

patchClass(Channel, ChannelPatchStatic);
