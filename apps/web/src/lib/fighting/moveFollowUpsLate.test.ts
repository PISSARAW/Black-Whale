import { describe, expect, it } from 'vitest'
import { moveForSlot, movesetFor } from './movesets'
import type { FighterId } from './types'

describe('wave 3, wave 4 and final roster signature moves and follow-ups', () => {
  it.each([
    [
      'rihan',
      {
        forwardLight: ['Regard prédateur', 'Predator Gaze'],
        forwardHeavy: ['Pas sans hypothèse', 'Hypothesis-Free Step'],
        backHeavy: ['Analyse interrompue', 'Interrupted Analysis'],
        airHeavy: ['Erreur enregistrée', 'Recorded Error'],
        throw: ['Predator', 'Predator'],
      },
    ],
    [
      'zakuro',
      {
        forwardLight: ['Gouttes éclaireuses', 'Scouting Drops'],
        forwardHeavy: ['Fil rouge', 'Red Thread'],
        backHeavy: ['Reflux', 'Backflow'],
        airHeavy: ['Aiguille sanguine', 'Blood Needle'],
        throw: ['Bloody Mary', 'Bloody Mary'],
      },
    ],
    [
      'melody',
      {
        forwardLight: ['Mesure brisée', 'Broken Measure'],
        forwardHeavy: ['Note apaisante', 'Soothing Note'],
        backHeavy: ['Souffle suspendu', 'Suspended Breath'],
        airHeavy: ['Battement entendu', 'Heard Heartbeat'],
        throw: ['Trois minutes de silence', 'Three Minutes of Silence'],
      },
    ],
    [
      'basho',
      {
        forwardLight: ['Trait de pinceau', 'Brush Stroke'],
        forwardHeavy: ['Vers interrompu', 'Interrupted Verse'],
        backHeavy: ['Papier sacrifié', 'Sacrificed Paper'],
        airHeavy: ['Rime de feu', 'Fire Rhyme'],
        throw: ['Dernier tercet', 'Final Tercet'],
      },
    ],
    [
      'camilla',
      {
        forwardLight: ['Marche impériale', 'Imperial March'],
        forwardHeavy: ['Giflé royale', 'Royal Slap Strike'],
        backHeavy: ['Fausse ouverture', 'False Opening'],
        airHeavy: ['Tir de provocation', 'Provocation Shot'],
        throw: ['Cat’s Name', 'Cat’s Name'],
      },
    ],
    [
      'halkenburg',
      {
        forwardLight: ['Pas de procession', 'Procession Step'],
        forwardHeavy: ['Épaule fraternelle', 'Fraternal Shoulder'],
        backHeavy: ['Mur d’unisson', 'Unison Wall'],
        airHeavy: ['Arc du prince', 'Prince’s Bow'],
        throw: ['Flèche de Grimmel', 'Grimmel’s Arrow'],
      },
    ],
    [
      'gel',
      {
        forwardLight: ['Crochet de vipère', 'Viper Hook'],
        forwardHeavy: ['Mue basse', 'Low Shedding'],
        backHeavy: ['Frappe à deux temps', 'Two-Beat Strike'],
        airHeavy: ['Spirale constrictrice', 'Constricting Spiral'],
        throw: ['Croc du Zodiaque', 'Zodiac Fang'],
      },
    ],
    [
      'lynch',
      {
        forwardLight: ['Question directe', 'Direct Question'],
        forwardHeavy: ['Réponse du corps', 'Body’s Answer'],
        backHeavy: ['Silence suspect', 'Suspicious Silence'],
        airHeavy: ['Interrogatoire croisé', 'Cross-Interrogation'],
        throw: ['Aveu forcé', 'Forced Confession'],
      },
    ],
    [
      'luini',
      {
        forwardLight: ['Porte dérobée', 'Hidden Door'],
        forwardHeavy: ['Couloir meurtrier', 'Deadly Corridor'],
        backHeavy: ['Pièce condamnée', 'Sealed Room'],
        airHeavy: ['Fausse sortie', 'False Exit'],
        throw: ['Tour du monde intérieur', 'Inner World Tour'],
      },
    ],
    [
      'bill',
      {
        forwardLight: ['Garde du berceau', 'Cradle Guard'],
        forwardHeavy: ['Paume de croissance', 'Growth Palm'],
        backHeavy: ['Relève du garde', 'Guard Relief'],
        airHeavy: ['Liane d’obstacle', 'Obstacle Vine'],
        throw: ['Croissance d’urgence', 'Emergency Growth'],
      },
    ],
    [
      'furykov',
      {
        forwardLight: ['Test de garde', 'Guard Test'],
        forwardHeavy: ['Lecture des yeux', 'Eye Read'],
        backHeavy: ['Punition du novice', 'Novice Punishment'],
        airHeavy: ['Pression graduée', 'Graduated Pressure'],
        throw: ['Combo Master', 'Combo Master'],
      },
    ],
    [
      'cluck',
      {
        forwardLight: ['Aile rasante', 'Skimming Wing'],
        forwardHeavy: ['Relais aérien', 'Aerial Relay'],
        backHeavy: ['Rappel du perchoir', 'Perch Recall'],
        airHeavy: ['Battement aveuglant', 'Blinding Wingbeat'],
        throw: ['Volée du Zodiaque', 'Zodiac Flock'],
      },
    ],
    [
      'beyond',
      {
        forwardLight: ['Pas du Continent Sombre', 'Dark Continent Step'],
        forwardHeavy: ['Prise de l’explorateur', 'Explorer’s Grapple'],
        backHeavy: ['Instinct de survie', 'Survival Instinct'],
        airHeavy: ['Franchissement interdit', 'Forbidden Crossing'],
        throw: ['Dette de l’expédition', 'Expedition Debt'],
      },
    ],
    [
      'longhi',
      {
        forwardLight: ['Clause d’approche', 'Approach Clause'],
        forwardHeavy: ['Signature forcée', 'Forced Signature'],
        backHeavy: ['Sanction contractuelle', 'Contractual Sanction'],
        airHeavy: ['Trêve de cinq secondes', 'Five-Second Truce'],
        throw: ['Dernier avenant', 'Final Rider'],
      },
    ],
    [
      'musse',
      {
        forwardLight: ['Tir couvert', 'Covered Shot'],
        forwardHeavy: ['Hibou au contact', 'Contact Owl'],
        backHeavy: ['Faux rapport', 'False Report'],
        airHeavy: ['Écoute croisée', 'Cross-Listening'],
        throw: ['Exécution surveillée', 'Monitored Execution'],
      },
    ],
    [
      'padaille',
      {
        forwardLight: ['Marteau d’abattage', 'Slaughter Hammer'],
        forwardHeavy: ['Foret de percée', 'Piercing Drill'],
        backHeavy: ['Changement en impact', 'Impact Shift'],
        airHeavy: ['Hache de retour', 'Returning Axe'],
        throw: ['Trois outils, une victime', 'Three Tools, One Victim'],
      },
    ],
    [
      'sayird',
      {
        forwardLight: ['Regard déporté', 'Remote Gaze'],
        forwardHeavy: ['Angle de Little Eye', 'Little Eye Angle'],
        backHeavy: ['Appât vivant', 'Living Bait'],
        airHeavy: ['Rappel sensoriel', 'Sensory Recall'],
        throw: ['Surveillance totale', 'Total Surveillance'],
      },
    ],
    [
      'terebellum',
      {
        forwardLight: ['Main gauche réceptrice', 'Receiving Left Hand'],
        forwardHeavy: ['Main droite relais', 'Relay Right Hand'],
        backHeavy: ['Fausse vulnérabilité', 'False Vulnerability'],
        airHeavy: ['Passage croisé', 'Crossed Passage'],
        throw: ['Sweet Home', 'Sweet Home'],
      },
    ],
    [
      'voconte',
      {
        forwardLight: ['Cadre d’entrée', 'Entry Frame'],
        forwardHeavy: ['Pas de seuil', 'Threshold Step'],
        backHeavy: ['Porte refermée', 'Closed Door'],
        airHeavy: ['Retour de battant', 'Swinging Return'],
        throw: ['Labyrinthe domestique', 'Domestic Labyrinth'],
      },
    ],
    [
      'yokotani',
      {
        forwardLight: ['Objection', 'Objection'],
        forwardHeavy: ['Constat d’intrusion', 'Trespass Record'],
        backHeavy: ['Expulsion ordonnée', 'Ordered Expulsion'],
        airHeavy: ['Assignation', 'Summons'],
        throw: ['LSDF', 'LSDF'],
      },
    ],
  ] as const)('replaces the five generic physical slots and attaches follow-ups for %s', (id, map) => {
    const moveset = movesetFor(id as FighterId)!
    expect(moveset.followUps?.length).toBeGreaterThanOrEqual(2)
    for (const [slot, [fr, en]] of Object.entries(map)) {
      const move = moveForSlot(id as FighterId, slot as keyof typeof map)!
      expect(move.nameFr).toBe(fr)
      expect(move.nameEn).toBe(en)
    }
  })
})
