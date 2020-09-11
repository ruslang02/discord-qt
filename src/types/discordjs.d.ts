import { ClientUserSettings } from '../structures/ClientUserSettings';
import { CustomStatus } from '../structures/CustomStatus';

declare module 'discord.js' {
  export interface Client {
    read_state: { mention_count: number, last_message_id: string, id: string }[]
  }
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
    acknowledge(): void;
  }
  export interface Guild {
    position: number | null;
  }
  export interface TextChannel {
    lastReadMessageID: string | null;
    acknowledge(): void;
  }
}