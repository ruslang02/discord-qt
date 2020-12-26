/* eslint-disable */
import { ClientUserSettings } from '../patches/ClientUserSettings';
import { CustomStatus } from '../utilities/CustomStatus';
import { ClientUserGuildSettings } from '../patches/ClientUserGuildSettings';
import { Snowflake } from 'discord.js';

type ValueOf<T> = T[keyof T];

declare module 'discord.js' {
  export interface Client {
    presence: ClientPresence;
    read_state: { mention_count: number; last_message_id: string; id: string }[];
  }

  export interface ClientEvents {
    messageAck: [GuildChannel, Message];
    userSettingsUpdate: [ClientUserSettings];
  }

  export interface ClientPresence extends Presence {
    set(presence: Object): ClientPresence;
    _parse(presence: Object): Promise<Object>;
  }

  export interface ClientUser extends User {
    email?: string;
    notes: Collection<Snowflake, string>;
    premium?: boolean;
    settings?: ClientUserSettings;
    guildSettings: Collection<Snowflake, ClientUserGuildSettings>;

    customStatus?: CustomStatus;
    setCustomStatus(status?: CustomStatus): Promise<ClientUserSettings | undefined>;
    acceptInvite(code: Invite | string): Promise<Guild>;
  }

  export interface DMChannel {
    _typing: Map<Snowflake, TypingEntity>;
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): Promise<void>;
  }

  export interface DQClientOptions extends ClientOptions {
    http: {
      version: number;
    };

    ws: WebSocketOptions & {
      compress: boolean;
      version: number;

      properties: WebSocketOptions['properties'] & {
        os: string;
        browser: string;
        release_channel: string;
        client_version: string;
        os_arch: string;
        client_build_number: number;
      };
    };
  }

  export type DQConstants = typeof Constants & {
    ExplicitContentFilterTypes: ['DISABLED', 'NON_FRIENDS', 'FRIENDS_AND_NON_FRIENDS'];

    Events: typeof Constants['Events'] & {
      MESSAGE_ACK: 'messageAck';
      USER_GUILD_SETTINGS_UPDATE: 'userGuildSettingsUpdate';
      USER_NOTE_UPDATE: 'userNoteUpdate';
      USER_SETTINGS_UPDATE: 'userSettingsUpdate';
    };

    MessageNotificationTypes: typeof MessageNotificationTypes;

    ShardEvents: typeof Constants['ShardEvents'] & {
      ALL_READY: 'allReady';
    };

    UserChannelOverrideMap: {
      muted: 'muted';

      message_notifications(type: number): ValueOf<typeof MessageNotificationTypes>;
    };

    UserGuildSettingsMap: {
      mobile_push: 'mobilePush';
      muted: 'muted';
      suppress_everyone: 'suppressEveryone';
      channel_overrides: 'channelOverrides';

      message_notifications(type: number): ValueOf<typeof MessageNotificationTypes>;
    };

    UserSettingsMap: {
      convert_emoticons: 'convertEmoticons';
      custom_status: 'customStatus';
      default_guilds_restricted: 'defaultGuildsRestricted';
      detect_platform_accounts: 'detectPlatformAccounts';
      developer_mode: 'developerMode';
      enable_tts_command: 'enableTTSCommand';
      theme: 'theme';
      status: 'status';
      show_current_game: 'showCurrentGame';
      inline_attachment_media: 'inlineAttachmentMedia';
      inline_embed_media: 'inlineEmbedMedia';
      locale: 'locale';
      message_display_compact: 'messageDisplayCompact';
      render_reactions: 'renderReactions';
      guild_folders: 'guildFolders';
      guild_positions: 'guildPositions';
      restricted_guilds: 'restrictedGuilds';

      explicit_content_filter(type: number): string;

      friend_source_flags(
        flags: Object
      ): {
        all: boolean;
        mutualGuilds: boolean;
        mutualFriends: boolean;
      };
    };

    UserAgent: string;
  };

  export interface Guild {
    acknowledged: boolean;
    position: number | null;
    subscribeToTypingEvent(): void;
    muted: boolean | null;
    messageNotifications: ValueOf<typeof MessageNotificationTypes> | null;
    mobilePush: boolean | null;
    suppressEveryone: boolean | null;
  }

  export interface GuildChannel {
    can(flags: number, who?: User): boolean;
    muted: boolean | null;
    messageNotifications: ValueOf<typeof MessageNotificationTypes> | null;
  }

  export enum MessageNotificationTypes {
    'EVERYTHING',
    'MENTIONS',
    'NOTHING',
    'INHERIT',
  }

  export type MessageNotificationType = ValueOf<typeof MessageNotificationTypes>;

  export interface NewsChannel {
    _typing: Map<Snowflake, TypingEntity>;
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): Promise<void>;
  }

  export interface TextChannel {
    _typing: Map<Snowflake, TypingEntity>;
    lastReadMessageID: string | null;
    acknowledged: boolean;
    acknowledge(): Promise<void>;
  }

  export type TypingEntity = {
    elapsedTime: number;
    lastTimestamp: Date;
    since: Date;
    timeout: NodeJS.Timeout;
    user: User;
  };

  export interface User {
    note: string | null;
    setNote(note: string): void;
  }
}
