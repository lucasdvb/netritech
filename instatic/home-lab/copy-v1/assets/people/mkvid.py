import subprocess,sys
SRC='media-in/v6.mp4'
def montage(segs,out,w=1280,h=720,fade=0.4):
    parts=[];inputs=[]
    fc=''
    for i,seg in enumerate(segs):
        a,b=seg[0],seg[1]; pre=seg[2] if len(seg)>2 else ''
        fc+=f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS,{pre}fps=30,scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},format=yuv420p[v{i}];"
    # xfade chain
    cur='v0';off=segs[0][1]-segs[0][0]-fade
    for i in range(1,len(segs)):
        nxt=f'x{i}'
        fc+=f"[{cur}][v{i}]xfade=transition=fade:duration={fade}:offset={off:.3f}[{nxt}];"
        cur=nxt;off+= (segs[i][1]-segs[i][0])-fade
    fc=fc.rstrip(';')
    cmd=['ffmpeg','-v','error','-y','-i',SRC,'-filter_complex',fc,'-map',f'[{cur}]','-an','-c:v','libx264','-preset','slow','-crf','27','-profile:v','high','-pix_fmt','yuv420p','-movflags','+faststart',out]
    subprocess.run(cmd,check=True)
# V1 training montage: trainer, listening, speaking, group smiling, trainer with pen, laughing
montage([(18.75,20.5),(28.5,31.1),(37.35,39.4),(20.7,22.5),(31.3,34.5),(39.5,41.75)],'media-out/spm-formation-montage.mp4')
# V2 the teams at work: open-plan office, note taking, listening
montage([(13.25,16.4),(26.6,28.3),(34.7,37.2,'crop=iw*0.84:ih*0.84:0:ih*0.08,')],'media-out/spm-equipes-plateau.mp4')
# V3 a team that stays: trainees in the room, a trainee arriving, the trainer by the screen
montage([(22.6,24.7),(9.35,11.0),(46.6,47.85)],'media-out/spm-equipe-salle.mp4')
