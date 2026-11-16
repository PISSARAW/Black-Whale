<script lang="ts">
  import { t } from '$lib/i18n'
  import type { SearchResponse } from '$lib/search/types'

  let {
    response,
    pending,
    error,
    cursor,
    onSearch,
    onPick,
  }: {
    response: SearchResponse | null
    pending: boolean
    error: boolean
    cursor: number
    onSearch: () => void
    onPick: (href: string) => void
  } = $props()
</script>

<section class="site-search" aria-label={$t.palette.site.title} aria-busy={pending}>
  <button class="submit" type="button" onclick={onSearch} disabled={pending}>
    {pending ? $t.palette.site.pending : $t.palette.site.submit}
  </button>
  <p class="policy">{$t.palette.site.policy}</p>
  <div aria-live="polite" role="status">
    {#if error}<p>{$t.palette.site.error}</p>{/if}
    {#if response}
      <p>{response.total ? $t.palette.site.count(response.total) : $t.palette.site.empty}</p>
      {#if response.mode === 'ai'}<p>{$t.palette.site.interpreted}</p>{/if}
      {#if response.mode === 'fallback'}<p>{$t.palette.site.fallback}</p>{/if}
    {/if}
  </div>
  {#if response}
    <ol>
      {#each response.results as result, index (result.id)}
        <li>
          <button
            type="button"
            class:current={index === cursor}
            onclick={() => onPick(result.href)}
          >
            <span class="label">{result.title}</span>
            <span class="meta"
              >{$t.palette.site.kinds[result.kind]}{#if result.chapter !== null}
                · ch. {result.chapter}{/if}</span
            >
            {#if result.excerpt}<span class="excerpt">{result.excerpt}</span>{/if}
          </button>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .site-search {
    padding: 0.7rem;
    border-bottom: 1px solid var(--line-default);
  }
  .submit {
    width: 100%;
    padding: 0.65rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.4rem;
    color: var(--accent-gold);
    background: transparent;
    cursor: pointer;
  }
  .submit:disabled {
    opacity: 0.55;
    cursor: wait;
  }
  p {
    margin: 0.4rem 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
  .policy {
    color: var(--text-faint);
    font-size: 0.7rem;
  }
  ol {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
  }
  li > button {
    display: grid;
    width: 100%;
    gap: 0.3rem;
    padding: 0.75rem;
    text-align: left;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    color: var(--text-primary);
    cursor: pointer;
  }
  li > button:hover,
  li > button.current {
    border-color: var(--line-strong);
    background: rgba(200, 169, 86, 0.08);
  }
  .label {
    font-weight: 600;
  }
  .meta {
    color: var(--accent-gold);
    font-size: 0.7rem;
  }
  .excerpt {
    color: var(--text-secondary);
    font-size: 0.8rem;
    line-height: 1.4;
  }
</style>
