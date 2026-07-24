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
	
	// Fallback mock if API is down
	return {
		abilities: [
			{ id: 'bungee-gum', name: 'Bungee Gum', owner: 'hisoka' }
		]
	};
};
