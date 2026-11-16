<script lang="ts">
  import { onMount } from 'svelte'
  import { createGamepadDiagnostics, xboxButtonLabel } from '$lib/fighting/gamepadDiagnostics'
  import { trainingInputLabel } from '$lib/fighting/trainingLabels'
  export let language: 'fr' | 'en'
  const capture = createGamepadDiagnostics()
  let report = capture.report()
  export let running = false
  let unavailable = false
  let connection = 'unknown'
  $: if (!running) report = capture.report()
  const ms = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)} ms`)
  function download() {
    const payload = {
      ...capture.report(),
      connection,
      recordedAt: new Date().toISOString(),
      browser: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      devicePixelRatio: window.devicePixelRatio,
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'clash-gamepad-diagnostic.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  onMount(() => {
    let frame = 0,
      lastDisplay = 0
    const poll = (now: number) => {
      if (running && !document.hidden) {
        try {
          capture.observe(navigator.getGamepads(), now)
        } catch {
          unavailable = true
          running = false
        }
        if (now - lastDisplay > 100) {
          report = capture.report()
          lastDisplay = now
        }
      }
      frame = requestAnimationFrame(poll)
    }
    frame = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(frame)
  })
</script>

<div class="gamepad-inspector" data-inspecting={running}>
  <h3>{language === 'fr' ? 'Vérifier ma manette' : 'Check my gamepad'}</h3>
  <p>
    {language === 'fr'
      ? 'Démarre le diagnostic, appuie puis relâche chaque bouton et déplace le stick dans les quatre directions. Le combat ne reçoit pas ces essais pendant la mesure.'
      : 'Start the diagnostic, press and release each button, then move the stick in four directions. These tests do not reach combat while recording.'}
  </p>
  <p>
    {language === 'fr'
      ? 'La mesure porte sur la lecture par le navigateur. Elle ne mesure pas le délai physique manette-écran. Le rapport reste local ; aucune donnée de combat n’est enregistrée.'
      : 'This measures browser polling, not physical controller-to-screen latency. The report stays local and contains no combat data.'}
  </p>
  <div class="actions">
    <label
      >{language === 'fr' ? 'Connexion de la manette' : 'Controller connection'}
      <select bind:value={connection}>
        <option value="unknown">{language === 'fr' ? 'Non précisée' : 'Unspecified'}</option>
        <option value="usb">USB</option><option value="bluetooth">Bluetooth</option>
      </select>
    </label>
    <button
      type="button"
      aria-pressed={running}
      onclick={() => {
        if (!running) {
          capture.reset()
          report = capture.report()
          unavailable = false
        }
        running = !running
        if (!running) report = capture.report()
      }}
      >{running
        ? language === 'fr'
          ? 'Arrêter la mesure'
          : 'Stop recording'
        : language === 'fr'
          ? 'Démarrer la mesure'
          : 'Start recording'}</button
    >
    <button type="button" disabled={!report.polls || running} onclick={download}
      >{language === 'fr' ? 'Exporter le rapport' : 'Export report'}</button
    >
  </div>
  {#if unavailable}<p role="status">
      {language === 'fr'
        ? 'Lecture des manettes indisponible dans ce navigateur.'
        : 'Gamepad reading is unavailable in this browser.'}
    </p>{/if}
  {#if report.polls}
    <p>
      {report.polls}
      {language === 'fr' ? 'lectures' : 'polls'} · p95 {ms(report.interval.p95)} · max {ms(
        report.interval.max,
      )}
    </p>
    {#each report.pads as pad (pad.index)}
      <p>
        <strong>{pad.id}</strong> · {pad.mapping === 'standard'
          ? 'Standard'
          : language === 'fr'
            ? 'Disposition non prise en charge'
            : 'Unsupported mapping'}
      </p>
      <p>
        {language === 'fr' ? 'Axes' : 'Axes'} : {pad.axes
          .map((value) => value.toFixed(2))
          .join(' / ')} · {language === 'fr' ? 'Boutons Xbox' : 'Xbox buttons'} : {pad.buttons
          .map(xboxButtonLabel)
          .join(', ') || '—'}
      </p>
      <p>
        {language === 'fr' ? 'Commandes tenues' : 'Held commands'} : {trainingInputLabel(
          pad.held.join(' + '),
          language,
        ) || '—'}
      </p>
      <p>LT / RT : {pad.triggers.map((value) => value.toFixed(2)).join(' / ')}</p>
    {:else}<p role="status">
        {language === 'fr'
          ? 'Aucune manette détectée : appuie sur un bouton pour la rendre visible au navigateur.'
          : 'No gamepad detected: press a button to make it visible to the browser.'}
      </p>{/each}
    <ol>
      {#each report.events.slice(-8).reverse() as event (`${event.index}:${event.at}`)}<li>
          {event.index + 1} · {trainingInputLabel(event.actions.join(' + '), language)}
        </li>{/each}
    </ol>
  {/if}
</div>

<style>
  .gamepad-inspector {
    padding: 0.75rem;
    border: 1px solid #526878;
    line-height: 1.5;
  }
  h3 {
    font-size: 1rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button,
  select {
    min-height: 44px;
    padding: 0.5rem;
    background: #172732;
    border: 1px solid #647482;
    color: white;
    cursor: pointer;
  }
  label {
    display: grid;
    gap: 0.4rem;
    max-width: 100%;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  p {
    overflow-wrap: anywhere;
  }
</style>
