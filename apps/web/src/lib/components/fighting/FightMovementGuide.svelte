<script lang="ts">
  import type { FighterId } from '$lib/fighting/types'

  export let fighterId: FighterId
  export let language: 'fr' | 'en'

  const LOW_SLIDE_NOTE: [string, string] = [
    'Glissade basse : maintiens Bas + double appui Avant pour passer sous les coups hauts.',
    'Low slide: hold Down + double-tap Forward to slip under high strikes.',
  ]

  const CHARACTER_NOTES: Partial<Record<FighterId, [string, string]>> = {
    feitan: [
      'Glissade basse (Bas + double Avant) & Frein rapide (dès la 4e frame de dash).',
      'Low slide (Down + double Forward) & Quick brake (from dash frame 4).',
    ],
    machi: [
      'Glissade basse (Bas + double Avant) & Traction sur fil vers une cible déjà marquée.',
      'Low slide (Down + double Forward) & Thread pull-in toward a marked target.',
    ],
    phinks: LOW_SLIDE_NOTE,
    hanzo: LOW_SLIDE_NOTE,
    kalluto: LOW_SLIDE_NOTE,
    illumi: LOW_SLIDE_NOTE,
    chrollo: [
      'Mains libres (Double Face) : fermer le livre augmente la vitesse de marche et de dash de 8 %.',
      'Free hands (Double Face): closing the book boosts walk and dash speed by 8%.',
    ],
    saiyu: [
      'Appui de bâton : sauter vers l’avant avec le bâton augmente hauteur et portée.',
      'Staff vault: jumping forward with the staff boosts height and horizontal carry.',
    ],
    bonolenov: [
      'Pas tournoyant : pendant Prologue actif, tes dashs deviennent des pas chassés plus vifs.',
      'Prologue spin step: while Prologue is active, dashes accelerate into nimble spinning steps.',
    ],
    hisoka: [
      'Rebond mural élastique : dos au coin avec la prothèse de jambe, Appui élastique te propulse hors du coin.',
      'Elastic wall rebound: with your back to the corner and the rubber leg formed, Elastic Spring launches you out.',
    ],
    biscuit: [
      'Pas d’ancrage (Vraie forme) : sous ta forme naturelle au sol, le recul en garde est réduit de 25 %.',
      'Grounded step (True Form): in your natural form on the ground, guard pushback is reduced by 25%.',
    ],
  }

  $: entry = CHARACTER_NOTES[fighterId]
  $: characterNote = entry ? entry[language === 'fr' ? 0 : 1] : null
</script>

<aside class="movement-guide" aria-label={language === 'fr' ? 'Déplacements avancés' : 'Advanced movement'}>
  <h3>{language === 'fr' ? 'Déplacements avancés' : 'Advanced movement'}</h3>
  <p>
    <strong>{language === 'fr' ? 'Saut court / Super saut / Saut en course' : 'Short hop / Super jump / Dash jump'}</strong> ·
    {language === 'fr'
      ? 'relâche Haut pendant le pré-saut pour un saut court ; Bas puis Haut rapide pour un Super saut (+20 %) ; Haut pendant un dash avant pour conserver l’élan.'
      : 'release Up during pre-jump for a short hop; quick Down then Up for a Super jump (+20%); Up during a forward dash to carry momentum.'}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Course & Frein de dash' : 'Run & Dash brake'}</strong> ·
    {language === 'fr'
      ? 'maintiens Avant à la fin d’un dash pour courir (×1,25) ; Arrière, Bas ou Garde après la poussée stoppe net le dash.'
      : 'hold Forward at the end of a dash to keep running (×1.25); Back, Down or Guard after the push stops cleanly.'}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Rebond mural (profils agiles)' : 'Wall jump (agile styles)'}</strong> ·
    {language === 'fr'
      ? 'en l’air contre un mur, Direction opposée + Haut permet un rebond unique par saut.'
      : 'airborne against a wall, Opposite direction + Up kicks off once per jump.'}
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
      ? 'Ryu/Gyo aux pieds (≥ 70 %) renforce dash et saut ; Ko aux pieds + Bas en l’air accélère la chute ; En réflexe accélère décollage et backdash ; Zetsu retarde la lecture IA hors En ; avancer après garde/parade reprend le terrain.'
      : 'Ryu/Gyo in the feet (≥ 70%) boosts dash and jump; Ko in the feet + Down mid-air fast-drops; En reflex speeds up takeoff and backdash; Zetsu delays AI reaction outside En; stepping forward after guard/parry closes distance.'}
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
