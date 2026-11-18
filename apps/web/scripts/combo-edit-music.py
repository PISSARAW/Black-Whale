"""Phonk-style beat for the vertical combo edit, synced to edit-report.json cues.

python3 combo-edit-music.py edit-report.json out.wav
Every cut is on a beat (150 BPM, 12 frames at 30 fps); impact sounds sit on the
real engine contacts listed in the report.
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def env(n, attack=0.002, decay=0.2):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def lowpass(x, cutoff):
    # Cheap FIR lowpass: windowed sinc.
    taps = 101
    fc = cutoff / SR
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc * n) * np.hamming(taps)
    h /= h.sum()
    return np.convolve(x, h, mode="same")


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def kick(length=0.45):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = 45 + 140 * np.exp(-t / 0.035)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * env(n, 0.001, 0.22)
    click = rng.standard_normal(n) * env(n, 0.0005, 0.004) * 0.4
    return np.tanh((body + click) * 2.2) * 0.9


def sub808(note_hz, length):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = note_hz * (1 + 0.6 * np.exp(-t / 0.03))
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(np.sin(phase) * 2.5) * env(n, 0.002, length * 0.6) * 0.55


def clap():
    n = int(SR * 0.25)
    noise = highpass(rng.standard_normal(n), 900)
    e = np.zeros(n)
    for off in (0, 0.009, 0.018):
        k = int(off * SR)
        e[k:] += env(n - k, 0.0005, 0.012 if off < 0.018 else 0.09)
    return np.tanh(noise * e * 1.4) * 0.5


def hat(open_=False):
    n = int(SR * (0.18 if open_ else 0.045))
    x = highpass(rng.standard_normal(n), 7000)
    return x * env(n, 0.0005, 0.06 if open_ else 0.012) * 0.22


def cowbell(hz, length=0.18):
    n = int(SR * length)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * hz * t)) + np.sign(np.sin(2 * np.pi * hz * 1.48 * t))
    x = lowpass(x, 4200)
    return x * env(n, 0.001, 0.07) * 0.16


def key_click():
    n = int(SR * 0.06)
    t = np.arange(n) / SR
    tick = highpass(rng.standard_normal(n), 3000) * env(n, 0.0002, 0.006)
    thock = np.sin(2 * np.pi * 900 * t) * env(n, 0.0005, 0.012) * 0.5
    return (tick + thock) * 0.55


def noise_hit(power):
    n = int(SR * 0.3)
    burst = lowpass(rng.standard_normal(n), 5000) * env(n, 0.0005, 0.03) * 0.7
    thump = kick(0.3)[:n] * 0.8
    return np.tanh((burst + thump) * power) * 0.75


def metal(power):
    n = int(SR * 0.5)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) for f in (1830, 2671, 3917, 5210))
    return x * env(n, 0.0005, 0.09) * 0.09 * power


def boom():
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    f = 32 + 90 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.7)
    crack = lowpass(rng.standard_normal(n), 9000) * env(n, 0.0005, 0.06)
    tail = lowpass(rng.standard_normal(n), 1200) * env(n, 0.01, 0.5) * 0.35
    return np.tanh((sub * 1.6 + crack + tail) * 1.8) * 0.95


def whoosh(length=0.32):
    n = int(SR * length)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    shaped = lowpass(x, 2500) * np.sin(np.pi * t / length) ** 2
    return shaped * 0.45


def riser(length):
    n = int(SR * length)
    t = np.arange(n) / SR
    out = np.zeros(n)
    chunk = SR // 20
    for i in range(0, n, chunk):
        cut = 300 + 9000 * (i / n) ** 2
        seg = rng.standard_normal(min(chunk, n - i))
        out[i : i + len(seg)] = lowpass(seg, cut)
    tone = np.sin(2 * np.pi * np.cumsum(110 + 660 * (t / length) ** 2) / SR) * 0.15
    return (out * 0.35 + tone) * (t / length) ** 1.5


def place(buf, sound, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= buf.shape[1]:
        return
    j = min(buf.shape[1], i + len(sound))
    left, right = (1 - pan) * 0.5 + 0.5 * (pan <= 0), (1 + pan) * 0.5 + 0.5 * (pan >= 0)
    buf[0, i:j] += sound[: j - i] * gain * min(1, left)
    buf[1, i:j] += sound[: j - i] * gain * min(1, right)


def main():
    report = json.load(open(sys.argv[1]))
    fps, bpm = report["fps"], report["bpm"]
    beat = 60 / bpm
    duration = report["frames"] / fps + 1.5
    title = report["cuts"][0] / fps if report["cuts"] else 0
    outro = report["frames"] / fps - 6 * beat
    music = np.zeros((2, int(SR * duration)))
    fx = np.zeros_like(music)
    root = 55.0  # A1
    # Phonk cowbell riff in A minor pentatonic, two bars.
    riff = [0, 3, 7, 10, 7, 3, 12, 10, 0, 3, 7, 3, 15, 12, 10, 7]
    bass = [0, 0, -2, -4]
    k, c, h, ho = kick(), clap(), hat(), hat(True)
    bells = {s: cowbell(root * 8 * 2 ** (s / 12)) for s in set(riff)}
    place(music, riser(title), 0, 0.8)
    for b in range(int(title / beat), int(duration / beat)):
        at = b * beat
        if at >= outro + 4 * beat:
            break
        bar_beat = b % 4
        fade = 1.0 if at < outro else max(0, 1 - (at - outro) / (4 * beat))
        place(music, k, at, 0.9 * fade)
        if bar_beat == 2:
            place(music, c, at, 0.8 * fade)
        if bar_beat == 3:
            place(music, k, at + beat * 0.5, 0.6 * fade)
        if b % 4 == 0:
            note = root * 2 ** (bass[(b // 4) % 4] / 12)
            place(music, sub808(note, beat * 3.6), at, 0.9 * fade)
        for s in range(2):
            place(music, h, at + s * beat / 2, 0.8 * fade, pan=0.3)
        if b % 8 == 7:  # hat roll into the next bar
            for r in range(6):
                place(music, h, at + beat / 2 + r * beat / 12, 0.5 * fade, pan=0.3)
        else:
            place(music, ho, at + beat * 0.75, 0.4 * fade, pan=-0.3)
        for s in range(2):
            idx = (b * 2 + s) % len(riff)
            place(music, bells[riff[idx]], at + s * beat / 2, fade, pan=-0.2 if s else 0.2)
    for cue in report["cues"]:
        at = cue["at"] / fps
        kind = cue["kind"]
        if kind == "hit":
            place(fx, noise_hit(1.0), at, 0.7)
        elif kind == "crit":
            place(fx, noise_hit(1.6), at, 0.85)
            place(fx, metal(1.0), at, 1.0)
        elif kind == "final":
            place(fx, boom(), at, 1.0)
            place(fx, metal(1.4), at, 1.0)
        elif kind == "whoosh":
            place(fx, whoosh(), max(0, at - 0.22), 0.8)
        elif kind == "key":
            place(fx, key_click(), at, 0.8, pan=0.15)
        elif kind == "drop":
            place(fx, boom(), at, 0.8)
    # Duck the music under the hits so each contact reads.
    level = lowpass(np.abs(fx).mean(axis=0), 30)
    duck = 1 - np.clip(level * 2.5, 0, 0.55)
    mix = music * duck + fx
    mix = np.tanh(mix * 0.7) * 0.92
    data = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


main()
