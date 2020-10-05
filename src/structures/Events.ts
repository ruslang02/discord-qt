import { Client, Message, VoiceChannel } from 'discord.js';
import { ViewOptions } from '../views/ViewOptions';

type ValueOf<T> = T[keyof T];

export const Events = {
  JOIN_VOICE_CHANNEL: 'joinVoiceChannel',
  LOGIN_FAILED: 'loginFailed',
  NEW_CLIENT: 'newClient',
  OPEN_SETTINGS_PAGE: 'openSettingsPage',
  OPEN_USER_PROFILE: 'openUserProfile',
  QUOTE_MESSAGE_NOEMBED: 'quoteMessageNoEmbed',
  QUOTE_MESSAGE_EMBED: 'quoteMessageEmbed',
  READY: 'ready',
  SWITCH_VIEW: 'switchView',
} as const;

export interface EventArgs extends Record<ValueOf<typeof Events>, any[]> {
  joinVoiceChannel: [VoiceChannel],
  loginFailed: [],
  newClient: [Client],
  openSettingsPage: [string],
  openUserProfile: [string],
  quoteMessageNoEmbed: [Message],
  quoteMessageEmbed: [Message],
  ready: [],
  switchView: [string, ViewOptions?],
}
