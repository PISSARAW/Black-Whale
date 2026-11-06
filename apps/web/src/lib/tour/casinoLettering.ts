import { CasinoFixture } from './casinoFixture'

const GLYPHS: Record<string, string[]> = {
  S: ['111', '100', '111', '001', '111'],
  W: ['101', '101', '101', '111', '101'],
  A: ['010', '101', '111', '101', '101'],
  M: ['101', '111', '111', '101', '101'],
  P: ['110', '101', '110', '100', '100'],
  B: ['110', '101', '110', '101', '110'],
  L: ['100', '100', '100', '100', '111'],
  ' ': ['000', '000', '000', '000', '000'],
}

/** Readable, geometry-only lettering; no canvas texture or manga artwork. */
export function labelSwampBall(model: CasinoFixture): void {
  const word = 'SWAMP BALL'
  const pixel = 0.016
  for (let letter = 0; letter < word.length; letter++) {
    const rows = GLYPHS[word[letter]]
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '0') continue
        model.box(
          [pixel * 0.8, 0.008, 0.008],
          [((letter - 4.5) * 4 + x - 1) * pixel, 0.9 + (2 - y) * 0.009, 0.08],
          0x282a28,
        )
      }
    })
  }
}
