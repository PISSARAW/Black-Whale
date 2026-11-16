import { createFeitanScene } from '../../src/lib/fighting/feitanScene'
import { createPainPacker } from '../../src/lib/fighting/feitanPain'
import * as THREE from 'three'
import { buildGelSnakeStrike } from '../../src/lib/tour/gelSnakeHead'
import { buildCrossGameCage } from '../../src/lib/tour/crossGameCageModel'
import { addPadailleWeapon, animatePadailleWeapon } from '../../src/lib/fighting/padailleFigure'
import catalogue from '../../../../data/characters/appearance.json'
import { addBonolenovBattleArmor } from '../../src/lib/tour/bonolenovBattleArmor'
import { biscuitTrueFormProfile, shapeBiscuitTrueForm } from '../../src/lib/fighting/biscuitFigure'
import { projectHanzo } from '../../src/lib/fighting/hanzoProjection'
import { addHanzoProjectionMantle } from '../../src/lib/tour/mangaHanzoProjection'
import { humanProfile } from '../../src/lib/tour/humanProfiles'
import { emptyBattleCantabile } from '../../src/lib/fighting/battleCantabileTypes'
import { buildHumanFigure } from '../../src/lib/tour/humanFigure'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { FIGHTING_ROSTER } from '../../src/lib/fighting/roster'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'

const title = document.createElement('h1')
title.textContent = 'Personnages · modèles partagés'
const legend = document.createElement('p')
legend.textContent =
  'Haut : visite du bateau · Bas : Fighting 2D, ou vue de trois quarts pour les personnages non jouables'
const labels = document.createElement('div')
document.body.style.cssText = 'margin:0;background:#f5f2eb;color:#24242b;font:16px system-ui'
title.style.cssText = 'margin:24px 28px 8px;font-size:25px'
legend.style.cssText = 'margin:0 28px 14px;color:#696770'
labels.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);text-align:center'
document.body.append(title, legend, labels)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(1440, 1000)
renderer.setScissorTest(true)
renderer.setClearColor(0xf5f2eb)
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-0.8, 0.8, 1, -1, 0.1, 30)
const materials = new Map<string, THREE.MeshBasicMaterial>()
function glow(color: number, opacity: number) {
  const key = `${color}:${opacity}`
  let material = materials.get(key)
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    materials.set(key, material)
  }
  return material
}
type Model = {
  human: ReturnType<typeof buildHumanFigure>
  fighter?: ReturnType<typeof createFightState>['player']
  id: string
  row: number
  column: number
  prologue: boolean
  concert: boolean
  crossGame: boolean
  snake?: THREE.Group
  pain?: {
    effects: ReturnType<typeof createFeitanScene>
    state: ReturnType<typeof createFightState>
  }
}
let models: Model[] = []
function setCharacters(ids: string[]) {
  models.forEach(({ human, pain }) => {
    pain?.effects.dispose()
    scene.remove(human.root)
  })
  models = []
  labels.replaceChildren()
  ids.forEach((requestedId, column) => {
    const prologue = requestedId.endsWith('@prologue')
    const trueForm = requestedId.endsWith('@true-form')
    const skillFour = requestedId.endsWith('@skill-four')
    const transition = requestedId.endsWith('@transition')
    const concert = requestedId.endsWith('@concert')
    const axe = requestedId.endsWith('@axe')
    const crossGame = requestedId.endsWith('@cross-game')
    const withSnake = requestedId.endsWith('@snake')
    const withPain = requestedId.endsWith('@pain-packer')
    const id = requestedId.split('@')[0]
    const declared = catalogue.declared.find((entry) => entry.id === id)!
    if (!declared) throw new Error(`Undeclared character: ${id}`)
    const definition = FIGHTING_ROSTER.find((entry) => entry.modelId === id)
    const label = document.createElement('p')
    label.textContent =
      (definition?.name ?? id.replaceAll('-', ' ')) +
      (prologue ? ' · Prologue' : '') +
      (trueForm ? ' · Vraie forme' : '') +
      (skillFour ? ' · Skill 4' : '') +
      (transition ? ' · Transition' : '') +
      (concert ? ' · Flûte' : '') +
      (axe ? ' · Hache' : '') +
      (crossGame ? ' · Cross Game' : '') +
      (withSnake ? ' · Bras-serpent' : '') +
      (withPain ? ' · Pain Packer' : '')
    labels.append(label)
    for (const row of [0, 1]) {
      let fighter = row && definition ? createFightState(definition.id, 'hisoka').player : undefined
      if (fighter && concert)
        fighter.melodyPerformance = {
          originX: fighter.x,
          startupFrames: 0,
          playingFrames: 30,
          moveId: 'melody:neutralSpecial',
        }
      if (fighter && trueForm) fighter.biscuitTrueForm = true
      if (fighter && (skillFour || transition)) fighter = projectHanzo(fighter)
      if (fighter && skillFour) fighter.hanzoProjection!.startupFrames = 0
      if (fighter) fighter.nen = { ...fighter.nen, mode: axe || withPain ? 'ten' : 'zetsu' }
      if (fighter && axe) fighter.padailleTool = 'axe'
      if (fighter && prologue)
        fighter.battleCantabile = { ...emptyBattleCantabile(), prologue: true }
      const human = fighter
        ? buildFightFigure({ THREE, glow, fighter })
        : buildHumanFigure({
            THREE,
            glow: skillFour || transition ? (c, o) => glow(c, o * 0.28) : glow,
            ...(trueForm
              ? {
                  profile: biscuitTrueFormProfile(
                    humanProfile({ human: { identity: id } } as Parameters<typeof humanProfile>[0]),
                  ),
                }
              : {}),
            seen: {
              id,
              kind: 'avatar',
              spaceId: 'room',
              tierId: 'tier-1',
              at: [0, 0],
              y: 0,
              size: 0.42,
              colour: 0xffffff,
              stage: 0,
              hidden: false,
              human: {
                role: 'witness',
                identity: id,
                pose: concert ? 'flute' : 'idle',
                aura: 'none',
              },
            },
          })
      if (axe) {
        if (!fighter) addPadailleWeapon({ THREE, glow, model: human })
        const preview = fighter ?? createFightState('padaille', 'hisoka').player
        animatePadailleWeapon(
          human.turns,
          { ...preview, nen: { ...preview.nen, mode: 'ten' }, padailleTool: 'axe' },
          0,
        )
      }
      if (trueForm && !fighter) shapeBiscuitTrueForm(human)
      if (transition && !fighter) addHanzoProjectionMantle({ THREE, glow, model: human })
      if (prologue && !fighter) addBonolenovBattleArmor({ THREE, glow, model: human })
      if (crossGame) {
        const cage = buildCrossGameCage(THREE)
        cage.position.y = 1.15
        human.root.add(cage)
      }
      let snake: THREE.Group | undefined
      if (withSnake) {
        snake = new THREE.Group()
        buildGelSnakeStrike({ THREE, glow, root: snake, skin: glow(0x14141a, 1) })
        snake.scale.setScalar(0.65)
        snake.rotation.z = -Math.PI / 2
        human.root.add(snake)
        human.root.getObjectByName('hand-right')!.visible = false
      }
      let pain: Model['pain']
      if (withPain) {
        const state = createFightState('feitan', 'hisoka')
        state.player = fighter ?? state.player
        state.player.hatsuEffects.painPacker = { ...createPainPacker(), armour: true }
        const unused = new THREE.Group()
        pain = {
          state,
          effects: createFeitanScene({
            THREE,
            scene,
            figureOf: (side) => (side === 'player' ? human.turns : unused),
            worldX: (x) => x,
            worldY: (y) => y,
          }),
        }
      }
      models.push({ human, fighter, id, row, column, prologue, concert, crossGame, snake, pain })
      scene.add(human.root)
    }
  })
  show('body')
}
function show(view: string) {
  models.forEach(({ human }) => {
    human.root.visible = false
  })
  renderer.setScissor(0, 0, 1440, 1000)
  renderer.clear()
  models.forEach(
    ({ human, fighter, id, row, column, prologue, concert, crossGame, snake, pain }) => {
      human.root.visible = true
      human.animate(0, concert && !fighter ? 'flute' : 'idle')
      human.root.rotation.y = view === 'profile' ? Math.PI / 2 : row ? -0.25 : 0
      if ((view === 'combat' || concert) && fighter)
        human.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      human.root.updateMatrixWorld(true)
      pain?.effects.sync(pain.state, 0)
      human.root.updateMatrixWorld(true)
      if (snake) {
        const hand = human.root.getObjectByName('hand-right')!
        snake.position.copy(human.root.worldToLocal(hand.getWorldPosition(new THREE.Vector3())))
        human.root.updateMatrixWorld(true)
      }
      const head =
        human.root.getObjectByName('face-mouth')?.parent ??
        human.root.getObjectByName('face-mouth-base')?.parent
      const target =
        view === 'face' && head
          ? (snake?.getObjectByName('gel-snake-head') ?? head).getWorldPosition(new THREE.Vector3())
          : new THREE.Vector3(0, 1, 0)
      if (snake && view !== 'face') target.x = 0.4
      if (id === 'cluck') target.y += view === 'face' ? 0.18 : 0.1
      const range =
        id === 'cluck'
          ? view === 'face'
            ? 0.8
            : 1.55
          : view === 'face'
            ? 0.49
            : snake
              ? 1.65
              : crossGame
                ? 1.52
                : 1.36
      camera.left = -range * 0.72
      camera.right = -camera.left
      camera.top = range
      camera.bottom = -range
      camera.position
        .copy(target)
        .add(
          new THREE.Vector3(
            snake && view === 'face' ? 12 : crossGame ? 4 : 0,
            crossGame ? 2.3 : 0,
            snake && view === 'face' ? 4 : 12,
          ),
        )
      camera.lookAt(target)
      camera.updateProjectionMatrix()
      renderer.setViewport(column * 360, row ? 0 : 500, 360, 500)
      renderer.setScissor(column * 360, row ? 0 : 500, 360, 500)
      renderer.setClearColor(prologue || crossGame ? 0x6d707c : 0xf5f2eb)
      human.turns.visible = !(snake && view === 'face')
      renderer.render(scene, camera)
      human.root.visible = false
    },
  )
}
setCharacters(['leorio-paradinight', 'shizuku-murasaki', 'machi-komacine', 'feitan-portor'])
Object.assign(window, {
  mangaCastFixture: {
    ids: catalogue.declared.map((entry) => entry.id),
    setCharacters,
    show,
    get models() {
      return models
    },
  },
})
