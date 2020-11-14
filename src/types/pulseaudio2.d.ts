/* eslint-disable */
declare module 'pulseaudio2' {
  import { EventEmitter } from 'events';
  import { Stream } from 'stream';

  export type ContextOptions = {
    client?: string;
    server?: string;
    flags?: string;
  };

  export type StreamOptions = {
    stream?: string;
    device?: string;
    format?: string;
    rate?: number;
    channels?: number;
    latency?: number;
    flags?: string;
  };

  export type ContextState = 'connecting' | 'authorizing' | 'setting_name' | 'ready' | 'terminated';

  export class Context extends EventEmitter {
    constructor(opts: ContextOptions);
    on(event: 'state', listener: (state: ContextState) => void): this;
    on(event: 'error', listener: (error: string) => void): this;
    on(event: 'connection', listener: () => void): this;

    source(): Promise<any[]>;
    sink(): Promise<any[]>;

    createRecordStream(opts: StreamOptions): RecordStream;
    createPlaybackStream(opts: StreamOptions): PlaybackStream;

    end(): void;
  }

  export abstract class RecordStream extends Stream.Readable {
    constructor(ctx: Context, opts: StreamOptions);
    stop(): this;
    play(): this;
    end(): void;
  }

  export abstract class PlaybackStream extends Stream.Writable {
    constructor(ctx: Context, opts: StreamOptions);
    stop(): this;
    play(): this;
    discard(): void;
  }

  export default Context;
}
