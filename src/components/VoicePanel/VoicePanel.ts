import {
  ButtonRole,
  Direction,
  QBoxLayout,
  QLabel,
  QMessageBox,
  QPushButton,
  QSize,
  QWidget,
} from '@nodegui/nodegui';
import { Input, Mixer } from 'audio-mixer';
import { ChildProcessWithoutNullStreams } from 'child_process';
import {
  Client,
  Constants,
  GuildMember,
  VoiceChannel,
  VoiceConnection,
  VoiceState,
} from 'discord.js';
import open from 'open';
import { join } from 'path';
import { VolumeTransformer } from 'prism-media';
import { pipeline, Transform } from 'stream';
import { app } from '../..';
import { ConfigManager } from '../../utilities/ConfigManager';
import { createLogger } from '../../utilities/Console';
import { Events as AppEvents } from '../../utilities/Events';
import { __ } from '../../utilities/StringProvider';
import { createPlaybackStream, createRecordStream } from '../../utilities/VoiceStreams';
import { DIconButton } from '../DIconButton/DIconButton';
import { NoiseReductor } from './NoiseReductor';
import { Silence } from './Silence';

const { debug, error, warn } = createLogger('VoicePanel');

const MIXER_OPTIONS = {
  sampleRate: 48000,
  channels: 2,
  bitDepth: 16,
};

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

  private currentPlaybackDevice?: string;

  private playbackStream?: ChildProcessWithoutNullStreams;

  private playbackVolumeTransformer?: VolumeTransformer;

  private currentRecordDevice?: string;

  private recordStream?: ChildProcessWithoutNullStreams;

  private recordVolumeTransformer?: VolumeTransformer;

  private recordNoiseReductor?: NoiseReductor;

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
      const { Events } = Constants;

      client.on(Events.VOICE_STATE_UPDATE, this.handleVoiceStateUpdate.bind(this));
    });

    app.on(AppEvents.CONFIG_UPDATE, this.handleConfigUpdate.bind(this));
  }

  private handleConfigUpdate(config: ConfigManager) {
    const voiceSettings = config.get('voiceSettings');

    for (const entries of this.streams.entries()) {
      const settings = config.get('userVolumeSettings')[entries[0].id] || {};

      settings.volume = settings.volume ?? 100;
      settings.muted = settings.muted ?? false;
      entries[1].setVolume(settings.muted ? 0 : settings.volume);
    }

    if (this.currentPlaybackDevice !== (voiceSettings.outputDevice || 'default')) {
      this.currentPlaybackDevice = voiceSettings.outputDevice || 'default';
      this.initPlayback();
    }

    if (this.currentRecordDevice !== (voiceSettings.inputDevice || 'default')) {
      this.currentRecordDevice = voiceSettings.inputDevice || 'default';
      this.initRecord();
    }

    this.playbackVolumeTransformer?.setVolume((voiceSettings.outputVolume || 100) / 100);
    this.recordVolumeTransformer?.setVolume((voiceSettings.inputVolume || 100) / 100);
    this.recordNoiseReductor?.setSensivity(voiceSettings.inputSensitivity || 0);
  }

  private handleVoiceStateUpdate(o: VoiceState, n: VoiceState) {
    if (!n.member || n.member.user === app.client.user) {
      return;
    }

    if (o.channel === this.channel && n.channel !== this.channel) {
      this.connectToMixer(n.member);
    }

    if (o.channel !== this.channel && n.channel === this.channel) {
      this.disconnectFromMixer(n.member);
    }
  }

  private initComponent() {
    const { layout, infoLabel, statusLabel, discntBtn } = this;

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
    this.channel = undefined;
    this.connection = undefined;
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
    if (!this.mixer) {
      return;
    }

    const stream = this.connection?.receiver.createStream(member.user, {
      mode: 'pcm',
      end: 'manual',
    });

    if (stream) {
      const userVolumeSettings = app.config.get('userVolumeSettings');
      const volume = userVolumeSettings[member.id]?.volume ?? 100;
      const muted = userVolumeSettings[member.id]?.muted ?? false;
      const input = new Input({
        ...MIXER_OPTIONS,
        volume: muted ? 0 : volume,
      });

      this.streams.set(member, input);
      this.mixer.addInput(input);
      stream.pipe(input);
    } else {
      error(`Couldn't connect member ${member} to the voice channel ${this.channel?.name}.`);
    }
  }

  private disconnectFromMixer(member: GuildMember) {
    if (!this.mixer) {
      return;
    }

    const input = this.streams.get(member);

    if (input) {
      this.mixer.removeInput(input);
      input.end();
    } else {
      error(`Couldn't disconnect a member ${member} from the playback stream.`);
    }
  }

  private initPlayback() {
    if (!this.connection || !this.channel) {
      return;
    }

    const { channel } = this;

    this.mixer?.close();
    this.playbackStream?.kill();
    this.streams.clear();

    pipeline(
      (this.mixer = new Mixer(MIXER_OPTIONS)), // Initialize the member streams mixer
      ((this.playbackVolumeTransformer = new VolumeTransformer({
        type: 's16le',
      })) as unknown) as Transform, // Change the volume
      (this.playbackStream = createPlaybackStream()).stdin, // Output to a playback stream
      (err) => err && debug("Couldn't finish playback pipeline.", err)
    );

    for (const member of channel.members.filter((m) => m.user !== app.client.user).values()) {
      this.connectToMixer(member);
    }
  }

  private initRecord() {
    if (!this.connection) {
      return;
    }

    this.connection.dispatcher.end();

    const recorder = pipeline(
      (this.recordStream = createRecordStream()).stdout, // Open a recording stream
      ((this.recordVolumeTransformer = new VolumeTransformer({
        type: 's16le',
      })) as unknown) as Transform,
      // Change the volume
      (this.recordNoiseReductor = new NoiseReductor(this.onSpeaking.bind(this))), // Audio gate
      (err) => err && debug("Couldn't finish recording pipeline.", err)
    );

    this.connection.play(recorder, { bitrate: 256, type: 'converted', highWaterMark: 0 });
  }

  private async joinChannel(channel: VoiceChannel) {
    const { infoLabel, statusLabel, createConnection, initPlayback, initRecord } = this;

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
      this.connection = await createConnection.call(this, channel);
      statusLabel.setText("<font color='#faa61a'>Connecting Devices</font>");
      this.connection.play(new Silence(), { type: 'opus' }); // To receive audio we need to send something.

      initPlayback.call(this);
      initRecord.call(this);

      this.handleConfigUpdate(app.config);
      statusLabel.setText("<font color='#43b581'>Voice Connected</font>");
    } catch (e) {
      statusLabel.setText("<font color='#f04747'>Error</font>");
      error('Could not join the voice channel.', e);
    }
  }

  private onSpeaking(value: boolean) {
    if (!this.connection) {
      return;
    }

    this.connection.setSpeaking(value ? 1 : 4);
    this.connection.emit('speaking', app.client.user, this.connection.speaking);
  }

  private async createConnection(channel: VoiceChannel) {
    const connection = await channel.join();

    connection.on('warn', warn.bind(this, '[djs]'));
    connection.on('error', error.bind(this, '[djs]'));
    connection.on('failed', error.bind(this, '[djs]'));

    return connection;
  }
}
