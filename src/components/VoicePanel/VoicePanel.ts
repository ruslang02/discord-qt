import {
  ButtonRole,
  Direction, QBoxLayout, QLabel, QMessageBox, QPushButton, QSize, QWidget,
} from '@nodegui/nodegui';
import {
  Client, Constants, DQConstants, VoiceChannel,
} from 'discord.js';
import { __ } from 'i18n';
import merge from 'merge-stream';
import open from 'open';
import { join } from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Context, PlaybackStream, RecordStream } from 'pulseaudio2';
import { app } from '../..';
import { Events as AppEvents } from '../../utilities/Events';
import { createLogger } from '../../utilities/Console';
import { DIconButton } from '../DIconButton/DIconButton';

type MergedStream = ReturnType<typeof merge>;

const { error } = createLogger('VoicePanel');

let pulse: Context | undefined;
setTimeout(() => {
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const PulseAudio = require('pulseaudio2');
    pulse = new PulseAudio({
      client: app.name,
      flags: 'noflags|noautospawn|nofail',
    });
  } catch (e) {
    error('Voice capabilities are not available on this platform.');
  }
});
export class VoicePanel extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private infoLabel = new QLabel(this);

  private discntBtn = new DIconButton({
    iconPath: join(__dirname, 'assets/icons/phone-remove.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Disconnect',
  });

  private merged?: MergedStream;

  private playbackStream?: PlaybackStream;

  private recordStream?: RecordStream;

  constructor() {
    super();
    this.setObjectName('VoicePanel');
    this.initComponent();
    this.hide();
    app.on(AppEvents.JOIN_VOICE_CHANNEL, this.joinChannel.bind(this));
    app.on(AppEvents.NEW_CLIENT, (client: Client) => {
      const { Events } = Constants as unknown as DQConstants;
      client.on(Events.VOICE_STATE_UPDATE, (_o, n) => {
        if (n.member?.user === app.client.user) {
          if (n.speaking === null) this.hide();
          else this.show();
        }
      });
    });
  }

  private initComponent() {
    const { layout, infoLabel, discntBtn } = this;
    layout.setContentsMargins(8, 8, 8, 8);
    layout.setSpacing(8);

    const infoLayout = new QBoxLayout(Direction.LeftToRight);
    infoLayout.addWidget(infoLabel, 1);
    infoLayout.addWidget(discntBtn, 0);
    layout.addLayout(infoLayout);
    discntBtn.addEventListener('clicked', this.handleDisconnectButton.bind(this));
    discntBtn.setFixedSize(32, 32);
    this.setLayout(layout);
  }

  private handleDisconnectButton() {
    app.client.voice?.connections.first()?.disconnect();
    this.recordStream?.end();
    this.playbackStream?.stop();
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
      open(`https://discord.com/channels/${channel.guild.id}/${channel.id}`);
    });
    msgBox.open();
  }

  private async joinChannel(channel: VoiceChannel) {
    if (!pulse) {
      VoicePanel.openVoiceNotSupportedDialog(channel);
      return;
    }
    this.infoLabel.setText(channel.name);
    const connection = await channel.join();
    this.playbackStream = pulse.createPlaybackStream({
      latency: 0,
    });
    const streams = channel.members
      .filter((m) => m.user !== app.client.user)
      .map((member) => connection.receiver.createStream(member.user, { mode: 'pcm', end: 'manual' }));
    this.merged = merge(...streams);
    this.merged.pipe(this.playbackStream);
    this.show();
    this.recordStream = pulse.createRecordStream({
      latency: 0,
    });
    connection.play(this.recordStream, { bitrate: 384, type: 'converted' });
  }
}
