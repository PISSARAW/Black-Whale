<script lang="ts">
  export let health: number
  export let damage: number
</script>

<div class="vision-tag">VISION DE FEITAN · IMAGE PRÉDITE</div>
{#if damage > 0}<div class="flash"></div>{/if}
<div class="vision-hit">
  {#if health === 0}<strong>K.-O. PRÉDIT</strong><span>L’IMAGE DE TSERRIEDNICH EST VAINCUE</span>
  {:else}<strong>RISING SUN FRAPPE L’IMAGE</strong><span
      >VISION PERÇUE PAR FEITAN · {Math.round(health)} PV</span
    >{/if}
</div>

<style>
  .vision-tag {
    position: absolute;
    left: 0;
    right: 0;
    top: 120px;
    background: #080d15ed;
    padding: 14px;
    color: #ffbd9b;
    text-align: center;
    font: 700 60px sans-serif;
    letter-spacing: 3px;
  }
  .flash {
    position: absolute;
    inset: 0;
    background: #ff38291c;
    pointer-events: none;
  }
  .vision-hit {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 75px;
    text-align: center;
    color: #ffb59d;
    text-shadow: 0 2px 14px black;
    font-family: sans-serif;
  }
  strong {
    display: block;
    font-size: 64px;
    font-weight: 800;
    letter-spacing: 3px;
  }
  span {
    display: block;
    margin-top: 10px;
    font-size: 46px;
    letter-spacing: 2px;
  }
</style>
