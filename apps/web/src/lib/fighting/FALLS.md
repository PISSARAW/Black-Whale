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

La fatality de Biscuit réutilise ces mêmes fonctions dans `victory/nativeFall.ts` (via `victory/biscuitFall.ts`) :
trajectoire à pas fixes, pose de KO native sans garde ajoutée et contact des
surfaces physiques après application de la pose. Elle n’incline pas le corps
latéralement et ne pose pas le dos sur les accessoires ou les ombres. La scène
reste réversible et le verdict du combat ne change pas.

La variante hors Brigade de Kurapika utilise aussi `victory/nativeFall.ts`,
avec une chute depuis le sol, sans impulsion de saut ou projection latérale.
Le déclenchement du pieu lance la progression de KO ; aucune garde n’est ajoutée
à la pose couchée et le contact reste calculé sur les seules surfaces du corps.

La fatality de Hanzo utilise aussi la chute native pour sa victime après le
relâchement de l’étranglement. Le double peut flotter et traverser la matière ;
le corps physique de Hanzo reste en posture volontaire de méditation jusqu’à
son retour. Le cadrage de chute garde le corps entier de la victime à l’écran.

La victoire de Bill (« Dernier rempart ») déclenche `nativeVictoryFall`
à l’image 343 après le coup d’épaule du dernier combo. La projection reprend les deux gravités
et la réception reprend la pose de KO sur le dos et les surfaces physiques.
Les mains quittent toute garde au moment de la chute native. La germination
finale n’agit pas sur le corps, qui reste au sol jusqu’à la fin. Les tests
contrôlent le sol, l’orientation et l’absence de mutation du combat pour
Benjamin, Biscuit et Bill en miroir.

La nouvelle Fatality d’Hisoka (« Regarde-moi ») utilise `nativeVictoryFall`
à l’image 390 pour la mort de peur mise en scène. Les membres sont remis au
neutre avant la pose de KO pour ne pas additionner une garde ou le geste de
panique à la réception. La caméra montre le corps entier pendant la chute ;
la victime reste présente jusqu’à la fin. Le Ren et le regard en Gyo ne déplacent
pas le corps et ne changent jamais le verdict ou les points de vie du combat.

« L’héritage de Beyond » fait chuter le porteur (Furykov ou Longhi) à l’image
72, puis le prince à 432 avec la même fonction native. La seconde chute reçoit
seulement un contexte de rendu permuté ; le verdict reste inchangé. Les mains
du prince quittent le geste de lutte avant le KO. Les corps restent visibles
au sol, sans résurrection ; la caméra large montre chaque chute en entier.

La victoire personnelle de Longhi joue cinq frappes natives ; Furykov
utilise sa contre-arme préparée pour trois frappes. Les deux lancent `nativeVictoryFall` à 415. Le rendu du vaincu quitte les
poses de combat avant cet appel, sans superposer deux rigs empruntés. Le corps
reste présent et posé sur ses surfaces physiques au portrait final. Les tests
couvrent Franklin, Kalluto, Hisoka et les miroirs, avec restauration complète.
