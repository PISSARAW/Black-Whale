import { describe, expect, it } from 'vitest'
import { moveForSlot, movesetFor } from './movesets'
import type { FighterId } from './types'

describe('wave 3, wave 4 and final roster signature moves and follow-ups', () => {
  it.each([
    [
      'rihan',
      {
        forwardLight: ['Pas de confirmation', 'Confirming Step'],
        forwardHeavy: ['Arrêt du talon', 'Heel Stop'],
        backHeavy: ['Riposte à la faute', 'Mistake Punish'],
        airHeavy: ['Talon d’interception', 'Intercepting Heel'],
        throw: ['Le piège patient', 'The Patient Snare'],
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
        forwardLight: ['Frappe du trait bref', 'Short-Stroke Fist'],
        forwardHeavy: ['Talon de fermeture', 'Closing Heel'],
        backHeavy: ['Poing en retrait', 'Retreating Fist'],
        airHeavy: ['Talon du dernier vers', 'Final-Line Heel'],
        throw: ['Le cinquième vers', 'The Fifth Line'],
      },
    ],
    [
      'camilla',
      {
        forwardLight: ['Gifle en passant', 'Passing Slap'],
        forwardHeavy: ['Paume provocatrice', 'Provoking Palm'],
        backHeavy: ['Revers de riposte', 'Riposte Slap'],
        airHeavy: ['Pointe du pied', 'Pointed Heel'],
        throw: ['L’audience est levée', 'Audience Dismissed'],
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
        forwardLight: ['Relance en direct', 'Straight Follow-up'],
        forwardHeavy: ['Percée au plexus', 'Body Breakthrough'],
        backHeavy: ['Contre à bout portant', 'Close-Range Counter'],
        airHeavy: ['Crochet du raccourci', 'Shortcut Hook'],
        throw: ['Répondez donc', 'Answer Me'],
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
        forwardLight: ['Direct du changement de garde', 'Switch-Stance Straight'],
        forwardHeavy: ['Contre du bras arrière', 'Rear-Hand Counter'],
        backHeavy: ['Contre sur le retrait', 'Pull Counter'],
        airHeavy: ['Crochet plongeant', 'Diving Hook'],
        throw: ['L’angle mort', 'The Blind Spot'],
      },
    ],
    [
      'cluck',
      {
        forwardLight: ['Pas de relais', 'Relay Step'],
        forwardHeavy: ['Coupe en traversée', 'Crossing Cut'],
        backHeavy: ['Talon de repli', 'Retreating Heel'],
        airHeavy: ['Talon en plein vol', 'Airborne Heel'],
        throw: ['Sous l’aile', 'Underwing'],
      },
    ],
    [
      'beyond',
      {
        forwardLight: ['Poing de déblai', 'Clearing Fist'],
        forwardHeavy: ['Charge à double appui', 'Braced Charge'],
        backHeavy: ['Contrepoids', 'Counterweight'],
        airHeavy: ['Retombée des deux poings', 'Double-Fist Drop'],
        throw: ['Le col du géant', 'The Giant’s Pass'],
      },
    ],
    [
      'longhi',
      {
        forwardLight: ['Avance mesurée', 'Measured Advance'],
        forwardHeavy: ['Reprise des termes', 'Revised Terms'],
        backHeavy: ['Retrait de l’offre', 'Offer Withdrawn'],
        airHeavy: ['Clôture du délai', 'Deadline'],
        throw: ['La clause de sortie', 'Exit Clause'],
      },
    ],
    [
      'musse',
      {
        forwardLight: ['Interception en ligne', 'Line Intercept'],
        forwardHeavy: ['Botte d’arrêt', 'Stop Kick'],
        backHeavy: ['Sortie de l’axe', 'Off the Line'],
        airHeavy: ['Talonnade de repli', 'Falling Heel'],
        throw: ['Le passage sous garde', 'Under Guard'],
      },
    ],
    [
      'padaille',
      {
        forwardLight: ['Percée du poing', 'Boring Fist'],
        forwardHeavy: ['Abattée de l’avant-bras', 'Felling Forearm'],
        backHeavy: ['Retour de la main libre', 'Free-Hand Return'],
        airHeavy: ['Marteau en chute', 'Falling Hammer'],
        throw: ['Le bras de levier', 'The Lever Arm'],
      },
    ],
    [
      'sayird',
      {
        forwardLight: ['Entrée en crochet', 'Entry Hook'],
        forwardHeavy: ['Marteau de couverture', 'Covering Hammer'],
        backHeavy: ['Direct de couverture', 'Covering Cross'],
        airHeavy: ['Poing vers le sol', 'Downward Punch'],
        throw: ['Hors du champ', 'Out of Sight'],
      },
    ],
    [
      'terebellum',
      {
        forwardLight: ['Pas de contact', 'Contact Step'],
        forwardHeavy: ['Remontée du poing', 'Rising Return'],
        backHeavy: ['Paume d’écartement', 'Separation Palm'],
        airHeavy: ['Direct de tout le poids', 'Weighted Cross'],
        throw: ['Le relais des paumes', 'Palm Relay'],
      },
    ],
    [
      'voconte',
      {
        forwardLight: ['Franchissement sec', 'Quick Crossing'],
        forwardHeavy: ['Porte battante', 'Swinging Door'],
        backHeavy: ['Hors du chambranle', 'Out of the Doorway'],
        airHeavy: ['Verrou descendant', 'Dropping Bolt'],
        throw: ['Après vous', 'After You'],
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
  ] as const)(
    'replaces the five generic physical slots and attaches follow-ups for %s',
    (id, map) => {
      const moveset = movesetFor(id as FighterId)!
      expect(moveset.followUps?.length).toBeGreaterThanOrEqual(2)
      for (const [slot, [fr, en]] of Object.entries(map)) {
        const move = moveForSlot(id as FighterId, slot as keyof typeof map)!
        expect(move.nameFr).toBe(fr)
        expect(move.nameEn).toBe(en)
      }
    },
  )
})
