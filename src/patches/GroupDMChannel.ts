import {
  ChannelData,
  MessageManager,
  User,
  Snowflake,
  DMChannel,
  Collection,
  Client,
  Channel,
} from 'discord.js';

const TextBasedChannel = require('discord.js/src/structures/interfaces/TextBasedChannel');

class GroupDMChannel extends Channel {
  private _recipients = new Collection<Snowflake, User>();

  private _muted = false;

  private _typing = new Map();

  private icon?: string;

  lastMessageID: Snowflake = '0';

  lastPinTimestamp?: number;

  messages: MessageManager;

  private _name?: string;

  private ownerID: Snowflake = '0';

  constructor(client: Client, data: any) {
    super(client, data);

    this.type = 'group';
    this.messages = new MessageManager((this as unknown) as DMChannel);

    if (this.client.user) {
      this._recipients.set(this.client.user.id, this.client.user);
    }

    this._patch(data);
  }

  get name() {
    return this._name ?? '';
  }

  set name(name: string) {
    void this.edit({ name });
  }

  get muted() {
    return this._muted;
  }

  set muted(mute: boolean) {
    this._muted = mute;
  }

  get owner() {
    return this._recipients.get(this.ownerID);
  }

  get partial() {
    return typeof this.lastMessageID === 'undefined';
  }

  get recipients() {
    return this._recipients;
  }

  _patch(data: any) {
    super._patch(data);

    if (data.recipients) {
      for (const recipient of data.recipients) {
        void this.client.users.fetch(recipient.id).then((user) => {
          this._recipients.set(user.id, user);
        });
      }
    }

    this.ownerID = data.owner_id;
    this.lastMessageID = data.last_message_id;
    this.lastPinTimestamp = data.last_pin_timestamp
      ? new Date(data.last_pin_timestamp).getTime()
      : undefined;

    if (data.icon) {
      this.icon = data.icon;
    }

    if (data.name) {
      this._name = data.name;
    } else if (!this._name && data.recipients) {
      this._name = data.recipients
        .reduce((acc: any, user: any) => `${acc}, ${user.username}`, '')
        .slice(2);
    }

    if (data.messages) {
      for (const message of data.messages) {
        this.messages.add(message);
      }
    }
  }

  // Leave group DM
  async delete(reason?: string) {
    this.deleted = true;

    return (this.client as any).api.channels(this.id).delete({ reason });
  }

  async edit(data: ChannelData) {
    return (this.client as any).api.channels(this.id).patch({ data });
  }

  iconURL({ format, size }: { format?: string; size?: number } = {}) {
    if (!this.icon) {
      // If you find how Discord gets the default GDM icon, please tell us
      return 'https://discord.com/assets/485a854d5171c8dc98088041626e6fea.png';
    }

    return (this.client as any).rest.cdn.GDMIcon(this.id, this.icon, format, size);
  }

  /* eslint-disable class-methods-use-this */
  // Fix typescript errors because TextBasedChannel isn't detected

  lastReadMessageID?: string | null;

  acknowledged?: boolean;

  acknowledge(): any {}

  send(): any {}
}

(TextBasedChannel as any).applyToClass(GroupDMChannel, true, ['bulkDelete']);

export { GroupDMChannel };
