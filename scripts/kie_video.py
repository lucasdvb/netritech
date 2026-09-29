#!/usr/bin/env python3
"""Generate video with KIE AI Gemini Omni Flash 1.1 (default text-to-video / image-to-video / video edit model), 1080p.

Usage:
  kie_video.py "prompt" [-o out.mp4] [-a 16:9] [-r 1080p] [-d 8] [-i image_url ...]
               [--first-frame URL] [--last-frame URL] [--video-url URL [--video-start S --video-end S]]
               [--audio-id ID ...] [--character-id ID ...] [--seed N]
Model: google/gemini-omni-flash-1-1
  duration    4, 6, 8 or 10 seconds
  aspect      16:9 or 9:16
  resolution  360p, 720p, 1080p (default), 4k
  -i          up to 7 public reference image URLs (subject / product / style / scene references)
  --video-url one public source video URL (extend or edit; uses 2 image slots)
Inputs must be public URLs; use scripts/kie_upload.py to host local files.
API key: KIE_AI_API_KEY env var, else read from .mcp.json (kie-ai server env).
"""
import argparse, json, sys, time, urllib.request

from kie_image import api_key, call

MODEL = "google/gemini-omni-flash-1-1"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prompt")
    p.add_argument("-o", "--out", default="kie_video.mp4")
    p.add_argument("-a", "--aspect", default="16:9", choices=["16:9", "9:16"])
    p.add_argument("-r", "--resolution", default="1080p", choices=["360p", "720p", "1080p", "4k"])
    p.add_argument("-d", "--duration", type=int, default=8, choices=[4, 6, 8, 10])
    p.add_argument("-i", "--input-url", action="append", default=[], help="reference image URL (max 7)")
    p.add_argument("--first-frame", help="image URL used as the first frame")
    p.add_argument("--last-frame", help="image URL used as the last frame")
    p.add_argument("--video-url", help="source video URL to extend or edit")
    p.add_argument("--video-start", type=float, help="start second of the source video segment")
    p.add_argument("--video-end", type=float, help="end second of the source video segment")
    p.add_argument("--audio-id", action="append", default=[], help="voice/audio id (max 3)")
    p.add_argument("--character-id", action="append", default=[], help="character id (max 3)")
    p.add_argument("--seed", type=int)
    a = p.parse_args()

    inp = {"prompt": a.prompt, "duration": a.duration, "resolution": a.resolution, "aspect_ratio": a.aspect}
    if a.input_url:
        inp["image_urls"] = a.input_url
    if a.first_frame:
        inp["first_frame_url"] = a.first_frame
    if a.last_frame:
        inp["last_frame_url"] = a.last_frame
    if a.video_url:
        v = {"url": a.video_url}
        if a.video_start is not None:
            v["start"] = a.video_start
        if a.video_end is not None:
            v["ends"] = a.video_end
        inp["video_list"] = [v]
    if a.audio_id:
        inp["audio_ids"] = a.audio_id
    if a.character_id:
        inp["character_ids"] = a.character_id
    if a.seed is not None:
        inp["seed"] = a.seed

    key = api_key()
    res = call("/createTask", key, {"model": MODEL, "input": inp})
    if res.get("code") != 200:
        sys.exit(f"createTask failed: {res}")
    task = res["data"]["taskId"]
    print("task", task, flush=True)

    while True:
        time.sleep(10)
        d = call(f"/recordInfo?taskId={task}", key)["data"]
        if d["state"] == "success":
            url = json.loads(d["resultJson"])["resultUrls"][0]
            print("url", url)
            try:
                urllib.request.urlretrieve(url, a.out)
                print("saved", a.out)
            except OSError as e:
                print(f"download failed ({e}); open the url above to fetch it", file=sys.stderr)
            return
        if d["state"] == "fail":
            sys.exit(f"failed: {d.get('failCode')} {d.get('failMsg')}")


if __name__ == "__main__":
    main()
