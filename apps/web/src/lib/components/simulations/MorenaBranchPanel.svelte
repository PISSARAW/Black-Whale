<script lang="ts">
  import {
    QUESTION_CARDS,
    lastCard,
    needsAChoice,
    type MorenaGame,
    type TableKind,
  } from '$lib/tour/morena'

  type Member = { effectId: string; memberId: string; label: string; level: number; kills: number }
  let {
    branchId,
    actorId,
    targetId,
    entities,
    state,
  }: {
    branchId: string
    actorId: string
    targetId: string | null
    entities: Array<{ id: string; label: string; kind: string }>
    state: {
      networkEffectId: string | null
      gameEffectId: string | null
      gameEffectState: string | null
      candidateId: string | null
      witnessed: boolean
      game: MorenaGame | null
      members: Member[]
      tableKinds: TableKind[]
    }
  } = $props()
  const game = $derived(state.game)
  const settlement = $derived(game ? needsAChoice(game) : null)
</script>

<section class="panel" data-testid="morena-branch-panel">
  <div class="heading"><h2>Morena · Contagion</h2></div>
  <p>Play the negotiation and its three infection conditions as branch events.</p>

  {#if !state.networkEffectId}
    <form method="POST" action="?/morena">
      <input type="hidden" name="branchId" value={branchId} /><input
        type="hidden"
        name="actorId"
        value={actorId}
      /><input type="hidden" name="command" value="open-network" />
      <button type="submit">Open the 22-member network</button>
    </form>
  {/if}

  {#if !game || game.phase === 'over'}
    <form method="POST" action="?/morena">
      <input type="hidden" name="branchId" value={branchId} /><input
        type="hidden"
        name="actorId"
        value={actorId}
      /><input type="hidden" name="command" value="open-game" />
      <label
        >Candidate<select name="targetId" required>
          <option value="">Choose a candidate</option>
          {#each entities.filter((entity) => entity.id !== actorId) as entity (entity.id)}
            <option value={entity.id} selected={entity.id === targetId}
              >{entity.label} · {entity.kind}</option
            >
          {/each}
        </select></label
      >
      <label
        >Table technique<select name="value"
          ><option value="">None</option>{#each state.tableKinds as kind}<option value={kind}
              >{kind}</option
            >{/each}</select
        ></label
      >
      <label><input type="checkbox" name="clean" value="true" /> Clean deal</label>
      <button type="submit">Open a Morena game</button>
    </form>
  {/if}

  {#if game}
    <dl class="metrics">
      <div>
        <dt>Phase</dt>
        <dd>{game.phase}</dd>
      </div>
      <div>
        <dt>Round</dt>
        <dd>{game.round}</dd>
      </div>
      <div>
        <dt>Answers</dt>
        <dd>{game.hand.length}</dd>
      </div>
    </dl>
    {#if game.phase === 'asking'}
      <div class="actions">
        {#each QUESTION_CARDS.filter((question) => game?.questions.includes(question)) as question}
          <form method="POST" action="?/morena">
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="ask" /><input
              type="hidden"
              name="value"
              value={question}
            /><button type="submit">Ask · {question}</button>
          </form>
        {/each}
      </div>
    {:else if game.phase === 'deal'}
      <div class="actions">
        {#each game.graveyard as card}<form method="POST" action="?/morena">
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="stake" /><input
              type="hidden"
              name="value"
              value={card}
            /><button type="submit">Kiss · recover {card}</button>
          </form>{/each}
        <form method="POST" action="?/morena">
          <input type="hidden" name="branchId" value={branchId} /><input
            type="hidden"
            name="actorId"
            value={actorId}
          /><input type="hidden" name="command" value="refuse-stake" /><button type="submit"
            >Refuse the kiss</button
          >
        </form>
      </div>
    {:else if game.phase === 'settling'}
      <div class="actions">
        {#if settlement === 'joker'}
          {#each ['yes', 'no'] as choice}<form method="POST" action="?/morena">
              <input type="hidden" name="branchId" value={branchId} /><input
                type="hidden"
                name="actorId"
                value={actorId}
              /><input type="hidden" name="command" value="settle" /><input
                type="hidden"
                name="value"
                value={choice}
              /><button type="submit">Settle as {choice}</button>
            </form>{/each}
        {:else if settlement === 'back'}
          {#each game.graveyard as choice}<form method="POST" action="?/morena">
              <input type="hidden" name="branchId" value={branchId} /><input
                type="hidden"
                name="actorId"
                value={actorId}
              /><input type="hidden" name="command" value="settle" /><input
                type="hidden"
                name="value"
                value={choice}
              /><button type="submit">Recover {choice}</button>
            </form>{/each}
        {:else}
          <form method="POST" action="?/morena">
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="settle" /><button type="submit"
              >Play {lastCard(game)}</button
            >
          </form>
        {/if}
      </div>
    {:else if game.phase === 'over'}
      <p>Verdict: <strong>{game.verdict}</strong></p>
      <div class="actions">
        {#if state.gameEffectState !== 'ENDED' && (!game.kissed || (game.verdict !== 'infected' && game.verdict !== 'forced'))}<form
            method="POST"
            action="?/morena"
          >
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="close-game" /><button type="submit"
              >Close the game effect</button
            >
          </form>{/if}
        {#if !state.witnessed && game.kissed && (game.verdict === 'infected' || game.verdict === 'forced')}
          <form method="POST" action="?/morena">
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="witness-murder" /><button type="submit"
              >Witness the murder</button
            >
          </form>
        {/if}
        {#if state.witnessed && state.networkEffectId && !state.members.some((member) => member.memberId === state.candidateId)}
          <form method="POST" action="?/morena">
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="infect" /><button type="submit"
              >Infect candidate at level 0</button
            >
          </form>
        {/if}
      </div>
    {/if}
    {#if game.phase !== 'over'}
      <div class="actions">
        {#if game.technique}<form method="POST" action="?/morena">
            <input type="hidden" name="branchId" value={branchId} /><input
              type="hidden"
              name="actorId"
              value={actorId}
            /><input type="hidden" name="command" value="play-technique" /><button type="submit"
              >Play {game.technique}</button
            >
          </form>{/if}
        <form method="POST" action="?/morena">
          <input type="hidden" name="branchId" value={branchId} /><input
            type="hidden"
            name="actorId"
            value={actorId}
          /><input type="hidden" name="command" value="leave-table" /><button type="submit"
            >Leave the table</button
          >
        </form>
      </div>
    {/if}
  {/if}

  {#if state.members.length}
    <h3>Network · {state.members.length} / 22</h3>
    {#each state.members as member (member.effectId)}
      <article class="member">
        <strong>{member.label}</strong> · level {member.level} · {member.kills} kills
        <div class="actions">
          {#each [['ordinary', '+1'], ['nen-user', '+10'], ['prince', '+50']] as option}<form
              method="POST"
              action="?/morena"
            >
              <input type="hidden" name="branchId" value={branchId} /><input
                type="hidden"
                name="actorId"
                value={actorId}
              /><input type="hidden" name="command" value="record-kill" /><input
                type="hidden"
                name="memberEffectId"
                value={member.effectId}
              /><input type="hidden" name="value" value={option[0]} /><button type="submit"
                >{option[0]} {option[1]}</button
              >
            </form>{/each}
        </div>
      </article>
    {/each}
  {/if}
</section>

<style>
  form {
    margin-top: 0.75rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .actions form {
    margin: 0;
  }
  button {
    border: 1px solid var(--line-subtle);
    padding: 0.5rem 0.75rem;
    color: var(--text-primary);
  }
  label {
    display: grid;
    gap: 0.35rem;
    margin-top: 0.75rem;
    font-size: 0.75rem;
  }
  select {
    border: 1px solid var(--line-subtle);
    background: var(--surface);
    padding: 0.5rem;
  }
  .metrics {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
  }
  .metrics dt {
    color: var(--text-muted);
    font-size: 0.65rem;
    text-transform: uppercase;
  }
  .member {
    border-top: 1px solid var(--line-subtle);
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }
</style>
