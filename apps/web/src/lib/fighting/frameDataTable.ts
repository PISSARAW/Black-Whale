import {
  formatFrameAdvantage,
  linkWindow,
  moveFrameAdvantage,
  type MoveFrameAdvantage,
} from './moveFrameAdvantage'
import { movesetFor } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import type { FighterMove } from './movesetTypes'
import type { FighterDefinition } from './types'

/** Regenerate with `pnpm fighting:frames`; frameDataTable.test.ts fails while it is stale. */
export const FRAME_DATA_FILE = 'apps/web/src/lib/fighting/FRAME_DATA.md'

interface FrameRow {
  move: FighterMove
  frames: MoveFrameAdvantage
}

function rowsFor(fighter: FighterDefinition): FrameRow[] {
  return (movesetFor(fighter.id)?.moves ?? []).flatMap((move) => {
    const frames = moveFrameAdvantage(move)
    return frames ? [{ move, frames }] : []
  })
}

const sign = (value: number | 'knockdown') => formatFrameAdvantage(value, 'fr')

/** A move whose hit advantage covers its own startup can link into itself indefinitely. */
function selfLinks(row: FrameRow): boolean {
  return linkWindow(row.frames, row.frames) > 0
}

function summaryLine(fighter: FighterDefinition, rows: FrameRow[]): string {
  const hits = rows.flatMap(({ frames }) =>
    typeof frames.onHit === 'number' ? [frames.onHit] : [],
  )
  const best = hits.length ? sign(Math.max(...hits)) : '—'
  const safe = rows.filter(({ frames }) => frames.onBlock >= -3).length
  const plusFive = hits.filter((value) => value >= 5).length
  const loops = rows.filter(selfLinks).length
  return `| ${fighter.name} | ${rows.length} | ${best} | ${plusFive} | ${safe} | ${loops} |`
}

function fighterSection(fighter: FighterDefinition, rows: FrameRow[]): string[] {
  return [
    `### ${fighter.name}`,
    '',
    '| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |',
    '| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |',
    ...rows.map(
      ({ move, frames }) =>
        `| ${move.nameFr} | \`${move.slot}\` | ${move.guard} | ${frames.startup} | ` +
        `${frames.active} | ${frames.recovery} | ${sign(frames.onHit)} | ${sign(frames.onBlock)} |`,
    ),
    '',
  ]
}

const HEADER = [
  '# Données de frames des normaux',
  '',
  '<!-- Fichier généré par `pnpm fighting:frames` depuis frameDataTable.ts. Ne pas éditer. -->',
  '',
  'Lot 0 de la [proposition de grammaire de combo](./COMBO_GRAMMAR.md). Les valeurs',
  'portent sur les normaux et coups de commande au sol, pour une touche ordinaire sur',
  'la première frame active : ni contre-attaque (+3), ni écrasement au mur, ni',
  'décroissance du hitstun de [STEP3.md](./STEP3.md). « Sol » signale une mise au',
  'sol. `moveFrameAdvantage.test.ts` vérifie chaque valeur contre la mesure réelle',
  'du laboratoire, pour les quarante personnages, sur touche et sur garde.',
  '',
  '## Synthèse',
  '',
  '« Sûrs » : −3 ou mieux sur garde. « Liens sur soi » : avantage sur touche',
  'supérieur au démarrage du même coup, ce qui permet de le répéter en lien. Un lien',
  'laisse « avantage − démarrage du coup suivant » frames pour lancer la suite.',
  '',
  '| Personnage | Coups | Meilleur sur touche | À +5 ou plus | Sûrs sur garde | Liens sur soi |',
  '| ---------- | ----: | ------------------: | -----------: | -------------: | ------------: |',
]

export function frameDataMarkdown(): string {
  const fighters = FIGHTING_ROSTER.map((fighter) => ({ fighter, rows: rowsFor(fighter) }))
  return [
    ...HEADER,
    ...fighters.map(({ fighter, rows }) => summaryLine(fighter, rows)),
    '',
    '## Par personnage',
    '',
    ...fighters.flatMap(({ fighter, rows }) => fighterSection(fighter, rows)),
  ].join('\n')
}
