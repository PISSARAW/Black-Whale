<script lang="ts">
  import type { CameraDetail } from '$lib/fighting/cinematicDirector'
  import type { CameraDetailRect } from '$lib/fighting/cinematicDetailLayout'
  export let detail: CameraDetail
  export let rect: CameraDetailRect
  export let language: 'fr' | 'en'
</script>

<div
  class="camera-detail"
  data-camera-detail={detail.kind}
  data-camera-source={detail.source}
  data-camera-event={detail.eventId}
  data-camera-side={detail.side}
  data-camera-follow-through={detail.followThrough ? 'true' : undefined}
  style:left={`${rect.x * 100}%`}
  style:top={`${rect.y * 100}%`}
  style:width={`${rect.width * 100}%`}
  style:height={`${rect.height * 100}%`}
>
  <span
    >{detail.followThrough
      ? language === 'fr'
        ? 'Suivi après : '
        : 'Following: '
      : ''}{language === 'fr' ? detail.labelFr : detail.labelEn}</span
  >
</div>

<style>
  .camera-detail {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid #c9ad76;
    box-shadow: 0 4px 18px #0009;
    pointer-events: none;
  }
  span {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.35rem 0.5rem;
    background: linear-gradient(transparent, #03080fee 30%);
    color: #fff0d1;
    font: 600 clamp(0.5rem, 0.9vw, 0.75rem)/1.25 var(--font-mono, monospace);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>
