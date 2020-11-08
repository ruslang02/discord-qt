import { Transform } from 'stream';

export class NoiseReductor extends Transform {
  private sensivity = 0;

  private muted = false;

  private timer?: any;

  constructor(private onSetSpeaking: (value: boolean) => void) {
    super();
  }

  _transform(chunk: Buffer, _encoding: string, callback: (err: Error | null, val: any) => void) {
    const N = chunk.length;
    const sum = chunk.reduce((prev, cur) => prev + cur, 0);
    const loudness = Math.sqrt(sum / N);
    if (loudness < this.sensivity) {
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.muted = true;
          this.onSetSpeaking(false);
        }, 400);
      }
    } else {
      clearTimeout(this.timer);
      this.timer = undefined;
      this.muted = false;
      this.onSetSpeaking(true);
    }
    callback(null, this.muted ? Buffer.alloc(chunk.length, 0) : chunk);
  }

  setSensivity(value: number) {
    this.sensivity = value;
  }
}
