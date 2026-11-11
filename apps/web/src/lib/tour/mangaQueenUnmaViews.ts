import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { QUEEN_UNMA_ROOM } from './queenUnmaView'

const staging: MangaCastStaging[] = [
  {
    characterId: 'unma-hui-guo-rou',
    at: [-64.4, -31.9],
    heading: Math.PI,
    pose: 'seated',
  },
]

const source = {
  spaceId: QUEEN_UNMA_ROOM,
  chapter: 403,
  eventSequence: 1,
  volume: 39,
  staging,
  beastStaging: [{ ownerId: 'unma-hui-guo-rou', omit: true }],
}

export const MANGA_QUEEN_UNMA_VIEWS: MangaView[] = [
  view({
    ...source,
    id: 'unma-nursery-salon',
    at: [-66.5, -21.6],
    target: [-66.4, -32.3],
    pitch: 0.04,
    pages: '10 (chapitre, hors crédits)',
    label: 'Queen Unma in her formal salon with the nursery visible behind her',
    labelFr: 'La reine Unma dans son salon d’apparat, avec la nursery visible derrière elle',
  }),
  view({
    ...source,
    id: 'unma-salon-armchair',
    at: [-64.4, -29.1],
    target: [-64.4, -31.9],
    pitch: 0.02,
    pages: '10 (chapitre, hors crédits)',
    label: 'Queen Unma’s carved armchair of state, side tables and panelled salon',
    labelFr: 'Le fauteuil d’apparat sculpté de la reine Unma, ses guéridons et son salon lambrissé',
  }),
  view({
    ...source,
    id: 'unma-nursery-cot',
    at: [-67.4, -36.4],
    target: [-69.1, -38.3],
    pitch: -0.05,
    pages: '10 (chapitre, hors crédits)',
    label:
      'The nursery cot with carved rails and non-luminous suspension — hidden profiles reconstructed',
    labelFr:
      'Le berceau de la nursery à barreaux et sa suspension non lumineuse — profils cachés reconstitués',
  }),
  view({
    ...source,
    staging: [],
    id: 'unma-salon-decor',
    at: [-66.5, -21.6],
    target: [-66.4, -32.3],
    pitch: 0.02,
    pages: '10 (chapitre, hors crédits)',
    label: 'Carved salon, flower table, console and nursery opening — empty decor inspection',
    labelFr:
      'Salon sculpté, table fleurie, console et ouverture de la nursery — inspection du décor sans occupants',
  }),
  view({
    ...source,
    staging: [],
    id: 'unma-phone-tea',
    at: [-64.7, -29.6],
    target: [-64.6, -31.9],
    pitch: -0.14,
    pages: '10 (chapitre, hors crédits)',
    label: 'Telephone pedestal, carved chair and tea table — simplified objects',
    labelFr: 'Guéridon au téléphone, fauteuil sculpté et table à thé — objets simplifiés',
  }),
  view({
    ...source,
    staging: [],
    id: 'unma-flower-console',
    at: [-69.8, -24.8],
    target: [-68.5, -30.5],
    pitch: -0.05,
    pages: '10 (chapitre, hors crédits)',
    label: 'Round flower table, high console and fluted opening',
    labelFr: 'Table ronde fleurie, console haute et ouverture à colonnes cannelées',
  }),
  view({
    ...source,
    staging: [],
    id: 'unma-guest-mantel',
    at: [-65.5, -25.2],
    target: [-62.9, -32.2],
    pitch: 0.03,
    pages: '10 (chapitre, hors crédits)',
    label: 'Guest chair, small bowl table and ornamented mantel',
    labelFr: 'Fauteuil invité, petite table au récipient et manteau ornementé',
  }),
  view({
    ...source,
    staging: [],
    id: 'unma-bed-reconstruction',
    at: [-66.4, -43.8],
    target: [-70, -46],
    pitch: -0.1,
    pages: '10 (chapitre, hors crédits)',
    label: 'Unseen sleeping area from the shared /ship programme — reconstruction',
    labelFr: 'Espace de couchage non montré, issu du programme partagé de /ship — reconstitution',
  }),
]
