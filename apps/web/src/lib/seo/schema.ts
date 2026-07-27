import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from './config';

export function websiteSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_URL,
		description: DEFAULT_DESCRIPTION,
		inLanguage: 'en',
		about: {
			'@type': 'CreativeWorkSeries',
			name: 'Hunter × Hunter',
			alternateName: 'Hunter x Hunter'
		}
	};
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			item: absoluteUrl(crumb.path)
		}))
	};
}

export function characterSchema(character: { name: string; path: string; description: string; affiliation?: string | null }) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: character.name,
		url: absoluteUrl(character.path),
		description: character.description,
		...(character.affiliation ? { affiliation: { '@type': 'Organization', name: character.affiliation } } : {}),
		subjectOf: {
			'@type': 'CreativeWorkSeries',
			name: 'Hunter × Hunter'
		}
	};
}

export function collectionSchema(collection: {
	name: string;
	path: string;
	description: string;
	items?: Array<{ name: string; path: string }>;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: collection.name,
		url: absoluteUrl(collection.path),
		description: collection.description,
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
		...(collection.items?.length
			? {
					mainEntity: {
						'@type': 'ItemList',
						numberOfItems: collection.items.length,
						itemListElement: collection.items.map((item, index) => ({
							'@type': 'ListItem',
							position: index + 1,
							name: item.name,
							url: absoluteUrl(item.path)
						}))
					}
				}
			: {})
	};
}
