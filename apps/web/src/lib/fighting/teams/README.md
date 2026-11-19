# Équipes et arènes · étape 8

Ce dossier complète les stocks successifs et le relais temporaire du moteur.
Un seul corps par camp est en scène. `availability.ts` partage les refus entre
l’interface et la commande ; `commitments.ts` protège les engagements de décor.
`runtime.ts` conserve les propriétaires des commandes en attente. `terrain.ts`
conserve les caisses physiques entre les manches d’un set sans transférer de Nen.
`draft.ts` conserve uniquement la composition et les options locales de sélection.

Le [transfert de conscience d’Halkenburg](../../../../../../docs/clash-halkenburg-deux-modes.md)
conserve les places du roster par conscience et les corps matériels séparément.
`halkenburgSoulTeams.ts` maintient les vies et les corps à travers les manches ;
les réserves hors scène ne sont pas des cibles. Les relais en cours s’interrompent
lors d’un transfert et une chaîne engagée ne se met pas en réserve.
