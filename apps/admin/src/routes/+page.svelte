<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Dashboard — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Dashboard</h1>
<p class="text-gray-400 mb-6">Welcome to the Black Whale back-office.</p>

<h2 class="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
    <div class="text-3xl font-bold text-bw-gold">{data.stats.chapters}</div>
    <div class="text-sm text-gray-500 mt-1">Chapters</div>
  </div>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
    <div class="text-3xl font-bold text-bw-gold">{data.stats.abilities}</div>
    <div class="text-sm text-gray-500 mt-1">Abilities</div>
  </div>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
    <div class="text-3xl font-bold text-bw-gold">{data.stats.characters}</div>
    <div class="text-sm text-gray-500 mt-1">Characters</div>
  </div>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
    <div class="text-3xl font-bold text-bw-gold">{data.stats.sources}</div>
    <div class="text-sm text-gray-500 mt-1">Sources</div>
  </div>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
    <div class="text-3xl font-bold text-bw-gold">{data.stats.events}</div>
    <div class="text-sm text-gray-500 mt-1">Events</div>
  </div>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
    <div class="text-3xl font-bold text-bw-gold">{data.stats.facts}</div>
    <div class="text-sm text-gray-500 mt-1">Facts</div>
  </div>
</div>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Access</h3>
  <div class="flex flex-wrap gap-3">
    <a href="/chapters" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors">Chapters</a>
    <a href="/abilities" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors">Abilities</a>
    <a href="/characters" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors">Characters</a>
    <a href="/sources" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors">Sources</a>
    <a href="/events" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors">Events</a>
    <a href="/facts" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors">Facts</a>
  </div>
</div>

<style>
  .bw-gold { color: #FFD700; }
</style>
