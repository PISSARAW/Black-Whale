import { compile } from 'svelte/compiler'
import { describe, expect, it } from 'vitest'
import { publicTextPreprocess } from '../../../i18n-preprocess.mjs'

describe('public text rendering boundary', () => {
  it('localizes visible text and accessible labels while preserving paths and styles', async () => {
    const source = `<script lang="ts">
      import { t } from '$lib/i18n'
      let room = { name: 'Kitchen' }
    </script>
    <a href="/ship" class="wide" aria-label="Open">Kitchen {room.name} {$t.nav.explore}</a>`
    const preprocessor = publicTextPreprocess()
    const markup = preprocessor.markup!
    const transformed = await markup({
      content: source,
      filename: '/app/apps/web/src/lib/Example.svelte',
    })
    expect(transformed?.code).toContain('href="/ship" class="wide"')
    expect(transformed?.code).toContain('__publicText("Kitchen "')
    expect(transformed?.code).toContain('__publicText(room.name')
    expect(transformed?.code).toContain('aria-label={__publicText("Open"')
    expect(transformed?.code).toContain('__publicText($t.nav.explore,')
    expect(() => compile(transformed!.code, { generate: 'server' })).not.toThrow()
  })

  it('never changes application JSON or script contents', async () => {
    const source = `<script>const key = 'Kitchen';</script>
      <svelte:head><script type="application/ld+json">{"name":"Kitchen"}</script></svelte:head><p>Kitchen</p>`
    const transformed = await publicTextPreprocess().markup!({
      content: source,
      filename: '/app/apps/web/src/lib/Example.svelte',
    })
    expect(transformed?.code).toContain("const key = 'Kitchen'")
    expect(transformed?.code).toContain('{"name":"Kitchen"}')
  })
})
