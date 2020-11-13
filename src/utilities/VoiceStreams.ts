import ChildProcess from 'child_process';
import { FFmpeg } from 'prism-media';
import { app } from '..';
import { createLogger } from './Console';

const { debug } = createLogger('Voice');

const APP_NAME = '{app_name}';

const PLAYBACK_DEVICE = '{playback_device}';

const RECORD_DEVICE = '{record_device}';

const PLAYBACK_OPTIONS = [
  '-f', 's16le',
  '-ar', '48000',
  '-ac', '2',
  '-loglevel', 'quiet',
  '-guess_layout_max', '0',
  '-i', '-',
  '-f', 'pulse',
  '-buffer_duration', '5',
  '-name', APP_NAME,
  PLAYBACK_DEVICE,
];

const RECORD_OPTIONS = [
  '-name', APP_NAME,
  '-frame_size', '960',
  '-f', 'pulse',
  '-i', RECORD_DEVICE,
  '-filter', 'lowpass=12000,afftdn=nr=50',
  '-f', 's16le',
  '-ar', '48000',
  '-ac', '2', '-',
];

function processOption(opts: { device?: string }, value: string): string {
  switch (value) {
    case APP_NAME:
      return app.name;
    case PLAYBACK_DEVICE:
      return opts.device || app.config.voiceSettings.outputDevice || 'default';
    case RECORD_DEVICE:
      return opts.device || app.config.voiceSettings.inputDevice || 'default';
    default:
  }
  return value;
}

export function createPlaybackStream(opts = {}) {
  const options = PLAYBACK_OPTIONS.map(processOption.bind(global, opts));
  const stream = ChildProcess.spawn(FFmpeg.getInfo().command, options);
  stream.stderr.on('data', (chunk) => debug('[Playback ffmpeg]', chunk.toString()));
  return stream;
}

export function createRecordStream(opts = {}) {
  const options = RECORD_OPTIONS.map(processOption.bind(global, opts));
  const stream = ChildProcess.spawn(FFmpeg.getInfo().command, options);
  stream.stderr.on('data', (chunk) => debug('[Record ffmpeg]', chunk.toString()));
  return stream;
}
