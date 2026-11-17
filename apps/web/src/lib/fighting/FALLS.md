# Chutes, relevés et KO aériens

Les poses `down` et `ko` partent d’un modèle neutre et d’une seule chorégraphie
de réaction. Elles ont priorité sur les poses de techniques maintenues. La garde
personnelle n’est pas ajoutée à la pose couchée. Les avant-bras restent devant le
corps ; ils ne servent pas de supports sous le dos.

`fightGroundContact.ts` ajuste la hauteur après toutes les couches et transitions
d’animation. Les sommets du torse, du bassin, du crâne et des membres déterminent
le contact ; les accessoires, cheveux, auras et ombres ne soulèvent pas le corps.
Le contrôle évite aussi de traverser le sol pendant une chute aérienne. Les poses
couchées et de relevé utilisent ce contact plutôt qu’un pied verrouillé.

Après le verdict, `finishedFallPresentation.ts` poursuit visuellement la trajectoire
verticale avec les mêmes pas de gravité que le combat. Le résultat, les positions
autoritaires et les empreintes de replay restent inchangés. La pose aérienne laisse
place à la réception puis à la pose couchée. Les deux camps ont leur propre
trajectoire ; une nouvelle manche ou un nouvel enregistrement les réinitialise.
Le temps d’animation s’arrête avec la scène en pause. La caméra réserve la largeur
d’un corps couché, y compris sur mobile.

`fightFalls.test.ts` couvre les 40 modèles, leurs deux orientations, les contacts,
les transitions et les relevés. `finishedFallPresentation.test.ts` vérifie de vrais
KO aériens et la gravité à 120, 60, 30 et 20 Hz, sans mutation du verdict.

`node apps/web/scripts/check-fighting-falls.mjs` vérifie le rendu de production :
huit gabarits dans les deux camps, relevés, KO en montée et en descente sur
ordinateur et mobile, cadrage complet et pause. Captures et rapport se trouvent
dans `/tmp/black-whale-falls` par défaut (`FALL_CHECK_OUTPUT` permet de le changer).
