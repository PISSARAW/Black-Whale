import type { Object3D, PerspectiveCamera, Scene } from 'three'
import type { FightState } from '../types'
import type { FightComfort } from '../fightComfort'
import type { VictoryFrame } from './playback'
import type { VictoryFighter } from './catalogue'
import type { VictoryContext, VictoryDriver, VictoryModels } from './types'
import { victoryActor, resetVictoryActor, groundVictoryActor } from './actors'
import { victoryTransaction } from './transaction'
import { victoryLighting } from './lighting'
import { victoryWide } from './camera'
import { suppressVictoryFlashes } from './resources'
import { createHisokaVictory } from './hisoka'
import { createChrolloVictory } from './chrollo'
import { createChrolloSunMoonVictory } from './chrolloSunMoon'
import { createKurapikaVictory } from './kurapika'
import { createFeitanVictory } from './feitan'
import { createPhinksVictory } from './phinks'
import { createFranklinVictory } from './franklin'
import { createBenjaminVictory } from './benjamin'
import { createTserriednichVictory } from './tserriednich'
import { createLeorioVictory } from './leorio'
import { createHalkenburgVictory } from './halkenburg'
import { createCamillaVictory } from './camilla'
import { createKallutoVictory } from './kalluto'
import { createMachiVictory } from './machi'
import { createShizukuVictory } from './shizuku'
import { createBonolenovVictory } from './bonolenov'
import { createIllumiVictory } from './illumi'
import { createBiscuitVictory } from './biscuit'
import { createSaiyuVictory } from './saiyu'
import { createHanzoVictory } from './hanzo'
import { createBillVictory } from './bill'
import { createVoconteVictory } from './voconte'
import { createTerebellumVictory } from './terebellum'
import { createHinrighVictory } from './hinrigh'
import { createMelodyVictory } from './melody'
import { suspendFightExpression } from '../fightExpressionRig'
import { createBeyondCurseVictory } from './beyondCurse'
import { isBeyondCurse } from './beyondCurseSelection'
import { createLonghiVictory } from './longhi'
import { createFurykovVictory } from './furykov'
import { createThetaVictory } from './theta'
import { createMizaistomVictory } from './mizaistom'
import { createRihanVictory } from './rihan'
import { createZakuroVictory } from './zakuro'
import { createLynchVictory } from './lynch'
import { createLuiniVictory } from './luini'
import { createBashoVictory } from './basho'

const DRIVERS: Record<VictoryFighter, () => VictoryDriver> = {
  hisoka: createHisokaVictory,
  chrollo: createChrolloVictory,
  kurapika: createKurapikaVictory,
  feitan: createFeitanVictory,
  phinks: createPhinksVictory,
  franklin: createFranklinVictory,
  benjamin: createBenjaminVictory,
  tserriednich: createTserriednichVictory,
  leorio: createLeorioVictory,
  halkenburg: createHalkenburgVictory,
  camilla: createCamillaVictory,
  kalluto: createKallutoVictory,
  machi: createMachiVictory,
  shizuku: createShizukuVictory,
  bonolenov: createBonolenovVictory,
  illumi: createIllumiVictory,
  biscuit: createBiscuitVictory,
  saiyu: createSaiyuVictory,
  hanzo: createHanzoVictory,
  bill: createBillVictory,
  melody: createMelodyVictory,
  hinrigh: createHinrighVictory,
  terebellum: createTerebellumVictory,
  voconte: createVoconteVictory,
  longhi: createLonghiVictory,
  furykov: createFurykovVictory,
  theta: createThetaVictory,
  mizaistom: createMizaistomVictory,
  rihan: createRihanVictory,
  zakuro: createZakuroVictory,
  lynch: createLynchVictory,
  luini: createLuiniVictory,
  basho: createBashoVictory,
}
function victoryGap(context: Pick<VictoryContext, 'frame' | 'victim'>) {
  const base = {
    hisoka: 1.5,
    chrollo: 1.7,
    kurapika: 1.1,
    feitan: 2.3,
    phinks: 0.8,
    franklin: 2.7,
    benjamin: 1.6,
    tserriednich: 1.8,
    leorio: 2.4,
    halkenburg: 2.6,
    camilla: 1.9,
    kalluto: 2.2,
    machi: 2.1,
    shizuku: 2,
    bonolenov: 3.2,
    illumi: 2,
    biscuit: 2,
    saiyu: 2,
    melody: 2.1,
    hanzo: 2.8,
    bill: 2.3,
    hinrigh: 2.1,
    terebellum: 0.5,
    voconte: 2,
    longhi: 0.4,
    furykov: 1,
    theta: 1.8,
    mizaistom: 1.8,
    rihan: 1.8,
    zakuro: 1.9,
    lynch: 1.5,
    luini: 1.8,
    basho: 1.8,
  }
  return Math.min(3.5, base[context.frame.fighter] + context.victim.width * 0.5)
}
function hideAuxiliaryRoots(options: {
  scene: Scene
  visible: Object3D[]
  save: (root: Object3D) => void
}) {
  for (const root of options.scene.children) {
    if (options.visible.includes(root) || 'isLight' in root) continue
    options.save(root)
    root.visible = false
  }
}
function resolveDriver(frame: VictoryFrame, drivers: Map<string, VictoryDriver>) {
  if (frame.variant === 'chrollo-sun-moon') {
    const driver = drivers.get(frame.variant) ?? createChrolloSunMoonVictory()
    drivers.set(frame.variant, driver)
    return driver
  }
  const curse = isBeyondCurse(frame.variant)
  const key = curse ? frame.variant! : frame.fighter
  const driver = drivers.get(key) ?? (curse ? createBeyondCurseVictory() : DRIVERS[frame.fighter]())
  drivers.set(key, driver)
  return driver
}
function ownsComfortCamera(frame: VictoryFrame) {
  return (
    isBeyondCurse(frame.variant) ||
    [
      'kurapika',
      'leorio',
      'camilla',
      'kalluto',
      'machi',
      'shizuku',
      'bonolenov',
      'illumi',
      'biscuit',
      'saiyu',
      'hanzo',
      'bill',
      'hisoka',
      'melody',
      'hinrigh',
      'terebellum',
      'voconte',
      'longhi',
      'furykov',
      'theta',
      'mizaistom',
      'rihan',
      'zakuro',
      'lynch',
      'luini',
      'basho',
    ].includes(frame.fighter)
  )
}
export function createVictoryRenderer(options: {
  scene: Scene
  camera: PerspectiveCamera
  scenery: Object3D
}) {
  const drivers = new Map<string, VictoryDriver>(),
    lighting = victoryLighting()
  let disposed = false
  return {
    apply(input: {
      state: FightState
      frame: VictoryFrame | null
      models: VictoryModels
      comfort: FightComfort
    }) {
      const { frame, state, models, comfort } = input
      if (!frame?.active || disposed) {
        delete options.scene.userData.victory
        return null
      }
      const transaction = victoryTransaction(options.camera)
      try {
        const initialHero = models[frame.winner],
          initialVictim = models[frame.loser]
        transaction.defer(suspendFightExpression(initialHero))
        transaction.defer(suspendFightExpression(initialVictim))
        const centre = Math.max(
          -1.6,
          Math.min(1.6, (initialHero.position.x + initialVictim.position.x) / 2),
        )
        resetVictoryActor(victoryActor(initialHero, state[frame.winner].id), transaction.save)
        resetVictoryActor(victoryActor(initialVictim, state[frame.loser].id), transaction.save)
        initialHero.rotation.set(0, 0, 0)
        initialVictim.rotation.set(0, 0, 0)
        initialHero.updateWorldMatrix(true, true)
        initialVictim.updateWorldMatrix(true, true)
        const hero = victoryActor(initialHero, state[frame.winner].id),
          victim = victoryActor(initialVictim, state[frame.loser].id)
        const gap = victoryGap({ frame, victim })
        hero.root.position.set(centre - gap / 2, 0, 0)
        hero.root.rotation.set(0, 1.15, 0)
        victim.root.position.set(centre + gap / 2, 0, 0)
        victim.root.rotation.set(0, -1.15, 0)
        groundVictoryActor(hero)
        groundVictoryActor(victim)
        hideAuxiliaryRoots({
          scene: options.scene,
          visible: [hero.root, victim.root, options.scenery],
          save: transaction.save,
        })
        lighting.apply(options.scenery, transaction)
        const context: VictoryContext = {
          ...options,
          state,
          frame,
          age: Math.min(599, frame.elapsed * 60),
          hero,
          victim,
          centre,
          gap,
          comfort,
          save: transaction.save,
          material: transaction.material,
          defer: transaction.defer,
          add(root) {
            if (!comfort.flashes) suppressVictoryFlashes(root, transaction.save)
            options.scene.add(root)
            root.updateMatrixWorld(true)
            transaction.defer(() => root.removeFromParent())
          },
        }
        const driver = resolveDriver(frame, drivers)
        driver.update(context)
        if (comfort.camera === 0 && !ownsComfortCamera(frame))
          victoryWide(context, frame.fighter === 'feitan' ? hero.height + 2.6 : 0)
        hero.root.updateWorldMatrix(true, true)
        victim.root.updateWorldMatrix(true, true)
        options.scene.userData.victory = {
          winner: frame.winner,
          fighter: frame.fighter,
          target: state[frame.loser].id,
          stage: state.environment.stageId,
          elapsed: frame.elapsed,
          heroHeight: hero.height,
          victimHeight: victim.height,
          gap,
          centre,
        }
        return transaction.restore
      } catch (error) {
        transaction.restore()
        throw error
      }
    },
    dispose() {
      disposed = true
      drivers.forEach((driver) => driver.dispose())
      drivers.clear()
      lighting.dispose()
      delete options.scene.userData.victory
    },
  }
}
