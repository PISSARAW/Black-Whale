"""Phonk track for the Nen-category edit, built on the edit's own sections.

python3 nen-edit-music.py edit-report.json out.wav

Hook: riser and four hits. Then one steady beat; a snare fill leads into each category,
which opens on a boom. Kurapika's Emperor Time cuts the music to a ringing silence; after
it the drums go double time. The unknown section is filtered dark. Instruments come from
combo-edit-music.py.
"""
import json
import pathlib
import sys
import wave

import numpy as np

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

ROOT = 55.0
RIFF = [0, 3, 7, 10, 7, 3, 12, 10, 0, 3, 7, 3, 15, 12, 10, 7]
BASS = [0, 0, -2, -4]


def note(semitones):
    return ROOT * 4 * 2 ** (semitones / 12)


def beat_at(music, at, index, dense):
    place(music, kick(), at, 0.95)
    if dense:
        place(music, kick(), at + BEAT_S / 2, 0.65)
    if index % 2 == 1:
        place(music, clap(), at, 0.8)
    steps = 4 if dense else 2
    for s in range(steps):
        place(music, hat(), at + s * BEAT_S / steps, 0.65, pan=0.3)
    for s in range(2):
        cow = cowbell(note(RIFF[(index * 2 + s) % len(RIFF)]))
        place(music, cow, at + s * BEAT_S / 2, 0.8, pan=-0.2)
    if index % 4 == 0:
        place(music, sub808(ROOT * 2 ** (BASS[(index // 4) % 4] / 12), BEAT_S * 3.6), at, 0.85)


def fill(music, at):
    """Four sixteenth claps rising into the next category."""
    for k in range(4):
        place(music, clap(), at - BEAT_S + k * BEAT_S / 4, 0.4 + 0.15 * k)


def main():
    global BEAT_S
    report = json.load(open(sys.argv[1]))
    fps = report["fps"]
    BEAT_S = 60 / report["bpm"]
    seconds = lambda frame: frame / fps  # noqa: E731
    duration = report["frames"] / fps + 1.5
    music = np.zeros((2, int(SR * duration)))
    fx = np.zeros_like(music)
    hook_end = seconds(report["hookEnd"])
    freeze = [seconds(f) for f in report["pivotFreeze"]]
    end = seconds(report["end"])
    unknown = next((seconds(s["at"]) for s in report["sections"] if s["category"] == "unknown"), end)

    place(music, riser(hook_end), 0, 0.7)
    index = 0
    t = hook_end
    while t < end - 1e-6:
        if not (freeze[0] <= t < freeze[1]):
            beat_at(music, t, index, dense=t >= freeze[1])
        index += 1
        t = hook_end + index * BEAT_S
    for section in report["sections"]:
        at = seconds(section["at"])
        if at > hook_end:
            fill(music, at)
    place(music, riser(freeze[0] - (freeze[0] - 2 * BEAT_S)), freeze[0] - 2 * BEAT_S, 0.6)

    for cue in report["cues"]:
        at = seconds(cue["at"])
        if cue["kind"] == "hit":
            place(fx, noise_hit(1.0), at, 0.5)
        elif cue["kind"] == "crit":
            place(fx, noise_hit(1.6), at, 0.8)
            place(fx, metal(1.0), at, 0.8)
        elif cue["kind"] == "final":
            place(fx, boom(), at, 0.85)
            place(fx, metal(1.2), at, 0.7)
        elif cue["kind"] == "whoosh":
            place(fx, whoosh(), max(0, at - 0.22), 0.9)
            place(fx, boom(), at, 0.6)
        elif cue["kind"] == "key":
            place(fx, metal(3.0), at, 1.0)
            place(fx, metal(2.0), at + BEAT_S / 2, 0.6)

    # Emperor Time: the beat stops; only its ringing and the room remain.
    gate = np.ones(music.shape[1])
    gate[int(freeze[0] * SR) : int(freeze[1] * SR)] = 0.04
    gate = lowpass(gate, 40)
    # The unknowns: the same beat, muffled, until the end card.
    dark = music.copy()
    i, j = int(unknown * SR), int(end * SR)
    for ch in range(2):
        dark[ch, i:j] = lowpass(music[ch, i:j], 700) * 1.6
    level = lowpass(np.abs(fx).mean(axis=0), 30)
    duck = 1 - np.clip(level * 2.5, 0, 0.5)
    mix = dark * gate * duck + fx
    k = int(end * SR)
    fade = np.ones(music.shape[1])
    fade[k:] = np.linspace(1, 0, music.shape[1] - k)
    mix = np.tanh(mix * fade * 0.75) * 0.92
    data = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


BEAT_S = 0.4
main()
