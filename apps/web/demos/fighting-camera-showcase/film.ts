import { descriptions } from './descriptions'
import { cinematicDuel } from '../../src/lib/fighting/cinematicFixtures'
import { cameraSnapshot, cinematicEvents } from '../../src/lib/fighting/cinematicEvents'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import { respondMoonlightContract } from '../../src/lib/fighting/moonlightContract'
import { fighterDefinition } from '../../src/lib/fighting/roster'
import { CINEMATIC_CATALOGUE } from '../../src/lib/fighting/cinematicCatalogue'
import {
  EMPTY_INPUT,
  type FightState,
  type FightSide,
  type FightInput,
  type FighterId,
  type MoveSlot,
} from '../../src/lib/fighting/types'

export interface Frame {
  state: FightState
  caption: string
}
export interface Chapter {
  id: FighterId
  name: string
  ability: string
  note: string
  frames: Frame[]
  states: FightState[]
  events: string[]
  commands: { slot: string; accepted: boolean; frame: number }[]
  impacts: number
}

class Take {
  state: FightState
  states: FightState[] = []
  frames: Frame[] = []
  events = new Set<string>()
  commands: Chapter['commands'] = []
  impacts = 0
  caption = 'Le duel commence — vue principale continue'
  constructor(
    readonly id: FighterId,
    readonly spacious = false,
  ) {
    this.state = cinematicDuel(id, 'player', { preparePredatorPrey: false })
    if (id === 'chrollo') {
      const s = beginFight(
        createFight('chrollo', 'hisoka', {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        }),
      )
      this.state = {
        ...s,
        player: { ...s.player, x: 48, aura: 100 },
        opponent: { ...s.opponent, x: 53, aura: 100 },
      }
    }
    if (id === 'bonolenov')
      this.state = {
        ...this.state,
        player: { ...this.state.player, x: 30 },
        opponent: { ...this.state.opponent, x: 60 },
      }
    if (id === 'terebellum')
      this.state = {
        ...this.state,
        player: { ...this.state.player, health: this.state.player.maxHealth },
        opponent: { ...this.state.opponent, x: 52 },
      }
    if (spacious && id === 'biscuit')
      this.state = { ...this.state, opponent: { ...this.state.opponent, x: 58 } }
    // Keep only resources belonging to this scenario, before its first recorded frame.
    if (this.state.battlefield) {
      const kind = (
        { bill: 'seed', cluck: 'bird', sayird: 'animal', luini: 'room' } as Record<string, string>
      )[id]
      this.state = {
        ...this.state,
        battlefield: {
          ...this.state.battlefield,
          entities: this.state.battlefield.entities.filter(
            (e) =>
              (e.owner === 'player' &&
                (e.kind === kind ||
                  (id === 'halkenburg' && e.kind === 'supporter') ||
                  (id === 'cluck' && e.kind === 'delivery') ||
                  (id === 'luini' && e.kind === 'destination'))) ||
              (id === 'yokotani' && e.kind === 'morena'),
          ),
        },
      }
    }
    if (id === 'camilla')
      this.state = { ...this.state, player: { ...this.state.player, health: 1 } }
    if (id === 'machi')
      this.state = {
        ...this.state,
        player: { ...this.state.player, health: this.state.player.health - 24 },
      }
  }
  observe(before: FightState) {
    for (const event of cinematicEvents(this.state, cameraSnapshot(before)))
      if (event.detail?.eventId) this.events.add(event.detail.eventId)
    if (this.state.impact && this.state.impact.sequence !== before.impact?.sequence) this.impacts++
  }
  advance(count: number, p: Partial<FightInput> = {}, o: Partial<FightInput> = {}) {
    for (let i = 0; i < count; i++) {
      const before = this.state
      this.state = tickFight(
        before,
        { ...EMPTY_INPUT, ...p },
        { dt: 1 / 60, opponentInput: { ...EMPTY_INPUT, ...o }, ai: false },
      )
      this.observe(before)
      this.states.push(this.state)
      if (this.states.length % 2 === 0)
        this.frames.push({ state: this.state, caption: this.caption })
    }
  }
  action(slot: MoveSlot, caption: string, side: FightSide = 'player') {
    this.caption = caption
    const before = this.state
    const move = moveForSlot(this.state[side].id, slot)
    if (!move) throw new Error(`${this.id}: missing ${this.state[side].id}:${slot}`)
    this.state = performAuraAttack({
      state: this.state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: false,
    })
    this.observe(before)
    this.commands.push({
      slot: `${side}:${slot}`,
      accepted: this.state !== before,
      frame: this.states.length,
    })
  }
  attack(kind: 'heavy' | 'light' | 'ranged', caption: string, side: FightSide = 'player') {
    this.caption = caption
    const before = this.state
    this.state = performAttack(this.state, side, kind)
    this.observe(before)
    this.commands.push({
      slot: `${side}:${kind}`,
      accepted: this.state !== before,
      frame: this.states.length,
    })
  }
  ready(side: FightSide = 'player') {
    for (let i = 0; i < 180; i++) {
      const f = this.state[side]
      if (
        !f.attack &&
        !f.hitStun &&
        !f.blockStun &&
        !f.knockdownFrames &&
        !f.wakeupInvulnerableFrames
      )
        return
      this.advance(1)
    }
  }
  close(gap = this.spacious && this.id === 'biscuit' ? 8 : 4.5) {
    for (let i = 0; i < 150 && Math.abs(this.state.player.x - this.state.opponent.x) > gap; i++)
      this.advance(
        1,
        this.state.player.x < this.state.opponent.x ? { right: true } : { left: true },
      )
    this.advance(1)
  }
  cast(slot: MoveSlot, caption: string, frames = 90) {
    this.ready()
    this.action(slot, caption)
    this.advance(frames)
  }
  finish() {
    // A final live exchange is part of the same duel, never a replay or a resource refill.
    if (
      this.state.phase === 'fighting' &&
      !['camilla', 'rihan', 'longhi', 'halkenburg', 'melody', 'yokotani', 'tserriednich'].includes(
        this.id,
      )
    ) {
      this.ready()
      this.close()
      this.attack('light', 'Le combat se poursuit dans la vue principale', 'opponent')
      this.advance(65)
    }
    this.advance(Math.max(45, 360 - this.states.length))
    const [ability, note] = descriptions[this.id]
    return {
      id: this.id,
      name: fighterDefinition(this.id).name,
      ability,
      note,
      frames: this.frames,
      states: this.states,
      events: [...this.events],
      commands: this.commands,
      impacts: this.impacts,
    }
  }
}

export function makeChapter(id: FighterId, spacious = false): Chapter {
  const t = new Take(id, spacious)
  t.advance(36)
  switch (id) {
    case 'kurapika': {
      const before = t.state
      t.state = toggleEmperorTime(t.state, 'player')
      t.observe(before)
      t.caption = 'Emperor Time — activation et yeux écarlates'
      t.advance(100)
      t.cast('neutralSpecial', 'Chain Jail — capture réelle de Chrollo', 110)
      break
    }
    case 'hisoka':
      t.cast('neutralSpecial', 'Bungee Gum — contact et attachement', 80)
      t.cast('forwardSpecial', 'Bungee Gum — traction de la cible', 70)
      t.cast('downSpecial', 'Texture Surprise — camouflage sur le tissu', 65)
      break
    case 'chrollo':
      t.cast('neutralSpecial', 'Sun and Moon — pose du soleil', 65)
      t.cast('downSpecial', 'Double Face — le marque-page libère la main', 50)
      t.close()
      t.cast('finisher', 'Sun and Moon — seconde marque et détonation', 85)
      break
    case 'benjamin':
      t.cast('forwardSpecial', 'Secret Window — marquage de contact', 75)
      t.cast('neutralSpecial', 'Air Blow — émission et impact', 100)
      break
    case 'tserriednich':
      t.cast('neutralSpecial', 'Futur parallèle — fermeture des yeux et vision', 110)
      t.cast('neutralSpecial', 'Futur parallèle — réouverture et divergence', 60)
      t.advance(70, { right: true }, { left: true })
      break
    case 'feitan':
      t.cast('neutralSpecial', 'Pain Packer — la blessure devient une armure', 100)
      t.cast('finisher', 'Rising Sun — formation du soleil et chaleur', 180)
      break
    case 'saiyu':
      t.cast('neutralSpecial', 'Mizaru — la vue est retirée au contact', 70)
      t.cast('forwardSpecial', 'Kikazaru — l’ouïe est retirée au contact', 70)
      t.cast('downSpecial', 'Iwazaru — la parole est retirée au contact', 100)
      break
    case 'theta':
      t.attack('ranged', 'Pistolet — tir réel, puis impact')
      t.advance(110)
      t.attack('ranged', 'Pistolet — second tir')
      t.advance(95)
      break
    case 'biscuit':
      t.cast('neutralSpecial', 'Biscuit — révélation de la forme véritable', 110)
      t.close()
      t.attack('heavy', 'Forme véritable — impact au corps-à-corps')
      t.advance(110)
      break
    case 'phinks':
      t.cast('neutralSpecial', 'Ripper Cyclotron — rotations réellement accumulées', 130)
      t.cast('finisher', 'Ripper Cyclotron — libération du poing chargé', 120)
      break
    case 'franklin':
      t.cast('neutralSpecial', 'Double Machine Gun — rafale de balles de Nen', 105)
      t.cast('forwardSpecial', 'Double Machine Gun — seconde rafale', 105)
      break
    case 'machi':
      t.cast('neutralSpecial', 'Nen Stitches — suture de la blessure initiale', 65)
      t.cast('forwardSpecial', 'Fil de Nen — liaison avec la cible', 70)
      t.cast('downSpecial', 'Fil de Nen — ligature confirmée', 80)
      break
    case 'illumi':
      t.cast('neutralSpecial', 'Needle People — implantation de l’aiguille', 70)
      t.cast('forwardSpecial', 'Needle People — ordre de rapprochement', 45)
      t.cast('backSpecial', 'Aiguilles — remodelage du visage', 125)
      break
    case 'kalluto':
      t.cast('neutralSpecial', 'Papier — implantation du fragment', 80)
      t.cast('backSpecial', 'Papier — poupée d’écoute', 60)
      t.cast('forwardSpecial', 'Morsure du serpent — le papier converge sur la cible', 100)
      break
    case 'bonolenov':
      t.cast('neutralSpecial', 'Battle Cantabile — danse et armure du Prologue', 100)
      t.cast('finisher', 'Battle Cantabile — danse de Jupiter, puis impact', 170)
      break
    case 'shizuku':
      t.attack('heavy', 'Blinky — coup physique et ouverture d’une plaie')
      t.advance(70)
      t.cast('finisher', 'Blinky — aspiration du sang par la plaie ouverte', 130)
      break
    case 'hinrigh':
      t.cast('neutralSpecial', 'Biohazard — les menottes deviennent un animal', 150)
      t.cast('downSpecial', 'Biohazard — rappel de l’objet', 65)
      break
    case 'mizaistom':
      t.cast('neutralSpecial', 'Cross Game — avertissement jaune', 70)
      t.caption = 'Cross Game — désobéissance puis confinement'
      t.advance(130, {}, { left: true })
      break
    case 'leorio':
      t.cast('neutralSpecial', 'Poing à distance — transmission, émergence et impact', 120)
      t.cast('neutralSpecial', 'Poing à distance — second passage par la surface', 95)
      break
    case 'hanzo':
      t.cast('neutralSpecial', 'Hanzo Skill 4 — séparation et double libre', 80)
      t.caption = 'Hanzo Skill 4 — déplacement du double'
      t.advance(28, { right: true, jump: true })
      t.advance(28, { left: true, down: true })
      t.cast('neutralSpecial', 'Hanzo Skill 4 — retour et réveil du corps', 80)
      break
    case 'rihan':
      t.cast('neutralSpecial', 'Predator — veille', 1)
      t.action('neutralSpecial', 'Hisoka fixe Bungee Gum sous les yeux de Rihan', 'opponent')
      t.advance(45)
      t.ready()
      t.ready('opponent')
      t.caption = 'Predator — étude de la portée et des déplacements'
      t.advance(1, { left: true }, { jump: true })
      t.advance(19, { left: true })
      t.advance(10)
      t.advance(1, { jump: true })
      t.advance(250)
      break
    case 'zakuro':
      t.cast('neutralSpecial', 'Bloody Mary — fil de sang et capture', 100)
      t.cast('forwardSpecial', 'Bloody Mary — projection de la cible', 100)
      break
    case 'melody':
      t.cast('neutralSpecial', 'Musique envoûtante — souffle et performance', 200)
      break
    case 'basho':
      t.cast('neutralSpecial', 'Great Hiker — écriture et achèvement du poème', 130)
      t.close()
      t.attack('heavy', 'Great Hiker — le coup embrase réellement sa cible')
      t.advance(130)
      break
    case 'camilla':
      t.attack('heavy', 'Coup fatal — déclenchement de Cat’s Name', 'opponent')
      t.advance(210)
      break
    case 'halkenburg':
      t.cast('neutralSpecial', 'Grimmel — flèche de volonté et possession', 200)
      break
    case 'gel':
      t.cast('neutralSpecial', 'Bras-serpent — extension, contact et rétraction', 110)
      t.cast('forwardSpecial', 'Bras-serpent — nouvelle frappe', 100)
      break
    case 'lynch':
      t.cast('neutralSpecial', 'Body and Soul — question posée à la cible', 55)
      t.attack('heavy', 'Body and Soul — le coup fait entendre la réponse')
      t.advance(110)
      break
    case 'luini':
      t.cast('neutralSpecial', 'Téléportation — ancrage de la pièce préparée', 70)
      t.advance(30, { right: true })
      t.cast('neutralSpecial', 'Téléportation — retour effectif à la pièce', 100)
      break
    case 'bill':
      t.cast('neutralSpecial', 'Erigeron — croissance de la graine touchée', 150)
      break
    case 'furykov':
      t.cast('neutralSpecial', 'Combo Master — activation de la console', 65)
      t.caption = 'L’adversaire prépare une attaque dissimulée avec In'
      t.advance(30, {}, { hatsu: true })
      t.action('neutralSpecial', 'Combo Master — lecture d’une manifestation adverse', 'opponent')
      t.advance(130, {}, { conceal: true })
      break
    case 'cluck':
      t.cast('neutralSpecial', 'Pigeon — prise de contrôle et mission de livraison', 200)
      break
    case 'beyond':
      t.cast('forwardSpecial', 'Technique martiale — engagement et impact', 120)
      t.close()
      t.attack('heavy', 'Nen fondamental — frappe au corps-à-corps')
      t.advance(85)
      break
    case 'longhi': {
      t.cast('neutralSpecial', 'Moonlight Act — première signature et offre', 75)
      const before = t.state
      t.state = respondMoonlightContract({ state: t.state, side: 'opponent', accept: true })
      t.observe(before)
      t.caption = 'Moonlight Act — seconde signature volontaire'
      t.advance(90)
      t.attack('light', 'Moonlight Act — violation du pacte et Zetsu imposé', 'opponent')
      t.advance(120)
      break
    }
    case 'musse':
      t.cast('neutralSpecial', 'Secret Window — attachement du hibou', 100)
      t.attack('light', 'Secret Window — surveillance d’une action adverse', 'opponent')
      t.advance(100)
      break
    case 'padaille':
      t.cast('neutralSpecial', 'Bras-outil — transformation et impact', 100)
      t.cast('forwardSpecial', 'Bras-outil — changement d’outil', 100)
      break
    case 'sayird':
      t.cast('neutralSpecial', 'Little Eye — prise de contrôle de l’animal', 180)
      break
    case 'terebellum':
      t.action('neutralSpecial', 'Sweet Home — la main gauche établit le contact')
      t.advance(3)
      t.attack('heavy', 'Sweet Home — le coup adverse est transféré à son auteur', 'opponent')
      t.advance(160)
      break
    case 'voconte':
      t.cast('neutralSpecial', 'Door — connexion des seuils préparés', 65)
      t.caption = 'Door — franchissement réel d’un seuil'
      t.advance(130, { left: true })
      break
    case 'yokotani':
      t.cast('neutralSpecial', 'LSDF — gardes invoqués contre l’intrus', 260)
      break
  }
  return t.finish()
}
export function makeFilm(spacious = false) {
  return Object.keys(CINEMATIC_CATALOGUE).map((id) => makeChapter(id as FighterId, spacious))
}
