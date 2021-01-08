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
    const proc = spawn(FFplay, args);

    proc.on('exit', (code) => debug(`Playback stream closed with code ${code}.`));
    proc.stderr.on('data', (chunk) => debug(chunk.toString()));

    return { device, stream: proc.stdin, end: () => proc.kill() };
  };

  protected createFFmpegPlaybackStream = (options: VoiceOptions = {}) => {
    const { FFmpeg, PLAYBACK_OPTIONS } = this;
    const { args, device } = processArgs(this, options, PLAYBACK_OPTIONS);

    debug(`Starting the playback stream, args: ${args.join(' ')}`);
    const proc = spawn(FFmpeg, args);

    proc.on('exit', (code) => debug(`Playback stream closed with code ${code}.`));
    proc.stderr.on('data', (chunk) => debug(chunk.toString()));

    return { device, stream: proc.stdin, end: () => proc.kill() };
  };

  protected createFFmpegRecordStream = (options: VoiceOptions = {}) => {
    const { FFmpeg, RECORD_OPTIONS } = this;
    const { args, device } = processArgs(this, options, RECORD_OPTIONS);

    debug(`Starting the record stream, args: ${args.join(' ')}`);
    const proc = spawn(FFmpeg, args);

    proc.on('exit', (code) => debug(`Record stream closed with code ${code}.`));
    proc.stderr.on('data', (chunk) => debug(chunk.toString()));

    return { device, stream: proc.stdout, end: () => proc.kill() };
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
