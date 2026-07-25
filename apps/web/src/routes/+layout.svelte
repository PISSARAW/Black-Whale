<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
</script>

<div class="app min-h-screen bg-bw-dark text-white">
  <nav class="flex items-center gap-4 px-6 py-3 bg-bw-navy border-b border-bw-gold/20 text-sm">
    <a href="/" class="font-bold text-bw-gold text-lg">Black Whale</a>
    <a href="/ship">Ship Map</a>
    <a href="/timeline">Timeline</a>
    <a href="/characters">Characters</a>
    <a href="/abilities">Abilities</a>
    <a href="/nen" class="text-bw-gold font-semibold">Nen</a>
    <a href="/perspectives">Perspectives</a>
    <a href="/compare">Compare</a>
    <a href="/simulations">Simulations</a>
    <a href="/theories">Theories</a>
    <a href="/sources">Sources</a>
  </nav>

  <main class="flex-1">
    <slot />
  </main>
</div>
