<script lang="ts">
  import '$lib/components/game/mode-hud.css'
  import ModeCommand from '$lib/components/game/ModeCommand.svelte'
  import { modeNumberSlot, modeShortcut, runModeCommand } from '$lib/components/game/modeKeyboard'
  import { tick } from 'svelte'
  import { locale, t } from '$lib/i18n'
  import {
    CARD_COLOURS,
    DEALER_COLOUR,
    cssInk,
    lastCard,
    needsAChoice,
    type AnswerCard,
    type MorenaGame,
    type QuestionCard,
  } from '$lib/tour/morena'
  import type { MorenaCommand } from '$lib/tour/morenaCommands'
  import MorenaCard from './MorenaCard.svelte'

  interface Props {
    game: MorenaGame
    choice?: AnswerCard | null
    nameOfCard: (card: AnswerCard) => string
    onCommand: (command: MorenaCommand) => void
    onChoice: (choice: AnswerCard | null) => void
    knowsInfection?: boolean
    keyboardActive?: boolean
  }

  let {
    game,
    choice = null,
    nameOfCard,
    onCommand,
    onChoice,
    knowsInfection = false,
    keyboardActive = true,
  }: Props = $props()
  const copy = $derived($t.tour.morena)
  const settlement = $derived(needsAChoice(game))
  const finalChoices = $derived(
    settlement === 'joker' ? (['yes', 'no'] as const) : settlement === 'back' ? game.graveyard : [],
  )
  let actionHeading = $state<HTMLHeadingElement | null>(null)
  const questionCopy = (question: QuestionCard) =>
    (copy.questions as Record<string, { short: string; title: string }>)[question]

  /** Keep keyboard and screen-reader users on the decision that just became live. */
  $effect(() => {
    const step = `${game.phase}:${game.round}`
    void step
    void tick().then(() => actionHeading?.focus())
  })

  function play() {
    if (settlement && !choice) return
    onCommand({ kind: 'settle', choice: choice ?? undefined })
  }
  function phaseShortcut(event: KeyboardEvent, code: string | null) {
    const slot = modeNumberSlot(code)
    if (game.phase === 'asking' && game.questions[slot])
      return runModeCommand(event, () => onCommand({ kind: 'ask', question: game.questions[slot] }))
    if (game.phase === 'deal' && game.graveyard[slot])
      return runModeCommand(event, () =>
        onCommand({ kind: 'accept-deal', card: game.graveyard[slot] }),
      )
    if (game.phase !== 'settling') return
    if (finalChoices[slot]) return runModeCommand(event, () => onChoice(finalChoices[slot]))
    if (code === 'Enter' && (!settlement || choice)) runModeCommand(event, play)
  }

  function keyboard(event: KeyboardEvent) {
    const target = event.target
    if (!keyboardActive || document.pointerLockElement || target instanceof HTMLCanvasElement)
      return
    if (target instanceof HTMLElement && target.closest('dialog, [role="dialog"]')) return
    phaseShortcut(event, modeShortcut(event))
  }
</script>

<svelte:window onkeydown={keyboard} />

{#if game.phase === 'deal'}
  <div class="mode-hud mode-hud-surface mt-3 p-3" data-tone="rose" data-testid="morena-action">
    <h2 class="mode-hud-title outline-none" bind:this={actionHeading} tabindex="-1">
      {copy.deal.title}
    </h2>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/70">
      {knowsInfection ? copy.deal.bodyKnown : copy.deal.body}
    </p>
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.deal.pick}</p>
    <div class="mt-2 flex flex-wrap items-end gap-2">
      {#each game.graveyard as card, index (card)}
        <button
          class="mode-hud-button mode-command"
          type="button"
          aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
          onclick={() => onCommand({ kind: 'accept-deal', card })}
          title="{copy.deal.take} · {nameOfCard(card)}"
        >
          {#if index < 9}<kbd aria-hidden="true">{index + 1}</kbd>{/if}
          <MorenaCard face={card} label={nameOfCard(card)} ink={cssInk(CARD_COLOURS[card])} />
        </button>
      {/each}
      <button class="mode-hud-button" onclick={() => onCommand({ kind: 'decline-deal' })}
        >{copy.deal.refuse}</button
      >
    </div>
  </div>
{:else if game.phase === 'asking'}
  <section class="mode-hud mode-hud-surface mt-3 p-3" data-tone="rose" data-testid="morena-action">
    <h2 class="mode-hud-title outline-none" bind:this={actionHeading} tabindex="-1">
      {copy.askTitle}
    </h2>
    <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.askHint}</p>
    <ul class="mt-2 space-y-1.5">
      {#each game.questions as question, index (question)}
        <li>
          <button
            class="mode-hud-button mode-command w-full !justify-start text-left"
            type="button"
            aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
            onclick={() => onCommand({ kind: 'ask', question })}
          >
            {#if index < 9}<kbd aria-hidden="true">{index + 1}</kbd>{/if}
            <MorenaCard
              face={question}
              label={questionCopy(question).short}
              ink={cssInk(DEALER_COLOUR)}
            />
            <span>{questionCopy(question).title}</span>
          </button>
        </li>
      {/each}
    </ul>
  </section>
{:else if game.phase === 'settling'}
  <section class="mode-hud mode-hud-surface mt-3 p-3" data-tone="rose" data-testid="morena-action">
    <h2 class="mode-hud-title outline-none" bind:this={actionHeading} tabindex="-1">
      {copy.settle.title}
    </h2>
    {#if settlement === 'joker'}
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.jokerHint}</p>
      <div class="mt-2 flex gap-2">
        {#each ['yes', 'no'] as const as side, index (side)}
          <button
            class="mode-hud-button mode-command"
            type="button"
            aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
            aria-pressed={choice === side}
            onclick={() => onChoice(side)}
            title={nameOfCard(side)}
          >
            <kbd aria-hidden="true">{index + 1}</kbd>
            <MorenaCard face={side} label={nameOfCard(side)} ink={cssInk(CARD_COLOURS[side])} />
          </button>
        {/each}
      </div>
    {:else if settlement === 'back'}
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.backHint}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each game.graveyard as card, index (card)}
          <button
            class="mode-hud-button mode-command"
            type="button"
            aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
            aria-pressed={choice === card}
            onclick={() => onChoice(card)}
            title={nameOfCard(card)}
          >
            {#if index < 9}<kbd aria-hidden="true">{index + 1}</kbd>{/if}
            <MorenaCard face={card} label={nameOfCard(card)} ink={cssInk(CARD_COLOURS[card])} />
          </button>
        {/each}
      </div>
    {:else if lastCard(game) === 'back'}
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.backEmpty}</p>
    {/if}
    <div class="mt-3">
      <ModeCommand
        label={copy.settle.play}
        shortcut="Enter"
        keyLabel={$locale === 'fr' ? 'Entrée' : 'Enter'}
        primary
        disabled={Boolean(settlement) && !choice}
        onclick={play}
      />
    </div>
  </section>
{/if}
