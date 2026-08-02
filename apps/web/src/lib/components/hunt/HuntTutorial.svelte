<script lang="ts">
  import type { TutorialStep } from '$lib/hunt/tutorial'

  interface Props {
    step: Exclude<TutorialStep, 'done'>
    labels: {
      title: string
      step: Record<Exclude<TutorialStep, 'done'>, { title: string; body: string }>
      dismiss: string
    }
    onDismiss: () => void
  }

  let { step, labels, onDismiss }: Props = $props()
</script>

<aside
  class="pointer-events-auto absolute inset-x-3 top-20 z-30 mx-auto max-w-sm rounded-xl border border-sky-300/20 bg-black/75 p-4 shadow-xl backdrop-blur-md"
  aria-live="polite"
>
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-[0.65rem] uppercase tracking-[0.25em] text-sky-300/60">{labels.title}</p>
      <h2 class="mt-1 text-sm font-medium text-white">{labels.step[step].title}</h2>
      <p class="mt-1 text-xs leading-relaxed text-white/55">{labels.step[step].body}</p>
    </div>
    <button
      class="text-xs text-white/40 transition hover:text-white"
      onclick={onDismiss}
      aria-label={labels.dismiss}>×</button
    >
  </div>
</aside>
