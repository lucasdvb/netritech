"""Veo 3.1 Quality via KIE: first+last frame, prompt verbatim from prompt_final.txt, then 1080p upscale + strip audio."""
import base64, json, os, sys, time, urllib.request, urllib.error, subprocess
KEY=os.environ["KIE_AI_API_KEY"]; HERE=os.path.dirname(os.path.abspath(__file__))
FF="/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
def req(m,url,b=None):
    r=urllib.request.Request(url,data=json.dumps(b).encode() if b is not None else None,method=m,headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    try: return json.load(urllib.request.urlopen(r,timeout=120))
    except urllib.error.HTTPError as e: return {"http_error":e.code,"body":e.read().decode()[:600]}
def up(p,name):
    o=req("POST","https://kieai.redpandaai.co/api/file-base64-upload",{"base64Data":"data:image/jpeg;base64,"+base64.b64encode(open(p,"rb").read()).decode(),"uploadPath":"spm-hero/final","fileName":name})
    u=(o.get("data") or {}).get("downloadUrl"); print("upload",name,bool(u),flush=True); return u or sys.exit("upload failed: "+json.dumps(o)[:300])
first=up(os.path.join(HERE,"first_1080.jpg"),"first.jpg"); last=up(os.path.join(HERE,"last_1080.jpg"),"last.jpg")
prompt=open(os.path.join(HERE,"prompt_final.txt")).read().strip()
B="https://api.kie.ai/api/v1"
res=req("POST",B+"/veo/generate",{"prompt":prompt,"imageUrls":[first,last],"model":"veo3","aspect_ratio":"16:9","generationType":"FIRST_AND_LAST_FRAMES_2_VIDEO","enableTranslation":False})
print("submit:",json.dumps(res)[:400],flush=True); res.get("code")==200 or sys.exit("not accepted")
t=res["data"]["taskId"]
while True:
    time.sleep(15); d=req("GET",B+f"/veo/record-info?taskId={t}").get("data") or {}
    print("poll:",d.get("successFlag"),d.get("errorMessage") or "",flush=True)
    if d.get("successFlag")==1: break
    if d.get("successFlag") in (2,3): sys.exit("failed: "+json.dumps(d)[:500])
print("resolution:",d["response"].get("resolution"),flush=True)
url=None
for _ in range(40):
    h=req("GET",B+f"/veo/get-1080p-video?taskId={t}"); url=(h.get("data") or {}).get("resultUrl")
    if url: break
    time.sleep(15)
url=url or d["response"]["resultUrls"][0]
raw=os.path.join(HERE,f"raw-{t[:8]}.mp4"); urllib.request.urlretrieve(url,raw)
out=os.path.join(HERE,f"spm-hero-final-{t[:8]}-1080p-silent.mp4")
subprocess.run([FF,"-y","-v","error","-i",raw,"-an","-c:v","copy",out],check=True); os.remove(raw); print("saved",out,flush=True)
