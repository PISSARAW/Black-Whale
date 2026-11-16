import type { CounterplayKind } from './fightCounterplay'

export const COUNTERPLAY_TEXT: Record<CounterplayKind, readonly [string, string]> = {
  heat: [
    'Chaleur visible : restez hors du cercle, la garde ne bloque pas le soleil.',
    'Visible heat: stay outside the circle; guard does not block the sun.',
  ],
  projectile: [
    'Projectile repéré : gardez selon sa trajectoire ou sautez pour approcher.',
    'Detected projectile: guard its trajectory or jump to approach.',
  ],
  music: [
    'Performance perceptible : couvrez les oreilles ou sortez de portée. Couvrir les oreilles occupe les mains.',
    'Perceptible performance: cover the ears or leave range. Covering the ears occupies the hands.',
  ],
  tether: [
    'Liaison repérée : frapper le porteur peut interrompre sa traction ; repérer le fil ne le dissipe pas.',
    'Detected tether: hitting the owner can interrupt pulling; detecting the string does not dispel it.',
  ],
  'sleeping-body': [
    'Corps endormi visible : approchez, frappez bas ou appelez-le si la parole peut être entendue.',
    'Visible sleeping body: approach, strike low, or call if speech can be heard.',
  ],
  preparation: [
    'Préparation visible : gagnez la distance pour l’interrompre avec un vrai contact.',
    'Visible preparation: close the distance to interrupt it with actual contact.',
  ],
  recovery: [
    'Récupération visible : une punition exige encore la bonne portée et un corps libre.',
    'Visible recovery: punishment still requires range and a free body.',
  ],
}
