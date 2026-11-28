# Données de frames des normaux

<!-- Fichier généré par `pnpm fighting:frames` depuis frameDataTable.ts. Ne pas éditer. -->

Lot 0 de la [proposition de grammaire de combo](./COMBO_GRAMMAR.md). Les valeurs
portent sur les normaux et coups de commande au sol, pour une touche ordinaire sur
la première frame active : ni contre-attaque (+3), ni écrasement au mur, ni
décroissance du hitstun de [STEP3.md](./STEP3.md). « Sol » signale une mise au
sol. `moveFrameAdvantage.test.ts` vérifie chaque valeur contre la mesure réelle
du laboratoire, pour les quarante personnages, sur touche et sur garde.

## Synthèse

« Sûrs » : −3 ou mieux sur garde. « Liens sur soi » : avantage sur touche
supérieur au démarrage du même coup, ce qui permet de le répéter en lien. Un lien
laisse « avantage − démarrage du coup suivant » frames pour lancer la suite.

| Personnage | Coups | Meilleur sur touche | À +5 ou plus | Sûrs sur garde | Liens sur soi |
| ---------- | ----: | ------------------: | -----------: | -------------: | ------------: |
| Kurapika | 7 | +9 | 1 | 2 | 0 |
| Hisoka | 7 | +3 | 0 | 5 | 0 |
| Chrollo | 7 | +3 | 0 | 2 | 0 |
| Benjamin | 7 | +11 | 1 | 1 | 0 |
| Tserriednich | 7 | +3 | 0 | 1 | 0 |
| Feitan | 7 | +4 | 0 | 7 | 0 |
| Saiyu | 7 | +4 | 0 | 2 | 0 |
| Theta | 7 | +5 | 1 | 3 | 0 |
| Biscuit | 7 | +4 | 0 | 4 | 0 |
| Phinks | 7 | +4 | 0 | 3 | 0 |
| Franklin | 7 | +4 | 0 | 1 | 0 |
| Machi | 7 | +4 | 0 | 2 | 0 |
| Illumi | 7 | +4 | 0 | 3 | 0 |
| Kalluto | 7 | +3 | 0 | 5 | 0 |
| Bonolenov | 7 | +5 | 3 | 1 | 0 |
| Shizuku | 7 | +4 | 0 | 2 | 0 |
| Hinrigh | 7 | +3 | 0 | 1 | 0 |
| Mizaistom | 7 | +5 | 3 | 2 | 0 |
| Leorio | 7 | +4 | 0 | 2 | 0 |
| Hanzo | 7 | +3 | 0 | 4 | 0 |
| Rihan | 7 | +5 | 2 | 1 | 0 |
| Zakuro | 7 | +4 | 0 | 1 | 0 |
| Melody | 7 | +4 | 0 | 2 | 0 |
| Basho | 7 | +5 | 1 | 1 | 0 |
| Camilla | 7 | +5 | 1 | 3 | 0 |
| Halkenburg | 7 | +5 | 1 | 2 | 0 |
| Gel | 7 | +4 | 0 | 1 | 0 |
| Lynch | 7 | +4 | 0 | 2 | 0 |
| Luini | 7 | +4 | 0 | 2 | 0 |
| Bill | 7 | +4 | 0 | 1 | 0 |
| Furykov | 7 | +5 | 1 | 3 | 0 |
| Cluck | 7 | +4 | 0 | 4 | 0 |
| Beyond | 7 | +4 | 0 | 1 | 0 |
| Longhi | 7 | +4 | 0 | 1 | 0 |
| Musse | 7 | +4 | 0 | 2 | 0 |
| Padaille | 7 | +5 | 1 | 2 | 0 |
| Sayird | 7 | +4 | 0 | 2 | 0 |
| Terebellum | 7 | +5 | 1 | 3 | 0 |
| Voconte | 7 | +4 | 0 | 3 | 0 |
| Yokotani | 7 | +5 | 1 | 1 | 0 |

## Par personnage

### Kurapika

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pointe de rappel | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Crochet au corps | `standingHeavy` | mid | 8 | 4 | 14 | +3 | −4 |
| Main en ancrage | `lowLight` | low | 5 | 3 | 9 | +2 | −4 |
| Fauchage en rappel | `lowHeavy` | low | 10 | 4 | 19 | Sol | −8 |
| Pendule rasant | `forwardLight` | mid | 6 | 3 | 5 | +4 | −2 |
| Pas de l’index | `forwardHeavy` | mid | 13 | 5 | 22 | Sol | −8 |
| Rappel du geôlier | `backHeavy` | mid | 10 | 4 | 16 | +9 | −4 |

### Hisoka

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Claquement de poignet | `standingLight` | mid | 3 | 3 | 7 | +2 | −1 |
| Talon élastique | `standingHeavy` | mid | 8 | 4 | 12 | +3 | −2 |
| Doigts à la cheville | `lowLight` | low | 4 | 3 | 8 | +3 | −3 |
| Balayage en ressort | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Carte boomerang | `forwardLight` | mid | 6 | 3 | 10 | +3 | −1 |
| Tête de marteau | `forwardHeavy` | mid | 11 | 5 | 16 | +3 | −2 |
| Faux déséquilibre | `backHeavy` | mid | 12 | 4 | 22 | Sol | −10 |

### Chrollo

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique du voleur | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Coup de pied d’arrêt | `standingHeavy` | mid | 8 | 4 | 9 | +3 | +1 |
| Frappe basse | `lowLight` | low | 5 | 3 | 10 | +3 | −5 |
| Fauchage silencieux | `lowHeavy` | low | 10 | 4 | 19 | Sol | −8 |
| Page tranchante | `forwardLight` | mid | 9 | 3 | 22 | −8 | −13 |
| Lecture en mouvement | `forwardHeavy` | mid | 13 | 5 | 20 | −2 | −6 |
| Pas du voleur | `backHeavy` | mid | 9 | 4 | 16 | +3 | −4 |

### Benjamin

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de barrage | `standingLight` | mid | 5 | 3 | 9 | +3 | −3 |
| Percussion d’épaule | `standingHeavy` | mid | 10 | 4 | 17 | +3 | −7 |
| Coup d’arrêt du pied | `lowLight` | low | 6 | 3 | 11 | +2 | −6 |
| Talon d’appui | `lowHeavy` | low | 11 | 4 | 21 | Sol | −10 |
| Percée du premier prince | `forwardLight` | mid | 8 | 3 | 13 | +4 | −4 |
| Genou d’exécution | `forwardHeavy` | mid | 15 | 5 | 25 | Sol | −11 |
| Discipline de fer | `backHeavy` | mid | 12 | 4 | 16 | +11 | −4 |

### Tserriednich

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main de mesure | `standingLight` | mid | 4 | 3 | 10 | +1 | −4 |
| Revers après le silence | `standingHeavy` | mid | 9 | 4 | 19 | +1 | −9 |
| Pointe en attente | `lowLight` | low | 5 | 3 | 10 | +3 | −5 |
| Talon au contretemps | `lowHeavy` | low | 9 | 4 | 21 | Sol | −10 |
| Pas après la pause | `forwardLight` | mid | 6 | 3 | 12 | −1 | −3 |
| Rupture de l’axe | `forwardHeavy` | mid | 14 | 5 | 22 | Sol | −8 |
| Temps volé | `backHeavy` | mid | 8 | 4 | 23 | −5 | −11 |

### Feitan

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Estoc bref | `standingLight` | mid | 3 | 2 | 7 | +2 | 0 |
| Taille de sabre | `standingHeavy` | mid | 7 | 3 | 12 | +3 | −1 |
| Entaille basse | `lowLight` | low | 4 | 2 | 8 | +4 | −2 |
| Fauchage éclair | `lowHeavy` | low | 8 | 3 | 15 | Sol | −3 |
| Croisement funèbre | `forwardLight` | mid | 5 | 2 | 9 | +3 | +1 |
| Escalier de la douleur | `forwardHeavy` | mid | 11 | 4 | 17 | Sol | −2 |
| Lame sans ombre | `backHeavy` | mid | 8 | 3 | 12 | +3 | +1 |

### Saiyu

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pointe du bâton | `standingLight` | mid | 4 | 3 | 9 | +3 | −3 |
| Abattée de la hampe | `standingHeavy` | mid | 8 | 4 | 17 | +3 | −7 |
| Pique basse | `lowLight` | low | 5 | 3 | 10 | +4 | −5 |
| Balayage du bâton | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
| Pas de pointe | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Grand arc de la hampe | `forwardHeavy` | mid | 12 | 5 | 22 | Sol | −8 |
| Talon du bâton | `backHeavy` | mid | 12 | 4 | 22 | −3 | −10 |

### Theta

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de contrôle | `standingLight` | mid | 4 | 3 | 9 | +2 | −3 |
| Crosse en percussion | `standingHeavy` | mid | 8 | 4 | 15 | +4 | −5 |
| Coup d’arrêt à la cheville | `lowLight` | low | 5 | 3 | 8 | +5 | −3 |
| Fauchage de protection | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
| Prise de ligne | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Interception au genou | `forwardHeavy` | mid | 12 | 5 | 18 | Sol | −4 |
| Contre sous couverture | `backHeavy` | mid | 8 | 4 | 18 | 0 | −6 |

### Biscuit

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de correction | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Remontée sous la garde | `standingHeavy` | mid | 8 | 4 | 13 | +4 | −3 |
| Point d’appui | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Talon de correction | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
| Leçon de posture | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Petit pas Shingen | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Révélation musculaire | `backHeavy` | mid | 10 | 4 | 14 | +4 | −2 |

### Phinks

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct de météore | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Crochet de la Brigade | `standingHeavy` | mid | 11 | 4 | 12 | +4 | −2 |
| Poing rasant | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Fauchage brutal | `lowHeavy` | low | 11 | 4 | 21 | Sol | −10 |
| Marche du Cyclotron | `forwardLight` | mid | 8 | 3 | 12 | +4 | −3 |
| Bélier de Meteor City | `forwardHeavy` | mid | 16 | 5 | 27 | Sol | −13 |
| Faux relâchement | `backHeavy` | mid | 12 | 4 | 17 | +3 | −5 |

### Franklin

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de couverture | `standingLight` | mid | 5 | 3 | 9 | +4 | −3 |
| Double marteau | `standingHeavy` | mid | 11 | 4 | 18 | +4 | −8 |
| Main basse d’arrêt | `lowLight` | low | 6 | 3 | 11 | +4 | −6 |
| Écrasement à deux mains | `lowHeavy` | low | 11 | 4 | 21 | Sol | −10 |
| Marche de suppression | `forwardLight` | mid | 8 | 3 | 14 | +4 | −5 |
| Croisement balistique | `forwardHeavy` | mid | 16 | 5 | 27 | Sol | −13 |
| Crosse humaine | `backHeavy` | mid | 12 | 4 | 18 | +2 | −6 |

### Machi

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de passage | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Traction en crochet | `standingHeavy` | mid | 8 | 4 | 15 | +1 | −5 |
| Coup de pointe court | `lowLight` | low | 4 | 3 | 9 | +3 | −4 |
| Fauchage au pivot | `lowHeavy` | low | 9 | 4 | 16 | Sol | −5 |
| Pas de couture | `forwardLight` | mid | 6 | 3 | 9 | +4 | 0 |
| Double appui de traction | `forwardHeavy` | mid | 12 | 5 | 18 | Sol | −4 |
| Reprise au poignet | `backHeavy` | mid | 11 | 4 | 19 | −2 | −7 |

### Illumi

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pointe des doigts | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Tranchant de la main | `standingHeavy` | mid | 8 | 4 | 14 | +2 | −4 |
| Pointe basse | `lowLight` | low | 4 | 3 | 8 | +4 | −3 |
| Coup d’arrêt bas | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Pas arrêté | `forwardLight` | mid | 6 | 3 | 9 | +4 | 0 |
| Percussion du talon | `forwardHeavy` | mid | 12 | 5 | 19 | Sol | −5 |
| Reprise dans l’axe | `backHeavy` | mid | 12 | 4 | 21 | −4 | −9 |

### Kalluto

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Éventail tranchant | `standingLight` | mid | 3 | 3 | 6 | +3 | 0 |
| Revers de papier | `standingHeavy` | mid | 8 | 4 | 12 | +3 | −2 |
| Confettis rasants | `lowLight` | low | 4 | 3 | 8 | +3 | −3 |
| Fauchage de l’éventail | `lowHeavy` | low | 8 | 4 | 17 | Sol | −6 |
| Éventail lunaire | `forwardLight` | mid | 6 | 3 | 7 | +3 | +2 |
| Pas de papier | `forwardHeavy` | mid | 11 | 5 | 22 | Sol | −8 |
| Mue protectrice | `backHeavy` | mid | 8 | 4 | 13 | +3 | −1 |

### Bonolenov

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Battement du genou | `standingLight` | mid | 5 | 3 | 10 | +2 | −4 |
| Talon de la mesure | `standingHeavy` | mid | 9 | 4 | 15 | +5 | −5 |
| Contretemps du pied | `lowLight` | low | 6 | 3 | 9 | +5 | −4 |
| Balayage tournant | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pas en travers | `forwardLight` | mid | 6 | 3 | 10 | +5 | −1 |
| Tour du talon | `forwardHeavy` | mid | 13 | 5 | 20 | Sol | −6 |
| Reprise sur le contretemps | `backHeavy` | mid | 12 | 4 | 22 | −3 | −10 |

### Shizuku

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Coup de Blinky | `standingLight` | mid | 4 | 3 | 8 | +4 | −2 |
| Marteau aspirant | `standingHeavy` | mid | 10 | 4 | 15 | +4 | −5 |
| Tuyau rasant | `lowLight` | low | 5 | 3 | 10 | +4 | −5 |
| Balayage ménager | `lowHeavy` | low | 10 | 4 | 20 | Sol | −9 |
| Blinky marteau | `forwardLight` | mid | 7 | 3 | 12 | +4 | −3 |
| Nettoyage latéral | `forwardHeavy` | mid | 14 | 5 | 25 | Sol | −11 |
| Zone propre | `backHeavy` | mid | 10 | 4 | 16 | +3 | −4 |

### Hinrigh

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Prise de contact | `standingLight` | mid | 4 | 3 | 11 | 0 | −5 |
| Crochet de rabattage | `standingHeavy` | mid | 8 | 4 | 17 | +3 | −7 |
| Main à la hanche | `lowLight` | low | 5 | 3 | 10 | +3 | −5 |
| Croche-pied en travers | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
| Main sur l’épaule | `forwardLight` | mid | 6 | 3 | 12 | +3 | −3 |
| Percée de l’épaule | `forwardHeavy` | mid | 12 | 5 | 20 | Sol | −6 |
| Revers de dégagement | `backHeavy` | mid | 11 | 4 | 23 | −4 | −11 |

### Mizaistom

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Barrage de l’avant-bras | `standingLight` | mid | 5 | 3 | 7 | +5 | −1 |
| Interception montante | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Arrêt du pied | `lowLight` | low | 5 | 3 | 9 | +5 | −4 |
| Talon d’arrêt | `lowHeavy` | low | 8 | 4 | 24 | Sol | −13 |
| Marquer la ligne | `forwardLight` | mid | 6 | 3 | 11 | +5 | −2 |
| Refoulement | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Coude de barrage | `backHeavy` | mid | 8 | 4 | 20 | 0 | −8 |

### Leorio

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct d’appui | `standingLight` | mid | 4 | 3 | 9 | +3 | −3 |
| Uppercut du sol | `standingHeavy` | mid | 10 | 4 | 18 | +1 | −8 |
| Direct au corps | `lowLight` | low | 5 | 3 | 11 | +3 | −6 |
| Crochet au flanc | `lowHeavy` | low | 10 | 4 | 20 | Sol | −9 |
| Double pas de boxe | `forwardLight` | mid | 7 | 3 | 10 | +4 | −1 |
| Direct du droit en charge | `forwardHeavy` | mid | 14 | 5 | 22 | Sol | −8 |
| Crochet de recul | `backHeavy` | mid | 12 | 4 | 33 | +2 | −21 |

### Hanzo

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Tranchant de la paume | `standingLight` | mid | 3 | 3 | 7 | +2 | −1 |
| Talon du pivot | `standingHeavy` | mid | 7 | 4 | 14 | +1 | −4 |
| Talon sous la garde | `lowLight` | low | 4 | 3 | 8 | +3 | −3 |
| Fauchage sans élan | `lowHeavy` | low | 8 | 4 | 15 | Sol | −4 |
| Pas masqué | `forwardLight` | mid | 6 | 3 | 8 | +3 | +1 |
| Paume de traversée | `forwardHeavy` | mid | 11 | 5 | 17 | Sol | −3 |
| Retrait en ciseaux | `backHeavy` | mid | 8 | 4 | 17 | −1 | −5 |

### Rihan

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Écart de la main | `standingLight` | mid | 5 | 3 | 10 | +2 | −4 |
| Coude à l’affût | `standingHeavy` | mid | 10 | 4 | 15 | +5 | −5 |
| Sonde du pied | `lowLight` | low | 6 | 3 | 9 | +5 | −4 |
| Piège à l’appui | `lowHeavy` | low | 9 | 4 | 16 | Sol | −5 |
| Pas de confirmation | `forwardLight` | mid | 6 | 3 | 10 | +1 | −1 |
| Arrêt du talon | `forwardHeavy` | mid | 14 | 5 | 20 | Sol | −6 |
| Riposte à la faute | `backHeavy` | mid | 12 | 4 | 21 | −2 | −9 |

### Zakuro

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main en crochet | `standingLight` | mid | 4 | 3 | 10 | +1 | −4 |
| Traction au coude | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup sous la traction | `lowLight` | low | 5 | 3 | 10 | +3 | −5 |
| Fauchage enroulé | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Main d’accroche | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Rabattage du bras arrière | `forwardHeavy` | mid | 12 | 5 | 20 | Sol | −6 |
| Retour de traction | `backHeavy` | mid | 12 | 4 | 21 | −3 | −9 |

### Melody

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume en levée | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Talon du contretemps | `standingHeavy` | mid | 8 | 4 | 15 | +4 | −5 |
| Pointe discrète | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Balayage en demi-temps | `lowHeavy` | low | 9 | 4 | 16 | Sol | −5 |
| Paume en passant | `forwardLight` | mid | 6 | 3 | 9 | +4 | 0 |
| Reprise circulaire | `forwardHeavy` | mid | 12 | 5 | 18 | Sol | −4 |
| Contre sur l’expire | `backHeavy` | mid | 12 | 4 | 20 | −1 | −8 |

### Basho

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Premier vers | `standingLight` | mid | 5 | 3 | 12 | 0 | −6 |
| Vers de rupture | `standingHeavy` | mid | 10 | 4 | 17 | +3 | −7 |
| Borne du pied avant | `lowLight` | low | 6 | 3 | 12 | +2 | −7 |
| Balayage de la page | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Frappe du trait bref | `forwardLight` | mid | 6 | 3 | 11 | +5 | −2 |
| Talon de fermeture | `forwardHeavy` | mid | 14 | 5 | 21 | Sol | −7 |
| Poing en retrait | `backHeavy` | mid | 13 | 4 | 22 | −2 | −10 |

### Camilla

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Gifle de dédain | `standingLight` | mid | 5 | 3 | 7 | +5 | −1 |
| Paume impériale | `standingHeavy` | mid | 12 | 4 | 21 | −1 | −11 |
| Revers rasant | `lowLight` | low | 5 | 3 | 10 | +3 | −5 |
| Paume au genou | `lowHeavy` | low | 12 | 4 | 19 | Sol | −8 |
| Gifle en passant | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Paume provocatrice | `forwardHeavy` | mid | 16 | 5 | 25 | Sol | −11 |
| Revers de riposte | `backHeavy` | mid | 6 | 4 | 15 | +4 | −3 |

### Halkenburg

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main de visée | `standingLight` | mid | 5 | 3 | 9 | +3 | −3 |
| Détente du poing | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Talon de garde | `lowLight` | low | 6 | 3 | 11 | +3 | −6 |
| Fauchage de l’axe | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Prise de ligne | `forwardLight` | mid | 6 | 3 | 11 | +5 | −2 |
| Percée dans l’axe | `forwardHeavy` | mid | 14 | 5 | 21 | Sol | −7 |
| Dégagement de l’axe | `backHeavy` | mid | 13 | 4 | 22 | −1 | −10 |

### Gel

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main de mesure | `standingLight` | mid | 4 | 3 | 10 | +1 | −4 |
| Détente du bras droit | `standingHeavy` | mid | 8 | 4 | 18 | +2 | −8 |
| Pointe basse du poignet | `lowLight` | low | 5 | 3 | 9 | +3 | −4 |
| Balayage de biais | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Percée du poignet | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Allonge en spirale | `forwardHeavy` | mid | 12 | 5 | 22 | Sol | −8 |
| Détente sur l’écart | `backHeavy` | mid | 13 | 4 | 22 | −5 | −10 |

### Lynch

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Question du poing arrière | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Point final | `standingHeavy` | mid | 9 | 4 | 14 | +4 | −4 |
| Coup sous la garde | `lowLight` | low | 5 | 3 | 9 | +3 | −4 |
| Fauchage de poursuite | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Relance en direct | `forwardLight` | mid | 6 | 3 | 9 | +4 | 0 |
| Percée au plexus | `forwardHeavy` | mid | 13 | 5 | 18 | Sol | −4 |
| Contre à bout portant | `backHeavy` | mid | 11 | 4 | 20 | −3 | −8 |

### Luini

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pointe à la dérobée | `standingLight` | mid | 4 | 3 | 8 | +2 | −2 |
| Lame de revers | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Bout du soulier | `lowLight` | low | 5 | 3 | 9 | +3 | −4 |
| Talon de sortie | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pointe au seuil | `forwardLight` | mid | 6 | 3 | 10 | +3 | −1 |
| Coupe de traversée | `forwardHeavy` | mid | 12 | 5 | 21 | Sol | −7 |
| Revers au retrait | `backHeavy` | mid | 8 | 4 | 20 | −4 | −8 |

### Bill

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de couverture | `standingLight` | mid | 5 | 3 | 11 | +1 | −5 |
| Appui des deux paumes | `standingHeavy` | mid | 10 | 4 | 18 | +2 | −8 |
| Main sous la garde | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Déracinement | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
| Pas de protection | `forwardLight` | mid | 6 | 3 | 12 | −1 | −3 |
| Poussée sous garde | `forwardHeavy` | mid | 14 | 5 | 23 | Sol | −9 |
| Paume de relève | `backHeavy` | mid | 12 | 4 | 24 | −4 | −12 |

### Furykov

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Sonde de la main avant | `standingLight` | mid | 5 | 3 | 8 | +3 | −2 |
| Uppercut de lecture | `standingHeavy` | mid | 9 | 4 | 15 | +5 | −5 |
| Sonde du pied avant | `lowLight` | low | 6 | 3 | 9 | +3 | −4 |
| Balayage de la garde | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Direct du changement de garde | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Contre du bras arrière | `forwardHeavy` | mid | 14 | 5 | 17 | Sol | −3 |
| Contre sur le retrait | `backHeavy` | mid | 13 | 4 | 22 | −5 | −10 |

### Cluck

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Revers du bout des doigts | `standingLight` | mid | 3 | 3 | 6 | +3 | 0 |
| Talon tournant | `standingHeavy` | mid | 9 | 4 | 18 | +2 | −8 |
| Pique rasante | `lowLight` | low | 4 | 3 | 7 | +4 | −2 |
| Arc de la semelle | `lowHeavy` | low | 10 | 4 | 15 | Sol | −4 |
| Pas de relais | `forwardLight` | mid | 5 | 3 | 8 | +3 | +1 |
| Coupe en traversée | `forwardHeavy` | mid | 12 | 5 | 19 | Sol | −5 |
| Talon de repli | `backHeavy` | mid | 8 | 4 | 13 | +3 | −1 |

### Beyond

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Poing de masse | `standingLight` | mid | 5 | 3 | 11 | +1 | −5 |
| Épaule du géant | `standingHeavy` | mid | 11 | 4 | 16 | +4 | −6 |
| Heurt au genou | `lowLight` | low | 6 | 3 | 11 | +3 | −6 |
| Fauchage du col | `lowHeavy` | low | 9 | 4 | 20 | Sol | −9 |
| Poing de déblai | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Charge à double appui | `forwardHeavy` | mid | 15 | 5 | 24 | Sol | −10 |
| Contrepoids | `backHeavy` | mid | 14 | 4 | 24 | −4 | −12 |

### Longhi

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main tendue | `standingLight` | mid | 4 | 3 | 12 | −1 | −6 |
| Clause de distance | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Borne basse | `lowLight` | low | 5 | 3 | 12 | +1 | −7 |
| Balayage de sortie | `lowHeavy` | low | 9 | 4 | 16 | Sol | −5 |
| Avance mesurée | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Reprise des termes | `forwardHeavy` | mid | 12 | 5 | 21 | Sol | −7 |
| Retrait de l’offre | `backHeavy` | mid | 13 | 4 | 21 | −2 | −9 |

### Musse

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main de sûreté | `standingLight` | mid | 4 | 3 | 9 | +2 | −3 |
| Coude de couverture | `standingHeavy` | mid | 8 | 4 | 14 | +4 | −4 |
| Contrôle du poignet | `lowLight` | low | 5 | 3 | 11 | +2 | −6 |
| Balayage sous couvert | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Interception en ligne | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Botte d’arrêt | `forwardHeavy` | mid | 13 | 5 | 19 | Sol | −5 |
| Sortie de l’axe | `backHeavy` | mid | 12 | 4 | 22 | −4 | −10 |

### Padaille

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main de mesure | `standingLight` | mid | 5 | 3 | 9 | +3 | −3 |
| Marteau à main nue | `standingHeavy` | mid | 10 | 4 | 18 | +2 | −8 |
| Cale du pied avant | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Pied-de-biche | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
| Percée du poing | `forwardLight` | mid | 6 | 3 | 11 | +5 | −2 |
| Abattée de l’avant-bras | `forwardHeavy` | mid | 14 | 5 | 22 | Sol | −8 |
| Retour de la main libre | `backHeavy` | mid | 12 | 4 | 23 | −4 | −11 |

### Sayird

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Sonde de la main avant | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Direct du garde | `standingHeavy` | mid | 9 | 4 | 15 | +4 | −5 |
| Pique au genou | `lowLight` | low | 4 | 3 | 9 | +4 | −4 |
| Semelle d’arrêt | `lowHeavy` | low | 7 | 4 | 20 | Sol | −9 |
| Entrée en crochet | `forwardLight` | mid | 5 | 3 | 10 | +4 | −1 |
| Marteau de couverture | `forwardHeavy` | mid | 13 | 5 | 22 | Sol | −8 |
| Direct de couverture | `backHeavy` | mid | 6 | 4 | 17 | +1 | −5 |

### Terebellum

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Paume de réception | `standingLight` | mid | 6 | 3 | 8 | +4 | −2 |
| Marteau de renvoi | `standingHeavy` | mid | 12 | 4 | 20 | 0 | −10 |
| Paume au genou | `lowLight` | low | 6 | 3 | 8 | +5 | −3 |
| Crochet de cheville | `lowHeavy` | low | 11 | 4 | 19 | Sol | −8 |
| Pas de contact | `forwardLight` | mid | 7 | 3 | 11 | +4 | −2 |
| Remontée du poing | `forwardHeavy` | mid | 16 | 5 | 25 | Sol | −11 |
| Paume d’écartement | `backHeavy` | mid | 9 | 4 | 16 | +3 | −4 |

### Voconte

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Contrôle du seuil | `standingLight` | mid | 4 | 3 | 8 | +2 | −2 |
| Traverse de porte | `standingHeavy` | mid | 9 | 4 | 15 | +4 | −5 |
| Butée basse | `lowLight` | low | 5 | 3 | 9 | +3 | −4 |
| Fermeture au ras du sol | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Franchissement sec | `forwardLight` | mid | 6 | 3 | 9 | +4 | 0 |
| Porte battante | `forwardHeavy` | mid | 13 | 5 | 17 | Sol | −3 |
| Hors du chambranle | `backHeavy` | mid | 12 | 4 | 20 | −3 | −8 |

### Yokotani

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Barre de l’avant-bras | `standingLight` | mid | 4 | 3 | 10 | +2 | −4 |
| Poussée de sortie | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Butée de semelle | `lowLight` | low | 5 | 3 | 9 | +5 | −4 |
| Balayage de passage | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
| Avant-bras de seuil | `forwardLight` | mid | 6 | 3 | 11 | 0 | −2 |
| Reconduite de l’épaule | `forwardHeavy` | mid | 13 | 5 | 20 | Sol | −6 |
| Droit de retrait | `backHeavy` | mid | 12 | 4 | 21 | −1 | −9 |
