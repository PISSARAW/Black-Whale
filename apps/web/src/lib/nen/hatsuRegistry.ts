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
  { id: 'bungee-gum', name: 'Bungee Gum', owner: 'Hisoka', kind: 'elastic', instruction: 'Click two points to connect them, then move the pointer to stretch the strand.', rule: 'The aura adheres to surfaces and retracts like rubber.', cost: 'Continuous aura · increasing tension', color: '#f06bb5', action: 'Place an anchor' },
  { id: 'texture-surprise', name: 'Texture Surprise', owner: 'Hisoka', kind: 'disguise', instruction: 'Click an element to cover its texture and conceal its true appearance.', rule: 'The thin layer changes perception, not the nature of the target.', cost: 'Low · limited surface', color: '#d98fc4', action: 'Choose a surface' },
  { id: 'emperor-time', name: 'Emperor Time', owner: 'Kurapika', kind: 'scarlet', instruction: 'All categories are pushed to 100%. Watch the life counter.', rule: 'Every second of activation consumes one hour of life.', cost: '1 second = 1 hour of life', color: '#ef3340', action: 'Observe affinities' },
  { id: 'steal-chain', name: 'Steal Chain', owner: 'Kurapika', kind: 'chain-rule', instruction: 'Select a target, then impose the displayed rule.', rule: 'The chain drains an ability; breaking a condition triggers the penalty.', cost: 'Condition and contact required', color: '#d7dce2', action: 'Drive in the chain' },
  { id: 'chain-jail', name: 'Chain Jail', owner: 'Kurapika', kind: 'chain-bind', instruction: 'Click a target to bind it in chains.', rule: 'The absolute restriction is reserved for Phantom Troupe members.', cost: 'Fatal vow if the target is invalid', color: '#c9ced6', action: 'Bind target' },
  { id: 'dowsing-chain', name: 'Dowsing Chain', owner: 'Kurapika', kind: 'dowsing', instruction: 'Move the pointer: the pendulum searches for interactive elements and reacts to the nearest one.', rule: 'The pendulum combines intuition, concentration, and available information.', cost: 'Sustained concentration', color: '#8ecae6', action: 'Start search' },
  { id: 'benjamin-aura', name: 'Aura Manipulation', owner: 'Benjamin', kind: 'enhance', instruction: 'Click to temporarily reinforce an area of the site.', rule: 'Massive aura improves physical power and resistance.', cost: 'Proportional aura expenditure', color: '#f0b429', action: 'Reinforce' },
  { id: 'oito-hatsu', name: 'Royal Guard Hatsu', owner: 'Oito', kind: 'control', instruction: 'Select several targets to materialize control links.', rule: 'Manipulation requires an acquired target and a maintained link.', cost: 'Aura per controlled target', color: '#70d6b2', action: 'Establish a link' },
  { id: 'erigeron', name: 'Erigeron', owner: 'Bill', kind: 'growth', instruction: 'Click an element to accelerate the life and aura within it.', rule: 'Acceleration is strong on plants and weak on a Nen novice.', cost: 'Palms close to the living target', color: '#7fd35b', action: 'Trigger growth' },
  { id: 'kurton-vehicle-transformation', name: 'Vehicle Transformation', owner: 'Kurton', kind: 'vehicle', instruction: 'Board up to five elements, then make them travel together.', rule: 'The body becomes a vehicle and passenger aura serves as fuel.', cost: 'Shared aura · 5 passengers max.', color: '#f2a65a', action: 'Board' },
  { id: 'little-eye', name: 'Little Eye', owner: 'Sayird', kind: 'scout', instruction: 'Send the small eye into an area to observe it through a creature.', rule: 'The target must be a real small animal; visual and auditory perception are shared.', cost: 'Very low · persists while unconscious', color: '#55c2ff', action: 'Release scout' },
  { id: 'cross-game', name: 'Cross Game', owner: 'Mizaistom', kind: 'tribunal', instruction: 'Blue admits, yellow warns then immobilizes, and red expels the selected target.', rule: 'Yellow restraint triggers only after an ignored warning.', cost: 'Brief effect · reusable', color: '#f0c94d', action: 'Change card' },
  { id: 'beyond-sacrificial-curse', name: 'Sacrificial Curse', owner: 'Beyond', kind: 'curse', instruction: 'Mark a target: the curse remains dormant until the sacrifice.', rule: 'The carrier’s death remotely triggers the curse placed on the target.', cost: 'Human sacrifice · post-mortem', color: '#9d65d0', action: 'Reveal with Gyo' },
  { id: 'benjamin-baton', name: 'Benjamin Baton', owner: 'Benjamin', kind: 'inherit', instruction: 'Collect the stars left by fallen loyal soldiers.', rule: 'Only abilities from private-army graduates who swore loyalty are inherited.', cost: 'Owner death and loyalty', color: '#ffd166', action: 'Inherit' },
  { id: 'air-blow', name: 'Air Blow', owner: 'Benjamin / Vincent', kind: 'blast', instruction: 'Click to project a wave from the palm that pushes the page back.', rule: 'Emission strikes at range; its exact limits remain unknown.', cost: 'Unknown', color: '#c6f1ff', action: 'Strike the air' },
  { id: 'secret-window', name: 'Secret Window', owner: 'Benjamin / Musse', kind: 'surveillance', instruction: 'Place an invisible owl on an element to listen to and record its activity.', rule: 'One construct of each type can exist; the marked target cannot see it.', cost: 'Extended surveillance', color: '#a8b7d8', action: 'Place a bird' },
  { id: 'culdcept', name: 'Culdcept', owner: 'Benjamin / Shikaku', kind: 'capture', instruction: 'Frame an element between your fingers to seal its ability in a card.', rule: 'Acquisition requires preparation and can fail against an absolute attack.', cost: 'Vulnerable preparation', color: '#8c7ae6', action: 'Create a card' },
  { id: 'parallel-future', name: 'Parallel Future', owner: 'Tserriednich', kind: 'future', instruction: 'The site displays its predicted state ten seconds ahead of the present.', rule: 'Zetsu and closed eyes reveal 10 seconds; others continue to perceive the prediction.', cost: 'Complete Zetsu · vulnerability', color: '#7dd3fc', action: 'Close your eyes' },
  { id: 'grimmel-the-dissonance', name: 'Grimmel the Dissonance', owner: 'Halkenburg', kind: 'arrow', instruction: 'Gather wills, aim, then fire an arrow that crosses every defense.', rule: 'The arrow swaps the target’s soul with that of a randomly marked carrier.', cost: 'Collective will · life at risk', color: '#f7e27d', action: 'Draw the bow' },
  { id: 'without-you', name: 'Without You', owner: 'Kacho', kind: 'guardian', instruction: 'A twin presence accompanies and protects navigation across the site.', rule: 'The deceased twin is reproduced by post-mortem Nen until the survivor dies.', cost: 'Death of one twin · irreversible', color: '#f6b8d1', action: 'Call the guardian' },
  { id: 'magical-worm', name: 'Magical Worm', owner: 'Fugetsu', kind: 'portal', instruction: 'Place a departure door, navigate, then use the persistent return door.', rule: 'The tunnel links two places; fully exiting closes the outbound path.', cost: 'Normally 1 trip/night · exhausting', color: '#80edc7', action: 'Open a door' },
  { id: 'cats-name', name: "Cat's Name", owner: 'Camilla', kind: 'resurrection', instruction: 'Trigger simulated death: the cat counters the culprit and restores life.', rule: 'The ability responds only to Camilla’s direct death through post-mortem Nen.', cost: 'Prior death · killer required', color: '#ff8fab', action: 'Simulate death' },
]

export const hatsuById = (id: string | null | undefined) =>
  HATSU_PROFILES.find((profile) => profile.id === id) ?? null
