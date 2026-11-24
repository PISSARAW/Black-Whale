# Voix de Black Whale Clash

Répliques françaises et anglaises écrites pour Clash et synthétisées hors ligne
avec Piper. La voix de bord est filtrée comme un haut-parleur de navire. Les
voix des combattants sont des interprétations originales d’après les
personnages de Togashi.

- Français [SIWIS, modèle Piper](https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD). Le modèle indique une source [SIWIS](https://datashare.is.ed.ac.uk/handle/10283/2353) sous CC BY 4.0.
- Anglais [LJ Speech, modèle Piper](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD). Le modèle indique [LJ Speech](https://keithito.com/LJ-Speech-Dataset/) comme jeu de données du domaine public.

Le script `apps/web/scripts/build-clash-voices.py` génère les deux banques
à partir des modèles ONNX locaux et de FFmpeg. L’option `--description`
génère les banques de narration à partir de `victoryDescriptions.json`. Les modèles et Piper servent
uniquement à la génération des fichiers, hors du jeu.

## Casting du roster

Chaque combattant dispose d’un locuteur distinct par langue, de trois efforts,
trois réactions à la douleur et six appels nominatifs de Kaméo. Les banques de
combat ajoutent une direction de jeu, des variations de débit et une
égalisation propres à chaque rôle.

- Français [MLS, modèle Piper](https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/mls/medium/MODEL_CARD) à partir de [Multilingual LibriSpeech](https://www.openslr.org/94/), sous CC BY 4.0.
- Anglais [LibriTTS-R, modèle Piper](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/libritts_r/medium/MODEL_CARD) à partir de [LibriTTS-R](https://www.openslr.org/141/), sous CC BY 4.0.
- Direction de jeu inspirée des [fiches de l’anime de Nippon TV](https://www.ntv.co.jp/hunterhunter/character/) et des tomes [35](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-35/product/5844), [36](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-36/product/5990), [37](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-37/product/7620) et [38](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-38-0/product/8650).

`apps/web/scripts/clash-voice-cast.json` regroupe la direction, les locuteurs,
les phonèmes et les répliques par vague de cinq. Exécuter
`python apps/web/scripts/build-clash-roster-voices.py /chemin/vers/les/modeles`
avec Piper, NumPy, ONNX Runtime et FFmpeg. L’option `--wave 1` régénère une
vague seule. Chaque modèle requiert son fichier `.onnx.json` à côté du
`.onnx`.

L’option `--selection` génère les répliques de sélection avec les mêmes
locuteurs et traitements. Les textes bilingues figurent dans
`apps/web/src/lib/fighting/audio/selectionLines.json`.

L’option `--rivals` génère les échanges contextuels depuis
`apps/web/src/lib/fighting/presentation/rivalExchanges.json`, qui contient les
repères du manga et de l’anime. Pour ne rebâtir qu’un duel, ajouter
`--pair chrollo--kurapika`.
