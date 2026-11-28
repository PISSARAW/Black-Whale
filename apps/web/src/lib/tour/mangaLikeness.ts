import type { HumanProfile } from './humanProfiles'
import type { HumanEyeShape } from './humanFaceFeatures'
export type MangaEyes = HumanEyeShape
export interface MangaLikeness {
  eyes: MangaEyes
  cheek: number
  jaw: number
  chin: number
  brow: number
  nose: number
  mouth: number
  neck: number
  headY: number
  hair:
    | 'catalogue'
    | 'quiff'
    | 'flat-top'
    | 'curtain'
    | 'loose-bun'
    | 'flick-bob'
    | 'messy'
    | 'royal-updo'
    | 'tied-part'
    | 'crew-flat'
    | 'side-part'
    | 'braided'
    | 'long-curls'
    | 'winged-part'
    | 'flame-crest'
    | 'biscuit-tails'
    | 'biscuit-braids'
    | 'melody-long'
    | 'padaille-crop'
    | 'quorolle-waves'
    | 'tevelares-swept'
    | 'luini-slick'
    | 'yokotani-bob'
    | 'gel-long'
    | 'cluck-updo'
    | 'saiyu-crop'
    | 'feitan-crop'
    | 'bill-flames'
    | 'basho-pompadour'
    | 'tubeppa-bowl'
    | 'marayam-crop'
    | 'morena-long'
    | 'lynch-waves'
    | 'false-hisoka-fringe'
    | 'phinks-combed'
    | 'voconte-part'
    | 'borksen-flip'
    | 'nobunaga-topknot'
    | 'luzurus-puffs'
    | 'salesale-wave'
    | 'sarahell-spikes'
    | 'maor-parted-bowl'
    | 'shimanu-ponytail'
    | 'keni-side-comb'
    | 'sakata-volume'
    | 'keeney-receding'
    | 'shikaku-brush'
}

// Geometry directions refine the catalogue's faces; no random face is assigned to an id.
const DIRECTIONS: Record<string, Partial<MangaLikeness>> = {
  'morena-prudo': {
    eyes: 'almond',
    cheek: 0.159,
    jaw: 0.08,
    chin: 0.217,
    brow: 0.7,
    nose: 0.85,
    mouth: 0.098,
    hair: 'morena-long',
    neck: 0.043,
  },
  saiyu: { hair: 'saiyu-crop' },
  hisoka: { eyes: 'narrow', jaw: 0.055, chin: 0.208, brow: 0.7, mouth: 0.067, hair: 'curtain' },
  'chrollo-lucilfer': { hair: 'messy' },
  'prince-benjamin': { hair: 'flat-top' },
  'prince-tserriednich': { hair: 'curtain' },
  'feitan-portor': { hair: 'feitan-crop' },
  'biscuit-krueger': { hair: 'biscuit-tails' },
  'machi-komacine': { hair: 'loose-bun' },
  'shizuku-murasaki': { eyes: 'round', cheek: 0.157, jaw: 0.077, brow: 0.65, hair: 'flick-bob' },
  'kalluto-zoldyck': { eyes: 'round', cheek: 0.145, jaw: 0.064, brow: 0.7, mouth: 0.032 },
  'bonolenov-ndongo': { eyes: 'narrow', jaw: 0.09, brow: 0.6 },
  'leorio-paradinight': { hair: 'flat-top' },
  hanzo: {
    eyes: 'almond',
    cheek: 0.157,
    jaw: 0.105,
    chin: 0.225,
    brow: 2.1,
    nose: 1.35,
    mouth: 0.065,
  },
  basho: {
    eyes: 'heavy',
    cheek: 0.174,
    jaw: 0.15,
    chin: 0.22,
    nose: 1.45,
    neck: 0.077,
    hair: 'basho-pompadour',
  },
  melody: { hair: 'melody-long' },
  theta: { eyes: 'almond', cheek: 0.157, jaw: 0.078, brow: 0.8 },
  borksen: {
    eyes: 'doll',
    cheek: 0.158,
    jaw: 0.073,
    chin: 0.19,
    brow: 0.55,
    nose: 0.85,
    mouth: 0.052,
    hair: 'borksen-flip',
  },
  kaiser: {
    eyes: 'narrow',
    cheek: 0.157,
    jaw: 0.104,
    chin: 0.235,
    brow: 0.8,
    nose: 1.2,
    mouth: 0.052,
    hair: 'luini-slick',
  },
  sarahell: {
    eyes: 'round',
    cheek: 0.17,
    jaw: 0.135,
    chin: 0.21,
    brow: 1.6,
    nose: 1.2,
    mouth: 0.07,
    neck: 0.075,
    hair: 'sarahell-spikes',
  },
  maor: {
    eyes: 'heavy',
    cheek: 0.153,
    jaw: 0.128,
    chin: 0.235,
    brow: 1.35,
    nose: 1.45,
    mouth: 0.074,
    neck: 0.054,
    hair: 'maor-parted-bowl',
  },
  shimanu: {
    eyes: 'heavy',
    cheek: 0.179,
    jaw: 0.132,
    chin: 0.205,
    brow: 0.85,
    nose: 1.42,
    mouth: 0.058,
    neck: 0.061,
    hair: 'shimanu-ponytail',
  },
  'keni-wang': {
    eyes: 'narrow',
    cheek: 0.148,
    jaw: 0.096,
    chin: 0.248,
    brow: 0.72,
    nose: 1.5,
    mouth: 0.061,
    neck: 0.058,
    hair: 'keni-side-comb',
  },
  sakata: {
    eyes: 'heavy',
    cheek: 0.174,
    jaw: 0.151,
    chin: 0.215,
    brow: 1.5,
    nose: 0.75,
    mouth: 0.086,
    neck: 0.068,
    hair: 'sakata-volume',
  },
  keeney: {
    eyes: 'heavy',
    cheek: 0.178,
    jaw: 0.129,
    chin: 0.188,
    brow: 0.38,
    nose: 1.35,
    mouth: 0.071,
    neck: 0.049,
    hair: 'keeney-receding',
  },
  shikaku: {
    eyes: 'narrow',
    cheek: 0.189,
    jaw: 0.174,
    chin: 0.236,
    brow: 1.75,
    nose: 1.55,
    mouth: 0.092,
    neck: 0.091,
    hair: 'shikaku-brush',
  },
  'oito-nephew-fake-woble': {
    eyes: 'doll',
    cheek: 0.184,
    jaw: 0.13,
    brow: 0.42,
    nose: 0.58,
    neck: 0.042,
  },
  'hinrigh-biganduffno': {
    eyes: 'round',
    jaw: 0.085,
    cheek: 0.151,
    nose: 1.82,
    chin: 0.252,
    brow: 0.4,
    hair: 'long-curls',
  },
  'zakuro-custard': {
    eyes: 'doll',
    cheek: 0.149,
    jaw: 0.067,
    mouth: 0.052,
    brow: 0.5,
    hair: 'winged-part',
  },
  'lynch-fullbokko': {
    eyes: 'almond',
    cheek: 0.154,
    jaw: 0.083,
    chin: 0.215,
    brow: 0.66,
    nose: 1.25,
    hair: 'lynch-waves',
  },
  'bonolenov-as-hisoka': {
    eyes: 'narrow',
    cheek: 0.145,
    jaw: 0.079,
    chin: 0.236,
    brow: 0.65,
    nose: 1.4,
    mouth: 0.074,
    hair: 'false-hisoka-fringe',
  },
  'phinks-magcub': { hair: 'phinks-combed', nose: 1.28 },
  salkov: { hair: 'keni-side-comb', cheek: 0.142, jaw: 0.079, chin: 0.23, eyes: 'narrow' },
  'nobunaga-hazama': { hair: 'nobunaga-topknot' },
  'queen-oito': { hair: 'tied-part' },
  'prince-camilla': { hair: 'royal-updo' },
  'prince-halkenburg': { hair: 'side-part' },
  'prince-marayam': { hair: 'marayam-crop' },
  'prince-tubeppa': { hair: 'tubeppa-bowl' },
  'prince-salesale': { hair: 'salesale-wave' },
  'prince-luzurus': { hair: 'luzurus-puffs' },
  'duazul-hui-guo-rou': {
    eyes: 'almond',
    cheek: 0.153,
    jaw: 0.08,
    chin: 0.21,
    brow: 0.75,
    hair: 'loose-bun',
  },
  'tang-zhao-li-hui-guo-rou': {
    eyes: 'doll',
    cheek: 0.155,
    jaw: 0.08,
    chin: 0.2,
    nose: 0.8,
    brow: 0.7,
  },
  gel: { hair: 'gel-long' },
  cluck: { hair: 'cluck-updo' },
  bill: {
    eyes: 'heavy',
    cheek: 0.154,
    jaw: 0.099,
    chin: 0.232,
    nose: 1.25,
    hair: 'bill-flames',
    brow: 1.3,
  },
  kurton: { eyes: 'narrow', cheek: 0.154, jaw: 0.09, chin: 0.225, nose: 1.65, brow: 1.6 },
  babimyna: {
    eyes: 'almond',
    cheek: 0.15,
    jaw: 0.095,
    chin: 0.225,
    nose: 1.35,
    mouth: 0.052,
    brow: 1.15,
  },
  'balsamilco-might': {
    eyes: 'heavy',
    cheek: 0.185,
    jaw: 0.155,
    chin: 0.21,
    nose: 1.65,
    mouth: 0.09,
    neck: 0.085,
    brow: 1.2,
  },
  vincent: {
    eyes: 'narrow',
    cheek: 0.17,
    jaw: 0.15,
    chin: 0.225,
    nose: 1.75,
    mouth: 0.085,
    neck: 0.075,
    brow: 1.35,
  },
  coventoba: { eyes: 'heavy', cheek: 0.18, jaw: 0.12, chin: 0.175 },
  vergei: {
    eyes: 'almond',
    cheek: 0.13,
    jaw: 0.07,
    chin: 0.24,
    nose: 1.45,
    mouth: 0.045,
    neck: 0.05,
    brow: 1.15,
  },
  musse: { eyes: 'almond', cheek: 0.145, jaw: 0.074, brow: 0.7 },
  sayird: {
    eyes: 'almond',
    cheek: 0.15,
    jaw: 0.082,
    chin: 0.218,
    nose: 1.1,
    brow: 0.85,
    mouth: 0.045,
    hair: 'side-part',
  },
  furykov: { eyes: 'heavy', cheek: 0.152, jaw: 0.106, chin: 0.225, nose: 1.5, hair: 'crew-flat' },
  rihan: {
    eyes: 'narrow',
    cheek: 0.153,
    jaw: 0.11,
    nose: 1.3,
    mouth: 0.07,
    brow: 0.6,
    hair: 'braided',
  },
  'onior-longbao': { eyes: 'heavy', cheek: 0.19, jaw: 0.15, chin: 0.17, nose: 1.5 },
  'brocco-li': { eyes: 'narrow', cheek: 0.145, jaw: 0.08, chin: 0.245, nose: 1.6 },
  longhi: {
    eyes: 'narrow',
    cheek: 0.135,
    jaw: 0.072,
    chin: 0.235,
    nose: 1.35,
    mouth: 0.05,
    neck: 0.052,
    brow: 0.85,
    hair: 'tied-part',
  },
  quorolle: { hair: 'quorolle-waves' },
  tevelares: { hair: 'tevelares-swept' },
  padaille: {
    eyes: 'heavy',
    cheek: 0.145,
    jaw: 0.099,
    chin: 0.25,
    nose: 1.8,
    brow: 0.6,
    mouth: 0.068,
    neck: 0.045,
    hair: 'padaille-crop',
  },
  terebellum: {
    eyes: 'narrow',
    cheek: 0.17,
    jaw: 0.13,
    chin: 0.23,
    brow: 1.5,
    nose: 1.45,
    neck: 0.075,
    hair: 'flame-crest',
  },
  voconte: {
    eyes: 'heavy',
    cheek: 0.159,
    jaw: 0.105,
    chin: 0.23,
    nose: 1.45,
    hair: 'voconte-part',
  },
  luini: {
    eyes: 'almond',
    cheek: 0.147,
    jaw: 0.105,
    chin: 0.245,
    nose: 1.6,
    brow: 1.2,
    neck: 0.052,
    hair: 'luini-slick',
  },
  yokotani: {
    eyes: 'narrow',
    cheek: 0.15,
    jaw: 0.093,
    chin: 0.243,
    nose: 1.82,
    mouth: 0.071,
    brow: 0.5,
    hair: 'yokotani-bob',
  },
}

export function mangaLikeness(profile: HumanProfile): MangaLikeness {
  const face = {
    narrow: { cheek: 0.15, jaw: 0.078, chin: 0.21 },
    round: { cheek: 0.17, jaw: 0.105, chin: 0.18 },
    square: { cheek: 0.174, jaw: 0.14, chin: 0.205 },
  }[profile.face]
  const eyes = profile.expression === 'tired' ? 'heavy' : 'almond'
  const base: MangaLikeness = {
    ...face,
    eyes,
    brow: 1,
    nose: 1,
    mouth: 0.048,
    neck: profile.build === 'broad' ? 0.07 : 0.043,
    headY: profile.frame === 'adult' ? 1.66 : 1.71,
    hair: 'catalogue',
  }
  if (profile.likeness === 'biscuit-krueger' && profile.frame === 'adult')
    return {
      ...base,
      eyes: 'almond',
      cheek: 0.173,
      jaw: 0.135,
      chin: 0.23,
      brow: 1.1,
      neck: 0.08,
      hair: 'biscuit-braids',
    }
  if (profile.likeness === 'illumi' && profile.hairStyle === 'short')
    return { ...base, eyes: 'round' }
  return { ...base, ...DIRECTIONS[profile.likeness ?? ''], ...profile.faceFeatures }
}
