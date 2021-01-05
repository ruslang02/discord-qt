import { execSync } from 'child_process';
import { ID, S16LE_OPTIONS } from './VoiceOptions';
import { VoiceProvider } from './VoiceProvider';

/**
 * VoiceProvider for systems on Windows.
 * TODO: Output devices detection.
 */
export class Win32VoiceProvider extends VoiceProvider {
  public PLAYBACK_OPTIONS = [...S16LE_OPTIONS, ID.PLAYBACK_OPTIONS, '-'];

  public RECORD_OPTIONS = [
    '-f',
    'dshow',
    '-audio_buffer_size',
    '80',
    '-i',
    `audio=${ID.RECORD_DEVICE}`,
    ID.RECORD_OPTIONS,
    ...S16LE_OPTIONS,
    '-',
  ];

  public readonly PLAYBACK_DEFAULT_DEVICE = '';

  public readonly RECORD_DEFAULT_DEVICE = '';

  createPlaybackStream = this.createFFplayPlaybackStream;

  createRecordStream = this.createFFmpegRecordStream;

  getInputDevices = () => {
    const { FFmpeg } = this;

    try {
      execSync(`${FFmpeg} -list_devices true -hide_banner -f dshow -i dummy`);
    } catch (e) {
      const [, , stderr] = e.output as Buffer[];
      const lines = stderr.toString().split('\n');
      let foundDAD = false;
      const devices: string[] = [];

      for (const line of lines) {
        if (line.includes('DirectShow audio devices')) {
          foundDAD = true;
        } else if (foundDAD && line.includes(']  "')) {
          const device = line.slice(line.indexOf(']  "') + 4, -1);

          devices.push(device);
        }
      }

      return devices;
    }

    return [];
  };

  getOutputDevices = () => ['Default'];
}
