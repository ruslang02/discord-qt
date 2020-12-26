import { NativeElement, WidgetEventTypes } from '@nodegui/nodegui';
import { app } from '..';
import { createLogger } from '../utilities/Console';
import { patchBefore, patchClass } from '../utilities/Patcher';

const { NodeWidget } = require('@nodegui/nodegui/dist/lib/QtWidgets/QWidget');

const { debug } = createLogger('Qt');

const proto = NodeWidget.prototype;

const excludedClasses = ['Component', 'EventWidget', 'YogaWidget', 'NodeObject', 'QObject'];

class NodeWidgetPatch {
  native?: NativeElement;

  processDelete() {
    if (!this.native) {
      return;
    }

    this.native.destroyed = true;
    debug('destroyed', this.constructor.name);
  }

  processPress() {
    if (app.window?.shiftKeyPressed) {
      debug(this);
    }
  }

  setNodeParent = patchBefore(proto.setNodeParent, function afterSetNodeParent() {
    if (this.native && !this._processed) {
      this._processed = true;

      if (!excludedClasses.includes(this.constructor.name)) {
        this.addEventListener(WidgetEventTypes.DeferredDelete, this.processDelete.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonPress, this.processPress.bind(this));
      }
    }
  });
}

patchClass(proto, NodeWidgetPatch);
