import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const res = await fetch('http://localhost:3001/v1/nen/abilities');
		if (res.ok) {
			const abilities = await res.json();
			return { abilities };
		}
	} catch (e) {
		console.error("Failed to fetch abilities from API:", e);
	}
	
	// Fallback mock if API is down - matches the full ability structure
	return {
		abilities: [
			{
				id: 'bungee-gum',
				name: 'Bungee Gum',
				owner: 'hisoka',
				category: 'transmuter',
				description: "Hisoka's Nen has properties of both rubber and gum. Can be stretched, retracted, and attached to targets.",
				canonStatus: 'canon'
			},
			{
				id: 'emperor-time',
				name: 'Emperor Time',
				owner: 'kurapika',
				category: 'specialist',
				description: "When Kurapika's eyes turn scarlet, he gains 100% proficiency in all Nen categories at the cost of one hour of his lifespan per second.",
				canonStatus: 'canon'
			},
			{
				id: 'steal-chain',
				name: 'Steal Chain (Judgment Chain)',
				owner: 'kurapika',
				category: 'conjurer',
				description: "Kurapika's chain with conditions on targets. Violating them causes death.",
				canonStatus: 'canon'
			}
		]
	};
};
