import {
  ButtonRole,
  Direction, QBoxLayout, QLabel, QMessageBox, QPushButton, QSize, QWidget,
} from '@nodegui/nodegui';
import { Input, Mixer } from 'audio-mixer';
import ChildProcess, { ChildProcessWithoutNullStreams } from 'child_process';
import {
  Client, Constants, DQConstants, GuildMember, VoiceChannel, VoiceConnection, VoiceState,
} from 'discord.js';
import { __ } from 'i18n';
import open from 'open';
import { join } from 'path';
import { FFmpeg } from 'prism-media';
import { app } from '../..';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { DIconButton } from '../DIconButton/DIconButton';
import { NoiseReductor } from './NoiseReductor';
import { Silence } from './Silence';

const { debug, error, warn } = createLogger('VoicePanel');

const PLAYBACK_OPTIONS = [
  '-f', 's16le',
  '-ar', '48000',
  '-ac', '2',
  '-loglevel', 'quiet',
  '-guess_layout_max', '0',
  '-i', '-',
  '-f', 'pulse',
  '-buffer_duration', '5',
  '-name', 'DiscordQt',
  'default',
];

const RECORD_OPTIONS = [
  '-name', 'DiscordQt',
  '-frame_size', '960',
  '-f', 'pulse',
  '-i', 'default',
  '-filter', 'lowpass=12000,afftdn=nr=50,bass=g=14',
  '-f', 's16le',
  '-ar', '48000',
  '-ac', '2', '-',
];

export class VoicePanel extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private statusLabel = new QLabel(this);

  private infoLabel = new QLabel(this);

  private discntBtn = new DIconButton({
    iconPath: join(__dirname, 'assets/icons/phone-remove.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Disconnect',
  });

  private mixer?: Mixer;

  private playbackStream?: ChildProcessWithoutNullStreams;

  private recordStream?: ChildProcessWithoutNullStreams;

  private channel?: VoiceChannel;

  private connection?: VoiceConnection;

  private streams = new Map<GuildMember, Input>();

  constructor() {
    super();
    this.setObjectName('VoicePanel');
    this.initComponent();
    this.hide();
    app.on(AppEvents.JOIN_VOICE_CHANNEL, this.joinChannel.bind(this));
    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants as unknown as DQConstants;
      client.on(Events.VOICE_STATE_UPDATE, this.handleVoiceStateUpdate.bind(this));
    });
    app.on(AppEvents.CONFIG_UPDATE, (config) => {
      for (const entries of this.streams.entries()) {
        const settings = config.userVolumeSettings[entries[0].id] || {};
        settings.volume = settings.volume ?? 100;
        settings.muted = settings.muted ?? false;
        entries[1].setVolume(settings.muted ? 0 : settings.volume);
      }
    });
  }

  private handleVoiceStateUpdate(o: VoiceState, n: VoiceState) {
    if (!n.member || n.member.user === app.client.user) return;
    if (o.channel === this.channel
      && n.channel !== this.channel) this.connectToMixer(n.member);
    if (o.channel !== this.channel
      && n.channel === this.channel) this.disconnectFromMixer(n.member);
  }

  private initComponent() {
    const {
      layout, infoLabel, statusLabel, discntBtn,
    } = this;
    layout.setContentsMargins(8, 8, 8, 8);
    layout.setSpacing(8);

    statusLabel.setObjectName('StatusLabel');
    infoLabel.setObjectName('InfoLabel');

    const voiceLayout = new QBoxLayout(Direction.LeftToRight);
    const infoLayout = new QBoxLayout(Direction.TopToBottom);
    infoLayout.addWidget(statusLabel);
    infoLayout.addWidget(infoLabel);
    infoLayout.setSpacing(0);
    voiceLayout.addLayout(infoLayout, 1);
    voiceLayout.addWidget(discntBtn, 0);
    layout.addLayout(voiceLayout);
    discntBtn.addEventListener('clicked', this.handleDisconnectButton.bind(this));
    discntBtn.setFixedSize(32, 32);
    this.setLayout(layout);
  }

  private handleDisconnectButton() {
    this.statusLabel.setText("<font color='#f04747'>Disconnecting</font>");
    this.connection?.disconnect();
    this.recordStream?.kill();
    this.playbackStream?.kill();
    this.mixer?.close();
    this.streams.clear();
    this.hide();
  }

  private static openVoiceNotSupportedDialog(channel: VoiceChannel) {
    const msgBox = new QMessageBox();
    msgBox.setText(__('VOICE_NOT_SUPPORTED'));
    msgBox.setWindowTitle('DiscordQt');
    msgBox.setProperty('icon', 4);
    const noBtn = new QPushButton();
    noBtn.setText(__('NO_TEXT'));
    msgBox.addButton(noBtn, ButtonRole.NoRole);
    const yesBtn = new QPushButton();
    yesBtn.setText(__('YES_TEXT'));
    msgBox.addButton(yesBtn, ButtonRole.YesRole);
    yesBtn.addEventListener('clicked', () => {
      void open(`https://discord.com/channels/${channel.guild.id}/${channel.id}`);
    });
    msgBox.open();
  }

  private connectToMixer(member: GuildMember) {
    if (!this.mixer) return;
    const stream = this.connection?.receiver.createStream(member.user, { mode: 'pcm', end: 'manual' });
    if (stream) {
      const volume = app.config.userVolumeSettings[member.id]?.volume || 100;
      const input = new Input({
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
        volume,
      });
      this.streams.set(member, input);
      this.mixer.addInput(input);
      stream.pipe(input);
    } else {
      error(`Couldn't connect member ${member} to the voice channel ${this.channel?.name}.`);
    }
  }

  private disconnectFromMixer(member: GuildMember) {
    if (!this.mixer) return;
    const input = this.streams.get(member);
    if (input) {
      this.mixer.removeInput(input);
      input.end();
    } else {
      error(`Couldn't disconnect a member ${member} from the playback stream.`);
    }
  }

  private async joinChannel(channel: VoiceChannel) {
    const { infoLabel, statusLabel } = this;
    if (process.platform !== 'linux') {
      VoicePanel.openVoiceNotSupportedDialog(channel);
      return;
    }
    this.handleDisconnectButton();
    statusLabel.setText("<font color='#faa61a'>Joining Voice Channel</font>");
    this.show();
    this.channel = channel;
    infoLabel.setText(channel.name);
    try {
      this.connection = await channel.join();
      this.connection.on('warn', warn.bind(this, '[djs]'));
      this.connection.on('error', error.bind(this, '[djs]'));
      this.connection.on('failed', error.bind(this, '[djs]'));
      this.connection.on('debug', debug.bind(this, '[djs]'));
      this.connection.setSpeaking(4);
      statusLabel.setText("<font color='#faa61a'>Connecting Devices</font>");
      this.playbackStream = ChildProcess.spawn(FFmpeg.getInfo().command, PLAYBACK_OPTIONS);
      this.playbackStream.stderr.on('data', (chunk) => debug('[PlaybackStream]', chunk.toString()));
      this.connection.play(new Silence(), { type: 'opus' });
      this.mixer = new Mixer({
        channels: 2,
        sampleRate: 48000,
        bitDepth: 16,
      });

      for (const member of channel.members.filter((m) => m.user !== app.client.user).values()) {
        this.connectToMixer(member);
      }
      this.mixer.pipe(this.playbackStream.stdin);
      this.recordStream = ChildProcess.spawn(FFmpeg.getInfo().command, RECORD_OPTIONS);
      this.recordStream.stderr.on('data', (chunk) => debug('[RecordStream]', chunk.toString()));
      const noiseReductor = new NoiseReductor((value: boolean) => {
        if (!this.connection) return;
        this.connection.setSpeaking(value ? 1 : 4);
        this.connection.emit('speaking', app.client.user, this.connection.speaking);
      });
      noiseReductor.setSensivity(9);
      this.connection.play(this.recordStream.stdout.pipe(noiseReductor), { bitrate: 256, type: 'converted', highWaterMark: 0 });
      statusLabel.setText("<font color='#43b581'>Voice Connected</font>");
    } catch (e) {
      statusLabel.setText("<font color='#f04747'>Error</font>");
      error('Could not join the voice channel.', e);
    }
  }
}
