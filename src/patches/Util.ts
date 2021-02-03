import { Message } from 'discord.js';
import { patchBefore, patchClass } from '../utilities/Patcher';
import { GroupDMChannel } from './GroupDMChannel';

const Util = require('discord.js/src/util/Util.js');

class UtilStaticPatch {
  cleanContent = patchBefore(Util.cleanContent, (str: string, message: Message) => {
    // Makes cleanContent work for Group DM
    if (!(message.channel instanceof GroupDMChannel)) {
      return undefined;
    }

    return str.replace(/<@!?[0-9]+>/g, (input) => {
      const id = input.replace(/<|!|>|@/g, '');
      const user = message.client.users.cache.get(id);

      return user ? Util.removeMentions(`@${user.username}`) : input;
    });
  });
}

patchClass(Util, UtilStaticPatch);
