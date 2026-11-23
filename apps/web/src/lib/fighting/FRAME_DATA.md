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
| Tserriednich | 7 | +4 | 0 | 3 | 0 |
| Feitan | 7 | +4 | 0 | 7 | 0 |
| Saiyu | 7 | +4 | 0 | 3 | 0 |
| Theta | 7 | +4 | 0 | 3 | 0 |
| Biscuit | 7 | +4 | 0 | 4 | 0 |
| Phinks | 7 | +4 | 0 | 3 | 0 |
| Franklin | 7 | +4 | 0 | 1 | 0 |
| Machi | 7 | +4 | 0 | 5 | 0 |
| Illumi | 7 | +4 | 0 | 5 | 0 |
| Kalluto | 7 | +3 | 0 | 5 | 0 |
| Bonolenov | 7 | +4 | 0 | 3 | 0 |
| Shizuku | 7 | +4 | 0 | 2 | 0 |
| Hinrigh | 7 | +4 | 0 | 3 | 0 |
| Mizaistom | 7 | +4 | 0 | 2 | 0 |
| Leorio | 7 | +4 | 0 | 2 | 0 |
| Hanzo | 7 | +3 | 0 | 5 | 0 |
| Rihan | 7 | +4 | 0 | 3 | 0 |
| Zakuro | 7 | +4 | 0 | 3 | 0 |
| Melody | 7 | +4 | 0 | 3 | 0 |
| Basho | 7 | +4 | 0 | 2 | 0 |
| Camilla | 7 | +4 | 0 | 3 | 0 |
| Halkenburg | 7 | +4 | 0 | 2 | 0 |
| Gel | 7 | +4 | 0 | 4 | 0 |
| Lynch | 7 | +4 | 0 | 4 | 0 |
| Luini | 7 | +4 | 0 | 4 | 0 |
| Bill | 7 | +4 | 0 | 2 | 0 |
| Furykov | 7 | +4 | 0 | 4 | 0 |
| Cluck | 7 | +4 | 0 | 4 | 0 |
| Beyond | 7 | +4 | 0 | 2 | 0 |
| Longhi | 7 | +4 | 0 | 3 | 0 |
| Musse | 7 | +4 | 0 | 3 | 0 |
| Padaille | 7 | +4 | 0 | 3 | 0 |
| Sayird | 7 | +4 | 0 | 3 | 0 |
| Terebellum | 7 | +4 | 0 | 3 | 0 |
| Voconte | 7 | +4 | 0 | 4 | 0 |
| Yokotani | 7 | +4 | 0 | 2 | 0 |

## Par personnage

### Kurapika

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct court | `standingLight` | mid | 4 | 3 | 8 | +3 | −2 |
| Crochet au corps | `standingHeavy` | mid | 8 | 4 | 14 | +3 | −4 |
| Direct bas | `lowLight` | low | 5 | 3 | 9 | +2 | −4 |
| Balayage | `lowHeavy` | low | 10 | 4 | 19 | Sol | −8 |
| Pendule rasant | `forwardLight` | mid | 6 | 3 | 5 | +4 | −2 |
| Pas de l’index | `forwardHeavy` | mid | 13 | 5 | 22 | Sol | −8 |
| Rappel du geôlier | `backHeavy` | mid | 10 | 4 | 16 | +9 | −4 |

### Hisoka

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Entaille de carte | `standingLight` | mid | 3 | 3 | 7 | +2 | −1 |
| Talon du magicien | `standingHeavy` | mid | 8 | 4 | 12 | +3 | −2 |
| Carte basse | `lowLight` | low | 4 | 3 | 8 | +3 | −3 |
| Balayage trompeur | `lowHeavy` | low | 9 | 4 | 17 | Sol | −6 |
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
| Page tranchante | `forwardLight` | mid | 9 | 3 | 22 | Sol | −13 |
| Lecture en mouvement | `forwardHeavy` | mid | 13 | 5 | 20 | −2 | −6 |
| Pas du voleur | `backHeavy` | mid | 9 | 4 | 16 | +3 | −4 |

### Benjamin

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct militaire | `standingLight` | mid | 5 | 3 | 9 | +3 | −3 |
| Marteau royal | `standingHeavy` | mid | 10 | 4 | 17 | +3 | −7 |
| Frappe au genou | `lowLight` | low | 6 | 3 | 11 | +2 | −6 |
| Balayage tactique | `lowHeavy` | low | 11 | 4 | 21 | Sol | −10 |
| Percée du premier prince | `forwardLight` | mid | 8 | 3 | 13 | +4 | −4 |
| Genou d’exécution | `forwardHeavy` | mid | 15 | 5 | 25 | Sol | −11 |
| Discipline de fer | `backHeavy` | mid | 12 | 4 | 16 | +11 | −4 |

### Tserriednich

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique princier | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Coup de crosse | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Tir aux jambes | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Fauchage calculé | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pas déjà vu | `forwardLight` | mid | 6 | 3 | 7 | +4 | +2 |
| Tir de divergence | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Seconde condamnation | `backHeavy` | mid | 8 | 4 | 14 | +4 | −2 |

### Feitan

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Estoc bref | `standingLight` | mid | 3 | 2 | 7 | +2 | 0 |
| Taille de sabre | `standingHeavy` | mid | 7 | 3 | 12 | +4 | −1 |
| Entaille basse | `lowLight` | low | 4 | 2 | 8 | +4 | −2 |
| Fauchage éclair | `lowHeavy` | low | 8 | 3 | 15 | Sol | −3 |
| Croisement funèbre | `forwardLight` | mid | 5 | 2 | 9 | +4 | +1 |
| Escalier de la douleur | `forwardHeavy` | mid | 11 | 4 | 17 | Sol | −2 |
| Lame sans ombre | `backHeavy` | mid | 8 | 3 | 12 | +4 | +1 |

### Saiyu

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pointe du bâton | `standingLight` | mid | 4 | 3 | 8 | +4 | −2 |
| Arc du prêtre | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Frappe aux chevilles | `lowLight` | low | 5 | 3 | 10 | +4 | −5 |
| Balayage du singe | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Perche du singe | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Queue balayante | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Trois refus | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Theta

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique à la crosse | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crosse descendante | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup de crosse bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Fauchage de garde | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Tir de contrôle | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Pas d’instructrice | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Leçon sévère | `backHeavy` | mid | 8 | 4 | 14 | +4 | −2 |

### Biscuit

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct Shingen | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crochet de maître | `standingHeavy` | mid | 8 | 4 | 13 | +4 | −3 |
| Poing au corps | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Balayage de pierre | `lowHeavy` | low | 9 | 4 | 19 | Sol | −8 |
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
| Direct blindé | `standingLight` | mid | 5 | 3 | 9 | +4 | −3 |
| Marteau de la Brigade | `standingHeavy` | mid | 11 | 4 | 18 | +4 | −8 |
| Coup aux côtes | `lowLight` | low | 6 | 3 | 11 | +4 | −6 |
| Fauchage massif | `lowHeavy` | low | 11 | 4 | 21 | Sol | −10 |
| Marche de suppression | `forwardLight` | mid | 8 | 3 | 14 | +4 | −5 |
| Croisement balistique | `forwardHeavy` | mid | 16 | 5 | 27 | Sol | −13 |
| Crosse humaine | `backHeavy` | mid | 12 | 4 | 18 | +2 | −6 |

### Machi

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique de fil | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Coude de la couturière | `standingHeavy` | mid | 8 | 4 | 12 | +4 | −2 |
| Fil aux chevilles | `lowLight` | low | 4 | 3 | 8 | +4 | −3 |
| Balayage cousu | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Point invisible | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Croix de couture | `forwardHeavy` | mid | 12 | 5 | 23 | Sol | −9 |
| Marionnette brisée | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

### Illumi

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique d’assassin | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Paume Zoldyck | `standingHeavy` | mid | 8 | 4 | 12 | +4 | −2 |
| Aiguille basse | `lowLight` | low | 4 | 3 | 8 | +4 | −3 |
| Fauchage silencieux | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pas sans présence | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Visage mort | `forwardHeavy` | mid | 12 | 5 | 23 | Sol | −9 |
| Aiguille de recul | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

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
| Poing rythmé | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Coude tribal | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Battement bas | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Ronde guerrière | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Tambour de guerre | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Pas spiralé | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Silence rompu | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

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
| Direct du mafieux | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crosse animale | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup bas discret | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Fauchage de la famille | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pigeon de métal | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Menottes rapaces | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Faune de couverture | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Mizaistom

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Coup de paume | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Coup au corps | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Contrôle d’identité | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Ligne jaune | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Carte rouge | `backHeavy` | mid | 8 | 4 | 16 | +4 | −4 |

### Leorio

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 4 | 3 | 8 | +4 | −2 |
| Crochet | `standingHeavy` | mid | 10 | 4 | 15 | +4 | −5 |
| Coup au corps | `lowLight` | low | 5 | 3 | 10 | +4 | −5 |
| Balayage | `lowHeavy` | low | 10 | 4 | 20 | Sol | −9 |
| Direct d’urgence | `forwardLight` | mid | 7 | 3 | 12 | +4 | −3 |
| Diagnostic bas | `forwardHeavy` | mid | 14 | 5 | 25 | Sol | −11 |
| Réanimation combative | `backHeavy` | mid | 12 | 4 | 21 | +4 | −9 |

### Hanzo

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Main ouverte | `standingLight` | mid | 3 | 3 | 6 | +3 | 0 |
| Tranchant de la main | `standingHeavy` | mid | 7 | 4 | 12 | +3 | −2 |
| Coup au tendon | `lowLight` | low | 4 | 3 | 8 | +3 | −3 |
| Fauchage furtif | `lowHeavy` | low | 8 | 4 | 17 | Sol | −6 |
| Pas du plafond | `forwardLight` | mid | 6 | 3 | 8 | +3 | +1 |
| Fausse décapitation | `forwardHeavy` | mid | 11 | 5 | 22 | Sol | −8 |
| Corps laissé derrière | `backHeavy` | mid | 8 | 4 | 13 | +3 | −1 |

### Rihan

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Coude du garde | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Coup au corps | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Fauchage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Avancée mesurée | `forwardLight` | mid | 6 | 3 | 7 | +4 | +2 |
| Coup d’épaule | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Contre | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Zakuro

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crochet | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Coup d’épaule | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 14 | +4 | −2 |

### Melody

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Coup de paume | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Coup d’épaule | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Basho

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Crochet | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Coup de pied bas | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Coup d’épaule | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Revers du poing | `backHeavy` | mid | 8 | 4 | 16 | +4 | −4 |

### Camilla

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Gifle royale | `standingLight` | mid | 4 | 3 | 8 | +4 | −2 |
| Revers princier | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Coup de talon bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Fauchage insolent | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Décret d’approche | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Sentence royale | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Révérence piégée | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Halkenburg

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct du prince | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Crosse de garde | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Tir aux jambes | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Balayage de la garde | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Marche des fidèles | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Percée collective | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Parade du prince | `backHeavy` | mid | 8 | 4 | 17 | +4 | −5 |

### Gel

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique du Serpent | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Coude à écailles | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Morsure basse | `lowLight` | low | 5 | 3 | 8 | +4 | −3 |
| Fauchage en spirale | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Allonge serpentine | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Frappe étendue | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Retrait en garde | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

### Lynch

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct de l’interrogatrice | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crochet Xi-Yu | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Coup au foie | `lowLight` | low | 5 | 3 | 8 | +4 | −3 |
| Fauchage brutal | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Question pressante | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Réponse forcée | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Contre-interrogatoire | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

### Luini

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pointe du couteau | `standingLight` | mid | 4 | 3 | 6 | +4 | 0 |
| Entaille au couteau | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup bas | `lowLight` | low | 5 | 3 | 8 | +4 | −3 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pointe en avançant | `forwardLight` | mid | 6 | 3 | 9 | +4 | 0 |
| Entaille en avançant | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 12 | +4 | 0 |

### Bill

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct du garde | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Crochet | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Coup au corps | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 7 | +4 | +2 |
| Coup d’épaule | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 16 | +4 | −4 |

### Furykov

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct militaire | `standingLight` | mid | 5 | 3 | 7 | +4 | −1 |
| Crochet du premier prince | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Frappe au genou | `lowLight` | low | 6 | 3 | 8 | +4 | −3 |
| Fauchage réglementaire | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Pas de lecture | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Briseur de cadence | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Réponse automatique | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

### Cluck

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique du Coq | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Aile du Zodiac | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Bec rasant | `lowLight` | low | 5 | 3 | 8 | +4 | −3 |
| Fauchage rasant | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Envol tactique | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Battement massif | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Repli sous l’aile | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

### Beyond

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct de l’explorateur | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Marteau Netero | `standingHeavy` | mid | 11 | 4 | 16 | +4 | −6 |
| Coup de piste | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Fauchage du continent | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Marche sans retour | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Percée du Continent Sombre | `forwardHeavy` | mid | 15 | 5 | 24 | Sol | −10 |
| Survie instinctive | `backHeavy` | mid | 8 | 4 | 16 | +4 | −4 |

### Longhi

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crochet | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Coup d’épaule | `forwardHeavy` | mid | 12 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Musse

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct du garde | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crochet | `standingHeavy` | mid | 8 | 4 | 16 | +4 | −6 |
| Coup bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Coup d’épaule | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 14 | +4 | −2 |

### Padaille

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct gauche | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Coup de coude | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Coup au corps | `lowLight` | low | 6 | 3 | 10 | +4 | −5 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 12 | +4 | −3 |
| Coup d’épaule | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Sayird

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct du garde | `standingLight` | mid | 4 | 3 | 7 | +4 | −1 |
| Crochet de Sayird | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Coup bas | `lowLight` | low | 5 | 3 | 9 | +4 | −4 |
| Fauchage de contrôle | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Approche balisée | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Frappe précise | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Repli | `backHeavy` | mid | 8 | 4 | 14 | +4 | −2 |

### Terebellum

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct de transfert | `standingLight` | mid | 5 | 3 | 8 | +4 | −2 |
| Crochet de retour | `standingHeavy` | mid | 10 | 4 | 16 | +4 | −6 |
| Dégât rasant | `lowLight` | low | 6 | 3 | 9 | +4 | −4 |
| Fauchage répercuté | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Avance conductrice | `forwardLight` | mid | 6 | 3 | 11 | +4 | −2 |
| Surcharge corporelle | `forwardHeavy` | mid | 14 | 5 | 24 | Sol | −10 |
| Renvoi défensif | `backHeavy` | mid | 8 | 4 | 15 | +4 | −3 |

### Voconte

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Pique de la cachette | `standingLight` | mid | 4 | 3 | 6 | +4 | 0 |
| Revers de porte | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Trappe basse | `lowLight` | low | 5 | 3 | 8 | +4 | −3 |
| Fauchage du seuil | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Avance physique | `forwardLight` | mid | 6 | 3 | 10 | +4 | −1 |
| Charge hors cadre | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Revers en recul | `backHeavy` | mid | 8 | 4 | 13 | +4 | −1 |

### Yokotani

| Coup | Slot | Garde | Démarrage | Actif | Récup. | Touche | Garde |
| ---- | ---- | ----- | --------: | ----: | -----: | -----: | ----: |
| Direct | `standingLight` | mid | 4 | 3 | 8 | +4 | −2 |
| Crochet | `standingHeavy` | mid | 9 | 4 | 16 | +4 | −6 |
| Coup au corps | `lowLight` | low | 5 | 3 | 10 | +4 | −5 |
| Balayage | `lowHeavy` | low | 9 | 4 | 18 | Sol | −7 |
| Direct en avançant | `forwardLight` | mid | 6 | 3 | 7 | +4 | +2 |
| Coup d’épaule | `forwardHeavy` | mid | 13 | 5 | 24 | Sol | −10 |
| Revers | `backHeavy` | mid | 8 | 4 | 16 | +4 | −4 |
