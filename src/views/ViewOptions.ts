import { DMChannel, TextChannel, Guild } from 'discord.js';

export type ViewOptions = {
  dm?: DMChannel,
  channel?: TextChannel,
  guild?: Guild,
};
