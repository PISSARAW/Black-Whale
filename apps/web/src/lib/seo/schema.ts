import { SITE_NAME, SITE_URL, absoluteUrl } from './config'

export const PUBLISHER_ID = `${SITE_URL}/#publisher`
export const MAINTAINER_ID = `${SITE_URL}/about#ginks`
export const WORK_ID = 'https://www.wikidata.org/wiki/Q696071'
export const CREATOR_ID = 'https://www.wikidata.org/wiki/Q550311'

export function publisherSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': PUBLISHER_ID,
    name: SITE_NAME,
    url: SITE_URL,
    maintainer: {
      '@type': 'Person',
      '@id': MAINTAINER_ID,
      name: 'Ginks',
      url: `${SITE_URL}/about`,
    },
  }
}

export function hunterWorkSchema() {
  return {
    '@type': 'CreativeWorkSeries',
    '@id': WORK_ID,
    name: 'Hunter × Hunter',
    alternateName: 'Hunter x Hunter',
    sameAs: [
      'https://www.wikidata.org/wiki/Q696071',
      'https://en.wikipedia.org/wiki/Hunter_%C3%97_Hunter',
    ],
    creator: {
      '@type': 'Person',
      '@id': CREATOR_ID,
      name: 'Yoshihiro Togashi',
      sameAs: [
        'https://www.wikidata.org/wiki/Q550311',
        'https://en.wikipedia.org/wiki/Yoshihiro_Togashi',
      ],
    },
  }
}

/** `description` and `language` come from the active locale's catalogue. */
export function websiteSchema(site: { description: string; language: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl(site.path),
    description: site.description,
    inLanguage: site.language,
    publisher: { '@id': PUBLISHER_ID },
    about: hunterWorkSchema(),
  }
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export function characterSchema(character: {
  name: string
  path: string
  description: string
  affiliation?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: character.name,
    url: absoluteUrl(character.path),
    description: character.description,
    ...(character.affiliation
      ? { affiliation: { '@type': 'Organization', name: character.affiliation } }
      : {}),
    subjectOf: {
      '@id': WORK_ID,
    },
  }
}

export function articleSchema(article: {
  name: string
  path: string
  description: string
  language: string
  modifiedAt: string
  type?: 'Article' | 'ProfilePage' | 'AboutPage'
  mainEntity?: unknown
}) {
  return {
    '@context': 'https://schema.org',
    '@type': article.type ?? 'Article',
    '@id': `${absoluteUrl(article.path)}#page`,
    url: absoluteUrl(article.path),
    headline: article.name,
    name: article.name,
    description: article.description,
    inLanguage: article.language,
    dateModified: article.modifiedAt,
    publisher: { '@id': PUBLISHER_ID },
    about: { '@id': WORK_ID },
    ...(article.mainEntity ? { mainEntity: article.mainEntity } : {}),
  }
}

export function collectionSchema(collection: {
  name: string
  path: string
  description: string
  items?: Array<{ name: string; path: string }>
  modifiedAt?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    url: absoluteUrl(collection.path),
    description: collection.description,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    publisher: { '@id': PUBLISHER_ID },
    about: { '@id': WORK_ID },
    ...(collection.modifiedAt ? { dateModified: collection.modifiedAt } : {}),
    ...(collection.items?.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: collection.items.length,
            itemListElement: collection.items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: absoluteUrl(item.path),
            })),
          },
        }
      : {}),
  }
}
