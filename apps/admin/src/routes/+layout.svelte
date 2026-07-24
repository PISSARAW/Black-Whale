<script lang="ts">
  import '../app.css'
</script>

<div class="flex min-h-screen bg-gray-950 text-gray-100">
  <aside class="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-2 text-sm">
    <h2 class="font-bold text-bw-gold text-base mb-2">BW Admin</h2>
    <a href="/admin" class="hover:text-bw-gold">Dashboard</a>
    <a href="/admin/chapters" class="hover:text-bw-gold">Chapters</a>
    <a href="/admin/characters" class="hover:text-bw-gold">Characters</a>
    <a href="/admin/events" class="hover:text-bw-gold">Events</a>
    <a href="/admin/abilities" class="hover:text-bw-gold">Nen Abilities</a>
    <a href="/admin/facts" class="hover:text-bw-gold">Facts</a>
    <a href="/admin/sources" class="hover:text-bw-gold">Sources</a>
  </aside>
  <main class="flex-1 p-6">
    <slot />
  </main>
</div>
