/** Round polygon corners without textures, keeping each garment spot in its own surface coordinates. */
export function cowSpotContour(points: ReadonlyArray<readonly [number, number]>) {
  let contour = [...points]
  for (let pass = 0; pass < 2; pass++) {
    const next: (readonly [number, number])[] = []
    contour.forEach((a, i) => {
      const b = contour[(i + 1) % contour.length]
      next.push(
        [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25],
        [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75],
      )
    })
    contour = next
  }
  return contour
}
