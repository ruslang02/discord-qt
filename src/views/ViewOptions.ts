import { DMChannel, Guild, GuildChannel } from 'discord.js';
import { GroupDMChannel } from '../patches/GroupDMChannel';

export type ViewOptions = {
  dm?: DMChannel | GroupDMChannel;
  channel?: GuildChannel;
  guild?: Guild;
};
