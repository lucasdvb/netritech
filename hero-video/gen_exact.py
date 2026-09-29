"""One Veo 3.1 Quality generation from prompt_v3_exact.txt (verbatim), then the 1080p upscale."""
import json, os, time, urllib.request
BASE="https://api.kie.ai/api/v1"; KEY=os.environ["KIE_AI_API_KEY"]; HERE=os.path.dirname(os.path.abspath(__file__))
def call(m,p,b=None):
    r=urllib.request.Request(BASE+p,data=json.dumps(b).encode() if b is not None else None,method=m,headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    return json.load(urllib.request.urlopen(r,timeout=60))
prompt=open(os.path.join(HERE,"prompt_v3_exact.txt")).read().strip()
res=call("POST","/veo/generate",{"prompt":prompt,"model":"veo3","aspect_ratio":"16:9","generationType":"TEXT_2_VIDEO","enableTranslation":False})
print("submit:",json.dumps(res)[:300],flush=True)
if res.get("code")!=200: raise SystemExit("rejected")
t=res["data"]["taskId"]
while True:
    time.sleep(15); d=call("GET",f"/veo/record-info?taskId={t}").get("data") or {}
    print("poll:",d.get("successFlag"),d.get("errorMessage") or "",flush=True)
    if d.get("successFlag")==1: break
    if d.get("successFlag") in (2,3): raise SystemExit("failed: "+json.dumps(d)[:500])
print("resolution:",d["response"].get("resolution"),flush=True)
url=None
for _ in range(40):
    try:
        h=call("GET",f"/veo/get-1080p-video?taskId={t}"); url=(h.get("data") or {}).get("resultUrl")
    except Exception as e: print("1080p wait:",e)
    if url: break
    time.sleep(15)
url=url or d["response"]["resultUrls"][0]
out=os.path.join(HERE,f"v3-exact-quality-{t[:8]}.mp4"); urllib.request.urlretrieve(url,out); print("saved",out,flush=True)
