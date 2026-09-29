"""Image-to-image: upload the reference to KIE, then run gpt-image-2-5-flare-image-to-image. Usage: python3 gen_image_i2i.py REF.jpg
NOTE: the input field name for the reference (input_urls) is my best guess from KIE's other image-edit models; not verified."""
import base64, json, os, sys, time, urllib.request, urllib.error
KEY=os.environ["KIE_AI_API_KEY"]; HERE=os.path.dirname(os.path.abspath(__file__)); REF=sys.argv[1]
def post(url,body):
    r=urllib.request.Request(url,data=json.dumps(body).encode(),method="POST",headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    try: return json.load(urllib.request.urlopen(r,timeout=120))
    except urllib.error.HTTPError as e: return {"http_error":e.code,"body":e.read().decode()[:500]}
def get(p):
    r=urllib.request.Request("https://api.kie.ai/api/v1"+p,headers={"Authorization":f"Bearer {KEY}"}); return json.load(urllib.request.urlopen(r,timeout=60))
up=post("https://kieai.redpandaai.co/api/file-base64-upload",{"base64Data":"data:image/jpeg;base64,"+base64.b64encode(open(REF,"rb").read()).decode(),"uploadPath":"spm-hero/reference","fileName":"reference.jpg"})
print("upload:",json.dumps(up)[:300],flush=True); url=(up.get("data") or {}).get("downloadUrl") or sys.exit("upload failed")
prompt=open(os.path.join(HERE,"frame01_man_i2i_prompt.txt")).read().strip()
res=post("https://api.kie.ai/api/v1/jobs/createTask",{"model":"gpt-image-2-5-flare-image-to-image","input":{"prompt":prompt,"input_urls":[url],"aspect_ratio":"16:9","resolution":"2K"}})
print("submit:",json.dumps(res)[:500],flush=True); res.get("code")==200 or sys.exit("not accepted")
t=res["data"]["taskId"]
while True:
    time.sleep(10); d=get(f"/jobs/recordInfo?taskId={t}").get("data") or {}; print("state:",d.get("state"),d.get("failMsg") or "",flush=True)
    if d.get("state")=="success": break
    if d.get("state")=="fail": sys.exit("failed")
out=os.path.join(HERE,f"frame01-i2i-{t[:8]}.png"); urllib.request.urlretrieve(json.loads(d["resultJson"])["resultUrls"][0],out); print("saved",out)
