<script lang="ts">
  import type { PageData } from './$types';
  import { toEnglishAlias, toEnglishDisplayName } from '$lib/utils/displayNames';

  let { data }: { data: PageData } = $props();
  let character = $derived(data.character as any);
  let timeline = $derived((data.timeline || []) as any[]);
  let chapterTrajectory = $derived((data.chapterTrajectory || []) as any[]);
  let roleHistory = $derived((data.roleHistory || []) as any[]);
  let affiliations = $derived((data.affiliations || []) as any[]);
  let documentedAppearances = $derived((character.mangaAppearances || []).filter((appearance: any) => appearance.status !== 'absent'));
  let displayName = $derived(toEnglishDisplayName(character.canonicalName));
  let initials = $derived(displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join(''));
  let latestKnownChapter = $derived(chapterTrajectory.findLast((chapter: any) => chapter.visits.some((visit: any) => visit.location !== 'Position inconnue')));
  let currentLocation = $derived(latestKnownChapter?.visits.map((visit: any) => visit.location).join(' → ') || [
      character.shipLocation?.tier ? `Tier ${character.shipLocation.tier}` : null,
      character.shipLocation?.room
    ].filter(Boolean).join(' · ') || 'Unknown / possibly off ship');
  let latestState = $derived(timeline.findLast((entry: any) => entry.kind === 'body-state' || entry.kind === 'consciousness-state' || entry.kind === 'appearance'));

  const labels: Record<string, string> = {
    ALIVE: 'Alive', INJURED: 'Injured', UNCONSCIOUS: 'Unconscious', DEAD: 'Dead', DESTROYED: 'Destroyed',
    PRESERVED: 'Body preserved', UNKNOWN: 'Unknown', ACTIVE: 'Consciousness active', TRANSFERRED: 'Consciousness transferred',
    SUPPRESSED: 'Consciousness suppressed', DORMANT: 'Consciousness dormant', DISCONNECTED: 'Consciousness disconnected',
    death: 'Death', corpse: 'Corpse located', soul: 'Soul / consciousness', clone: 'Clone or Nen copy',
    impersonated: 'Identity impersonated', disguised: 'Disguised presence', absent: 'Position unknown', debut: 'First located',
    appears: 'Located in chapter', pictured: 'Position depicted'
  };

  const kindLabels: Record<string, string> = {
    'body-location': 'Body movement',
    'body-state': 'Body state',
    'consciousness-state': 'Consciousness state',
    'consciousness-location': 'Consciousness location',
    appearance: 'Reported presence'
  };

  const humanize = (value: string) => labels[value] || value.toLowerCase().replaceAll('_', ' ');
</script>

<svelte:head>
  <title>{displayName} — Role & movement</title>
  <meta name="description" content={`Ship role and chapter-by-chapter movement record for ${displayName}.`} />
</svelte:head>

<div class="dossier-page">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/characters">Passenger registry</a><span>/</span><strong>{displayName}</strong></nav>

  <header class="dossier-hero">
    <div class="identity-plate" aria-hidden="true">
      <span class="scan-line"></span><strong>{initials}</strong><small>SUBJECT / {(character.slug || character.id).toUpperCase()}</small>
    </div>

    <div class="hero-copy">
      <p class="eyebrow">Ship role · Movement record</p>
      <h1>{displayName}</h1>
      {#if character.aliases?.length}<p class="aliases">Also known as · {character.aliases.map(toEnglishAlias).join(' / ')}</p>{/if}
      <div class="primary-role">
        <span>Role aboard</span>
        <strong>{character.shipLocation?.role || 'No confirmed role'}</strong>
      </div>
      <div class="hero-links"><a href={`/ship?perspective=${character.id}`}>Locate on ship <span>⌖</span></a></div>
    </div>

    <dl class="record-stats">
      <div><dt>First record</dt><dd>{character.firstVisibleChapter ? `CH. ${character.firstVisibleChapter}` : 'Unknown'}</dd></div>
      <div><dt>Latest position</dt><dd>{currentLocation}</dd></div>
      <div><dt>Reported status</dt><dd>{character.shipLocation?.status || 'Unconfirmed'}</dd></div>
      <div><dt>Latest transition</dt><dd>{latestState ? humanize(latestState.label) : 'None recorded'}</dd></div>
    </dl>
  </header>

  <div class="dossier-layout">
    <aside class="dossier-index">
      <p>File index</p>
      <nav aria-label="Dossier sections">
        <a href="#role"><span>01</span>Role aboard</a>
        {#if character.identity}<a href="#identity"><span>02</span>Identity continuity</a>{/if}
        {#if character.biography?.length}<a href="#biography"><span>{character.identity ? '03' : '02'}</span>Biography</a>{/if}
        {#if character.nen || character.abilities?.length}<a href="#nen"><span>{character.identity ? '04' : '03'}</span>Nen & abilities</a>{/if}
        <a href="#appearances"><span>{character.identity ? '05' : '04'}</span>Manga appearances</a>
        <a href="#trajectory"><span>{character.identity ? '06' : '05'}</span>Chapter trajectory</a>
      </nav>
      <div class="scope-note"><span>Scope</span><p>Only operational role, body location, consciousness location and continuity states are retained.</p></div>
    </aside>

    <main class="dossier-content">
      <section id="role" class="dossier-section role-section reveal-on-scroll">
        <header><p class="section-code">OPERATIONAL POSITION</p><h2>Role aboard</h2></header>
        <div class="role-grid">
          <article><span>Current function</span><strong>{character.shipLocation?.role || 'Unknown'}</strong></article>
          <article><span>Current / last-known area</span><strong>{currentLocation}</strong><small>{character.shipLocation?.status || 'Status unconfirmed'}</small></article>
          {#if character.factionId}<article><span>Catalogue affiliation</span><strong>{character.factionId.replaceAll('-', ' ')}</strong></article>{/if}
        </div>

        {#if roleHistory.length || affiliations.length}
          <div class="role-history">
            {#each roleHistory as role}
              <article><small>CH. {role.chapter}{role.untilChapter ? `–${role.untilChapter}` : '+'}</small><strong>{role.label}</strong>{#if role.detail}<p>{role.detail}</p>{/if}</article>
            {/each}
            {#each affiliations as affiliation}
              <article><small>CH. {affiliation.chapter}{affiliation.untilChapter ? `–${affiliation.untilChapter}` : '+'} · {affiliation.status}</small><strong>{affiliation.name}</strong><p>{humanize(affiliation.role)}</p></article>
            {/each}
          </div>
        {/if}
      </section>

      {#if character.identity}
        <section id="identity" class="identity-alert dossier-section reveal-on-scroll">
          <div class="section-code">IDENTITY / CONTINUITY</div>
          <div><p>{character.identity.status}</p><h2>Body and identity differ</h2><span>{character.identity.description}</span></div>
          <a href={`/characters/${character.identity.counterpartId}`}>Related record<br /><strong>{character.identity.counterpartLabel} ↗</strong></a>
        </section>
      {/if}

      {#if character.biography?.length}
        <section id="biography" class="dossier-section reveal-on-scroll">
          <header><p class="section-code">CHARACTER RECORD</p><h2>Biography</h2></header>
          <div class="prose-record">{#each character.biography as paragraph}<p>{paragraph}</p>{/each}</div>
          {#if character.abilitiesAndPowers}<div class="capability-summary"><small>ABILITIES & POWERS</small><p>{character.abilitiesAndPowers}</p></div>{/if}
          {#if character.equipment?.length}<div class="equipment-grid">{#each character.equipment as item}<article><strong>{item.name}</strong><p>{item.description}</p></article>{/each}</div>{/if}
        </section>
      {/if}

      {#if character.nen || character.abilities?.length}
        <section id="nen" class="dossier-section reveal-on-scroll">
          <header><p class="section-code">AURA PROFILE</p><h2>Nen & abilities</h2></header>
          {#if character.nen}
            <div class="nen-profile">
              <article><small>PRIMARY TYPE</small><strong>{character.nen.typeLabel || character.nen.type}</strong>{#if character.nen.secondaryTypeLabels?.length}<span>{character.nen.secondaryTypeLabels.join(' · ')}</span>{/if}</article>
              <div><p>{character.nen.overview}</p>{#if character.nen.combatProficiency}<p>{character.nen.combatProficiency}</p>{/if}</div>
            </div>
            {#if character.nen.techniques?.length}<div class="technique-list">{#each character.nen.techniques as technique}<span>{technique}</span>{/each}</div>{/if}
          {/if}
          {#if character.abilities?.length}
            <div class="ability-grid">{#each character.abilities as ability}<article><small>{ability.category}{ability.secondaryCategories?.length ? ` · ${ability.secondaryCategories.join(' · ')}` : ''}</small><h3>{ability.name}</h3>{#if ability.alternateNames?.length}<span>{ability.alternateNames.join(' / ')}</span>{/if}<p>{ability.description}</p></article>{/each}</div>
          {/if}
        </section>
      {/if}

      <section id="appearances" class="dossier-section reveal-on-scroll">
        <header><p class="section-code">SOURCE INDEX</p><h2>Manga appearances</h2></header>
        {#if documentedAppearances.length}
          <div class="appearance-grid">{#each documentedAppearances as appearance}<article><strong>{appearance.chapter}</strong><div><span>{appearance.title}</span><small>{humanize(appearance.status)}</small></div></article>{/each}</div>
        {:else}<div class="empty"><strong>No individual appearance record documented.</strong><p>Hunterpedia does not provide a dedicated Succession Contest appearance template for this character.</p></div>{/if}
        {#if character.battles?.length || character.competitions?.length}
          <div class="encounter-grid">
            {#if character.battles?.length}<article><small>BATTLES</small>{#each character.battles as battle}<p>{typeof battle === 'string' ? battle : battle.label || battle.name}</p>{/each}</article>{/if}
            {#if character.competitions?.length}<article><small>COMPETITIONS</small>{#each character.competitions as competition}<p>{typeof competition === 'string' ? competition : competition.label || competition.name}</p>{/each}</article>{/if}
          </div>
        {/if}
      </section>

      <section id="trajectory" class="dossier-section reveal-on-scroll">
        <header><p class="section-code">BODY · CONSCIOUSNESS · SPECIAL SPACE</p><h2>Chapter trajectory</h2></header>
        <p class="trajectory-intro">The body and consciousness are tracked independently. “Unknown” is kept as a meaningful position; transfers, death, copies, dimensional passages and possible exits from the ship remain explicit.</p>

        {#if chapterTrajectory.length}
          <ol class="trajectory">
            {#each chapterTrajectory as chapter}
              <li class:multi-location={chapter.visits.length > 1}>
                <div class="chapter"><span>CH.</span><strong>{chapter.chapter}</strong><small>{chapter.visits.length > 1 ? `${chapter.visits.length} POSITIONS` : '1 POSITION'}</small></div>
                <span class="event-dot"></span>
                <article>
                  <small>{chapter.isMovement ? 'ROUTE WITHIN CHAPTER' : chapter.visits.length > 1 ? 'BODY / CONSCIOUSNESS POSITIONS' : 'POSITION IN CHAPTER'}</small>
                  <ol class="visits">
                    {#each chapter.visits as visit, index}
                      <li class:unknown={visit.location === 'Position inconnue'} class:consciousness={visit.subject === 'consciousness'}>
                        <span class="visit-order">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <h3>⌖ {visit.location}</h3>
                          <small>{visit.subject}{visit.certainty ? ` · ${humanize(visit.certainty)}` : ''}</small>
                          {#if visit.detail}<p>{visit.detail}</p>{/if}
                        </div>
                      </li>
                    {/each}
                  </ol>
                  {#if chapter.events.some((entry: any) => entry.kind !== 'body-location' && entry.kind !== 'consciousness-location')}
                    <div class="chapter-states">
                      {#each chapter.events.filter((entry: any) => entry.kind !== 'body-location' && entry.kind !== 'consciousness-location') as entry}
                        <span>{kindLabels[entry.kind]} · {humanize(entry.label)}</span>
                      {/each}
                    </div>
                  {/if}
                </article>
              </li>
            {/each}
          </ol>
        {:else}
          <div class="empty"><strong>No chapter transition recorded.</strong><p>Current or last-known position: {currentLocation}.</p></div>
        {/if}
      </section>
    </main>
  </div>
</div>

<style>
  :global(html){scroll-behavior:smooth}.dossier-page{min-height:100vh;padding:1.25rem var(--page-gutter) 8rem}.breadcrumb{display:flex;max-width:var(--container-wide);margin:0 auto 1.5rem;gap:.55rem;color:var(--text-faint);font:.54rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.breadcrumb a{color:var(--accent-gold);text-decoration:none}.breadcrumb strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dossier-hero{display:grid;max-width:var(--container-wide);margin:0 auto 4rem;grid-template-columns:minmax(13rem,.36fr) 1fr minmax(13rem,.34fr);gap:clamp(1.5rem,4vw,4rem);align-items:center}.identity-plate{position:relative;display:grid;aspect-ratio:4/5;place-items:center;overflow:hidden;border:1px solid var(--line-default);background:radial-gradient(circle at 50% 30%,rgba(112,189,193,.16),transparent 35%),linear-gradient(145deg,#17262d,#090e12)}.identity-plate::before,.identity-plate::after{position:absolute;content:''}.identity-plate::before{inset:10%;border:1px solid rgba(200,169,86,.18);border-radius:50% 50% 42% 42%}.identity-plate::after{right:10%;bottom:10%;left:10%;height:1px;background:var(--line-default)}.identity-plate strong{color:rgba(226,201,121,.76);font:500 clamp(3rem,7vw,6.5rem)/1 var(--font-display);letter-spacing:-.04em}.identity-plate small{position:absolute;right:.7rem;bottom:.7rem;left:.7rem;color:var(--text-faint);font:.43rem/1 var(--font-mono);letter-spacing:.08em;text-align:center}.scan-line{position:absolute;z-index:2;top:18%;right:8%;left:8%;height:1px;background:linear-gradient(90deg,transparent,var(--accent-cyan),transparent);box-shadow:0 0 12px rgba(112,189,193,.5);animation:scan 4s ease-in-out infinite alternate}
  h1{margin:.65rem 0 .4rem;font-size:clamp(3.5rem,7vw,7rem);font-weight:500;letter-spacing:-.055em;line-height:.8;text-transform:uppercase}.aliases{color:var(--accent-gold);font:.57rem/1.5 var(--font-mono);letter-spacing:.05em;text-transform:uppercase}.primary-role{display:grid;gap:.35rem;margin-top:1.7rem;padding-left:1rem;border-left:2px solid var(--accent-gold)}.primary-role span{color:var(--text-faint);font:.5rem/1 var(--font-mono);text-transform:uppercase}.primary-role strong{font:500 1.25rem/1.25 var(--font-display)}.hero-links{display:flex;margin-top:1.5rem}.hero-links a{display:flex;align-items:center;gap:1rem;padding:.62rem .75rem;border:1px solid var(--line-default);border-radius:.35rem;color:var(--text-secondary);font-size:.6rem;text-decoration:none;text-transform:uppercase}.hero-links a:hover{color:var(--accent-gold-bright)}.hero-links span{color:var(--accent-gold)}
  .record-stats{margin:0;border-top:1px solid var(--line-default)}.record-stats div{padding:1rem 0;border-bottom:1px solid var(--line-subtle)}.record-stats dt{color:var(--text-faint);font:.5rem/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase}.record-stats dd{margin:.35rem 0 0;color:var(--text-primary);font:500 1rem/1.25 var(--font-display);text-transform:capitalize}
  .dossier-layout{display:grid;max-width:var(--container-wide);margin:auto;grid-template-columns:13rem minmax(0,1fr);gap:clamp(2rem,5vw,6rem)}.dossier-index{position:sticky;top:calc(var(--header-height) + 2rem);height:fit-content}.dossier-index>p,.section-code{color:var(--accent-gold);font:.5rem/1 var(--font-mono);letter-spacing:.13em;text-transform:uppercase}.dossier-index nav{display:grid;margin-top:.8rem}.dossier-index nav a{display:grid;grid-template-columns:1.8rem 1fr;padding:.72rem 0;border-bottom:1px solid var(--line-subtle);color:var(--text-muted);font-size:.67rem;text-decoration:none}.dossier-index nav a:hover{padding-left:.35rem;color:var(--text-primary)}.dossier-index nav span{color:var(--text-faint);font:.48rem/1 var(--font-mono)}.scope-note{margin-top:2rem;padding:1rem;border:1px solid var(--line-subtle);border-radius:.45rem;background:rgba(12,20,25,.65)}.scope-note span{color:var(--accent-cyan);font:.48rem/1 var(--font-mono);text-transform:uppercase}.scope-note p{margin:.65rem 0 0;color:var(--text-muted);font-size:.62rem;line-height:1.55}
  .dossier-content{min-width:0}.dossier-section{scroll-margin-top:calc(var(--header-height) + 2rem);padding:clamp(2rem,4vw,3.5rem) 0;border-top:1px solid var(--line-default)}.dossier-section>header h2{margin:.45rem 0 0;font-size:clamp(2rem,4vw,3.2rem);line-height:.95}.role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:2rem;background:var(--line-subtle);border:1px solid var(--line-subtle)}.role-grid article{display:grid;gap:.55rem;padding:1.2rem;background:var(--surface-deep)}.role-grid span,.role-grid small{color:var(--text-faint);font:.48rem/1.3 var(--font-mono);text-transform:uppercase}.role-grid strong{font-size:.82rem;text-transform:capitalize}.role-history{display:grid;gap:.5rem;margin-top:1rem}.role-history article{display:grid;grid-template-columns:7rem 1fr 2fr;gap:1rem;padding:1rem;border:1px solid var(--line-subtle)}.role-history small{color:var(--accent-gold);font:.48rem/1 var(--font-mono)}.role-history strong{font-size:.72rem}.role-history p{margin:0;color:var(--text-muted);font-size:.62rem;line-height:1.5}
  .identity-alert{display:grid;grid-template-columns:10rem 1fr auto;gap:1.5rem;align-items:center;margin-bottom:1rem;padding:1.5rem;border:1px solid rgba(213,163,67,.35);border-radius:.55rem;background:linear-gradient(100deg,rgba(102,64,18,.24),rgba(17,23,25,.7))}.identity-alert>div p{margin:0;color:#e8b85f;font:.55rem/1 var(--font-mono);text-transform:uppercase}.identity-alert h2{margin:.35rem 0;color:#f0e5c4;font-size:1.5rem}.identity-alert>div span{color:#b9aa89;font-size:.72rem;line-height:1.55}.identity-alert a{padding-left:1.5rem;border-left:1px solid rgba(213,163,67,.25);color:#9b8e74;font-size:.55rem;text-decoration:none;text-transform:uppercase}.identity-alert a strong{display:block;margin-top:.35rem;color:#e4c06d;font-size:.68rem}
  .trajectory-intro{max-width:48rem;margin:1.2rem 0 0;color:var(--text-secondary);font-size:.72rem;line-height:1.65}.trajectory{display:grid;margin:2rem 0 0;padding:0;list-style:none}.trajectory>li{display:grid;grid-template-columns:4rem 1rem 1fr;gap:1rem;min-height:7rem}.chapter{display:grid;height:min-content;text-align:right}.chapter span,.chapter small{color:var(--text-faint);font:.43rem/1 var(--font-mono)}.chapter strong{color:var(--text-primary);font:500 1.25rem/1.2 var(--font-display)}.event-dot{position:relative;width:.6rem;height:.6rem;margin-top:.25rem;border:2px solid var(--surface-void);border-radius:50%;background:var(--state-known);box-shadow:0 0 0 1px var(--state-known)}.event-dot::after{position:absolute;top:.65rem;left:50%;width:1px;height:calc(100% + 6.5rem);background:var(--line-default);content:''}.trajectory>li.multi-location .event-dot{background:var(--accent-gold);box-shadow:0 0 0 1px var(--accent-gold)}.trajectory>li>article{padding:0 0 1.5rem;border-bottom:1px solid var(--line-subtle)}.trajectory>li>article>small{color:var(--accent-cyan);font:.48rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.visits{display:grid;gap:.5rem;margin:1rem 0 0;padding:0;list-style:none}.visits>li{display:grid;grid-template-columns:2rem 1fr;gap:.8rem;padding:.9rem;border:1px solid var(--line-subtle);border-left:2px solid var(--state-known);border-radius:.35rem;background:rgba(12,19,24,.6)}.visits>li.consciousness{border-left-color:var(--state-transferred)}.visits>li.unknown{border-left-color:var(--state-unknown);opacity:.72}.visit-order{color:var(--accent-gold);font:.5rem/1 var(--font-mono)}.visits h3{margin:0;color:var(--text-primary);font-size:1rem;line-height:1.35;text-transform:none}.visits small{display:block;margin-top:.35rem;color:var(--text-faint);font:.45rem/1 var(--font-mono);text-transform:uppercase}.visits p{max-width:50rem;margin:.55rem 0 0;color:var(--text-muted);font-size:.63rem;line-height:1.55}.chapter-states{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.8rem}.chapter-states span{padding:.35rem .5rem;border:1px solid var(--line-subtle);border-radius:999px;color:var(--text-secondary);font:.46rem/1 var(--font-mono);text-transform:uppercase}.empty{margin-top:2rem;padding:1.5rem;border:1px dashed var(--line-default);color:var(--text-secondary)}.empty p{margin:.5rem 0 0;color:var(--text-muted);font-size:.68rem}
  .prose-record{max-width:52rem;margin-top:1.5rem}.prose-record p,.capability-summary p,.nen-profile p,.ability-grid p,.equipment-grid p,.encounter-grid p{color:var(--text-secondary);font-size:.72rem;line-height:1.72}.capability-summary{margin-top:1.8rem;padding:1.2rem;border-left:2px solid var(--accent-cyan);background:rgba(112,189,193,.05)}.capability-summary small,.nen-profile small,.ability-grid small,.encounter-grid small{color:var(--accent-cyan);font:.48rem/1 var(--font-mono);letter-spacing:.08em}.capability-summary p{margin:.6rem 0 0}.equipment-grid,.ability-grid,.encounter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:1.2rem}.equipment-grid article,.ability-grid article,.encounter-grid article{padding:1rem;border:1px solid var(--line-subtle);background:rgba(12,20,25,.45)}.equipment-grid p,.ability-grid p,.encounter-grid p{margin:.55rem 0 0}.nen-profile{display:grid;grid-template-columns:minmax(11rem,.3fr) 1fr;gap:1.5rem;margin-top:1.5rem}.nen-profile>article{display:grid;align-content:start;gap:.55rem;padding:1.2rem;border:1px solid var(--line-default)}.nen-profile strong{color:var(--accent-gold);font:500 1.4rem/1 var(--font-display);text-transform:uppercase}.nen-profile span,.ability-grid span{color:var(--text-faint);font-size:.58rem}.nen-profile p{margin:0 0 .8rem}.technique-list{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:1rem}.technique-list span{padding:.38rem .55rem;border:1px solid var(--line-default);border-radius:999px;color:var(--text-secondary);font:.5rem/1 var(--font-mono)}.ability-grid h3{margin:.45rem 0;font-size:1.2rem}.appearance-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:1.5rem;background:var(--line-subtle);border:1px solid var(--line-subtle)}.appearance-grid article{display:grid;grid-template-columns:3rem 1fr;gap:.7rem;padding:.75rem;background:var(--surface-deep)}.appearance-grid strong{color:var(--accent-gold);font:500 1rem/1 var(--font-display)}.appearance-grid div{display:grid;gap:.3rem}.appearance-grid span{font-size:.62rem}.appearance-grid small{color:var(--text-faint);font:.45rem/1 var(--font-mono);text-transform:uppercase}
  @keyframes scan{to{top:78%}}@media(max-width:1000px){.dossier-hero{grid-template-columns:12rem 1fr}.record-stats{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr)}.record-stats div{padding:1rem;border-right:1px solid var(--line-subtle)}.dossier-layout{grid-template-columns:1fr}.dossier-index{position:static}.dossier-index nav{display:flex;overflow-x:auto}.dossier-index nav a{min-width:max-content;padding:.7rem 1rem}.scope-note{display:none}}
  @media(max-width:700px){.dossier-page{padding-inline:1rem}.dossier-hero{grid-template-columns:1fr}.identity-plate{width:11rem}.record-stats{grid-template-columns:repeat(2,1fr)}.identity-alert{grid-template-columns:1fr}.identity-alert>.section-code{display:none}.identity-alert a{padding:1rem 0 0;border-top:1px solid rgba(213,163,67,.25);border-left:0}.role-grid,.equipment-grid,.ability-grid,.encounter-grid,.appearance-grid,.nen-profile{grid-template-columns:1fr}.role-history article{grid-template-columns:1fr}.dossier-index{margin-inline:-1rem;padding-inline:1rem}.trajectory>li{grid-template-columns:3rem .8rem 1fr;gap:.65rem}}
  @media(prefers-reduced-motion:reduce){.scan-line{animation:none}}
</style>
