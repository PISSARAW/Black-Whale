<script lang="ts">
  import type { FighterId } from '$lib/fighting/types'

  export let fighterId: FighterId
  export let language: 'fr' | 'en'

  const ASSASSINS: ReadonlySet<FighterId> = new Set([
    'feitan',
    'hanzo',
    'machi',
    'kalluto',
    'illumi',
  ])

  $: characterNote = noteFor(fighterId, language)

  function noteFor(id: FighterId, lang: 'fr' | 'en'): string | null {
    const fr = lang === 'fr'
    if (id === 'phinks' || ASSASSINS.has(id)) {
      return fr
        ? 'Glissade basse : maintiens Bas + double appui Avant pour passer sous les coups hauts.'
        : 'Low slide: hold Down + double-tap Forward to slip under high strikes.'
    }
    if (id === 'bonolenov') {
      return fr
        ? 'Pas tournoyant : pendant Prologue actif, tes dashs deviennent des pas chassés plus vifs.'
        : 'Prologue spin step: while Prologue is active, dashes accelerate into nimble spinning steps.'
    }
    if (id === 'hisoka') {
      return fr
        ? 'Rebond mural élastique : dos au coin avec la prothèse de jambe, Appui élastique te propulse hors du coin.'
        : 'Elastic wall rebound: with your back to the corner and the rubber leg formed, Elastic Spring launches you out.'
    }
    if (id === 'biscuit') {
      return fr
        ? 'Pas d’ancrage (Vraie forme) : sous ta forme naturelle au sol, le recul en garde est réduit de 25 %.'
        : 'Grounded step (True Form): in your natural form on the ground, guard pushback is reduced by 25%.'
    }
    return null
  }
</script>

<aside class="movement-guide" aria-label={language === 'fr' ? 'Déplacements avancés' : 'Advanced movement'}>
  <h3>{language === 'fr' ? 'Déplacements avancés' : 'Advanced movement'}</h3>
  <p>
    <strong>{language === 'fr' ? 'Saut court' : 'Short hop'}</strong> ·
    {language === 'fr'
      ? 'relâche Haut pendant le pré-saut (3 frames) pour un arc plus bas et rapide.'
      : 'release Up during pre-jump (3 frames) for a lower, faster arc.'}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Frein de dash' : 'Dash brake'}</strong> ·
    {language === 'fr'
      ? 'appuie sur Arrière, Bas ou Garde après la poussée d’un dash avant pour t’arrêter net.'
      : 'press Back, Down or Guard after a forward dash push to stop cleanly.'}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Recul de buste (Back Sway)' : 'Back sway'}</strong> ·
    {language === 'fr'
      ? 'Arrière + Garde recule la garde haute pour faire manquer un coup haut (les jambes restent exposées).'
      : 'Back + Guard pulls your torso back to whiff-punish highs (legs remain exposed).'}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Relevée (Ukemi / Retardée)' : 'Wakeup (Ukemi / Delayed)'}</strong> ·
    {language === 'fr'
      ? 'Gauche/Droite + Garde à la relevée pour rouler ; maintiens Bas pour retarder une fois la relevée.'
      : 'Left/Right + Guard on wakeup to roll; hold Down to delay wakeup once.'}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Nen & appuis' : 'Nen footwork'}</strong> ·
    {language === 'fr'
      ? 'Ryu/Gyo dans les pieds (≥ 70 %) renforce dash avant et saut ; En réflexe accélère décollage et backdash ; avancer après garde/parade accélère la reprise de terrain.'
      : 'Ryu/Gyo in the feet (≥ 70%) boosts forward dash and jump; En reflex speeds up takeoff and backdash; stepping forward right after guard/parry closes distance faster.'}
  </p>
  {#if fighterId === 'kalluto'}
    <p>
      <strong>{language === 'fr' ? 'Courant de confettis' : 'Paper wind float'}</strong> ·
      {language === 'fr'
        ? 'hors Zetsu et avec de l’aura, ta chute est amortie de 30 %.'
        : 'outside Zetsu with aura available, your fall gravity is softened by 30%.'}
    </p>
  {/if}
  {#if characterNote}
    <p class="character-note">{characterNote}</p>
  {/if}
</aside>

<style>
  .movement-guide {
    margin: 0.75rem 0;
    padding: 0.6rem 0.75rem;
    border-left: 2px solid #8ea8d8;
  }
  h3 {
    margin: 0 0 0.35rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  p {
    margin: 0.2rem 0;
    font-size: 0.78rem;
  }
  .character-note {
    margin-top: 0.35rem;
    font-style: italic;
  }
</style>
