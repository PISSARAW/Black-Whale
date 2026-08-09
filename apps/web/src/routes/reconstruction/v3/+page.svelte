<script lang="ts">
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { link, locale, t } from '$lib/i18n'
  import ReconstructionV3Scene from '$lib/components/reconstruction/ReconstructionV3Scene.svelte'
  import type {
    ReconstructionDecision,
    ReconstructionScenarioDraft,
  } from '$lib/reconstruction/v3/scenario'
  import { defineReconstructionScenario } from '$lib/reconstruction/v3/scenario'
  import type { ReconstructionReport } from '$lib/reconstruction/v3/report'
  import type { ReconstructionReplay } from '$lib/reconstruction/v3/replay'
  import { decodeSharedScenario, encodeSharedScenario } from '$lib/reconstruction/v3/share'
  import { eventTitle } from '$lib/utils/displayNames'

  let { data }: { data: PageData } = $props()
  let title = $state($t.reconstruction.v3.defaultTitle)
  let forkEventId = $state(data.events.at(-1)?.id ?? '')
  let mode = $state<'strict-canon' | 'rule-compatible'>('rule-compatible')
  let seed = $state(3)
  let kind = $state<ReconstructionDecision['kind']>('MOVE_ENTITY')
  let actorId = $state(data.characters[0]?.id ?? '')
  let targetId = $state(data.locations[0]?.id ?? '')
  let factId = $state('')
  let reliability = $state('trusted')
  let abilityId = $state(data.abilities[0]?.id ?? '')
  let actionId = $state('activate')
  let hatsuActions = $state<
    Array<{ id: string; label: string; visibility: string; hint?: string }>
  >([])
  let actionsLoading = $state(false)
  let conditionKind = $state<ReconstructionDecision['preconditions'][number]['kind']>('entity-at')
  let conditionSubject = $state('')
  let conditionExpected = $state('')
  let decisions = $state<ReconstructionDecision[]>([])
  let running = $state(false)
  let error = $state('')
  let branchId = $state('')
  let report = $state<ReconstructionReport | null>(null)
  let replay = $state<ReconstructionReplay | null>(null)
  let shared = $state(false)

  const actor = $derived(data.characters.find((character) => character.id === actorId))

  $effect(() => {
    const owner = data.abilities.find((ability) => ability.id === abilityId)?.ownerCharacterId
    if (kind === 'ACTIVATE_HATSU' && owner) actorId = owner
  })

  $effect(() => {
    if (kind !== 'ACTIVATE_HATSU' || !forkEventId || !abilityId || !actorId) return
    const controller = new AbortController()
    actionsLoading = true
    const query = new URLSearchParams({
      event: forkEventId,
      ability: abilityId,
      actor: actorId,
      ...(targetId ? { target: targetId } : {}),
      locale: $locale,
    })
    fetch(`/reconstruction/v3/actions?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error)
        hatsuActions = body.actions
        const available = hatsuActions.find((action) => action.visibility === 'available')
        actionId = available?.id ?? hatsuActions[0]?.id ?? ''
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        hatsuActions = []
        error = cause instanceof Error ? cause.message : $t.reconstruction.v3.errors.actionsUnavailable
      })
      .finally(() => (actionsLoading = false))
    return () => controller.abort()
  })

  onMount(() => {
    const encoded = new URLSearchParams(location.search).get('scenario')
    if (!encoded) return
    try {
      const scenario = decodeSharedScenario(encoded)
      title = scenario.title
      forkEventId = scenario.forkEventId
      mode = scenario.mode
      seed = scenario.seed
      decisions = [...scenario.decisions] as ReconstructionDecision[]
    } catch {
      error = $t.reconstruction.v3.errors.invalidShared
    }
  })

  function draft(): ReconstructionScenarioDraft {
    return {
      id: `reconstruction-${seed}`,
      title,
      forkEventId,
      mode,
      seed,
      decisions,
    }
  }

  function addDecision() {
    error = ''
    const id = `decision-${decisions.length + 1}`
    const preconditions = conditionExpected.trim()
      ? [
          {
            id: `${id}-condition`,
            kind: conditionKind,
            subjectId: conditionSubject || actorId,
            expected: conditionExpected.trim(),
          },
        ]
      : []
    let decision: ReconstructionDecision
    if (kind === 'MOVE_ENTITY') {
      if (!actor?.bodyId || !targetId)
        return void (error = $t.reconstruction.v3.errors.characterAndDestination)
      decision = {
        id,
        kind,
        actorId: actor.bodyId,
        targetIds: [targetId],
        parameters: {},
        preconditions,
      }
    } else if (kind === 'SHARE_KNOWLEDGE') {
      if (!actorId || !targetId || !factId.trim())
        return void (error = $t.reconstruction.v3.errors.knowledgeFields)
      decision = {
        id,
        kind,
        actorId,
        targetIds: [targetId],
        parameters: { factId: factId.trim(), reliability },
        preconditions,
      }
    } else {
      if (!actorId || !targetId || !abilityId || !actionId.trim())
        return void (error = $t.reconstruction.v3.errors.hatsuFields)
      decision = {
        id,
        kind,
        actorId,
        targetIds: [targetId],
        parameters: { abilityId, actionId: actionId.trim() },
        preconditions,
      }
    }
    decisions = [...decisions, decision]
    conditionExpected = ''
  }

  async function run() {
    running = true
    error = ''
    report = null
    try {
      const response = await fetch('/reconstruction/v3/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-locale': $locale },
        body: JSON.stringify({ scenario: draft(), locale: $locale }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || $t.reconstruction.v3.errors.simulationFailed)
      branchId = body.branchId
      report = body.report
      replay = body.replay
    } catch (cause) {
      error = cause instanceof Error ? cause.message : $t.reconstruction.v3.errors.simulationFailed
    } finally {
      running = false
    }
  }

  async function share() {
    const search = new URLSearchParams({
      scenario: encodeSharedScenario(defineReconstructionScenario(draft())),
    }).toString()
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}?${search}`)
    shared = true
  }
</script>

<Seo
  title={$t.reconstruction.v3.seoTitle}
  description={$t.reconstruction.v3.seoDescription}
/>

<main class="v3-shell">
  <header>
    <a href={$link('/reconstruction')}>← {$t.reconstruction.v3.canonicalBack}</a>
    <p class="eyebrow">{$t.reconstruction.v3.eyebrow}</p>
    <h1>{$t.reconstruction.v3.title}</h1>
    <p>{$t.reconstruction.v3.intro}</p>
  </header>

  <section class="composer panel">
    <div class="section-title">
      <span>01</span>
      <div>
        <h2>{$t.reconstruction.v3.divergencePoint}</h2>
        <p>{$t.reconstruction.v3.spoilerNote}</p>
      </div>
    </div>
    <div class="grid three">
      <label>{$t.reconstruction.v3.titleLabel}<input bind:value={title} maxlength="160" /></label>
      <label
        >{$t.reconstruction.v3.canonicalEvent}<select bind:value={forkEventId}
          >{#each data.events as event, index (event.id)}<option value={event.id}
              >{$t.reconstruction.v3.chapter} {event.chapter} · {$locale === 'fr'
                ? $t.reconstruction.v3.eventNumber(index + 1)
                : eventTitle(event.title, $locale)}</option
            >{/each}</select
        ></label
      >
      <label
        >{$t.reconstruction.v3.policy}<select bind:value={mode}
          ><option value="rule-compatible">{$t.reconstruction.v3.policies.compatible}</option><option
            value="strict-canon">{$t.reconstruction.v3.policies.strict}</option
          ></select
        ></label
      >
    </div>
  </section>

  <section class="panel">
    <div class="section-title">
      <span>02</span>
      <div>
        <h2>{$t.reconstruction.v3.decisions}</h2>
        <p>{$t.reconstruction.v3.decisionsIntro}</p>
      </div>
    </div>
    <div class="grid three">
      <label
        >{$t.reconstruction.v3.type}<select bind:value={kind}
          ><option value="MOVE_ENTITY">{$t.reconstruction.v3.actionTypes.MOVE_ENTITY}</option
          ><option value="SHARE_KNOWLEDGE"
            >{$t.reconstruction.v3.actionTypes.SHARE_KNOWLEDGE}</option
          ><option value="ACTIVATE_HATSU">{$t.reconstruction.v3.actionTypes.ACTIVATE_HATSU}</option
          ></select
        ></label
      >
      <label
        >{$t.reconstruction.v3.actor}<select bind:value={actorId}
          >{#each data.characters as character (character.id)}<option value={character.id}
              >{character.canonicalName}</option
            >{/each}</select
        ></label
      >
      {#if kind === 'MOVE_ENTITY'}
        <label
          >{$t.reconstruction.v3.destination}<select bind:value={targetId}
            >{#each data.locations as location (location.id)}<option value={location.id}
                >{location.name}</option
              >{/each}</select
          ></label
        >
      {:else}
        <label
          >{$t.reconstruction.v3.target}<select bind:value={targetId}
            >{#each data.characters as character (character.id)}<option value={character.id}
                >{character.canonicalName}</option
              >{/each}</select
          ></label
        >
      {/if}
      {#if kind === 'SHARE_KNOWLEDGE'}
        <label>{$t.reconstruction.v3.factId}<input bind:value={factId} /></label>
        <label
          >{$t.reconstruction.v3.reliability}<select bind:value={reliability}
            ><option value="trusted">{$t.reconstruction.v3.reliabilities.trusted}</option><option value="unverified">{$t.reconstruction.v3.reliabilities.unverified}</option
            ><option value="deceptive">{$t.reconstruction.v3.reliabilities.deceptive}</option><option value="unknown">{$t.reconstruction.v3.reliabilities.unknown}</option
            ></select
          ></label
        >
      {:else if kind === 'ACTIVATE_HATSU'}
        <label
          >Hatsu<select bind:value={abilityId}
            >{#each data.abilities as ability (ability.id)}<option value={ability.id}
                >{ability.name}</option
              >{/each}</select
          ></label
        >
        <label
          >{$t.reconstruction.v3.hatsuAction}<select bind:value={actionId} disabled={actionsLoading}
            >{#each hatsuActions as action (action.id)}<option
                value={action.id}
                disabled={action.visibility === 'locked' || action.visibility === 'hidden'}
                >{action.label} · {action.visibility}</option
              >{/each}</select
          ></label
        >
      {/if}
    </div>
    {#if kind === 'ACTIVATE_HATSU'}
      <ReconstructionV3Scene {abilityId} onTarget={(id) => (targetId = id)} />
    {/if}
    <details>
      <summary>{$t.reconstruction.v3.causalPrecondition}</summary>
      <div class="grid three condition">
        <label
          >{$t.reconstruction.v3.condition}<select bind:value={conditionKind}
            ><option value="entity-at">{$t.reconstruction.v3.conditions.entityAt}</option><option value="knows-fact"
              >{$t.reconstruction.v3.conditions.knowsFact}</option
            ><option value="ability-available">{$t.reconstruction.v3.conditions.abilityAvailable}</option><option
              value="event-occurred">{$t.reconstruction.v3.conditions.eventOccurred}</option
            ></select
          ></label
        >
        <label>{$t.reconstruction.v3.subject}<input bind:value={conditionSubject} placeholder={$t.reconstruction.v3.defaultActor} /></label>
        <label>{$t.reconstruction.v3.expectedValue}<input bind:value={conditionExpected} /></label>
      </div>
    </details>
    <button class="secondary" type="button" onclick={addDecision}>{$t.reconstruction.v3.addDecision}</button>
    <ol class="decisions">
      {#each decisions as decision, index (decision.id)}<li>
          <span>{String(index + 1).padStart(2, '0')}</span><strong>{decision.kind}</strong><code
            >{decision.actorId}</code
          ><button
            aria-label={$t.reconstruction.v3.removeDecision}
            onclick={() => (decisions = decisions.filter((_, i) => i !== index))}>×</button
          >
        </li>{/each}
    </ol>
  </section>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="actions">
    <button onclick={run} disabled={running || !decisions.length}
      >{running ? $t.reconstruction.v3.running : $t.reconstruction.v3.run}</button
    ><button class="secondary" onclick={share} disabled={!decisions.length}
      >{shared ? $t.reconstruction.v3.copied : $t.reconstruction.v3.share}</button
    >
  </div>

  {#if report}
    <section class="report panel">
      <div class="section-title">
        <span>03</span>
        <div>
          <h2>{$t.reconstruction.v3.report}</h2>
          <p>{report.summary}</p>
        </div>
      </div>
      <div class="metrics">
        <article><small>{$t.reconstruction.v3.fidelity}</small><strong>{report.fidelity}</strong></article>
        <article><small>{$t.reconstruction.v3.branch}</small><strong>{branchId}</strong></article>
        <article>
          <small>{$t.reconstruction.v3.firstDivergence}</small><strong>{report.divergenceDecisionId ?? $t.reconstruction.v3.none}</strong>
        </article>
      </div>
      <h3>{$t.reconstruction.v3.differences}</h3>
      {#if report.differences.length}<div class="diffs">
          {#each report.differences as difference (`${difference.subjectId}:${difference.axis}`)}<article
            >
              <span>{difference.axis}</span><strong>{difference.subjectId}</strong><code
                >{JSON.stringify(difference.canonical)} → {JSON.stringify(difference.branch)}</code
              >
            </article>{/each}
        </div>{:else}<p>{$t.reconstruction.v3.noDifferences}</p>{/if}
      {#if report.decisiveHatsu.length}<h3>{$t.reconstruction.v3.decisiveHatsu}</h3>
        <ul>
          {#each report.decisiveHatsu as hatsu (hatsu.decisionId)}<li>
              {hatsu.abilityId} · {hatsu.decisionId}
            </li>{/each}
        </ul>{/if}
      {#if report.blockedDecisions.length || report.invalidatedDecisions.length}<h3>
          {$t.reconstruction.v3.unappliedDecisions}
        </h3>
        <ul>
          {#each [...report.blockedDecisions, ...report.invalidatedDecisions] as item (item.decisionId)}<li
            >
              <strong>{item.decisionId}</strong> — {item.reason}
            </li>{/each}
        </ul>{/if}
      <details>
        <summary>{$t.reconstruction.v3.assumptions}</summary>
        <ul>
          {#each report.assumptions as assumption (assumption)}<li>{assumption}</li>{/each}
        </ul>
        <pre>{JSON.stringify(replay, null, 2)}</pre>
      </details>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    background: #070b12;
    color: #eef3f8;
  }
  .v3-shell {
    max-width: 1180px;
    margin: auto;
    padding: 3rem 1.25rem 6rem;
    font-family: Inter, system-ui, sans-serif;
  }
  header {
    max-width: 780px;
    margin-bottom: 2.5rem;
  }
  header a {
    color: #8fc7d9;
    text-decoration: none;
  }
  h1 {
    font-family: Georgia, serif;
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    line-height: 0.92;
    margin: 0.5rem 0 1rem;
  }
  h2,
  h3,
  p {
    margin-top: 0;
  }
  .eyebrow,
  .section-title > span {
    color: #e8b05b;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.72rem;
  }
  .panel {
    background: linear-gradient(145deg, #111a27, #0b111b);
    border: 1px solid #263447;
    border-radius: 18px;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: 0 24px 70px #0006;
  }
  .section-title {
    display: flex;
    gap: 1rem;
    align-items: start;
    margin-bottom: 1.3rem;
  }
  .section-title h2 {
    margin: 0;
    font-family: Georgia, serif;
    font-size: 1.7rem;
  }
  .section-title p {
    color: #91a0b1;
    margin: 0.2rem 0;
  }
  .grid {
    display: grid;
    gap: 1rem;
  }
  .three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  label {
    display: grid;
    gap: 0.45rem;
    color: #aeb9c6;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  input,
  select {
    width: 100%;
    box-sizing: border-box;
    background: #080d15;
    color: #f4f7fa;
    border: 1px solid #33445b;
    border-radius: 9px;
    padding: 0.8rem;
    font: inherit;
    text-transform: none;
    letter-spacing: 0;
  }
  details {
    margin: 1.2rem 0;
    color: #aeb9c6;
  }
  .condition {
    margin-top: 1rem;
  }
  button {
    border: 0;
    border-radius: 999px;
    background: #e8b05b;
    color: #111827;
    padding: 0.85rem 1.3rem;
    font-weight: 800;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .secondary {
    background: transparent;
    color: #9dd5e7;
    border: 1px solid #35586a;
  }
  .decisions {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: grid;
    gap: 0.5rem;
  }
  .decisions li {
    display: grid;
    grid-template-columns: 2rem 1fr 1fr auto;
    align-items: center;
    gap: 0.7rem;
    background: #080d15;
    padding: 0.7rem;
    border-radius: 9px;
  }
  .decisions li span {
    color: #e8b05b;
  }
  .decisions li button {
    padding: 0.25rem 0.6rem;
    background: transparent;
    color: #ef8b8b;
  }
  .actions {
    display: flex;
    gap: 0.8rem;
    margin: 1.5rem 0;
  }
  .error {
    border: 1px solid #9b3f4d;
    background: #32141a;
    padding: 1rem;
    border-radius: 10px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  .metrics article,
  .diffs article {
    background: #080d15;
    border: 1px solid #253346;
    border-radius: 10px;
    padding: 1rem;
    display: grid;
    gap: 0.35rem;
  }
  .metrics small,
  .diffs span {
    color: #e8b05b;
    text-transform: uppercase;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
  }
  .diffs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }
  pre {
    overflow: auto;
    max-height: 24rem;
    background: #05080d;
    padding: 1rem;
    border-radius: 10px;
    font-size: 0.72rem;
  }
  @media (max-width: 760px) {
    .three,
    .metrics,
    .diffs {
      grid-template-columns: 1fr;
    }
    .decisions li {
      grid-template-columns: 2rem 1fr auto;
    }
    .decisions code {
      display: none;
    }
    .actions {
      flex-direction: column;
    }
  }
</style>
