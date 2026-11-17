<script lang="ts">
  import type { FightState } from '../../src/lib/fighting/types'
  export let state: FightState
  $: pain = state.player.hatsuEffects.painPacker
  $: future = state.parallelFuture
  $: charge = pain?.sun
    ? Math.round((pain.sun.radius - 12) / 0.25)
    : pain?.packedDamage || pain?.injuries || 0
</script>

<div class="powers">
  <div class="pain">
    <small>FEITAN · PAIN PACKER</small><strong
      >{pain?.sun ? 'RISING SUN' : pain?.armour ? 'DOULEUR ENGAGÉE' : 'DOULEUR ACCUMULÉE'}
      <b>{Math.round(charge)} / 100</b></strong
    >
    <div class="bar"><i style={`width:${charge}%`}></i></div>
    {#if pain?.sun}<em>CHALEUR · {((pain.sun.duration - pain.sun.age) / 60).toFixed(1)} s</em>{/if}
  </div>
  {#if future}<div class="future">
      <small>TSERRIEDNICH · LAPLACE DEVIL</small><strong
        >{future.phase === 'preparing'
          ? 'ZETSU · YEUX FERMÉS'
          : future.phase === 'vision'
            ? 'VISION DES 10 PROCHAINES SECONDES'
            : 'DIVERGENCE · CORPS RÉEL'}</strong
      >
      {#if future.phase === 'diverging'}<div class="bar">
          <i style={`width:${(1 - future.cursor / 600) * 100}%`}></i>
        </div>
        <em>{((600 - future.cursor) / 60).toFixed(1)} s · L’ADVERSAIRE PERÇOIT LA PRÉDICTION</em
        >{/if}
      {#if future.frames.length}<em
          >SI IMMOBILE : {future.frames.at(-1)!.opponent.health === 0
            ? 'K.-O. PRÉDIT'
            : 'DANGER PRÉDIT'} · VUE SPECTATEUR</em
        >{/if}
    </div>{/if}
</div>

<style>
  .powers {
    position: absolute;
    left: 56px;
    right: 56px;
    bottom: 60px;
    display: flex;
    justify-content: space-between;
    gap: 40px;
    pointer-events: none;
    font-family: sans-serif;
  }
  .pain,
  .future {
    width: 430px;
    padding: 16px 20px;
    background: #090d15e8;
    border-left: 3px solid #ff8439;
    color: #ffc696;
  }
  .future {
    color: #9ce7ef;
    border-color: #6bdfe8;
    width: 500px;
  }
  small {
    display: block;
    font-size: 12px;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  strong {
    font-size: 16px;
    letter-spacing: 1px;
    display: flex;
    justify-content: space-between;
  }
  b {
    color: white;
  }
  .bar {
    height: 5px;
    background: #ffffff20;
    margin-top: 12px;
  }
  i {
    display: block;
    height: 100%;
    background: currentColor;
  }
  em {
    display: block;
    font-style: normal;
    font-size: 12px;
    margin-top: 9px;
    letter-spacing: 1px;
  }
</style>
