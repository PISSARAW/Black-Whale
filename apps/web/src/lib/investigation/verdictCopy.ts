import type { Locale } from '$lib/i18n/config'
import type { InvestigationCase, Verdict } from './case'

export interface VerdictText {
  title: string
  summary: string
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

const copy = {
  fr: {
    contradicted: (count: number) => ({
      title: 'Hypothèse contredite',
      summary:
        count > 1
          ? `${count} éléments résistent à cette reconstruction.`
          : '1 élément résiste à cette reconstruction.',
    }),
    incomplete: (count: number) => ({
      title: 'Piste plausible, preuve incomplète',
      summary: `Il manque ${plural(count, 'élément')} pour soutenir cette conclusion.`,
    }),
    insufficient: (count: number) => ({
      title: 'Dossier insuffisant',
      summary: `Il manque ${plural(count, 'élément')} pour soutenir cette conclusion.`,
    }),
    possible: {
      title: 'Conclusion possible',
      summary:
        'Cette hypothèse est compatible avec les éléments choisis, sans constituer la meilleure explication du dossier.',
    },
    solved: 'Conclusion démontrée',
  },
  en: {
    contradicted: (count: number) => ({
      title: 'Hypothesis contradicted',
      summary:
        count > 1
          ? `${count} pieces of evidence resist this reconstruction.`
          : '1 piece of evidence resists this reconstruction.',
    }),
    incomplete: (count: number) => ({
      title: 'Plausible lead, incomplete evidence',
      summary: `${plural(count, 'piece')} of evidence still missing to support this conclusion.`,
    }),
    insufficient: (count: number) => ({
      title: 'Insufficient case',
      summary: `${plural(count, 'piece')} of evidence still missing to support this conclusion.`,
    }),
    possible: {
      title: 'Possible conclusion',
      summary:
        'This hypothesis is compatible with the evidence chosen, without being the best explanation of the case.',
    },
    solved: 'Conclusion demonstrated',
  },
} satisfies Record<Locale, unknown>

/** The words for a verdict, in the visitor's language; the case supplies its own solved summary. */
export function describeVerdict(
  verdict: Verdict,
  investigation: InvestigationCase,
  locale: Locale,
): VerdictText {
  const text = copy[locale]
  if (verdict.status === 'contradicted') return text.contradicted(verdict.contradictions.length)
  if (verdict.status === 'insufficient') return text.insufficient(verdict.missing.length)
  if (verdict.status === 'solved') {
    return { title: text.solved, summary: investigation.solvedSummary }
  }
  return verdict.missing.length > 0 ? text.incomplete(verdict.missing.length) : text.possible
}
