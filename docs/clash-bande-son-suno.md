# Black Whale Clash — La pression des ponts

La bande-son mêle polar de chambre et percussions de coque. Dans les salons, l’autorité se joue aux cordes et au piano préparé. Dans les ponts de service, elle passe au métal, à la basse et aux rythmes secs. La Tour Céleste ouvre l’espace avec des tambours de peau et des cuivres. Les trois univers partagent un motif que le menu installe dès la première phrase.

**Motif Clash** — Ré, Mi♭, La, puis le même La une octave plus bas. Deux notes brèves, une tenue, une chute. La phrase reprend les quatre premières hauteurs du profil sonore de la Soute, transposées à partir de Ré. Au menu, elle reste en suspens. En victoire, une remontée la résout. En défaite, il ne reste que le demi-ton initial. Les quatre notes servent de repère de composition. Si Suno les réinterprète, retenir les prises où la phrase reste identifiable ou enregistrer le motif et le fournir comme référence audio. [Importer une référence audio dans Suno](https://help.suno.com/en/articles/2477633)

## Boucles intégrées

Les tempos correspondent au pouls mesuré dans les passages montés. Les repères sont exprimés en secondes depuis le début des exports dans `Musique/`.

| Morceau | Tempo approx. | Passage source | Durée en boucle | Fichier dans `static/audio/clash/` |
| --- | ---: | ---: | ---: | --- |
| La pression des ponts | 107 BPM | 6,340–82,610 | 76,270 s | `menu.mp3` |
| Sous la ligne de flottaison | 107 BPM | 48,520–120,290 | 71,770 s | `whale-hold.mp3` |
| Au-dessus des gradins | 146 BPM | 24,190–93,395 | 69,205 s | `heavens-arena.mp3` |
| Le dernier jeton | 133 BPM | 19,380–80,735 | 61,355 s | `vip-casino.mp3` |
| Or sous la nappe | 88 BPM | 32,320–97,780 | 65,460 s | `banquet-hall.mp3` |
| Quatorze places | 103 BPM | 71,570–155,415 | 83,845 s | `princes-burial-chamber.mp3` |

Chaque raccord utilise un fondu de 50 ms dans le rythme du passage. Les fichiers livrés contiennent 250 ms d’audio de garde de chaque côté pour l’encodage MP3. Le lecteur boucle entre ces marges.

## Génération

Dans Suno, choisir **Create → Custom**, activer **Instrumental**, mettre le nom du morceau dans **Title** et coller le bloc anglais complet dans **Styles**. En cas de voix résiduelles, ajouter `vocals, choir, spoken word, vocal chops` dans **Advanced Options → Exclude**. [Mode Custom](https://help.suno.com/en/articles/3197377) · [Champ Exclude](https://help.suno.com/en/articles/3161921)

Commencer par **La pression des ponts**, **Sous la ligne de flottaison**, **Au-dessus des gradins**, **Le dernier jeton** et **Le pont est à nous**. Ces cinq prises donnent le thème, trois couleurs de combat et sa résolution. Les versions retenues peuvent servir de playlist d’inspiration pour les suivantes. [Fonction Inspire de Suno](https://help.suno.com/en/articles/6882753)

Les durées ci-dessous sont des **cibles de montage pour le jeu**. Pour les boucles, prélever une phrase complète et écouter le raccord après plusieurs répétitions. Pour les signatures courtes, monter autour de l’attaque et conserver la fin de la résonance. Écouter les pistes de combat avec les impacts, le Nen et la montre du jeu avant de retenir une prise.

## Menu et préparation

### La pression des ponts — menu principal · boucle 60–90 s

```text
Instrumental main menu theme for a maritime noir fighting game, 84 BPM. Start with solo bass clarinet playing D, E-flat, A, then A an octave lower: two short notes, one held note, one low answer. Add felt piano, muted cello and distant pitched hull resonance. Quiet authority, dark water, a ship awake at night. Introduce the motif in the first bar, then develop a spare eight-bar cycle with steady dynamics and a repeatable loop section.
```

### Les noms sur la liste — sélection des combattants et du stage · boucle 45–60 s

```text
Instrumental fighting-game selection cue, 108 BPM. Maritime chamber noir with muted electric bass, dry rim clicks, short prepared piano chords and pizzicato viola. Turn the menu's two quick notes and falling answer into a compact bass riff. Alert, confident and uncluttered. Start in tempo, keep the center open for interface sounds, and use a repeatable eight-bar groove.
```

#Le quai des challengers — salon en ligne · boucle 45–75 s

```text
Instrumental online lobby loop, 94 BPM. A relaxed but expectant dockside noir groove with upright bass, muted vibraphone, brushed snare and softly bowed metal. Trade short melodic fragments between bass and vibes, with room between phrases. Settle into the groove immediately and retain even energy for repeated listening.
```

### Tenir la garde — entraînement · boucle 60–90 s

```text
Instrumental practice-room loop, 96 BPM. Dry muted bass, brushed drums and felt piano playing spaced two-note figures. Patient, focused and slightly nocturnal. A stable four-square groove and gentle harmonic movement, with space for repeated hit, block and movement sounds. Keep accents soft and every section at a similar intensity.
```

### Face à face — écran versus · signature 4–6 s

```text
Short instrumental versus-screen sting for a maritime noir fighting game. Two bowed cello notes a semitone apart, a held muted brass note, then one low octave-drop answer on pitched steel. Immediate entry, concise dramatic shape, clean ending with a brief tail.
```

### À vous — départ de manche · signature 1–2 s

```text
Very short instrumental round-start accent. Two quiet prepared-piano pickups and a single bright muted brass accent over brushed steel. Clear transient, controlled low end, fast decay. A compact musical cue with room for the game's start announcement.
```

## Stages

Les 33 boucles visent **60 à 90 secondes en jeu**. L’identifiant sous chaque titre correspond au catalogue de Clash.

### Arènes et lieux emblématiques

#### Sous la ligne de flottaison — Soute du Black Whale
`whale-hold`

```text
Instrumental fighting-game loop, 126 BPM. Industrial maritime noir, bowed steel, muted floor toms, short cello ostinato and dry analog bass. Turn D, E-flat, A and low A into a repeating four-note riff. The low ceiling and weight of the ship should come through in the rhythm. Beat from the first bar, short reverbs, open gaps for combat effects, repeating eight-bar form.
```

#### Au-dessus des gradins — Tour Céleste
`heavens-arena`

```text
Instrumental stone-ring fighting-game loop, 148 BPM. Skin drums, clipped brass calls and taut string ostinato, with a bright upper-register answer to a short chromatic bass pickup. Open-air athletic momentum, camera-ready downbeats, space between brass phrases. Start at full tempo and return to the opening groove every eight bars.
```

#### Or sous la nappe — Salle du banquet
`banquet-hall`

```text
Instrumental fighting-game loop, 120 BPM. Sinister ballroom chamber music with a felt piano waltz over a straight percussion pulse, pizzicato strings and dry muted timpani. Elegance with a threat underneath, like a banquet continuing through a duel. Start with the pulse and return to it regularly.
```

#### Le dernier jeton — Casino VIP
`vip-casino`

```text
Instrumental combat loop, 132 BPM. Tight noir jazz-funk with a clipped upright-bass riff, muted trumpet, brushed snare and single vibraphone answers. Use two quick chromatic notes and a low falling answer. A rigged table with immaculate manners. Dry syncopation, short phrases, steady repeatable groove and space for fight sounds.
```

#### Horizon de verre — Pont d’observation
`observation-deck`

```text
Instrumental combat loop, 116 BPM. Cold maritime electronica with an airy synth pad, glassy mallets, soft breakbeats and a steady low cello pulse. A wide dark horizon beyond thick glass. Alternate a high suspended figure with a sparse bass answer. Groove from bar one, restrained swells, repeatable phrase endings.
```

#### La dernière bobine — Salle de projection
`screening-room`

```text
Instrumental combat loop, 118 BPM. Projector-like rhythmic flutter played by brushed drums, detuned electric piano, tape-softened viola and a low semitone bass motif. Claustrophobic suspense inside a private cinema. Keep the flutter musical, the mix dry and the main pattern cyclical.
```

#### Le poids du verdict — Cour suprême
`supreme-court`

```text
Instrumental fighting-game loop, 110 BPM. Bass clarinet, short stop-start cello chords and sparse low frame drum on a measured four-beat pulse. Formal, severe, implacable. Use alternating clauses of sound and silence, a restrained low register and a recurrent eight-bar phrase.
```

#### Quatorze places — Chambre funéraire des princes
`princes-burial-chamber`

```text
Instrumental ritual chamber combat loop, 104 BPM. Slow bronze bell tones, bowed double bass, dry hand drums and a repeating half-step answered an octave lower. Processional gravity and close, dark harmony. Keep the groove moving under the bells; repeat the phrase with small timbral changes.
```

#### Le seuil de Morena — Planque Heil-Ly
`heilly-hideout`

```text
Instrumental hideout combat loop, 140 BPM. Broken industrial drum pattern, gritty monosynth bass, col legno cello and narrowly spaced chromatic notes. Claustrophobic and predatory, with a lurching backbeat and dry short sounds. Preserve the same underlying tempo through a recurring eight-bar cycle.
```

### Ponts de service, espaces publics et extérieurs

#### Fret sous scellés — Entrepôt Cha-R
`cha-r-warehouse`

```text
Instrumental combat loop, 128 BPM. Wooden box percussion, syncopated muted bass and clipped steel harmonics. A cargo-room groove with alternating hollow and hard attacks, grounded in a short minor cello riff. Start on the downbeat, keep reverbs short and cycle the groove every eight bars.
```

#### Deuxième service — Réfectoire central
`central-dining-hall`

```text
Instrumental combat loop, 114 BPM. Brushed snare, dry baritone guitar, wooden tabletop percussion and a bouncing upright bass. Working-deck atmosphere, warm wood over restless minor harmony. Compact call and response with a stable pulse and clear gaps for brawling sounds.
```

#### Avant la séance — Hall du cinéplexe
`cineplex-concourse`

```text
Instrumental combat loop, 124 BPM. Worn electric organ, staccato vibraphone and tight brushed funk drums, with an uneasy semitone moving inside a bright chord. Faded cinema-lobby glamour under pressure. Short hooks, narrow reverb, repeatable bass figure from the first bar.
```

#### Derrière l’écran — Couloir des salles du cinéplexe
`cineplex-screen-corridor`

```text
Instrumental combat loop, 128 BPM. Thin pulsing synth, close viola tremolo, rim clicks and a tight sub-bass figure. The shape of a narrow corridor told through a short left-right answer on muted mallets. Keep the groove moving, the melody understated and the phrase easy to loop.
```

#### Les comptes de la famille — Bureau de la famille Cha-R
`cha-r-office`

```text
Instrumental combat loop, 112 BPM. Muted baritone guitar, close-miked double bass, brushed snare and spare bass clarinet. A private negotiation turns physical. Descending minor motif, crooked syncopation over a steady beat, dry room and repeating eight-bar structure.
```

#### Sous les galeries — Atrium du commissariat
`police-atrium`

```text
Instrumental combat loop, 122 BPM. Disciplined tom patterns, measured staccato strings and a recurring three-note tuned-mallet figure that suggests a fountain. Cool civic architecture under tension, short reflections, steady clipped rhythm and predictable phrase boundaries.
```

#### Porte de fret — Entrée du hangar
`hangar-entrance`

```text
Instrumental combat loop, 134 BPM. Rolling low toms, clipped analog arpeggio, bowed steel and restrained muted brass. A freight gate ready to open, weight in the bass and speed in the subdivisions. Immediate groove, controlled low end and a repeating eight-bar contour.
```

#### Le ventre du navire — Baie des ressorts
`hull-suspension`

```text
Instrumental combat loop, 130 BPM. Pitched springs, elastic muted bass and dry kick with sparse bowed-metal notes. Offset spring accents against a strict four-beat pulse. Heavy mechanical tension and a low octave-drop answer. Tight transients, clear gaps and a repeatable groove.
```

#### La mer de travers — Pont extérieur principal
`exterior-main-deck`

```text
Instrumental combat loop, 136 BPM. Deep skin drums with windlike bowed strings, open-fifth horn fragments and a rolling low pulse. Dark ocean air and forward motion. Short airborne melodic phrases over a stable four-beat grid with regular loop points.
```

#### Les amarres — Pont des canots — tribord
`starboard-lifeboats`

```text
Instrumental combat loop, 125 BPM. Hollow wooden percussion, plucked metallic cable tones, warm analog bass and soft high string harmonics. Three-against-four accents suggest lifeboats shifting in their cradles. Keep the underlying groove firm and leave open space between accents.
```

### Salons royaux et appartements des princes

#### La chaise du roi — Salon royal de Nasubi
`royal-salon`

```text
Instrumental salon combat loop, 106 BPM. Regal low strings, sparse prepared piano, soft timpani and short bass clarinet responses. A restrained court procession in a close wood-panelled room. Let the half-step motif fall into a lower octave, with a stable, repeating pulse for combat.
```

#### Le silence d’Unma — Salon de la reine Unma
`unma-salon`

```text
Instrumental salon combat loop, 108 BPM. Muted viola, bass flute, dry pizzicato and a quiet frame-drum pulse. Imposing composure and an almost private room sound. Play a slow, deliberate upper melody over a more active repeating bass rhythm.
```

#### Ordre de marche — Salon de Benjamin
`benjamin-salon`

```text
Instrumental salon combat loop, 126 BPM. Tight marching snare played softly, muted low brass and disciplined cello accents. Square phrases and clipped counter-rhythms suggest orders carried out without hesitation. Close room, clear beat and repeatable eight-bar form.
```

#### Une couronne suffit — Salon de Camilla
`camilla-salon`

```text
Instrumental salon combat loop, 118 BPM. Imperious harpsichord figures, sharply muted viola, a dry kick and a jagged downward bass answer. Ornate phrases interrupted by clean empty beats. Keep a steady rhythmic floor under the capricious melody and return to the opening phrase.
```

#### Les pièces en réserve — Salon de Zhang Lei
`zhang-lei-salon`

```text
Instrumental salon combat loop, 112 BPM. Soft bronze disks struck as pitched percussion, measured pizzicato bass and deliberate prepared-piano chords. Patient, calculating, quietly affluent. Repeat a small rising metal figure over an unhurried four-beat groove.
```

#### La collection privée — Salon de Tserriednich
`tserriednich-salon`

```text
Instrumental salon combat loop, 128 BPM. Finely articulated harpsichord, muted cello, dissonant bowed glass and precise rim clicks. Start elegant, let a repeating semitone warp the harmony beneath it, and maintain a cool, regular pulse with short, close reflections.
```

#### L’hypothèse froide — Salon de Tubeppa
`tubeppa-salon`

```text
Instrumental salon combat loop, 120 BPM. Minimal chamber electronica with clocked plucks, a low clarinet answer, muted bass and sparse kick. Clinical precision, interlocking two- and three-note phrases on a firm beat. Dry, spare arrangement with a repeating tonal cycle.
```

#### Le sourire de trop — Salon de Salé-salé
`salesale-salon`

```text
Instrumental salon combat loop, 116 BPM. Slinky lounge groove with electric piano, brushed drums, elastic bass guitar and sour muted trumpet turns. Luxurious, careless, and a little stale. Give the bass a tight recurring phrase and keep the brass in short replies.
```

#### Une seule flèche — Salon de Halkenburg
`halkenburg-salon`

```text
Instrumental salon combat loop, 132 BPM. Unison strings, frame drum and restrained horn, playing decisive shared accents. A sober rising melody over a firm group pulse, idealistic with darker harmony beneath. Keep the ensemble compact and return regularly to the initial rhythm.
```

#### Le sourire en coin — Salon de Kacho
`kacho-salon`

```text
Instrumental salon combat loop, 128 BPM. Fast dry pizzicato, hand percussion, light bass pulse and quick flute replies. Clever interruptions, restless confidence and an affectionate falling fourth. Maintain clear four-beat footing and let the melody leave gaps.
```

#### Une porte entrouverte — Salon de Fugetsu
`fugetsu-salon`

```text
Instrumental salon combat loop, 118 BPM. Airy flute, plucked harp, soft cello pulse and understated brushed percussion. Hint at Kacho's falling fourth in longer notes, like two connected rooms. Gentle, alert and rhythmically steady, with an unbroken eight-bar cycle.
```

#### La chambre trop calme — Salon de Momoze
`momoze-salon`

```text
Instrumental salon combat loop, 108 BPM. Low felt piano, soft wooden mallets, dry viola and a minimal kick. A tender two-note figure with uneasy space underneath, held together by a quiet but persistent pulse. Small room, gentle transients and recurring phrase endings.
```

#### La pièce de trop — Salon de Marayam
`marayam-salon`

```text
Instrumental salon combat loop, 122 BPM. Plucked toy piano, soft block percussion and stable low synth bass. One short phrase keeps returning with its final note displaced, suggesting an unfamiliar room inside a familiar one. Restrained dynamics, steady beat and an eight-bar pattern.
```

#### Tant que la veille tient — Salon de Woble
`woble-salon`

```text
Instrumental salon combat loop, 110 BPM. Felt piano, soft octave cello and brushed hand drum, protective and quietly determined. Place a warm sustained tone over the menu motif's anxious half-step. Keep the pattern close, intimate, consistently paced and easy to loop.
```

## Fin de manche et résultats

### Il reste un échange — manche décisive · couche ou variante de tension

```text
Instrumental fighting-game tension layer. Dry syncopated low cello, soft brushed noise and a narrow sustained dissonance. Stable pulse, sparse pitch content, even intensity and regular eight-bar boundaries. Leave room for the audible countdown and combat hits; keep percussive accents rounded and quiet.
```

Si la tension se superpose à la piste du stage, caler cette couche sur son tempo et sa tonalité au montage. Pour un compte à rebours court, garder la montre du jeu au premier plan.

### Le pont est à nous — victoire · signature 5–8 s

```text
Short instrumental victory fanfare for a maritime noir fighting game. Lead with the Clash motif D, E-flat, A, low A on muted brass and cello, then answer it with a clear rising resolution. One measured drum accent, restrained confidence, memorable first second and a brief clean ending.
```

### Encore debout — défaite · signature 5–8 s

```text
Short instrumental defeat sting. Solo felt piano opens with D and E-flat, the first two notes of the main theme. A soft falling cello response leaves the phrase unfinished, with a short low resonance. Stoic, bruised and determined, intimate chamber sound, slow decay after a concise statement.
```

### Le compte reste ouvert — égalité · signature 3–5 s

```text
Short instrumental draw cue for a fighting game. Two matched muted cello and piano phrases land with equal weight on a suspended chord. Balanced tension, brief metallic resonance, clean ending and a cadence that remains unresolved.
```

### Après le choc — résultats et revanche · boucle 30–45 s

```text
Instrumental post-match results loop, 88 BPM. Dry upright bass, soft kick, spare felt piano and one quiet metallic answer. A measured sense of momentum after the fight, emotionally neutral enough to follow any result. Low density and a short repeatable groove under the interface.
```

### Les dernières places — tableau du tournoi · boucle 45–60 s

```text
Instrumental tournament bracket loop, 102 BPM. Measured pizzicato cello, muted horns, low hand drum and a cold five-note piano figure. Anticipation between bouts, slightly ceremonial, with clean phrase endings and even dynamics. Quiet enough for brackets and short enough for repeat listening.
```

### Le dernier nom — finale du tournoi · boucle 60–90 s

```text
Instrumental tournament final combat loop, 144 BPM. Begin on the downbeat with the D, E-flat, A, low A motif in octaves across cello and muted brass, over alternating skin drums and beaten hull metal. Fierce but lean, with space between accents. Eight-bar sections return naturally to the starting riff and support sustained play.
```

**En jeu.** Laisser la piste du stage céder la place aux signatures de résultat. Quand une cinématique de personnage joue déjà sa propre piste, lui donner la priorité et réserver **Après le choc** à l’écran de résultats. En pause, suspendre la piste et reprendre au même point.
