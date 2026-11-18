<script lang="ts">
  import { onMount } from 'svelte'
  import { afterNavigate } from '$app/navigation'
  import { connectAnalytics, enableAnalytics, trackEvent, trackPage } from './client'

  export let websiteId: string | null
  let mounted = false
  let interacted = false
  let lastInput = 0
  let lastTick = 0
  let activeSeconds = 0
  let currentPath = ''

  function visit(path: string) {
    if (path === currentPath) return
    currentPath = path
    interacted = false
    activeSeconds = 0
    trackPage(path)
  }

  afterNavigate(() => {
    if (mounted) visit(window.location.pathname)
  })

  onMount(() => {
    if (!websiteId) return
    mounted = true
    enableAnalytics(true)
    visit(window.location.pathname)
    const script = document.createElement('script')
    script.src = '/_analytics/script.js'
    script.defer = true
    script.dataset.websiteId = websiteId
    script.dataset.hostUrl = `${window.location.origin}/_analytics`
    script.dataset.autoTrack = 'false'
    script.onload = () => {
      const umami = (window as unknown as { umami?: Parameters<typeof connectAnalytics>[0] }).umami
      if (umami) connectAnalytics(umami)
    }
    document.head.appendChild(script)
    const input = (event: Event) => {
      lastInput = performance.now()
      if (
        interacted ||
        !(event.target instanceof Element) ||
        event.target.closest('header, footer, nav, [data-hatsu-ui]')
      )
        return
      interacted = true
      trackEvent('mode_interaction')
    }
    const tick = () => {
      const now = performance.now()
      const elapsed = Math.min(5, (now - lastTick) / 1000)
      lastTick = now
      if (document.visibilityState !== 'visible' || !interacted || now - lastInput > 60_000) return
      activeSeconds += elapsed
      if (activeSeconds >= 30) {
        trackEvent('mode_active_30s', { seconds: 30 })
        activeSeconds -= 30
      }
    }
    lastTick = performance.now()
    const clock = window.setInterval(tick, 1000)
    document.addEventListener('pointerdown', input, { passive: true })
    document.addEventListener('keydown', input)
    return () => {
      mounted = false
      clearInterval(clock)
      document.removeEventListener('pointerdown', input)
      document.removeEventListener('keydown', input)
      script.remove()
      enableAnalytics(false)
    }
  })
</script>
