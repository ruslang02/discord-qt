/* eslint-disable global-require */
import { ID, S16LE_OPTIONS } from './VoiceOptions';
import { VoiceProvider } from './VoiceProvider';

/**
 * VoiceProvider for systems on macOS.
 * THIS WAS NOT TESTED. I do not have a macOS system to test this
 * implementation's behaviour, most likely it's similar to Windows.
 * TODO: Input/output devices detection.
 */
export class DarwinVoiceProvider extends VoiceProvider {
  public PLAYBACK_OPTIONS = [...S16LE_OPTIONS, ID.PLAYBACK_OPTIONS, '-'];

  public RECORD_OPTIONS = [
    '-f',
    'avfoundation',
    '-i',
    `"none:${ID.RECORD_DEVICE}"`,
    ID.RECORD_OPTIONS,
    ...S16LE_OPTIONS,
    '-',
  ];

  public readonly PLAYBACK_DEFAULT_DEVICE = '0';

  public readonly RECORD_DEFAULT_DEVICE = '0';

  createPlaybackStream = this.createFFplayPlaybackStream;

  createRecordStream = this.createFFmpegRecordStream;

  getInputDevices = () => ['0'];

  getOutputDevices = () => ['0'];
}
