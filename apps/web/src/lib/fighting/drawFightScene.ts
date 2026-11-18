import { drawVictoryFrame } from './victory/draw'

type DrawOptions = Parameters<typeof drawVictoryFrame>[0]

/** Keep cinematic rendering and its temporary model restoration at a single draw boundary. */
export function drawFightScene(options: Omit<DrawOptions, 'input'> & DrawOptions['input']) {
  const { victory, draw, failed, ...input } = options
  drawVictoryFrame({ victory, input, draw, failed })
}
