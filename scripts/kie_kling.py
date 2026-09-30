#!/usr/bin/env python3
"""Submit a kling-3.0-omni image-to-video job to KIE and poll to completion."""
import json, sys, time, urllib.request
from kie_image import api_key, call

FIRST="https://tempfile.redpandaai.co/kieai/11598018/images/user-uploads/k_first.jpg"
LAST="https://tempfile.redpandaai.co/kieai/11598018/images/user-uploads/k_last.png"
prompt=open("media/hero-scroll-video/k_prompt.txt").read().strip()
neg=open("media/hero-scroll-video/k_negative.txt").read().strip()
key=api_key()
inp={
  "prompt": prompt,
  "negative_prompt": neg,
  "image_urls": [FIRST],
  "image_tail_url": LAST,
  "imageTailUrl": LAST,
  "duration": "10",
  "aspect_ratio": "auto",
  "resolution": "1080p",
  "sound": False,
}
res=call("/createTask", key, {"model":"kling-3.0-omni/image-to-video","input":inp})
print("createTask:", json.dumps(res)[:300], flush=True)
if res.get("code")!=200:
    sys.exit(1)
task=res["data"]["taskId"]
print("task", task, flush=True)
while True:
    time.sleep(12)
    d=call(f"/recordInfo?taskId={task}", key)["data"]
    st=d["state"]
    if st=="success":
        url=json.loads(d["resultJson"])["resultUrls"][0]
        print("url", url, flush=True)
        try:
            urllib.request.urlretrieve(url, "media/hero-scroll-video/hero-kling.mp4")
            print("saved media/hero-scroll-video/hero-kling.mp4")
        except OSError as e:
            print(f"download failed ({e}); url above")
        break
    if st=="fail":
        print("failed:", d.get("failCode"), d.get("failMsg"), "credits", d.get("creditsConsumed"))
        break
