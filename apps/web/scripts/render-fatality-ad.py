"""Vertical (TikTok, 1080 x 1920, 30 fps) Black Whale Clash ad cut from the Fatality films.

python3 apps/web/scripts/render-fatality-ad.py
Needs the 10 s Fatality renders in output/, the cards from
render-fatality-ad-cards.mjs, and ffmpeg. Writes output/fighting-fatality-ad/.
Music: fatality-ad-music.py, synced to the same 120 BPM beat grid.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
OUT = os.path.join(ROOT, "output/fighting-fatality-ad")
SEG = os.path.join(OUT, "segments")
CARDS = os.path.join(OUT, "cards")
FPS = 30
BEAT = 0.5  # 120 BPM

F = {
    "basho": "fighting-basho-fatality/Basho-Fatality-10s.mp4",
    "benjamin": "fighting-benjamin-fatality/Benjamin-Fatality-10s.mp4",
    "bill": "fighting-bill-fatality/Bill-Fatality-10s.mp4",
    "biscuit": "fighting-biscuit-fatality/Biscuit-Fatality-10s-chute-corrigee.mp4",
    "bonolenov": "fighting-bonolenov-fatality/Bonolenov-Fatality-10s.mp4",
    "camilla": "fighting-camilla-fatality/Camilla-Fatality-10s.mp4",
    "chrollo": "fighting-chrollo-fish-fatality/Chrollo-Indoor-Fish-Fatality-10s.mp4",
    "feitan": "fighting-feitan-fatality/Feitan-Fatality-10s.mp4",
    "franklin": "fighting-franklin-fatality/Franklin-Fatality-10s-Corrigee.mp4",
    "halkenburg": "fighting-halkenburg-fatality/Halkenburg-Fatality-10s.mp4",
    "hanzo": "fighting-hanzo-fatality/Hanzo-Fatality-10s.mp4",
    "hinrigh": "fighting-hinrigh-fatality/Hinrigh-Fatality-10s.mp4",
    "hisoka": "fighting-hisoka-fear/Hisoka-Regarde-Moi-Terreur-10s.mp4",
    "illumi": "fighting-illumi-fatality/Illumi-Fatality-10s.mp4",
    "kalluto": "fighting-kalluto-fatality/Kalluto-Fatality-10s.mp4",
    "kurapika": "fighting-kurapika-fatality/Kurapika-Fatality-10s.mp4",
    "brigade": "fighting-kurapika-troupe/Kurapika-Brigade-Fatality-10s.mp4",
    "leorio": "fighting-leorio-fatality/Leorio-Fatality-10s.mp4",
    "luini": "fighting-luini-fatality/Luini-Fatality-10s.mp4",
    "lynch": "fighting-lynch-fatality/Lynch-Fatality-10s.mp4",
    "machi": "fighting-machi-fatality/Machi-Fatality-10s.mp4",
    "melody": "fighting-melody-fatality/Melody-Fatality-10s.mp4",
    "mizaistom": "fighting-mizaistom-fatality/Mizaistom-Fatality-10s.mp4",
    "nobunaga": "fighting-nobunaga-fatality/Nobunaga-Fatality-10s.mp4",
    "phinks": "fighting-phinks-fatality/Phinks-Fatality-8s.mp4",
    "rihan": "fighting-rihan-fatality/Rihan-Fatality-10s.mp4",
    "saiyu": "fighting-saiyu-fatality/Saiyu-Fatality-Sens-10s.mp4",
    "shizuku": "fighting-shizuku-fatality/Shizuku-Fatality-9s.mp4",
    "terebellum": "fighting-terebellum-fatality/Terebellum-Fatality-10s.mp4",
    "theta": "fighting-theta-fatality/Theta-Fatality-10s.mp4",
    "tserriednich": "fighting-tserriednich-fatality/Tserriednich-Fatality-10s.mp4",
    "voconte": "fighting-voconte-fatality/Voconte-Fatality-10s.mp4",
    "zakuro": "fighting-zakuro-fatality/Zakuro-Fatality-10s.mp4",
}

# (fighter, source centre in seconds). Moments checked frame by frame.
ACTION = [
    ("feitan", 5.2), ("kalluto", 4.5), ("basho", 5.0), ("camilla", 3.6),
    ("franklin", 5.2), ("halkenburg", 3.5), ("machi", 4.5), ("benjamin", 5.5),
    ("hinrigh", 4.4), ("melody", 5.0), ("mizaistom", 5.0), ("rihan", 4.5),
    ("zakuro", 5.2), ("leorio", 5.5), ("phinks", 4.7), ("lynch", 4.5),
]
RAPID = [
    ("bill", 6.1), ("biscuit", 5.7), ("hanzo", 6.3), ("illumi", 2.2),
    ("brigade", 2.5), ("chrollo", 2.5), ("luini", 5.5), ("nobunaga", 4.7),
    ("shizuku", 6.0), ("terebellum", 2.3), ("feitan", 4.3), ("theta", 6.3),
    ("tserriednich", 4.2), ("kalluto", 6.0), ("voconte", 5.0), ("bonolenov", 5.2),
]
PORTRAITS = [
    "hisoka", "kurapika", "feitan", "chrollo", "biscuit", "franklin", "machi", "phinks",
    "illumi", "kalluto", "shizuku", "nobunaga", "benjamin", "bonolenov", "camilla", "basho",
]


def shot(fighter, start, beats, speed=1.0, flash=0.0, push=0.05, gain=0.5, full=False, cx=0.5):
    """full: full-height crop around cx; otherwise a wide band over a blurred copy."""
    return dict(kind="shot", src=F[fighter], start=start, dur=beats * BEAT, speed=speed,
                flash=flash, push=push, gain=gain, name=fighter, full=full, cx=cx)


def black(beats):
    return dict(kind="black", dur=beats * BEAT)


def timeline():
    t = [black(8)]  # cold open: the two lines play on black
    t += [
        shot("feitan", 0.0, 4, push=0.08, gain=0.35, full=True),
        shot("hisoka", 2.5, 4, push=0.08, gain=0.35, full=True, cx=0.55),
        shot("kurapika", 2.4, 4, push=0.08, gain=0.35),
        shot("bonolenov", 3.6, 4, push=0.08, gain=0.35),
    ]
    t += [black(2)]  # FATALITY slam card
    for name, c in ACTION:
        t.append(shot(name, c - 0.4, 2, speed=0.8, flash=0.07, push=0.06, gain=0.55))
    for name, c in RAPID:
        t.append(shot(name, c - 0.25, 1, flash=0.1, push=0.04, gain=0.45))
    for k, name in enumerate(PORTRAITS):
        # Half a beat is 7.5 frames: alternate 7 and 8 so the roll stays on the grid.
        t.append(shot(name, 8.7, (7 + k % 2) / FPS / BEAT, flash=0.05, push=0.0, gain=0.0))
    t.append(shot("chrollo", 6.75, 4, speed=0.5, flash=0.15, push=0.1, gain=0.9, full=True, cx=0.55))
    t += [black(1), black(12)]  # silence, then end card
    return t


def run(args):
    subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", *args],
                   check=True)


# The films carry their own title bars; keep only the picture between them.
CROP = "crop=1529:860:195:80"


def render_segment(i, s):
    dest = os.path.join(SEG, f"{i:03d}.mp4")
    if os.path.exists(dest) and not os.environ.get("FORCE"):
        return dest
    frames = round(s["dur"] * FPS)
    enc = ["-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
    if s["kind"] == "black":
        run(["-f", "lavfi", "-i", f"color=c=0x05070b:s=1080x1920:r={FPS}",
             "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
             "-frames:v", str(frames), "-t", str(s["dur"]), *enc, dest])
        return dest
    src_dur = s["dur"] * s["speed"]
    z = f"1+{s['push']}*on/{max(1, frames - 1)}"
    head = f"[0:v]{CROP},setpts=(PTS-STARTPTS)/{s['speed']},fps={FPS}"
    if s["full"]:
        x = min(1529 - 484, max(0, round(s["cx"] * 1529 - 242)))
        graph = f"{head},crop=484:860:{x}:0,scale=1440:2560:flags=lanczos[c]"
    else:
        x = min(1529 - 1100, max(0, round(s["cx"] * 1529 - 550)))
        graph = (f"{head},split[a][b];"
                 "[a]scale=-2:1920,crop=1080:1920,boxblur=26:2,eq=brightness=-0.2:saturation=1.25[bg];"
                 f"[b]crop=1100:860:{x}:0,scale=1080:-2:flags=lanczos[fg];"
                 "[bg][fg]overlay=0:(H-h)/2-40,scale=1440:2560:flags=lanczos[c]")
    graph += (f";[c]zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps={FPS},"
              "eq=contrast=1.08:saturation=1.12")
    if s["flash"]:
        graph += f",fade=t=in:st=0:d={s['flash']}:color=white"
    graph += "[v]"
    a = (f"aresample=48000,asetrate={48000 * s['speed']:.0f},aresample=48000,"
         f"volume={s['gain']},apad")
    run(["-ss", f"{max(0, s['start']):.3f}", "-t", f"{src_dur + 0.2:.3f}", "-i",
         os.path.join(ROOT, "output", s["src"]), "-filter_complex", graph, "-map", "[v]",
         "-map", "0:a", "-af", a, "-frames:v", str(frames), "-t", f"{s['dur']:.3f}", *enc, dest])
    return dest


def overlays(starts):
    """(card, start, end, fade) on the beat grid."""
    t = lambda i: starts[i]
    action0, rapid0 = 6, 6 + len(ACTION)
    end = len(starts) - 1
    return [
        ("brand", t(1), t(end - 2), 0.3),
        ("a1", 0.4, 2.0, 0.35), ("a2", 2.2, 3.9, 0.35),
        ("b1", t(2), t(3) - 0.1, 0.2), ("b2", t(4), t(5) - 0.1, 0.2),
        ("slam", t(5), t(6), 0.0),
        ("c1", t(action0 + 8), t(action0 + 11), 0.15),
        ("d1", t(rapid0 + 12), t(rapid0 + 16), 0.05),
        ("end-bg", t(end), t(end) + 6.0, 0.0),
        ("end-logo", t(end) + 0.0, t(end) + 6.0, 0.25),
        ("end-cta", t(end) + 1.5, t(end) + 6.0, 0.3),
        ("end-url", t(end) + 2.5, t(end) + 6.0, 0.3),
    ]


def main():
    os.makedirs(SEG, exist_ok=True)
    plan = timeline()
    starts, at = [], 0.0
    for s in plan:
        starts.append(at)
        at += s["dur"]
    total = at
    parts = []
    for i, s in enumerate(plan):
        parts.append(render_segment(i, s))
        sys.stdout.write(f"\rsegment {i + 1}/{len(plan)}")
    print()
    listing = os.path.join(OUT, "segments.txt")
    open(listing, "w").write("".join(f"file '{p}'\n" for p in parts))
    body = os.path.join(OUT, "body.mp4")
    run(["-f", "concat", "-safe", "0", "-i", listing, "-c:v", "libx264", "-preset", "medium",
         "-crf", "15", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "224k", body])
    cues = dict(total=total, beat=BEAT, starts=starts,
                kinds=[s["kind"] if s["kind"] == "black" else s["name"] for s in plan],
                sections=dict(intro=starts[1], slam=starts[5], action=starts[6],
                              rapid=starts[6 + len(ACTION)],
                              portraits=starts[6 + len(ACTION) + len(RAPID)],
                              hero=starts[-3], silence=starts[-2], end=starts[-1]))
    json.dump(cues, open(os.path.join(OUT, "cues.json"), "w"), indent=1)
    music = os.path.join(OUT, "music.wav")
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "fatality-ad-music.py"),
                    os.path.join(OUT, "cues.json"), music], check=True)
    inputs, chain, last = ["-i", body, "-i", music], [], "[0:v]"
    for k, (card, a, b, fade) in enumerate(overlays(starts)):
        # Every card runs from t=0 so the overlays never have to buffer the main video.
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{total:.3f}", "-i",
                   os.path.join(CARDS, f"{card}.png")]
        f = "format=rgba"
        if fade:
            f += f",fade=t=in:st={a:.3f}:d={fade}:alpha=1"
        if card != "end-bg":
            f += f",fade=t=out:st={max(a, b - 0.15):.3f}:d=0.15:alpha=1"
        chain.append(f"[{k + 2}:v]{f}[o{k}]")
        chain.append(f"{last}[o{k}]overlay=shortest=1:enable='between(t,{a:.3f},{b:.3f})'[v{k}]")
        last = f"[v{k}]"
    chain.append(f"[0:a]volume=1.0[ga];[1:a]volume=1.0[ma];[ga][ma]amix=inputs=2:normalize=0,"
                 f"alimiter=limit=0.95[a]")
    final = os.path.join(OUT, "Black-Whale-Clash-Fatality-Pub-TikTok.mp4")
    run([*inputs, "-filter_complex", ";".join(chain), "-map", last, "-map", "[a]",
         "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "224k", "-movflags", "+faststart", "-t", f"{total:.3f}",
         "-metadata", "title=Black Whale Clash — Fatality", final])
    print(f"Final: {final} ({total:.1f} s)")


main()
