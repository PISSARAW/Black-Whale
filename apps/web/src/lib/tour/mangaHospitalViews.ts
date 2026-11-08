import { mangaView as view, type MangaView } from './mangaViewModel'
import {
  HOSPITAL_CLINIC,
  HOSPITAL_RESEARCH,
  HOSPITAL_STAFF,
  HOSPITAL_SUPPLIES,
} from './hospitalView'

export const MANGA_HOSPITAL_VIEWS: MangaView[] = [
  view({
    id: 'hospital-central-clinic',
    spaceId: HOSPITAL_CLINIC,
    at: [-2.0, -9.0],
    target: [-16.0, -5.0],
    pitch: 0.05,
    chapter: 358,
    volume: 35,
    label: 'The central medical clinic, ward beds, ECG monitors and nurses’ station',
    labelFr:
      'La clinique médicale centrale, ses lits d’hospitalisation, moniteurs ECG et poste des soins',
  }),
  view({
    id: 'hospital-supplies-reserve',
    spaceId: HOSPITAL_SUPPLIES,
    at: [7.5, -8.0],
    target: [16.0, -8.0],
    pitch: 0.04,
    chapter: 391,
    volume: 38,
    label: 'The medical supply reserve, pharmaceutical shelving and oxygen banks',
    labelFr: 'La réserve médicale, ses rayonnages pharmaceutiques et parcs d’oxygène',
  }),
  view({
    id: 'hospital-consultation-office',
    spaceId: HOSPITAL_STAFF,
    at: [8.0, 1.5],
    target: [14.0, 2.0],
    pitch: 0.04,
    chapter: 358,
    volume: 35,
    label: 'The consultation office, examination couch and illuminated negatoscope',
    labelFr: 'Le cabinet de consultation, la table d’examen et le négatoscope mural',
  }),
  view({
    id: 'hospital-research-lab',
    spaceId: HOSPITAL_RESEARCH,
    at: [0.0, 6.0],
    target: [10.0, 8.0],
    pitch: 0.05,
    chapter: 358,
    volume: 35,
    label: 'The medical research connection, optical microscopes and laboratory benches',
    labelFr: 'La liaison de recherche médicale, ses microscopes optiques et paillasses',
  }),
]
