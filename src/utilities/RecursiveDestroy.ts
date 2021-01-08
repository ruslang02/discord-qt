import { Component, QWidget } from '@nodegui/nodegui';

function destroy(widget: Component) {
  if (widget instanceof QWidget) {
    // eslint-disable-next-line no-use-before-define
    recursiveDestroy(widget);
  }
}

export function recursiveDestroy(widget: QWidget) {
  // eslint-disable-next-line no-param-reassign
  widget.native.destroyed = true;
  widget.nodeChildren.forEach(destroy);

  if (widget.layout) {
    widget.layout.nodeChildren.forEach(destroy);
  }
}
