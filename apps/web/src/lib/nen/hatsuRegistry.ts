export type HatsuInteractionKind =
  | 'elastic'
  | 'disguise'
  | 'scarlet'
  | 'chain-rule'
  | 'chain-bind'
  | 'dowsing'
  | 'enhance'
  | 'control'
  | 'growth'
  | 'vehicle'
  | 'scout'
  | 'tribunal'
  | 'curse'
  | 'inherit'
  | 'blast'
  | 'surveillance'
  | 'capture'
  | 'future'
  | 'arrow'
  | 'guardian'
  | 'portal'
  | 'resurrection'

export interface HatsuProfile {
  id: string
  name: string
  owner: string
  kind: HatsuInteractionKind
  instruction: string
  rule: string
  cost: string
  color: string
  action: string
}

/**
 * Interaction knowledge used by the global Hatsu layer.
 * This is deliberately explicit: a technique never falls back to a generic
 * particle effect when its canon mechanics are already known.
 */
export const HATSU_PROFILES: HatsuProfile[] = [
  { id: 'bungee-gum', name: 'Bungee Gum', owner: 'Hisoka', kind: 'elastic', instruction: 'Cliquez deux points du site pour les relier, puis déplacez le pointeur pour tendre le filament.', rule: 'L’aura adhère aux surfaces et se rétracte comme du caoutchouc.', cost: 'Aura continue · tension croissante', color: '#f06bb5', action: 'Poser une ancre' },
  { id: 'texture-surprise', name: 'Texture Surprise', owner: 'Hisoka', kind: 'disguise', instruction: 'Cliquez un élément pour recouvrir sa texture et masquer son apparence réelle.', rule: 'La fine pellicule ne change que ce qui est perçu, pas la nature de la cible.', cost: 'Faible · surface limitée', color: '#d98fc4', action: 'Choisir une surface' },
  { id: 'emperor-time', name: 'Emperor Time', owner: 'Kurapika', kind: 'scarlet', instruction: 'Toutes les catégories sont poussées à 100 %. Surveillez le compteur vital.', rule: 'Chaque seconde d’activation consume une heure de vie.', cost: '1 seconde = 1 heure de vie', color: '#ef3340', action: 'Observer les affinités' },
  { id: 'steal-chain', name: 'Steal Chain', owner: 'Kurapika', kind: 'chain-rule', instruction: 'Sélectionnez une cible, puis imposez-lui la règle affichée.', rule: 'La chaîne draine une capacité ; une condition violée entraîne la sanction.', cost: 'Condition et contact requis', color: '#d7dce2', action: 'Planter la chaîne' },
  { id: 'chain-jail', name: 'Chain Jail', owner: 'Kurapika', kind: 'chain-bind', instruction: 'Cliquez une cible pour l’immobiliser sous les chaînes.', rule: 'La contrainte absolue est réservée aux membres de la Brigade Fantôme.', cost: 'Vœu mortel si la cible est invalide', color: '#c9ced6', action: 'Enchaîner' },
  { id: 'dowsing-chain', name: 'Dowsing Chain', owner: 'Kurapika', kind: 'dowsing', instruction: 'Déplacez le pointeur : le pendule cherche les éléments interactifs et réagit au plus proche.', rule: 'Le pendule combine intuition, concentration et informations disponibles.', cost: 'Concentration maintenue', color: '#8ecae6', action: 'Lancer la recherche' },
  { id: 'benjamin-aura', name: 'Aura Manipulation', owner: 'Benjamin', kind: 'enhance', instruction: 'Cliquez pour renforcer momentanément une zone du site.', rule: 'Une aura massive améliore la puissance et la résistance physiques.', cost: 'Dépense d’aura proportionnelle', color: '#f0b429', action: 'Renforcer' },
  { id: 'oito-hatsu', name: 'Royal Guard Hatsu', owner: 'Oito', kind: 'control', instruction: 'Sélectionnez plusieurs cibles pour matérialiser les liens de contrôle.', rule: 'La manipulation exige une cible acquise et un lien maintenu.', cost: 'Aura par cible contrôlée', color: '#70d6b2', action: 'Établir un lien' },
  { id: 'erigeron', name: 'Erigeron', owner: 'Bill', kind: 'growth', instruction: 'Cliquez un élément : la vie et l’aura qu’il contient croissent accélérément.', rule: 'L’accélération est forte sur les plantes, faible sur un novice du Nen.', cost: 'Paumes proches de la cible vivante', color: '#7fd35b', action: 'Faire germer' },
  { id: 'kurton-vehicle-transformation', name: 'Transformation en véhicule', owner: 'Kurton', kind: 'vehicle', instruction: 'Embarquez jusqu’à cinq éléments, puis faites-les voyager ensemble.', rule: 'Le corps devient véhicule et l’aura des passagers sert de carburant.', cost: 'Aura partagée · 5 passagers max.', color: '#f2a65a', action: 'Embarquer' },
  { id: 'little-eye', name: 'Little Eye', owner: 'Sayird', kind: 'scout', instruction: 'Envoyez le petit œil sur une zone pour l’observer à travers une créature.', rule: 'La cible doit être un petit animal réel ; la perception visuelle et sonore est partagée.', cost: 'Très faible · persiste inconscient', color: '#55c2ff', action: 'Lâcher l’éclaireur' },
  { id: 'cross-game', name: 'Cross Game', owner: 'Mizaistom', kind: 'tribunal', instruction: 'Bleu admet, jaune avertit puis immobilise, rouge expulse la cible sélectionnée.', rule: 'La contention jaune ne se déclenche qu’après un avertissement ignoré.', cost: 'Effet bref · réapplicable', color: '#f0c94d', action: 'Changer de carte' },
  { id: 'beyond-sacrificial-curse', name: 'Malédiction sacrificielle', owner: 'Beyond', kind: 'curse', instruction: 'Marquez une cible : la malédiction reste dormante jusqu’au sacrifice.', rule: 'La mort du porteur déclenche à distance la malédiction placée sur la cible.', cost: 'Sacrifice humain · post-mortem', color: '#9d65d0', action: 'Révéler avec Gyo' },
  { id: 'benjamin-baton', name: 'Benjamin Baton', owner: 'Benjamin', kind: 'inherit', instruction: 'Collectez les étoiles laissées par les soldats fidèles tombés.', rule: 'Seules les capacités de diplômés de l’armée privée ayant juré fidélité sont héritées.', cost: 'Mort et fidélité du propriétaire', color: '#ffd166', action: 'Hériter' },
  { id: 'air-blow', name: 'Air Blow', owner: 'Benjamin / Vincent', kind: 'blast', instruction: 'Cliquez pour projeter depuis la paume une onde qui repousse la page.', rule: 'L’émission frappe à distance ; ses limites exactes restent inconnues.', cost: 'Inconnu', color: '#c6f1ff', action: 'Frapper l’air' },
  { id: 'secret-window', name: 'Secret Window', owner: 'Benjamin / Musse', kind: 'surveillance', instruction: 'Posez une chouette invisible sur un élément pour écouter et enregistrer son activité.', rule: 'Une construction de chaque type peut exister ; la cible marquée ne la voit pas.', cost: 'Surveillance prolongée', color: '#a8b7d8', action: 'Poser un Bird' },
  { id: 'culdcept', name: 'Culdcept', owner: 'Benjamin / Shikaku', kind: 'capture', instruction: 'Cadrez un élément entre vos doigts pour enfermer sa capacité dans une carte.', rule: 'L’acquisition demande une préparation et peut échouer face à une attaque absolue.', cost: 'Préparation vulnérable', color: '#8c7ae6', action: 'Créer une carte' },
  { id: 'parallel-future', name: 'Parallel Future', owner: 'Tserriednich', kind: 'future', instruction: 'Le site affiche son état prédit dix secondes devant le présent.', rule: 'Zetsu et yeux fermés révèlent 10 s ; les autres continuent de percevoir la prédiction.', cost: 'Zetsu complet · vulnérabilité', color: '#7dd3fc', action: 'Fermer les yeux' },
  { id: 'grimmel-the-dissonance', name: 'Grimmel the Dissonance', owner: 'Halkenburg', kind: 'arrow', instruction: 'Rassemblez les volontés, visez, puis tirez une flèche qui traverse toute défense.', rule: 'La flèche échange l’âme de la cible avec celle d’un porteur marqué aléatoire.', cost: 'Volonté collective · vie risquée', color: '#f7e27d', action: 'Bander l’arc' },
  { id: 'without-you', name: 'Without You', owner: 'Kacho', kind: 'guardian', instruction: 'Une présence jumelle accompagne et protège la navigation sur tout le site.', rule: 'La jumelle morte est reproduite par le Nen post-mortem jusqu’à la mort de la survivante.', cost: 'Mort d’une jumelle · irréversible', color: '#f6b8d1', action: 'Appeler la gardienne' },
  { id: 'magical-worm', name: 'Magical Worm', owner: 'Fugetsu', kind: 'portal', instruction: 'Posez une porte de départ, naviguez, puis utilisez la porte de retour persistante.', rule: 'Le tunnel relie deux lieux ; sortir entièrement ferme le chemin aller.', cost: 'Normalement 1 trajet/nuit · épuisant', color: '#80edc7', action: 'Ouvrir une porte' },
  { id: 'cats-name', name: "Cat's Name", owner: 'Camilla', kind: 'resurrection', instruction: 'Déclenchez la mort simulée : le chat contre-attaque le responsable et rend la vie.', rule: 'La capacité ne répond qu’à la mort directe de Camilla, grâce au Nen post-mortem.', cost: 'Mort préalable · meurtrier requis', color: '#ff8fab', action: 'Simuler la mort' },
]

export const hatsuById = (id: string | null | undefined) =>
  HATSU_PROFILES.find((profile) => profile.id === id) ?? null
