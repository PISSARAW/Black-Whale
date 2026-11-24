import { sharedAudioContext } from '$lib/audio/context'
import { outputBus } from '$lib/audio/output'
import type { Action } from 'svelte/action'
import type { FighterId } from '../types'
import { rivalExchange, rivalKey } from '../presentation/rivals'
import { COMBAT_VOICE_RATES, fightAudioChanges, readFightAudioSettings } from './settings'
import { loadVoiceAsset, type VoiceLocale } from './speechSamples'
import lines from './selectionLines.json'

export function fighterSelectionLine(fighter: FighterId, locale: VoiceLocale): string | undefined {
  return lines[fighter as keyof typeof lines]?.[locale === 'fr' ? 0 : 1]
}

let stopCurrent: (() => void) | undefined

export function previewSelectionVoice(fighter: FighterId, locale: VoiceLocale, other?: FighterId) {
  const key =
    other && rivalExchange(fighter, other)
      ? `rivals/${locale}-${rivalKey(fighter, other)}`
      : `selection/${locale}-${fighter}`
  stopCurrent?.()
  if (!fighterSelectionLine(fighter, locale) || !audible()) return
  const context = sharedAudioContext()
  const output = outputBus('effects')
  if (!context || !output) return

  let source: AudioBufferSourceNode | undefined
  let volume: GainNode | undefined

  function synchronize() {
    if (!audible()) return stop()
    if (volume) volume.gain.value = readFightAudioSettings().voices * 0.7
  }

  function stop() {
    if (stopCurrent !== stop) return
    stopCurrent = undefined
    cancelPreferences()
    window.removeEventListener('storage', synchronize)
    document.removeEventListener('visibilitychange', synchronize)
    source?.stop()
    source?.disconnect()
    volume?.disconnect()
  }

  const cancelPreferences = fightAudioChanges.subscribe(synchronize)
  stopCurrent = stop
  window.addEventListener('storage', synchronize)
  document.addEventListener('visibilitychange', synchronize)
  const ready = context.state === 'running' ? Promise.resolve() : context.resume()
  const bank = loadVoiceAsset(context, key)
  void Promise.all([ready, bank?.loaded])
    .then(([, speech]) => {
      if (stopCurrent !== stop) return
      if (!speech || !audible()) return stop()
      volume = context.createGain()
      const settings = readFightAudioSettings()
      volume.gain.value = settings.voices * 0.7
      source = context.createBufferSource()
      source.buffer = speech
      source.playbackRate.value = COMBAT_VOICE_RATES[settings.voiceStyle]
      source.connect(volume).connect(output)
      source.addEventListener(
        'ended',
        () => {
          source?.disconnect()
          source = undefined
          stop()
        },
        { once: true },
      )
      source.start()
    })
    .catch(stop)
  return stop
}

function audible() {
  const settings = readFightAudioSettings()
  return (
    typeof document !== 'undefined' && !document.hidden && !settings.muted && settings.voices > 0
  )
}

type SelectionOptions = VoiceLocale | { locale: VoiceLocale; other: FighterId }

export const selectionVoice: Action<HTMLSelectElement, SelectionOptions> = (select, options) => {
  let stop: (() => void) | undefined
  const change = () => {
    const fighter = select.value as FighterId
    stop =
      typeof options === 'string'
        ? previewSelectionVoice(fighter, options)
        : previewSelectionVoice(fighter, options.locale, options.other)
  }
  select.addEventListener('change', change)
  return {
    update(next) {
      stop?.()
      options = next
    },
    destroy() {
      stop?.()
      select.removeEventListener('change', change)
    },
  }
}
