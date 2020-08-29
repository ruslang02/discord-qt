const Constants = require('discord.js/src/util/Constants');

const DQConstants = {
  ExplicitContentFilterTypes: ['DISABLED', 'NON_FRIENDS', 'FRIENDS_AND_NON_FRIENDS'],
  UserSettingsMap: {
    /**
     * Automatically convert emoticons in your messages to emoji
     * For example, when you type `:-)` Discord will convert it to 😃
     * @name ClientUserSettings#convertEmoticons
     * @type {boolean}
     */
    convert_emoticons: 'convertEmoticons',

    /**
     * The current custom status of the user.
     * @name ClientUserSettings#customStatus
     * @type {CustomStatus}
     */
    custom_status: 'customStatus',

    /**
     * If new guilds should automatically disable DMs between you and its members
     * @name ClientUserSettings#defaultGuildsRestricted
     * @type {boolean}
     */
    default_guilds_restricted: 'defaultGuildsRestricted',

    /**
     * Automatically detect accounts from services like Steam and Blizzard when you open the Discord client
     * @name ClientUserSettings#detectPlatformAccounts
     * @type {boolean}
     */
    detect_platform_accounts: 'detectPlatformAccounts',

    /**
     * Developer Mode exposes context menu items helpful for people writing bots using the Discord API
     * @name ClientUserSettings#developerMode
     * @type {boolean}
     */
    developer_mode: 'developerMode',

    /**
     * Allow playback and usage of the `/tts` command
     * @name ClientUserSettings#enableTTSCommand
     * @type {boolean}
     */
    enable_tts_command: 'enableTTSCommand',

    /**
     * The theme of the client. Either `light` or `dark`
     * @name ClientUserSettings#theme
     * @type {string}
     */
    theme: 'theme',

    /**
     * Last status set in the client
     * @name ClientUserSettings#status
     * @type {PresenceStatus}
     */
    status: 'status',

    /**
     * Display currently running game as status message
     * @name ClientUserSettings#showCurrentGame
     * @type {boolean}
     */
    show_current_game: 'showCurrentGame',

    /**
     * Display images, videos, and lolcats when uploaded directly to Discord
     * @name ClientUserSettings#inlineAttachmentMedia
     * @type {boolean}
     */
    inline_attachment_media: 'inlineAttachmentMedia',

    /**
     * Display images, videos, and lolcats when uploaded posted as links in chat
     * @name ClientUserSettings#inlineEmbedMedia
     * @type {boolean}
     */
    inline_embed_media: 'inlineEmbedMedia',

    /**
     * Language the Discord client will use, as an RFC 3066 language identifier
     * @name ClientUserSettings#locale
     * @type {string}
     */
    locale: 'locale',

    /**
     * Display messages in compact mode
     * @name ClientUserSettings#messageDisplayCompact
     * @type {boolean}
     */
    message_display_compact: 'messageDisplayCompact',

    /**
     * Show emoji reactions on messages
     * @name ClientUserSettings#renderReactions
     * @type {boolean}
     */
    render_reactions: 'renderReactions',

    /**
     * Array of folders which contain snowflake IDs for guilds, in the order they appear in the Discord client
     * @name ClientUserSettings#guildFolders
     * @type {{name?: string, id?: number, guild_ids: Snowflake[], color?: number}[]}
     */
    guild_folders: 'guildFolders',

    /**
     * Array of snowflake IDs for guilds, in the order they appear in the Discord client
     * @name ClientUserSettings#guildPositions
     * @type {Snowflake[]}
     */
    guild_positions: 'guildPositions',

    /**
     * Array of snowflake IDs for guilds which you will not recieve DMs from
     * @name ClientUserSettings#restrictedGuilds
     * @type {Snowflake[]}
     */
    restricted_guilds: 'restrictedGuilds',

    explicit_content_filter: function explicitContentFilter(type: any) {
      /**
       * Safe direct messaging; force people's messages with images to be scanned before they are sent to you.
       * One of `DISABLED`, `NON_FRIENDS`, `FRIENDS_AND_NON_FRIENDS`
       * @name ClientUserSettings#explicitContentFilter
       * @type {string}
       */
      return DQConstants.ExplicitContentFilterTypes[type];
    },
    friend_source_flags: function friendsSources(flags: any) {
      /**
       * Who can add you as a friend
       * @name ClientUserSettings#friendsSources
       * @type {Object}
       * @property {boolean} all Mutual friends and mutual guilds
       * @property {boolean} mutualGuilds Only mutual guilds
       * @property {boolean} mutualFriends Only mutual friends
       */
      return {
        all: flags.all || false,
        mutualGuilds: flags.all ? true : flags.mutual_guilds || false,
        mutualFriends: flags.all ? true : flags.mutualFriends || false,
      };
    },
  },
  Events: {
    ...Constants.Events,
    USER_SETTINGS_UPDATE: 'userSettingsUpdate'
  },
  UserAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) discord-qt/0.3.0 Chrome/78.0.3904.130 Electron/7.3.2 Safari/537.36'
}

Object.assign(Constants, DQConstants);

export type DQConstants = typeof Constants & {
  ExplicitContentFilterTypes: string[];
  Events: typeof Constants.Events & { USER_SETTINGS_UPDATE: string };
  UserSettingsMap: Record<string, string>;
};
