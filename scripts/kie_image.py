#!/usr/bin/env python3
"""Generate images with KIE AI GPT Image 2.5 Sunburst (default text-to-image / image-to-image model).

Usage:
  kie_image.py "prompt" [-o out.png] [-a 21:9] [-r 1K] [-i ref1.png_url ...] [--background opaque]
Passing -i (public image URLs, up to 16) switches to the image-to-image model.
API key: KIE_AI_API_KEY env var, else read from .mcp.json (kie-ai server env).
"""
import argparse, json, os, sys, time, urllib.request

BASE = "https://api.kie.ai/api/v1/jobs"
T2I = "gpt-image-2-5-sunburst-text-to-image"
I2I = "gpt-image-2-5-sunburst-image-to-image"


def api_key():
    key = os.environ.get("KIE_AI_API_KEY")
    if key:
        return key
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".mcp.json")
    with open(root) as f:
        return json.load(f)["mcpServers"]["kie-ai"]["env"]["KIE_AI_API_KEY"]


def call(path, key, body=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prompt")
    p.add_argument("-o", "--out", default="kie_image.png")
    p.add_argument("-a", "--aspect", default="auto")
    p.add_argument("-r", "--resolution", default="1K", choices=["1K", "2K", "4K"])
    p.add_argument("-i", "--input-url", action="append", default=[])
    p.add_argument("--background", default="opaque", choices=["transparent", "opaque", "auto"])
    a = p.parse_args()

    key = api_key()
    inp = {"prompt": a.prompt, "aspect_ratio": a.aspect, "resolution": a.resolution, "background": a.background}
    if a.input_url:
        inp["input_urls"] = a.input_url
    res = call("/createTask", key, {"model": I2I if a.input_url else T2I, "input": inp})
    if res.get("code") != 200:
        sys.exit(f"createTask failed: {res}")
    task = res["data"]["taskId"]
    print("task", task, flush=True)

    while True:
        time.sleep(5)
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
