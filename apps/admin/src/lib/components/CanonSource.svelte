<script lang="ts">
  /**
   * Says where a table actually comes from.
   *
   * The back-office reads tables that `prisma/seed.ts` empties and rebuilds
   * from `data/` on every deployment, so a row created here would disappear at
   * the next release without a word. ADR-001 makes that explicit: `data/` is
   * the single declaration, the database is a projection. Until the admin can
   * write back to `data/` (a decision the ADR defers past chantier 2), creating
   * canon here is not offered rather than offered and lost.
   */
  let { file }: { file: string } = $props()
</script>

<p class="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
  Lecture seule. Ces lignes sont recompilées depuis
  <code class="rounded bg-amber-100 px-1 font-mono">{file}</code>
  à chaque déploiement : une création faite ici serait perdue au prochain seed. Le canon s'édite dans
  <code class="rounded bg-amber-100 px-1 font-mono">data/</code>, en commit.
</p>
