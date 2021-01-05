import { Writable } from 'stream';

export type PlaybackStream = {
  stream: Writable;
  device: string;
  end(): void;
};
