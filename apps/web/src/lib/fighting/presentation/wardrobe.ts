import { isBiscuitTrueForm } from '../biscuitForm'
import type { HumanProfile } from '$lib/tour/humanProfiles'
import type { ArcadeFighter } from '../types'
import { PALETTES, type Palette } from './collection'
/** Visible alternate bodies/disguises keep their supplied reference garments. */
export function wardrobePalette(fighter: ArcadeFighter, palette: Palette): Palette {
  const altered = [
    isBiscuitTrueForm(fighter),
    fighter.hanzoProjection,
    fighter.textureSurprise,
    fighter.illumi?.disguised,
    fighter.chrolloHistorical?.appearance,
    fighter.battleCantabile?.form,
    fighter.battleCantabile?.preparation,
    fighter.battleCantabile?.prologue,
    fighter.clothCapture,
  ]
  return altered.some(Boolean) ? 'native' : palette
}
/** Only ordinary fabric colours change. Body, signature pieces and rig stay identical. */
export function wardrobeProfile(profile: HumanProfile, palette: Palette): HumanProfile {
  if (palette === 'native') return profile
  const colours = PALETTES.find(({ id }) => id === palette)!.colours
  return {
    ...profile,
    jacket: colours[0],
    trousers: colours[1],
    shirt: profile.shirt === profile.skin ? profile.skin : colours[2],
  }
}
