<script lang="ts">
  import type { PageData } from './$types';
  import Seo from '$lib/components/Seo.svelte';
  import { breadcrumbSchema } from '$lib/seo/schema';

  type CharacterRecord = {
    id: string;
    canonicalName: string;
    factionId?: string | null;
    aliases?: string[];
    shipLocation?: { role?: string | null } | null;
  };

  let { data }: { data: PageData } = $props();
  let selectedFactionId = $state('prince-woble');
  let query = $state('');
  let relationFilter = $state('all');

  const palette: Record<string, { color: string; mark: string }> = {
    alliance: { color: '#75c9b8', mark: '↔' },
    cooperation: { color: '#70bdc1', mark: '◇' },
    conflict: { color: '#df746b', mark: '×' },
    patronage: { color: '#e6b661', mark: '◆' },
    control: { color: '#c99d66', mark: '↓' }
  };

  const characters = $derived(data.characters as CharacterRecord[]);
  const factionById = $derived(new Map(data.factions.map((faction) => [faction.id, faction])));
  const activeFaction = $derived(factionById.get(selectedFactionId));
  const members = $derived(characters.filter((character) => character.factionId === selectedFactionId));
  const connectedRelations = $derived(
    data.relations
      .filter((relation) => relation.from === selectedFactionId || relation.to === selectedFactionId)
      .filter((relation) => relationFilter === 'all' || relation.type === relationFilter)
      .map((relation) => ({
        ...relation,
        counterpartId: relation.from === selectedFactionId ? relation.to : relation.from,
        counterpart: factionById.get(relation.from === selectedFactionId ? relation.to : relation.from)
      }))
  );
  const normalizedQuery = $derived(query.trim().toLowerCase());
  const visibleFactions = $derived(
    data.factions
      .map((faction) => ({
        ...faction,
        memberCount: characters.filter((character) => character.factionId === faction.id).length,
        relationCount: data.relations.filter((relation) => relation.from === faction.id || relation.to === faction.id).length
      }))
      .filter((faction) => !normalizedQuery || `${faction.name} ${faction.description}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => b.relationCount - a.relationCount || b.memberCount - a.memberCount || a.name.localeCompare(b.name))
  );

  function selectFaction(factionId: string) {
    selectedFactionId = factionId;
    relationFilter = 'all';
  }
</script>

<Seo
  title="Faction Intelligence"
  description="Inspect the alliances, conflicts and known members shaping the Black Whale succession war — prince factions, mafia families, Hunters and the Phantom Troupe."
  jsonLd={breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Factions', path: '/relationships' }
  ])}
/>

<div class="network-page">
  <header class="network-hero">
    <div>
      <p class="eyebrow">Strategic intelligence · Black Whale</p>
      <h1>Faction Network</h1>
      <p class="intro">Trace who cooperates, who is being used, and where open conflict has begun. Every connection is tied to the chapter that establishes it.</p>
    </div>
    <dl class="network-stats">
      <div><dt>Factions</dt><dd>{data.factions.length}</dd></div>
      <div><dt>Known ties</dt><dd>{data.relations.length}</dd></div>
      <div><dt>Affiliated people</dt><dd>{characters.filter((character) => character.factionId).length}</dd></div>
    </dl>
  </header>

  {#if data.spoilerLimit}
    <div class="spoiler-notice"><span>◉</span> Intelligence limited to chapter {data.spoilerLimit}. Later connections remain concealed.</div>
  {/if}

  <main class="network-workspace">
    <aside class="faction-index" aria-label="Faction index">
      <div class="index-heading">
        <div><span>01</span><h2>Choose a faction</h2></div>
        <label>
          <span class="sr-only">Search factions</span>
          <input bind:value={query} type="search" placeholder="Search the network…" />
        </label>
      </div>

      <nav>
        {#each visibleFactions as faction (faction.id)}
          <button
            type="button"
            class:active={selectedFactionId === faction.id}
            aria-pressed={selectedFactionId === faction.id}
            onclick={() => selectFaction(faction.id)}
          >
            <span class="node" aria-hidden="true"></span>
            <span class="faction-copy"><strong>{faction.name}</strong><small>{faction.memberCount} personnel · {faction.relationCount} ties</small></span>
            <span class="arrow">›</span>
          </button>
        {:else}
          <p class="empty-index">No faction matches this search.</p>
        {/each}
      </nav>
    </aside>

    <section class="intelligence-panel" aria-live="polite">
      {#if activeFaction}
        <header class="faction-header">
          <div class="faction-seal" aria-hidden="true">{activeFaction.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>
          <div>
            <p>Selected dossier · {String(data.factions.findIndex((faction) => faction.id === selectedFactionId) + 1).padStart(2, '0')}</p>
            <h2>{activeFaction.name}</h2>
            <span>{activeFaction.description}</span>
          </div>
        </header>

        <section class="ties-section">
          <div class="section-title">
            <div><span>02</span><h3>Known connections</h3></div>
            <div class="relation-filters" aria-label="Filter connections">
              {#each ['all', 'alliance', 'cooperation', 'conflict', 'control'] as type}
                <button type="button" class:active={relationFilter === type} onclick={() => relationFilter = type}>{type}</button>
              {/each}
            </div>
          </div>

          <div class="ties-list">
            {#each connectedRelations as relation (relation.id)}
              <article class="tie-card" style={`--relation:${palette[relation.type]?.color || '#768083'}`}>
                <div class="relation-glyph" aria-hidden="true">{palette[relation.type]?.mark}</div>
                <div class="tie-copy">
                  <p><span>{relation.type}</span><a href="/timeline#chapter-{relation.chapter}">Established ch. {relation.chapter}</a></p>
                  <button type="button" onclick={() => selectFaction(relation.counterpartId)}>{relation.counterpart?.name || relation.counterpartId} <span>↗</span></button>
                  <h4>{relation.label}</h4>
                  <p class="evidence">{relation.evidence}</p>
                </div>
              </article>
            {:else}
              <div class="empty-state">
                <span>Signal absent</span>
                <h4>No documented connection</h4>
                <p>This does not mean the faction is neutral—only that the current dossier has no chapter-backed tie matching this filter.</p>
              </div>
            {/each}
          </div>
        </section>

        <section class="members-section">
          <div class="section-title"><div><span>03</span><h3>Known personnel</h3></div><small>{members.length} records</small></div>
          <div class="member-grid">
            {#each members as character (character.id)}
              <a href="/characters/{character.id}">
                <span class="initials">{character.canonicalName.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>
                <span><strong>{character.canonicalName}</strong><small>{character.shipLocation?.role || character.aliases?.[0] || 'Affiliation confirmed'}</small></span>
                <i>↗</i>
              </a>
            {:else}
              <div class="empty-state compact"><p>No named personnel are confirmed in the current catalogue.</p></div>
            {/each}
          </div>
        </section>
      {/if}
    </section>
  </main>
</div>

<style>
  .network-page{min-height:100vh;padding:clamp(2rem,5vw,5rem) var(--page-gutter) 6rem;background:radial-gradient(circle at 76% 15%,rgba(112,189,193,.08),transparent 28%)}
  .network-hero{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(22rem,.7fr);gap:3rem;align-items:end;max-width:var(--container-wide);margin:0 auto 2rem;padding-bottom:2rem;border-bottom:1px solid var(--line-default)}
  .network-hero h1{margin:.45rem 0 .7rem;font-size:clamp(3.5rem,8vw,7.5rem);font-weight:500;line-height:.82;letter-spacing:-.035em;text-transform:uppercase}.intro{max-width:48rem;margin:0;color:var(--text-secondary);font-size:clamp(.9rem,1.5vw,1.05rem);line-height:1.7}
  .network-stats{display:grid;grid-template-columns:repeat(3,1fr);margin:0;border:1px solid var(--line-default);background:rgba(11,17,21,.78)}.network-stats div{padding:1.1rem;border-right:1px solid var(--line-default)}.network-stats div:last-child{border:0}.network-stats dt{color:var(--text-faint);font:.48rem/1.2 var(--font-mono);letter-spacing:.1em;text-transform:uppercase}.network-stats dd{margin:.45rem 0 0;color:var(--accent-gold-bright);font:500 1.8rem/1 var(--font-display)}
  .spoiler-notice{display:flex;align-items:center;gap:.55rem;max-width:var(--container-wide);margin:0 auto 1rem;padding:.7rem 1rem;border:1px solid rgba(230,182,97,.25);color:var(--state-suspected);background:rgba(230,182,97,.06);font:.58rem/1.4 var(--font-mono);letter-spacing:.04em}.spoiler-notice span{font-size:.5rem}
  .network-workspace{display:grid;grid-template-columns:minmax(17rem,22rem) minmax(0,1fr);max-width:var(--container-wide);min-height:44rem;margin:auto;border:1px solid var(--line-default);background:rgba(7,10,12,.72);box-shadow:0 30px 80px rgba(0,0,0,.22)}
  .faction-index{border-right:1px solid var(--line-default);background:rgba(11,17,21,.82)}.index-heading{position:sticky;z-index:2;top:var(--header-height);padding:1.25rem;border-bottom:1px solid var(--line-default);background:rgba(11,17,21,.96);backdrop-filter:blur(14px)}.index-heading>div,.section-title>div{display:flex;align-items:center;gap:.65rem}.index-heading h2,.section-title h3{margin:0;font-size:1rem;letter-spacing:.05em;text-transform:uppercase}.index-heading>div>span,.section-title>div>span{color:var(--accent-gold);font:.52rem/1 var(--font-mono)}.index-heading label{display:block;margin-top:1rem}.index-heading input{width:100%;padding:.7rem .8rem;border:1px solid var(--line-default);border-radius:.2rem;outline:0;background:var(--surface-void);color:var(--text-primary);font:.65rem/1 var(--font-mono)}.index-heading input:focus{border-color:var(--accent-gold)}
  .faction-index nav{max-height:60rem;overflow:auto}.faction-index nav button{display:grid;width:100%;grid-template-columns:.7rem 1fr auto;gap:.8rem;align-items:center;padding:1rem 1.15rem;border:0;border-bottom:1px solid var(--line-subtle);background:transparent;color:var(--text-secondary);text-align:left;cursor:pointer;transition:.18s}.faction-index nav button:hover,.faction-index nav button.active{background:linear-gradient(90deg,rgba(200,169,86,.1),transparent);color:var(--text-primary)}.faction-index nav button.active{box-shadow:inset 2px 0 var(--accent-gold)}.node{width:.45rem;height:.45rem;border:1px solid var(--text-faint);border-radius:50%}.active .node{border-color:var(--accent-gold);background:var(--accent-gold);box-shadow:0 0 10px var(--accent-gold-glow)}.faction-copy{display:flex;min-width:0;flex-direction:column;gap:.35rem}.faction-copy strong{overflow:hidden;font:500 1rem/1.1 var(--font-display);text-overflow:ellipsis;white-space:nowrap}.faction-copy small{color:var(--text-faint);font:.45rem/1 var(--font-mono);letter-spacing:.06em;text-transform:uppercase}.arrow{color:var(--text-faint)}.empty-index{padding:2rem;color:var(--text-faint);font-size:.7rem}
  .intelligence-panel{min-width:0}.faction-header{display:grid;grid-template-columns:6rem 1fr;gap:1.5rem;align-items:center;padding:clamp(1.5rem,4vw,3rem);border-bottom:1px solid var(--line-default);background:linear-gradient(110deg,rgba(200,169,86,.08),transparent 55%)}.faction-seal{display:grid;width:6rem;height:6rem;place-items:center;border:1px solid var(--line-strong);border-radius:50%;color:var(--accent-gold-bright);background:radial-gradient(circle,rgba(200,169,86,.1),transparent 65%);font:500 1.6rem/1 var(--font-display);letter-spacing:.08em}.faction-header p{margin:0;color:var(--accent-gold);font:.5rem/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase}.faction-header h2{margin:.5rem 0;font-size:clamp(2rem,5vw,4rem);line-height:.9;text-transform:uppercase}.faction-header>div>span{display:block;max-width:44rem;color:var(--text-muted);font-size:.75rem;line-height:1.6}
  .ties-section,.members-section{padding:clamp(1.25rem,3vw,2.25rem)}.members-section{border-top:1px solid var(--line-default)}.section-title{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}.section-title>small{color:var(--text-faint);font:.5rem/1 var(--font-mono);text-transform:uppercase}.relation-filters{display:flex;gap:.25rem;overflow:auto}.relation-filters button{padding:.42rem .55rem;border:1px solid transparent;border-radius:.2rem;background:transparent;color:var(--text-faint);font:.45rem/1 var(--font-mono);letter-spacing:.05em;text-transform:uppercase;cursor:pointer}.relation-filters button:hover,.relation-filters button.active{border-color:var(--line-default);color:var(--text-primary);background:var(--surface-panel)}
  .ties-list{display:grid;gap:.7rem}.tie-card{display:grid;grid-template-columns:3.5rem 1fr;border:1px solid color-mix(in srgb,var(--relation) 28%,var(--line-subtle));background:linear-gradient(90deg,color-mix(in srgb,var(--relation) 7%,var(--surface-deep)),var(--surface-deep) 42%)}.relation-glyph{display:grid;place-items:center;border-right:1px solid color-mix(in srgb,var(--relation) 25%,var(--line-subtle));color:var(--relation);font:500 1.25rem/1 var(--font-mono)}.tie-copy{padding:1rem 1.15rem}.tie-copy>p:first-child{display:flex;justify-content:space-between;gap:1rem;margin:0;color:var(--relation);font:.46rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.tie-copy>p a{color:var(--text-faint);text-decoration:none}.tie-copy>p a:hover{color:var(--accent-gold)}.tie-copy>button{margin:.7rem 0 .25rem;padding:0;border:0;background:transparent;color:var(--text-primary);font:500 1.5rem/1 var(--font-display);cursor:pointer}.tie-copy>button span{color:var(--relation);font-size:.7rem}.tie-copy h4{margin:.25rem 0;color:var(--relation);font:.55rem/1.2 var(--font-mono);letter-spacing:.05em;text-transform:uppercase}.evidence{margin:.65rem 0 0;color:var(--text-muted);font-size:.68rem;line-height:1.6}
  .member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line-subtle);border:1px solid var(--line-subtle)}.member-grid>a{display:grid;grid-template-columns:2.5rem 1fr auto;gap:.75rem;align-items:center;padding:.8rem;background:var(--surface-deep);color:inherit;text-decoration:none}.member-grid>a:hover{background:var(--surface-panel)}.initials{display:grid;width:2.5rem;height:2.5rem;place-items:center;border:1px solid var(--line-default);border-radius:50%;color:var(--accent-gold);font:.55rem/1 var(--font-mono)}.member-grid>a>span:nth-child(2){display:flex;min-width:0;flex-direction:column;gap:.25rem}.member-grid strong{overflow:hidden;font:500 1rem/1 var(--font-display);text-overflow:ellipsis;white-space:nowrap}.member-grid small{overflow:hidden;color:var(--text-faint);font:.46rem/1.2 var(--font-mono);text-overflow:ellipsis;white-space:nowrap}.member-grid i{color:var(--accent-gold);font-style:normal;font-size:.6rem}
  .empty-state{padding:2.5rem;border:1px dashed var(--line-default);text-align:center}.empty-state span{color:var(--accent-alert);font:.48rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.empty-state h4{margin:.6rem 0;font-size:1.4rem}.empty-state p{max-width:32rem;margin:auto;color:var(--text-faint);font-size:.68rem;line-height:1.6}.empty-state.compact{grid-column:1/-1;padding:1.5rem}
  @media(max-width:900px){.network-hero{grid-template-columns:1fr}.network-workspace{grid-template-columns:1fr}.faction-index{border-right:0;border-bottom:1px solid var(--line-default)}.index-heading{position:static}.faction-index nav{display:flex;max-height:none;overflow:auto}.faction-index nav button{width:16rem;flex:none;border-right:1px solid var(--line-subtle)}.network-stats{max-width:36rem}}
  @media(max-width:620px){.network-page{padding-inline:1rem}.network-stats{grid-template-columns:1fr}.network-stats div{display:flex;align-items:center;justify-content:space-between;border-right:0;border-bottom:1px solid var(--line-default)}.faction-header{grid-template-columns:3.5rem 1fr}.faction-seal{width:3.5rem;height:3.5rem;font-size:1rem}.section-title{align-items:flex-start;flex-direction:column}.tie-card{grid-template-columns:2.5rem 1fr}.member-grid{grid-template-columns:1fr}.tie-copy>p:first-child{align-items:flex-start;flex-direction:column;gap:.35rem}}
</style>
