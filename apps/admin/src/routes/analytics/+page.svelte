<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const names: Record<string, string> = {
    home: 'Accueil',
    ship: 'Ship',
    tour: 'Tour',
    fighting: 'Fighting',
    timeline: 'Timeline',
    'tour-morena': 'Morena',
    abilities: 'Archives Hatsu',
    characters: 'Personnages',
  }
  const label = (value: string) => names[value] ?? value
  const number = (value: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
</script>

<svelte:head><title>Fréquentation et usages — Black Whale</title></svelte:head>

<div class="analytics">
  <header>
    <div>
      <p class="eyebrow">BLACK WHALE · STATISTIQUES PRIVÉES</p>
      <h1>Fréquentation et usages</h1>
    </div>
    <nav aria-label="Période">
      <a href="?days=7" class:chosen={data.days === 7}>7 jours</a>
      <a href="?days=30" class:chosen={data.days === 30}>30 jours</a>
    </nav>
  </header>
  {#if data.dashboard}
    {@const dashboard = data.dashboard}
    <div class="cards">
      {#each [{ value: dashboard.stats.visitors, title: 'Visiteurs estimés' }, { value: dashboard.stats.visits, title: 'Visites' }, { value: dashboard.stats.pageviews, title: 'Pages vues' }, { value: dashboard.hatsuUses, title: 'Utilisations de Hatsu' }] as card (card.title)}
        <article><strong>{number(card.value)}</strong><span>{card.title}</span></article>
      {/each}
    </div>
    {#if dashboard.stats.pageviews === 0}
      <p class="notice">
        La collecte est active. Les premières visites apparaîtront ici après l’arrivée de visiteurs.
      </p>
    {/if}
    <section>
      <h2>Sections et modes</h2>
      <p>
        Compare les entrées, les premières interactions et le temps actif pour repérer ce qui
        retient les visiteurs.
      </p>
      <div class="table-wrap">
        <table>
          <thead
            ><tr
              ><th>Section</th><th>Entrées</th><th>Interactions</th><th>Parties lancées</th><th
                >Terminées</th
              ><th>Minutes actives</th></tr
            ></thead
          >
          <tbody
            >{#each dashboard.modes as mode (mode.mode)}<tr
                ><td>{label(mode.mode)}</td><td>{number(mode.entries)}</td><td
                  >{number(mode.interactions)}</td
                ><td>{number(mode.starts)}</td><td>{number(mode.completed)}</td><td
                  >{number(mode.activeMinutes)}</td
                ></tr
              >{:else}<tr><td colspan="6">Aucune donnée sur cette période.</td></tr>{/each}</tbody
          >
        </table>
      </div>
      <small
        >Parties lancées et terminées : Fighting et Morena. Le temps actif est compté par tranches
        de 30 secondes, dans un onglet visible, avec une interaction dans la dernière minute. Les
        dernières secondes ne sont pas comptées.</small
      >
    </section>
    <div class="columns">
      {#each [{ title: 'Hatsu utilisés par section', rows: dashboard.hatsu }, { title: 'Hatsu sélectionnés', rows: dashboard.selected }, { title: 'Modes de partie lancés', rows: dashboard.variants }, { title: 'Pages consultées', rows: dashboard.pages }, { title: 'Provenance', rows: dashboard.referrers }, { title: 'Appareils', rows: dashboard.devices }] as group (group.title)}
        <section>
          <h2>{group.title}</h2>
          <ol>
            {#each group.rows as row (row.x)}<li>
                <span>{row.x || 'Direct / inconnu'}</span><strong>{number(row.y)}</strong>
              </li>{:else}<li>Aucune donnée sur cette période.</li>{/each}
          </ol>
        </section>
      {/each}
    </div>
    <p class="footnote">
      Les tentatives de Hatsu dans Tour incluent leur résultat, même lorsqu’une cible ou une
      condition manque. Sur les pages et Ship, une utilisation correspond au retour d’une
      interaction ; sélectionner ou restaurer un Hatsu ne compte pas comme une utilisation. Les
      visiteurs sont estimés, les bloqueurs peuvent réduire la mesure.
    </p>
    <p class="footnote">
      Actualisé le {new Date(dashboard.updatedAt).toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
      })} · Recharge la page pour actualiser.
    </p>
  {:else}
    <p class="notice">
      {data.unavailable === 'not-configured'
        ? 'La collecte des statistiques n’est pas encore configurée.'
        : 'Les statistiques sont momentanément indisponibles. Réessaie dans quelques instants.'}
    </p>
  {/if}
</div>

<style>
  .analytics {
    max-width: 1250px;
    margin: auto;
    color: #18232d;
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .eyebrow {
    color: #596570;
    font-size: 11px;
    letter-spacing: 0.12em;
  }
  h1 {
    font-size: 30px;
    font-weight: 650;
  }
  h2 {
    font-size: 18px;
    font-weight: 650;
    margin-bottom: 12px;
  }
  nav {
    display: flex;
    gap: 8px;
  }
  nav a {
    padding: 9px 16px;
    border: 1px solid #cbd2d7;
    border-radius: 6px;
  }
  .chosen {
    background: #18232d;
    color: white;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  article,
  section {
    background: white;
    border: 1px solid #dfe4e8;
    border-radius: 10px;
    padding: 22px;
  }
  article strong {
    display: block;
    font-size: 34px;
  }
  article span {
    color: #596570;
    font-size: 14px;
  }
  section {
    margin-bottom: 20px;
  }
  section p,
  small,
  .footnote {
    color: #596570;
    font-size: 13px;
    line-height: 1.7;
  }
  small {
    display: block;
    margin-top: 14px;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-top: 15px;
  }
  th,
  td {
    text-align: right;
    padding: 12px 10px;
    border-bottom: 1px solid #e5e9ed;
    white-space: nowrap;
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  .columns section {
    margin: 0;
  }
  ol {
    list-style: none;
    padding: 0;
    max-height: 360px;
    overflow: auto;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 9px 0;
    border-bottom: 1px solid #edf0f2;
    font-size: 13px;
  }
  li span {
    overflow-wrap: anywhere;
  }
  .notice {
    padding: 18px;
    border: 1px solid #c7d6dd;
    background: #edf5f7;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .footnote {
    margin-top: 20px;
  }
</style>
