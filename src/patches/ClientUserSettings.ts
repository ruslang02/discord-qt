import {
  ClientUser,
  Constants,
  DQConstants,
  Guild,
  PresenceStatus,
  Snowflake,
  Util,
} from 'discord.js';
import { CustomStatus } from '../utilities/CustomStatus';

type FriendsSources = { all: boolean; mutualGuilds: boolean; mutualFriends: boolean };

/**
 * A wrapper around the ClientUser's settings.
 */
export class ClientUserSettings {
  public convertEmoticons: boolean = false;

  public customStatus: CustomStatus | null = null;

  public defaultGuildsRestricted: boolean = false;

  public detectPlatformAccounts: boolean = false;

  public developerMode: boolean = false;

  public enableTTSCommand: boolean = false;

  public explicitContentFilter: 'DISABLED' | 'NON_FRIENDS' | 'FRIENDS_AND_NON_FRIENDS' | string =
    'DISABLED';

  public friendsSources: FriendsSources = { all: false, mutualFriends: false, mutualGuilds: false };

  public guildFolders: Snowflake[] = [];

  public guildPositions: Snowflake[] = [];

  public inlineAttachmentMedia: boolean = false;

  public inlineEmbedMedia: boolean = false;

  public locale: string = '';

  public messageDisplayCompact: boolean = false;

  public renderReactions: boolean = false;

  public restrictedGuilds: Snowflake[] = [];

  public showCurrentGame: boolean = false;

  public status: PresenceStatus = 'offline';

  public theme: string = 'dark';

  private user: ClientUser;

  constructor(user: ClientUser, data: any) {
    this.user = user;
    this._patch(data);
  }

  /**
   * Patch the data contained in this class with new partial data.
   * @param {Object} data Data to patch this with
   * @returns {void}
   * @private
   */
  _patch(data: any) {
    for (const key of Object.keys(((Constants as unknown) as DQConstants).UserSettingsMap)) {
      const value = ((Constants as unknown) as DQConstants).UserSettingsMap[key];

      if (key in data && typeof value === 'function') {
        // @ts-ignore
        this[value.name] = value(data[key]);
      } else {
        // @ts-ignore
        this[value] = data[key];
      }
    }
  }

  /**
   * Update a specific property of of user settings.
   * @param {string} name Name of property
   * @param {*} value Value to patch
   * @returns {Promise<Object>}
   */
  update(name: string, value: any) {
    // @ts-ignore: API methods.
    return this.user.client.api.users('@me').settings.patch({ data: { [name]: value } });
  }

  /**
   * Sets the position at which this guild will appear in the Discord client.
   * @param {Guild} guild The guild to move
   * @param {number} position Absolute or relative position
   * @param {boolean} [relative=false] Whether to position relatively or absolutely
   * @returns {Promise<Guild>}
   */
  setGuildPosition(guild: Guild, position: number, relative: boolean) {
    const temp = Object.assign([], this.guildPositions);

    Util.moveElementInArray(temp, guild.id, position, relative);

    return this.update('guild_positions', temp).then(() => guild);
  }

  /**
   * Add a guild to the list of restricted guilds.
   * @param {Guild} guild The guild to add
   * @returns {Promise<Guild>}
   */
  addRestrictedGuild(guild: Guild) {
    const temp = Object.assign([], this.restrictedGuilds);

    if (temp.includes(guild.id)) {
      return Promise.reject(new Error('Guild is already restricted'));
    }

    temp.push(guild.id);

    return this.update('restricted_guilds', temp).then(() => guild);
  }

  /**
   * Remove a guild from the list of restricted guilds.
   * @param {Guild} guild The guild to remove
   * @returns {Promise<Guild>}
   */
  removeRestrictedGuild(guild: Guild) {
    const temp = Object.assign([], this.restrictedGuilds);
    const index = temp.indexOf(guild.id);

    if (index < 0) {
      return Promise.reject(new Error('Guild is not restricted'));
    }

    temp.splice(index, 1);

    return this.update('restricted_guilds', temp).then(() => guild);
  }
}
