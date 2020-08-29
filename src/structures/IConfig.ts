import { Account } from './Account';
import { Snowflake } from 'discord.js';

export type RecentEmoji = [Snowflake, number];
export abstract class IConfig {
  accounts?: Account[];
  roundifyAvatars?: boolean;
  fastLaunch?: boolean;
  debug?: boolean;
  processMarkDown?: boolean;
  enableAvatars?: boolean;
  theme?: string;
  recentEmojis?: RecentEmoji[];
}