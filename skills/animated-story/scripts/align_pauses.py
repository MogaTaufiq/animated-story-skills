"""Timing narasi tanpa transkrip: kalimat naskah dicocokkan ke jeda di audio TTS.

Teksnya sudah pasti (NARASI_TTS.txt), jadi yang dicari hanya kapan tiap kalimat mulai dan selesai. Jeda dideteksi dari
audio; program dinamis memilih satu jeda untuk setiap batas kalimat, sehingga durasi bicara tiap kalimat paling cocok
dengan jumlah suku katanya, jumlah jeda di dalamnya cocok dengan jumlah koma, dan batas paragraf jatuh di jeda yang
panjang. Hasil: narasi.wav (TTS asli + hening PAD detik di tiap batas bab) dan narasi.srt (teks naskah persis, waktu
sesuai narasi.wav).

  uv run --no-project --with numpy --with scipy python3 audio/align_pauses.py <tts.wav> <NARASI_TTS.txt> <narasi.srt> <narasi.wav>
"""
import re, sys, wave
import numpy as np
from scipy import signal

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import dsp

HOP = 0.02
PAD = 1.0  # detik hening tambahan di tiap batas bab


def sentences(path):
    """[(teks, suku_kata, bab, jenis_batas_sesudahnya)]; jenis: 0 kalimat, 1 paragraf, 2 bab"""
    out, chap = [], -1
    for line in open(path, encoding="utf-8").read().splitlines():
        line = line.strip()
        if line.startswith("##"):
            chap += 1
            if out:
                out[-1][3] = 2
            continue
        if not line:
            continue
        parts = [p for p in re.split(r'(?<=[.!?])\s+|(?<=[.!?]")\s+', line) if p]
        for p in parts:
            out.append([p, syllables(p), chap, 0, len(re.findall(r"[,:;]|\.\.\.", p))])
        out[-1][3] = max(out[-1][3], 1)
    return out


def syllables(text):
    n = 0
    for w in re.findall(r"[a-z]+", text.lower()):
        w = re.sub(r"(ai|au|oi)$", "a", w)  # diftong di akhir kata = satu suku
        n += max(1, len(re.findall(r"[aiueo]", w)))
    return n


def gaps_of(x, min_gap=0.15):
    k = dsp.kfilt(x)
    n = int(HOP * 48000)
    db = 10 * np.log10((k[: len(k) // n * n].reshape(-1, n) ** 2).mean(1) + 1e-12)
    v = db > max(np.percentile(db, 5) + 25, db.max() - 50)
    on, off = np.argmax(v) * HOP, (len(v) - np.argmax(v[::-1])) * HOP
    g, i = [], 0
    while i < len(v):
        if v[i]:
            i += 1
            continue
        j = i
        while j < len(v) and not v[j]:
            j += 1
        if (j - i) * HOP >= min_gap and i > 0 and j < len(v):
            g.append((i * HOP, j * HOP))
        i = j
    return on, off, g


def align(S, on, off, gaps, rate, tol=0.22, need=None):
    gs = np.array([on] + [a for a, _ in gaps] + [off])
    ge = np.array([on] + [b for _, b in gaps] + [off])
    L = ge - gs
    C = np.concatenate([[0], np.cumsum(L)])  # C[m] = jumlah panjang jeda 0..m-1
    E = np.concatenate([[0], np.cumsum(np.clip(L - 0.75, 0, None))])  # kelebihan jeda > 0,75 s
    P = np.concatenate([[0], np.cumsum(L >= 0.3)])  # jumlah jeda jelas (koma biasanya jadi jeda)
    G = len(gs)
    need = need or {0: 0.40, 1: 0.60, 2: 0.80}  # jeda minimum yang wajar per jenis batas
    INF = 1e18
    dp = np.full((len(S), G), INF)
    back = np.zeros((len(S), G), int)
    j = np.arange(G)
    for i, (_, syl, _, kind, commas) in enumerate(S):
        pred = syl / rate
        last = i == len(S) - 1
        ks = [G - 1] if last else range(1, G - 1)
        prev = np.zeros(G) if i == 0 else dp[i - 1]
        if i == 0:
            prev = np.where(j == 0, 0.0, INF)
        for k in ks:
            jj = j[:k]
            d = gs[k] - ge[jj] - (C[k] - C[jj + 1])
            ok = d > 0.15
            seg = np.where(ok, (np.log(np.maximum(d, 1e-3) / pred) / tol) ** 2, INF)
            # jeda panjang di dalam satu kalimat tidak wajar
            inner = (E[k] - E[jj + 1]) / 0.1
            seg = seg + inner ** 2 + 0.5 * (P[k] - P[jj + 1] - commas) ** 2
            tot = prev[:k] + seg
            b = int(np.argmin(tot))
            bc = 0.0 if last else (max(0.0, need[kind] - L[k]) / 0.08) ** 2
            dp[i, k] = tot[b] + bc
            back[i, k] = b
    path, k = [], G - 1
    for i in range(len(S) - 1, -1, -1):
        path.append(k)
        k = back[i, k]
    path = path[::-1]
    spans, prevk = [], 0
    for k in path:
        spans.append((ge[prevk], gs[k], gs[k] - ge[prevk] - (C[k] - C[prevk + 1])))
        prevk = k
    return spans, [L[k] for k in path[:-1]]


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main(wav, txt, out, out_wav):
    x, sr = dsp.read_wav(wav)
    sr0 = sr
    x = signal.resample_poly(x.mean(0), 48000, sr) if sr != 48000 else x.mean(0)
    S = sentences(txt)
    on, off, gaps = gaps_of(x)
    speech = (off - on) - sum(b - a for a, b in gaps)
    rate = sum(s[1] for s in S) / speech
    spans, blen = align(S, on, off, gaps, rate)
    # putaran kedua: tempo per bab dari hasil pertama (TTS melambat di bab akhir)
    for _ in range(2):
        per = {}
        for s, (_, _, d) in zip(S, spans):
            per.setdefault(s[2], [0, 0.0])
            per[s[2]][0] += s[1]
            per[s[2]][1] += d
        S2 = [[t, syl * rate / (per[c][0] / per[c][1]), c, kind, cm] for t, syl, c, kind, cm in S]
        spans, blen = align(S2, on, off, gaps, rate)
    # hening tambahan di tiap batas bab (ruang crossfade dan SFX); suara sendiri tidak disentuh
    cuts = [round((spans[i][1] + spans[i + 1][0]) / 2 * sr0) for i in range(len(S) - 1) if S[i][3] == 2]
    with wave.open(wav, "rb") as w:
        prm, raw = w.getparams(), w.readframes(w.getnframes())
    fb = prm.sampwidth * prm.nchannels
    pad = bytes(round(PAD * sr0) * fb)
    edges = [0] + cuts + [prm.nframes]
    with wave.open(out_wav, "wb") as w:
        w.setparams(prm)
        w.writeframes(pad.join(raw[a * fb: b * fb] for a, b in zip(edges, edges[1:])))
    shift = lambda t: t + PAD * sum(t * sr0 > c for c in cuts)
    with open(out, "w", encoding="utf-8") as fh:
        for i, ((t, *_), (a, b, _)) in enumerate(zip(S, spans), 1):
            fh.write(f"{i}\n{srt_time(shift(a))} --> {srt_time(shift(b))}\n{t}\n\n")
    print(f"{out_wav}: {(prm.nframes + len(cuts) * round(PAD * sr0)) / sr0:.2f} s ({len(cuts)} batas bab, +{PAD} s tiap batas)")
    # laporan
    ratio = np.array([d / (s[1] / (per[s[2]][0] / per[s[2]][1])) for s, (_, _, d) in zip(S, spans)])
    kinds = np.array([s[3] for s in S[:-1]])
    blen = np.array(blen)
    print(f"{len(S)} kalimat, {len(gaps)} jeda terdeteksi, tempo rata-rata {rate:.2f} suku kata/s saat bicara")
    print("tempo per bab (suku kata/s):", {c: round(v[0] / v[1], 2) for c, v in sorted(per.items())})
    print(f"rasio durasi/perkiraan: p5 {np.percentile(ratio,5):.2f}  p50 {np.median(ratio):.2f}  p95 {np.percentile(ratio,95):.2f}")
    for k, nm in ((0, "kalimat"), (1, "paragraf"), (2, "bab")):
        v = blen[kinds == k]
        print(f"jeda di batas {nm}: n={len(v)}  min {v.min():.2f}  p50 {np.median(v):.2f} s")
    print("awal bab:", [srt_time(shift(spans[i][0]))[3:8] for i in range(len(S)) if i == 0 or S[i - 1][3] == 2])
    worst = np.argsort(np.abs(np.log(ratio)))[::-1][:6]
    for i in worst:
        print(f"  paling meleset x{ratio[i]:.2f}  {srt_time(shift(spans[i][0]))[3:11]}  {S[i][0][:60]}")


if __name__ == "__main__":
    main(*sys.argv[1:5])
