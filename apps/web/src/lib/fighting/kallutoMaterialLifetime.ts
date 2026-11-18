import { historicalMatterExists, historicalPartExists } from './historicalCopyLifetime'
import { paperDolls } from './kallutoSurveillance'
import type { ArcadeFighter, FightState } from './types'

/** Real paper survives loss of Nen; a conjured copy and its detached parts keep their actual source lifetime. */
export function cleanPaperMaterial(state: FightState, body: ArcadeFighter): ArcadeFighter {
  let actor = body
  if (actor.paperKit && !historicalMatterExists(state, actor.paperKit.copyId))
    actor = { ...actor, paperKit: undefined }
  const marks = actor.plantedPaper?.filter((mark) =>
    historicalPartExists(state, mark.materialCopyId),
  )
  if (marks && marks.length !== actor.plantedPaper?.length)
    actor = { ...actor, plantedPaper: marks }
  const old = paperDolls(actor)
  const dolls = old.filter((doll) => historicalPartExists(state, doll.materialCopyId))
  if (dolls.length === old.length) return actor
  const selected = actor.kallutoPaper?.doll
  const doll = dolls.find(
    (entry) => entry.target === selected?.target && entry.targetMember === selected?.targetMember,
  )
  return { ...actor, kallutoPaper: { ...actor.kallutoPaper!, dolls, doll } }
}
