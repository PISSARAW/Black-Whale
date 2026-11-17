import { FIGHTING_ROSTER } from '../roster'
import type { FighterId } from '../types'
import type { SoloEncounter, SoloRoute, SoloRun, SoloMode } from './types'
const stage = 'heavens-arena' as const
export const SOLO_ENCOUNTERS: readonly SoloEncounter[] = [
  {
    id: 'hidden-tether',
    player: 'kurapika',
    opponent: 'hisoka',
    stage,
    goal: 'reveal',
    script: 'idle',
    limit: 1200,
    title: ['Le lien invisible', 'The hidden tether'],
    instruction: [
      'Perçois le lien avec Gyo pendant trente frames. Le voir ne le dissipe pas.',
      'Perceive the tether with Gyo for thirty frames. Seeing it does not dispel it.',
    ],
    premises: [
      'Kurapika et Hisoka ont leurs équipements ordinaires. Un lien de Bungee Gum est déjà attaché et caché par In. Aucun allié. Terrain neutre ; la nature exacte du lien doit être perçue.',
      'Kurapika and Hisoka have their ordinary equipment. A Bungee Gum tether is already attached and hidden with In. No allies. Neutral stage; the tether must actually be perceived.',
    ],
  },
  {
    id: 'windup',
    player: 'hisoka',
    opponent: 'phinks',
    stage,
    goal: 'interrupt',
    script: 'idle',
    limit: 600,
    title: ['Avant le premier tour', 'Before the first rotation'],
    instruction: [
      'Touche Phinks pendant sa rotation du bras droit et constate son interruption avant un tour achevé.',
      'Hit Phinks during the right-arm rotation and interrupt it before one rotation completes.',
    ],
    premises: [
      'Hisoka n’a aucune capacité ajoutée. Phinks vient de commencer une rotation réelle, encore sans charge acquise. Aucun allié, équipement ou territoire supplémentaire.',
      'Hisoka receives no extra ability. Phinks has just started an actual rotation, with no completed charge. No additional allies, equipment or territory.',
    ],
  },
  {
    id: 'question',
    player: 'lynch',
    opponent: 'hisoka',
    stage,
    goal: 'question',
    script: 'idle',
    limit: 1200,
    title: ['Une question, puis un contact', 'A question, then contact'],
    instruction: [
      'Pose une question avec Hatsu puis porte un véritable coup de poing à une cible encore consciente. Obtiens une réponse de Body and Soul.',
      'Ask with Hatsu, then land a real fist strike on a conscious target. Obtain a Body and Soul reply.',
    ],
    premises: [
      'Lynch utilise son propre Body and Soul. Hisoka est conscient, à portée de voix. Aucun allié ni matériel prêté. La réponse doit provenir du contact, pas d’une lecture du scénario.',
      'Lynch uses her own Body and Soul. Hisoka is conscious and within hearing range. No allies or borrowed equipment. The reply must come from contact, not scenario data.',
    ],
  },
  {
    id: 'crate',
    player: 'kurapika',
    opponent: 'franklin',
    stage: 'whale-hold',
    goal: 'protect-crate',
    script: 'fire',
    limit: 1200,
    duration: 600,
    title: ['Garder la caisse intacte', 'Keep the crate standing'],
    instruction: [
      'Garde la caisse réelle à gauche présente pendant dix secondes, en restant vivant. Intercepte ou interromps les tirs avec les moyens du duel.',
      'Keep the real crate on the left present for ten seconds while staying alive. Intercept or interrupt shots using ordinary duel actions.',
    ],
    premises: [
      'Une seule caisse destructible est déjà placée à gauche. Kurapika est entre elle et Franklin, qui tire depuis la droite. Aucun allié. La caisse n’est ni une protection de Nen ni un équipement obtenu par copie.',
      'One destructible crate is already placed on the left. Kurapika stands between it and Franklin, who fires from the right. No allies. The crate is neither Nen protection nor equipment obtained by copying.',
    ],
  },
  {
    id: 'return-body',
    player: 'hanzo',
    opponent: 'franklin',
    stage,
    goal: 'protect-body',
    script: 'idle',
    limit: 1200,
    title: ['Le corps resté derrière', 'The body left behind'],
    instruction: [
      'Rejoins ton corps, réintègre-le avec Hatsu, puis garde bas un tir réel. Un impact non gardé fait échouer la protection.',
      'Return to your body, rejoin with Hatsu, then crouch-guard an actual shot. An unguarded hit fails the protection.',
    ],
    premises: [
      'Le double de Hanzo a réellement été projeté ; son corps endormi reste vulnérable. Franklin a déjà émis une rafale basse. Aucun allié ni corps de remplacement.',
      'Hanzo’s double has actually been projected; his sleeping body remains vulnerable. Franklin has already emitted a low volley. No allies or replacement body.',
    ],
  },
  {
    id: 'hold-line',
    player: 'kurapika',
    opponent: 'franklin',
    stage: 'observation-deck',
    goal: 'survive',
    script: 'fire',
    limit: 1200,
    duration: 900,
    title: ['Tenir sous les tirs', 'Hold under fire'],
    instruction: [
      'Reste vivant pendant quinze secondes. Garde, déplacement et interruptions utilisent les coûts et fenêtres ordinaires.',
      'Stay alive for fifteen seconds. Guard, movement and interruptions use ordinary costs and windows.',
    ],
    premises: [
      'Kurapika et Franklin commencent à distance, sans allié ni couvert. Les ressources sont finies ; Franklin répète ses tirs tant que les règles le permettent.',
      'Kurapika and Franklin start apart, without allies or cover. Resources are finite; Franklin repeats shots only while the rules allow them.',
    ],
  },
  ...(['franklin', 'phinks', 'chrollo'] as const).map((opponent, index): SoloEncounter => ({
    id: `duel-${opponent}`,
    player: 'selected',
    opponent,
    stage,
    goal: 'win-round',
    script: 'ai',
    limit: 6000,
    title: [
      `Duel ${index + 1} · ${FIGHTING_ROSTER.find((f) => f.id === opponent)!.name}`,
      `Duel ${index + 1} · ${FIGHTING_ROSTER.find((f) => f.id === opponent)!.name}`,
    ],
    instruction: [
      'Gagne une manche réelle face à l’IA. Un résultat nul ou une défaite ne valide pas la rencontre.',
      'Win an actual round against the AI. A draw or loss does not clear the encounter.',
    ],
    premises: [
      'Duel ordinaire en une manche, équipement personnel, sans allié ni ressource scénarisée. Chrollo conserve le chargement du duel, pas un catalogue de pages accordées pour le parcours.',
      'Ordinary single-round duel, personal equipment, no allies or scenario resources. Chrollo keeps the duel loadout, not a catalogue of pages granted for this route.',
    ],
  })),
]
export const SOLO_ROUTES: readonly SoloRoute[] = [
  {
    id: 'reading',
    title: ['Lire une manifestation', 'Read a manifestation'],
    encounters: ['hidden-tether', 'windup', 'question'],
    ending: [
      'Tu as distingué ce qui se perçoit, ce qui se prépare et ce qui exige un contact. Cette rencontre originale de Clash se termine sur une information obtenue.',
      'You distinguished perception, preparation and contact conditions. This original Clash encounter ends with information actually obtained.',
    ],
    reward: ['Éclaireur', 'Scout'],
  },
  {
    id: 'escort',
    title: ['Protéger et tenir', 'Protect and hold'],
    encounters: ['crate', 'return-body', 'hold-line'],
    ending: [
      'L’objet protégé et le corps revenu restent des réalités du combat. Tu as tenu la position sans recevoir de pouvoir supplémentaire.',
      'The protected object and the returned body remain physical combat realities. You held the position without receiving an additional power.',
    ],
    reward: ['Sentinelle', 'Sentinel'],
  },
  {
    id: 'duelist',
    title: ['Traverser les duels', 'Through the duels'],
    encounters: ['duel-franklin', 'duel-phinks', 'duel-chrollo'],
    ending: [
      'Les trois rencontres ont chacune produit une victoire réelle. Le parcours s’achève ici ; son titre ne change ni aura ni conditions.',
      'Each of the three encounters produced an actual victory. The route ends here; its title changes neither aura nor conditions.',
    ],
    reward: ['Finaliste', 'Finalist'],
  },
]
export const SURVIVAL_FIGHTERS: readonly FighterId[] = [
  'kurapika',
  'hisoka',
  'franklin',
  'phinks',
  'hanzo',
  'bill',
]
export const SOLO_MODES: readonly {
  id: SoloMode
  title: readonly [string, string]
  description: readonly [string, string]
}[] = [
  {
    id: 'story',
    title: ['Parcours scénarisés', 'Scenario routes'],
    description: [
      'Trois rencontres et une fin originale. Sauvegarde entre les rencontres.',
      'Three encounters and an original ending. Saves between encounters.',
    ],
  },
  {
    id: 'survival',
    title: ['Survie', 'Survival'],
    description: [
      'Cinq manches. PV et aura conservés, avec les remises en manche ordinaires. Six combattants de référence disponibles.',
      'Five rounds. Health and aura carry over with ordinary round boundaries. Six reference fighters available.',
    ],
  },
  {
    id: 'time-attack',
    title: ['Contre-la-montre', 'Time Attack'],
    description: [
      'Trois victoires dans un budget de trois minutes simulées. Ressources ordinaires à chaque rencontre.',
      'Three wins within three simulated minutes. Ordinary resources for each encounter.',
    ],
  },
  {
    id: 'score-attack',
    title: ['Score Attack', 'Score Attack'],
    description: [
      'Marque sur les dégâts et contacts réels pendant trois minutes. Aucun résultat n’est envoyé au classement.',
      'Score actual damage and contacts for three minutes. No result is sent to the leaderboard.',
    ],
  },
]
export function encounterIds(run: Pick<SoloRun, 'mode' | 'route'>): readonly string[] {
  if (run.mode === 'story') return SOLO_ROUTES.find((r) => r.id === run.route)!.encounters
  if (run.mode === 'survival')
    return ['duel-franklin', 'duel-phinks', 'duel-chrollo', 'duel-franklin', 'duel-phinks']
  return ['duel-franklin', 'duel-phinks', 'duel-chrollo']
}
export function soloEncounter(run: Pick<SoloRun, 'mode' | 'route' | 'index'>): SoloEncounter {
  const found = SOLO_ENCOUNTERS.find((e) => e.id === encounterIds(run)[run.index])
  if (!found) throw Error('INVALID_SOLO_ENCOUNTER')
  return found
}
