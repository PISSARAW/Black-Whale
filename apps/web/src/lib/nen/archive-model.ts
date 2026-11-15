export type ArchiveLocale = 'en' | 'fr'

export type NenArchiveKind =
  | 'guardian'
  | 'skill-book'
  | 'black-voice'
  | 'ghostwriter'
  | 'predator'
  | 'benjamin-guardian'
  | 'halkenburg-guardian'
  | 'tserriednich-guardian'
  | 'tserriednich-second'
  | 'camilla-guardian'
  | 'tubeppa-guardian'
  | 'zhang-lei-guardian'
  | 'tyson-guardian'
  | 'luzurus-guardian'
  | 'sale-sale-guardian'
  | 'momoze-guardian'
  | 'marayam-guardian'
  | 'cats-name'
  | 'stealth-dolphin'
  | 'cookie-chan'
  | 'blood-snakes'
  | 'nen-spider'
  | 'blinky'
  | 'dowsing-chain'
  | 'judgment-chain'
  | 'melody-flute'
  | 'moonlight-contract'
  | 'magical-worm'
  | 'fun-fun-cloth'
  | 'pain-packer'
  | 'jupiter'
  | 'indoor-fish'
  | 'secret-window'
  | 'without-you'
  | 'biohazard'
  | 'lsdf-guards'

export type NenArchiveEntry = {
  id: string
  kind: NenArchiveKind
  number: string
  category: 'beast' | 'object' | 'construct'
  color: string
  accent: string
  name: Record<ArchiveLocale, string>
  alias: Record<ArchiveLocale, string>
  environment: Record<ArchiveLocale, string>
  description: Record<ArchiveLocale, string>
  technique: Record<ArchiveLocale, string>
  techniqueDescription: Record<ArchiveLocale, string>
  traits: Record<ArchiveLocale, string[]>
  sound: 'growl' | 'paper' | 'signal' | 'whisper' | 'chime'
}

type Pair<T> = [en: T, fr: T]

export function entry(
  value: Omit<
    NenArchiveEntry,
    | 'name'
    | 'alias'
    | 'environment'
    | 'description'
    | 'technique'
    | 'techniqueDescription'
    | 'traits'
  > & {
    name: Pair<string>
    alias: Pair<string>
    environment: Pair<string>
    description: Pair<string>
    technique: Pair<string>
    techniqueDescription: Pair<string>
    traits: [Pair<string>, Pair<string>, Pair<string>]
  },
): NenArchiveEntry {
  const localized = <T>(pair: Pair<T>): Record<ArchiveLocale, T> => ({ en: pair[0], fr: pair[1] })
  return {
    ...value,
    name: localized(value.name),
    alias: localized(value.alias),
    environment: localized(value.environment),
    description: localized(value.description),
    technique: localized(value.technique),
    techniqueDescription: localized(value.techniqueDescription),
    traits: {
      en: value.traits.map((trait) => trait[0]),
      fr: value.traits.map((trait) => trait[1]),
    },
  }
}
