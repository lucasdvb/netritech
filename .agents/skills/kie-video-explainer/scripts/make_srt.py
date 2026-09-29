#!/usr/bin/env python3
"""Build an .srt from the narration file of a kie-video-explainer run (local only, no network).

Input: narration.txt in the "Block N" / one-line format, e.g.
    Block 1
    For four and a half thousand years, the pyramids have stood against the desert.
    Block 2
    They rose along the Nile...

Timing is an estimate (the narrator's real pace varies): each line starts `--offset` seconds into its
10-second block and is spread over words / `--wps` seconds, capped so it ends `--tail` seconds before
the block ends. Long lines are split into cues of at most `--max-words` words, preferably at punctuation.

Usage:
  python3 .agents/skills/kie-video-explainer/scripts/make_srt.py narration.txt -o narration.srt
      [--block 10] [--offset 0.5] [--wps 2.5] [--tail 0.7] [--max-words 7]
"""
import argparse, re, sys


def parse(text):
    blocks, cur = {}, None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.fullmatch(r"(?i)block\s+(\d+)\s*:?", line)
        if m:
            cur = int(m.group(1))
            blocks[cur] = []
        elif cur is not None:
            blocks[cur].append(line)
    return {n: " ".join(v).strip() for n, v in blocks.items() if v}


def split_cues(words, max_words):
    """Split a word list into cues of <= max_words, breaking after punctuation when possible."""
    cues, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        remaining = len(words) - i - 1
        at_punct = w[-1] in ",;:.!?"
        if len(cur) >= max_words or (at_punct and len(cur) >= 3 and remaining >= 3):
            cues.append(cur)
            cur = []
    if cur:
        if cues and len(cur) < 3:
            cues[-1].extend(cur)
        else:
            cues.append(cur)
    return cues


def ts(t):
    t = max(t, 0.0)
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("narration")
    p.add_argument("-o", "--out", default="narration.srt")
    p.add_argument("--block", type=float, default=10.0, help="block length in seconds")
    p.add_argument("--offset", type=float, default=0.5, help="seconds before the voice starts in each block")
    p.add_argument("--wps", type=float, default=2.5, help="words per second (use about 2.2 for French/Spanish/German)")
    p.add_argument("--tail", type=float, default=0.7, help="silence kept at the end of each block")
    p.add_argument("--max-words", type=int, default=7)
    a = p.parse_args()

    blocks = parse(open(a.narration, encoding="utf-8").read())
    if not blocks:
        sys.exit("no 'Block N' lines found")

    out, idx = [], 1
    for n in sorted(blocks):
        words = blocks[n].split()
        start = (n - 1) * a.block + a.offset
        dur = min(len(words) / a.wps, a.block - a.offset - a.tail)
        per_word = dur / len(words)
        pos = 0
        for cue in split_cues(words, a.max_words):
            t0 = start + pos * per_word
            t1 = start + (pos + len(cue)) * per_word
            out.append(f"{idx}\n{ts(t0)} --> {ts(t1)}\n{' '.join(cue)}\n")
            idx += 1
            pos += len(cue)

    with open(a.out, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print(f"wrote {a.out}: {idx - 1} cues for {len(blocks)} blocks")


if __name__ == "__main__":
    main()
