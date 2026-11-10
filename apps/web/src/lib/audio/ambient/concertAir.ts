/** A note of the air: semitones from D5, start beat, held beats. */
export type ConcertNote = readonly [pitch: number, beat: number, held: number]

export interface ConcertAir {
  /** Seconds per beat. */
  beat: number
  /** Beats in one pass, rests included; the air loops on this. */
  length: number
  notes: readonly ConcertNote[]
}

// An original sixteen-bar air for Melody's ch. 383 solo, written for this
// project. It borrows only a general character — slow, A minor with a natural
// seventh, A4 to C6, about one note a second, long notes reached through a
// quick passing note, a breath between phrases — and no line from any
// recording or score.
//
// Pitches are semitones from D5: A4 -5, B4 -3, C5 -2, D5 0, E5 2, G5 5,
// A5 7, B5 9, C6 10.
export const MELODY_CONCERT_AIR: ConcertAir = {
  beat: 0.75,
  length: 64,
  notes: [
    // I. A question that climbs to A5 and settles back onto the tonic.
    [2, 0, 1.5],
    [0, 1.5, 0.5],
    [2, 2, 1],
    [5, 3, 0.75],
    [9, 3.75, 0.25],
    [7, 4, 3],
    [5, 7, 0.5],
    [2, 7.5, 0.5],
    [0, 8, 1],
    [-2, 9, 1],
    [-3, 10, 1],
    [-2, 11, 1],
    [-5, 12, 3],
    // II. The same opening, reaching further, to C6.
    [2, 16, 1.5],
    [5, 17.5, 0.5],
    [7, 18, 1],
    [10, 19, 1],
    [9, 20, 2],
    [7, 22, 1],
    [5, 23, 1],
    [2, 24, 1],
    [5, 25, 0.5],
    [2, 25.5, 0.5],
    [0, 26, 1],
    [-3, 27, 1],
    [-5, 28, 3],
    // III. The high song, where the room turns to flowers.
    [7, 32, 1],
    [9, 33, 0.75],
    [7, 33.75, 0.25],
    [10, 34, 2],
    [9, 36, 1],
    [7, 37, 0.5],
    [5, 37.5, 0.5],
    [7, 38, 2],
    [2, 40, 1],
    [5, 41, 1],
    [7, 42, 1.5],
    [5, 43.5, 0.5],
    [2, 44, 3],
    // IV. A slow way home, leaning on B4 before the last A.
    [0, 48, 1],
    [2, 49, 1],
    [-2, 50, 1],
    [0, 51, 1],
    [-3, 52, 2],
    [-2, 54, 1],
    [-3, 55, 0.75],
    [-2, 55.75, 0.25],
    [-5, 56, 5],
  ],
}
