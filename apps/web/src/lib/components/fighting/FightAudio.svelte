<script lang="ts">
  import { onMount } from 'svelte'
  import { isThrowTech } from '$lib/fighting/reactionMotion'
  import type { FightImpact, FightState } from '$lib/fighting/types'

  export let state: FightState

  let context: AudioContext | null = null
  let lastImpact = state.impact?.sequence ?? 0
  let lastThrowTech = false
  let lastAura = `${state.player.nen.mode}:${state.opponent.nen.mode}`

  onMount(() => {
    const unlock = () => {
      context ??= new AudioContext()
      void context.resume()
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      void context?.close()
    }
  })

  $: syncImpact(state.impact)
  $: syncThrowTech(isThrowTech(state))
  $: syncAura(`${state.player.nen.mode}:${state.opponent.nen.mode}`)

  function syncImpact(impact: FightImpact | null): void {
    if (!impact || impact.sequence === lastImpact) return
    lastImpact = impact.sequence
    if (impact.blocked || impact.parried) {
      tone(180, 0.075, 0.055)
      tone(420, 0.045, 0.025)
      return
    }
    playStrike(impact)
  }

  function playStrike(impact: FightImpact): void {
    const heavy = impact.kind === 'heavy' || impact.kind === 'special' || impact.knockdown
    tone(heavy ? 72 : 105, heavy ? 0.13 : 0.075, heavy ? 0.09 : 0.055)
    if (heavy) tone(48, 0.18, 0.065)
  }

  function syncThrowTech(active: boolean): void {
    if (active && !lastThrowTech) {
      tone(320, 0.08, 0.05)
      tone(540, 0.11, 0.04)
    }
    lastThrowTech = active
  }

  function syncAura(value: string): void {
    if (value === lastAura) return
    lastAura = value
    tone(110, 0.28, 0.025)
    tone(220, 0.22, 0.018)
  }

  function tone(frequency: number, duration: number, volume: number): void {
    if (!context) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = frequency < 100 ? 'sawtooth' : 'triangle'
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(35, frequency * 0.62),
      now + duration,
    )
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration)
  }
</script>
