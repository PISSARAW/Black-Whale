"""Phonk track for the viral edit, built on the edit's own sections.

python3 viral-edit-music.py edit-report.json out.wav

Hook: riser into the #1 finisher. Build: kick, hats, 808, cowbell riff from its third bar.
Rush: double-time drums, snare roll and a riser. Brake: everything cuts out. Drop: full
beat, a boom on each frozen impact. The instruments come from combo-edit-music.py.
"""
import json
import pathlib
import sys
import wave

import numpy as np

# Reuse the existing instruments without running that script's main().
source = (pathlib.Path(__file__).with_name("combo-edit-music.py")).read_text()
kit = {}
exec(source.rsplit("\nmain()", 1)[0], kit)
SR = kit["SR"]
kick, sub808, clap, hat, cowbell = kit["kick"], kit["sub808"], kit["clap"], kit["hat"], kit["cowbell"]
riser, boom, metal, noise_hit, whoosh = (
    kit["riser"],
    kit["boom"],
    kit["metal"],
    kit["noise_hit"],
    kit["whoosh"],
)
place, lowpass = kit["place"], kit["lowpass"]

ROOT = 55.0  # A1
RIFF = [0, 3, 7, 10, 7, 3, 12, 10, 0, 3, 7, 3, 15, 12, 10, 7]
BASS = [0, 0, -2, -4]


def note(semitones):
    return ROOT * 4 * 2 ** (semitones / 12)


def drums(music, span, beat, dense):
    """Kick on every beat (and the off-beat when dense), clap on 2 and 4, hats in 8ths or 16ths."""
    start, end = span
    b = 0
    while start + b * beat < end - 1e-6:
        at = start + b * beat
        place(music, kick(), at, 0.95)
        if dense:
            place(music, kick(), at + beat / 2, 0.7)
        if b % 2 == 1:
            place(music, clap(), at, 0.8)
        steps = 4 if dense else 2
        for s in range(steps):
            place(music, hat(), at + s * beat / steps, 0.7, pan=0.3)
        b += 1


def bassline(music, span, beat, gain):
    start, end = span
    bar = 4 * beat
    k = 0
    while start + k * bar < end - 1e-6:
        place(music, sub808(ROOT * 2 ** (BASS[k % 4] / 12), bar * 0.9), start + k * bar, gain)
        k += 1


def riff(music, span, beat, gain):
    start, end = span
    i = 0
    while start + i * beat / 2 < end - 1e-6:
        place(music, cowbell(note(RIFF[i % len(RIFF)])), start + i * beat / 2, gain, pan=-0.2)
        i += 1


def snare_roll(music, span, beat):
    start, end = span
    t, step = start, beat / 2
    while t < end - 1e-6:
        progress = (t - start) / (end - start)
        place(music, clap(), t, 0.35 + 0.5 * progress)
        t += step if progress < 0.5 else step / 2


def main():
    report = json.load(open(sys.argv[1]))
    fps = report["fps"]
    beat = 60 / report["bpm"]
    sec = {k: (v[0] / fps, v[1] / fps) for k, v in report["sections"].items()}
    duration = report["frames"] / fps + 1.2
    music = np.zeros((2, int(SR * duration)))
    fx = np.zeros_like(music)

    first_freeze = report["freezes"][0] / fps
    place(music, riser(first_freeze), 0, 0.8)
    bassline(music, (first_freeze, sec["hook"][1]), beat, 0.9)

    build = sec["build"]
    drums(music, build, beat, False)
    bassline(music, build, beat, 0.8)
    riff(music, (build[0] + 8 * beat, build[1]), beat, 0.8)

    rush = sec["rush"]
    drums(music, rush, beat, True)
    bassline(music, rush, beat, 0.85)
    riff(music, rush, beat, 0.85)
    snare_roll(music, rush, beat)
    place(music, riser(rush[1] - rush[0] + (sec["brake"][1] - sec["brake"][0])), rush[0], 0.9)

    # Brake: silence, one falling 808 into the drop.
    brake = sec["brake"]
    place(music, sub808(ROOT, brake[1] - brake[0]), brake[0], 0.6)

    drop = sec["drop"]
    drums(music, drop, beat, True)
    bassline(music, drop, beat, 1.0)
    riff(music, drop, beat, 1.0)

    for cue in report["cues"]:
        at = cue["at"] / fps
        if cue["kind"] == "hit":
            place(fx, noise_hit(1.0), at, 0.55)
        elif cue["kind"] == "final":
            place(fx, boom(), at, 1.0)
            place(fx, metal(1.6), at, 1.0)
        elif cue["kind"] == "whoosh":
            place(fx, whoosh(), max(0, at - 0.22), 0.9)

    # Music drops out for the frozen impact, so each finisher hits in silence.
    gate = np.ones(music.shape[1])
    for f in report["freezes"]:
        i = int(f / fps * SR)
        gate[i : i + int(0.2 * SR)] = 0.15
    gate = lowpass(gate, 40)
    level = lowpass(np.abs(fx).mean(axis=0), 30)
    duck = 1 - np.clip(level * 2.5, 0, 0.5)
    mix = music * gate * duck + fx
    end = int((report["frames"] / fps) * SR)
    fade = np.ones(music.shape[1])
    fade[end:] = np.linspace(1, 0, music.shape[1] - end)
    mix = np.tanh(mix * fade * 0.75) * 0.92
    data = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


main()
