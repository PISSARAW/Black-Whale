import { redactBattleModels } from './metamorphosenModels'
import type { ArcadeFighter } from './types'

export function redactLegacyArsenal(enemy: ArcadeFighter) {
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
