/** Identical exponential targets are redundant, including while the curve approaches them. */
export function compactOfflineAutomation() {
  const prototype = AudioParam.prototype
  const original = prototype.setTargetAtTime
  const targets = new WeakMap<AudioParam, { value: number; constant: number; time: number }>()
  const descriptors = new Map<string, PropertyDescriptor>()
  for (const method of [
    'setValueAtTime',
    'setValueCurveAtTime',
    'linearRampToValueAtTime',
    'exponentialRampToValueAtTime',
    'cancelScheduledValues',
    'cancelAndHoldAtTime',
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, method)
    if (!descriptor) continue
    descriptors.set(method, descriptor)
    Object.defineProperty(prototype, method, {
      ...descriptor,
      value: function (this: AudioParam, ...args: unknown[]) {
        targets.delete(this)
        return Reflect.apply(descriptor.value, this, args)
      },
    })
  }
  prototype.setTargetAtTime = function (value, time, constant) {
    const previous = targets.get(this)
    if (
      previous &&
      time >= previous.time &&
      value === previous.value &&
      constant === previous.constant
    )
      return this
    targets.set(this, { value, time, constant })
    return original.call(this, value, time, constant)
  }
  return () => {
    prototype.setTargetAtTime = original
    for (const [method, descriptor] of descriptors)
      Object.defineProperty(prototype, method, descriptor)
  }
}
