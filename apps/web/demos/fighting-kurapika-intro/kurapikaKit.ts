import { Shot } from '../fighting-chrollo-intro/reel'

/**
 * The rest of Kurapika's chains for the full presentation: Steal Chain carried through
 * Dolphin (load, use once, give back), Dowsing Chain catching real bullets, and the
 * Judgment Chain rule enforced to the end. Every effect is the engine's own.
 */
type Scene = () => Shot
const shot = (...[stage, opponent, options = {}]: ConstructorParameters<typeof Shot>) =>
  new Shot(stage, opponent, { hero: 'kurapika', ...options })

/** The same slot drives Steal Chain and Dolphin: steal, load, use, then give it back. */
function dolphinStep(s: Shot, done: () => boolean, limit = 90) {
  for (let i = 0; i < limit && !done(); i += 2) {
    s.move('backSpecial')
    if (done()) return
    s.step(2)
  }
}

const dolphin: Scene = () => {
  const s = shot('banquet-hall', 'hisoka', { gap: 6, opponentAura: 24 })
  s.step(6)
  s.press('finisher', { aura: true })
  s.beat('EMPEROR TIME', 'Every chain at full power')
  s.step(20)
  s.approach('player', 6)
  s.move('backSpecial')
  s.beat('STEAL CHAIN', 'The syringe drains the aura')
  for (let i = 0; i < 160 && !s.state.player.kurapika?.held; i++) s.step()
  s.idle()
  s.step(6)
  dolphinStep(s, () => Boolean(s.state.player.kurapika?.held?.loaded))
  s.beat('DOLPHIN', 'The stolen Hatsu is loaded')
  s.step(16)
  dolphinStep(s, () => Boolean(s.state.player.kurapika?.held?.used))
  s.beat('BUNGEE GUM', 'Hisoka’s own gum, from Kurapika’s hand')
  s.step(80)
  s.idle()
  dolphinStep(s, () => !s.state.player.kurapika?.held)
  s.beat('RETURNED', 'Used once. Given back.')
  s.step(40)
  return s
}

/** Benjamin fires real bullets; the Dowsing Chain swings into their path and stops them. */
const dowsing: Scene = () => {
  const s = shot('supreme-court', 'benjamin', { gap: 26 })
  s.step(6)
  for (let volley = 0; volley < 2; volley++) {
    s.ranged('opponent')
    // Cast as the burst crosses the gap: the chain's active swing meets the bullets.
    s.step(12)
    s.move('forwardSpecial')
    if (volley === 0) s.beat('DOWSING CHAIN', 'Bullets caught mid-air')
    s.step(70)
  }
  s.step(20)
  return s
}

/** Judgment Chain sets one rule: no Nen. Hisoka raises his aura anyway. */
const judgment: Scene = () => {
  const s = shot('princes-burial-chamber', 'hisoka', { gap: 6 })
  s.step(6)
  s.press('finisher', { aura: true })
  s.step(20)
  s.move('finisher')
  s.beat('JUDGMENT CHAIN', 'The rule: no Nen, ever again')
  for (let i = 0; i < 90 && !s.state.opponent.judgmentChain; i++) s.step()
  s.idle()
  s.step(50)
  s.held.opponent = { aura: true }
  s.beat('THE RULE BREAKS', 'He reached for his aura')
  s.step(50)
  s.held.opponent = {}
  s.step(60)
  return s
}

export const KIT_SCENES = { dolphin, dowsing, judgment }
