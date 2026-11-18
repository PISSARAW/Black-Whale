import { redactBattleModels } from './metamorphosenModels'
import type { ArcadeFighter } from './types'

export function redactLegacyArsenal(enemy: ArcadeFighter) {
  enemy.illumiNeedleMode = undefined
  enemy.illumiNeedleGeneration = undefined
  enemy.illumiDisguisePlan = undefined
  if (enemy.illumi)
    enemy.illumi = {
      ...enemy.illumi,
      disguiseOrigin: undefined,
      disguiseExpiresAt: undefined,
      anchor: undefined,
    }
  enemy.texturePaperDraft = undefined
  enemy.texturePaperId = undefined
  enemy.paperTextureGeneration = undefined
  enemy.documentReading = undefined
  concealProsthesisAppearance(enemy)
  enemy.textureTarget = undefined
  enemy.gumProsthesisGeneration = undefined
  if (enemy.gumProstheses)
    enemy.gumProstheses = { ...enemy.gumProstheses, source: undefined, theftId: undefined }
  if (enemy.gumWoundOrigin) enemy.gumWoundOrigin = {}
  if (enemy.gumCatch) enemy.gumCatch = { ...enemy.gumCatch, source: undefined, theftId: undefined }
  if (enemy.attack) enemy.attack = { ...enemy.attack, nenOrigin: undefined }
  if (enemy.textureSurprise)
    enemy.textureSurprise = { ...enemy.textureSurprise, source: undefined, theftId: undefined }
  if (enemy.paperKit) enemy.paperKit = { ...enemy.paperKit, confetti: undefined }
  redactBattleModels(enemy)
  if (enemy.bloodyMary) enemy.bloodyMary = { ...enemy.bloodyMary, lastSeen: undefined }
  enemy.luiniExit = undefined
  enemy.luiniSelectedDestination = undefined
  enemy.luiniComplete = undefined
  enemy.biohazardFootage = undefined
  enemy.biohazardSignal = undefined
  enemy.biohazardDevices = enemy.biohazardDevices?.map((item) => ({
    ...item,
    recordings: undefined,
  }))
  enemy.secretWindowMode = undefined
  enemy.sweetHomeObject = undefined
}

function concealProsthesisAppearance(enemy: ArcadeFighter): void {
  if (
    enemy.textureSurprise?.surface !== 'gum-prostheses' ||
    enemy.textureSurprise.supportId !== enemy.gumProstheses?.id
  )
    return
  enemy.bodyDamage = undefined
  enemy.gumProstheses = undefined
  enemy.textureSurprise = undefined
}
