import { mangaView, type MangaView } from './mangaViewModel'

export const MANGA_APARTMENT_VIEWS: MangaView[] = Array.from({ length: 14 }, (_, index) => {
  const room = String(1001 + index)
  const base = `tier-1-royal-residential-sector-room-${room}`
  const hasChapter368Cutaway = Number(room) >= 1011
  return mangaView({
    id: `prince-apartment-${room}-aerial-plan`,
    spaceId: `${base}-living`,
    at: [0, 0],
    target: [0, -1],
    pitch: -1.5,
    eyeHeight: 16,
    chapter: hasChapter368Cutaway ? 368 : 363,
    volume: 35,
    pages: hasChapter368Cutaway ? '149–150' : '49–50',
    label:
      room === '1011'
        ? 'Room 1011 walked-layout reconstruction — not a metric reproduction of the chapter 368 cutaway'
        : hasChapter368Cutaway
          ? `Chapter 368 cutaway of princely apartment ${room}`
          : `Chapter 363 programme-type for princely apartment ${room}`,
    labelFr:
      room === '1011'
        ? 'Implantation de visite reconstituée du 1011 — la coupe du chapitre 368 ne fournit pas de relevé métrique'
        : hasChapter368Cutaway
          ? `Coupe du chapitre 368 de l’appartement princier ${room}`
          : `Programme-type du chapitre 363 pour l’appartement princier ${room}`,
    triggerSpaceIds: [
      `${base}-entrance`,
      `${base}-servants`,
      `${base}-servants-wc`,
      `${base}-bathroom`,
    ],
  })
})
