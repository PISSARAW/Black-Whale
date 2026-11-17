# Étape 9 · identité, dialogues et collection

Le profil `/fighting/profile` propose une collection locale : les titres
Éclaireur, Sentinelle et Finaliste des parcours solo deviennent équipables.
Protéger et tenir débloque aussi une variante ivoire. La variante ardoise est
accessible dès le départ ; la tenue de référence reste le choix initial.
Ces variantes sont des palettes originales de Clash, pas de nouveaux costumes
attribués au manga. Elles gardent les coupes, gabarits, postures, armes et pièces
signatures. La collection ne fournit aucun pouvoir, équipement ou bonus.

## Textes et fins

Les quarante personnages ont une introduction et une réplique de victoire
originales en français et anglais. Huit confrontations ont un échange spécifique,
à partir des seules identités sélectionnées : Kurapika/Chrollo, Hisoka/Chrollo,
Hisoka/Illumi, Theta/Tserriednich, Benjamin/Halkenburg, Kurapika/Leorio,
Kalluto/Illumi et Franklin/Phinks. Aucun texte n’est une citation du manga ;
aucun dialogue ne révèle une préparation ou une capacité cachée.

Les introductions respectent les réglages complet, bref et désactivé existants,
sans retarder le lancement. La fin distingue manche, duel et expiration du temps.
Elle attend le verdict réel, y compris la résolution post-mortem de Cat’s Name,
et n’est pas produite pour une prévision ou un résultat nul. Le titre affiché
est explicitement celui du profil local, sans l’attribuer à l’adversaire.
Les fins originales des trois parcours solo restent celles de l’étape 7.
Le doublage demeure différé ; ce lot n’ajoute pas de voix.

## Tenues et sauvegarde

Les palettes P1 et P2 s’appliquent aux deux places physiques dans la vue locale,
y compris les vues de prévision, sans changer avec le spectateur. L’aperçu
repliable propose les quarante modèles au repos, sans démarrer de combat.
Seuls trois champs de couleur du profil de rendu changent : veste, pantalon,
chemise. Peau, cheveux, pièces signatures, armes et effets de Nen gardent leurs
repères. Les panneaux de peau restent de la peau. Les projections, déguisements,
formes de Bonolenov, Texture Surprise et vraie forme de Biscuit gardent les
vêtements de référence ; les vidéos de victoire préfabriquées également.
Aucun maillage, lumière ou passe supplémentaire n’est nécessaire par figure.
Les préférences ne provoquent de reconstruction que si l’apparence effective
change, avec les règles d’invalidation du modèle existantes.

La clé `black-whale:clash:presentation:1` est séparée de la carrière et du solo.
Les titres et palettes sont revalidés contre les routes terminées sauvegardées ;
une sauvegarde invalide ou effacée retire les choix verrouillés. Les sélections
d’un autre onglet sont relues avant modification. Sans stockage, les palettes
libres fonctionnent pour la session. Les récompenses sont locales, sans valeur
de preuve serveur et sans effet sur les classements. Aucun ruleset n’est changé.

## Vérifications

Les tests de `presentation/` couvrent les quarante identités, les dialogues
réciproques, les verdicts différés, la confidentialité, les sauvegardes et
verrous de récompenses. Les deux palettes sont comparées à la géométrie de
référence de chacun des quarante modèles, sans mutation de l’état de combat.
Le script `scripts/check-fighting-presentation.mjs` vérifie la collection,
les langues, les dispositions étroites, la persistance et les cérémonies.

Qualification du 17 novembre 2026 : 181 tests ciblés réussis (présentation,
carrière, solo, invalidation et expressions faciales), 23 tests de structure
réussis, contrôle TypeScript sans erreur et lint du périmètre réussi.
Le navigateur vérifie onze points, dont huit captures de dispositions bilingues,
le titre obtenu après le véritable parcours Lire une manifestation, sa
persistance, les réglages d’introduction et l’aperçu WebGL après changement de
personnage. Les captures sont relues visuellement. Le build respecte la limite
inchangée de 500 000 octets par chunk client (maximum mesuré : 469 932).
Ces mesures ne constituent pas une nouvelle qualification matérielle de cadence.

Les vérifications globales restent rouges sur les défauts du socle : minimum
artificiel de quatre usages de Voconte dans deux packages ; erreurs de registre
`run is not a function`, attentes de combat et références visuelles/traductions
périmées dans le web. Le lancement complet rapporte 7 835 échecs web et
10 654 réussites ; 29 échecs représentatifs sont reproduits sans ce lot sur
huit fichiers de la référence. Le lint global rapporte 24 erreurs et cinq
avertissements dans des fichiers hors périmètre. Aucun quatrième pouvoir de
Voconte n’est ajouté pour satisfaire ces tests.
