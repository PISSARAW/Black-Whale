<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="p-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Narrative Events</h1>
		<a href="/events/new" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
			Add Event
		</a>
	</div>

	<div class="space-y-4">
		{#each data.events as event}
			<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<div class="flex justify-between items-start">
					<div>
						<h2 class="text-xl font-semibold">
							<span class="text-gray-500 mr-2">Ch. {event.chapter.number} (Seq {event.sequence})</span>
							{event.title}
						</h2>
						<p class="text-gray-600 mt-1">{event.summary}</p>
					</div>
				</div>

				{#if event.presencesFrom.length > 0}
					<div class="mt-4 pt-4 border-t border-gray-100">
						<h3 class="text-sm font-semibold text-gray-500 mb-2">Consequences (Movements)</h3>
						<ul class="space-y-1">
							{#each event.presencesFrom as presence}
								<li class="text-sm">
									<span class="font-medium">{presence.body?.character?.canonicalName ?? 'Unknown Character'}</span> moved to 
									<span class="font-medium">{presence.location?.name ?? 'Unknown Location'}</span>
									<span class="text-gray-400 text-xs ml-2">({presence.precision}, {presence.certainty})</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/each}
		{#if data.events.length === 0}
			<p class="text-gray-500 italic">No events found.</p>
		{/if}
	</div>
</div>
