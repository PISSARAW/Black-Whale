import { NEN_PRESENTATION } from '@black-whale/nen-engine'
import { sharedAudioContext } from '$lib/audio/context'
import type { ArcadeFighter, FightState } from '../types'
import { activeSoundNen, fightSoundEvents, newSoundRound } from './events'
import { continuousVoice, createFightMix, type ContinuousVoice, type FightMix } from './mixer'
import { playFightSound } from './play'
import { FIGHTER_SOUNDS } from './profiles'
import { combatPressure } from './stages'

export interface FightAudioSettings {
  muted: boolean
  effects: number
  ambience: number
  tension: number
}

export const DEFAULT_FIGHT_AUDIO: FightAudioSettings = {
  muted: false,
  effects: 0.85,
  ambience: 0.65,
  tension: 0.65,
}

export interface FightAudioDirector {
  update: (state: FightState, options: { paused: boolean; settings: FightAudioSettings }) => void
  dispose: () => void
}

interface AuraVoices {
  hum: ContinuousVoice
  beating: ContinuousVoice
  air: ContinuousVoice
}

function auraVoices(mix: FightMix): AuraVoices {
  return {
    hum: continuousVoice(mix, { target: mix.effects, hz: 110, level: 0 }),
    beating: continuousVoice(mix, { target: mix.effects, hz: 111, type: 'triangle', level: 0 }),
    air: continuousVoice(mix, { target: mix.effects, hz: 500, noise: true, level: 0 }),
  }
}

function stageVoices(mix: FightMix): ContinuousVoice[] {
  const { profile, ambience, pressure } = mix
  return [
    continuousVoice(mix, {
      target: ambience,
      hz: profile.noiseHz,
      noise: true,
      level: profile.air,
    }),
    continuousVoice(mix, { target: ambience, hz: profile.droneHz, level: 0.018 }),
    continuousVoice(mix, {
      target: ambience,
      hz: profile.droneHz * 2.006,
      type: 'triangle',
      level: 0.008,
    }),
    continuousVoice(mix, { target: pressure, hz: 73.42, type: 'triangle', level: 0.018 }),
    continuousVoice(mix, { target: pressure, hz: 74.2, type: 'triangle', level: 0.016 }),
    continuousVoice(mix, { target: pressure, hz: 450, noise: true, level: 0.018 }),
  ]
}

/** No timers drive combat cues: simulation frames own time, hitstop and pause. */
export function createFightAudioDirector(initial: FightState): FightAudioDirector | null {
  const context = sharedAudioContext()
  if (!context) return null
  let mix = createFightMix(context, initial.environment.stageId)
  let stages = stageVoices(mix)
  let auras = { player: auraVoices(mix), opponent: auraVoices(mix) }
  let previous: FightState | null = null
  let active = true
  let disposed = false
  const stop = () => {
    stages.forEach((voice) => voice.stop())
    Object.values(auras).forEach((voices) => Object.values(voices).forEach((voice) => voice.stop()))
    mix.dispose()
  }
  const rebuild = (state: FightState) => {
    stop()
    mix = createFightMix(context, state.environment.stageId)
    stages = stageVoices(mix)
    auras = { player: auraVoices(mix), opponent: auraVoices(mix) }
  }
  const update: FightAudioDirector['update'] = (state, options) => {
    if (disposed) return
    if (previous && newSoundRound(previous, state)) rebuild(state)
    active = !options.paused && !options.settings.muted
    mix.setActive(active)
    updateLevels(mix, { state, settings: options.settings })
    updateStagePressure(mix, stages, state)
    for (const side of ['player', 'opponent'] as const)
      updateAura(mix, { voices: auras[side], state, side })
    if (active && context.state === 'running') {
      for (const event of fightSoundEvents(previous, state)) playFightSound(mix, event, state)
    }
    previous = state
  }
  return {
    update,
    dispose: () => {
      if (!disposed) {
        disposed = true
        stop()
      }
    },
  }
}

function updateLevels(
  mix: FightMix,
  options: { state: FightState; settings: FightAudioSettings },
): void {
  const { state, settings } = options
  const now = mix.context.currentTime
  const pressure = combatPressure(state)
  // Action has priority: ambience ducks during impacts and Emperor Time.
  const emperor = state.player.kurapika?.emperorTime || state.opponent.kurapika?.emperorTime
  const duck = state.hitstop > 0 ? 0.45 : emperor ? 0.65 : 1
  mix.effects.gain.setTargetAtTime(settings.effects, now, 0.025)
  mix.ambience.gain.setTargetAtTime(settings.ambience * duck * 0.7, now, 0.09)
  mix.pressure.gain.setTargetAtTime(settings.tension * pressure * duck, now, 0.12)
  for (const cutoff of mix.hearing)
    cutoff.setTargetAtTime(state.player.hatsuEffects.senseSeals >= 2 ? 420 : 18000, now, 0.12)
}

function updateStagePressure(mix: FightMix, voices: ContinuousVoice[], state: FightState): void {
  const pressure = combatPressure(state)
  const now = mix.context.currentTime
  // Two close partials beat faster as the stakes rise, without raising a shrill pitch.
  voices[4].frequency.setTargetAtTime(73.42 + 0.5 + pressure * 2.4, now, 0.2)
  voices[5].frequency.setTargetAtTime(300 + pressure * 1400, now, 0.2)
}

interface AuraUpdate {
  voices: AuraVoices
  state: FightState
  side: 'player' | 'opponent'
}

function updateAura(mix: FightMix, options: AuraUpdate): void {
  const { state, side, voices } = options
  const fighter = state[side]
  const tone = auraTone(state, side)
  const hush = auraSilent(state, fighter)
  const level = hush ? 0 : tone.level
  const now = mix.context.currentTime
  voices.hum.frequency.setTargetAtTime(tone.hz, now, 0.07)
  voices.beating.frequency.setTargetAtTime(tone.hz + tone.beat, now, 0.07)
  voices.air.frequency.setTargetAtTime(tone.cutoff, now, 0.08)
  voices.hum.level.setTargetAtTime(level, now, 0.08)
  voices.beating.level.setTargetAtTime(level * 0.3, now, 0.08)
  voices.air.level.setTargetAtTime(hush ? 0 : tone.air, now, 0.08)
  for (const voice of Object.values(voices))
    voice.pan.setTargetAtTime((fighter.x - 50) / 75, now, 0.04)
}

function auraSilent(state: FightState, fighter: ArcadeFighter): boolean {
  const technique = activeSoundNen(fighter)
  return (
    technique === 'zetsu' || technique === 'in' || fighter.health <= 0 || state.phase !== 'fighting'
  )
}

function auraTone(state: FightState, side: 'player' | 'opponent') {
  const fighter = state[side]
  const special = specialSustain(state, side)
  if (special) return special
  const technique = activeSoundNen(fighter)
  const sound = NEN_PRESENTATION[technique].sound
  const profile = FIGHTER_SOUNDS[fighter.id]
  const colour = Math.max(0.7, Math.min(1.3, profile.root / 146.83))
  return {
    hz: sound.lowHz * colour * (technique === 'gyo' ? 0.25 : 1),
    level: 0.004 + sound.volume * 0.015,
    beat: 0.7,
    cutoff: Math.min(1600, sound.highHz * 2),
    air: sound.noise * 0.03,
  }
}

function specialSustain(state: FightState, side: 'player' | 'opponent') {
  const fighter = state[side]
  if (fighter.kurapika?.emperorTime)
    return { hz: 146.83, level: 0.028, beat: 0.85, cutoff: 740, air: 0.009 }
  if (fighter.nen.on) return { hz: 42, level: 0.035, beat: 3.3, cutoff: 380, air: 0.038 }
  if (fighter.hatsuEffects.painPacker?.sun)
    return { hz: 61, level: 0.03, beat: 2.2, cutoff: 1500, air: 0.055 }
  if (fighter.hatsuEffects.blinkyFrames > 0)
    return { hz: 96, level: 0.028, beat: 96, cutoff: 1500, air: 0.055 }
  if (fighter.hanzoProjection) return { hz: 155, level: 0.009, beat: 1.2, cutoff: 850, air: 0.012 }
  if (fighter.drainingChain) return { hz: 70, level: 0.016, beat: 2.4, cutoff: 420, air: 0.02 }
  return null
}
