import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { performAuraAttack } from './engine'
import {
  maskPaper,
  paperSetup,
  paperCommand,
  paperFrames,
  note,
  paperId,
} from './paperDocumentTestSetup'
import { createPaperDocumentScene } from './paperDocumentScene'
import { paperTextureAi } from './paperTextureAi'
import { privatePvpState } from './pvp/view'
import { canReadDocument } from './paperDocumentReading'

describe('document contact, sight, AI and posed physical presentation', () => {
  it('delivers a silent visual message through Judgment’s actual recipient rule', () => {
    let state = maskPaper(paperSetup('hisoka', 'machi'))
    state = {
      ...state,
      player: { ...state.player, judgmentChain: { owner: 'opponent', rule: 'no-troupe-contact' } },
    }
    const read = paperCommand(state, { action: 'document-read', target: paperId })
    expect(read.player.health).toBe(state.player.health)
    const shown = paperCommand(state, { action: 'document-show', target: paperId })
    expect(shown.player.health).toBe(0)
    expect(shown.winner).toBe('opponent')
  })
  it('does not make Hisoka a Troupe member by putting a false spider on a paper surface', () => {
    let state = maskPaper(paperSetup('hisoka', 'hisoka'), 'Spider · 4')
    state = {
      ...state,
      player: { ...state.player, judgmentChain: { owner: 'opponent', rule: 'no-troupe-contact' } },
    }
    const shown = paperCommand(state, { action: 'document-show', target: paperId })
    expect(shown.player.health).toBe(state.player.health)
    expect(shown.opponent.documentReading?.text).toBe('Spider · 4')
  })
  it('requires actual sight and an offered readable surface rather than a private held sheet', () => {
    const held = maskPaper(paperSetup())
    expect(canReadDocument(held, 'opponent', note(held))).toBe(false)
    const turned = { ...held, opponent: { ...held.opponent, facing: 1 as const } }
    expect(paperCommand(turned, { action: 'document-show', target: paperId })).toBe(turned)
    const far = { ...held, opponent: { ...held.opponent, x: 70 } }
    expect(paperCommand(far, { action: 'document-show', target: paperId })).toBe(far)
  })
  it('uses a nearby prepared paper through the real AI cast without looping or creating a support', () => {
    const base = paperSetup('theta')
    let state = {
      ...base,
      player: { ...base.player, x: 26 },
      opponent: { ...base.opponent, x: 74 },
    }
    for (let step = 0; step < 4; step++) {
      const next = paperTextureAi(state, performAuraAttack)
      if (!next) break
      state = next
    }
    expect(state.opponent.attack?.moveId).toBe('hisoka:downSpecial')
    state = paperFrames(state)
    const paper = state.battlefield!.entities.find(
      (entry) => entry.id === 'opponent:scenario-document',
    )!
    expect(paper.document!.textures?.[0]?.text).toBe('Document · ...')
    expect(paper.document!.text).toBe('Document 01 · 18:00')
    expect(paperTextureAi(state, performAuraAttack)).toBeNull()
  })
  it('attaches each actual sheet to its occupied posed hand and disposes every scene resource', () => {
    let state = paperCommand(paperSetup(), { action: 'document-take', target: paperId })
    const scene = new THREE.Scene()
    const rear = new THREE.Group(),
      lead = new THREE.Group()
    rear.position.set(3, 4, 5)
    lead.position.set(6, 7, 8)
    scene.add(rear, lead)
    const effect = createPaperDocumentScene({
      THREE,
      scene,
      worldX: (x) => x / 10,
      worldY: (y) => y / 10,
      handAnchor: (_side, hand) => (hand === 'rear' ? rear : lead),
    })
    effect.sync(state, 0)
    const mesh = scene.getObjectByName(`document:${paperId}`)!
    const anchor = note(state).document!.holder!.hand === 'left' ? rear : lead
    expect(mesh.position).toEqual(anchor.position)
    state = paperCommand(state, { action: 'document-drop', target: paperId })
    effect.sync(state, 1)
    expect(mesh.position).not.toEqual(anchor.position)
    expect(mesh.rotation.x).toBe(-Math.PI / 2)
    effect.dispose()
    expect(scene.children).toEqual([rear, lead])
  })
  it('does not reveal the enemy author’s draft through P2’s local perspective', () => {
    const state = maskPaper(paperSetup())
    const view = privatePvpState(state, 'opponent')
    expect(view.player.id).toBe('hisoka')
    expect(view.opponent.texturePaperDraft).toBeUndefined()
    expect(view.player.documentReading).toBeUndefined()
  })
})
