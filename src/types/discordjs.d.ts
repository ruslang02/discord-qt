import { Constants } from 'discord.js';
import { ClientUserSettings } from '../structures/ClientUserSettings';
import { CustomStatus } from '../structures/CustomStatus';

declare module 'discord.js' {
  export interface Client {
    read_state: { mention_count: number, last_message_id: string, id: string }[]
  }
  export interface ClientEvents {
    messageAck: [GuildChannel, Message];
    userSettingsUpdate: [GuildChannel, Message];
  }
  export interface RConstants {
    ExplicitContentFilterTypes: string[];
    Events: { MESSAGE_ACK: 'messageAck', USER_SETTINGS_UPDATE: 'userSettingsUpdate' } & typeof Constants['Events'];
    UserSettingsMap: Record<string, string>;
  }
  export interface Constants extends RConstants {}
  export interface DQConstants extends Constants {}
  export interface ClientUser {
    email: string | null;
    premium: string | null;
    settings: ClientUserSettings | null;

    customStatus: CustomStatus | null;
    setCustomStatus(status: CustomStatus): Promise<ClientUserSettings | null>;
    acceptInvite(code: Invite | string): Promise<Guild>;
  }
  export interface DMChannel {
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export interface Guild {
    acknowledged: boolean;
    position: number | null;
  }
  export interface GuildChannel {
    can(flags: number, who?: User): boolean;
  }
  export interface TextChannel {
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
}