import { mangaView as view, type MangaView } from './mangaViewModel'

/** Chapter 359, volume 34; the supplied crop does not establish a printed page. */
export const MANGA_CENTRAL_COURTHOUSE_VIEWS: MangaView[] = [
  view({
    id: 'central-courthouse-hearing',
    spaceId: 'tier-3-central-courthouse-courtroom',
    at: [-0.4, 3.8],
    target: [-0.7, -2.4],
    eyeHeight: 1.7,
    pitch: 0.06,
    chapter: 359,
    volume: 34,
    label: 'The magistrate’s exposed seat, tall gavel and court desks to the right',
    labelFr: 'Le siège découvert du magistrat, son grand maillet et les pupitres à droite',
  }),
]
