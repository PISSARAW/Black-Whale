"""Build the French and English Clash voice packs with Piper and FFmpeg."""
import argparse
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

WEB = Path(__file__).resolve().parents[1]
RATE = 24000
SPEECH = {
    "start": ("Combat !", "Fight!"),
    "decisive": ("Manche décisive. Combat !", "Final round. Fight!"),
    "knockout": ("K. O.", "K. O."),
    "technical": ("K. O. technique.", "Technical knockout."),
    "time": ("Temps écoulé.", "Time is up."),
    "points": ("Victoire aux points.", "Win by decision."),
    "expulsion": ("Victoire par expulsion.", "Win by expulsion."),
    "draw": ("Égalité.", "Draw."),
    "player": ("Joueur un remporte la manche.", "Player one wins the round."),
    "opponent": ("Joueur deux remporte la manche.", "Player two wins the round."),
    "player-match": ("Joueur un remporte le combat.", "Player one wins the match."),
    "opponent-match": ("Joueur deux remporte le combat.", "Player two wins the match."),
    "call-tubeppa": ("Toubéppa !", "Too-beppa!"),
    "call-marayam": ("Marayam !", "Marayam!"),
    "call-zhanglei": ("Jang Léï !", "Jang Lay!"),
    "call-morena": ("Moréna !", "Morena!"),
    "call-luzurus": ("Louzourous !", "Loozooroos!"),
    "call-salesale": ("Salé Salé !", "Saleh Saleh!"),
    "effort-0": ("Ha !", "Hah!"),
    "effort-1": ("Hé !", "Hey!"),
    "effort-2": ("Hah !", "Huh!"),
    "pain-0": ("Ouf !", "Oof!"),
    "pain-1": ("Ah !", "Ah!"),
    "pain-2": ("Aïe !", "Agh!"),
}
MODELS = ("fr_FR-siwis-medium", "en_US-ljspeech-medium")


def ffmpeg(*args: str) -> bytes:
    return subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
        check=True, capture_output=True,
    ).stdout


def samples(voice, key, text, raw):
    board = not key.startswith(("call-", "effort-", "pain-"))
    pace = 0.92 if board else 0.68
    with wave.open(str(raw), "wb") as target:
        voice.synthesize_wav(text, target, syn_config=SynthesisConfig(length_scale=pace))
    eq = "highpass=f=210,lowpass=f=3700,acompressor=threshold=0.12:ratio=3" if board else (
        "highpass=f=94,lowpass=f=6700,acompressor=threshold=0.17:ratio=2"
    )
    pcm = ffmpeg("-i", str(raw), "-af", eq, "-ar", str(RATE), "-ac", "1", "-f", "s16le", "pipe:1")
    signal = np.frombuffer(pcm, dtype="<i2").astype(np.float32)
    peak = np.max(np.abs(signal))
    if peak == 0:
        raise ValueError(f"Silent voice line {key}")
    audible = np.flatnonzero(np.abs(signal) >= peak * 0.023)
    signal = signal[max(0, audible[0] - 480):min(len(signal), audible[-1] + 960)]
    if key.startswith(("effort-", "pain-")):
        signal = signal[:int(RATE * (0.31 if key.startswith("effort") else 0.4))]
    fade = min(144, len(signal) // 2)
    signal[:fade] *= np.linspace(0, 1, fade)
    signal[-fade:] *= np.linspace(1, 0, fade)
    return (signal * (26300 / peak)).astype("<i2")


def pack(model, index, destination):
    voice = PiperVoice.load(str(model))
    clips = {}
    pad = np.zeros(1200, dtype="<i2")
    with tempfile.TemporaryDirectory() as work:
        raw = Path(work) / "line.wav"
        packed = Path(work) / "atlas.wav"
        with wave.open(str(packed), "wb") as target:
            target.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
            for key, labels in SPEECH.items():
                signal = samples(voice, key, labels[index], raw)
                target.writeframesraw(pad.tobytes())
                clips[key] = [target.tell(), len(signal)]
                target.writeframesraw(signal.tobytes())
                target.writeframesraw(pad.tobytes())
        ffmpeg("-i", str(packed), "-b:a", "56k", str(destination))
    return clips


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("models", type=Path, help="Directory of the two Piper .onnx models")
    args = parser.parse_args()
    audio = WEB / "static/audio/clash-voices"
    audio.mkdir(parents=True, exist_ok=True)
    manifest = {"sampleRate": RATE, "locales": {}}
    for index, (locale, name) in enumerate(zip(("fr", "en"), MODELS)):
        manifest["locales"][locale] = pack(args.models / f"{name}.onnx", index, audio / f"{locale}.mp3")
    (WEB / "src/lib/fighting/audio/speechAtlas.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8",
    )


if __name__ == "__main__":
    main()
