import { Snowflake } from 'discord.js';
import { Account } from './Account';

export type RecentEmoji = [Snowflake, number];

export type UserVolume = {
  volume?: number;
  muted?: boolean;
};

export type LocalGuildSettings = {
  hideMutedChannels?: boolean;
  collapsedCategories?: Snowflake[];
  lastViewedChannel?: Snowflake;
};

export type VoiceSettings = {
  inputDevice?: string;
  outputDevice?: string;
  inputVolume?: number;
  outputVolume?: number;
  inputSensitivity?: number;
  playbackOptions?: string;
  recordOptions?: string;
};

export type OverlaySettings = {
  enable?: boolean;
  x?: number;
  y?: number;
};

export interface IConfig {
  accounts: Account[];

  roundifyAvatars: boolean;

  fastLaunch: boolean;

  debug: boolean;

  locale: string;

  minimizeToTray: boolean;

  processMarkDown: boolean;

  enableAvatars: boolean;

  isMobile: boolean;

  zoomLevel: string;

  hideMembersList: boolean;

  theme: string;

  recentEmojis: RecentEmoji[];

  userVolumeSettings: Record<Snowflake, UserVolume | undefined>;

  userLocalGuildSettings: Record<Snowflake, LocalGuildSettings | undefined>;

  voiceSettings: VoiceSettings;

  overlaySettings: OverlaySettings;
}
