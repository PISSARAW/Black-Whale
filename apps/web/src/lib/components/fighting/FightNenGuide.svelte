<script lang="ts">
  import FightNenArsenal from './FightNenArsenal.svelte'
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
</script>

<details class="nen-guide">
  <summary>{fr ? 'En · In · Gyo : usages au combat' : 'En · In · Gyo: combat uses'}</summary>
  <p>
    <b>En</b> — {fr
      ? 'Perçois les contours et le mouvement à portée, retrouve un corps en Zetsu ou sans la vue, repère un projectile accessible et prépare ta garde manuelle. Hinrigh peut conserver son champ en attaquant ; Phinks perd sa concentration au mouvement ou à une voix entendue.'
      : 'Sense contours and motion in range, locate a body in Zetsu or without sight, notice accessible projectiles and time your manual guard. Hinrigh may keep the field while attacking; movement or audible speech disrupts Phinks.'}
  </p>
  <p>
    <b>In</b> — {fr
      ? 'Cache l’aura, sa répartition, un lien ou un projectile de Nen dissimulable. En seul ne révèle pas cette aura. Le corps, les armes et les projectiles réels restent perceptibles. Les pièges déjà émis gardent leur dissimulation ; Gyo oculaire les révèle.'
      : 'Hide aura, its allocation, and concealable Nen tethers or projectiles. En alone does not reveal this aura. Bodies, weapons and real projectiles remain perceptible. Released traps retain concealment; ocular Gyo reveals them.'}
  </p>
  <p>
    <b>Gyo</b> — {fr
      ? 'Révèle In et observe les zones fortes ou peu protégées de l’aura adverse pour choisir ton coup. Maintiens Gyo + une zone pour y concentrer 70 % de ton aura, avec 10 % ailleurs : ce Gyo corporel remplace la vision oculaire, sans ajouter un nouveau Hatsu.'
      : 'Reveal In and read strong or thin aura zones to choose your strike. Hold Gyo + a zone to focus 70% of your aura there, with 10% elsewhere: this bodily Gyo replaces ocular vision without granting a new Hatsu.'}
  </p>
  <p>
    <b>{fr ? 'Commandes' : 'Controls'}</b> — {fr
      ? 'Clavier par défaut : V + J/K/L/I pour En/In/Shu/Gyo ; V + U/O/M/N pour tête/torse/mains/jambes. Sur tactile, maintiens Gyo et une zone ensemble.'
      : 'Default keys: V + J/K/L/I for En/In/Shu/Gyo; V + U/O/M/N for head/torso/hands/legs. On touch, hold Gyo and a zone together.'}
  </p>
  <p>
    <b>Xbox</b> — {fr
      ? 'Maintiens View puis croix ↑/↓/←/→ : En/In/Shu/Gyo. R3 + croix ↑/↓/←/→ cible tête/torse/mains/jambes. View + stick droit ↓ donne Zetsu, ↑ engage un Seiyaku. View + A/B/X/Y donne parole/interaction/oreilles/plaies.'
      : 'Hold View, then D-pad ↑/↓/←/→ for En/In/Shu/Gyo. R3 + D-pad ↑/↓/←/→ targets head/torso/hands/legs. View + right stick ↓ gives Zetsu, ↑ commits to a Seiyaku. View + A/B/X/Y selects speech/interaction/ears/wounds.'}
  </p>
  <small
    >{fr
      ? 'Portées, pourcentages et coûts : réglages arcade. Aucun bonus de garde ou d’esquive automatique ; l’observation ne révèle pas les conditions d’un Hatsu.'
      : 'Ranges, percentages and costs are arcade tuning. No automatic guard or dodge; observation does not reveal Hatsu conditions.'}</small
  >
  <p>
    <b>Gyo faible</b> — {fr
      ? 'Gyo + Bas sans Aura (Xbox : R3 + stick gauche bas) observe les couches d’aura apparentes à coût réduit, sans révéler In ni la répartition fine. Le Gyo oculaire normal utilise Ren.'
      : 'Gyo + Down without Aura (Xbox: R3 + left stick down) observes visible aura layers at lower cost, without revealing In or fine allocation. Regular ocular Gyo uses Ren.'}
  </p>
  <FightNenArsenal {language} />
</details>

<style>
  .nen-guide {
    flex-basis: 100%;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #c5dce6;
    overflow-wrap: anywhere;
  }
  summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  p {
    margin: 0.4rem 0;
  }
  small {
    color: #aabcc6;
  }
</style>
