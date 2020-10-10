import { createLogger } from '../utilities/Console';

let Q = require('@nodegui/nodegui/dist/lib/QtWidgets/QWidget');
let addon = require('@nodegui/nodegui/dist/lib/utils/addon');

const consts = Object.getOwnPropertyNames(addon.default);
const noop = () => { };
const { debug, warn } = createLogger('Qt');
for (const object of consts) {
  addon.default[object] = new Proxy(addon.default[object], {
    construct(target, args) {
      const newArgs = [...args].map(a => a.__isProxy ? a.__proto__ : a);
      if (newArgs.includes(noop)) return noop;
      const newNative = new target(...newArgs);
      const native = new Proxy(newNative, {
        get: function (target, prop) {
          if (prop === '__isProxy') return true;
          if (prop === '__proto__') return newNative;
          if (prop === '_destroyed') return target._destroyed;
          if (target._destroyed) {
            warn(`Method ${String(prop)} was called of a dereferenced object of type ${target.constructor.name}`);
            return noop;
          }
          return function () {
            if ([...arguments].includes(noop)) return noop;
            const args = [...arguments].map(a => a?.__isProxy ? a.__proto__ : a);
            return target[prop].call(newNative, ...args);
          };
        },
      })
      return native;
    }
  })
}
const _setNodeParent = Q.NodeWidget.prototype.setNodeParent;
const processDelete = function (this: any) {
  this.native._destroyed = true;
  debug('destroyed', this.constructor.name);
};
const no = ['Component', 'EventWidget', 'YogaWidget', 'NodeObject', 'QObject'];
Q.NodeWidget.prototype.setNodeParent = function patchWidget() {
  if (this.native && !this._processed) {
    this._processed = true;
    if (!no.includes(this.constructor.name)) {
      this.addEventListener('DeferredDelete', processDelete.bind(this))
    }
  }
  return _setNodeParent.call(this, ...arguments);
}