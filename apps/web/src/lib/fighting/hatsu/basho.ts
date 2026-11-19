import { advanceWritingMaterials } from '../bashoMaterials'
import { advanceBashoQuestions } from '../bashoQuestions'
import { advanceBashoWardClocks, advanceWeakSpirits } from '../bashoWard'
import { advanceBashoPoems } from '../bashoFire'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const bashoHatsu: FighterHatsu = {
  id: 'basho',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) =>
    advanceWeakSpirits(
      advanceBashoWardClocks(
        advanceBashoQuestions(advanceBashoPoems(advanceWritingMaterials(state))),
      ),
    ),
}
