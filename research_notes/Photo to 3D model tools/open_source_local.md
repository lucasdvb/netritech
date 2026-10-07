# Open-source single-image-to-3D on a CPU-only cloud container (as of Oct 2026)

Target box: 4 vCPU, 15 GB RAM, no GPU, Python 3.13, ~30 GB free disk, outbound HTTPS through an allowlisting proxy.

Note on method: research only. Nothing was installed or run. Facts come from READMEs, LICENSE files and requirements files fetched from raw.githubusercontent.com, GitHub issue pages, and web search. I also ran a few HTTP reachability checks (status codes only) from this exact container, because what the proxy blocks decides the answer more than model architecture does. No model was executed.

## Q0. What can this container actually reach? (decisive constraint)

### Takeaway
From this container, **Hugging Face is blocked** (and so are hf-mirror.com, ModelScope and download.pytorch.org). **PyPI, raw.githubusercontent.com and GitHub release downloads work.** Every learned image-to-3D model below (TripoSR, SF3D, SPAR3D, TRELLIS, Hunyuan3D, TripoSG, InstantMesh and the rest) gets its weights from Hugging Face, so none of them can download weights here without a manual side-load. Depth-estimation weights (Depth Anything V2 ONNX, MiDaS) and rembg's ONNX models are on GitHub Releases and can be downloaded.

### Cited findings (direct probes from this container, 2026-10-07)
- `https://huggingface.co/api/models/stabilityai/TripoSR`: proxy refused the CONNECT tunnel with 403. `cdn-lfs.huggingface.co`, `hf-mirror.com` and `modelscope.cn` were also refused with 403. (curl probe from this session)
- `https://download.pytorch.org/whl/cpu/`: refused with 403. The CPU-only PyTorch wheel index can't be used. (curl probe)
- `https://pypi.org/simple/...`: 200. The PyPI `torch` 2.14.1 wheel for cp313 manylinux x86_64 is about 528 MB, and on Linux it pulls in CUDA dependencies (`nvidia-cudnn-cu13`, `nvidia-nccl-cu13`, `nvidia-cusparselt-cu13`, `nvidia-nvshmem-cu13` and others). The default install is therefore several GB even though it would run on CPU. (PyPI JSON API probe: https://pypi.org/pypi/torch/json)
- `https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx`: 200, 176 MB. (curl probe)
- `https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits.onnx`: 200, 99 MB. (curl probe)
- `https://github.com/isl-org/MiDaS/releases/download/v2_1/midas_v21_small_256.pt` (86 MB) and `.../v3_1/dpt_swin2_tiny_256.pt` (172 MB): 200. (curl probe)
- `registry.npmjs.org/three`: 200. `cdn.jsdelivr.net`: refused with 403 from inside the container. (curl probe)
- Host: 4 cores, 15 GB RAM, about 30 GB free on `/`, Python 3.13.16. (`nproc`, `free`, `df`, `python3 --version`)

### Inferences
- To use any HF-hosted 3D model, the user would have to get the weights some other way (download on another machine and upload, or get huggingface.co added to the environment's network allowlist). The Claude Code environment network settings can allowlist hosts. For gated models (SF3D, SPAR3D), an HF token with an accepted license is also needed.
- Python 3.13 is a real friction point. SF3D and SPAR3D pin `numpy==1.26.4`, and numpy 1.26 ships no cp313 wheels. TripoSR pins `transformers==4.35.0`, whose old `tokenizers` likely has no cp313 wheel either. Expect to relax pins or use a Python 3.10–3.12 venv (e.g. via `uv`, if PyPI-hosted Python builds are reachable; not tested).

### Gaps
- I didn't test whether GitHub LFS or `objects.githubusercontent.com` serve large files beyond the release URLs above, or whether `uv python install` works through the proxy.

## Q1. TripoSR (VAST-AI / Stability AI): CPU support and speed

### Takeaway
TripoSR is MIT-licensed and has a CPU path: torchmcubes falls back to its CPU implementation, and the whole model is plain PyTorch. It is the most CPU-friendly of the "real" feed-forward models, and community ONNX ports aimed at CPU exist. Its weights are about 1.7 GB fp32, hosted only on Hugging Face. I found no published CPU timing. Quality is draft-level: smooth geometry with vertex colours or an optional baked texture.

### Cited findings
- License MIT; about 6 GB VRAM for a single image with default settings; under 0.5 s on an A100; outputs a mesh with vertex colours, or a texture via `--bake-texture` with `--texture-resolution`. — [TripoSR README](https://github.com/VAST-AI-Research/TripoSR)
- The README documents the warning "torchmcubes was not compiled with CUDA support, use CPU version instead", so the CPU marching-cubes path is a known, working fallback. — [TripoSR README (raw)](https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/main/README.md); related issues [#83](https://github.com/VAST-AI-Research/TripoSR/issues/83), [#66](https://github.com/VAST-AI-Research/TripoSR/issues/66)
- Requirements: `git+https://github.com/tatsy/torchmcubes.git` (built from source), `transformers==4.35.0`, `trimesh`, `rembg`, `xatlas`, `moderngl` (texture baking), `gradio`. No xformers, nvdiffrast or kaolin. — [TripoSR requirements.txt](https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/main/requirements.txt)
- Open issues as of 2026: #155 "Add Apple MPS support with CPU marching cubes fallback" (Aug 2026), #153 "Add Intel Arc (XPU) support and PyMCubes marching-cubes fallback" (Jul 2026), #156 "CPU/CUDA device mismatch in bake_texture.py" (Sep 2026). The repo still gets non-CUDA patches, but the texture baking path has a reported device bug. — [TripoSR issues, query "cpu"](https://github.com/VAST-AI-Research/TripoSR/issues?q=cpu)
- Vendor blog: TripoSR can run on CPU but "much slower"; recommended for testing only. — [Tripo3D blog: How to install TripoSR (2026)](https://www.tripo3d.ai/blog/how-to-install-triposr)
- ONNX ports exist on Hugging Face, e.g. `fernandotonon/QtMeshEditor-triposr-onnx` (ONNX Runtime + native marching cubes), `brodatech/triposr-onnx`, `cgb/triposr-onnx-webgpu`. Per the search snippets: fp32 encoder about 1.6–1.7 GB (512x512 input to a [1,3,40,64,64] triplane), an int8 encoder tier of about 430 MB with slight quality loss, and a tiny int8 MLP decoder (about 67 KB). — [QtMeshEditor TripoSR ONNX](https://huggingface.co/fernandotonon/QtMeshEditor-triposr-onnx), [brodatech/triposr-onnx](https://huggingface.co/brodatech/triposr-onnx), [cgb/triposr-onnx-webgpu](https://huggingface.co/cgb/triposr-onnx-webgpu). These pages could not be opened directly (HF unreachable from the fetch tool), so the details come from search snippets only.

### Inferences
- TripoSR has a large ViT (DINO) image encoder (about 0.4B parameters), then a triplane decoder queried on a marching-cubes grid (default resolution 256). On 4 vCPUs, my estimate is tens of seconds to a few minutes per image, with peak RAM of about 4–8 GB. That should fit in 15 GB. Lowering `--mc-resolution` and `--chunk-size` reduces time and memory. This is an estimate, not a measurement.
- The ONNX int8 port (onnxruntime from PyPI, no torch needed) would be the lightest install, but its weights are on HF too.

### Gaps
- No public, reliable CPU benchmark (seconds/RAM) for TripoSR found. Search results gave only qualitative "slower" statements.
- Couldn't verify the licenses of the third-party ONNX ports (they derive from MIT weights, so MIT is likely, but unverified).

## Q2. Stable Fast 3D (SF3D) and SPAR3D (Stability AI): CPU/MPS and license

### Takeaway
Both officially support CPU: they fall back to it automatically when no GPU is found, or you force it with `SF3D_USE_CPU=1` / `SPAR3D_USE_CPU=1`. Both have experimental MPS support. Their custom texture-baker extension compiles as a plain C++/OpenMP extension when CUDA is absent. Both use the **Stability AI Community License**: free commercial use under US$1M annual revenue, otherwise an enterprise license is needed. Weights are **gated** on HF. SF3D gives the best output of the CPU-capable options: a UV-unwrapped, textured GLB with material parameters.

### Cited findings
- SF3D README: "CPU backend will automatically be used if no GPU is detected"; `SF3D_USE_CPU=1` forces it. MPS is experimental, needs `PYTORCH_ENABLE_MPS_FALLBACK=1`, and "We recommend running the CPU version if your system has less than 32GB of unified memory". About 6 GB VRAM by default; outputs GLB. — [SF3D README](https://github.com/Stability-AI/stable-fast-3d) / [raw](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/README.md)
- SPAR3D README: "CPU backend will automatically be used if no GPU is detected in your system. **Note that this will be really slow.**" Also `SPAR3D_USE_CPU=1` and `--device=cpu`. 10.5 GB VRAM by default, about 7 GB with `SPAR3D_LOW_VRAM=1`; MPS experimental on macOS 15.2+. — [SPAR3D README (raw)](https://raw.githubusercontent.com/Stability-AI/stable-point-aware-3d/main/README.md)
- The SF3D `texture_baker/setup.py` uses `CUDAExtension` only if CUDA is available, otherwise `CppExtension` with `-fopenmp` (Metal on MPS). It compiles on a CPU-only Linux box with a C++ toolchain. — [texture_baker/setup.py](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/texture_baker/setup.py)
- SF3D requirements: `numpy==1.26.4`, `transformers==4.42.3`, `open_clip_torch`, `gpytoolbox`, `pynanoinstantmeshes`, `rembg[gpu]` (on non-mac), plus local `./texture_baker/` and `./uv_unwrapper/` C++ extensions. — [SF3D requirements.txt](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/requirements.txt)
- SPAR3D requirements add `git+https://github.com/openai/CLIP.git`, `git+https://github.com/SunzeY/AlphaCLIP.git`, `transparent-background`, `loralib`. SPAR3D also runs a point-diffusion stage before the reconstruction. — [SPAR3D requirements.txt](https://raw.githubusercontent.com/Stability-AI/stable-point-aware-3d/main/requirements.txt)
- LICENSE files of both repos: "STABILITY AI COMMUNITY LICENSE AGREEMENT, Last Updated: July 5, 2024". — [SF3D LICENSE.md](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/LICENSE.md), [SPAR3D LICENSE.md](https://raw.githubusercontent.com/Stability-AI/stable-point-aware-3d/main/LICENSE.md). Note: a WebFetch summary of the SF3D GitHub page wrongly said "MIT". The actual LICENSE file is the Stability Community License.
- Community License terms: free research, non-commercial and commercial use for individuals or organisations under US$1M annual revenue; above that, an enterprise license from Stability is required. SF3D is covered by it. — [Stability AI license page](https://stability.ai/license), [Stability AI license update](https://stability.ai/news/license-update)
- The model is gated on HF and needs an access request plus a read token. — [SF3D README](https://github.com/Stability-AI/stable-fast-3d), [HF model page](https://huggingface.co/stabilityai/stable-fast-3d)

### Inferences
- SF3D on CPU: the architecture is TripoSR-like (a DINOv2 encoder and a triplane transformer, about 1B parameters total per the paper; not re-verified here), plus UV unwrapping and texture baking on CPU. Expect roughly 1–5 minutes per image and about 6–10 GB RAM on 4 vCPUs. This is an unmeasured estimate.
- `rembg[gpu]` in requirements would pull `onnxruntime-gpu`. Swap it for `rembg[cpu]`. The `numpy==1.26.4` pin fails on Python 3.13, so use Python ≤3.12.
- SPAR3D on CPU is "really slow" by Stability's own wording, and it uses more memory (10.5 GB VRAM baseline). It is borderline at 15 GB RAM.

### Gaps
- No public measured CPU timings for SF3D or SPAR3D were found.

## Q3. Which of the other big repos are CUDA-only?

### Takeaway
Almost all of them. TRELLIS (16 GB+ NVIDIA, with spconv/kaolin/nvdiffrast/flash-attn), TRELLIS.2 (24 GB+, Linux, CUDA 12.4, with CuMesh/FlexGEMM/O-Voxel), Hunyuan3D-2.1 (10 GB shape / 29 GB total), Step1X-3D (27 GB), Direct3D-S2 (10–24 GB, custom sparse attention), CRM / InstantMesh / LGM / Era3D / Wonder3D / Unique3D (xformers, nvdiffrast, kaolin, tiny-cuda-nn) all assume CUDA. **Hunyuan3D-2 / 2mini shape-only** is the one partial exception: plain PyTorch shape DiT, and the README claims macOS support. Its texture stage needs compiled rasterizers, and its license excludes the EU, UK and South Korea. The only demonstrated non-CUDA port of a top model is **trellis-mac** (TRELLIS.2 on Apple MPS), which needs about 18 GB peak and is not a CPU port.

### Cited findings (per repo)

| Repo | License (commercial?) | Output | GPU need | CPU status | Install pain |
|---|---|---|---|---|---|
| [microsoft/TRELLIS](https://github.com/microsoft/TRELLIS) | MIT (submodules diffoctreerast, FlexiCubes have own licenses): yes | GLB textured mesh, 3D Gaussians (PLY), radiance field | NVIDIA ≥16 GB, tested A100/A6000 | Not supported | flash-attn/xformers, spconv, nvdiffrast, kaolin, diffoctreerast, mip-splatting; CUDA 11.8/12.2. Image model 1.2B params |
| [microsoft/TRELLIS.2](https://github.com/microsoft/TRELLIS.2) | MIT: yes | GLB with PBR | NVIDIA ≥24 GB, Linux, CUDA 12.4; H100: 3 s @512³, 17 s @1024³, 60 s @1536³ | Not supported officially | flash-attn, nvdiffrast, nvdiffrec, CuMesh, O-Voxel, FlexGEMM. 4B params |
| trellis-mac (community port of TRELLIS.2) | inherits MIT | GLB | Apple MPS; ~18 GB peak, ~3.5 min on M4 Pro; 24 GB unified memory enough | Replaces CUDA libs with pure PyTorch (SDPA, gather-scatter, fast_simplification) plus Metal: [lilting.ch writeup](https://lilting.ch/en/articles/trellis2-apple-silicon-mps-cuda-free), [M1 Max test](https://lilting.ch/en/articles/trellis2-m1-max-hands-on) | Mac only; still needs HF login |
| [Tencent-Hunyuan/Hunyuan3D-2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) (incl. 2mini, 2mv, Turbo, FlashVDM) | Tencent Hunyuan 3D 2.0 Community License: commercial allowed, but **not in the EU, UK or South Korea**, and >1M MAU needs a separate license ([LICENSE](https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/LICENSE)) | trimesh to GLB/OBJ; Paint model adds texture | 6 GB shape; 16 GB shape+texture; `--low_vram_mode` | README says "supports macOS, Windows, Linux"; no explicit CPU instructions | Shape: pip only. Texture: compile `custom_rasterizer` and `differentiable_renderer`. DiT 1.1B, mini 0.6B, Paint 1.3B |
| [Tencent-Hunyuan/Hunyuan3D-2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1) | Tencent community license (same family; territory terms not re-verified for 2.1) | GLB with PBR textures | 10 GB shape, 21 GB texture, 29 GB total | Pinned to PyTorch 2.5.1+cu124 | custom_rasterizer, DifferentiableRenderer (compile script), Real-ESRGAN. Shape 3.3B, Paint 2B |
| [Tencent-Hunyuan/Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni) | LICENSE file not at repo root (unverified) | shape with control inputs (point, voxel, bbox, skeleton) | "10 GB VRAM for generation" ([README](https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-Omni/main/README.md)) | Not stated | `--flashvdm` option |
| [VAST-AI-Research/TripoSG](https://github.com/VAST-AI-Research/TripoSG) | MIT: yes | GLB geometry only (no texture), face-count limit option | CUDA GPU ≥8 GB | Not mentioned | diffusers, DINOv2, RMBG-1.4, optional torch-cluster. 1.5B rectified-flow |
| [TencentARC/InstantMesh](https://github.com/TencentARC/InstantMesh) | Apache-2.0 ([LICENSE](https://raw.githubusercontent.com/TencentARC/InstantMesh/main/LICENSE)). Uses Zero123++ weights, which are CC-BY-NC (see below) | textured mesh (OBJ/GLB) | CUDA ≥12.1; supports splitting across 2 GPUs to save memory | No | xformers 0.0.22, CUDA toolkit via conda, nvdiffrast |
| [thu-ml/CRM](https://github.com/thu-ml/CRM) | MIT | textured mesh in ~10 s | CUDA; "optimize for low memory GPU" still on TODO | No | kaolin 0.14 (cu117), xformers, nvdiffrast |
| [xxlong0/Wonder3D](https://github.com/xxlong0/Wonder3D) | MIT | textured mesh in 2–3 min (GPU) via multiview + NeuS/instant-nsr | CUDA | No | xformers, tiny-cuda-nn, per-object optimisation |
| [AiuniAI/Unique3D](https://github.com/AiuniAI/Unique3D) | MIT | textured mesh in ~30 s | Ubuntu 22.04 + CUDA 12.1 | No | onnxruntime-gpu, Real-ESRGAN ONNX, multiview diffusion |
| [3DTopia/LGM](https://github.com/3DTopia/LGM) | MIT | 3D Gaussians to mesh | ~10 GB VRAM | No | "xformers is required!", nvdiffrast, diff-gaussian-rasterization |
| [SUDO-AI-3D/zero123plus](https://github.com/SUDO-AI-3D/zero123plus) | Code Apache-2.0, **weights CC-BY-NC 4.0**: no commercial pipeline use, though outputs are free to use | 6 multiview images, not a mesh | ~5–5.7 GB VRAM | Plain diffusers; CPU runs in principle (very slow diffusion) | Low (diffusers + transformers) |
| [pengHTYX/Era3D](https://github.com/pengHTYX/Era3D) | **AGPL-3.0** (copyleft, applies to weights too per README) | multiview, then mesh via instant-nsr | CUDA | No | xformers (cu118 wheel), tiny-cuda-nn, nvdiffrast |
| [stepfun-ai/Step1X-3D](https://github.com/stepfun-ai/Step1X-3D) | Apache-2.0 | geometry + texture | 27–29 GB, 152 s for 50 steps | No | CUDA 12.4, torch-cluster, kaolin 0.17 |
| [DreamTechAI/Direct3D-S2](https://github.com/DreamTechAI/Direct3D-S2) | MIT | high-res SDF mesh | ≥10 GB @512, ~24 GB @1024 | `pipeline.to("cuda:0")`, CUDA 12.1 | Custom spatial sparse attention kernels |
| Sparc3D | — | — | — | — | No primary repo/README found; see Gaps |

Sources for the table: each repo's README/LICENSE fetched from raw.githubusercontent.com ([InstantMesh](https://raw.githubusercontent.com/TencentARC/InstantMesh/main/README.md), [CRM](https://raw.githubusercontent.com/thu-ml/CRM/main/README.md), [Wonder3D](https://raw.githubusercontent.com/xxlong0/Wonder3D/main/README.md), [Unique3D](https://raw.githubusercontent.com/AiuniAI/Unique3D/main/README.md), [LGM](https://raw.githubusercontent.com/3DTopia/LGM/main/readme.md), [Zero123++](https://raw.githubusercontent.com/SUDO-AI-3D/zero123plus/main/README.md), [Era3D](https://raw.githubusercontent.com/pengHTYX/Era3D/main/README.md), [Step1X-3D](https://raw.githubusercontent.com/stepfun-ai/Step1X-3D/main/README.md), [Direct3D-S2](https://raw.githubusercontent.com/DreamTechAI/Direct3D-S2/main/README.md), [Hunyuan3D-2](https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/README.md)) plus the GitHub pages linked in the table.

### Inferences
- **Hunyuan3D-2mini shape-only (0.6B, Turbo/FlashVDM)** is the only modern high-quality shape generator plausibly runnable on CPU. It needs no compiled kernel for shape. But a diffusion DiT plus volume decoding on 4 vCPUs is likely several minutes per mesh, and the output is untextured. Its license also bars use in the EU/UK/South Korea. Relevant if the user or end clients are in those territories (the user's domain is .mu, Mauritius, which is not excluded; check where the output is used).
- TRELLIS/TRELLIS.2 are out of reach: sparse-conv and flash-attn kernels, and even the pure-PyTorch Mac port needs about 18 GB, more than 15 GB of RAM.
- The multiview-diffusion-plus-reconstruction family (InstantMesh, Wonder3D, Era3D, Unique3D, LGM, CRM) depends on xformers/nvdiffrast/tiny-cuda-nn, and the diffusion stage alone would take tens of minutes on CPU. Not realistic.

### Gaps
- **Sparc3D**: no official open-source repo or README turned up in this research (it appeared as a paper/demo, reportedly linked to Hitem3D). Treat it as not locally available unless a repo is confirmed.
- No community report of Hunyuan3D-2mini shape-only running on pure CPU, with timings, was found.
- Hunyuan3D-2.1 and Omni license texts weren't fetched (no LICENSE at repo root for Omni via raw URL).

## Q4. ONNX / CPU-friendly ports (TripoSR ONNX, Hunyuan3D on CPU, GGUF/ComfyUI CPU paths)

### Takeaway
TripoSR has real ONNX exports aimed at CPU and browser (WebGPU) inference, including an int8 tier. I found no ONNX or GGUF port of Hunyuan3D, TRELLIS, SF3D or TripoSG. ComfyUI 3D-Pack wraps these models but still needs CUDA-compiled extensions. All of these ports are also hosted on HF, which this container can't reach.

### Cited findings
- TripoSR ONNX exports: `fernandotonon/QtMeshEditor-triposr-onnx` (ONNX Runtime, native marching cubes), `brodatech/triposr-onnx`, `cgb/triposr-onnx-webgpu` (browser). About 1.6–1.7 GB fp32 encoder, an about 430 MB int8 encoder tier, and a tiny decoder. — [search results](https://huggingface.co/fernandotonon/QtMeshEditor-triposr-onnx), [brodatech](https://huggingface.co/brodatech/triposr-onnx), [cgb webgpu](https://huggingface.co/cgb/triposr-onnx-webgpu)
- ComfyUI 3D Pack integrates InstantMesh, CRM, Hunyuan3D, StableFast3D and TripoSR. — [RunComfy Wonder3D / 3D Pack page](https://www.runcomfy.com/fr/comfyui-workflows/wonder3d-single-view-3d-reconstruction)
- A Windows portable build bundles Hunyuan3D-2 for ComfyUI (GPU). — [Comfy3D-WinPortable r8-hunyuan3d2](https://github.com/YanWenKun/Comfy3D-WinPortable/releases/tag/r8-hunyuan3d2)
- Ascend NPU / MindIE ports of Hunyuan3D exist (non-NVIDIA, but still accelerators, not CPU). — [cann-recipes Hunyuan3D](https://gitcode.com/cann/cann-recipes-embodied-ai/tree/master/3d_vision/Hunyuan3D), [MindIE Hunyuan3D-2.1](https://ai.gitcode.com/hf_mirrors/MindIE/Hunyuan3D-2.1)

### Inferences
- If HF is opened, the TripoSR int8 ONNX path needs only `onnxruntime` + `numpy` + a marching-cubes library (`PyMCubes` or `scikit-image`) + `trimesh`, all on PyPI and all with CPU wheels. That is the lightest real image-to-3D install, roughly 0.5–2 GB total including weights.

### Gaps
- Couldn't read the ONNX model cards directly (HF blocked to the fetch tool), so their licenses, exact runtime figures and any CPU benchmarks are unverified.
- No GGUF quantisation of any image-to-3D model was found.

## Q5. Non-ML / classic alternatives: depth-to-relief, photogrammetry, Three.js parallax

### Takeaway
Monocular depth (Depth Anything V2 Small, MiDaS small) runs on CPU in seconds and can be downloaded here from GitHub Releases. Turned into a displaced grid mesh (numpy/trimesh/open3d), it gives a convincing **2.5D relief or bas-relief**: the front face only, with no back side and stretched edges at depth discontinuities. That works for a parallax hero, a relief or a "pop-out" effect, but not for a rotatable object. Photogrammetry needs many photos (dozens of overlapping views), so it doesn't fit a single photo. Three.js depth parallax (image + depth map as a displacement map) is cheap and looks good for small camera moves.

### Cited findings
- Depth-Anything-V2-Small (24.8M params) is Apache-2.0; the larger variants use more restrictive (non-commercial) licensing. — [Depth-Anything-V2 GitHub](https://github.com/DepthAnything/Depth-Anything-V2), [README via jsDelivr](https://cdn.jsdelivr.net/gh/depthanything/depth-anything-v2@main/README.md)
- ONNX exports of DA-V2 Small exist (opset 14, dynamic shape), and one is downloadable from GitHub Releases at 99 MB (verified reachable from this container). — [Lensmera DA-V2 Small ONNX](https://huggingface.co/lensmera/lensmera-depth-dav2-small), [fabio-sim/Depth-Anything-ONNX release](https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits.onnx)
- MiDaS weights (`midas_v21_small_256.pt` 86 MB, `dpt_swin2_tiny_256.pt` 172 MB) are on GitHub Releases (reachable). — [MiDaS releases](https://github.com/isl-org/MiDaS/releases)
- Pipeline described in a tutorial: depth map, then an Open3D RGBD point cloud with pinhole intrinsics, then Poisson surface reconstruction (smoother results). Single-image depth reconstructs only the visible surface. — [Towards Data Science: Generate a 3D mesh from an image with Python](https://towardsdatascience.com/generate-a-3d-mesh-from-an-image-with-python-12210c73e5cc/)
- In-browser depth estimation with WebGPU for parallax/3D effects exists. — [webgpu.dudoxx.com depth demo](https://webgpu.dudoxx.com/en/ai/depth)
- Commercial "image to relief" endpoints exist as a product category (e.g. Hi3D image-to-relief), which shows relief is a recognised distinct output from full 3D. — [fal.ai Hi3D image-to-relief](https://fal.ai/models/hitem3d/hi3d/image-to-relief/llms.txt)

### Inferences
- On 4 vCPUs, DA-V2 Small via onnxruntime at 518 px input should take about 1–5 s per image with under 1 GB RAM (my estimate). Grid displacement in numpy/trimesh is instant and exports GLB/OBJ/STL, with the photo as texture via UVs equal to pixel coordinates.
- Quality: very good for reliefs, coins, plaques and parallax website heroes. Poor for anything that must rotate past about ±20°. Relative (affine-invariant) depth also means scale and flatness need manual tuning. Marigold (diffusion-based) gives sharper depth but is a Stable Diffusion-size model, minutes on CPU, with HF-hosted weights. Not worth it here.
- Three.js route: `MeshStandardMaterial` with `displacementMap` = depth, on a subdivided plane, or a custom shader parallax. Three is available via the npm registry from this container (jsDelivr blocked inside the container, but fine for end users' browsers).

### Gaps
- No standardised quality benchmark for depth-relief vs. image-to-3D found. The quality notes above are reasoned, not measured.

## Q6. Background removal (rembg) on CPU

### Takeaway
rembg is MIT-licensed, has an explicit `rembg[cpu]` install (onnxruntime CPU), and downloads its ONNX models from **GitHub Releases**, which this container can reach. It is the one component that works here end to end.

### Cited findings
- `pip install "rembg[cpu]"` (library) / `"rembg[cpu,cli]"`; GPU needs `onnxruntime-gpu` + CUDA + cuDNN. The CPU Docker image is about 1.6 GB vs. about 11 GB for CUDA. — [rembg README](https://github.com/danielgatis/rembg) / [raw](https://raw.githubusercontent.com/danielgatis/rembg/main/README.md)
- Models auto-download to `~/.rembg/models/` from GitHub Releases, e.g. `u2net.onnx` and `u2netp.onnx` (lightweight); `birefnet-general` and others are also listed. — [rembg README](https://raw.githubusercontent.com/danielgatis/rembg/main/README.md)
- `u2net.onnx` fetched with HTTP 200, 176 MB, from this container. (curl probe)
- License MIT. — [rembg LICENSE](https://raw.githubusercontent.com/danielgatis/rembg/main/LICENSE.txt)

### Inferences
- u2net on 4 vCPUs is typically about 1–3 s per image (estimate). BiRefNet variants give cleaner edges but are slower (likely 10–30 s on CPU) and larger. TripoSR/SF3D already call rembg internally, but SF3D pins `rembg[gpu]`, so override it with the CPU extra.

### Gaps
- No official rembg CPU benchmark numbers found.

## Q7. Bottom line: most realistic single repo on this CPU box, and expected quality

### Takeaway
**Most realistic: TripoSR (MIT)**, run on CPU with torch, or ideally via its int8 ONNX port. It has no CUDA-only kernels (torchmcubes CPU fallback, or PyMCubes), fits in 15 GB RAM, and gives a recognisable draft mesh with vertex colours or a baked texture in an estimated tens of seconds to a few minutes. **Best quality while still officially CPU-capable: Stable Fast 3D**: UV-unwrapped textured GLB, CPU path and C++/OpenMP texture baker documented. But it is gated, under the Stability Community License (free under US$1M revenue), and its pins break on Python 3.13. **Both are blocked in practice by this container's proxy denying huggingface.co.** Without HF access, the only fully working pipeline here is **rembg + Depth Anything V2 Small (ONNX) + numpy/trimesh relief mesh (+ optional Three.js displacement)**, which gives a 2.5D front-facing relief, not a full 3D object.

### Cited findings
- TripoSR: MIT; CPU marching-cubes fallback documented; no xformers/nvdiffrast/kaolin in requirements. — [TripoSR README](https://github.com/VAST-AI-Research/TripoSR), [requirements.txt](https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/main/requirements.txt)
- SF3D: official CPU backend; Stability Community License; gated weights. — [SF3D README](https://github.com/Stability-AI/stable-fast-3d), [LICENSE.md](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/LICENSE.md), [Stability license](https://stability.ai/license)
- SPAR3D CPU is "really slow" per its own README. — [SPAR3D README](https://raw.githubusercontent.com/Stability-AI/stable-point-aware-3d/main/README.md)
- HF blocked, GitHub releases and PyPI allowed (container probes, Q0).

### Inferences
- Ranking for this box: (1) SF3D if HF + token + Python ≤3.12 are available and the revenue threshold is OK; best textures. (2) TripoSR (simplest, MIT, ONNX option). (3) Hunyuan3D-2mini shape-only (best geometry, but slow, untextured, territory license). (4) Everything else is effectively CUDA-only.
- Expected quality from TripoSR/SF3D: game-prop or draft quality. Good silhouette and front, hallucinated and blurrier back side, and smooth geometry lacking fine detail. TripoSR textures are noticeably softer than SF3D's. Neither matches TRELLIS.2, Hunyuan3D-2.1 or commercial APIs (Tripo, Meshy, Rodin) for detail or PBR.
- Recommended unblock step: get `huggingface.co` (and `cdn-lfs*.huggingface.co` / `*.hf.co`) added to the environment's network allowlist, or upload the weights manually. Install torch from PyPI (CUDA libraries come along but run on CPU) or use the ONNX route to avoid torch.

### Gaps
- No measured CPU runtimes for TripoSR, SF3D or Hunyuan3D-2mini on a 4-vCPU box were found in public sources. All timings above are estimates and should be checked with a single test run (local inference, no KIE credits involved) once weights are reachable.
- Didn't verify whether the newest TripoSR/SF3D releases have relaxed their pins for Python 3.13.
