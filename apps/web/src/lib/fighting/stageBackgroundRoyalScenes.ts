import { art, cameo, event, object, type BackgroundScene } from './stageBackgroundSceneTypes'

export const ROYAL_BACKGROUND_SCENES = {
  'benjamin-salon': [
    event('chess', [-1.2, 0, -0.95], { size: 0.9, trigger: 'impact' }),
    cameo({ actor: 1, at: [1.8, 0.02, -0.95], scale: 0.78 }),
    object('coin', [-0.9, 0.85, -0.76], { size: 0.4, motion: 'still' }),
  ],
  'camilla-salon': [
    event('cat-prowl', [0, 0.06, -0.95], { size: 0.7, period: 14 }),
    art('portrait', [3.3, 2.15, -1.05], 0.9),
    object('cat', [-3.4, 0.75, -0.95], { size: 0.4, motion: 'still', support: 'shelf' }),
  ],
  'zhang-lei-salon': [
    cameo({ actor: 1, at: [-3.2, 0.02, -0.95], scale: 0.75 }),
    object('coin', [1.8, 0.85, -0.95], { motion: 'spin', size: 0.55, support: 'table' }),
    object('coin', [2.6, 0.2, -0.95], { motion: 'roll', size: 0.5 }),
    object('coin', [-2.6, 0.17, -0.95], { motion: 'still', size: 0.4 }),
  ],
  'tserriednich-salon': [
    art('portrait', [-3.3, 2.15, -1.05], 0.8),
    event('door-eyes', [4.1, 0, -1.05], { size: 0.9, period: 10 }),
    art('floor-mark', [0.2, 0.025, -1.15], 0.65),
  ],
  'tubeppa-salon': [
    event('lab-bubbles', [2.85, 0, -0.95], { size: 0.95 }),
    art('graffiti', [-3.2, 0.48, -1.05], 0.65),
    object('spring', [2.5, 0.98, -0.88], { size: 0.35, motion: 'still' }),
  ],
  'salesale-salon': [
    event('music-box', [2.8, 0, -0.95], { size: 0.9, period: 14 }),
    art('poster', [-3.2, 1.9, -1.05], 0.65),
  ],
  'halkenburg-salon': [
    object('feather', [-2.6, 1.8, -1.05], { size: 0.65, motion: 'drift' }),
    object('feather', [3.1, 0.22, -0.95], { size: 0.4, motion: 'still' }),
    event('paper-drift', [1.4, 1.6, -1.05], { trigger: 'finish', size: 0.55 }),
    art('floor-mark', [-0.3, 0.02, -1.15], 0.8),
  ],
  'kacho-salon': [
    cameo({ actor: 1, at: [-1.6, 0.02, -0.95], scale: 0.8 }),
    event('music-box', [0.6, 0, -0.95], { size: 0.7, period: 21 }),
    art('portrait', [3.3, 2.25, -1.05], 0.65),
  ],
  'fugetsu-salon': [
    event('flower-door', [2.5, 0, -1.05], { size: 0.9, period: 19 }),
    event('wind-bell', [-3.1, 2.35, -1.05], { size: 0.65 }),
    object('boat', [0.7, 0.2, -0.95], { size: 0.5, motion: 'still' }),
  ],
  'momoze-salon': [
    cameo({ actor: 1, at: [1.65, 0.02, -0.95], scale: 0.78 }),
    object('toy', [-2.8, 0.17, -0.95], { size: 0.6, motion: 'still' }),
    art('floor-mark', [-0.7, 0.02, -1.15], 0.55),
  ],
  'marayam-salon': [
    event('toy-box', [-2.8, 0, -0.95], { size: 0.8, period: 13 }),
    event('door-eyes', [4.1, 0, -1.05], { size: 0.8, period: 27 }),
    cameo({ actor: 1, at: [-1.7, 0.02, -0.95], scale: 0.72, pose: 'idle' }),
  ],
  'woble-salon': [
    cameo(
      { actor: 0, at: [-2.1, 0.02, -0.95], scale: 0.78 },
      { actor: 1, at: [-2.3, 0.55, -0.75], scale: 0.78, tilt: -1.05 },
    ),
    event('mobile', [-1.3, 1.8, -1.05], { size: 0.65 }),
  ],
} satisfies Record<string, BackgroundScene>
