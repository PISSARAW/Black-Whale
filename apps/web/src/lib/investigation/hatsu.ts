import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'

export const INVESTIGATION_HATSU_KINDS = new Set<HatsuInteractionKind>([
  'dowsing',
  'scarlet',
  'scout',
  'surveillance',
  'truth-punch',
  'snakes',
])

export interface InvestigationHatsuUse {
  key: string
  title: string
  finding: string
  evidenceIds: string[]
  lifeHours: number
  tone: 'success' | 'limited' | 'forbidden'
}

export function investigationHatsuUse(
  profile: HatsuProfile,
  subjectId: string,
): InvestigationHatsuUse {
  const key = `${profile.id}:${subjectId}`

  if (profile.kind === 'dowsing' && (subjectId === 'bill' || subjectId === 'loberry')) {
    return {
      key,
      title: 'Signal cohérent',
      finding:
        subjectId === 'loberry'
          ? "La chaîne ne détecte pas de mensonge volontaire. Loberry rapporte ce qu'elle croit avoir vu; cela ne prouve pas qu'elle comprend la capacité."
          : "Le témoignage de Bill concorde avec les traces physiques. La chaîne renforce sa fiabilité sans identifier l'utilisateur.",
      evidenceIds: [subjectId === 'loberry' ? 'loberry-vision' : 'bill-testimony'],
      lifeHours: 0,
      tone: 'success',
    }
  }

  if (profile.kind === 'scarlet' && (subjectId === 'body' || subjectId === 'kurapika')) {
    return {
      key,
      title: 'Analyse à pleine efficacité',
      finding:
        'Emperor Time permet de relier la matérialisation, la coordination des quatre créatures et la fenêtre létale. Cette lecture coûte trois heures de vie.',
      evidenceIds: ['death-window', 'nen-residue'],
      lifeHours: 3,
      tone: 'success',
    }
  }

  if ((profile.kind === 'scout' || profile.kind === 'surveillance') && subjectId === 'loberry') {
    return {
      key,
      title: 'Aucune image rétroactive',
      finding:
        'Une capacité de surveillance peut observer la suite, pas recréer les onze secondes déjà écoulées. Le témoignage demeure la seule source sur la poupée.',
      evidenceIds: [],
      lifeHours: 0,
      tone: 'limited',
    }
  }

  if (profile.kind === 'truth-punch') {
    return {
      key,
      title: 'Usage refusé',
      finding:
        "Frapper un témoin protégé n'est ni proportionné ni autorisé dans ce dossier. Une vérité obtenue ainsi détruirait aussi la procédure.",
      evidenceIds: [],
      lifeHours: 0,
      tone: 'forbidden',
    }
  }

  if (profile.kind === 'snakes' && subjectId === 'body') {
    return {
      key,
      title: 'Signature reconnue',
      finding:
        "La manifestation reproduit exactement les perforations et le drainage observés. C'est une reconstitution de vérité lecteur, pas une connaissance accessible à Kurapika au chapitre 370.",
      evidenceIds: ['wounds', 'death-window'],
      lifeHours: 0,
      tone: 'limited',
    }
  }

  return {
    key,
    title: 'Aucune prise',
    finding: `${profile.name} ne peut rien établir de nouveau sur cette cible dans les conditions présentes.`,
    evidenceIds: [],
    lifeHours: 0,
    tone: 'limited',
  }
}
