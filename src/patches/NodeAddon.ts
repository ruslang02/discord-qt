/* eslint-disable no-proto */
import { createLogger } from '../utilities/Console';

const addon = require('@nodegui/nodegui/dist/lib/utils/addon');

const consts = Object.getOwnPropertyNames(addon.default);
const { trace } = createLogger('Qt');

const noop = () => {};

// Prevent crashes when a function call something from a destroyed Qt element
for (const obj of consts) {
  addon.default[obj] = new Proxy(addon.default[obj], {
    construct(Target, args) {
      const newArgs = [...args].map((a) => (a.__isProxy ? a.__proto__ : a));

      if (newArgs.includes(noop)) {
        return noop;
      }

      const newNative = new Target(...newArgs);

      newNative.destroyed = false;

      const native = new Proxy(newNative, {
        get(target, prop) {
          if (prop === '__isProxy') {
            return true;
          }

          if (prop === '__proto__') {
            return newNative;
          }

          if (prop === 'destroyed') {
            return target.destroyed;
          }

          if (target.destroyed || [...args].some((a) => a.destroyed)) {
            trace(
              `Method ${String(prop)} was called of a dereferenced object of type ${
                target.constructor.name
              }`
            );

            return noop;
          }

          return function ret(...retArgs: any[]) {
            if (retArgs.includes(noop)) {
              return noop;
            }

            const finalArgs = retArgs.map((a) => (a?.__isProxy ? a.__proto__ : a));

            return target[prop].call(newNative, ...finalArgs);
          };
        },
      });

      return native;
    },
  });
}
