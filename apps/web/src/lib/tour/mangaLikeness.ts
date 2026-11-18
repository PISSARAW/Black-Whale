import type { HumanProfile } from './humanProfiles'

export type MangaEyes = 'almond' | 'round' | 'narrow' | 'doll' | 'heavy'
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
    | 'luini-slick'
    | 'yokotani-bob'
    | 'gel-long'
    | 'cluck-updo'
    | 'saiyu-crop'
    | 'feitan-crop'
    | 'bill-flames'
    | 'basho-pompadour'
    | 'tubeppa-bowl'
}

// Geometry directions refine the catalogue's faces; no random face is assigned to an id.
const DIRECTIONS: Record<string, Partial<MangaLikeness>> = {
  saiyu: {
    eyes: 'heavy',
    cheek: 0.151,
    jaw: 0.087,
    chin: 0.236,
    nose: 1.4,
    brow: 1.2,
    hair: 'saiyu-crop',
  },
  hisoka: { eyes: 'narrow', jaw: 0.055, chin: 0.208, brow: 0.7, mouth: 0.067, hair: 'curtain' },
  'chrollo-lucilfer': {
    eyes: 'round',
    cheek: 0.145,
    jaw: 0.074,
    brow: 0.7,
    neck: 0.043,
    hair: 'messy',
  },
  'prince-benjamin': {
    eyes: 'narrow',
    cheek: 0.183,
    jaw: 0.163,
    chin: 0.24,
    brow: 2.8,
    neck: 0.105,
    nose: 1.8,
    mouth: 0.09,
    hair: 'flat-top',
  },
  'prince-tserriednich': { eyes: 'narrow', chin: 0.23, nose: 1.4, brow: 0.7, mouth: 0.07 },
  'feitan-portor': { eyes: 'narrow', cheek: 0.139, jaw: 0.058, brow: 0.7, hair: 'feitan-crop' },
  'biscuit-krueger': {
    eyes: 'doll',
    cheek: 0.163,
    jaw: 0.073,
    chin: 0.175,
    brow: 0.6,
    hair: 'biscuit-tails',
  },
  'machi-komacine': { eyes: 'almond', cheek: 0.145, jaw: 0.06, brow: 0.6, hair: 'loose-bun' },
  'phinks-magcub': { eyes: 'narrow', jaw: 0.13, brow: 0.08, neck: 0.067 },
  'franklin-bordeau': { eyes: 'heavy', cheek: 0.18, jaw: 0.163, chin: 0.22, brow: 2, neck: 0.09 },
  'shizuku-murasaki': { eyes: 'round', cheek: 0.157, jaw: 0.077, brow: 0.65, hair: 'flick-bob' },
  illumi: { eyes: 'doll', cheek: 0.139, jaw: 0.06, chin: 0.22, brow: 0.3, mouth: 0.033 },
  'kalluto-zoldyck': { eyes: 'round', cheek: 0.145, jaw: 0.064, brow: 0.7, mouth: 0.032 },
  'nobunaga-hazama': {
    eyes: 'narrow',
    cheek: 0.146,
    jaw: 0.095,
    chin: 0.225,
    nose: 1.25,
    brow: 0.8,
    neck: 0.043,
  },
  'bonolenov-ndongo': { eyes: 'narrow', jaw: 0.09, brow: 0.6 },
  'leorio-paradinight': { eyes: 'narrow', jaw: 0.103, chin: 0.235, nose: 1.55, hair: 'flat-top' },
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
  'beyond-netero': { eyes: 'narrow', cheek: 0.17, jaw: 0.14, nose: 1.6, mouth: 0.08, neck: 0.075 },
  melody: {
    eyes: 'narrow',
    cheek: 0.195,
    jaw: 0.145,
    chin: 0.175,
    nose: 1.1,
    neck: 0.055,
    brow: 0.45,
    mouth: 0.06,
    hair: 'melody-long',
  },
  theta: { eyes: 'almond', cheek: 0.157, jaw: 0.078, brow: 0.8 },
  'hinrigh-biganduffno': {
    eyes: 'round',
    jaw: 0.085,
    cheek: 0.151,
    nose: 1.6,
    chin: 0.235,
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
  'lynch-fullbokko': { eyes: 'almond', cheek: 0.155, jaw: 0.1, brow: 0.9 },
  'queen-oito': { eyes: 'round', cheek: 0.15, jaw: 0.065, brow: 0.6 },
  'prince-camilla': { eyes: 'almond', cheek: 0.146, jaw: 0.06, brow: 0.55, hair: 'royal-updo' },
  'prince-kacho': { eyes: 'round', cheek: 0.15, jaw: 0.065, brow: 0.6 },
  'prince-fugetsu': { eyes: 'round', cheek: 0.15, jaw: 0.065, brow: 0.6 },
  'prince-momoze': { eyes: 'round', cheek: 0.144, jaw: 0.061, brow: 0.6 },
  'prince-halkenburg': { eyes: 'narrow', cheek: 0.148, jaw: 0.087, brow: 0.85, hair: 'side-part' },
  'prince-zhanglei': { eyes: 'heavy', cheek: 0.185, jaw: 0.13, chin: 0.17, mouth: 0.065 },
  'prince-tubeppa': {
    eyes: 'narrow',
    cheek: 0.163,
    jaw: 0.115,
    chin: 0.235,
    nose: 1.65,
    mouth: 0.086,
    brow: 0.75,
    neck: 0.054,
    hair: 'tubeppa-bowl',
  },
  'prince-salesale': { eyes: 'heavy', cheek: 0.189, jaw: 0.125, chin: 0.18 },
  'prince-luzurus': { eyes: 'narrow', cheek: 0.155, jaw: 0.092, hair: 'curtain' },
  'nasubi-hui-guo-rou': {
    eyes: 'heavy',
    cheek: 0.19,
    jaw: 0.15,
    chin: 0.175,
    mouth: 0.08,
    neck: 0.09,
  },
  'mizaistom-nana': { eyes: 'heavy', cheek: 0.175, jaw: 0.145, chin: 0.22, nose: 1.35 },
  'cheadle-yorkshire': { eyes: 'round', cheek: 0.153, jaw: 0.08, brow: 0.6 },
  gel: { eyes: 'doll', cheek: 0.144, jaw: 0.059, chin: 0.21, brow: 0.6, hair: 'gel-long' },
  cluck: { eyes: 'almond', cheek: 0.147, jaw: 0.07, chin: 0.215, hair: 'cluck-updo', brow: 0.7 },
  'botobai-gigante': { eyes: 'heavy', cheek: 0.18, jaw: 0.15, neck: 0.088 },
  ginta: { eyes: 'heavy', cheek: 0.19, jaw: 0.16, neck: 0.1 },
  'saccho-kobayakawa': { eyes: 'narrow', cheek: 0.154, jaw: 0.11, chin: 0.255, nose: 1.7 },
  bill: {
    eyes: 'heavy',
    cheek: 0.154,
    jaw: 0.099,
    chin: 0.232,
    nose: 1.25,
    hair: 'bill-flames',
    brow: 1.3,
  },
  babimyna: { eyes: 'heavy', cheek: 0.168, jaw: 0.145, brow: 1.4 },
  'balsamilco-might': { eyes: 'narrow', cheek: 0.151, jaw: 0.099, chin: 0.225, nose: 1.5 },
  coventoba: { eyes: 'heavy', cheek: 0.18, jaw: 0.12, chin: 0.175 },
  vergei: { eyes: 'heavy', jaw: 0.15, brow: 1.7, nose: 1.3 },
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
  longhi: { eyes: 'narrow', cheek: 0.14, jaw: 0.07, chin: 0.23, nose: 1.2, hair: 'tied-part' },
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
  voconte: { eyes: 'heavy', cheek: 0.143, jaw: 0.08, chin: 0.24, hair: 'curtain' },
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
    chin: 0.225,
    nose: 1.6,
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
  return { ...base, ...DIRECTIONS[profile.likeness ?? ''] }
}
