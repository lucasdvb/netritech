import json, os, sys, time, urllib.request, concurrent.futures as cf
BASE="https://api.kie.ai/api/v1"; KEY=os.environ["KIE_AI_API_KEY"]; HERE=os.path.dirname(os.path.abspath(__file__))
def call(m,p,b=None):
    r=urllib.request.Request(BASE+p,data=json.dumps(b).encode() if b else None,method=m,headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"})
    return json.load(urllib.request.urlopen(r,timeout=60))
prompt=open(os.path.join(HERE,"prompt_v2.txt")).read().strip()
def run(seed):
    t=call("POST","/veo/generate",{"prompt":prompt,"model":"veo3_fast","aspect_ratio":"16:9","generationType":"TEXT_2_VIDEO","enableTranslation":False,"seeds":seed})["data"]["taskId"]
    while True:
        time.sleep(15); d=call("GET",f"/veo/record-info?taskId={t}").get("data") or {}
        if d.get("successFlag")==1: break
        if d.get("successFlag") in (2,3): return seed,t,None
    out=os.path.join(HERE,f"v2-fast-{seed}.mp4"); urllib.request.urlretrieve(d["response"]["resultUrls"][0],out); return seed,t,out
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(run,[11111,22222,33333]): print(r,flush=True)
