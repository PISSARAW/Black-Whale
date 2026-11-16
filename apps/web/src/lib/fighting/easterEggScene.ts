import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { ArcadeFighter, FightSide } from './types'
import { createRosterEasterEggScene } from './easterEggRosterScene'

/** All objects live exclusively in the renderer. Nothing can be picked up or hit. */
export function createEasterEggScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const rosterProps = createRosterEasterEggScene(options)
  const paper = new THREE.MeshBasicMaterial({ color: 0xfff4dc })
  const red = new THREE.MeshBasicMaterial({ color: 0xb32048 })
  const metal = new THREE.MeshBasicMaterial({ color: 0xdce7ef })
  const leather = new THREE.MeshBasicMaterial({ color: 0x613c25 })
  const cardShape = new THREE.BoxGeometry(0.18, 0.28, 0.014)
  const pipShape = new THREE.CircleGeometry(0.026, 4)
  const linkShape = new THREE.TorusGeometry(0.025, 0.006, 4, 8)
  const weightShape = new THREE.SphereGeometry(0.045, 8, 6)
  const caseShape = new THREE.BoxGeometry(0.45, 0.25, 0.19)
  const lidShape = new THREE.BoxGeometry(0.45, 0.035, 0.19)
  const handleShape = new THREE.TorusGeometry(0.055, 0.012, 4, 8, Math.PI)
  const itemShape = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6)
  const makeModel = (side: string) => {
    const root = new THREE.Group()
    root.name = `easter-egg-props-${side}`
    const cards = Array.from({ length: 9 }, () => {
      const card = new THREE.Mesh(cardShape, paper)
      const pip = new THREE.Mesh(pipShape, red)
      pip.position.z = 0.008
      card.add(pip)
      root.add(card)
      return card
    })
    const chain = new THREE.Group()
    const links = Array.from({ length: 14 }, (_, index) => {
      const link = new THREE.Mesh(linkShape, metal)
      link.position.y = -index * 0.04
      link.rotation.y = index % 2 ? Math.PI / 2 : 0
      chain.add(link)
      return link
    })
    const weight = new THREE.Mesh(weightShape, metal)
    weight.position.y = -0.58
    chain.add(weight)
    const briefcase = new THREE.Group()
    const body = new THREE.Mesh(caseShape, leather)
    const lid = new THREE.Mesh(lidShape, leather)
    lid.position.y = 0.14
    const handle = new THREE.Mesh(handleShape, metal)
    handle.position.y = 0.17
    briefcase.add(body, lid, handle)
    const item = new THREE.Mesh(itemShape, metal)
    const tip = new THREE.Mesh(weightShape, red)
    tip.scale.setScalar(0.4)
    tip.position.y = -0.09
    item.add(tip)
    root.add(chain, briefcase, item)
    scene.add(root)
    return { root, cards, chain, links, briefcase, lid, item, probe: new THREE.Vector3() }
  }
  const models = { player: makeModel('player'), opponent: makeModel('opponent') }
  const heldAt = (
    model: ReturnType<typeof makeModel>,
    object: import('three').Object3D,
    anchor: import('three').Object3D | undefined,
  ) => {
    if (!anchor) return
    anchor.getWorldPosition(model.probe)
    model.root.updateWorldMatrix(true, false)
    object.position.copy(model.root.worldToLocal(model.probe))
  }
  const syncAnchors = (
    fighter: ArcadeFighter,
    model: ReturnType<typeof makeModel>,
    side: FightSide,
  ) => {
    const lead = options.handAnchor?.(side, 'lead')
    const rear = options.handAnchor?.(side, 'rear')
    if (fighter.id === 'hisoka' && fighter.easterEgg!.slot === 1)
      heldAt(model, model.cards[0], lead)
    if (model.chain.visible) heldAt(model, model.chain, lead)
    if (model.briefcase.visible) {
      heldAt(model, model.briefcase, rear)
      model.briefcase.position.y -= 0.17
    }
    if (model.item.visible) heldAt(model, model.item, lead)
  }
  const syncSide = (
    fighter: ArcadeFighter,
    model: ReturnType<typeof makeModel>,
    side: FightSide,
  ) => {
    const egg = fighter.easterEgg
    model.root.visible = Boolean(egg)
    if (!egg) return
    const t = egg.frame / egg.duration
    model.root.position.set(worldX(fighter.x), worldY(fighter.y), 0.28)
    model.root.scale.x = fighter.facing
    model.cards.forEach((card) => {
      card.visible = false
    })
    model.chain.visible = fighter.id === 'kurapika' && egg.slot !== 1
    model.briefcase.visible = fighter.id === 'leorio' && egg.slot >= 3
    model.item.visible = fighter.id === 'leorio' && egg.slot === 4 && t > 0.35
    if (fighter.id === 'hisoka' && egg.slot !== 2) syncCards(model.cards, egg.slot, t)
    if (model.chain.visible) {
      model.chain.position.set(0.43, 1.35, 0)
      model.chain.rotation.z = egg.slot === 3 ? Math.sin(t * Math.PI * 4) * 0.3 : 0.08
      model.links.forEach((link, i) => {
        link.rotation.z = egg.slot === 4 ? Math.sin(i * 0.6) * 0.12 : 0
      })
    }
    model.briefcase.position.set(0.35, 0.73, 0)
    model.lid.rotation.x = -1.2
    model.item.position.set(0.5, 1.45, 0)
    model.item.rotation.z = -0.2
    syncAnchors(fighter, model, side)
  }
  return {
    sync: (state) => {
      rosterProps.sync(state, 0)
      syncSide(state.player, models.player, 'player')
      syncSide(state.opponent, models.opponent, 'opponent')
    },
    dispose: () => {
      rosterProps.dispose()
      scene.remove(models.player.root, models.opponent.root)
      for (const shape of [
        cardShape,
        pipShape,
        linkShape,
        weightShape,
        caseShape,
        lidShape,
        handleShape,
        itemShape,
      ])
        shape.dispose()
      for (const material of [paper, red, metal, leather]) material.dispose()
    },
  }
}

function syncCards(cards: import('three').Mesh[], slot: number, t: number): void {
  if (slot === 1) {
    cards[0].visible = true
    cards[0].position.set(0.42, 1.35 + Math.sin(t * Math.PI * 4) * 0.025, 0)
    cards[0].rotation.set(0, t * Math.PI * 6, Math.sin(t * Math.PI * 6) * 0.3)
    return
  }
  const fall = slot === 4 ? Math.max(0, (t - 0.55) / 0.45) : 0
  cards.forEach((card, index) => {
    card.visible = slot === 4 || index < Math.floor(t * 12)
    const upper = index >= 5
    const local = upper ? index - 5 : index
    const bridge = index === 4 || index === 8
    const x = bridge ? 0.75 : 0.55 + (local % 2) * 0.16 + Math.floor(local / 2) * 0.35
    const y = (upper ? 0.38 : 0.13) + (bridge ? 0.15 : 0)
    card.position.set(
      x + fall * (index - 4) * 0.12,
      Math.max(0.025, y - fall * fall * 0.8),
      index * 0.003,
    )
    card.rotation.set(
      0,
      0,
      (bridge ? Math.PI / 2 : local % 2 ? -0.45 : 0.45) + fall * (index % 2 ? 1.2 : -1.2),
    )
  })
  if (slot === 4 && t > 0.35 && t < 0.6) {
    const card = cards[8]
    card.visible = true
    card.position.set(0.4 + (t - 0.35) * 2, 1.1 - (t - 0.35) * 3, 0.05)
    card.rotation.z = t * 9
  }
}
