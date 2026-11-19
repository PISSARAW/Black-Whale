import { describe, expect, it } from 'vitest'
import { displayedDocumentText, advancePaperTextures } from './paperTexture'
import {
  paperSetup,
  paperCommand,
  paperFrames,
  preparePaper,
  maskPaper,
  note,
  paperId,
} from './paperDocumentTestSetup'
import { privatePvpState } from './pvp/view'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT } from './types'

describe('Texture Surprise on existing paper', () => {
  it('changes visible writing after the real cast while preserving the original ink and body disguise', () => {
    let state = paperSetup()
    state = {
      ...state,
      player: { ...state.player, textureSurprise: { surface: 'cloth', source: 'personal' } },
    }
    const prepared = preparePaper(state)
    const casting = paperCommand(prepared, { action: 'texture-apply' })
    expect(casting.player.attack).toBeTruthy()
    expect(note(casting).document!.textures).toBeUndefined()
    const masked = paperFrames(casting)
    expect(note(masked).document!.text).toBe('Document 01 · 18:00')
    expect(displayedDocumentText(masked, note(masked))).toBe('Document 01 · 21:00')
    expect(masked.player.textureSurprise).toEqual(state.player.textureSurprise)
    expect(masked.opponent.health).toBe(state.opponent.health)
    expect(masked.bungeeGum).toBeNull()
  })
  it('revalidates contact at emission and cannot cast onto an invented support', () => {
    let state = preparePaper(paperSetup())
    state = paperCommand(state, { action: 'document-drop', target: paperId })
    const started = paperCommand(state, { action: 'texture-apply' })
    expect(started.player.attack).toBeTruthy()
    const interrupted = paperFrames({ ...started, player: { ...started.player, x: 70 } })
    expect(note(interrupted).document!.textures).toBeUndefined()
    const base = paperSetup()
    expect(paperCommand(base, { action: 'texture-paper', target: 'invented' })).toBe(base)
  })
  it('reveals unchanged ink on removal or loss of the maintaining Nen', () => {
    const state = maskPaper(paperSetup())
    const removed = paperCommand(state, { action: 'texture-paper-remove', target: paperId })
    expect(displayedDocumentText(removed, note(removed))).toBe('Document 01 · 18:00')
    const sealed = advancePaperTextures({
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } },
    })
    expect(note(sealed).document!.textures).toBeUndefined()
    expect(displayedDocumentText(sealed, note(sealed))).toBe('Document 01 · 18:00')
  })
  it('reads only the visible surface and preserves a dated memory after the sheet changes', () => {
    let state = maskPaper(paperSetup(), '<script>faux texte</script>')
    state = paperCommand(state, { action: 'document-read', target: paperId })
    expect(state.player.documentReading?.text).toBe('<script>faux texte</script>')
    state = paperCommand(state, { action: 'texture-paper-remove', target: paperId })
    expect(state.player.documentReading?.text).toBe('<script>faux texte</script>')
    expect(note(state).document!.text).toBe('Document 01 · 18:00')
  })
  it('does not send covered ink, drafts or another character’s memories to the opponent', () => {
    const state = maskPaper(paperSetup(), 'visible only when shown')
    const hidden = privatePvpState(state, 'opponent')
    const document = hidden.battlefield!.entities.find((entry) => entry.id === paperId)!.document!
    expect(document.text).toBe('')
    expect(document.textures).toBeUndefined()
    expect(hidden.opponent.texturePaperDraft).toBeUndefined()
    const shown = paperCommand(state, { action: 'document-show', target: paperId })
    expect(shown.opponent.documentReading?.text).toBe('visible only when shown')
    const visible = privatePvpState(shown, 'opponent')
    expect(
      visible.battlefield!.entities.find((entry) => entry.id === paperId)!.document!.text,
    ).toBe('visible only when shown')
    expect(
      JSON.stringify(visible.battlefield!.entities.find((entry) => entry.id === paperId)),
    ).not.toContain('18:00')
  })
  it('bounds semantic text and requires an available Texture Surprise source', () => {
    const state = paperSetup('theta')
    expect(paperCommand(state, { action: 'texture-paper', target: paperId })).toBe(state)
    const prepared = preparePaper(paperSetup())
    expect(paperCommand(prepared, { action: 'texture-paper-text', target: 'x'.repeat(241) })).toBe(
      prepared,
    )
    const empty = paperCommand(prepared, { action: 'texture-paper-text', target: '' })
    const masked = paperFrames(paperCommand(empty, { action: 'texture-apply' }))
    expect(displayedDocumentText(masked, note(masked))).toBe('')
  })
  it('keeps the On and the real paper when its contract ends the Nen appearance', () => {
    const masked = maskPaper(paperSetup())
    const state = advancePaperTextures({
      ...masked,
      player: applyAuraContext(
        { ...masked.player, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    })
    expect(state.player.on?.grudge).toBe(100)
    expect(state.player.nen.on).toBe(true)
    expect(note(state).document!.textures).toBeUndefined()
    expect(note(state).document!.text).toBe('Document 01 · 18:00')
    const read = paperCommand(state, { action: 'document-read', target: paperId })
    expect(read.player.documentReading?.text).toBe('Document 01 · 18:00')
    expect(paperCommand(read, { action: 'texture-apply' })).toBe(read)
  })
})
