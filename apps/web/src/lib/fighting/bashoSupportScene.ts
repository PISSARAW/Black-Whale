import { sleepingBody } from './hanzoProjection'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Real writing supplies and paper remain separate from the Nen that charges a charm. */
export function createBashoSupportScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const paperGeometry = new THREE.BoxGeometry(0.22, 0.36, 0.012)
  const brushGeometry = new THREE.CylinderGeometry(0.012, 0.015, 0.29, 8)
  const spiritGeometry = new THREE.IcosahedronGeometry(0.18, 1)
  const paperMaterial = new THREE.MeshBasicMaterial({ color: 0xf1e4c8 })
  const brushMaterial = new THREE.MeshBasicMaterial({ color: 0x453020 })
  const auraMaterial = new THREE.MeshBasicMaterial({
    color: 0xc1e6ff,
    transparent: true,
    opacity: 0.3,
  })
  const spiritMaterial = new THREE.MeshBasicMaterial({
    color: 0x65507b,
    transparent: true,
    opacity: 0.6,
  })
  const actors = new Map<FightSide, ReturnType<typeof makeActor>>()
  const props = new Map<string, import('three').Group>()
  function makeActor(side: FightSide) {
    const ward = new THREE.Mesh(paperGeometry, paperMaterial),
      aura = new THREE.Mesh(spiritGeometry, auraMaterial)
    ward.name = `basho:ward:${side}`
    aura.name = `basho:ward-aura:${side}`
    aura.scale.set(1.5, 2.2, 1.5)
    scene.add(ward, aura)
    return { ward, aura }
  }
  function syncActor(state: FightState, side: FightSide) {
    let model = actors.get(side)
    if (!model) {
      model = makeActor(side)
      actors.set(side, model)
    }
    syncWard(state[side], model)
  }
  function syncWard(actor: FightState['player'], model: ReturnType<typeof makeActor>) {
    const body = sleepingBody(actor)
    model.ward.visible = Boolean(actor.bashoWard)
    model.ward.position.set(
      options.worldX(body.x) + (actor.bashoWard?.removed ? actor.facing * 0.2 : 0),
      options.worldY(body.y) + 0.95,
      -0.25,
    )
    model.aura.visible = (actor.bashoWard?.remainingFrames ?? 0) > 0
    model.aura.position.copy(model.ward.position)
  }
  function syncProps(state: FightState) {
    for (const prop of props.values()) prop.visible = false
    for (const entry of state.battlefield?.entities ?? []) {
      if (!entry.writingKit && !entry.weakSpirit) continue
      let prop = props.get(entry.id)
      if (!prop) {
        prop = makeProp(entry)
        props.set(entry.id, prop)
        scene.add(prop)
      }
      prop.visible = entry.present && entry.health > 0
      prop.position.set(options.worldX(entry.x), options.worldY(entry.y), 0.4)
    }
  }
  function makeProp(entry: NonNullable<FightState['battlefield']>['entities'][number]) {
    const prop = new THREE.Group()
    prop.name = `basho:prop:${entry.id}`
    if (entry.writingKit) {
      const paper = new THREE.Mesh(paperGeometry, paperMaterial),
        brush = new THREE.Mesh(brushGeometry, brushMaterial)
      paper.rotation.x = -Math.PI / 2
      paper.position.y = 0.02
      brush.rotation.z = Math.PI / 2
      brush.position.set(0, 0.03, 0.1)
      prop.add(paper, brush)
    } else {
      for (let i = 0; i < 3; i++) {
        const wisp = new THREE.Mesh(spiritGeometry, spiritMaterial)
        wisp.position.set(Math.sin(i * 2) * 0.12, i * 0.16, 0)
        wisp.scale.setScalar(1 - i * 0.2)
        prop.add(wisp)
      }
    }
    return prop
  }
  return {
    sync(state) {
      syncActor(state, 'player')
      syncActor(state, 'opponent')
      syncProps(state)
    },
    dispose() {
      for (const model of actors.values())
        Object.values(model).forEach((mesh) => mesh.removeFromParent())
      for (const prop of props.values()) prop.removeFromParent()
      actors.clear()
      props.clear()
      for (const geometry of [paperGeometry, brushGeometry, spiritGeometry]) geometry.dispose()
      for (const material of [paperMaterial, brushMaterial, auraMaterial, spiritMaterial])
        material.dispose()
    },
  }
}
