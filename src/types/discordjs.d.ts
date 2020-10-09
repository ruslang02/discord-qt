import { UserEventsMap } from '../patches/Constants';
/* eslint-disable */
import { ClientUserSettings } from '../structures/ClientUserSettings';
import { CustomStatus } from '../structures/CustomStatus';

declare module 'discord.js' {
  export interface Client {
    read_state: { mention_count: number, last_message_id: string, id: string }[]
  }
  export interface ClientEvents {
    messageAck: [GuildChannel, Message];
    userSettingsUpdate: [ClientUserSettings];
  }
  export interface ClientUser {
    email: string | null;
    premium: string | null;
    settings: ClientUserSettings | null;

    customStatus: CustomStatus | null;
    setCustomStatus(status: CustomStatus): Promise<ClientUserSettings | null>;
    acceptInvite(code: Invite | string): Promise<Guild>;
  }
  export interface Constants {
    ExplicitContentFilterTypes: string[];
    Events: typeof UserEventsMap & typeof Constants['Events'];
    UserSettingsMap: Record<string, string>;
  }
  export interface DMChannel {
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export interface DQConstants extends Constants {}
  export interface Guild {
    acknowledged: boolean;
    position: number | null;
  }
  export interface GuildChannel {
    can(flags: number, who?: User): boolean;
  }
  export interface NewsChannel {
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export interface TextChannel {
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export interface User {
    note: string | null;
    setNote(note: string): void;
  }
}