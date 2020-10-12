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
    _typing: Map<Snowflake, TypingEntity>;
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export interface DQConstants extends Constants { }
  export interface Guild {
    acknowledged: boolean;
    position: number | null;
    subscribeToTypingEvent(): void;
  }
  export interface GuildChannel {
    can(flags: number, who?: User): boolean;
  }
  export interface NewsChannel {
    _typing: Map<Snowflake, TypingEntity>;
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export interface TextChannel {
    _typing: Map<Snowflake, TypingEntity>;
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): void;
  }
  export type TypingEntity = {
    elapsedTime: number,
    lastTimestamp: Date,
    since: Date,
    timeout: NodeJS.Timeout,
    user: User
  }
  export interface User {
    note: string | null;
    setNote(note: string): void;
  }
}