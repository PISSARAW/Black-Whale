"""Hybrid trailer score for the Fatality ad, on the 120 BPM grid of cues.json.

python3 fatality-ad-music.py cues.json out.wav
Cold open: drone and clock. Introductions: braam, toms. FATALITY: impact.
Action: full drums and ostinato. Rapid cuts: double-time toms and riser.
Portraits: snare roll. Hero shot: the biggest hit, then silence and a final sting.
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(11)


def env(n, attack=0.002, decay=0.2):
    t = np.arange(n) / SR
    return np.clip(t / max(attack, 1e-4), 0, 1) * np.exp(-t / decay)


def lowpass(x, cutoff, taps=129):
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * cutoff / SR * n) * np.hamming(taps)
    return np.convolve(x, h / h.sum(), mode="same")


def tone(freqs, length, decay, attack=0.01, shape="saw"):
    n = int(SR * length)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for detune in (-0.004, 0, 0.004):
            ph = (f * (1 + detune) * t) % 1
            x += (2 * ph - 1) if shape == "saw" else np.sin(2 * np.pi * f * (1 + detune) * t)
    return x / (3 * len(freqs)) * env(n, attack, decay)


def braam(root, length=3.0):
    x = tone([root, root * 1.5, root * 2, root * 2.38], length, length * 0.6, 0.03)
    x = lowpass(np.tanh(x * 3), 1400)
    sub = tone([root / 2], length, length * 0.5, 0.01, "sine")
    return np.tanh((x + sub * 1.4) * 1.6) * 0.8


def kick(length=0.6, low=38):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = low + 120 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.28)
    click = rng.standard_normal(n) * env(n, 0.0005, 0.005) * 0.5
    return np.tanh((body + click) * 2.4) * 0.9


def tom(pitch=90, length=0.5):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = pitch * (1 + 0.5 * np.exp(-t / 0.03))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18)
    skin = lowpass(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.03) * 0.5
    return np.tanh((body + skin) * 2) * 0.7


def snare(length=0.4):
    n = int(SR * length)
    noise = rng.standard_normal(n)
    noise = noise - lowpass(noise, 1200)
    body = np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env(n, 0.001, 0.05)
    return np.tanh((noise * env(n, 0.001, 0.12) * 0.8 + body * 0.6) * 1.6) * 0.6


def tick():
    n = int(SR * 0.05)
    return (rng.standard_normal(n) - lowpass(rng.standard_normal(n), 3000)) * env(n, 0.0003, 0.008) * 0.35


def boom(length=3.0):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = 28 + 80 * np.exp(-t / 0.1)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 1.1)
    crack = lowpass(rng.standard_normal(n), 9000) * env(n, 0.0005, 0.07)
    tail = lowpass(rng.standard_normal(n), 900) * env(n, 0.02, 0.9) * 0.4
    return np.tanh((sub * 1.8 + crack + tail) * 1.7) * 0.95


def riser(length):
    n = int(SR * length)
    t = np.arange(n) / SR
    out = np.zeros(n)
    step = SR // 25
    for i in range(0, n, step):
        seg = rng.standard_normal(min(step, n - i))
        out[i : i + len(seg)] = lowpass(seg, 300 + 9000 * (i / n) ** 2, 65)
    sweep = np.sin(2 * np.pi * np.cumsum(80 + 900 * (t / length) ** 2.2) / SR) * 0.2
    return (out * 0.4 + sweep) * (t / length) ** 1.8


def drone(length, root):
    n = int(SR * length)
    t = np.arange(n) / SR
    x = tone([root, root * 1.5, root * 2.0], length, 1e9, 1.5)
    x = lowpass(x, 600) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t))
    return x * np.clip(t / 1.5, 0, 1) * 0.7


def ostinato(length, root, beat):
    """Sixteenths on a minor figure, tight and filtered."""
    n = int(SR * length)
    out = np.zeros(n)
    figure = [0, 0, 12, 0, 3, 0, 7, 0, 0, 0, 12, 0, 10, 0, 7, 3]
    step = beat / 4
    for k in range(int(length / step)):
        f = root * 2 ** (figure[k % 16] / 12)
        note = lowpass(tone([f], step * 0.9, step * 0.5, 0.002), 2200)
        i = int(k * step * SR)
        out[i : i + len(note)] += note[: n - i]
    return out * 0.5


def place(buf, s, at, gain=1.0):
    i = int(at * SR)
    if i >= buf.shape[1] or i < 0:
        return
    j = min(buf.shape[1], i + len(s))
    buf[:, i:j] += s[: j - i] * gain


def main():
    cues = json.load(open(sys.argv[1]))
    beat, sec, total = cues["beat"], cues["sections"], cues["total"]
    mix = np.zeros((2, int(SR * (total + 0.5))))
    root = 55.0  # A
    place(mix, drone(sec["intro"] + 0.5, root / 2), 0, 0.8)
    for b in range(int(sec["intro"] / beat)):
        place(mix, tick(), b * beat, 0.9)
    place(mix, riser(2.0), sec["intro"] - 2.0, 0.5)
    # Introductions: a braam on each shot, slow toms.
    for k in range(4):
        at = sec["intro"] + k * 4 * beat
        place(mix, braam(root * (1, 1, 0.94, 0.89)[k], 2.4), at, 0.75)
        for b in (0, 2, 3):
            place(mix, tom(70), at + b * beat, 0.6)
    place(mix, riser(sec["slam"] - sec["intro"] - 0.0), sec["intro"], 0.25)
    place(mix, boom(2.5), sec["slam"], 1.0)
    place(mix, braam(root, 3.0), sec["slam"], 0.9)
    # Action: full kit and ostinato.
    length = sec["rapid"] - sec["action"]
    place(mix, ostinato(length + sec["portraits"] - sec["rapid"], root * 2, beat), sec["action"], 0.6)
    for b in range(int(length / beat)):
        at = sec["action"] + b * beat
        place(mix, kick(), at, 0.8 if b % 2 == 0 else 0.45)
        if b % 2 == 1:
            place(mix, snare(), at, 0.85)
        place(mix, tom(110), at + beat / 2, 0.35)
        if b % 8 == 0:
            place(mix, braam(root * (1, 0.89, 0.94, 0.84)[(b // 8) % 4], 2.0), at, 0.45)
    # Rapid cuts: double time.
    length = sec["portraits"] - sec["rapid"]
    for k in range(int(length / (beat / 2))):
        at = sec["rapid"] + k * beat / 2
        place(mix, tom(90 + 40 * (k % 2)), at, 0.55)
        if k % 2 == 0:
            place(mix, kick(), at, 0.7)
    place(mix, riser(length + (sec["hero"] - sec["portraits"])), sec["rapid"], 0.45)
    # Portraits: accelerating snare roll.
    length = sec["hero"] - sec["portraits"]
    k, at = 0, sec["portraits"]
    while at < sec["hero"] - 0.02:
        place(mix, snare(0.2), at, 0.35 + 0.5 * (at - sec["portraits"]) / length)
        at += beat / 4 if at < sec["portraits"] + length / 2 else beat / 8
    # Hero: the biggest hit, then let it ring out.
    place(mix, boom(3.5), sec["hero"], 1.1)
    place(mix, braam(root / 1.0, 3.5), sec["hero"], 0.8)
    # End card: sting and pad.
    place(mix, boom(3.0), sec["end"], 0.7)
    place(mix, braam(root, 5.0), sec["end"], 0.6)
    pad = lowpass(tone([root * 2, root * 2.38, root * 3, root * 4], total - sec["end"], 1e9, 0.8), 1800)
    fade = np.linspace(1, 0, len(pad)) ** 1.5
    place(mix, pad * fade * 0.9, sec["end"], 0.7)
    mix[1] = np.roll(mix[1], 240)  # 5 ms stereo spread
    mix = np.tanh(mix * 0.75) * 0.9
    data = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


main()
