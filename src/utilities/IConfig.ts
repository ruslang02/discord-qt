import { Snowflake } from 'discord.js';
import { Account } from './Account';

export type RecentEmoji = [Snowflake, number];
export abstract class IConfig {
  accounts?: Account[];

  roundifyAvatars?: boolean;

  fastLaunch?: boolean;

  debug?: boolean;

  locale?: string;

  processMarkDown?: boolean;

  enableAvatars?: boolean;

  theme?: string;

  recentEmojis?: RecentEmoji[];
}
