"""Submit ONE image job to KIE (market API). Usage: python3 gen_image.py   -> prints raw response, polls, downloads."""
import json, os, sys, time, urllib.request, urllib.error
BASE="https://api.kie.ai/api/v1"; KEY=os.environ["KIE_AI_API_KEY"]; HERE=os.path.dirname(os.path.abspath(__file__))
MODEL="gpt-image-2-5-flare-text-to-image"
def call(m,p,b=None):
    r=urllib.request.Request(BASE+p,data=json.dumps(b).encode() if b is not None else None,method=m,headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    try: return json.load(urllib.request.urlopen(r,timeout=60))
    except urllib.error.HTTPError as e: return {"http_error":e.code,"body":e.read().decode()[:600]}
prompt=open(os.path.join(HERE,"frame01_man_prompt.txt")).read().strip()
res=call("POST","/jobs/createTask",{"model":MODEL,"input":{"prompt":prompt,"aspect_ratio":"16:9","resolution":"2K"}})
print("submit:",json.dumps(res)[:500],flush=True)
if res.get("code")!=200: sys.exit("not accepted")
t=res["data"]["taskId"]; print("TASK",t,flush=True)
while True:
    time.sleep(10); d=call("GET",f"/jobs/recordInfo?taskId={t}").get("data") or {}
    print("state:",d.get("state"),d.get("failMsg") or "",flush=True)
    if d.get("state")=="success": break
    if d.get("state")=="fail": sys.exit("failed: "+json.dumps(d)[:500])
urls=json.loads(d["resultJson"])["resultUrls"]; print("urls:",urls,flush=True)
out=os.path.join(HERE,f"frame01-man-{t[:8]}.png"); urllib.request.urlretrieve(urls[0],out); print("saved",out)
