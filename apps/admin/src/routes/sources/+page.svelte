<script lang="ts">
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<svelte:head><title>Sources — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Sources</h1>
<p class="text-gray-500 mb-6">{data.sources.length} total sources</p>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Chapter</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Page</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if data.sources.length === 0}
        <tr>
          <td colspan="4" class="px-4 py-6 text-center text-gray-400">No sources found</td>
        </tr>
      {:else}
        {#each data.sources as source (source.id)}
          <tr class="border-t border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{source.chapterNumber}</td>
            <td class="px-4 py-3 text-gray-600">{source.page || '-'}</td>
            <td class="px-4 py-3 text-gray-600 max-w-md truncate">{source.description || '-'}</td>
            <td class="px-4 py-3">
              <a href="/sources/{source.id}" class="text-blue-600 hover:text-blue-800">View</a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .bw-gold {
    color: #ffd700;
  }
</style>
