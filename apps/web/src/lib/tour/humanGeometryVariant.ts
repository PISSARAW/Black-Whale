import type { BufferGeometry } from 'three'

const VARIANTS = new WeakMap<BufferGeometry, Map<string, BufferGeometry>>()

/**
 * Derive one cached, mode-specific geometry from the canonical shared human buffer.
 *
 * Tour owns the source buffer. Consumers such as Clash may add baked tones or
 * morph targets to a clone, but must never mutate that source or create one clone
 * per figure. The variant name is also carried on the buffer for diagnostics.
 */
export function humanGeometryVariant(
  source: BufferGeometry,
  variant: string,
  derive: (source: BufferGeometry) => BufferGeometry,
): BufferGeometry {
  let variants = VARIANTS.get(source)
  if (!variants) {
    variants = new Map()
    VARIANTS.set(source, variants)
  }
  const held = variants.get(variant)
  if (held) return held
  const made = derive(source)
  made.userData = {
    ...made.userData,
    sharedHuman: true,
    humanGeometryVariant: variant,
  }
  variants.set(variant, made)
  return made
}
