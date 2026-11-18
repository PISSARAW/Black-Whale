import type { FightState } from '../../src/lib/fighting/types'
export function lastContactProof(states: FightState[]) {
  const firstSun = states.findIndex((s) => s.player.hatsuEffects.sunMark > 0)
  const lastSun = states.findLastIndex((s) => s.player.hatsuEffects.sunMark > 0)
  const fish = states.filter((s) => s.opponent.chrolloHistorical?.fish)
  const copies = states.flatMap((s) => s.battlefield?.entities.filter((e) => e.copy) ?? [])
  const caught = states.find((s) => s.player.gumCatch?.projectile)
  const finish = states.find((s) => s.player.attack?.moveId === 'hisoka:finisher')
  return {
    earlySunSecond: firstSun / 60,
    sunSurvivesSeconds: (lastSun - firstSun) / 60,
    hiddenGum: states.some((s) => s.bungeeGum?.hidden),
    rebound: states.some((s) => s.bungeeGum?.rebounding),
    recall: states.some((s) => s.bungeeGum?.retracting && !s.bungeeGum.rebounding),
    copies: {
      created: copies.length > 0,
      animated: copies.some((e) => e.copy?.order === 'attack'),
      marked: copies.some((e) => e.arena?.sun),
      headDestroyed: copies.some((e) => !e.copy?.headAttached),
      destroyed: copies.some((e) => e.health === 0),
    },
    convertHands: states.some((s) => s.opponent.chrolloHistorical?.appearance?.model === 'hisoka'),
    clothCapture: states.some((s) => s.player.clothCapture?.owner === 'opponent'),
    indoorFish: {
      activeFrames: fish.length,
      deferredWounds: Math.max(0, ...fish.map((s) => s.opponent.chrolloHistorical!.fish!.wounds)),
      sealedRoom: fish.every((s) =>
        s.battlefield?.entities.some(
          (e) => e.id === s.opponent.chrolloHistorical!.fish!.roomId && e.sealed,
        ),
      ),
    },
    stolenTexture: states.some((s) =>
      s.player.skillHunterStolen?.some((e) => e.moveId === 'hisoka:downSpecial'),
    ),
    chrolloUsesTexture: states.some((s) => s.opponent.textureSurprise),
    phoneCall: states.some((s) => (s.opponent.chrolloHistorical?.phone?.calls ?? 0) > 0),
    caughtObject: caught?.player.gumCatch?.projectile?.shape,
    returnedObject: states.some((s) =>
      s.projectiles.some(
        (p) => p.owner === 'player' && p.shape === caught?.player.gumCatch?.projectile?.shape,
      ),
    ),
    hisokaFinisher: Boolean(finish),
    finalParry: states.some(
      (s) =>
        s.impact?.parried &&
        s.impact.attacker === 'player' &&
        s.player.attack?.moveId === 'hisoka:finisher',
    ),
  }
}
