import { gyoSight } from './nenPerception'
import { createVisitHatsuModel, type VisitHatsuKind } from './visitHatsuModel'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Reuse the Nendex/visit anatomy; every visible prop follows an executable effect. */
export function createRetrospectiveScene(options: EffectSceneOptions): FighterEffectScene {
  const models = new Map<string, ReturnType<typeof createVisitHatsuModel>>()
  function show(
    key: string,
    model: VisitHatsuKind,
    position: { x: number; y: number; height: number },
  ) {
    const { x, y, height } = position
    let held = models.get(key)
    if (!held) {
      held = createVisitHatsuModel(options.THREE, { model, anchor: 'floor' })
      held.fit({ height })
      if (model === 'fun-fun-cloth') held.root.name = `chrollo-cloth:${key.split(':')[0]}`
      options.scene.add(held.root)
      models.set(key, held)
    }
    held.root.visible = true
    held.root.position.set(options.worldX(x), options.worldY(y), 0.3)
    return held
  }
  function syncSide(state: FightState, side: FightSide) {
    const fighter = state[side]
    syncGum(state, side)
    const fish = fighter.chrolloHistorical?.fish
    if (fish)
      for (let i = 0; i < 2; i++) {
        const target = state[fish.target]
        const angle = (fish.frames / 60) * 1.2 + i * Math.PI
        const model = show(`${side}:fish:${i}`, 'indoor-fish', {
          x: target.x + Math.cos(angle) * 4,
          y: target.y + 4 + Math.sin(angle) * 2,
          height: 0.8,
        })
        model.root.name = `chrollo-fish:${side}:${i}`
        model.root.rotation.y = angle
      }
    if (fighter.chrolloHistorical?.cloth)
      show(`${side}:cloth`, 'fun-fun-cloth', { x: fighter.x, y: fighter.y + 5, height: 0.35 })
  }
  function syncGum(state: FightState, side: FightSide) {
    const fighter = state[side]
    if (fighter.gumWoundSeals && visibleGum(state, side, options.viewer?.() ?? 'player'))
      show(`${side}:gum-seal`, 'bungee-gum', { x: fighter.x, y: fighter.y + 8, height: 0.3 })
    if (
      fighter.gumCatch &&
      !fighter.gumCatch.released &&
      visibleGum(state, side, options.viewer?.() ?? 'player')
    )
      show(`${side}:gum-catch`, 'bungee-gum', {
        x: fighter.x + fighter.facing * 2.5,
        y: fighter.y + 7,
        height: 0.4,
      })
  }
  return {
    sync(state) {
      for (const model of models.values()) model.root.visible = false
      for (const side of ['player', 'opponent'] as const) syncSide(state, side)
    },
    dispose() {
      for (const model of models.values()) model.dispose()
      models.clear()
    },
  }
}

function visibleGum(state: FightState, side: FightSide, viewer: FightSide): boolean {
  if (side === viewer || !state[side].nen.in) return true
  return gyoSight(state[viewer])
}
