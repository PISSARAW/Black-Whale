# Profils et perception En

Contrat et registre des quarante combattants : [EN.md](../EN.md).

| Module             | Responsabilité                                                                    |
| ------------------ | --------------------------------------------------------------------------------- |
| `profiles.ts`      | Preuves séparées des rayons de jeu ; résolution par véritable propriétaire du Nen |
| `access.ts`        | Admission, état vivant, aura disponible, champ actif et limites                   |
| `contacts.ts`      | Présences et contours anonymes pour la présentation privée                        |
| `interruptions.ts` | Concentration de Phinks face aux déplacements et paroles audibles                 |
| `presentation.ts`  | Explication bilingue des preuves et réglages                                      |
| `contactScene.ts`  | Contours et mouvements neutres réutilisés, sans révéler un Hatsu dissimulé        |

L’état physique ne consomme pas `enReadings` ; seuls les consommateurs privés de
présentation le lisent. La simulation mesure les présences du terrain autoritaire.
Les collisions et les effets cachés restent dans leur moteur existant.

`geometry.ts` mesure les contours des collisions, ne transmet que la partie
perçue dans le champ et filtre les données mises en cache.
