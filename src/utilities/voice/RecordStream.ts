import { Readable } from 'stream';

export type RecordStream = {
  stream: Readable;
  device: string;
  end(): void;
};
