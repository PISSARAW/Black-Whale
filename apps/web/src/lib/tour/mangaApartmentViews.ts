import { mangaView, type MangaView } from './mangaViewModel'

export const MANGA_APARTMENT_VIEWS: MangaView[] = Array.from({ length: 14 }, (_, index) => {
  const room = String(1001 + index)
  const base = `tier-1-royal-residential-sector-room-${room}`
  return mangaView({
    id: `prince-apartment-${room}-aerial-plan`,
    spaceId: `${base}-living`,
    at: [0, 0],
    target: [0, -1],
    pitch: -1.5,
    eyeHeight: 16,
    chapter: 363,
    volume: 35,
    pages: '49–50',
    label: `Aerial manga plan of princely apartment ${room}`,
    labelFr: `Plan manga aérien de l’appartement princier ${room}`,
    triggerSpaceIds: [
      `${base}-entrance`,
      `${base}-servants`,
      `${base}-servants-wc`,
      `${base}-bathroom`,
    ],
  })
})
