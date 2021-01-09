import { Component, QWidget } from '@nodegui/nodegui';

/**
 * Recursively marks the widget and its children as destroyed.
 * @param widget Widget to invalidate.
 */
export function recursiveDestroy(component: Component) {
  const widget = component as QWidget;

  widget.native.destroyed = true;
  widget.nodeChildren.forEach(recursiveDestroy);

  if (widget.layout) {
    widget.layout.nodeChildren.forEach(recursiveDestroy);
  }
}
