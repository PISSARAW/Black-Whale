import type { CatalogCharacter } from '$lib/server/data-files';

/**
 * The faction chips offered by the ship map filter. These are reader-facing
 * groupings, not canonical factions: "princes" means the heirs themselves, not
 * everyone in their camp.
 */
export type FactionFilterId = 'princes' | 'guards' | 'hunters' | 'spider' | 'mafia';

/** What the resolver needs from a character row; the rest of it is irrelevant. */
export interface FactionSubject {
	canonicalName: string;
	slug?: string | null;
	description?: string | null;
}

export interface AbilityCatalogEntry {
	ownerId?: string | null;
	name: string;
}

/** Index the canon catalogue by display name, the only key both sides share. */
export function buildCatalogIndex(catalog: CatalogCharacter[]): Map<string, CatalogCharacter> {
	return new Map(catalog.map((character) => [character.canonicalName, character]));
}

/** Index Hatsu names by their owner's catalogue id. */
export function buildHatsuIndex(abilities: AbilityCatalogEntry[]): Map<string, string[]> {
	const byOwner = new Map<string, string[]>();
	for (const ability of abilities) {
		if (!ability.ownerId) continue;
		const names = byOwner.get(ability.ownerId) ?? [];
		names.push(ability.name);
		byOwner.set(ability.ownerId, names);
	}
	return byOwner;
}

/** The filter chips implied by an affiliation type recorded in the database. */
export function factionTagsForMembershipType(type: string): FactionFilterId[] {
	switch (type) {
		case 'KAKIN_ROYAL_ARMY':
		case 'BENJAMIN_PRIVATE_ARMY':
			return ['guards'];
		case 'HUNTER_ASSOCIATION':
			return ['hunters'];
		case 'PHANTOM_TROUPE':
			return ['spider'];
		case 'MAFIA_FAMILY':
			return ['mafia'];
		default:
			return [];
	}
}

/** Strip accents and case so the French and English role text match one regex. */
function searchableText(parts: Array<string | null | undefined>): string {
	return parts
		.filter(Boolean)
		.join(' ')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

const HUNTER_ROLE = /\b(hunter|zodiaque)\b/;
const GUARD_ROLE = /\b(garde|guard|protecteur|soldat|soldier|securite)\b/;

/**
 * Which filter chips a character belongs to at a given point in the story.
 *
 * Temporal `AffiliationMembership` rows are authoritative when they exist. The
 * imported canon catalogue — including a regex over the role text — remains a
 * fallback while that table is progressively populated, so a character with no
 * recorded membership still lands in a sensible chip.
 */
export function resolveFactionTags(
	subject: FactionSubject,
	activeFactionTypes: string[],
	catalogIndex: Map<string, CatalogCharacter>
): FactionFilterId[] {
	const tags = new Set<FactionFilterId>();
	for (const type of activeFactionTypes) {
		for (const tag of factionTagsForMembershipType(type)) tags.add(tag);
	}

	const catalogued = catalogIndex.get(subject.canonicalName);
	const factionId = catalogued?.factionId || '';
	const roleText = searchableText([
		subject.slug,
		subject.description,
		catalogued?.description,
		catalogued?.shipLocation?.role
	]);

	if (catalogued?.id.startsWith('prince-')) tags.add('princes');
	if (factionId === 'phantom-troupe') tags.add('spider');
	if (factionId.startsWith('mafia-')) tags.add('mafia');
	if (factionId === 'zodiacs' || HUNTER_ROLE.test(roleText)) tags.add('hunters');
	if (GUARD_ROLE.test(roleText)) tags.add('guards');

	return [...tags];
}

/** The Hatsu names attributed to a character, resolved through the catalogue. */
export function hatsuNamesFor(
	subject: FactionSubject,
	catalogIndex: Map<string, CatalogCharacter>,
	hatsuIndex: Map<string, string[]>
): string[] {
	const ownerId = catalogIndex.get(subject.canonicalName)?.id ?? subject.slug;
	return (ownerId ? hatsuIndex.get(ownerId) : undefined) ?? [];
}
