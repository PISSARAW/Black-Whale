"""Build one or more waves of playable Clash voices from two multi-speaker Piper models."""
import argparse
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
import onnxruntime
from piper import PiperVoice, SynthesisConfig
from piper.config import PiperConfig

WEB = Path(__file__).resolve().parents[1]
RATE = 24000
PAD = 960
MAX_CALL_SECONDS = 1.56
MODELS = {"fr": "fr_FR-mls-medium", "en": "en_US-libritts_r-medium"}
KAMEO_NAMES = {
    "tubeppa": ("Toubéppa", "Too-beppa"),
    "marayam": ("Marayam", "Marayam"),
    "zhanglei": ("Jang Léï", "Jang Lay"),
    "morena": ("Moréna", "Morena"),
    "luzurus": ("Louzourous", "Loozooroos"),
    "salesale": ("Salé Salé", "Saleh Saleh"),
}


def ffmpeg(args, pcm=None):
    return subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
        input=pcm, check=True, capture_output=True,
    ).stdout


def load(model):
    options = onnxruntime.SessionOptions()
    options.intra_op_num_threads = 2
    config = json.loads(model.with_suffix(".onnx.json").read_text())
    return PiperVoice(
        session=onnxruntime.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"]),
        config=PiperConfig.from_dict(config),
    )


def make_lines(role, index):
    for kind in ("effort", "pain"):
        for take, phonemes in enumerate(role[kind]):
            yield f"{kind}-{take}", f"[[{phonemes}!]]"
    for kameo, labels in KAMEO_NAMES.items():
        yield f"call-{kameo}", role["call"][index].format(name=labels[index])


def trim(signal, kind):
    peak = np.max(np.abs(signal))
    if peak < 100:
        raise ValueError(f"Inaudible {kind}, peak {peak}")
    audible = np.flatnonzero(np.abs(signal) >= peak * 0.04)
    signal = signal[max(0, audible[0] - 150):audible[-1] + 480]
    if kind != "call":
        signal = signal[:int(RATE * (0.33 if kind == "effort" else 0.46))]
    fade = min(168, len(signal) // 2)
    signal[:fade] *= np.linspace(0, 1, fade)
    signal[-fade:] *= np.linspace(1, 0, fade)
    peak = np.max(np.abs(signal))
    rms = np.sqrt(np.mean(signal ** 2))
    gain = min(27400 / peak, (5600 if kind == "call" else 6400) / rms)
    return (signal * gain).astype("<i2")


def render(voice, line, role):
    kind, text, index = line
    model_pace = 0.47 if index == 0 else 1.0
    pace = role["pace"] * model_pace * {"effort": 0.72, "pain": 0.93, "call": 1.0}[kind]
    config = SynthesisConfig(
        speaker_id=role["speaker"][index], length_scale=pace, noise_scale=0.3, noise_w_scale=0.24,
    )
    chunks = list(voice.synthesize(text, syn_config=config))
    silence = bytes(int(chunks[0].sample_rate * 0.045) * 2)
    pcm = silence.join(chunk.audio_int16_bytes for chunk in chunks)
    filters = (
        f"highpass=f=85,equalizer=f=240:t=o:w=1.3:g={role['body']},"
        f"equalizer=f=2700:t=o:w=1.5:g={role['edge']},lowpass=f=7900,"
        "acompressor=threshold=0.13:ratio=2.5:attack=3:release=40"
    )
    cooked = ffmpeg(
        ["-f", "s16le", "-ar", str(chunks[0].sample_rate), "-ac", "1", "-i", "pipe:0",
         "-af", filters, "-ar", str(RATE), "-f", "s16le", "pipe:1"], pcm,
    )
    signal = trim(np.frombuffer(cooked, dtype="<i2").astype(np.float32), kind)
    if kind == "call" and len(signal) > RATE * MAX_CALL_SECONDS:
        tempo = len(signal) / (RATE * (MAX_CALL_SECONDS - 0.08))
        packed = ffmpeg(
            ["-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", "pipe:0",
             "-af", f"atempo={tempo:.4f}", "-f", "s16le", "pipe:1"], signal.tobytes(),
        )
        signal = trim(np.frombuffer(packed, dtype="<i2").astype(np.float32), kind)
    return signal


def pack(voice, role, output):
    index, destination = output
    clips = {}
    with tempfile.TemporaryDirectory() as work:
        pending = Path(work) / "bank.wav"
        with wave.open(str(pending), "wb") as target:
            target.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
            for key, text in make_lines(role, index):
                signal = render(voice, (key.split("-")[0], text, index), role)
                target.writeframesraw(bytes(2 * PAD))
                clips[key] = [target.tell(), len(signal)]
                target.writeframesraw(signal.tobytes())
            target.writeframesraw(bytes(2 * PAD))
        ffmpeg(["-i", str(pending), "-b:a", "56k", str(destination)])
    return clips


def write_atlas(destination, roster):
    lines = ["{"]
    for index, (fighter, banks) in enumerate(roster.items()):
        line = f"  {json.dumps(fighter)}: {json.dumps(banks, separators=(',', ':'))}"
        lines.append(line + ("," if index < len(roster) - 1 else ""))
    destination.write_text("\n".join([*lines, "}", ""]), encoding="utf-8")


def build(models, cast, waves):
    audio = WEB / "static/audio/clash-voices/roster"
    atlas = WEB / "src/lib/fighting/audio/fighterVoiceAtlas"
    atlas.mkdir(exist_ok=True)
    audio.mkdir(exist_ok=True)
    voices = [load(models / f"{name}.onnx") for name in MODELS.values()]
    for wave_number in waves:
        roster = {}
        for fighter, role in cast[wave_number - 1].items():
            roster[fighter] = {}
            for index, (locale, voice) in enumerate(zip(MODELS, voices)):
                roster[fighter][locale] = pack(voice, role, (index, audio / f"{locale}-{fighter}.mp3"))
            print(f"Wave {wave_number}: {fighter}", flush=True)
        write_atlas(atlas / f"wave-{wave_number}.json", roster)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("models", type=Path, help="Directory containing both Piper ONNX models and configurations")
    parser.add_argument("--wave", type=int, action="append", help="Build a specific wave; repeat to build several")
    args = parser.parse_args()
    cast = json.loads(Path(__file__).with_name("clash-voice-cast.json").read_text())
    waves = range(1, len(cast) + 1)
    if args.wave and not set(args.wave).issubset(waves):
        parser.error(f"choose a wave from 1 to {len(cast)}")
    onnxruntime.set_seed(928)
    build(args.models, cast, args.wave or waves)


if __name__ == "__main__":
    main()
