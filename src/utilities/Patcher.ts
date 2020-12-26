/**
 * Return a function which calls oldFunc then newFunc, adding what
 * oldFunc returned as the first argument of newFunc
 * @param oldFunc Function called before the new function
 * @param newFunc Function called after the old function
 */
export function patchAfter(
  oldFunc: (...args: any[]) => any,
  newFunc: (this: any, returnValue: any, ...args: any[]) => any
): (...args: any[]) => any {
  function patch(this: any, ...args: any[]) {
    const ret = oldFunc.apply(this, args);

    return newFunc.apply(this, [ret, ...args]);
  }

  return patch;
}

/**
 * Return a function which calls newFunc, and if it didn't
 * return anything, calls oldFunc
 * @param oldFunc Function called after the new function
 * @param newFunc Function called before the old function
 */
export function patchBefore(
  oldFunc: (...args: any[]) => any,
  newFunc: (this: any, ...args: any[]) => any
): (...args: any[]) => any {
  function patch(this: any, ...args: any[]) {
    const ret = newFunc.apply(this, args);

    return typeof ret === 'undefined' ? oldFunc.apply(this, args) : ret;
  }

  return patch;
}

/**
 * Monkey patch a class into another. Optional patch's members are discarded
 * @param prototypeToPatch Prototype of the class to patch
 * @param PatchClass Class used as a patch
 */
export function patchClass(prototypeToPatch: any, PatchClass: any) {
  const properties = {
    ...Object.getOwnPropertyDescriptors(new PatchClass()),
    ...Object.getOwnPropertyDescriptors(PatchClass.prototype),
  };

  Object.defineProperties(prototypeToPatch, properties);
}
