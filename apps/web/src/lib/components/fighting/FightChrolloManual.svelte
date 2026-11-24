<script lang="ts">
  import { finisherHint, useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  export let language: 'fr' | 'en'
  $: p1Finisher = finisherHint($bindings, 'player')
  $: p2Finisher = finisherHint($bindings, 'opponent')
</script>

<div class="book-manual">
  <strong>Bandit’s Secret / Double Face</strong>
  {#if language === 'fr'}
    <p>
      {$bindings.playerSpecial} utilise la page ouverte, ou la page au signet si le livre est fermé. Avant
      + {$bindings.playerSpecial} vole un Hatsu vu en action par un contact net.
    </p>
    <p>
      Arrière + {$bindings.playerSpecial} ouvre la page suivante. Bas + {$bindings.playerSpecial} place
      le signet sur la page et ferme le livre ; répéter rouvre le livre. Sur une page déjà au signet,
      bas + {$bindings.playerSpecial} retire le signet.
    </p>
    <p>
      {p1Finisher} utilise la page au signet. Sun and Moon : {$bindings.playerSpecial} pose le Soleil
      à gauche ; {p1Finisher} pose le Soleil si le livre est ouvert, la Lune à droite s’il est fermé.
      Les deux contacts sur la même cible déclenchent l’explosion.
    </p>
    <p>
      Exemple : Soleil avec {$bindings.playerSpecial} → bas + {$bindings.playerSpecial} pour fermer →
      {p1Finisher} pour la Lune. Pour combiner deux pouvoirs : bas + {$bindings.playerSpecial}, puis
      arrière + {$bindings.playerSpecial}. Changer une page sans signet coupe ses effets ; les
      marques Soleil/Lune persistent.
    </p>
    <small
      >Arsenal du duel contre Hisoka : Sun and Moon et Black Voice. Black Voice plante une antenne
      et ordonne le recul. Les directions sont relatives à l’adversaire ; P2 utilise {$bindings.opponentSpecial}
      et {p2Finisher} à la place de {$bindings.playerSpecial} et {p1Finisher}.</small
    >
  {:else}
    <p>
      {$bindings.playerSpecial} uses the open page, or the bookmarked page while the book is closed. Forward
      + {$bindings.playerSpecial} steals a witnessed Hatsu with a clean contact.
    </p>
    <p>
      Back + {$bindings.playerSpecial} opens the next page. Down + {$bindings.playerSpecial} bookmarks
      the page and closes the book; repeat to reopen. Down + {$bindings.playerSpecial} on an already bookmarked
      open page removes the bookmark.
    </p>
    <p>
      {p1Finisher} uses the bookmarked page. Sun and Moon: {$bindings.playerSpecial} stamps the Sun with
      the left hand; {p1Finisher} stamps Sun while the book is open, or Moon with the right hand while
      closed. Both contacts on the same target trigger the explosion.
    </p>
    <p>
      Example: Sun with {$bindings.playerSpecial} → down + {$bindings.playerSpecial} to close → {p1Finisher}
      for Moon. To combine abilities: down + {$bindings.playerSpecial}, then back + {$bindings.playerSpecial}.
      Turning an unbookmarked page ends its effects; Sun/Moon marks persist.
    </p>
    <small
      >Hisoka duel loadout: Sun and Moon and Black Voice. Black Voice plants an antenna and orders a
      retreat. Directions are relative to the opponent; P2 uses {$bindings.opponentSpecial} and {p2Finisher}
      instead of {$bindings.playerSpecial} and {p1Finisher}.</small
    >
  {/if}
</div>

<style>
  .book-manual {
    margin: 0.8rem 0;
    border-left: 2px solid #f07791;
    padding: 0.2rem 0.7rem;
    background: #171a24;
  }
  strong {
    color: #f1d36d;
  }
  p {
    margin: 0.4rem 0;
  }
  small {
    color: #a8bac5;
  }
</style>
