import { commentaryLine, type CommentaryLine } from './commentary'
import { COMBAT_VOICE_RATES, type CombatVoiceStyle } from './settings'
import type { FightState } from '../types'
import { fightContactStyle } from '../fightContactStyle'
import { otherSide } from '../frameData'
import { isKameoId } from '../kameos/catalogue'
import type { FightMix } from './mixer'
import type { FightSoundEvent } from './events'
import { FIGHTER_SOUNDS } from './profiles'
import { breath } from './voices'
import { matchVoiceLines, type BoardLine } from './matchVoiceLines'
import {
  fightSpeechBuffer,
  preloadFightSpeech,
  voiceSample,
  type SpeechLine,
  type VoiceLocale,
} from './speechSamples'

type FighterVoice = 'effort' | 'pain' | 'call'
interface VocalCue {
  kind: FighterVoice
  fighter: keyof typeof FIGHTER_SOUNDS
  x: number
  intensity: number
  take: number
  delay?: number
  line?: SpeechLine
}

export function playCombatVoice(
  mix: FightMix,
  event: FightSoundEvent,
  options: { state: FightState; locale: VoiceLocale; voiceStyle: CombatVoiceStyle },
) {
  const cue = vocalCue(event, options.state)
  if (!cue) return
  const graph = mix.event(cue.x, 'voices', cue.kind === 'call' ? 2 : 0)
  if (!graph) return
  graph.timeOffset = cue.delay
  const profile = FIGHTER_SOUNDS[cue.fighter]
  const audio = fightSpeechBuffer(mix.context, options.locale)
  if (!audio) {
    breath(graph, { profile, pain: cue.kind === 'pain', force: cue.intensity })
    return
  }
  const line = cue.line ?? (`${cue.kind}-${cue.take}` as SpeechLine)
  const speed = Math.max(0.69, Math.min(1.16, 0.76 + (profile.breath - 100) * 0.0044))
  voiceSample(graph, audio, {
    locale: options.locale,
    line,
    speed: speed * COMBAT_VOICE_RATES[options.voiceStyle],
    level: cue.intensity,
  })
}

function vocalCue(event: FightSoundEvent, state: FightState): VocalCue | undefined {
  if (event.kind === 'windup' && event.fighter) {
    const weighted = event.value === 2
    return {
      kind: 'effort',
      fighter: event.fighter,
      x: event.x,
      take: state.frame % 3,
      intensity: weighted ? 0.4 : 0.28,
    }
  }
  if (event.kind === 'assist-entry' && event.side && event.source && isKameoId(event.source)) {
    const actor = state[event.side]
    return {
      kind: 'call',
      fighter: actor.id,
      x: actor.x,
      line: `call-${event.source}`,
      take: 0,
      intensity: 0.52,
    }
  }
  if (event.kind === 'impact') return hurtCue(event, state)
}

function hurtCue(event: FightSoundEvent, state: FightState): VocalCue | undefined {
  const hit = event.impact
  if (!hit || fightContactStyle(hit) !== 'hit' || hit.damage <= 0) return
  const victim = state[otherSide(hit.attacker)]
  if (hit.comboHits > 1 && hit.comboHits % 3 !== 0 && victim.health > 0) return
  const heavy = hit.damage >= 20 || hit.knockdown
  return {
    kind: 'pain',
    fighter: victim.id,
    x: event.x,
    take: heavy ? 1 + (hit.sequence % 2) : 0,
    delay: event.delay,
    intensity: heavy ? 0.54 : 0.34,
  }
}

interface SpokenCue {
  locale: VoiceLocale
  lines: readonly (BoardLine | CommentaryLine)[]
  channel: 'announcer' | 'commentary'
  voiceStyle: CombatVoiceStyle
}

export function createBoardVoice() {
  let owner: { mix: FightMix; locale: VoiceLocale } | null = null
  let revision = 0
  let until = 0
  let nextComment = 0
  let channel: SpokenCue['channel'] | undefined
  const sources = new Set<AudioBufferSourceNode>()

  function clear() {
    revision++
    until = 0
    channel = undefined
    for (const source of sources) source.stop()
    sources.clear()
  }

  function speak(mix: FightMix, audio: AudioBuffer, cue: SpokenCue) {
    const graph = mix.event(50, cue.channel, cue.channel === 'announcer' ? 3 : 1)
    if (!graph) return
    let at = mix.context.currentTime + 0.028
    const speed = COMBAT_VOICE_RATES[cue.voiceStyle]
    for (const line of cue.lines) {
      const { source, ends } = voiceSample(graph, audio, { ...cue, line, at, speed, level: 0.68 })
      sources.add(source)
      source.addEventListener('ended', () => sources.delete(source), { once: true })
      at = ends + 0.12
      until = ends
    }
  }

  function queue(mix: FightMix, cue: SpokenCue) {
    clear()
    channel = cue.channel
    const ticket = revision
    const expires = mix.context.currentTime + 0.75
    void preloadFightSpeech(mix.context, cue.locale)?.loaded.then((audio) => {
      if (ticket !== revision) return
      if (audio && mix.context.currentTime <= expires) speak(mix, audio, cue)
      if (!until) channel = undefined
    })
  }

  function resetOwner(mix: FightMix, locale: VoiceLocale) {
    if (owner?.mix === mix && owner.locale === locale) return
    clear()
    nextComment = 0
    owner = { mix, locale }
  }

  function commentaryReady({
    state,
    commentary,
    now,
  }: {
    state: FightState
    commentary: number
    now: number
  }) {
    return (
      commentary > 0 &&
      state.phase === 'fighting' &&
      state.mode !== 'training' &&
      !(channel && !until) &&
      now >= Math.max(until, nextComment)
    )
  }

  return {
    update(
      mix: FightMix,
      options: {
        before: FightState | null
        state: FightState
        locale: VoiceLocale
        active: boolean
        announcer: number
        commentary: number
        voiceStyle: CombatVoiceStyle
        events: readonly FightSoundEvent[]
      },
    ) {
      const { before, state, locale, active, announcer, commentary, voiceStyle } = options
      resetOwner(mix, locale)
      if (!active || mix.context.state !== 'running') return clear()
      if (channel && options[channel] === 0) clear()
      const lines = announcer > 0 ? matchVoiceLines(before, state) : []
      if (lines.length) {
        queue(mix, { locale, lines, voiceStyle, channel: 'announcer' })
        return
      }
      const now = mix.context.currentTime
      if (!commentaryReady({ state, commentary, now })) return
      const remark = commentaryLine(options.events)
      if (!remark) return
      nextComment = now + 7
      queue(mix, { locale, lines: [remark], voiceStyle, channel: 'commentary' })
    },
    announcing(now: number) {
      return now < until
    },
    dispose: clear,
  }
}
