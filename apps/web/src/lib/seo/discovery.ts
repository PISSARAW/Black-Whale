/** Stable public routes shared by machine-readable discovery endpoints. */
export const DISCOVERY_ROUTES = {
  indexes: [
    { label: 'Characters', path: '/characters' },
    { label: 'Nen abilities', path: '/abilities' },
    { label: 'Canonical timeline', path: '/timeline' },
    { label: 'Ship reconstruction', path: '/ship' },
  ],
  method: [
    { label: 'About and editorial method', path: '/about' },
    { label: 'Ship reconstruction sources', path: '/tour/sources' },
  ],
  sitemap: { label: 'XML sitemap', path: '/sitemap.xml' },
} as const

export const markdownDiscoveryLinks = (
  routes: ReadonlyArray<{ label: string; path: string }>,
  siteUrl: string,
) => routes.map(({ label, path }) => `- [${label}](${siteUrl}${path})`).join('\n')
