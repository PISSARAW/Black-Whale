import { writable } from 'svelte/store';

// Détecte grossièrement si on est sur mobile pour définir l'état par défaut (Éco sur mobile, Immersif sur desktop).
const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const immersiveMode = writable(!isMobile);
