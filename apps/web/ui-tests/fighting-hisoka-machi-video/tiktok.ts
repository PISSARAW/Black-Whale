import { jCombo } from '../../demos/fighting-combo-edit/jCombo'
import { createHisokaMachiAudioStates, recordElasticCombo } from './demo'

const TECHNIQUES: Record<string, string> = {
  'hisoka:neutralSpecial': 'Bungee Gum · Attache',
  'hisoka:forwardSpecial': 'Rappel élastique',
  'hisoka:backSpecial': 'Rebond au plafond',
  'hisoka:elastic-embrace': 'Exécution élastique',
  'hisoka:finisher': 'Exécution élastique',
}

export function buildTikTok() {
  const demo = createHisokaMachiAudioStates()
  const normal = jCombo('hisoka', 'close', 'machi')
  const elastic = recordElasticCombo()
  const execution = elastic.findLastIndex((state, i) =>
    Boolean(state.impact && state.impact.sequence !== elastic[i - 1]?.impact?.sequence),
  )
  const sections = [
    { title: 'Carte tranchante', states: demo.slice(42, 114) },
    { title: 'Retrait · Retour', states: demo.slice(922, 1034) },
    {
      title: 'Contre au corps à corps',
      states: normal.states.slice(0, normal.impacts.at(-1)!.at + 35),
    },
    { title: 'Texture Surprise', states: demo.slice(611, 737) },
    { title: 'Élastique meurtrier', states: elastic },
  ]
  const cuts: number[] = []
  const cues: { at: number; kind: string }[] = []
  const frames = sections.flatMap(({ title, states }, section) => {
    const start = cuts.length === 0 ? 0 : cuts[section - 1] + sections[section - 1].states.length
    cuts.push(start)
    cues.push({ at: start, kind: 'whoosh' })
    let lastContact = -100
    return states.map((state, age) => {
      const before = states[age - 1]
      const hit = state.impact
      const contact = Boolean(
        age > 0 &&
        hit &&
        !hit.blocked &&
        hit.damage > 0 &&
        hit.sequence !== before?.impact?.sequence,
      )
      if (contact) {
        lastContact = age
        cues.push({
          at: start + age,
          kind: states === elastic && age === execution ? 'final' : hit?.critical ? 'crit' : 'hit',
        })
      }
      const special = state.player.attack?.moveId
      const technique = TECHNIQUES[special ?? '']
      const final = states === elastic && age >= execution
      return {
        state,
        title: final ? 'Exécution élastique' : (technique ?? title),
        section,
        age,
        impactAge: age - lastContact,
        final,
      }
    })
  })
  return { frames, cuts, cues, comboHits: normal.hits, signatureFrames: elastic.length }
}
