"""Submit the SPM hero prompt to KIE AI Veo 3.1, poll, and download the result.
Usage: KIE_AI_API_KEY=... python3 generate.py [veo3|veo3_fast]
"""
import json, os, sys, time, urllib.request

BASE = "https://api.kie.ai/api/v1"
KEY = os.environ["KIE_AI_API_KEY"]
MODEL = sys.argv[1] if len(sys.argv) > 1 else "veo3"
HERE = os.path.dirname(os.path.abspath(__file__))


def call(method, path, body=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


prompt = open(os.path.join(HERE, "prompt.txt")).read().strip()
res = call("POST", "/veo/generate", {
    "prompt": prompt,
    "model": MODEL,
    "aspect_ratio": "16:9",
    "generationType": "TEXT_2_VIDEO",
    "enableTranslation": False,
})
print("submit:", json.dumps(res)[:400])
task = res["data"]["taskId"]

while True:
    time.sleep(15)
    info = call("GET", f"/veo/record-info?taskId={task}")
    d = info.get("data") or {}
    flag = d.get("successFlag")
    print("poll:", flag, d.get("errorMessage") or "")
    if flag == 1:
        break
    if flag in (2, 3):
        sys.exit("generation failed: " + json.dumps(info))

resp = d.get("response") or {}
print("response:", json.dumps(resp)[:600])
urls = resp.get("resultUrls") or []
try:
    hd = call("GET", f"/veo/get-1080p-video?taskId={task}")
    print("1080p:", json.dumps(hd)[:400])
    u = (hd.get("data") or {}).get("resultUrl")
    if u:
        urls = [u]
except Exception as e:
    print("1080p lookup failed:", e)
if not urls:
    sys.exit("no result url")
out = os.path.join(HERE, f"spm-hero-{MODEL}-{task[:8]}.mp4")
urllib.request.urlretrieve(urls[0], out)
print("saved", out)
