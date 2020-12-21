import { QPoint } from '@nodegui/nodegui';
import { Client, GuildMember, Message, User, VoiceChannel } from 'discord.js';
import { ViewOptions } from '../views/ViewOptions';
import { ConfigManager } from './ConfigManager';

type ValueOf<T> = T[keyof T];

export const Events = {
  CONFIG_UPDATE: 'configUpdate',
  JOIN_VOICE_CHANNEL: 'joinVoiceChannel',
  LOGIN_FAILED: 'loginFailed',
  MENTION_USER: 'mentionUser',
  NEW_CLIENT: 'newClient',
  OPEN_SETTINGS_PAGE: 'openSettingsPage',
  OPEN_USER_MENU: 'openUserMenu',
  OPEN_USER_PROFILE: 'openUserProfile',
  QUOTE_MESSAGE: 'quoteMessage',
  READY: 'ready',
  SWITCH_VIEW: 'switchView',
  TOGGLE_DRAWER: 'toggleDrawer',
} as const;

export interface EventArgs extends Record<ValueOf<typeof Events>, any[]> {
  configUpdate: [ConfigManager];
  joinVoiceChannel: [VoiceChannel];
  loginFailed: [];
  mentionUser: [string];
  newClient: [Client];
  openSettingsPage: [string];
  openUserMenu: [GuildMember | User, QPoint];
  openUserProfile: [string, string | undefined, QPoint];
  quoteMessage: [Message];
  ready: [];
  switchView: [string, ViewOptions?];
  toggleDrawer: [boolean];
}
