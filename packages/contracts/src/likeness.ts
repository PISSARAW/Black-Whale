import type { Catalogue, Finding } from './types.js'

/**
 * The rules `appearance.json` cannot state about itself — ADR-005 §2.1.
 *
 * A schema can say that a likeness is well formed. It cannot say that the
 * person it describes exists, and that is the only rule that matters here: the
 * whole doctrine of this file is that a face is declared against a panel, so an
 * entry naming somebody the catalogue has never heard of is an invented
 * passenger arriving by the one door ADR-003 left unlocked.
 *
 * Kept out of `invariants.ts` for the reason `inhabitants.ts` is: that file is
 * near the five hundred lines ADR-002 allows, and a rule is easier to find in
 * the file named after its subject.
 */

/**
 * Annexe A: the closed list of everyone the walk is allowed to draw as
 * themselves.
 *
 * Seventy-one ids, grouped as the annexe groups them, because the grouping is
 * an argument about who the arc is *about* — a king and eight queens, fourteen
 * princes, the Hunters posted one per prince, the guards who make the huis
 * clos, a Troupe passing through and the families aboard. Anyone not on it is
 * drawn from their role, exactly as they were before ADR-005.
 *
 * Closed in the same sense `wardrobe.ts` is closed: extending it is an
 * amendment to the ADR, not a line somebody added to an array.
 */
export const LIKENESS_ROSTER: readonly string[] = [
  // A.1 — le roi et les reines
  'nasubi-hui-guo-rou',
  'unma-hui-guo-rou',
  'duazul-hui-guo-rou',
  'tang-zhao-li-hui-guo-rou',
  'katrono-hui-guo-rou',
  'swinko-swinko-hui-guo-rou',
  'seiko-hui-guo-rou',
  'sevanti-hui-guo-rou',
  'queen-oito',
  // A.2 — les quatorze princes
  'prince-benjamin',
  'prince-camilla',
  'prince-zhanglei',
  'prince-tserriednich',
  'prince-tubeppa',
  'prince-tyson',
  'prince-luzurus',
  'prince-salesale',
  'prince-halkenburg',
  'prince-kacho',
  'prince-fugetsu',
  'prince-momoze',
  'prince-marayam',
  'prince-woble',
  // A.3 — Hunters à bord
  'kurapika',
  'leorio-paradinight',
  'cheadle-yorkshire',
  'mizaistom-nana',
  'botobai-gigante',
  'kanzai',
  'saiyu',
  'saccho-kobayakawa',
  'cluck',
  'ginta',
  'gel',
  'beyond-netero',
  // A.4 — gardes importants
  'bill',
  'melody',
  'biscuit-krueger',
  'hanzo',
  'basho',
  'izunavi',
  'theta',
  'salkov',
  'babimyna',
  'balsamilco-might',
  'vincent',
  'furykov',
  'musse',
  'rihan',
  'coventoba',
  'vergei',
  'sayird',
  // A.5 — la Brigade fantôme
  'chrollo-lucilfer',
  'nobunaga-hazama',
  'feitan-portor',
  'phinks-magcub',
  'machi-komacine',
  'shizuku-murasaki',
  'franklin-bordeau',
  'bonolenov-ndongo',
  'kalluto-zoldyck',
  'illumi',
  'hisoka',
  // A.6 — mafieux importants
  'morena-prudo',
  'hinrigh-biganduffno',
  'zakuro-custard',
  'lynch-fullbokko',
  'onior-longbao',
  'brocco-li',
  'keni-wang',
  'luini',
]

type Invariant = (catalogue: Catalogue) => Finding[]

function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

/**
 * Every likeness names somebody the catalogue holds, and names them once.
 *
 * Both halves of ADR-005 §2.1's anti-invention test. The duplicate check is not
 * decoration: two entries for one id is a face that silently wins or loses
 * depending on which the projection reads first, which is precisely the class
 * of defect a closed table is supposed to make impossible.
 */
const likenessesNameSomebodyReal: Invariant = ({ characters, appearance }) => {
  const known = new Set(characters.map((entry) => entry.id))
  const findings: Finding[] = []
  const seen = new Set<string>()

  const rows = [
    ...appearance.declared.map((entry) => ['declared', entry.id] as const),
    ...appearance.deferred.map((entry) => ['deferred', entry.id] as const),
  ]
  for (const [list, id] of rows) {
    if (!known.has(id)) {
      findings.push(
        finding(
          'likeness-names-somebody-real',
          `appearance.${list}#${id}`,
          'no character with this id: a likeness may only describe somebody the catalogue already holds',
        ),
      )
    }
    if (seen.has(id)) {
      findings.push(
        finding('likeness-names-somebody-real', `appearance#${id}`, 'declared more than once'),
      )
    }
    seen.add(id)
  }
  return findings
}

/**
 * Everybody the annexe names is either drawn or explicitly not drawn.
 *
 * The other half of ADR-005 §2.1, and the half that keeps a deferral honest.
 * Silence and refusal look identical in a data file: an id with no entry could
 * mean "no usable panel was found" or it could mean somebody stopped writing
 * halfway down the annexe. This is what makes them different — the second one
 * fails the build, and the first one has to say why in a `reason` a person can
 * argue with.
 */
const everyoneOnTheRosterIsAnswered: Invariant = ({ appearance }) => {
  const answered = new Set([
    ...appearance.declared.map((entry) => entry.id),
    ...appearance.deferred.map((entry) => entry.id),
  ])
  return LIKENESS_ROSTER.filter((id) => !answered.has(id)).map((id) =>
    finding(
      'likeness-covers-the-roster',
      `appearance#${id}`,
      'named by annexe A and neither declared nor deferred: an omission and a refusal are not the same thing, so say which',
    ),
  )
}

export const LIKENESS_INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'likeness-names-somebody-real', run: likenessesNameSomebodyReal },
  { name: 'likeness-covers-the-roster', run: everyoneOnTheRosterIsAnswered },
]
