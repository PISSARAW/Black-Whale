<script lang="ts">
  import {
    DEPARTURE_DATE,
    DEPARTURE_TIME,
    LATEST_RECORDED_DAY,
    TERRITORIAL_WATERS_DAYS,
    VOYAGE_DURATION_DAYS,
  } from '$lib/voyageTime'
  import { t } from '$lib/i18n'

  let { compact = false }: { compact?: boolean } = $props()

  const progress = (LATEST_RECORDED_DAY / VOYAGE_DURATION_DAYS) * 100
  const watersMarker = (TERRITORIAL_WATERS_DAYS / VOYAGE_DURATION_DAYS) * 100
  const remainingDays = VOYAGE_DURATION_DAYS - LATEST_RECORDED_DAY
</script>

<section class:compact class="voyage-progress" aria-label={$t.voyage.label}>
  <header>
    <div>
      <p>{$t.voyage.shipTime}</p>
      <strong>{$t.voyage.day(LATEST_RECORDED_DAY)}</strong>
    </div>
    <div class="remaining">
      <span>{remainingDays}</span>
      <small>{$t.voyage.daysRemaining}</small>
    </div>
  </header>

  <!-- A bare <div> has the `generic` role, which cannot carry an accessible
       name; the track is a progress indicator, so say that outright. -->
  <div
    class="route"
    role="progressbar"
    aria-label={$t.voyage.progressLabel}
    aria-valuemin={0}
    aria-valuemax={VOYAGE_DURATION_DAYS}
    aria-valuenow={LATEST_RECORDED_DAY}
    aria-valuetext={$t.voyage.valueText(LATEST_RECORDED_DAY, VOYAGE_DURATION_DAYS)}
  >
    <div class="track"><span class="elapsed" style:width={`${progress}%`}></span></div>
    <span class="ship" style:left={`${progress}%`} aria-hidden="true">◆</span>
    <span class="checkpoint" style:left={`${watersMarker}%`} aria-hidden="true"></span>
  </div>

  <div class="labels">
    <span title="{DEPARTURE_DATE}, {DEPARTURE_TIME}"><b>01</b> {$t.voyage.departure}</span>
    <span class="waters" style:left={`${watersMarker}%`}><b>21</b> {$t.voyage.finalCheck}</span>
    <span><b>56</b> {$t.voyage.newContinent}</span>
  </div>

  {#if !compact}
    <footer>
      <span><i></i> {$t.voyage.territorialWaters}</span>
      <span>{$t.voyage.waterSplit}</span>
    </footer>
  {/if}
</section>

<style>
  .voyage-progress {
    position: relative;
    padding: 1.15rem 1.25rem 1rem;
    overflow: hidden;
    border: 1px solid rgba(135, 160, 163, 0.22);
    border-radius: 0.7rem;
    background: linear-gradient(115deg, rgba(13, 25, 31, 0.96), rgba(8, 15, 20, 0.92));
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.2);
  }
  header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
  }
  header p,
  footer,
  .labels,
  .remaining small {
    font-family: var(--font-mono);
    text-transform: uppercase;
  }
  header p {
    margin: 0 0 0.28rem;
    color: var(--text-muted);
    font-size: 0.52rem;
    letter-spacing: 0.12em;
  }
  header strong {
    color: var(--text-primary);
    font: 500 1.65rem/1 var(--font-display);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .remaining {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    color: var(--accent-gold-bright);
  }
  .remaining span {
    font: 500 1.45rem/1 var(--font-display);
  }
  .remaining small {
    color: var(--text-muted);
    font-size: 0.48rem;
    letter-spacing: 0.09em;
  }
  .route {
    position: relative;
    height: 1rem;
    margin-top: 1.05rem;
  }
  .track {
    position: absolute;
    top: 0.42rem;
    right: 0;
    left: 0;
    height: 2px;
    background: rgba(142, 164, 166, 0.18);
  }
  .elapsed {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-gold));
    box-shadow: 0 0 12px rgba(112, 189, 193, 0.35);
  }
  .ship {
    position: absolute;
    top: 0.08rem;
    color: var(--accent-gold-bright);
    font-size: 0.62rem;
    filter: drop-shadow(0 0 6px rgba(226, 201, 121, 0.5));
    transform: translateX(-50%);
  }
  .checkpoint {
    position: absolute;
    top: 0.21rem;
    width: 1px;
    height: 0.48rem;
    background: var(--text-muted);
  }
  .labels {
    display: flex;
    position: relative;
    justify-content: space-between;
    color: var(--text-faint);
    font-size: 0.46rem;
    letter-spacing: 0.07em;
  }
  .labels span {
    display: grid;
    gap: 0.15rem;
  }
  .labels b {
    color: var(--text-secondary);
    font-size: 0.52rem;
  }
  .labels .waters {
    position: absolute;
    transform: translateX(-50%);
    text-align: center;
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line-subtle);
    color: var(--text-muted);
    font-size: 0.46rem;
    letter-spacing: 0.08em;
  }
  footer i {
    display: inline-block;
    width: 0.35rem;
    height: 0.35rem;
    margin-right: 0.35rem;
    border-radius: 50%;
    background: var(--state-known);
    box-shadow: 0 0 7px var(--state-known);
  }
  .compact {
    min-width: min(100%, 31rem);
    padding: 0.9rem 1rem 0.8rem;
  }
  .compact header strong {
    font-size: 1.35rem;
  }
  .compact .route {
    margin-top: 0.75rem;
  }
  @media (max-width: 520px) {
    .remaining small {
      display: none;
    }
    .labels {
      font-size: 0.4rem;
    }
    footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
