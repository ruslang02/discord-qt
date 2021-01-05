import { arch, platform } from 'os';
import { createLogger } from '../Console';
import { DarwinVoiceProvider } from './DarwinVoiceProvider';
import { VoiceProvider } from './VoiceProvider';
import { LinuxVoiceProvider } from './LinuxVoiceProvider';
import { Win32VoiceProvider } from './Win32VoiceProvider';

const { warn } = createLogger('Voice');

function warnNoSupport() {
  warn(`Voice support is not available on ${platform()} ${arch()}.`);
}

/**
 * Provides a VoiceProvider for the user's platform.
 */
class VoiceProviderManager {
  private provider: VoiceProvider | null = null;

  public getProvider() {
    return this.provider;
  }

  constructor() {
    const architecture = arch();

    switch (platform()) {
      case 'linux':
        this.provider = new LinuxVoiceProvider();
        break;

      case 'win32':
        if (['ia32', 'x64'].includes(architecture)) {
          this.provider = new Win32VoiceProvider();
        } else {
          warnNoSupport();
        }

        break;

      case 'darwin':
        if (architecture === 'x64') {
          this.provider = new DarwinVoiceProvider();
        } else {
          warnNoSupport();
        }

        break;

      default:
    }
  }
}

export const voiceProviderManager = new VoiceProviderManager();
export const voiceProvider = voiceProviderManager.getProvider();
