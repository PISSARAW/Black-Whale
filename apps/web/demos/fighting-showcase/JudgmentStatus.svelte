<script lang="ts">
  import type { FightState } from '../../src/lib/fighting/types'
  export let state: FightState
  $: cage = state.opponent.crossGame
  $: nen = state.opponent.nen
  $: focus = Object.entries(nen.ryu).find(([, share]) => share >= 76)?.[0]
  $: focusName = (
    { head: 'TÊTE', torso: 'TORSE', hands: 'MAINS', feet: 'PIEDS' } as Record<string, string>
  )[focus ?? '']
</script>

<div class="powers">
  {#if cage}<div class="cross">
      <small>MIZAISTOM · CROSS GAME</small><strong
        >{cage.phase === 'warning'
          ? 'CARTON JAUNE · NE BOUGEZ PLUS'
          : 'PRISON · DÉSOBÉISSANCE'}</strong
      ><span
        >{cage.phase === 'restrained'
          ? `${(state.opponent.hatsuEffects.restrainedFrames / 60).toFixed(1)} s · CONTRAINTE PHYSIQUE`
          : 'Un nouveau déplacement ou une attaque retourne le carton.'}</span
      >
    </div>{/if}
  {#if state.player.nen.on}<div class="oath">
      <small>MIZAISTOM · ON</small><strong>FRAPPES PHYSIQUES</strong>
      <div class="bar"><i style={`width:${state.player.on?.grudge ?? 0}%`}></i></div>
    </div>{/if}
  <div class="biscuit" class:on={state.opponent.nen.on}>
    <small>BISCUIT · {state.opponent.biscuitTrueForm ? 'CORPS NATUREL' : 'FORME COMPACTE'}</small
    ><strong
      >{nen.on
        ? 'ON · PUISSANCE LIBÉRÉE'
        : focus
          ? `RYU · ${focusName} 76 %`
          : nen.ken
            ? 'KEN · AURA RASSEMBLÉE'
            : nen.mode === 'ren'
              ? 'REN · PRESSION ACTIVE'
              : 'TEN · AURA STABLE'}</strong
    >{#if state.opponent.nen.on}<div class="bar">
        <i style={`width:${state.opponent.on?.grudge ?? 0}%`}></i>
      </div>{/if}
  </div>
</div>

<style>
  .powers {
    position: absolute;
    left: 56px;
    right: 56px;
    bottom: 60px;
    display: flex;
    gap: 22px;
    pointer-events: none;
    font-family: sans-serif;
  }
  .powers > div {
    padding: 16px 20px;
    background: #080d15e8;
    border-left: 3px solid #eed17d;
    color: #eed17d;
    min-width: 350px;
  }
  .biscuit {
    margin-left: auto;
    border-color: #f9a1cb !important;
    color: #f9bfdc !important;
  }
  .oath,
  .on {
    border-color: #bd72ea !important;
    color: #d9aff6 !important;
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
  }
  span {
    display: block;
    margin-top: 8px;
    font-size: 12px;
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
</style>
