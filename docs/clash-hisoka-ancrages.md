# Hisoka : plusieurs supports physiques

Le ruleset **clash-combat-45** permet plusieurs connexions de Bungee Gum sur
des supports physiques de l’arène. Elles peuvent coexister avec la liaison
de combat entre deux personnes et avec les applications défensives admissibles.
Le On est conservé.

## Connexions et mouvement

La commande d’attache exige un support présent et suffisamment proche pour
être effectivement touché. Elle ne crée pas un objet avec le fil. Chaque
support attaché garde son propre fil ; attacher un deuxième support ne remplace
pas le premier. Aucun nombre maximal de connexions n’est attribué au manga.
La représentation conserve une connexion par utilisateur et par support.

Pour chaque fil, l’utilisateur peut se tirer vers le support, tirer le support
vers soi, arrêter la traction ou détacher cette connexion. Les corps et les
objets se déplacent dans l’arène réelle ; les collisions restent applicables.
Le mouvement ne donne aucune invulnérabilité et ne duplique pas le support.
Une traction ne transforme pas automatiquement un déplacement d’objet en
attaque infligeant des dégâts.

Une blessure interrompt le contrôle de traction pendant l’incapacité, sans
effacer l’adhésion existante. La destruction ou la disparition d’un support
retire seulement son fil. Les connexions déjà attachées ne sont pas coupées
automatiquement après un éloignement de 24 ou 30 unités ; ces valeurs de
l’ancienne commande de décor ne deviennent pas une limite générale du Hatsu.
Le coût de douze unités, la récupération et les vitesses restent des réglages
de duel. Cette commande représente la pose au contact, pas toutes les formes
d’émission à distance.

## Accès, contre-mesures et perception

Chaque connexion conserve son origine : pouvoir personnel, page de Skill Hunter
ou usage prêté par Dolphin. Une page de Texture Surprise ne donne pas Bungee Gum.
Une page de Bungee Gum doit rester active ; le livre et le signet gardent leurs
conditions. Une connexion prêtée ne devient pas un effet personnel du porteur.

Le premier ancrage par Dolphin dépense l’aura réellement prélevée et compte
comme son unique application. Ses commandes de maintien restent disponibles ;
une seconde attache fraîche n’est pas accordée après consommation de cet usage.
Relâcher le dernier effet termine l’application et rend le Hatsu au donneur.
Emperor Time, les conditions de conscience et les sceaux du Nen restent vérifiés.

Le vol du Hatsu, Zetsu et le On interrompent les connexions auxquelles ils
s’appliquent. Une réserve copiée ou un prêt distinct ne remplace pas une page
perdue. Un support conjuré garde sa propre échéance, même pendant un hitstop.
Les commandes ne permettent pas de suspendre des fils par un relais d’équipe.

In dissimule les connexions de Nen aux observateurs sans Gyo. Le snapshot privé
masque leur origine d’acquisition et l’identifiant du prélèvement. Le client
ne déduit pas la disparition d’un fil simplement parce que cette origine lui
est masquée. Predator peut analyser une manifestation effectivement perceptible.
Les supports physiques restent visibles et présents.

L’IA peut choisir un support réellement accessible puis une traction utile.
Les commandes de P1 et P2, les déplacements et les supports partagés se rejouent
avec le même état final.

Référence : connexions distinctes depuis la main et la jambe vers deux têtes au
[chapitre 353](https://hunterxhunter.fandom.com/wiki/Chapter_353), corroborées par
[le déroulé du combat](https://supercorona.wordpress.com/2021/05/18/hunter-x-hunter-chapter-353-cold-blooded/).
Les attaches multiples sur des personnes, les armes détachées, les prothèses et
la réanimation préparée restent à compléter. Ce jalon ne certifie pas un arsenal
achevé à 100 %.
