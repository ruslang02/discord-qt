import { platform } from 'os';
import { join } from 'path';

export function getFFmpeg() {
  if (platform() === 'linux') {
    return 'ffmpeg';
  }

  return join(__dirname, `ffmpeg${platform() === 'win32' ? '.exe' : ''}`);
}

export function getFFplay() {
  return join(__dirname, `ffplay${platform() === 'win32' ? '.exe' : ''}`);
}
