export const HISTORICAL_CHROLLO_PAGES = {
  'sun-and-moon': 'Sun and Moon',
  'black-voice': 'Black Voice',
  'indoor-fish': 'Indoor Fish',
  'fun-fun-cloth': 'Fun Fun Cloth',
  'chrollo-teleportation': 'Téléportation · Teleportation',
  'order-stamp': 'Order Stamp',
  'convert-hands': 'Convert Hands',
  'gallery-fake': 'Gallery Fake',
  'love-dial-6700': 'Love Dial 6700',
  'lovely-ghostwriter': 'Lovely Ghostwriter',
} as const
export type HistoricalChrolloPage = keyof typeof HISTORICAL_CHROLLO_PAGES
export function historicalChrolloPage(page: string | null): page is HistoricalChrolloPage {
  return page !== null && Object.hasOwn(HISTORICAL_CHROLLO_PAGES, page)
}
