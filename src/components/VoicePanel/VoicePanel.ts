import {
  Direction, QBoxLayout, QLabel, QSize, QWidget,
} from '@nodegui/nodegui';
import { Client } from 'discord.js';
import { Constants, DQConstants, VoiceChannel } from 'discord.js';
import { join } from 'path';
import Speaker from 'speaker';
import { PassThrough, Stream } from 'stream';
import { app } from '../..';
import { Events as AppEvents } from '../../structures/Events';
import { DIconButton } from '../DIconButton/DIconButton';

const merge = (...streams: Stream[]) => {
  let pass = new PassThrough();
  // let waiting = streams.length;
  for (const stream of streams) {
    pass = stream.pipe(pass, { end: false });
    // stream.once('end', () => --waiting === 0 && pass.emit('end'));
  }
  return pass;
};

const mic = require('mic');

export class VoicePanel extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private infoLabel = new QLabel(this);

  private discntBtn = new DIconButton({
    iconPath: join(__dirname, 'assets/icons/phone-remove.png'),
    iconQSize: new QSize(24, 24),
    tooltipText: 'Disconnect',
  });

  private pass?: PassThrough;

  private speaker?: Speaker;

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
    this.setLayout(layout);
  }

  private handleDisconnectButton() {
    app.client.voice?.connections.first()?.disconnect();
    this.speaker?.close(false);
    this.hide();
  }

  private async joinChannel(channel: VoiceChannel) {
    this.infoLabel.setText(channel.name);
    const connection = await channel.join();
    this.speaker = new Speaker({
      channels: 2, // 2 channels
      bitDepth: 16, // 16-bit samples
      sampleRate: 48000, // 44,100 Hz sample rate
    });
    const streams = channel.members
      .filter((m) => m.user !== app.client.user)
      .map((member) => connection.receiver.createStream(member.user, { mode: 'pcm', end: 'manual' }));
    this.pass = merge(...streams);
    this.pass.pipe(this.speaker);
    this.show();
    /*
      const mi = mic({
        rate: '48000',
        channels: '2',
      });
      console.log({ mic, connection });
      connection.play(mi.getAudioStream()); */
  }
}
