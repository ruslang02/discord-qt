import { QWidget } from '@nodegui/nodegui';
import { app } from '../..';
import { Events } from '../../structures/Events';
import { Client } from 'discord.js';
import DBus, { ProxyObject, ClientInterface, DBusError } from 'dbus-next';
import { getString, getNumber, ms2str } from './MPRISUtilities';
import { PlayerInfo } from './PlayerInfo';
import { createLogger } from '../../utilities/Console';

const MPRIS_IFACE = 'org.mpris.MediaPlayer2.Player';
const MPRIS_PATH = '/org/mpris/MediaPlayer2';
const PROPERTIES_IFACE = 'org.freedesktop.DBus.Properties';
const PLAYER = 'org.mpris.MediaPlayer2.clementine';
const { log, error, debug } = createLogger('[mpris]');

export class ActivityPanel extends QWidget {
  private bus: DBus.MessageBus | null = null;
  private mpris: ProxyObject | null = null;
  private player: ClientInterface | null = null;
  private props: ClientInterface | null = null;
  constructor() {
    super();
    this.initMPRIS();
    setInterval(this.updatePresence.bind(this), 4000);
  }
  private async initMPRIS(): Promise<void> {
    const { bus } = this;
    try {
      this.bus = DBus.sessionBus();
      this.mpris = await this.bus.getProxyObject(PLAYER, MPRIS_PATH);
      this.player = this.mpris.getInterface(MPRIS_IFACE);
      this.props = this.mpris.getInterface(PROPERTIES_IFACE);
      this.props.on('PropertiesChanged', this.updatePresence.bind(this));
      log('Init complete.')
    } catch (e) {
      const err = e as DBusError;
      error(`Couldn't connect to ${PLAYER}, Music Rich Presence inactive.`);
    }
  }

  private async updatePresence() {
    if (!this.bus || !this.props) return;
    const player = await this.getPlaying();
    debug(`Currently playing ${player.title} from ${player.artist}, ${ms2str(player.current)} / ${ms2str(player.duration)}`);
    app.client?.user?.setPresence({
      activity: player.state === 'Paused' ? undefined : {
        name: 'Clementine',
        // @ts-ignore
        state: player.artist,
        details: player.title,
        application: '725124439574052886',
        assets: {
          largeImage: '734761071721840730',
          largeText: player.album,
          smallImage: '740716026630635521',
          smallText: `${ms2str(player.current)} / ${ms2str(player.duration)}`
        },
        timestamps: {
          start: new Date().getTime() - player.current,
        },
        type: 2,
      }
    })
  }

  private async getPlaying(): Promise<PlayerInfo> {
    const { props } = this;
    const metadata = await props?.Get(MPRIS_IFACE, 'Metadata');
    const position = await props?.Get(MPRIS_IFACE, 'Position');
    const state = await props?.Get(MPRIS_IFACE, 'PlaybackStatus');
    return {
      title: getString(metadata, 'xesam:title') || 'No title',
      artist: getString(metadata, 'xesam:artist') || 'No artist',
      album: getString(metadata, 'xesam:album'),
      duration: getNumber(metadata, 'mpris:length') / 1000,
      current: getNumber(position) / 1000,
      art: getString(metadata, 'mpris:artUrl'),
      id: getString(metadata, 'mpris:trackid'),
      state: getString(state),
      bitrate: getNumber(metadata, 'bitrate'),
    };
  }
}