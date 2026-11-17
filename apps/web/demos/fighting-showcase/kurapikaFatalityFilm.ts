import { createKurapikaVictoryFilm } from './kurapikaVictoryFilm'

/** The same native capture and K.-O.; only the finishing choreography and edit change. */
export function createKurapikaFatalityFilm() {
  const base = createKurapikaVictoryFilm()
  const { film, start } = base
  const capture = base.report.nativeCaptureFrame,
    impact = base.report.nativeImpactFrame
  const end = film.states.length - 1
  const sourceAt = (age: number) =>
    age < 90
      ? start + Math.floor(((capture - start) * age) / 90)
      : age < 255
        ? capture + Math.floor(((impact - capture) * (age - 90)) / 165)
        : age < 335
          ? impact + Math.floor(((end - impact) * (age - 255)) / 80)
          : end
  const sources = Array.from({ length: start + 600 }, (_, i) =>
    i < start ? i : sourceAt(i - start),
  )
  return {
    ...base,
    sources,
    states: sources.map((source) => film.states[source]),
    report: {
      ...base.report,
      fatality: true,
      victory: {
        ...base.report.victory,
        impactFrame: start + 255,
        impactSecond: (start + 255) / 60,
        slamFrame: start + 330,
        slamSecond: (start + 330) / 60,
        announcementFrame: start + 400,
      },
    },
  }
}
