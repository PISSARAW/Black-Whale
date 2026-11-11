import {
  tserriednichMouldedFrame,
  TserriednichRoomSurface,
  TSERRIEDNICH_CANVAS,
  TSERRIEDNICH_GOLD_TRIM,
} from './tserriednichRoomDetailSurface'

/** The framed decoration over the mantel, chs. 384-387: a plain gilt-edged panel. */
export function dressTserriednichRoomPicture(surface: TserriednichRoomSurface): void {
  surface.box([surface.width, surface.structure.height, 0.03], [0, 0, 0], TSERRIEDNICH_CANVAS)
  tserriednichMouldedFrame(surface, {
    width: surface.width,
    height: surface.structure.height,
    y: 0,
    z: 0.02,
  })
  surface.box(
    [surface.width + 0.08, 0.05, 0.05],
    [0, surface.structure.height / 2 + 0.06, 0.03],
    TSERRIEDNICH_GOLD_TRIM,
  )
}
