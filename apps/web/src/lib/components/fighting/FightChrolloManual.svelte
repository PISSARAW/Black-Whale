<script lang="ts">
  export let language: 'fr' | 'en'
</script>

<div class="book-manual">
  <strong>Bandit’s Secret / Double Face</strong>
  {#if language === 'fr'}
    <p>
      L utilise la page ouverte, ou la page au signet si le livre est fermé. Avant + L vole un Hatsu
      vu en action par un contact net.
    </p>
    <p>
      Arrière + L ouvre la page suivante. Bas + L place le signet sur la page et ferme le livre ;
      répéter rouvre le livre. Sur une page déjà au signet, bas + L retire le signet.
    </p>
    <p>
      H utilise la page au signet. Sun and Moon : L pose le Soleil à gauche ; H pose le Soleil si le
      livre est ouvert, la Lune à droite s’il est fermé. Les deux contacts sur la même cible
      déclenchent l’explosion.
    </p>
    <p>
      Exemple : Soleil avec L → bas + L pour fermer → H pour la Lune. Pour combiner deux pouvoirs :
      bas + L, puis arrière + L. Changer une page sans signet coupe ses effets ; les marques
      Soleil/Lune persistent.
    </p>
    <small
      >Arsenal du duel contre Hisoka : Sun and Moon et Black Voice. Black Voice plante une antenne
      et ordonne le recul. Les directions sont relatives à l’adversaire ; P2 utilise , et B à la
      place de L et H.</small
    >
  {:else}
    <p>
      L uses the open page, or the bookmarked page while the book is closed. Forward + L steals a
      witnessed Hatsu with a clean contact.
    </p>
    <p>
      Back + L opens the next page. Down + L bookmarks the page and closes the book; repeat to
      reopen. Down + L on an already bookmarked open page removes the bookmark.
    </p>
    <p>
      H uses the bookmarked page. Sun and Moon: L stamps the Sun with the left hand; H stamps Sun
      while the book is open, or Moon with the right hand while closed. Both contacts on the same
      target trigger the explosion.
    </p>
    <p>
      Example: Sun with L → down + L to close → H for Moon. To combine abilities: down + L, then
      back + L. Turning an unbookmarked page ends its effects; Sun/Moon marks persist.
    </p>
    <small
      >Hisoka duel loadout: Sun and Moon and Black Voice. Black Voice plants an antenna and orders a
      retreat. Directions are relative to the opponent; P2 uses , and B instead of L and H.</small
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
