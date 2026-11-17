import { addServiceHandgun } from './serviceHandgun'

export { animateServiceHandgun as animateMussePistol } from './serviceHandgun'

/** Preserve Musse’s existing equipment API and named model parts. */
export function addMussePistol(
  options: Omit<Parameters<typeof addServiceHandgun>[0], 'owner' | 'hand'>,
): void {
  addServiceHandgun({ ...options, owner: 'musse' })
}
