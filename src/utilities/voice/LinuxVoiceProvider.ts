import { execSync } from 'child_process';
import { createLogger } from '../Console';
import { ID, S16LE_OPTIONS } from './VoiceOptions';
import { VoiceProvider } from './VoiceProvider';

const { error } = createLogger('LinuxVoiceProvider');

/**
 * VoiceProvider for systems on Linux with PulseAudio support.
 */
export class LinuxVoiceProvider extends VoiceProvider {
  public PLAYBACK_OPTIONS = [
    ...S16LE_OPTIONS,
    ID.PLAYBACK_OPTIONS,
    '-i',
    '-',
    '-f',
    'pulse',
    '-buffer_duration',
    '5',
    '-name',
    ID.APP_NAME,
    ID.PLAYBACK_DEVICE,
  ];

  public RECORD_OPTIONS = [
    '-f',
    'pulse',
    '-name',
    ID.APP_NAME,
    '-i',
    ID.RECORD_DEVICE,
    ID.RECORD_OPTIONS,
    ...S16LE_OPTIONS,
    '-',
  ];

  public readonly PLAYBACK_DEFAULT_DEVICE = 'default';

  public readonly RECORD_DEFAULT_DEVICE = 'default';

  createPlaybackStream = this.createFFmpegPlaybackStream;

  createRecordStream = this.createFFmpegRecordStream;

  getInputDevices = () => {
    try {
      const sourcesOut = execSync('pactl list sources short').toString();
      const sources = sourcesOut
        .split('\n')
        .map((value) => value.split('\t')[1])
        .filter((value) => value);

      return sources;
    } catch (e) {
      error(e);

      return [this.RECORD_DEFAULT_DEVICE];
    }
  };

  getOutputDevices = () => {
    try {
      const sinksOut = execSync('pactl list sinks short').toString();
      const sinks = sinksOut
        .split('\n')
        .map((value) => value.split('\t')[1])
        .filter((value) => value);

      return sinks;
    } catch (e) {
      error(e);

      return [this.PLAYBACK_DEFAULT_DEVICE];
    }
  };
}
