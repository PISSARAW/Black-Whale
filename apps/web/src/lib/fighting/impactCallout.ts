import type { FightImpact } from './types'

const WORDS = {
  fr: {
    transfer: 'TRANSFERT',
    left: 'MAIN GAUCHE',
    avoided: 'FUTUR ÉVITÉ',
    parry: 'PARADE · RYU',
    guard: 'GARDE',
    down: 'CHUTE',
  },
  en: {
    transfer: 'TRANSFER',
    left: 'LEFT HAND',
    avoided: 'FUTURE EVADED',
    parry: 'PARRY · RYU',
    guard: 'BLOCK',
    down: 'KD',
  },
}

export function impactCallout(impact: FightImpact, language: 'fr' | 'en'): string {
  const words = WORDS[language]
  if (impact.transfer)
    return `SWEET HOME · ${impact.transfer.backlash ? words.left : words.transfer} · ${damageLabel(impact)}`
  if (impact.invulnerable) return 'INVUL'
  if (impact.avoided) return words.avoided
  if (impact.parried) return words.parry
  if (impact.blocked) return impact.damage === 0 ? 'KEN' : words.guard
  return [...hitLabels(impact, words.down), damageLabel(impact)].join(' · ')
}

function damageLabel(impact: FightImpact): string {
  return `-${impact.damage} · +${impact.points}`
}

function hitLabels(impact: FightImpact, down: string): string[] {
  const labels: Array<[boolean, string]> = [
    [impact.counterHit, 'COUNTER'],
    [impact.punish && !impact.counterHit, 'PUNISH'],
    [impact.antiAir, 'ANTI-AIR'],
    [impact.wallSplat, 'WALL'],
    [impact.comboHits > 1, `${impact.comboHits} HITS`],
    [impact.critical, 'CRIT'],
    [impact.knockdown, down],
  ]
  return labels.filter(([visible]) => visible).map(([, label]) => label)
}
