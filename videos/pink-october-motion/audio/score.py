"""Synthesize the Pink October score: a soft 60 BPM bed whose beat grid is the
on-screen heartbeat (first pulse 2.15s, every 1.0s), plus light SFX on reveals.

    python3 audio/score.py   ->  audio/score_raw.wav  (then loudnorm via ffmpeg)

Deterministic: fixed RNG seeds, no external samples.
"""
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 10.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(1031)


def hz(m):  # midi -> Hz
    return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(n, a, d_rate):
    t = np.arange(n) / SR
    e = np.exp(-t * d_rate)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def lp(x, f):
    return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)


# ---------- instruments ----------
def piano(f, dur=2.2, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 7):
        fk = f * k * (1 + 0.0004 * k * k)
        out += np.sin(2 * np.pi * fk * t) * (1 / k**1.6) * np.exp(-t * (1.1 + 0.9 * k))
    out *= env(n, 0.004, 0.0)
    return lp(out, 5200) * vel


def pad(freqs, dur, attack=1.2, release=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            for k in range(1, 5):
                out += np.sin(2 * np.pi * ff * k * t + k * det) / (k**1.8)
    out /= len(freqs) * 3
    e = np.ones(n)
    na, nr = int(attack * SR), int(release * SR)
    e[:na] = np.linspace(0, 1, na) ** 1.6
    e[-nr:] *= np.linspace(1, 0, nr) ** 1.4
    trem = 1 + 0.05 * np.sin(2 * np.pi * 0.35 * t)
    return lp(out * e * trem, 2200)


def bell(f, dur=2.5, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, amp, dec in ((1, 1, 2.2), (2.76, 0.45, 3.6), (5.4, 0.22, 5.5), (8.93, 0.1, 8)):
        out += np.sin(2 * np.pi * f * ratio * t) * amp * np.exp(-t * dec)
    return out * env(n, 0.002, 0.0) * vel


def heartbeat(strong=True):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 62 * np.exp(-t * 5) + 46
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) + 0.45 * np.sin(2 * ph)  # 2nd harmonic so phones hear it
    e = np.exp(-t * (16 if strong else 20))
    e[: int(0.006 * SR)] *= np.linspace(0, 1, int(0.006 * SR))
    click = hp(rng.normal(0, 1, n), 1800) * np.exp(-t * 300) * 0.06
    return (body * e + click) * (1.0 if strong else 0.62)


def swish(dur, lo, hi, shape="rise"):
    n = int(dur * SR)
    x = bp(rng.normal(0, 1, n), lo, hi)
    u = np.linspace(0, 1, n)
    e = np.sin(np.pi * u) ** 2 if shape == "arc" else (u**2 * np.exp(-u * 0) * (1 - u) ** 0.5 * 3)
    return x * e


def flutter(dur=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.normal(0, 1, n), 900, 4200)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 17 * t) ** 2
    u = np.linspace(0, 1, n)
    return x * am * np.sin(np.pi * u) ** 1.5


def boom():
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = 90 * np.exp(-t * 6) + 42
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.35 * np.sin(2 * ph)) * np.exp(-t * 4.2) * env(n, 0.003, 0.0)


# ---------- the bed: F major, beat grid = heartbeat grid ----------
BEAT0 = 0.15  # music beat k lands at 0.15 + k (heartbeat starts at 2.15 = beat 2)
chords = [  # (start beat, beats, midi notes)
    (-0.15, 2.15, [53, 57, 60, 64]),        # Fmaj7
    (2, 2, [57, 60, 64, 67]),               # Am7
    (4, 2, [58, 62, 65, 69]),               # Bbmaj7
    (6, 1.5, [60, 65, 67, 72]),             # Csus4/add
    (7.5, 2.4, [53, 60, 64, 67, 69]),       # Fmaj9 (resolve)
]
for b, nb, notes in chords:
    t0 = BEAT0 + b
    place(pad([hz(m) for m in notes], nb + 1.3, attack=0.9 if b > 0 else 0.3), max(0, t0), gain=0.16)
    place(pad([hz(notes[0] - 12)], nb + 1.3, attack=0.9 if b > 0 else 0.3), max(0, t0), gain=0.10)

# piano arpeggio on 8ths from beat 0, soft, rising contour per chord
arp_t = BEAT0
while arp_t < 9.2:
    k = int(round((arp_t - BEAT0) * 2))
    b = arp_t - BEAT0
    notes = [c[2] for c in chords if c[0] <= b < c[0] + c[1] + 1e-6]
    notes = notes[-1] if notes else chords[0][2]
    pat = [0, 2, 1, 3, 2, 4, 1, 3]
    m = notes[pat[k % 8] % len(notes)] + 12
    vel = 0.55 if k % 2 == 0 else 0.38
    if arp_t > 7.8:
        vel *= max(0.0, 1 - (arp_t - 7.8) / 1.5)
    place(piano(hz(m), vel=vel), arp_t, gain=0.20, pan=-0.35 + 0.7 * ((k * 3) % 5) / 4)
    arp_t += 0.5

# opening heartbeat (rings pulse where the chest piece will land)
place(heartbeat(True), 0.1, gain=0.3)
place(heartbeat(False), 0.34, gain=0.3)

# heartbeat: lub-dub, synced to rings
t = 2.15
while t < 9.7:
    place(heartbeat(True), t, gain=0.27)
    place(heartbeat(False), t + 0.24, gain=0.27)
    t += 1.0

# ---------- SFX on reveals ----------
place(bell(hz(88), vel=0.7), 0.07, gain=0.12, pan=-0.5)            # logo mark pop
place(bell(hz(95), vel=0.5), 0.19, gain=0.08, pan=-0.45)
for i, tt in enumerate((0.3, 0.37)):                                 # ear tips
    place(piano(hz(84 + i * 3), dur=0.4, vel=0.5), tt, gain=0.10, pan=-0.1 + 0.2 * i)
place(swish(0.95, 700, 3000, "arc"), 0.85, gain=0.018)               # tubing flowing
place(bell(hz(91), vel=0.6), 1.75, gain=0.10, pan=0.4)              # chest piece lands (metal)
place(bell(hz(98) * 1.003, vel=0.4), 1.77, gain=0.06, pan=0.45)
for i, m in enumerate((81, 84, 88, 91)):                             # daisy blooms
    place(piano(hz(m), dur=1.2, vel=0.5), 1.02 + i * 0.07, gain=0.09, pan=-0.4)
place(swish(1.1, 1200, 6000, "arc"), 1.85, gain=0.018, pan=0.35)    # ribbon unspools
for i in range(5):                                                   # butterflies
    place(flutter(0.7), 1.2 + i * 0.28, gain=0.016, pan=(-0.7, -0.6, 0.6, -0.5, 0.6)[i])
for i, m in enumerate((88, 93, 96)):                                 # header letters
    place(bell(hz(m), dur=1.4, vel=0.45), 2.32 + i * 0.12, gain=0.06, pan=0.3)
place(swish(0.8, 200, 1400, "arc"), 2.9, gain=0.025)                 # headline rise
place(boom(), 4.32, gain=0.8)                                        # BREAST slam
place(lp(boom(), 120), 4.32, gain=0.6)                               # sub layer
place(swish(0.35, 2000, 9000, "arc"), 4.25, gain=0.03)
place(boom(), 4.57, gain=0.45)                                       # HEALTH slam
for tt in (5.8, 8.9):                                                # satin shine sparkle
    for i, m in enumerate((96, 100, 103, 108)):
        place(bell(hz(m), dur=1.2, vel=0.35), tt + 0.15 + i * 0.09, gain=0.045, pan=-0.4 + 0.27 * i)
place(swish(2.0, 600, 5000, "arc"), 6.6, gain=0.016, pan=0.0)        # light sweep

# ---------- room + master ----------
ir_n = int(2.0 * SR)
irt = np.arange(ir_n) / SR
irL = np.random.default_rng(5).normal(0, 1, ir_n) * np.exp(-irt * 3.2)
irR = np.random.default_rng(6).normal(0, 1, ir_n) * np.exp(-irt * 3.2)
irL, irR = lp(irL, 6000), lp(irR, 6000)
irL /= np.sqrt((irL**2).sum()); irR /= np.sqrt((irR**2).sum())
wetL = fftconvolve(L, irL)[:N]
wetR = fftconvolve(R, irR)[:N]
outL = L + 0.28 * wetL
outR = R + 0.28 * wetR
fade = np.ones(N)
nf = int(1.2 * SR)
fade[-nf:] = np.linspace(1, 0, nf) ** 1.5
fade[: int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR))
out = np.stack([outL * fade, outR * fade], 1)
out = hp(out.T, 30).T
out /= np.abs(out).max() / 0.7
sf.write("audio/score_raw.wav", out.astype(np.float32), SR, subtype="FLOAT")
print("wrote audio/score_raw.wav", out.shape)
