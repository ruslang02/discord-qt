import { ClientUserSettings } from '../structures/ClientUserSettings';
import { CustomStatus } from '../structures/CustomStatus';

declare module 'discord.js' {
  export interface ClientUser {
    email: string | null;
    premium: string | null;
    settings: ClientUserSettings | null;

    customStatus: CustomStatus | null;
    setCustomStatus(status: CustomStatus): Promise<ClientUserSettings | null>;
    acceptInvite(code: Invite | string): Promise<Guild>;
  }
  export interface Guild {
    position: number | null;
  }
}