import { DMChannel, Guild, GuildChannel } from 'discord.js';

export type ViewOptions = {
  dm?: DMChannel,
  channel?: GuildChannel,
  guild?: Guild,
};
