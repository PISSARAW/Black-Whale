import { createBungeeStrand } from './bungeeStrandScene'
import { gumNetwork, gumLinkVisible, selectedGumLink } from './bungeeNetwork'
import { gumTargetPoint, gumLimbPoint } from './bungeeGeometry'
import {
  createHisokaPresentationClock,
  HISOKA_ACCENT_FRAMES,
  type HisokaFrames,
} from './hisokaPresentation'
import { hisokaChest, hisokaHand, hisokaReduced } from './hisokaEffectAnchors'
import { createHisokaGumAccent } from './hisokaGumAccent'
import type { GumLink } from './bungeeTypes'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'

export function createBungeeGumScene(options: EffectSceneOptions): FighterEffectScene {
  const clock = createHisokaPresentationClock()
  const primary = createBungeeStrand(options, 'hisoka-bungee-gum')
  const strands = new Map<number, ReturnType<typeof createBungeeStrand>>()
  const accent = createHisokaGumAccent(options)
  return {
    sync(state) {
      const frames = clock(state),
        viewer = options.viewer?.() ?? 'player'
      const links = gumNetwork(state).links.filter((link) => gumLinkVisible(state, link, viewer))
      primary.root.visible = false
      const active = new Set(links.slice(1).map((link) => link.id))
      for (const [id, strand] of strands)
        if (!active.has(id)) {
          strand.dispose()
          strands.delete(id)
        }
      let accentPoints: import('three').Vector3[] = [],
        accentFrames: HisokaFrames | null = null
      links.forEach((link, index) => {
        const strand =
          index === 0
            ? primary
            : (strands.get(link.id) ?? createBungeeStrand(options, `hisoka-bungee-gum:${link.id}`))
        if (index > 0) strands.set(link.id, strand)
        const animated = hisokaReduced(options) ? null : frames[link.owner]
        const points = gumPoints(options, state, { link, frames: animated })
        strand.root.userData.linkId = link.id
        strand.root.userData.selected = selectedGumLink(state, link.owner)?.id === link.id
        strand.sync({ points, frames: frames[link.owner], hidden: link.hidden })
        if (strand.root.userData.selected) {
          accentPoints = points
          accentFrames = animated
        }
      })
      accent.sync(accentPoints, accentFrames)
    },
    dispose() {
      accent.dispose()
      primary.dispose()
      strands.forEach((strand) => strand.dispose())
      strands.clear()
    },
  }
}
function gumPoints(
  options: EffectSceneOptions,
  state: FightState,
  context: { link: GumLink; frames: HisokaFrames | null },
) {
  const { link, frames } = context
  const target = gumTargetPoint(state, link.target)
  if (!target) return []
  const owner = sourceAnchor(options, state, link)
  const end =
    link.target.kind === 'fighter'
      ? hisokaChest(options, state, link.target.side)
      : new options.THREE.Vector3(options.worldX(target.x), options.worldY(target.y), owner.z)
  const age = frames?.attach ?? frames?.pull ?? frames?.rebound
  const pulse = age == null ? 0 : Math.sin((Math.PI * age) / HISOKA_ACCENT_FRAMES)
  const sag = link.motion === 'idle' ? 0.12 : 0.035
  return Array.from({ length: 49 }, (_, index) => {
    const ratio = index / 48,
      point = owner.clone().lerp(end, ratio)
    point.y += Math.sin(ratio * Math.PI) * (-sag + Math.sin(ratio * Math.PI * 3) * pulse * 0.08)
    return point
  })
}
function sourceAnchor(options: EffectSceneOptions, state: FightState, link: GumLink) {
  if (!state.gumNetwork) return hisokaHand(options, state, link.owner)
  const limb = options.figureOf?.(link.owner)?.getObjectByName(link.limb)
  if (limb) return limb.localToWorld(new options.THREE.Vector3(0, 0, 0.025))
  const point = gumLimbPoint(state, link.owner, link.limb)
  return new options.THREE.Vector3(options.worldX(point.x), options.worldY(point.y), 0.28)
}
