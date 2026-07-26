<script lang="ts">
  import type { PageData } from './$types';
  import { toEnglishAlias, toEnglishConflictLabel, toEnglishDisplayName } from '$lib/utils/displayNames';

  let { data }: { data: PageData } = $props();
  let character = $derived(data.character as any);
  let presences = $derived(data.presences || []);
  let states = $derived(data.states || []);
  let displayName = $derived(toEnglishDisplayName(character.canonicalName));

  const appearanceLabels: Record<string, string> = {
    debut: 'Debut', appears: 'Appears', mentioned: 'Mentioned', pictured: 'Pictured', death: 'Death',
    corpse: 'Corpse', flashback: 'Flashback', vision: 'Vision', voice: 'Voice', soul: 'Soul', clone: 'Clone',
    impersonated: 'Impersonated', disguised: 'Disguised', absent: 'Absent'
  };

  const appearanceClasses: Record<string, string> = {
    debut: 'debut', appears: 'known', mentioned: 'reported', pictured: 'reported', death: 'danger', corpse: 'danger',
    flashback: 'historical', vision: 'reported', voice: 'reported', soul: 'transfer', clone: 'transfer',
    impersonated: 'suspect', disguised: 'suspect', absent: 'muted'
  };

  let initials = $derived(displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join(''));
  let occurrenceCount = $derived(character.mangaAppearances?.filter((entry: any) => entry.status !== 'absent').length || 0);
  let sections = $derived([
    character.identity && { id: 'identity', label: 'Identity' },
    character.biography?.length && { id: 'biography', label: 'Biography' },
    (character.nen || character.abilitiesAndPowers) && { id: 'nen', label: 'Nen & abilities' },
    character.equipment?.length && { id: 'equipment', label: 'Equipment' },
    character.guardianSpiritBeast && { id: 'guardian', label: 'Guardian beast' },
    (presences.length || states.length) && { id: 'field-log', label: 'Field log' },
    (character.battles?.length || character.competitions?.length) && { id: 'conflicts', label: 'Conflicts' },
    character.mangaAppearances?.length && { id: 'appearances', label: 'Appearances' }
  ].filter(Boolean) as { id: string; label: string }[]);
</script>

<svelte:head>
  <title>{displayName} — Black Whale Dossier</title>
  <meta name="description" content={character.description || `Intelligence dossier for ${displayName}.`} />
</svelte:head>

<div class="dossier-page">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/characters">Passenger registry</a><span>/</span><strong>{displayName}</strong></nav>

  <header class="dossier-hero">
    <div class="identity-plate" aria-hidden="true">
      <span class="scan-line"></span><strong>{initials}</strong><small>SUBJECT / {(character.slug || character.id).toUpperCase()}</small>
    </div>

    <div class="hero-copy">
      <p class="eyebrow">Identity dossier · Canonical record</p>
      <h1>{displayName}</h1>
      {#if character.aliases?.length}<p class="aliases">Also known as · {character.aliases.map(toEnglishAlias).join(' / ')}</p>{/if}
      <p class="summary">{character.description || 'No public intelligence is currently available for this subject.'}</p>
      <div class="hero-links">
        <a href={`/perspectives/${character.id}`}>Subjective map <span>↗</span></a>
        <a href={`/knowledge/${character.id}`}>Knowledge profile <span>↗</span></a>
        <a href={`/ship?perspective=${character.id}`}>Locate on ship <span>⌖</span></a>
      </div>
    </div>

    <dl class="record-stats">
      <div><dt>First record</dt><dd>CH. {character.firstVisibleEvent?.chapter?.number ?? '—'}</dd></div>
      <div><dt>Appearances</dt><dd>{occurrenceCount}</dd></div>
      <div><dt>Nen profile</dt><dd>{character.nen?.typeLabel || 'Unknown'}</dd></div>
      <div><dt>Current status</dt><dd>{states.at(-1)?.state || 'Unconfirmed'}</dd></div>
    </dl>
  </header>

  <div class="dossier-layout">
    <aside class="dossier-index">
      <p>File index</p>
      <nav aria-label="Dossier sections">
        {#each sections as section, index}<a href={`#${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.label}</a>{/each}
      </nav>
      <div class="classification"><span>Archive status</span><strong><i></i> Active record</strong><small>Last synchronized · Ch. 414</small></div>
    </aside>

    <main class="dossier-content">
      {#if character.identity}
        <section id="identity" class="identity-alert dossier-section reveal-on-scroll">
          <div class="section-code">01 / IDENTITY ANOMALY</div>
          <div><p>{character.identity.status}</p><h2>Identity requires attention</h2><span>{character.identity.description}</span></div>
          <a href={`/characters/${character.identity.counterpartId}`}>Open counterpart<br /><strong>{character.identity.counterpartLabel} ↗</strong></a>
        </section>
      {/if}

      {#if character.biography?.length}
        <section id="biography" class="dossier-section biography reveal-on-scroll">
          <header><p class="section-code">BIOGRAPHY / VERIFIED NARRATIVE</p><h2>Recorded history</h2></header>
          <div class="biography-copy">{#each character.biography as paragraph, index}<p class:lead={index === 0}>{paragraph}</p>{/each}</div>
        </section>
      {/if}

      {#if character.nen || character.abilitiesAndPowers}
        <section id="nen" class="dossier-section reveal-on-scroll">
          <header class="section-heading"><div><p class="section-code">AURA ANALYSIS</p><h2>Nen & capabilities</h2></div>{#if character.nen}<span class="type-badge">{character.nen.typeLabel}{character.nen.secondaryTypeLabels?.length ? ` / ${character.nen.secondaryTypeLabels.join(' / ')}` : ''}</span>{/if}</header>
          <div class="nen-layout">
            <div class="nen-overview">
              <p>{character.nen?.overview || character.abilitiesAndPowers}</p>
              {#if character.nen?.waterDivination}<article><span>Water divination</span><p>{character.nen.waterDivination}</p></article>{/if}
              {#if character.nen?.combatProficiency}<p>{character.nen.combatProficiency}</p>{/if}
              {#if character.nen?.techniques?.length}<div class="techniques">{#each character.nen.techniques as technique}<span>{technique}</span>{/each}</div>{/if}
            </div>
            <div class="abilities">
              {#each character.abilities || [] as ability, index}
                <article><span class="ability-index">HATSU / {String(index + 1).padStart(2, '0')}</span><h3>{ability.name}</h3>{#if ability.alternateNames?.length}<small>{ability.alternateNames.join(' · ')}</small>{/if}{#if ability.inheritedFrom}<small>Inherited from {ability.inheritedFrom}</small>{/if}<p>{ability.description}</p></article>
              {/each}
              {#if !character.abilities?.length && character.abilitiesAndPowers}<article><span class="ability-index">CAPABILITY ASSESSMENT</span><p>{character.abilitiesAndPowers}</p></article>{/if}
            </div>
          </div>
        </section>
      {/if}

      {#if character.equipment?.length}
        <section id="equipment" class="dossier-section reveal-on-scroll">
          <header><p class="section-code">MATERIAL INVENTORY</p><h2>Equipment</h2></header>
          <div class="equipment-grid">{#each character.equipment as item, index}<article><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.name}</h3><p>{item.description}</p></article>{/each}</div>
        </section>
      {/if}

      {#if character.guardianSpiritBeast}
        <section id="guardian" class="dossier-section guardian reveal-on-scroll">
          <header class="section-heading"><div><p class="section-code">PARASITIC NEN ENTITY</p><h2>Guardian Spirit Beast</h2></div><span class="type-badge violet">{character.guardianSpiritBeast.type}</span></header>
          <p>{character.guardianSpiritBeast.description}</p>
          {#if character.guardianSpiritBeast.rules?.length}<ol>{#each character.guardianSpiritBeast.rules as rule, index}<li><span>{String(index + 1).padStart(2, '0')}</span>{rule}</li>{/each}</ol>{/if}
          {#if character.guardianSpiritBeast.ability}<blockquote>{character.guardianSpiritBeast.ability}</blockquote>{/if}
        </section>
      {/if}

      {#if presences.length || states.length}
        <section id="field-log" class="dossier-section reveal-on-scroll">
          <header><p class="section-code">TEMPORAL INTELLIGENCE</p><h2>Field log</h2></header>
          <div class="field-grid">
            <div><h3>Movement history <span>{presences.length}</span></h3>{#if presences.length}<ol class="event-log">{#each presences as presence}<li><span class="event-dot known"></span><div><small>CH. {presence.fromEvent.chapter.number} · SEQ. {presence.fromEvent.sequence}</small><strong>{presence.location?.name || 'Unknown position'}</strong><p>{presence.certainty}{presence.untilEvent ? ` · Until Ch. ${presence.untilEvent.chapter.number}` : ''}</p></div></li>{/each}</ol>{:else}<p class="empty">No known movements.</p>{/if}</div>
            <div><h3>Biological states <span>{states.length}</span></h3>{#if states.length}<ol class="event-log">{#each states as state}<li><span class="event-dot danger"></span><div><small>CH. {state.fromEvent.chapter.number}</small><strong>{state.state}</strong></div></li>{/each}</ol>{:else}<p class="empty">No specific state recorded.</p>{/if}</div>
          </div>
        </section>
      {/if}

      {#if character.battles?.length || character.competitions?.length}
        <section id="conflicts" class="dossier-section reveal-on-scroll">
          <header><p class="section-code">CONFLICT RECORD</p><h2>Engagements</h2></header>
          <div class="conflicts">
            {#each character.battles || [] as battle}<article><span>BATTLE</span><strong>{toEnglishConflictLabel(typeof battle === 'string' ? battle : battle.label || `${displayName} vs. ${(battle.opponents || []).join(', ')}`)}</strong>{#if typeof battle !== 'string' && battle.chapter}<small>Chapter {battle.chapter}</small>{/if}</article>{/each}
            {#each character.competitions || [] as competition}<article><span>COMPETITION</span><strong>{toEnglishConflictLabel(typeof competition === 'string' ? competition : competition.label)}</strong></article>{/each}
          </div>
        </section>
      {/if}

      {#if character.mangaAppearances?.length}
        <section id="appearances" class="dossier-section reveal-on-scroll">
          <header class="section-heading"><div><p class="section-code">SOURCE INDEX / CH. 340–414</p><h2>Manga appearances</h2></div><span class="occurrence-count">{occurrenceCount} occurrences</span></header>
          <div class="appearance-grid">{#each character.mangaAppearances as appearance}<article class={appearanceClasses[appearance.status]}><div><span>CH. {appearance.chapter}</span><small>{appearanceLabels[appearance.status]}</small></div><p title={appearance.title}>{appearance.title}</p></article>{/each}</div>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  :global(html){scroll-behavior:smooth}.dossier-page{min-height:100vh;padding:1.25rem var(--page-gutter) 8rem}.breadcrumb{display:flex;max-width:var(--container-wide);margin:0 auto 1.5rem;gap:.55rem;color:var(--text-faint);font:.54rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.breadcrumb a{color:var(--accent-gold);text-decoration:none}.breadcrumb strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dossier-hero{display:grid;max-width:var(--container-wide);margin:0 auto 4rem;grid-template-columns:minmax(13rem,.36fr) 1fr minmax(12rem,.32fr);gap:clamp(1.5rem,4vw,4rem);align-items:center}.identity-plate{position:relative;display:grid;aspect-ratio:4/5;place-items:center;overflow:hidden;border:1px solid var(--line-default);background:radial-gradient(circle at 50% 30%,rgba(112,189,193,.16),transparent 35%),linear-gradient(145deg,#17262d,#090e12)}.identity-plate::before,.identity-plate::after{position:absolute;content:''}.identity-plate::before{inset:10%;border:1px solid rgba(200,169,86,.18);border-radius:50% 50% 42% 42%}.identity-plate::after{right:10%;bottom:10%;left:10%;height:1px;background:var(--line-default)}.identity-plate strong{color:rgba(226,201,121,.76);font:500 clamp(3rem,7vw,6.5rem)/1 var(--font-display);letter-spacing:-.04em}.identity-plate small{position:absolute;right:.7rem;bottom:.7rem;left:.7rem;color:var(--text-faint);font:.43rem/1 var(--font-mono);letter-spacing:.08em;text-align:center}.scan-line{position:absolute;z-index:2;top:18%;right:8%;left:8%;height:1px;background:linear-gradient(90deg,transparent,var(--accent-cyan),transparent);box-shadow:0 0 12px rgba(112,189,193,.5);animation:scan 4s ease-in-out infinite alternate}
  h1{margin:.65rem 0 .4rem;font-size:clamp(3.5rem,7vw,7rem);font-weight:500;letter-spacing:-.055em;line-height:.8;text-transform:uppercase}.aliases{color:var(--accent-gold);font:.57rem/1.5 var(--font-mono);letter-spacing:.05em;text-transform:uppercase}.summary{max-width:48rem;margin:1.3rem 0 0;color:var(--text-secondary);font-size:.9rem;line-height:1.75}.hero-links{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:1.8rem}.hero-links a{display:flex;align-items:center;gap:1rem;padding:.62rem .75rem;border:1px solid var(--line-default);border-radius:.35rem;color:var(--text-secondary);font-size:.6rem;text-decoration:none;text-transform:uppercase}.hero-links a:hover{border-color:var(--line-strong);color:var(--accent-gold-bright)}.hero-links span{color:var(--accent-gold)}
  .record-stats{margin:0;border-top:1px solid var(--line-default)}.record-stats div{padding:1rem 0;border-bottom:1px solid var(--line-subtle)}.record-stats dt{color:var(--text-faint);font:.5rem/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase}.record-stats dd{margin:.35rem 0 0;color:var(--text-primary);font:500 1.1rem/1 var(--font-display);text-transform:capitalize}
  .dossier-layout{display:grid;max-width:var(--container-wide);margin:auto;grid-template-columns:13rem minmax(0,1fr);gap:clamp(2rem,5vw,6rem)}.dossier-index{position:sticky;top:calc(var(--header-height) + 2rem);height:fit-content}.dossier-index>p,.section-code{color:var(--accent-gold);font:.5rem/1 var(--font-mono);letter-spacing:.13em;text-transform:uppercase}.dossier-index nav{display:grid;margin-top:.8rem}.dossier-index nav a{display:grid;grid-template-columns:1.8rem 1fr;padding:.72rem 0;border-bottom:1px solid var(--line-subtle);color:var(--text-muted);font-size:.67rem;text-decoration:none}.dossier-index nav a:hover{padding-left:.35rem;color:var(--text-primary)}.dossier-index nav span{color:var(--text-faint);font:.48rem/1 var(--font-mono)}.classification{display:grid;gap:.45rem;margin-top:2rem;padding:1rem;border:1px solid var(--line-subtle);border-radius:.45rem;background:rgba(12,20,25,.65)}.classification>span,.classification small{color:var(--text-faint);font:.46rem/1.3 var(--font-mono);text-transform:uppercase}.classification strong{display:flex;align-items:center;gap:.4rem;color:var(--state-known);font-size:.62rem}.classification i{width:.35rem;height:.35rem;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor}
  .dossier-content{min-width:0}.dossier-section{scroll-margin-top:calc(var(--header-height) + 2rem);padding:clamp(2rem,4vw,3.5rem) 0;border-top:1px solid var(--line-default)}.dossier-section>header h2,.section-heading h2{margin:.45rem 0 0;font-size:clamp(2rem,4vw,3.2rem);line-height:.95}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:1rem}.identity-alert{display:grid;grid-template-columns:10rem 1fr auto;gap:1.5rem;align-items:center;margin-bottom:1rem;padding:1.5rem;border:1px solid rgba(213,163,67,.35);border-radius:.55rem;background:linear-gradient(100deg,rgba(102,64,18,.24),rgba(17,23,25,.7))}.identity-alert>div p{margin:0;color:#e8b85f;font:.55rem/1 var(--font-mono);text-transform:uppercase}.identity-alert h2{margin:.35rem 0;color:#f0e5c4;font-size:1.5rem}.identity-alert>div span{color:#b9aa89;font-size:.72rem;line-height:1.55}.identity-alert a{padding-left:1.5rem;border-left:1px solid rgba(213,163,67,.25);color:#9b8e74;font-size:.55rem;text-decoration:none;text-transform:uppercase}.identity-alert a strong{display:block;margin-top:.35rem;color:#e4c06d;font-size:.68rem}
  .biography-copy{max-width:54rem;margin-top:2rem}.biography-copy p{color:var(--text-secondary);font-size:.82rem;line-height:1.85}.biography-copy p.lead{color:var(--text-primary);font:400 clamp(1.2rem,2.2vw,1.65rem)/1.55 var(--font-display)}.nen-layout{display:grid;grid-template-columns:.75fr 1.25fr;gap:2.5rem;margin-top:2rem}.nen-overview>p{color:var(--text-secondary);font-size:.78rem;line-height:1.75}.nen-overview article{margin:1rem 0;padding:1rem;border-left:2px solid var(--accent-cyan);background:rgba(112,189,193,.06)}.nen-overview article span{color:var(--accent-cyan);font:.52rem/1 var(--font-mono);text-transform:uppercase}.techniques{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:1.2rem}.techniques span{padding:.35rem .5rem;border:1px solid var(--line-default);border-radius:.25rem;color:var(--text-secondary);font-size:.55rem}.type-badge,.occurrence-count{padding:.4rem .55rem;border:1px solid rgba(200,169,86,.35);border-radius:999px;color:var(--accent-gold-bright);font:.5rem/1 var(--font-mono);text-transform:uppercase}.type-badge.violet{border-color:rgba(175,129,211,.35);color:#cfa6eb}
  .abilities{display:grid;gap:.7rem}.abilities article{position:relative;overflow:hidden;padding:1.2rem;border:1px solid var(--line-default);border-radius:.5rem;background:linear-gradient(120deg,rgba(200,169,86,.08),rgba(12,19,24,.8))}.abilities article::after{position:absolute;top:-2rem;right:-2rem;width:6rem;height:6rem;border:1px solid rgba(200,169,86,.15);border-radius:50%;content:''}.ability-index{color:var(--accent-gold);font:.48rem/1 var(--font-mono);letter-spacing:.1em}.abilities h3{margin:.65rem 0 .2rem;font-size:1.45rem}.abilities small{display:block;color:var(--text-faint);font-size:.55rem}.abilities p{color:var(--text-secondary);font-size:.72rem;line-height:1.65}
  .equipment-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2rem;background:var(--line-subtle);border:1px solid var(--line-subtle)}.equipment-grid article{padding:1.2rem;background:var(--surface-deep)}.equipment-grid article>span{color:var(--text-faint);font:.48rem/1 var(--font-mono)}.equipment-grid h3{margin:1.5rem 0 .45rem;font-size:1.25rem}.equipment-grid p,.guardian>p{color:var(--text-secondary);font-size:.72rem;line-height:1.65}.guardian ol{display:grid;margin:1.5rem 0 0;padding:0;list-style:none}.guardian li{display:grid;grid-template-columns:2rem 1fr;gap:1rem;padding:.75rem 0;border-top:1px solid rgba(175,129,211,.18);color:#aaa0ae;font-size:.7rem}.guardian li span{color:#a775c8;font: .5rem/1 var(--font-mono)}.guardian blockquote{margin:1.5rem 0 0;padding:1.2rem;border-left:2px solid #a775c8;background:rgba(104,53,130,.1);color:#d6c0df;font-size:.76rem;line-height:1.7}
  .field-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:3rem;margin-top:2rem}.field-grid h3{display:flex;justify-content:space-between;padding-bottom:.7rem;border-bottom:1px solid var(--line-default);font-size:1.1rem}.field-grid h3 span{color:var(--text-faint);font:.55rem/1 var(--font-mono)}.event-log{display:grid;margin:0;padding:0;list-style:none}.event-log li{position:relative;display:grid;grid-template-columns:1rem 1fr;gap:.7rem;padding:1rem 0;border-bottom:1px solid var(--line-subtle)}.event-dot{width:.5rem;height:.5rem;margin-top:.2rem;border:2px solid var(--surface-void);border-radius:50%;background:var(--state-known);box-shadow:0 0 0 1px var(--state-known)}.event-dot.danger{background:var(--accent-alert);box-shadow:0 0 0 1px var(--accent-alert)}.event-log div{display:grid;gap:.25rem}.event-log small{color:var(--text-faint);font:.46rem/1 var(--font-mono)}.event-log strong{color:var(--text-primary);font-size:.72rem}.event-log p,.empty{margin:0;color:var(--text-muted);font-size:.6rem}
  .conflicts{display:grid;gap:1px;margin-top:2rem;background:var(--line-subtle)}.conflicts article{display:grid;grid-template-columns:6rem 1fr auto;gap:1rem;padding:1rem;background:var(--surface-deep)}.conflicts article>span{color:var(--accent-alert);font:.48rem/1 var(--font-mono)}.conflicts strong{font-size:.75rem}.conflicts small{color:var(--text-faint);font-size:.55rem}.appearance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;margin-top:2rem}.appearance-grid article{padding:.65rem;border:1px solid var(--line-subtle);border-left:2px solid var(--state-unknown);border-radius:.25rem;background:rgba(12,19,24,.7)}.appearance-grid article.known,.appearance-grid article.debut{border-left-color:var(--state-known)}.appearance-grid article.danger{border-left-color:var(--accent-alert)}.appearance-grid article.suspect{border-left-color:var(--state-suspected)}.appearance-grid article.transfer{border-left-color:var(--state-transferred)}.appearance-grid article.muted{opacity:.38}.appearance-grid article>div{display:flex;justify-content:space-between;gap:.5rem}.appearance-grid span,.appearance-grid small{font:.47rem/1 var(--font-mono);text-transform:uppercase}.appearance-grid span{color:var(--text-secondary)}.appearance-grid small{color:var(--text-faint)}.appearance-grid p{overflow:hidden;margin:.45rem 0 0;color:var(--text-muted);font-size:.57rem;text-overflow:ellipsis;white-space:nowrap}
  @keyframes scan{to{top:78%}}@media(max-width:1000px){.dossier-hero{grid-template-columns:12rem 1fr}.record-stats{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr)}.record-stats div{padding:1rem;border-right:1px solid var(--line-subtle)}.dossier-layout{grid-template-columns:1fr}.dossier-index{position:static}.dossier-index nav{display:flex;overflow-x:auto}.dossier-index nav a{min-width:max-content;padding:.7rem 1rem}.classification{display:none}}
  @media(max-width:700px){.dossier-page{padding-inline:1rem}.dossier-hero{grid-template-columns:1fr}.identity-plate{width:11rem}.record-stats{grid-template-columns:repeat(2,1fr)}.identity-alert{grid-template-columns:1fr}.identity-alert>.section-code{display:none}.identity-alert a{padding:1rem 0 0;border-top:1px solid rgba(213,163,67,.25);border-left:0}.nen-layout,.field-grid{grid-template-columns:1fr}.equipment-grid{grid-template-columns:1fr}.appearance-grid{grid-template-columns:repeat(2,1fr)}.conflicts article{grid-template-columns:1fr}.section-heading{align-items:start;flex-direction:column}.dossier-index{margin-inline:-1rem;padding-inline:1rem}}
  @media(prefers-reduced-motion:reduce){.scan-line{animation:none}}
</style>
