<script lang="ts">
  import { onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import { listCases } from '$lib/investigation/catalog'
  import {
    INVESTIGATION_PORTFOLIO_KEY,
    freshPortfolio,
    parsePortfolio,
    type InvestigationPortfolio,
  } from '$lib/investigation/portfolio'

  const cases = $derived(listCases($locale))
  let portfolio = $state<InvestigationPortfolio>(freshPortfolio())

  const copy = $derived(
    $locale === 'fr'
      ? {
          eyebrow: 'Black Whale · Bureau des Hunters',
          title: 'Salle des affaires',
          intro: 'Choisissez un dossier, reprenez une enquête ou consultez une affaire résolue.',
          chapter: 'Chapitre requis',
          duration: 'Durée estimée',
          investigator: 'Enquêteur',
          difficulty: 'Difficulté',
          available: 'Disponible',
          inProgress: 'En cours',
          solved: 'Résolu',
          open: 'Ouvrir le dossier',
          resume: 'Reprendre',
        }
      : {
          eyebrow: 'Black Whale · Hunter Office',
          title: 'Case room',
          intro: 'Choose a case, resume an investigation, or review a solved file.',
          chapter: 'Required chapter',
          duration: 'Estimated time',
          investigator: 'Investigator',
          difficulty: 'Difficulty',
          available: 'Available',
          inProgress: 'In progress',
          solved: 'Solved',
          open: 'Open case',
          resume: 'Resume',
        },
  )

  onMount(() => {
    portfolio = parsePortfolio(localStorage.getItem(INVESTIGATION_PORTFOLIO_KEY))
  })

  function statusFor(caseId: string) {
    return portfolio.cases[caseId]?.status ?? 'available'
  }
</script>

<svelte:head>
  <title>{copy.title} · Black Whale</title>
  <meta name="description" content={copy.intro} />
</svelte:head>

<main class="archive-page">
  <header class="mb-8">
    <h1>{copy.title}</h1>
    <p>{copy.intro}</p>
  </header>
  <section class="case-grid" aria-label={copy.title}>
    {#each cases as investigationCase (investigationCase.slug)}
      {@const status = statusFor(investigationCase.slug)}
      <article>
        <div class="case-heading">
          <p>{investigationCase.location}</p>
          <span class:solved={status === 'solved'}
            >{status === 'solved'
              ? copy.solved
              : status === 'in-progress'
                ? copy.inProgress
                : copy.available}</span
          >
        </div>
        <h2>{investigationCase.title}</h2>
        <p class="teaser">{investigationCase.teaser}</p>
        <dl>
          <div>
            <dt>{copy.investigator}</dt>
            <dd>{investigationCase.investigator}</dd>
          </div>
          <div>
            <dt>{copy.chapter}</dt>
            <dd>{investigationCase.requiredChapter}</dd>
          </div>
          <div>
            <dt>{copy.duration}</dt>
            <dd>~{investigationCase.estimatedMinutes} min</dd>
          </div>
          <div>
            <dt>{copy.difficulty}</dt>
            <dd>
              {investigationCase.difficulty === 'advanced'
                ? 3
                : investigationCase.difficulty === 'intermediate'
                  ? 2
                  : 1} / 3
            </dd>
          </div>
        </dl>
        <a href={$link(`/investigation/${investigationCase.slug}`)}
          >{status === 'in-progress' ? copy.resume : copy.open} <span aria-hidden="true">→</span></a
        >
      </article>
    {/each}
  </section>
</main>

<style>
  .case-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 3rem;
  }
  article {
    min-width: 0;
    padding: 1.5rem 0;
    border-top: 1px solid var(--line-default);
  }
  .case-heading {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .case-heading p {
    margin: 0;
  }
  .solved {
    color: var(--state-known);
  }
  h2 {
    margin: 0.75rem 0;
    font: 500 1.2rem/1.5 var(--font-sans);
  }
  .teaser {
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.75;
  }
  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin: 1.25rem 0;
  }
  dt {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  dd {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
  }
  article > a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 1rem;
    color: var(--accent-gold-bright);
    font-size: 0.8rem;
    text-decoration: none;
  }
  @media (max-width: 700px) {
    .case-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
