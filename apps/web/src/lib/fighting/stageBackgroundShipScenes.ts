import { art, cameo, event, object, type BackgroundScene } from './stageBackgroundSceneTypes'

/** Each place has its own composition, including places with no public or picture. */
export const SHIP_BACKGROUND_SCENES = {
  'whale-hold': [
    event('porthole-shadow', [0, 3.05, -2.01], { size: 1.75, period: 17 }),
    art('graffiti', [-3.6, 0.48, -0.9], 0.8),
    object('spider', [-3.28, 0.91, -0.78], { size: 0.42, motion: 'still' }),
  ],
  'heavens-arena': [
    cameo(
      { actor: 0, at: [-3.2, 0.15, -9.5], scale: 1 },
      { actor: 1, at: [1.6, 0.15, -9.5], scale: 1 },
    ),
    art('monitor', [0, 3.25, -9.2], 1.9),
    object('card', [-4.5, 0.78, -9.1], { size: 0.55, motion: 'still', support: 'shelf' }),
  ],
  'banquet-hall': [
    event('chandelier', [0.3, 3.1, -1.05], { trigger: 'impact', size: 0.8 }),
    cameo({ actor: 0, at: [1.8, 0.02, -0.95], scale: 0.75 }),
    event('tea', [-3.6, 0, -0.9], { trigger: 'impact', size: 0.85 }),
  ],
  'vip-casino': [
    event('cat-prowl', [-1.4, 0.05, -0.95], { size: 0.6, period: 19 }),
    object('coin', [2.5, 0.23, -0.85], { motion: 'roll', size: 0.7 }),
    object('card', [-3.6, 0.82, -0.85], { size: 0.7, motion: 'still', support: 'table' }),
  ],
  'observation-deck': [
    event('distant-boat', [0, 2.7, -1.2], { size: 1.8, period: 29 }),
    cameo(
      { actor: 0, at: [-1.4, 0.02, -0.9], scale: 0.7 },
      { actor: 1, at: [-0.7, 0.02, -0.9], scale: 0.7 },
    ),
    object('boat', [3.5, 0.77, -0.85], { motion: 'rock', size: 0.65, support: 'shelf' }),
  ],
  'screening-room': [
    event('projector', [0, 2.65, -1.05], { size: 1.2, period: 23 }),
    cameo({ actor: 0, at: [-1.4, 0.02, -0.9], scale: 0.72 }),
    object('reel', [3.7, 0.2, -0.85], { size: 0.8, motion: 'still' }),
  ],
  'supreme-court': [
    event('clock', [2.9, 2.7, -1.05], { size: 0.8 }),
    art('floor-mark', [-2.4, 0.018, -1.05], 0.9),
    event('paper-drift', [-3.6, 1.45, -0.85], { trigger: 'finish', size: 0.55 }),
  ],
  'princes-burial-chamber': [
    event('memorial-lights', [0, 0.03, -1.05], { size: 1.1, period: 28 }),
    art('floor-mark', [2.7, 0.02, -1.2], 0.7),
  ],
  'heilly-hideout': [
    event('door-eyes', [-4.1, 0, -1.05], { period: 21 }),
    art('graffiti', [2.8, 0.48, -0.95], 0.7),
    cameo({ actor: 0, at: [0.7, 0.02, -0.95], scale: 0.72 }),
  ],
  'royal-salon': [
    art('portrait', [3.4, 2.4, -1.05], 0.9),
    event('chess', [-3.45, 0, -0.95], { trigger: 'finish', size: 0.85 }),
    event('chandelier', [0, 3.2, -1.05], { trigger: 'impact', size: 0.65 }),
  ],
  'unma-salon': [
    cameo({ actor: 0, at: [-1.4, 0.02, -0.95], scale: 0.78 }),
    event('clock', [3.1, 2.5, -1.05], { size: 0.65 }),
    event('tea', [-2.4, 0, -0.9], { size: 0.7, period: 18 }),
  ],
  'cha-r-warehouse': [
    event('cargo-lid', [2.8, 0, -0.95], { trigger: 'impact', size: 0.9 }),
    art('graffiti', [-3.5, 0.46, -0.95], 0.8),
    object('spider', [-3.15, 0.9, -0.8], { motion: 'drift', size: 0.45 }),
    object('card', [2.9, 0.98, -0.75], { size: 0.4, motion: 'still' }),
  ],
  'central-dining-hall': [
    event('tea', [0.7, 0, -0.95], { trigger: 'impact' }),
    cameo({ actor: 0, at: [1.5, 0.02, -0.9], scale: 0.72 }),
    art('poster', [-3.4, 1.9, -1.05], 0.65),
  ],
  'cineplex-concourse': [
    art('poster', [3.55, 2.2, -1.05], 1.1),
    object('card', [-2.6, 0.2, -0.95], { size: 0.55, motion: 'still' }),
    event('cat-prowl', [-2.5, 0.05, -1], { size: 0.5, period: 24 }),
  ],
  'cineplex-screen-corridor': [
    event('projector', [2.7, 2.55, -1.05], { period: 15, size: 0.85 }),
    event('door-eyes', [-4.1, 0, -1.1], { period: 26, size: 0.8 }),
    object('reel', [-0.6, 0.16, -0.95], { size: 0.6, motion: 'roll' }),
  ],
  'cha-r-office': [
    event('aquarium', [1.7, 0, -1.05], { size: 0.95 }),
    cameo({ actor: 0, at: [-1.4, 0.02, -0.95], scale: 0.75 }),
    object('coin', [-2.4, 0.82, -0.85], { motion: 'spin', size: 0.5, support: 'table' }),
  ],
  'police-atrium': [
    art('poster', [-3.45, 1.8, -1.05], 0.65),
    event('paper-drift', [1.8, 1.8, -1], { trigger: 'impact', size: 0.75 }),
    object('boat', [2.9, 0.2, -0.95], { size: 0.5, motion: 'rock' }),
  ],
  'hangar-entrance': [
    event('bird', [-3.2, 1.35, -1.05], { size: 0.75, period: 16 }),
    event('cargo-lid', [3.25, 0, -1.05], { size: 0.65, period: 31 }),
    art('floor-mark', [-1.8, 0.02, -1.1], 0.6),
  ],
  'hull-suspension': [
    event('spring-gauge', [-2.9, 0, -1.1], { size: 1.3, trigger: 'impact' }),
    art('graffiti', [3.1, 0.6, -1.05], 1),
    object('coin', [0.65, 0.22, -0.95], { size: 0.4, motion: 'roll' }),
  ],
  'exterior-main-deck': [
    event('wind-bell', [3.35, 2.3, -1.05], { size: 0.8 }),
    event('bird', [-3.3, 1.4, -1.05], { size: 0.65, period: 22 }),
    art('floor-mark', [0.4, 0.02, -1.15], 1),
  ],
  'starboard-lifeboats': [
    cameo(
      { actor: 0, at: [1, 0.02, -0.95], scale: 0.7 },
      { actor: 1, at: [1.7, 0.02, -0.95], scale: 0.7 },
    ),
    event('distant-boat', [-1.6, 2.65, -1.1], { size: 1.3, period: 37 }),
    object('boat', [-3.6, 0.18, -0.9], { size: 0.45, motion: 'still' }),
  ],
} satisfies Record<string, BackgroundScene>
