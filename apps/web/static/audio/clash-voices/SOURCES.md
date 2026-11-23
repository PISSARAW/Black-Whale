# Voix de Black Whale Clash

Répliques françaises et anglaises écrites pour Clash et synthétisées hors ligne
avec Piper. Les voix des combattants utilisent des prises courtes sans
imitation du doublage de l’anime. La voix de bord est filtrée comme un
haut-parleur de navire.

- Français [SIWIS, modèle Piper](https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD). Le modèle indique une source [SIWIS](https://datashare.is.ed.ac.uk/handle/10283/2353) sous CC BY 4.0.
- Anglais [LJ Speech, modèle Piper](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD). Le modèle indique [LJ Speech](https://keithito.com/LJ-Speech-Dataset/) comme jeu de données du domaine public.

Le script `apps/web/scripts/build-clash-voices.py` génère les deux banques
à partir des modèles ONNX locaux et de FFmpeg. Les modèles et Piper servent
uniquement à la génération des fichiers, hors du jeu.
