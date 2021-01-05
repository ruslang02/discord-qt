import { app } from '../..';
import { VoiceProvider } from './VoiceProvider';

export type VoiceOptions = { device?: string; options?: string[] };

export const ID = {
  APP_NAME: '{app_name}',
  PLAYBACK_DEVICE: '{playback_device}',
  PLAYBACK_OPTIONS: '{playback_options}',
  RECORD_DEVICE: '{record_device}',
  RECORD_OPTIONS: '{record_options}',
} as const;

export const S16LE_OPTIONS = ['-f', 's16le', '-ar', '48000', '-ac', '2'];

export const flat = (arr: any[]) => arr.reduce((a, v) => a.concat(v), []);

let device: string = 'default';

function getPlaybackDevice(provider: VoiceProvider, opts: VoiceOptions) {
  const settings = app.config.get('voiceSettings');

  return opts.device ?? settings.outputDevice ?? provider.PLAYBACK_DEFAULT_DEVICE;
}

function getRecordDevice(provider: VoiceProvider, opts: VoiceOptions) {
  const settings = app.config.get('voiceSettings');

  return opts.device ?? settings.inputDevice ?? provider.RECORD_DEFAULT_DEVICE;
}

/**
 * A command-line argument placeholder with an actual value.
 * @param provider VoiceProvider currently used on client's system.
 * @param opts Playback/record options.
 * @param value The value to be processed.
 */
export function process(
  provider: VoiceProvider,
  opts: VoiceOptions,
  value: string
): string | string[] {
  const settings = app.config.get('voiceSettings');

  switch (value) {
    case ID.APP_NAME:
      return app.name;

    case ID.PLAYBACK_OPTIONS:
      return opts.options ?? settings.playbackOptions ?? [];

    case ID.RECORD_OPTIONS:
      return opts.options ?? settings.recordOptions ?? [];

    default:
  }

  if (value.includes(ID.PLAYBACK_DEVICE)) {
    device = getPlaybackDevice(provider, opts);

    return value.replace(ID.PLAYBACK_DEVICE, device);
  }

  if (value.includes(ID.RECORD_DEVICE)) {
    device = getRecordDevice(provider, opts);

    return value.replace(ID.RECORD_DEVICE, device);
  }

  return value;
}

/**
 * Processes FFmpeg command line arguments and flattens it into a string[].
 * @param provider VoiceProvider currently used on client's system.
 * @param options Playback/record options.
 * @param cmdArgs Command line arguments with placeholders.
 */
export function processArgs(provider: VoiceProvider, options: VoiceOptions, cmdArgs: string[]) {
  return {
    args: flat(cmdArgs.map((value) => process(provider, options, value))),
    device,
  };
}
