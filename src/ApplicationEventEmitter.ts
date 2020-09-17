import { EventEmitter } from 'events';
import { EventArgs, Events } from './structures/Events';

type ValueOf<T> = T[keyof T];

export class ApplicationEventEmitter extends EventEmitter {
  public emit<K extends keyof EventArgs>(event: K, ...args: EventArgs[K]) {
    return super.emit(event, ...args);
  }
  public on<K extends ValueOf<typeof Events>>(event: K, listener: (...args: EventArgs[K]) => any) {
    return super.on(event, listener as () => void);
  }
  public off<K extends ValueOf<typeof Events>>(event: K, listener: (...args: EventArgs[K]) => any) {
    return super.off(event, listener as () => void);
  }
}