<script lang="ts">
  import type { CloseupFrame } from './closeupTrack'
  export let frame: CloseupFrame
</script>

<div class="closeup" class:eyes={frame.kind === 'eyes'}>
  <div class="top">GROS PLAN <span>EN DIRECT · SIMULTANÉ</span></div>
  <div class="bottom">{frame.label}</div>
</div>

<style>
  .closeup {
    position: absolute;
    left: 1210px;
    top: 220px;
    width: 650px;
    height: 380px;
    pointer-events: none;
    border: 2px solid #9ddae2;
    box-shadow: 0 0 22px #07090e90;
    color: #d5f5fa;
    font-family: sans-serif;
    letter-spacing: 2px;
    font-weight: 700;
  }
  .eyes {
    border-color: #ff5573;
    color: #ffc6cf;
  }
  .top,
  .bottom {
    position: absolute;
    left: 0;
    right: 0;
    background: #07090ee8;
    padding: 12px 16px;
    font-size: 16px;
  }
  .top {
    top: -42px;
    display: flex;
    justify-content: space-between;
  }
  .top span {
    font-size: 12px;
    align-self: center;
    letter-spacing: 1px;
  }
  .bottom {
    bottom: -43px;
  }
</style>
