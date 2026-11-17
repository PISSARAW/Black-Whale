<script lang="ts">
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
</script>

<details class="nen-arsenal">
  <summary
    >{fr
      ? 'Shu · Ko · Ken · Ryu : combiner et répondre'
      : 'Shu · Ko · Ken · Ryu: combine and counter'}</summary
  >
  <p>
    <b>Shu</b> — {fr
      ? 'Renforce une arme équipée, aide une garde déjà réussie et engage l’aura sur un objet lancé. L’objet reste réel et visible sous In ; son enveloppe peut être cachée. Shu + Ko dans les mains concentre davantage la puissance de l’arme. Aucun renforcement gratuit des balles ordinaires.'
      : 'Reinforce equipped weapons, help an already successful guard and commit aura to thrown objects. The object remains real and visible under In; its envelope can be hidden. Shu + hand Ko concentrates more power in the weapon. Ordinary bullets gain no free aura enhancement.'}
  </p>
  <p>
    <b>Ko</b> — {fr
      ? 'Offensif : prépare un lourd avec Aura puis relâche avant le contact. Défensif : Aura + Garde + Gyo + une zone. Le choix défensif coûte 20 à l’engagement, pas à chaque frame. Toute l’aura protège cette zone ; ailleurs, aucune protection d’aura. Une feinte ou une autre cible peut te punir.'
      : 'Offense: prepare a heavy with Aura, then release before contact. Defense: Aura + Guard + Gyo + a zone. Defensive focus costs 20 on commitment, not every frame. Aura protects that zone; other zones have none. A feint or another target can punish you.'}
  </p>
  <p>
    <b>Ken</b> — {fr
      ? 'Maintiens Aura + Garde pour une protection uniforme du corps, y compris quand tu ne peux pas tout anticiper. Ken réduit les dégâts sans supprimer la puissance adverse, les projections ni l’épuisement. Il ne donne pas automatiquement un mini-En à tous les personnages.'
      : 'Hold Aura + Guard for uniform body protection when you cannot predict every threat. Ken reduces damage without canceling enemy power, throws or exhaustion. It does not automatically grant mini-En to every fighter.'}
  </p>
  <p>
    <b>Ryu</b> — {fr
      ? 'Change la zone renforcée avec les commandes de zone, avant une frappe ou une défense. Lis la répartition adverse avec Gyo, feinte, puis frappe une zone peu protégée. Aura + Gyo + zone maintient Ryu et la lecture oculaire ensemble, avec un drain accru. Ryu ne bloque pas à ta place ; ses transferts peuvent être lus par l’adversaire.'
      : 'Switch reinforced zones before striking or defending. Read enemy allocation with Gyo, feint, then strike a thin zone. Aura + Gyo + a zone maintains Ryu and ocular reading together, with higher drain. Ryu does not block for you; opponents can read its transfers.'}
  </p>
  <p>
    <b>Xbox</b> — {fr
      ? 'RB + croix : Gyo ciblé ; LB + croix : Ryu ; LB + RB + croix : Ko défensif. ↑/↓/←/→ = tête/torse/mains/jambes. Ajoute View + croix gauche pour Shu + Ko des mains. Les attaques restent sur leurs boutons ordinaires.'
      : 'RB + D-pad: bodily Gyo; LB + D-pad: Ryu; LB + RB + D-pad: defensive Ko. ↑/↓/←/→ = head/torso/hands/legs. Add View + D-pad left for Shu + hand Ko. Attacks retain their ordinary buttons.'}
  </p>
  <small
    >{fr
      ? 'Tous les chiffres sont des réglages de combat. Les objets, conditions de Hatsu et formations connues restent nécessaires.'
      : 'All numerical values are combat tuning. Real equipment, Hatsu conditions and documented training remain necessary.'}</small
  >
</details>

<style>
  .nen-arsenal {
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
