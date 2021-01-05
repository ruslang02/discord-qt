import { spawn } from 'child_process';
import { createLogger } from '../Console';
import { getFFmpeg, getFFplay } from './FFProvider';
import { PlaybackStream } from './PlaybackStream';
import { RecordStream } from './RecordStream';
import { processArgs, VoiceOptions } from './VoiceOptions';

const { debug } = createLogger('VoiceProvider');

/**
 * An abstraction over various implementations of audio input/output
 * across different platforms.
 */
export abstract class VoiceProvider {
  protected FFplay = getFFplay();

  protected FFmpeg = getFFmpeg();

  abstract PLAYBACK_OPTIONS: string[];

  abstract RECORD_OPTIONS: string[];

  abstract PLAYBACK_DEFAULT_DEVICE: string;

  abstract RECORD_DEFAULT_DEVICE: string;

  protected createFFplayPlaybackStream = (options: VoiceOptions = {}) => {
    const { FFplay, PLAYBACK_OPTIONS } = this;
    const { args, device } = processArgs(this, options, PLAYBACK_OPTIONS);

    debug(`Starting the playback stream, args: ${args.join(' ')}`);
    const { kill, stdin: stream, stderr } = spawn(FFplay, args);

    stderr.on('data', (chunk) => debug(chunk.toString()));

    return { device, stream, end: () => kill('SIGKILL') };
  };

  protected createFFmpegPlaybackStream = (options: VoiceOptions = {}) => {
    const { FFmpeg, PLAYBACK_OPTIONS } = this;
    const { args, device } = processArgs(this, options, PLAYBACK_OPTIONS);

    debug(`Starting the playback stream, args: ${args.join(' ')}`);
    const { kill, stdin: stream, stderr } = spawn(FFmpeg, args);

    stderr.on('data', (chunk) => debug(chunk.toString()));

    return { device, stream, end: () => kill('SIGKILL') };
  };

  protected createFFmpegRecordStream = (options: VoiceOptions = {}) => {
    const { FFmpeg, RECORD_OPTIONS } = this;
    const { args, device } = processArgs(this, options, RECORD_OPTIONS);

    debug(`Starting the record stream, args: ${args.join(' ')}`);
    const { kill, stdout: stream, stderr } = spawn(FFmpeg, args);

    stderr.on('data', (chunk) => debug(chunk.toString()));

    return { device, stream, end: () => kill('SIGKILL') };
  };

  /**
   * Creates an FFmpeg instance ready to play content.
   */
  abstract createPlaybackStream(options?: VoiceOptions): PlaybackStream;

  /**
   * Creates an FFmpeg instance ready to record audio.
   */
  abstract createRecordStream(options?: VoiceOptions): RecordStream;

  /**
   * Retrieves input devices.
   */
  abstract getInputDevices(): string[];

  /**
   * Retrieves output devices.
   */
  abstract getOutputDevices(): string[];
}
