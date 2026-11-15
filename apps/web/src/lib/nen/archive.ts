export type ArchiveLocale = 'en' | 'fr'

export type NenArchiveKind =
  | 'guardian'
  | 'skill-book'
  | 'black-voice'
  | 'ghostwriter'
  | 'predator'
  | 'benjamin-guardian'
  | 'halkenburg-guardian'
  | 'tserriednich-guardian'
  | 'tserriednich-second'
  | 'camilla-guardian'
  | 'tubeppa-guardian'
  | 'zhang-lei-guardian'
  | 'tyson-guardian'
  | 'luzurus-guardian'
  | 'sale-sale-guardian'
  | 'momoze-guardian'
  | 'marayam-guardian'
  | 'cats-name'
  | 'stealth-dolphin'
  | 'cookie-chan'
  | 'blood-snakes'
  | 'nen-spider'
  | 'blinky'
  | 'dowsing-chain'
  | 'judgment-chain'
  | 'melody-flute'
  | 'moonlight-contract'
  | 'magical-worm'
  | 'fun-fun-cloth'
  | 'pain-packer'
  | 'jupiter'
  | 'indoor-fish'
  | 'secret-window'
  | 'without-you'
  | 'biohazard'
  | 'lsdf-guards'

export type NenArchiveEntry = {
  id: string
  kind: NenArchiveKind
  number: string
  category: 'beast' | 'object' | 'construct'
  color: string
  accent: string
  name: Record<ArchiveLocale, string>
  alias: Record<ArchiveLocale, string>
  environment: Record<ArchiveLocale, string>
  description: Record<ArchiveLocale, string>
  technique: Record<ArchiveLocale, string>
  techniqueDescription: Record<ArchiveLocale, string>
  traits: Record<ArchiveLocale, string[]>
  sound: 'growl' | 'paper' | 'signal' | 'whisper' | 'chime'
}

type Pair<T> = [en: T, fr: T]

function entry(
  value: Omit<
    NenArchiveEntry,
    | 'name'
    | 'alias'
    | 'environment'
    | 'description'
    | 'technique'
    | 'techniqueDescription'
    | 'traits'
  > & {
    name: Pair<string>
    alias: Pair<string>
    environment: Pair<string>
    description: Pair<string>
    technique: Pair<string>
    techniqueDescription: Pair<string>
    traits: [Pair<string>, Pair<string>, Pair<string>]
  },
): NenArchiveEntry {
  const localized = <T>(pair: Pair<T>): Record<ArchiveLocale, T> => ({ en: pair[0], fr: pair[1] })
  return {
    ...value,
    name: localized(value.name),
    alias: localized(value.alias),
    environment: localized(value.environment),
    description: localized(value.description),
    technique: localized(value.technique),
    techniqueDescription: localized(value.techniqueDescription),
    traits: {
      en: value.traits.map((trait) => trait[0]),
      fr: value.traits.map((trait) => trait[1]),
    },
  }
}

export const NEN_ARCHIVE_ENTRIES: NenArchiveEntry[] = [
  {
    id: 'nasubi-guardian-spirit-beast',
    kind: 'guardian',
    number: 'N-001',
    category: 'beast',
    color: '#c7bcb0',
    accent: '#eee9dd',
    name: { en: "Nasubi's Guardian Spirit Beast", fr: 'Bête gardienne de Nasubi' },
    alias: { en: 'Symbiotic royal parasite', fr: 'Parasite royal symbiotique' },
    environment: {
      en: 'Royal procession · upper decks',
      fr: 'Procession royale · ponts supérieurs',
    },
    description: {
      en: "King Nasubi's massive Guardian Spirit Beast: a symbiotic parasite with two lateral bodies, repeated fleshy mounds and human-handed limbs.",
      fr: 'La gigantesque bête gardienne du roi Nasubi : un parasite symbiotique formé de deux masses latérales, de monticules charnus et de membres terminés par des mains humaines.',
    },
    technique: { en: 'Protective manifestation', fr: 'Manifestation protectrice' },
    techniqueDescription: {
      en: 'The beast unfolds its aura and marks every presence entering its defensive territory.',
      fr: 'La bête déploie son aura et marque toute présence qui pénètre dans son territoire défensif.',
    },
    traits: {
      en: ['Autonomous', 'Parasitic', 'Specialization'],
      fr: ['Autonome', 'Parasite', 'Spécialisation'],
    },
    sound: 'growl',
  },
  {
    id: 'bandits-secret',
    kind: 'skill-book',
    number: 'C-014',
    category: 'object',
    color: '#b98a66',
    accent: '#e6c76a',
    name: { en: "Bandit's Secret", fr: 'Skill Hunter' },
    alias: { en: 'Conjured ability book', fr: 'Livre de capacités matérialisé' },
    environment: { en: 'Closed room · stolen archive', fr: 'Pièce close · archive volée' },
    description: {
      en: 'A conjured book that stores stolen abilities. The selected page must remain open while its power is being used.',
      fr: 'Un livre matérialisé qui conserve les capacités volées. La page choisie doit rester ouverte pendant l’utilisation du pouvoir.',
    },
    technique: { en: 'Open the stolen page', fr: 'Ouvrir la page volée' },
    techniqueDescription: {
      en: 'The cover unlocks, the pages turn and the selected technique answers its new owner.',
      fr: 'La couverture se déverrouille, les pages tournent et la technique choisie répond à son nouveau propriétaire.',
    },
    traits: {
      en: ['Conjuration', 'Ability theft', 'Strict conditions'],
      fr: ['Matérialisation', 'Vol de capacité', 'Conditions strictes'],
    },
    sound: 'paper',
  },
  {
    id: 'black-voice',
    kind: 'black-voice',
    number: 'C-021',
    category: 'object',
    color: '#7ea5b9',
    accent: '#d6dbe0',
    name: { en: 'Black Voice', fr: 'Black Voice' },
    alias: { en: 'Manipulation phone', fr: 'Téléphone de manipulation' },
    environment: {
      en: 'Surveillance corridor · signal locked',
      fr: 'Couloir sous surveillance · signal verrouillé',
    },
    description: {
      en: 'A phone paired with antennae. Once an antenna is planted in a target, typed commands control the body like a remote terminal.',
      fr: 'Un téléphone associé à des antennes. Une fois l’antenne plantée dans une cible, les commandes saisies contrôlent son corps comme un terminal distant.',
    },
    technique: { en: 'Transmit command', fr: 'Transmettre la commande' },
    techniqueDescription: {
      en: 'A coded instruction crosses the locked channel and forces the marked target to execute it.',
      fr: 'Une instruction codée traverse le canal verrouillé et force la cible marquée à l’exécuter.',
    },
    traits: {
      en: ['Manipulation', 'Remote control', 'Antenna condition'],
      fr: ['Manipulation', 'Contrôle à distance', 'Condition d’antenne'],
    },
    sound: 'signal',
  },
  {
    id: 'lovely-ghostwriter',
    kind: 'ghostwriter',
    number: 'C-027',
    category: 'construct',
    color: '#dca4cf',
    accent: '#f2d4a6',
    name: { en: 'Lovely Ghostwriter', fr: 'Lovely Ghostwriter' },
    alias: { en: 'Nostrade prophecy spirit', fr: 'Esprit prophétique de Nostrade' },
    environment: {
      en: 'Nostrade office · midnight session',
      fr: 'Bureau Nostrade · séance de minuit',
    },
    description: {
      en: 'A spectral Nen construct that takes the user’s hand and writes a four-part prophecy while its author remains unaware of the text.',
      fr: 'Une construction spectrale de Nen qui guide la main de l’utilisatrice et écrit une prophétie en quatre parties, sans qu’elle connaisse le texte.',
    },
    technique: { en: 'Automatic prophecy', fr: 'Prophétie automatique' },
    techniqueDescription: {
      en: 'The spectre awakens, borrows the hand and traces the coming weeks in verse.',
      fr: 'Le spectre s’éveille, emprunte la main et trace en vers les semaines à venir.',
    },
    traits: {
      en: ['Specialization', 'Automatic writing', 'Future sight'],
      fr: ['Spécialisation', 'Écriture automatique', 'Vision du futur'],
    },
    sound: 'whisper',
  },
  {
    id: 'rihan-predator',
    kind: 'predator',
    number: 'C-032',
    category: 'construct',
    color: '#b7ada3',
    accent: '#eee9dd',
    name: { en: "Rihan's Predator", fr: 'Predator de Rihan' },
    alias: {
      en: 'Target-specific Nen predator',
      fr: 'Prédateur de Nen spécifique à la cible',
    },
    environment: {
      en: "Prince Salé-salé's quarters · countermeasure",
      fr: 'Quartiers du prince Salé-salé · contre-mesure',
    },
    description: {
      en: 'A Nen beast engineered after a long analysis of one specific ability. This recorded form is the four-lobed maw created against Salé-salé’s smoke beast.',
      fr: 'Une bête de Nen conçue après une longue analyse d’une capacité précise. Cette forme documentée est la gueule à quatre lobes créée contre la bête de fumée de Salé-salé.',
    },
    technique: { en: 'Predator deployment', fr: 'Déploiement de Predator' },
    techniqueDescription: {
      en: 'The completed counter-beast opens its concentric maw and consumes the ability it was designed to destroy.',
      fr: 'La bête de contre-mesure achevée ouvre sa gueule concentrique et dévore la capacité qu’elle a été conçue pour détruire.',
    },
    traits: {
      en: ['Conjuration', 'Countermeasure', 'Target-specific'],
      fr: ['Matérialisation', 'Contre-mesure', 'Spécifique à la cible'],
    },
    sound: 'growl',
  },
  entry({
    id: 'benjamin-guardian-spirit-beast',
    kind: 'benjamin-guardian',
    number: 'N-002',
    category: 'beast',
    color: '#c9b8a2',
    accent: '#ead8ba',
    sound: 'growl',
    name: ["Benjamin's Guardian Spirit Beast", 'Bête gardienne de Benjamin'],
    alias: ['Armoured royal parasite', 'Parasite royal cuirassé'],
    environment: ["Benjamin's quarters · Tier 1", 'Quartiers de Benjamin · Niveau 1'],
    description: [
      'A tall humanoid Guardian Spirit Beast armed with claws, spines and mantle-like wings.',
      'Une imposante bête gardienne humanoïde, armée de griffes, d’épines et d’ailes semblables à un manteau.',
    ],
    technique: ['Royal intimidation', 'Intimidation royale'],
    techniqueDescription: [
      'The beast spreads its wings and saturates the room with a predatory aura.',
      'La bête déploie ses ailes et sature la pièce d’une aura prédatrice.',
    ],
    traits: [
      ['Parasitic', 'Parasite'],
      ['Autonomous', 'Autonome'],
      ['Unknown ability', 'Capacité inconnue'],
    ],
  }),
  entry({
    id: 'halkenburg-guardian-spirit-beast',
    kind: 'halkenburg-guardian',
    number: 'N-003',
    category: 'beast',
    color: '#d8d0c4',
    accent: '#f2e7cd',
    sound: 'chime',
    name: ["Halkenburg's Guardian Spirit Beast", 'Bête gardienne de Halkenburg'],
    alias: ['Collective-aura guardian', 'Gardien de l’aura collective'],
    environment: ["Halkenburg's quarters · gathering", 'Quartiers de Halkenburg · rassemblement'],
    description: [
      'A horned royal beast linked to the immense aura produced by Halkenburg and his followers.',
      'Une bête royale cornue liée à l’immense aura produite par Halkenburg et ses partisans.',
    ],
    technique: ['Collective resonance', 'Résonance collective'],
    techniqueDescription: [
      'Its aura synchronizes with the marked followers and amplifies their shared resolve.',
      'Son aura se synchronise avec les partisans marqués et amplifie leur volonté commune.',
    ],
    traits: [
      ['Symbiotic', 'Symbiotique'],
      ['Collective', 'Collective'],
      ['Enhancement', 'Renforcement'],
    ],
  }),
  entry({
    id: 'tserriednich-guardian-spirit-beast',
    kind: 'tserriednich-guardian',
    number: 'N-004',
    category: 'beast',
    color: '#9e6d89',
    accent: '#e3b6cd',
    sound: 'whisper',
    name: ["Tserriednich's Guardian Spirit Beast", 'Bête gardienne de Tserriednich'],
    alias: ['Equine lie detector', 'Détecteur de mensonge équin'],
    environment: ['Training salon · Room 1004', 'Salon d’entraînement · Chambre 1004'],
    description: [
      'An equine chimera with a human face, elongated neck and a second head hidden inside its mouth.',
      'Une chimère équine au visage humain, au cou extensible et à la seconde tête dissimulée dans sa bouche.',
    ],
    technique: ['Punish the third lie', 'Punir le troisième mensonge'],
    techniqueDescription: [
      'It marks a liar and escalates the warning with every repeated deception.',
      'Elle marque le menteur et aggrave son avertissement à chaque nouvelle tromperie.',
    ],
    traits: [
      ['Parasitic', 'Parasite'],
      ['Coercive', 'Coercitive'],
      ['Lie detection', 'Détection du mensonge'],
    ],
  }),
  entry({
    id: 'tserriednich-parallel-future-beast',
    kind: 'tserriednich-second',
    number: 'N-005',
    category: 'beast',
    color: '#b79f8e',
    accent: '#ead7c3',
    sound: 'whisper',
    name: ["Tserriednich's second Nen Beast", 'Seconde bête de Nen de Tserriednich'],
    alias: ['Parallel Future familiar', 'Familier de Parallel Future'],
    environment: ['Zetsu state · ten-second vision', 'État de Zetsu · vision de dix secondes'],
    description: [
      'A personal Nen Beast born from Tserriednich’s unconscious awakening, distinct from his guardian parasite.',
      'Une bête de Nen personnelle née de l’éveil inconscient de Tserriednich, distincte de son parasite gardien.',
    ],
    technique: ['Parallel Future', 'Parallel Future'],
    techniqueDescription: [
      'During Zetsu it opens a ten-second vision while the real world continues on a separate course.',
      'Pendant le Zetsu, elle ouvre une vision de dix secondes tandis que le monde réel poursuit une trajectoire distincte.',
    ],
    traits: [
      ['Specialization', 'Spécialisation'],
      ['Future sight', 'Vision du futur'],
      ['Personal beast', 'Bête personnelle'],
    ],
  }),
  entry({
    id: 'camilla-guardian-spirit-beast',
    kind: 'camilla-guardian',
    number: 'N-006',
    category: 'beast',
    color: '#b7879f',
    accent: '#e7b9cf',
    sound: 'whisper',
    name: ["Camilla's Guardian Spirit Beast", 'Bête gardienne de Camilla'],
    alias: ['Suspended coercive guardian', 'Gardien coercitif suspendu'],
    environment: ["Camilla's quarters · ceiling", 'Quartiers de Camilla · plafond'],
    description: [
      'A suspended jellyfish-like royal beast whose tendrils dominate the space beneath it.',
      'Une bête royale suspendue, proche d’une méduse, dont les tentacules dominent l’espace sous elle.',
    ],
    technique: ['Coercive field', 'Champ coercitif'],
    techniqueDescription: [
      'Its hanging body unfolds and imposes its presence across the whole room.',
      'Son corps suspendu se déploie et impose sa présence dans toute la pièce.',
    ],
    traits: [
      ['Parasitic', 'Parasite'],
      ['Coercive', 'Coercitive'],
      ['Autonomous', 'Autonome'],
    ],
  }),
  entry({
    id: 'tubeppa-guardian-spirit-beast',
    kind: 'tubeppa-guardian',
    number: 'N-007',
    category: 'beast',
    color: '#8ca58f',
    accent: '#c8dec5',
    sound: 'growl',
    name: ["Tubeppa's Guardian Spirit Beast", 'Bête gardienne de Tubeppa'],
    alias: ['Chemical synthesizer', 'Synthétiseur chimique'],
    environment: ["Tubeppa's quarters · laboratory", 'Quartiers de Tubeppa · laboratoire'],
    description: [
      'A wheeled, frog-like beast able to synthesize chemicals when a collaborative partner is present.',
      'Une bête batracienne montée sur roues, capable de synthétiser des substances en présence d’un partenaire.',
    ],
    technique: ['Chemical synthesis', 'Synthèse chimique'],
    techniqueDescription: [
      'The beast processes aura and releases a newly synthesized agent into its surroundings.',
      'La bête traite l’aura et libère dans son environnement un agent nouvellement synthétisé.',
    ],
    traits: [
      ['Transmutation', 'Transformation'],
      ['Collaborative', 'Collaborative'],
      ['Chemical', 'Chimique'],
    ],
  }),
  entry({
    id: 'zhang-lei-guardian-spirit-beast',
    kind: 'zhang-lei-guardian',
    number: 'N-008',
    category: 'beast',
    color: '#c79f4b',
    accent: '#f1d477',
    sound: 'chime',
    name: ["Zhang Lei's Guardian Spirit Beast", 'Bête gardienne de Zhang Lei'],
    alias: ['Coin-minting dharmachakra', 'Dharmachakra frappeur de pièces'],
    environment: [
      "Zhang Lei's quarters · reception room",
      'Quartiers de Zhang Lei · salon de réception',
    ],
    description: [
      'A floating eight-spoked wheel with a face at its centre and dark flame-like ornamentation.',
      'Une roue flottante à huit rayons, dotée d’un visage central et d’ornements semblables à des flammes noires.',
    ],
    technique: ['Mint Nen coin', 'Frapper une pièce de Nen'],
    techniqueDescription: [
      'A numbered coin drops from its mouth and accumulates aura while held by its recipient.',
      'Une pièce numérotée tombe de sa bouche et accumule de l’aura tant que son destinataire la conserve.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Cumulative', 'Cumulative'],
      ['Distribution', 'Distribution'],
    ],
  }),
  entry({
    id: 'tyson-guardian-spirit-beast',
    kind: 'tyson-guardian',
    number: 'N-009',
    category: 'beast',
    color: '#cf7898',
    accent: '#f3b5c8',
    sound: 'chime',
    name: ["Tyson's Guardian Spirit Beast", 'Bête gardienne de Tyson'],
    alias: ['Heart guardian and Eye-wogs', 'Gardien-cœur et Têtards-yeux'],
    environment: [
      "Tyson's quarters · scripture reading",
      'Quartiers de Tyson · lecture du livre sacré',
    ],
    description: [
      'A heart-shaped winged guardian with a central eye that produces small Eye-wog familiars.',
      'Un gardien ailé en forme de cœur, doté d’un œil central et produisant de petits familiers oculaires.',
    ],
    technique: ['Love levy', 'Prélèvement d’amour'],
    techniqueDescription: [
      'Its Eye-wogs attach to readers, collect aura and reward devotion to Tyson’s teachings.',
      'Ses Têtards-yeux s’attachent aux lecteurs, prélèvent leur aura et récompensent leur dévotion.',
    ],
    traits: [
      ['Emission', 'Émission'],
      ['Parasite', 'Parasite'],
      ['Aura collection', 'Collecte d’aura'],
    ],
  }),
  entry({
    id: 'luzurus-guardian-spirit-beast',
    kind: 'luzurus-guardian',
    number: 'N-010',
    category: 'beast',
    color: '#85704f',
    accent: '#cdb67f',
    sound: 'growl',
    name: ["Luzurus's Guardian Spirit Beast", 'Bête gardienne de Luzurus'],
    alias: ['Desire-baiting centipede', 'Mille-pattes appâtant le désir'],
    environment: ["Luzurus's quarters · baited room", 'Quartiers de Luzurus · pièce piégée'],
    description: [
      'A many-legged beast that prepares a trap shaped by the target’s strongest desire.',
      'Une bête aux nombreuses pattes qui prépare un piège prenant la forme du désir le plus fort de sa cible.',
    ],
    technique: ['Desire trap', 'Piège du désir'],
    techniqueDescription: [
      'The lure appears, draws the target into range and lets the beast spring its trap.',
      'L’appât apparaît, attire la cible à portée et permet à la bête de refermer son piège.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Trap', 'Piège'],
      ['Desire-based', 'Fondé sur le désir'],
    ],
  }),
  entry({
    id: 'sale-sale-guardian-spirit-beast',
    kind: 'sale-sale-guardian',
    number: 'N-011',
    category: 'beast',
    color: '#c99a78',
    accent: '#efc5a5',
    sound: 'growl',
    name: ["Salé-salé's Guardian Spirit Beast", 'Bête gardienne de Salé-salé'],
    alias: ['Many-mouthed smoke beast', 'Bête de fumée aux multiples bouches'],
    environment: ["Salé-salé's quarters · audience", 'Quartiers de Salé-salé · audience'],
    description: [
      'A spherical beast covered in mouths that exhales a persuasive smoke around the prince.',
      'Une bête sphérique couverte de bouches qui exhale autour du prince une fumée persuasive.',
    ],
    technique: ['Influence smoke', 'Fumée d’influence'],
    techniqueDescription: [
      'The mouths open together and spread the aura that cultivates devoted followers.',
      'Les bouches s’ouvrent ensemble et répandent l’aura qui transforme l’assistance en fidèles.',
    ],
    traits: [
      ['Manipulation', 'Manipulation'],
      ['Diffusion', 'Diffusion'],
      ['Coercive', 'Coercitive'],
    ],
  }),
  entry({
    id: 'momoze-guardian-spirit-beast',
    kind: 'momoze-guardian',
    number: 'N-012',
    category: 'beast',
    color: '#d3c9c3',
    accent: '#f0e2da',
    sound: 'whisper',
    name: ["Momoze's Guardian Spirit Beast", 'Bête gardienne de Momoze'],
    alias: ['Mouse-like solicitor', 'Solliciteur murin'],
    environment: ["Momoze's quarters · roaming", 'Quartiers de Momoze · itinérance'],
    description: [
      'A large mouse-like guardian whose smaller projections approach people and ask for a response.',
      'Un grand gardien semblable à une souris, dont les petites projections abordent les gens et réclament une réponse.',
    ],
    technique: ['Are you free?', 'Êtes-vous libre ?'],
    techniqueDescription: [
      'Acceptance lets the parasite take control while rapidly consuming the host’s aura.',
      'Une réponse affirmative permet au parasite de prendre le contrôle tout en consommant rapidement l’aura de l’hôte.',
    ],
    traits: [
      ['Manipulation', 'Manipulation'],
      ['Parasite', 'Parasite'],
      ['Solicitation', 'Sollicitation'],
    ],
  }),
  entry({
    id: 'marayam-guardian-spirit-beast',
    kind: 'marayam-guardian',
    number: 'N-013',
    category: 'beast',
    color: '#b88662',
    accent: '#e7ba8c',
    sound: 'growl',
    name: ["Marayam's Guardian Spirit Beast", 'Bête gardienne de Marayam'],
    alias: ['Room-sealing dragon', 'Dragon scellant la pièce'],
    environment: ["Marayam's quarters · sealed space", 'Quartiers de Marayam · espace scellé'],
    description: [
      'A powerful dragon-like guardian associated with the isolated replica of Marayam’s room.',
      'Un puissant gardien draconique associé à la réplique isolée de la chambre de Marayam.',
    ],
    technique: ['Seal the threshold', 'Sceller le seuil'],
    techniqueDescription: [
      'The beast occupies the exit while the protected room is displaced into an isolated Nen space.',
      'La bête occupe la sortie tandis que la chambre protégée est déplacée dans un espace de Nen isolé.',
    ],
    traits: [
      ['Spatial', 'Spatiale'],
      ['Defensive', 'Défensive'],
      ['Autonomous', 'Autonome'],
    ],
  }),
  entry({
    id: 'cats-name',
    kind: 'cats-name',
    number: 'N-014',
    category: 'beast',
    color: '#ff8fab',
    accent: '#ffd0dd',
    sound: 'growl',
    name: ["Cat's Name", 'Cat’s Name'],
    alias: ['Camilla’s post-mortem cat', 'Chat post-mortem de Camilla'],
    environment: ['Death trigger · retaliation', 'Déclenchement à la mort · représailles'],
    description: [
      'A gigantic cat-like Nen Beast that appears after Camilla is killed.',
      'Une gigantesque bête de Nen féline qui apparaît après la mort de Camilla.',
    ],
    technique: ['Million Lives Cat', 'Chat aux millions de vies'],
    techniqueDescription: [
      'It crushes the killer, extracts their life and uses it to restore Camilla.',
      'Elle écrase le meurtrier, extrait sa vie et l’utilise pour ressusciter Camilla.',
    ],
    traits: [
      ['Post-mortem', 'Post-mortem'],
      ['Counteractive', 'Contre-active'],
      ['Resurrection', 'Résurrection'],
    ],
  }),
  entry({
    id: 'stealth-dolphin',
    kind: 'stealth-dolphin',
    number: 'N-015',
    category: 'construct',
    color: '#63d8ef',
    accent: '#b9f4ff',
    sound: 'chime',
    name: ['Stealth Dolphin', 'Stealth Dolphin'],
    alias: ['Emperor Time loan assistant', 'Assistant de prêt d’Emperor Time'],
    environment: ['Emperor Time · borrowed ability', 'Emperor Time · capacité empruntée'],
    description: [
      'A dolphin-shaped Nen construct that analyses, stores and transfers a stolen ability.',
      'Une construction de Nen en forme de dauphin qui analyse, conserve et transfère une capacité volée.',
    ],
    technique: ['Ability loan', 'Prêt de capacité'],
    techniqueDescription: [
      'It explains the loaded ability and transfers its single use to a chosen recipient.',
      'Il explique la capacité chargée et en transfère l’unique utilisation au destinataire choisi.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Analysis', 'Analyse'],
      ['Ability loan', 'Prêt de capacité'],
    ],
  }),
  entry({
    id: 'cookie-chan',
    kind: 'cookie-chan',
    number: 'N-016',
    category: 'construct',
    color: '#f0c7b2',
    accent: '#ffe1ce',
    sound: 'chime',
    name: ['Cookie-chan', 'Cookie-chan'],
    alias: ["Biscuit's massage therapist", 'Masseuse de Biscuit'],
    environment: ['Rest area · recovery session', 'Zone de repos · séance de récupération'],
    description: [
      'A conjured masseuse whose special lotion and massage dramatically accelerate recovery.',
      'Une masseuse matérialisée dont la lotion et le massage accélèrent spectaculairement la récupération.',
    ],
    technique: ['Piano Massage', 'Piano Massage'],
    techniqueDescription: [
      'Cookie-chan performs a restorative massage that compresses hours of sleep into minutes.',
      'Cookie-chan réalise un massage réparateur qui condense des heures de sommeil en quelques minutes.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Restoration', 'Restauration'],
      ['Support', 'Soutien'],
    ],
  }),
  entry({
    id: 'silent-majority-blood-snakes',
    kind: 'blood-snakes',
    number: 'N-017',
    category: 'construct',
    color: '#eee9dd',
    accent: '#f6c6c6',
    sound: 'whisper',
    name: ['Silent Majority blood snakes', 'Serpents de sang de Silent Majority'],
    alias: ['Remote assassination familiars', 'Familiers d’assassinat à distance'],
    environment: ['Nen class · hidden attack', 'Cours de Nen · attaque dissimulée'],
    description: [
      'Four pale snake-like constructs that drain a victim’s blood in seconds.',
      'Quatre constructions serpentines pâles qui vident une victime de son sang en quelques secondes.',
    ],
    technique: ['Blood drain', 'Drainage du sang'],
    techniqueDescription: [
      'The snakes coil around the designated victim and drain them simultaneously.',
      'Les serpents s’enroulent autour de la victime désignée et la drainent simultanément.',
    ],
    traits: [
      ['Emission', 'Émission'],
      ['Remote', 'À distance'],
      ['Lethal', 'Létale'],
    ],
  }),
  entry({
    id: 'momoze-nen-spider',
    kind: 'nen-spider',
    number: 'N-018',
    category: 'construct',
    color: '#eee9dd',
    accent: '#d7c9ee',
    sound: 'whisper',
    name: ['Nen spider', 'Araignée de Nen'],
    alias: ['Parasitic surveillance form', 'Forme parasite de surveillance'],
    environment: ['Royal quarters · concealed', 'Quartiers royaux · dissimulée'],
    description: [
      'A tiny spider-shaped Nen construct used by the site’s succession-war reconstruction.',
      'Une minuscule construction de Nen arachnéenne utilisée dans la reconstruction de la guerre de succession.',
    ],
    technique: ['Attach and observe', 'S’attacher et observer'],
    techniqueDescription: [
      'The spider fixes itself to its target and maintains a discreet Nen link.',
      'L’araignée se fixe à sa cible et maintient un lien de Nen discret.',
    ],
    traits: [
      ['Parasitic', 'Parasite'],
      ['Concealed', 'Dissimulée'],
      ['Surveillance', 'Surveillance'],
    ],
  }),
  entry({
    id: 'blinky',
    kind: 'blinky',
    number: 'O-001',
    category: 'object',
    color: '#9e91b7',
    accent: '#d7cbea',
    sound: 'growl',
    name: ['Blinky', 'Blinky'],
    alias: ["Shizuku's conjured vacuum", 'Aspirateur matérialisé de Shizuku'],
    environment: ['Phantom Troupe · cleanup', 'Brigade Fantôme · nettoyage'],
    description: [
      'A living vacuum cleaner that can inhale any non-living thing its user specifies.',
      'Un aspirateur vivant capable d’engloutir toute matière non vivante désignée par son utilisatrice.',
    ],
    technique: ['Vacuum', 'Aspirer'],
    techniqueDescription: [
      'Blinky opens its toothed mouth and removes the designated material without leaving a trace.',
      'Blinky ouvre sa bouche dentée et élimine la matière désignée sans laisser de trace.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Removal', 'Élimination'],
      ['Living object', 'Objet vivant'],
    ],
  }),
  entry({
    id: 'dowsing-chain',
    kind: 'dowsing-chain',
    number: 'O-002',
    category: 'object',
    color: '#b9e9ff',
    accent: '#e1f7ff',
    sound: 'chime',
    name: ['Dowsing Chain', 'Dowsing Chain'],
    alias: ["Kurapika's ball chain", 'Chaîne à bille de Kurapika'],
    environment: ['Kurapika · right hand', 'Kurapika · main droite'],
    description: [
      'A conjured chain ending in a weighted ball, used for detection, pursuit and lie assessment.',
      'Une chaîne matérialisée terminée par une bille, utilisée pour la détection, la poursuite et l’évaluation du mensonge.',
    ],
    technique: ['Dowsing', 'Radiesthésie'],
    techniqueDescription: [
      'The suspended weight reacts to the chosen question, target or recorded image.',
      'Le poids suspendu réagit à la question, à la cible ou à l’image enregistrée choisie.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Detection', 'Détection'],
      ['Tracking', 'Pistage'],
    ],
  }),
  entry({
    id: 'judgment-chain',
    kind: 'judgment-chain',
    number: 'O-003',
    category: 'construct',
    color: '#a9475b',
    accent: '#e7a5b1',
    sound: 'chime',
    name: ['Judgment Chain', 'Judgment Chain'],
    alias: ['Vow around the heart', 'Serment autour du cœur'],
    environment: ['Emperor Time · imposed condition', 'Emperor Time · condition imposée'],
    description: [
      'A blade and chain driven into the heart to enforce an explicit rule under threat of death.',
      'Une lame et une chaîne plantées dans le cœur afin d’imposer une règle explicite sous peine de mort.',
    ],
    technique: ['Set the judgment', 'Fixer le jugement'],
    techniqueDescription: [
      'The chain coils around the heart and binds the target to the spoken condition.',
      'La chaîne s’enroule autour du cœur et lie la cible à la condition énoncée.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Vow', 'Serment'],
      ['Lethal condition', 'Condition mortelle'],
    ],
  }),
  entry({
    id: 'melody-flute',
    kind: 'melody-flute',
    number: 'O-004',
    category: 'object',
    color: '#d9c49a',
    accent: '#f4e2b9',
    sound: 'chime',
    name: ["Melody's flute", 'Flûte de Melody'],
    alias: ['Music-based emission focus', 'Focalisateur musical d’émission'],
    environment: ['Banquet hall · performance', 'Salle de banquet · représentation'],
    description: [
      'The instrument through which Melody carries aura in music and affects every listener in range.',
      'L’instrument par lequel Melody transporte son aura dans la musique et affecte chaque auditeur à portée.',
    ],
    technique: ['Field of Spring', 'Champ du printemps'],
    techniqueDescription: [
      'A pure phrase spreads through the room and guides listeners into a shared vision.',
      'Une phrase pure traverse la pièce et conduit les auditeurs dans une vision partagée.',
    ],
    traits: [
      ['Emission', 'Émission'],
      ['Music', 'Musique'],
      ['Wide area', 'Zone étendue'],
    ],
  }),
  entry({
    id: 'moonlight-act-contract',
    kind: 'moonlight-contract',
    number: 'O-005',
    category: 'construct',
    color: '#e8e1ca',
    accent: '#fff3c6',
    sound: 'paper',
    name: ['Moonlight Act contract', 'Contrat de Moonlight Act'],
    alias: ["Longhi's Nen contract", 'Contrat de Nen de Longhi'],
    environment: ['Negotiation table · signed terms', 'Table de négociation · clauses signées'],
    description: [
      'A sheet and pen formed from aura to turn mutually accepted terms into a binding Nen contract.',
      'Une feuille et un stylo formés d’aura qui transforment des clauses acceptées en contrat de Nen contraignant.',
    ],
    technique: ['Sign the contract', 'Signer le contrat'],
    techniqueDescription: [
      'The written terms ignite with aura and become enforceable once both parties agree.',
      'Les clauses écrites s’illuminent d’aura et deviennent exécutoires lorsque les deux parties les acceptent.',
    ],
    traits: [
      ['Transmutation', 'Transformation'],
      ['Contract', 'Contrat'],
      ['Mutual consent', 'Consentement mutuel'],
    ],
  }),
  entry({
    id: 'magical-worm',
    kind: 'magical-worm',
    number: 'C-033',
    category: 'construct',
    color: '#82cad0',
    accent: '#bdf4f0',
    sound: 'whisper',
    name: ['Magical Worm', 'Magical Worm'],
    alias: ["Fugetsu's spatial passage", 'Passage spatial de Fugetsu'],
    environment: ['Room 1011 · secret door', 'Chambre 1011 · porte secrète'],
    description: [
      'A tunnel-like Nen space whose entrance and exit appear as doors connected to Fugetsu’s memories.',
      'Un espace de Nen en forme de tunnel dont les portes sont reliées aux souvenirs de Fugetsu.',
    ],
    technique: ['Open the passage', 'Ouvrir le passage'],
    techniqueDescription: [
      'The mouth expands into a door and connects the current room to a chosen destination.',
      'L’ouverture s’étend en une porte et relie la pièce actuelle à la destination choisie.',
    ],
    traits: [
      ['Emission', 'Émission'],
      ['Spatial', 'Spatiale'],
      ['Transport', 'Transport'],
    ],
  }),
  entry({
    id: 'fun-fun-cloth',
    kind: 'fun-fun-cloth',
    number: 'O-006',
    category: 'object',
    color: '#b28bbf',
    accent: '#e2c4ea',
    sound: 'paper',
    name: ['Fun Fun Cloth', 'Fun Fun Cloth'],
    alias: ["Owl's shrinking cloth", 'Tissu réducteur de Owl'],
    environment: ['Shadow Beasts · capture', 'Bêtes de l’Ombre · capture'],
    description: [
      'A conjured cloth that shrinks and stores anything completely covered by it.',
      'Un tissu matérialisé qui réduit et conserve tout ce qu’il recouvre entièrement.',
    ],
    technique: ['Pocket capture', 'Capture de poche'],
    techniqueDescription: [
      'The cloth folds over the target and compresses it into a portable bundle.',
      'Le tissu se replie sur la cible et la compresse en un paquet transportable.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Storage', 'Stockage'],
      ['Capture', 'Capture'],
    ],
  }),
  entry({
    id: 'pain-packer-armour',
    kind: 'pain-packer',
    number: 'O-007',
    category: 'construct',
    color: '#7d5a52',
    accent: '#d8a996',
    sound: 'growl',
    name: ['Pain Packer armour', 'Armure de Pain Packer'],
    alias: ["Feitan's protective suit", 'Combinaison protectrice de Feitan'],
    environment: ['Combat zone · rising heat', 'Zone de combat · chaleur croissante'],
    description: [
      'A sealed suit conjured to protect Feitan when his counterattack releases extreme heat.',
      'Une combinaison hermétique matérialisée pour protéger Feitan lorsque sa contre-attaque libère une chaleur extrême.',
    ],
    technique: ['Rising Sun protection', 'Protection de Rising Sun'],
    techniqueDescription: [
      'The armour seals around the body just before the miniature sun manifests.',
      'L’armure se referme autour du corps juste avant la manifestation du soleil miniature.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Defensive', 'Défensive'],
      ['Counterattack', 'Contre-attaque'],
    ],
  }),
  entry({
    id: 'bonolenov-jupiter',
    kind: 'jupiter',
    number: 'C-034',
    category: 'construct',
    color: '#d5a86d',
    accent: '#f4d79b',
    sound: 'growl',
    name: ['Jupiter', 'Jupiter'],
    alias: ["Bonolenov's Battle Cantabile", 'Battle Cantabile de Bonolenov'],
    environment: ['Battle Cantabile · orchestral form', 'Battle Cantabile · forme orchestrale'],
    description: [
      'A massive planetary sphere conjured by Bonolenov’s battle music to crush a target.',
      'Une immense sphère planétaire matérialisée par la musique de combat de Bonolenov pour écraser une cible.',
    ],
    technique: ['Jupiter impact', 'Impact de Jupiter'],
    techniqueDescription: [
      'The planet condenses above the target and descends with overwhelming mass.',
      'La planète se condense au-dessus de la cible et s’abat avec une masse écrasante.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Music', 'Musique'],
      ['Impact', 'Impact'],
    ],
  }),
  entry({
    id: 'indoor-fish',
    kind: 'indoor-fish',
    number: 'N-019',
    category: 'construct',
    color: '#76b8c8',
    accent: '#bceaf0',
    sound: 'chime',
    name: ['Indoor Fish', 'Indoor Fish'],
    alias: ["Chrollo's stolen carnivorous fish", 'Poissons carnivores volés par Chrollo'],
    environment: ['Sealed room · victim kept alive', 'Pièce close · victime maintenue en vie'],
    description: [
      'Nen fish that can exist only in a sealed room and consume flesh without killing the victim immediately.',
      'Des poissons de Nen qui ne peuvent exister que dans une pièce close et dévorent la chair sans tuer immédiatement leur victime.',
    ],
    technique: ['Release the school', 'Libérer le banc'],
    techniqueDescription: [
      'The fish circle the enclosed space and begin feeding while the target feels no pain.',
      'Les poissons encerclent l’espace clos et commencent à se nourrir sans que la cible ressente de douleur.',
    ],
    traits: [
      ['Stolen ability', 'Capacité volée'],
      ['Closed room', 'Pièce close'],
      ['Nen beast', 'Bête de Nen'],
    ],
  }),
  entry({
    id: 'secret-window',
    kind: 'secret-window',
    number: 'N-020',
    category: 'construct',
    color: '#a8b7d8',
    accent: '#d9e3ff',
    sound: 'chime',
    name: ['Secret Window owl', 'Hibou de Secret Window'],
    alias: ["Musse's surveillance familiar", 'Familier de surveillance de Musse'],
    environment: [
      'Royal quarters · remote surveillance',
      'Quartiers royaux · surveillance à distance',
    ],
    description: [
      'An owl-shaped Nen Beast used to hear through barriers or attach to a target and relay information.',
      'Une bête de Nen en forme de hibou qui écoute à travers les obstacles ou s’attache à une cible pour transmettre des informations.',
    ],
    technique: ['Remote relay', 'Relais à distance'],
    techniqueDescription: [
      'The owl fixes its attention on the target and transmits their words and actions to Musse.',
      'Le hibou se concentre sur la cible et transmet ses paroles et ses actions à Musse.',
    ],
    traits: [
      ['Emission', 'Émission'],
      ['Surveillance', 'Surveillance'],
      ['Remote', 'À distance'],
    ],
  }),
  entry({
    id: 'without-you',
    kind: 'without-you',
    number: 'C-035',
    category: 'construct',
    color: '#f6b8d1',
    accent: '#ffe0ed',
    sound: 'whisper',
    name: ['Without You', 'Without You'],
    alias: ["Kacho's post-mortem double", 'Double post-mortem de Kacho'],
    environment: ["Fugetsu's side · after the escape", 'Aux côtés de Fugetsu · après la fuite'],
    description: [
      'A post-mortem Nen construct that perfectly takes Kacho’s form to remain beside Fugetsu.',
      'Une construction de Nen post-mortem qui prend parfaitement la forme de Kacho afin de rester auprès de Fugetsu.',
    ],
    technique: ['Protect Fugetsu', 'Protéger Fugetsu'],
    techniqueDescription: [
      'The double manifests with Kacho’s appearance, memories and protective intent.',
      'Le double se manifeste avec l’apparence, les souvenirs et l’intention protectrice de Kacho.',
    ],
    traits: [
      ['Post-mortem', 'Post-mortem'],
      ['Guardian', 'Gardienne'],
      ['Perfect double', 'Double parfait'],
    ],
  }),
  entry({
    id: 'biohazard-animal-object',
    kind: 'biohazard',
    number: 'C-036',
    category: 'construct',
    color: '#d4cec6',
    accent: '#eee7da',
    sound: 'growl',
    name: ['Biohazard animal-object', 'Animal-objet de Biohazard'],
    alias: ["Hinrigh's transformed camera", 'Caméra transformée de Hinrigh'],
    environment: ['Tier 3 · covert observation', 'Niveau 3 · observation clandestine'],
    description: [
      'A device transformed into a living animal while retaining the useful function of the original object.',
      'Un appareil transformé en animal vivant tout en conservant la fonction utile de l’objet d’origine.',
    ],
    technique: ['Animate the device', 'Animer l’appareil'],
    techniqueDescription: [
      'The camera unfolds into a cat-like creature and continues recording while it moves.',
      'La caméra se déploie en créature féline et continue d’enregistrer pendant ses déplacements.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Transformation', 'Transformation'],
      ['Living object', 'Objet vivant'],
    ],
  }),
  entry({
    id: 'lsdf',
    kind: 'lsdf-guards',
    number: 'C-037',
    category: 'construct',
    color: '#d8d5c8',
    accent: '#f0cf73',
    sound: 'signal',
    name: ['A Battle of Wits: LSDF', 'Bataille d’esprits : LSDF'],
    alias: ["Yokotani's numbered legal guards", 'Gardes juridiques numérotés de Yokotani'],
    environment: ['Heil-Ly hideout · active jurisdiction', 'Planque Heil-Ly · juridiction active'],
    description: [
      'Numbered guards conjured after Yokotani identifies an unlawful intruder in the Heil-Ly hideout. Their level follows the seriousness of the offense; they are invincible and expel defendants without injuring them.',
      'Des gardes numérotés matérialisés lorsque Yokotani identifie un intrus illégitime dans la planque Heil-Ly. Leur niveau suit la gravité de l’infraction ; ils sont invincibles et expulsent les accusés sans les blesser.',
    ],
    technique: ['Establish jurisdiction', 'Établir la juridiction'],
    techniqueDescription: [
      'The offense is declared and a formation of guards rises at the matching alert level to immobilize and remove the intruder.',
      'L’infraction est déclarée et une formation de gardes apparaît au niveau d’alerte correspondant pour immobiliser puis expulser l’intrus.',
    ],
    traits: [
      ['Conjuration', 'Matérialisation'],
      ['Invincible defense', 'Défense invincible'],
      ['Hideout only', 'Planque uniquement'],
    ],
  }),
]

export function archiveCopy<T>(value: Record<ArchiveLocale, T>, locale: string): T {
  return value[locale === 'fr' ? 'fr' : 'en']
}
