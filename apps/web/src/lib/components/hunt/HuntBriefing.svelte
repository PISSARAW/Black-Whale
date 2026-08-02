<script lang="ts">
  interface Props {
    labels: {
      eyebrow: string
      title: string
      premise: string
      rule: string
      objective: string
      begin: string
    }
    onBegin: () => void
  }

  let { labels, onBegin }: Props = $props()
</script>

<section class="absolute inset-0 z-40 grid place-items-center bg-black/88 p-6 backdrop-blur-md">
  <div class="max-w-lg text-center">
    <p class="text-xs uppercase tracking-[0.35em] text-sky-300/80">{labels.eyebrow}</p>
    <h1 class="mt-4 text-3xl font-medium text-white sm:text-4xl">{labels.title}</h1>
    <p class="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70">{labels.premise}</p>
    <p
      class="mx-auto mt-4 max-w-md border-y border-white/10 py-4 text-sm leading-relaxed text-rose-200/90"
    >
      {labels.rule}
    </p>
    <p class="mt-4 text-sm text-white/55">{labels.objective}</p>
    <button
      class="mt-8 rounded-full border border-sky-300/60 bg-sky-300/10 px-7 py-3 text-sm uppercase tracking-widest text-sky-100 transition hover:bg-sky-300/20"
      onclick={onBegin}>{labels.begin}</button
    >
  </div>
</section>
