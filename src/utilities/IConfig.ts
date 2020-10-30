import { Snowflake } from 'discord.js';
import { Account } from './Account';

export type RecentEmoji = [Snowflake, number];

export type UserVolume = {
  volume?: number;
  muted?: boolean;
}

export type LocalGuildSettings = {
  hideMutedChannels?: boolean;
}

export interface IConfig {
  accounts: Account[];

  roundifyAvatars: boolean;

  fastLaunch: boolean;

  debug: boolean;

  locale: string;

  processMarkDown: boolean;

  enableAvatars: boolean;

  theme: string;

  recentEmojis: RecentEmoji[];

  userVolumeSettings: Record<Snowflake, UserVolume | undefined>;

  userLocalGuildSettings: Record<Snowflake, LocalGuildSettings | undefined>;
}
