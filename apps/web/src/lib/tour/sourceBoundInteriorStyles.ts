import type { Provenance } from './types'
import type { ReconstructionRole } from './detailTag'

export type { ReconstructionRole } from './detailTag'

export interface SourceBoundEvidence {
  provenance: Provenance
  source: string
  sourceFr: string
}

export interface SourceBoundInteriorStyle {
  locationId: string
  name: string
  evidence: SourceBoundEvidence
  roles: {
    envelope: ReconstructionRole
    furniture: ReconstructionRole
    finish: ReconstructionRole
  }
  triangleBudget: number
  floor: number
  wall: number
  ceiling: number
  wood: number
  metal: number
  fabric: number
  accent: number
  floorPattern: 'bands' | 'grid' | 'plates'
  ceilingPattern: 'beams' | 'coffers' | 'services'
  programme?: 'dorm' | 'office' | 'recycling' | 'clinic'
}

const STYLES: SourceBoundInteriorStyle[] = [
  {
    locationId: 'tier-1-soldiers-living-quarters',
    name: 'soldiers-quarters',
    evidence: {
      provenance: 'plan',
      source:
        "Published soldiers' quarters plan: four Royal Army barracks, four provisional Hunter rooms and twelve bunks in each room.",
      sourceFr:
        "Plan publié des quartiers des soldats : quatre chambrées de l'armée royale, quatre salles de Hunters provisoires et douze couchettes par salle.",
    },
    roles: {
      envelope: 'attested',
      furniture: 'metric-estimate',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 150_000,
    floor: 0x303733,
    wall: 0x59635c,
    ceiling: 0x303733,
    wood: 0x4a4231,
    metal: 0x7d8780,
    fabric: 0x596257,
    accent: 0x9c8b55,
    floorPattern: 'plates',
    ceilingPattern: 'services',
  },
  {
    locationId: 'tier-3-central-courthouse',
    name: 'central-courthouse',
    evidence: {
      provenance: 'plan',
      source:
        "Published courthouse plan: magistrate's dais and seat, clerks, prosecution, defence and defendant's dock.",
      sourceFr:
        "Plan publié du tribunal : estrade et siège du magistrat, greffiers, parquet, défense et box de l'accusé.",
    },
    roles: {
      envelope: 'attested',
      furniture: 'metric-estimate',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 120_000,
    floor: 0x3b3832,
    wall: 0x747168,
    ceiling: 0x4f4d48,
    wood: 0x4d3426,
    metal: 0x847d70,
    fabric: 0x51433d,
    accent: 0xb29358,
    floorPattern: 'bands',
    ceilingPattern: 'coffers',
  },
  {
    locationId: 'tier-3-heilly-family-office',
    name: 'registered-heilly-office',
    evidence: {
      provenance: 'plan',
      source:
        'Published Heil-Ly office plan: registered premises and public entrance; it does not establish the Chapter 378 room 302 interior.',
      sourceFr:
        "Plan publié du bureau Heil-Ly : locaux déclarés et entrée publique ; il n'établit pas l'intérieur de la chambre 302 du chapitre 378.",
    },
    roles: {
      envelope: 'attested',
      furniture: 'metric-estimate',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 80_000,
    floor: 0x2c2926,
    wall: 0x504a43,
    ceiling: 0x292622,
    wood: 0x3c2b22,
    metal: 0x67645f,
    fabric: 0x463832,
    accent: 0x8b5f3f,
    floorPattern: 'grid',
    ceilingPattern: 'services',
  },
  {
    locationId: 'tier-3-residential-first-class',
    name: 'first-class-residential',
    evidence: {
      provenance: 'plan',
      source:
        'Chapter 393 first-class plan: six cabins, their WC cells, beds and storage; the companionway is reconstructed.',
      sourceFr:
        "Plan de première classe du chapitre 393 : six cabines, leurs WC, lits et rangements ; l'escalier est reconstruit.",
    },
    roles: {
      envelope: 'attested',
      furniture: 'attested',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 80_000,
    floor: 0x4b4037,
    wall: 0x75685d,
    ceiling: 0x514840,
    wood: 0x503426,
    metal: 0x918579,
    fabric: 0x5e5361,
    accent: 0xb19a72,
    floorPattern: 'bands',
    ceilingPattern: 'coffers',
  },
  {
    locationId: 'tier-3-residential-standard',
    name: 'tier-3-standard-residential',
    evidence: {
      provenance: 'plan',
      source:
        'Published standard-cabin plan: assembly corridor and twelve cabins, each with one bed and cupboards.',
      sourceFr:
        'Plan publié des cabines standard : couloir de rassemblement et douze cabines avec chacune un lit et des placards.',
    },
    roles: {
      envelope: 'attested',
      furniture: 'attested',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 70_000,
    floor: 0x383735,
    wall: 0x5e5d59,
    ceiling: 0x383836,
    wood: 0x4b4034,
    metal: 0x777b79,
    fabric: 0x555853,
    accent: 0x8d856e,
    floorPattern: 'grid',
    ceilingPattern: 'beams',
  },
  {
    locationId: 'tier-3-residential-units',
    name: 'central-police-dorm',
    evidence: {
      provenance: 'inferred',
      source:
        'The narrative establishes a police dorm room offered to Illumi and Kalluto; no panel or plan locates or furnishes it.',
      sourceFr:
        'Le récit établit un dortoir du commissariat proposé à Illumi et Kalluto ; aucune case ni aucun plan ne le situe ou ne le meuble.',
    },
    roles: {
      envelope: 'connective-inference',
      furniture: 'functional-reconstruction',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 60_000,
    floor: 0x4a5155,
    wall: 0x727b80,
    ceiling: 0x444a4d,
    wood: 0x4d4841,
    metal: 0x899399,
    fabric: 0x59656b,
    accent: 0x9eb0b7,
    floorPattern: 'plates',
    ceilingPattern: 'services',
    programme: 'dorm',
  },
  {
    locationId: 'tier-4-ei-i-family-office',
    name: 'ei-i-office',
    evidence: {
      provenance: 'plan',
      source:
        'Chapter 380 ship cutaway places an Ei-I compartment on Tier 4 but does not show its interior.',
      sourceFr:
        "La coupe du navire du chapitre 380 place un compartiment Ei-I au pont 4 sans en montrer l'intérieur.",
    },
    roles: {
      envelope: 'attested',
      furniture: 'functional-reconstruction',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 60_000,
    floor: 0x332c35,
    wall: 0x594d5c,
    ceiling: 0x302a32,
    wood: 0x47343d,
    metal: 0x746c78,
    fabric: 0x574857,
    accent: 0x9b6e88,
    floorPattern: 'grid',
    ceilingPattern: 'services',
    programme: 'office',
  },
  {
    locationId: 'tier-4-recycling-sewage-facilities',
    name: 'recycling-facilities',
    evidence: {
      provenance: 'plan',
      source:
        'Published deck plan establishes technical and recycling volumes between Tiers 4 and 5; no machinery layout is shown.',
      sourceFr:
        'Le plan publié établit les volumes techniques et de recyclage entre les ponts 4 et 5 ; aucune implantation de machines n’est montrée.',
    },
    roles: {
      envelope: 'attested',
      furniture: 'functional-reconstruction',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 120_000,
    floor: 0x303432,
    wall: 0x525957,
    ceiling: 0x2b302e,
    wood: 0x403c34,
    metal: 0x76817d,
    fabric: 0x4e5955,
    accent: 0xb1843e,
    floorPattern: 'plates',
    ceilingPattern: 'services',
    programme: 'recycling',
  },
  {
    locationId: 'tier-4-xi-yu-family-office',
    name: 'xi-yu-office',
    evidence: {
      provenance: 'plan',
      source:
        'Published Xi-Yu office plan: guarded entrance, family meeting room and meeting table in the forward teeth of the ship.',
      sourceFr:
        'Plan publié du bureau Xi-Yu : entrée gardée, salle de réunion familiale et table dans les dents avant du navire.',
    },
    roles: {
      envelope: 'attested',
      furniture: 'attested',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 80_000,
    floor: 0x343638,
    wall: 0x555b60,
    ceiling: 0x303438,
    wood: 0x40342d,
    metal: 0x747e84,
    fabric: 0x4b555d,
    accent: 0x8aa0aa,
    floorPattern: 'bands',
    ceilingPattern: 'coffers',
  },
  {
    locationId: 'tier-5-medical-clinic',
    name: 'tier-5-clinic',
    evidence: {
      provenance: 'plan',
      source:
        'Published deck plan establishes the under-equipped Tier 5 clinic; no perspective panel shows its interior.',
      sourceFr:
        "Le plan publié établit la clinique sous-équipée du pont 5 ; aucune case en perspective n'en montre l'intérieur.",
    },
    roles: {
      envelope: 'attested',
      furniture: 'functional-reconstruction',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 80_000,
    floor: 0x47504f,
    wall: 0x697a78,
    ceiling: 0x46504f,
    wood: 0x58605d,
    metal: 0x8a9997,
    fabric: 0x768c87,
    accent: 0xa7c2ba,
    floorPattern: 'grid',
    ceilingPattern: 'services',
    programme: 'clinic',
  },
  {
    locationId: 'tier-5-standard-cabins',
    name: 'tier-5-standard-cabins',
    evidence: {
      provenance: 'plan',
      source:
        'Published standard-cabin plan: forward block, assembly corridor and twelve cabins with one bed and cupboards each.',
      sourceFr:
        'Plan publié des cabines standard : bloc avant, couloir de rassemblement et douze cabines avec chacune un lit et des placards.',
    },
    roles: {
      envelope: 'attested',
      furniture: 'attested',
      finish: 'functional-reconstruction',
    },
    triangleBudget: 70_000,
    floor: 0x343331,
    wall: 0x53514c,
    ceiling: 0x302f2d,
    wood: 0x443b31,
    metal: 0x70736f,
    fabric: 0x50534d,
    accent: 0x8d8065,
    floorPattern: 'plates',
    ceilingPattern: 'beams',
  },
]

export const SOURCE_BOUND_INTERIOR_STYLES: readonly SourceBoundInteriorStyle[] = STYLES

export const sourceBoundStyleFor = (
  locationId: string | null | undefined,
): SourceBoundInteriorStyle | undefined =>
  locationId ? STYLES.find((style) => style.locationId === locationId) : undefined
