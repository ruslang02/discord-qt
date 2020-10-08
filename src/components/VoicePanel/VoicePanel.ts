import {
  Direction, QBoxLayout, QLabel, QSize, QWidget,
} from '@nodegui/nodegui';
import {
  Client, Constants, DQConstants, VoiceChannel,
} from 'discord.js';
import merge from 'merge-stream';
import { join } from 'path';
import PulseAudio, { PlaybackStream, RecordStream } from 'pulseaudio2';
import { app } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { DIconButton } from '../DIconButton/DIconButton';

type MergedStream = ReturnType<typeof merge>;

let pulse: PulseAudio;
setTimeout(() => {
  pulse = new PulseAudio({
    client: app.name,
    flags: 'noflags|noautospawn|nofail',
  });
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

  private async joinChannel(channel: VoiceChannel) {
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
