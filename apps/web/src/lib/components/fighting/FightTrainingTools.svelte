<script lang="ts">
  export let language: 'fr' | 'en'
  export let recording: boolean
  export let playing: boolean
  export let commandCount: number
  export let onRecord: () => void
  export let onPlay: () => void
</script>

<div class="training-tools">
  <strong>{language === 'fr' ? 'LABORATOIRE' : 'TRAINING LAB'}</strong>
  <button type="button" class:active={recording} onclick={onRecord}>
    {recording
      ? language === 'fr'
        ? 'Arrêter l’enregistrement'
        : 'Stop recording'
      : language === 'fr'
        ? 'Enregistrer le dummy'
        : 'Record dummy'}
  </button>
  <button type="button" disabled={commandCount === 0} onclick={onPlay}>
    {playing
      ? language === 'fr'
        ? 'Lecture…'
        : 'Playing…'
      : language === 'fr'
        ? `Lire (${commandCount} commandes)`
        : `Play (${commandCount} commands)`}
  </button>
  <span>HITBOX <i></i> · HURTBOX P1 <i></i> · HURTBOX P2 <i></i></span>
</div>
