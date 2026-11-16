export type SoundMaterial =
  'steel' | 'rubber' | 'paper' | 'flesh' | 'silk' | 'air' | 'wood' | 'machine' | 'glass'
export type HatsuVoice =
  | 'chain'
  | 'gum'
  | 'book'
  | 'military'
  | 'future'
  | 'sun'
  | 'gong'
  | 'shot'
  | 'transform'
  | 'cyclotron'
  | 'barrage'
  | 'thread'
  | 'needle'
  | 'paper'
  | 'dance'
  | 'vacuum'
  | 'machine'
  | 'verdict'
  | 'remote'
  | 'shadow'
  | 'predator'
  | 'blood'
  | 'flute'
  | 'poem'
  | 'cat'
  | 'arrow'
  | 'snake'
  | 'interrogate'
  | 'portal'
  | 'growth'
  | 'read'
  | 'birds'
  | 'dragon'
  | 'contract'
  | 'owl'
  | 'blade'
  | 'transfer'
  | 'door'
  | 'guards'
  | 'contagion'
  | 'spirit'
  | 'smoke'
  | 'coin'

export interface FighterSoundProfile {
  /** Authored sound direction, rather than a hash of the character's name. */
  identity: string
  material: SoundMaterial
  hatsu: HatsuVoice
  root: number
  motif: readonly number[]
  weight: number
  breath: number
  pace: number
}

type Score = readonly [
  SoundMaterial,
  HatsuVoice,
  number,
  readonly number[],
  number,
  number,
  number,
  string,
]
export function score([
  material,
  hatsu,
  root,
  motif,
  weight,
  breath,
  pace,
  identity,
]: Score): FighterSoundProfile {
  return { material, hatsu, root, motif, weight, breath, pace, identity }
}
