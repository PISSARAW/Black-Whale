import { sharedAudioContext } from '$lib/audio/context'
import { outputBus } from '$lib/audio/output'
import type { introDialogue } from '../presentation/introDialogue'
import { RIVAL_VOICE_SAMPLE_RATE } from '../presentation/introDialogue'
import { introShot, type IntroFrame } from '../presentation/introPlayback'
import { readFightAudioSettings } from './settings'
import { loadVoiceAsset, playVoiceSlice, type VoiceLocale } from './speechSamples'

type Dialogue = NonNullable<ReturnType<typeof introDialogue>>

export function primeIntroSpeech(dialogue: Dialogue, locale: VoiceLocale) {
  const settings = readFightAudioSettings()
  if (settings.muted || settings.voices === 0) return
  const context = sharedAudioContext()
  if (!context) return
  if (context.state === 'suspended') void context.resume().catch(() => {})
  loadVoiceAsset(context, `rivals/${locale}-${dialogue.key}`)
}

export function introSpeechCue(frame: IntroFrame, dialogue: Dialogue, locale: VoiceLocale) {
  if (frame.waiting || frame.mode !== 'full') return
  const { side, progress } = introShot(frame)
  if (!side) return
  const position = side === dialogue.firstSide ? 0 : 1
  const [from, count] = dialogue.spans[locale][position]
  return {
    side,
    offset: from / RIVAL_VOICE_SAMPLE_RATE,
    duration: count / RIVAL_VOICE_SAMPLE_RATE,
    elapsed: progress * dialogue.shotSeconds[position],
  }
}

function preparedVoice(frame: IntroFrame, dialogue: Dialogue, locale: VoiceLocale) {
  const context = sharedAudioContext()
  if (!context) return
  const key = `rivals/${locale}-${dialogue.key}`
  const audio = loadVoiceAsset(context, key)?.audio
  const cue = introSpeechCue(frame, dialogue, locale)
  if (cue && audio && context.state === 'running') return { context, key, audio, cue }
}

export function createIntroSpeech() {
  let take: string | undefined
  let current: AudioBufferSourceNode | undefined
  let warmingKey: string | undefined
  let warmingUntil = 0

  function warming(frame: IntroFrame, dialogue: Dialogue, locale: VoiceLocale): boolean {
    if (frame.waiting || frame.elapsed !== 0 || frame.mode !== 'full') {
      warmingKey = undefined
      return false
    }
    const context = sharedAudioContext()
    if (context?.state !== 'running') return false
    const key = `rivals/${locale}-${dialogue.key}`
    const bank = loadVoiceAsset(context, key)
    const now = performance.now()
    const run = `${frame.run ?? 0}:${key}`
    if (warmingKey !== run) {
      warmingKey = run
      warmingUntil = now + 400
    }
    return !bank?.audio && now < warmingUntil
  }

  function stop() {
    current?.stop()
    current = undefined
    take = undefined
  }

  function update(
    frame: IntroFrame,
    dialogue: Dialogue,
    options: { locale: VoiceLocale; level: number; speed: number; paused: boolean },
  ) {
    if (frame.mode !== 'full' || options.paused || options.level === 0) return stop()
    const voice = preparedVoice(frame, dialogue, options.locale)
    if (!voice) return stop()
    const { context, key, audio, cue } = voice
    const id = `${frame.run ?? 0}:${key}:${cue.side}:${options.speed}:${options.level}`
    if (id === take) return
    stop()
    const played = cue.elapsed < 0.08 ? 0 : cue.elapsed * options.speed
    if (cue.duration <= played) return
    const master = outputBus('effects')
    if (!master) return
    take = id
    const { source } = playVoiceSlice({ context, master }, audio, {
      offset: cue.offset + played,
      duration: cue.duration - played,
      speed: options.speed,
      level: options.level * 0.7,
      at: context.currentTime,
    })
    current = source
    source.addEventListener(
      'ended',
      () => {
        if (current === source) current = undefined
      },
      { once: true },
    )
  }

  return { update, stop, warming }
}
