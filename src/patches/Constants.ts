const Constants = require('discord.js/src/util/Constants');

export const UserEventsMap = {
  MESSAGE_ACK: 'messageAck',
  USER_GUILD_SETTINGS_UPDATE: 'userGuildSettingsUpdate',
  USER_NOTE_UPDATE: 'userNoteUpdate',
  USER_SETTINGS_UPDATE: 'userSettingsUpdate',
} as const;

export const MessageNotificationTypes = ['EVERYTHING', 'MENTIONS', 'NOTHING', 'INHERIT'] as const;

const DQConstants = {
  ExplicitContentFilterTypes: ['DISABLED', 'NON_FRIENDS', 'FRIENDS_AND_NON_FRIENDS'],
  UserSettingsMap: {
    convert_emoticons: 'convertEmoticons',
    custom_status: 'customStatus',
    default_guilds_restricted: 'defaultGuildsRestricted',
    detect_platform_accounts: 'detectPlatformAccounts',
    developer_mode: 'developerMode',
    enable_tts_command: 'enableTTSCommand',
    theme: 'theme',
    status: 'status',
    show_current_game: 'showCurrentGame',
    inline_attachment_media: 'inlineAttachmentMedia',
    inline_embed_media: 'inlineEmbedMedia',
    locale: 'locale',
    message_display_compact: 'messageDisplayCompact',
    render_reactions: 'renderReactions',
    guild_folders: 'guildFolders',
    guild_positions: 'guildPositions',
    restricted_guilds: 'restrictedGuilds',

    explicit_content_filter: function explicitContentFilter(type: any) {
      return DQConstants.ExplicitContentFilterTypes[type];
    },

    friend_source_flags: function friendsSources(flags: any) {
      return {
        all: flags.all || false,
        mutualGuilds: flags.all ? true : flags.mutual_guilds || false,
        mutualFriends: flags.all ? true : flags.mutualFriends || false,
      };
    },
  },

  Events: { ...Constants.Events, ...UserEventsMap },

  UserChannelOverrideMap: {
    message_notifications: function messageNotifications(type: number) {
      return DQConstants.MessageNotificationTypes[type];
    },
    muted: 'muted',
  },

  UserGuildSettingsMap: {
    message_notifications: function messageNotifications(type: number) {
      return DQConstants.MessageNotificationTypes[type];
    },
    mobile_push: 'mobilePush',
    muted: 'muted',
    suppress_everyone: 'suppressEveryone',
    channel_overrides: 'channelOverrides',
  },

  MessageNotificationTypes,

  UserAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) discord-qt/0.4.5 Chrome/78.0.3904.130 Electron/7.3.2 Safari/537.36',
};

Object.assign(Constants, DQConstants);
