import { localizeHatsu } from '$lib/i18n/hatsu'
import {
  HATSU_PROFILES,
  type HatsuInteractionKind,
  type HatsuProfile,
} from '$lib/nen/hatsuRegistry'
import {
  aimsAtSolids,
  hatsuKeys,
  twoPages,
  TWO_HANDED_KINDS,
  worksInTour,
  worksOnTheBody,
  type TourWorld,
} from '$lib/tour/hatsu'
import { AIR_KEYS } from '$lib/tour/pageCasting'

type Air = (typeof AIR_KEYS)[keyof typeof AIR_KEYS]

interface HatsuViewOptions {
  active: () => HatsuProfile | null
  world: () => TourWorld
  locale: () => 'en' | 'fr' | undefined
  tuneName: (air: Air) => string
}

export class TourHatsuView {
  constructor(private readonly options: HatsuViewOptions) {}

  get technique() {
    const active = this.options.active()
    return worksInTour(active) ? active : null
  }

  get openPages() {
    return this.technique?.kind === 'bookmark' ? twoPages(this.options.world().book) : null
  }

  get controlKeys() {
    return hatsuKeys(this.technique, this.options.world().book)
  }

  get hands() {
    const pages = this.openPages
    return pages ? { first: this.pageName(pages[0]), second: this.pageName(pages[1]) } : null
  }

  get tunes() {
    if (this.technique?.kind !== 'melody' || this.openPages) return null
    return {
      first: this.options.tuneName(AIR_KEYS.first),
      second: this.options.tuneName(AIR_KEYS.second),
      third: this.options.tuneName(AIR_KEYS.third),
    }
  }

  get twoHanded() {
    return Boolean(this.technique) && !this.openPages && TWO_HANDED_KINDS.has(this.technique!.kind)
  }

  get selfCastable() {
    return worksOnTheBody(this.technique) && aimsAtSolids(this.technique)
  }

  private pageName(kind: HatsuInteractionKind) {
    const profile = HATSU_PROFILES.find((candidate) => candidate.kind === kind)
    return profile ? localizeHatsu(profile, this.options.locale()).name : kind
  }
}
