/**
 * The keys the hunt manual lists — the ones that actually do something.
 *
 * Nen keys belong to the shared controller (`lib/nen/controls.ts`, read by
 * `TourScene`); the page only owns the two keys that controller leaves free.
 * The manual used to describe a mapping the page had stopped honouring: N for
 * Ren, F for En, R to recover, and I/O/P for In, Gyo and Ken.
 */
import { NEN_KEYS } from '../nen/controls'

/** The page's own keys: everything else is the shared Nen controller's. */
export const HUNT_PAGE_KEYS = { lay: 'KeyV', take: 'KeyB' } as const

export interface HuntManualControl {
  keys: string[]
  description: string
  descriptionFr: string
}

const label = (code: string) => code.replace(/^Key/, '').replace(/^Digit/, '')

export const HUNT_MANUAL_CONTROLS: HuntManualControl[] = [
  { keys: ['W', 'A', 'S', 'D'], description: 'Move / Walk', descriptionFr: 'Se déplacer' },
  {
    keys: [label(NEN_KEYS.zetsu), label(NEN_KEYS.ten)],
    description: 'Zetsu (hide aura) / back to Ten',
    descriptionFr: "Zetsu (cacher l'aura) / revenir au Ten",
  },
  { keys: [label(NEN_KEYS.en)], description: 'En (sweep)', descriptionFr: 'En (balayage)' },
  { keys: [label(NEN_KEYS.ren)], description: 'Ren', descriptionFr: 'Ren' },
  {
    keys: [label(NEN_KEYS.shu)],
    description: 'Shu (imbue the aimed object)',
    descriptionFr: "Shu (imprégner l'objet visé)",
  },
  { keys: [label(NEN_KEYS.hatsu)], description: 'Hatsu', descriptionFr: 'Hatsu' },
  {
    keys: [label(HUNT_PAGE_KEYS.lay)],
    description: 'Lay an entrave (Bungee Gum)',
    descriptionFr: 'Poser une entrave (Bungee Gum)',
  },
  {
    keys: [label(HUNT_PAGE_KEYS.take)],
    description: 'Take an entrave back (hunt and duel)',
    descriptionFr: 'Reprendre une entrave (traque et duel)',
  },
  {
    keys: ['1', '2', '3', '4'],
    description: 'Duel: guard head / torso / arms / legs',
    descriptionFr: 'Duel : garde tête / torse / bras / jambes',
  },
  {
    keys: [label(NEN_KEYS.gyo), label(NEN_KEYS.in), label(NEN_KEYS.ken)],
    description: 'Duel: Gyo / In / Ken',
    descriptionFr: 'Duel : Gyo / In / Ken',
  },
  {
    keys: ['Space', label(NEN_KEYS.ko), label(NEN_KEYS.action)],
    description: 'Duel: gather a Ko',
    descriptionFr: 'Duel : concentrer un Ko',
  },
  { keys: ['?'], description: 'This manual', descriptionFr: 'Ce manuel' },
]
