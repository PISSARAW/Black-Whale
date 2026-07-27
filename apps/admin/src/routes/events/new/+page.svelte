<script lang="ts">
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<div class="p-8 max-w-3xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Create Narrative Event</h1>

  {#if form?.error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
      {form.error}
    </div>
  {/if}

  <form method="POST" class="space-y-8">
    <!-- Event Data -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <h2 class="text-xl font-semibold mb-4">Event Details</h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
          <select
            name="chapterId"
            class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            required
          >
            <option value="">Select Chapter...</option>
            {#each data.chapters as chapter}
              <option value={chapter.id}>Chapter {chapter.number} - {chapter.title}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sequence</label>
          <input
            type="number"
            name="sequence"
            class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            required
            min="1"
            placeholder="e.g. 4"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          name="title"
          class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Summary</label>
        <textarea
          name="summary"
          rows="3"
          class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
          required></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="temporal-mode" class="block text-sm font-medium text-gray-700 mb-1"
            >Narrative mode</label
          >
          <select
            id="temporal-mode"
            name="temporalMode"
            class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
          >
            <option value="current">Current event</option>
            <option value="flashback">Flashback revealed in this chapter</option>
          </select>
        </div>
        <div>
          <label for="occurred-at-label" class="block text-sm font-medium text-gray-700 mb-1"
            >In-world time label</label
          >
          <input
            id="occurred-at-label"
            type="text"
            name="occurredAtLabel"
            class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            placeholder="e.g. Day 10 · 19:35"
          />
        </div>
      </div>

      <div>
        <label for="occurs-before-event" class="block text-sm font-medium text-gray-700 mb-1"
          >Actually occurred before</label
        >
        <select
          id="occurs-before-event"
          name="occursBeforeEventId"
          class="w-full border-gray-300 rounded-md shadow-sm p-2 border"
        >
          <option value="">End of known chronology (default)</option>
          {#each data.events as event}
            <option value={event.id}>Ch. {event.chapter.number} · {event.title}</option>
          {/each}
        </select>
        <p class="text-sm text-gray-500 mt-1">
          Required for a flashback. This controls world-state chronology, not reading order.
        </p>
      </div>
    </div>

    <!-- Consequence Data -->
    <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
      <h2 class="text-xl font-semibold mb-4">Movement Consequence (Optional)</h2>
      <p class="text-sm text-gray-500 mb-4">
        Adding a movement will automatically close the character's previous presence.
      </p>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Character</label>
          <select name="characterId" class="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">No consequence...</option>
            {#each data.characters as char}
              <option value={char.id}>{char.canonicalName}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Location</label>
          <select name="locationId" class="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="">Select Location...</option>
            {#each data.locations as loc}
              <option value={loc.id}>{loc.name} ({loc.type})</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Precision</label>
          <select name="precision" class="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="EXACT_ROOM">Exact Room</option>
            <option value="ZONE">Zone</option>
            <option value="TIER">Tier</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Certainty</label>
          <select name="certainty" class="w-full border-gray-300 rounded-md shadow-sm p-2 border">
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROBABLE">Probable</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-4">
      <a href="/events" class="px-4 py-2 text-gray-700 hover:text-gray-900">Cancel</a>
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
      >
        Save Event
      </button>
    </div>
  </form>
</div>
