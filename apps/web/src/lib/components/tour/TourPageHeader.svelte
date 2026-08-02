<script lang="ts">
  interface Props {
    title: string
    intro: string
    counts: string
    scale: string
    morenaTitle: string
    morenaHref: string
  }

  let { title, intro, counts, scale, morenaTitle, morenaHref }: Props = $props()
</script>

<header class="mb-6">
  <h1 class="text-3xl font-bold tracking-tight text-[#FFFFF0] sm:text-4xl">{title}</h1>
  <p class="mt-2 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/70">{intro}</p>
  <p class="mt-2 text-xs uppercase tracking-widest text-[#FFD700]/70">
    {counts} · {scale}
  </p>
  <p class="mt-3">
    <a
      href={morenaHref}
      class="text-sm text-[#d94f68] underline underline-offset-2 transition-colors hover:text-[#e8697f]"
    >
      {morenaTitle} →
    </a>
  </p>
</header>
