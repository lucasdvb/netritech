# Hosted / cloud image-to-3D APIs callable from a script (as of Oct 7, 2026)

Method note for the report writer: most vendor pages (fal.ai, replicate.com, meshy.ai, tripo3d.ai, stability.ai, weavy.ai, 3daistudio.com, costgoat.com) could not be fetched directly. The fetch tool failed DNS for them, and this cloud container's network policy also rejects them (see the container section). Only kie.ai and github.com could be read in full. Many figures below come from search-engine summaries of the cited pages, not from reading the pages. They are labelled "(search snippet)". Check them before quoting as final prices.

## Does KIE AI offer any image-to-3D models?

### Takeaway
No. As of Oct 7, 2026, KIE AI's model catalog and pricing page list no 3D, mesh or image-to-3D model (no Hunyuan3D, Tripo, Meshy, Trellis or Rodin). The project's KIE key cannot be used for photo-to-3D.

### Cited Findings
- The kie.ai market page shows 115 models from 25 providers (video, image, chat, audio: Seedance, Veo 3.1, Kling 4.0, GPT Image 2/2.5, Nano Banana, Suno, and others). It has no entry for Hunyuan3D, Tripo, Meshy, Trellis, Rodin or any other 3D tool. — [kie.ai market](https://kie.ai/market)
- The kie.ai pricing page has no 3D, mesh or image-to-3D line items. Credit prices vary by model, for example nano-banana-2-1 1K = 4 credits = $0.020. — [kie.ai pricing](https://kie.ai/pricing)
- A web search for "kie.ai image to 3D" returned only other aggregators (Atlas Cloud, muapi.ai, Civitai, Comfy). No kie.ai 3D page appeared. — [search: atlascloud.ai Hunyuan3D Pro](https://www.atlascloud.ai/de/models/tencent/hunyuan3d-pro/image-to-3d), [muapi.ai 3D API](https://muapi.ai/ai-3d-model-api)

### Inferences
- A new provider and API key are needed. fal.ai is the closest one-key, many-model equivalent to KIE for 3D.
- api.kie.ai is the only one of the tested 3D-relevant API hosts that this container can reach (see the container section). Whichever 3D provider is chosen, its host must be added to the environment allowlist.

### Gaps
- docs.kie.ai could not be fetched (DNS failure), so the docs could not be checked for a hidden or upcoming 3D endpoint. The market page and pricing page both show none.

## Does Figma Weave (Weavy) offer image-to-3D, and at what credit cost?

### Takeaway
Yes. Figma Weave's 3D nodes include Rodin, Rodin V2, Trellis, Trellis 3D V2, Meshy V6, Hunyuan 3D, Hunyuan 3D V2.1 and Hunyuan 3D V3. Each run costs about 2 to 96 credits, depending on the model. Weave is reachable from this session through the Figma MCP tools (`weave_find_model` / `weave_run_model`), but the user's Figma account is not yet linked to Weave.

### Cited Findings
- Weave's 3D models include Rodin, Rodin V2, Trellis 3D V2, Meshy V6, Hunyuan 3D V3, Hunyuan 3D, Hunyuan 3D V2.1 and Trellis. Credit costs range from 2 to 96 per run (search snippet). — [help.weavy.ai 3D models comparison](https://help.weavy.ai/en/articles/12344357-3d-models-comparison)
- Credits per run: Rodin V2 = 36, Meshy V6 = 96, Trellis 3D V2 = 30 (search snippet of the same page). — [help.weavy.ai 3D models comparison](https://help.weavy.ai/en/articles/12344357-3d-models-comparison)
- Figma's blog describes a workflow that makes three views of an object and runs them through Rodin 3D V2 to get a model you can rotate. — [Figma blog: five Figma Weave workflows](https://www.figma.com/blog/five-figma-weave-workflows/)
- This session has `mcp__Figma__weave_find_model` / `weave_run_model`. A read-only lookup returned: "You haven't linked your Figma account to Weave yet. Open https://app.weavy.ai/settings?section=profile … link your Figma account." — tool call made in this session, Oct 7, 2026 (no URL)

### Inferences
- Weave is the one route that needs no new network allowlisting, because it runs through the MCP connector, not through container HTTPS. It does need a one-time account link and Weave credits.
- The credit figures are about 6 months older than this research's date (see Gaps), and Weave adds models often, so its list may now include newer versions.

### Gaps
- The USD price of a Weave credit was not found, so per-run dollar costs cannot be calculated.
- The output formats Weave returns for 3D (GLB or others) were not confirmed.
- The page date of the Weavy comparison table is unknown. It could not be fetched.

## fal.ai image-to-3D endpoints and per-run prices

### Takeaway
fal.ai has the widest catalog behind one API key. Approximate prices per run: Hunyuan3D v2.1 $0.05, v2 $0.16, Hunyuan 3.1 Rapid $0.225 (+$0.15 PBR), Hunyuan 3.1 Pro $0.375, Trellis 2 $0.25 to $0.35 by resolution, Rodin v2/v2.5 $0.40 (+$0.80 HighPack), Meshy 7.1 $0.80 to $1.20, Tripo P2 $1.00 to $1.30. All return GLB first.

### Cited Findings
- An open-source agent skill for fal (PR dated Sep 27, 2026) lists these endpoints:
  - `hunyuan-3.1-rapid`: $0.225 per mesh (+$0.15 PBR), returns OBJ+MTL. This is the PR's default.
  - `hunyuan-3.1-pro`: $0.375, 40k to 1.5M faces.
  - `tripo-p2`: $1.00 to $1.30, up to 25k faces, published on fal Sep 21, 2026.
  - `meshy-7.1`: $0.80 to $1.20, 100k to 300k faces, published Sep 19, 2026.
  - `trellis-2`: GPU-time pricing, 5k to 2M vertices.
  - The script takes "GLB first", then OBJ+MTL, FBX or USDZ where an endpoint offers them.
  - Source: [NousResearch/hermes-agent PR #124818](https://github.com/NousResearch/hermes-agent/pull/124818)
- Hunyuan3D V3 on fal: Pro $0.375 per generation, Rapid $0.225. Pro allows custom polygon counts (40K to 1.5M) and multi-view input. PBR adds $0.15 (search snippet, dated 2026-10-05). — [APITariff: fal hunyuan3d v3](https://apitariff.com/models/fal-ai-hunyuan3d-v3-image-to-3d/)
- Hunyuan3D v2.1 on fal ≈ $0.05 per generation. Hunyuan3D v2 ≈ $0.16 (search snippets). — [fal Hunyuan3D v2](https://fal.ai/models/fal-ai/hunyuan3d/v2), [fal hunyuan-3d page](https://fal.ai/hunyuan-3d)
- Trellis 2 on fal: $0.25 at 512p, $0.30 at 1024p, $0.35 at 1536p (search snippet). Another source says GPU-time pricing. — [fal trellis-2](https://fal.ai/models/fal-ai/trellis-2), [cloudprice.net](https://cloudprice.net/models/fal-ai-trellis-2); contrasted with [hermes-agent PR](https://github.com/NousResearch/hermes-agent/pull/124818)
- Hyper3D Rodin v2 / v2.5 on fal: $0.40 per generation, plus $0.80 for HighPack (search snippet). — [fal hyper3d/rodin/v2.5](https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5), [fal hyper3d/rodin](https://fal.ai/models/fal-ai/hyper3d/rodin)
- Other 3D endpoints fal hosts: original Trellis (`fal-ai/trellis`), Hunyuan3D v2 turbo and multi-view turbo, Hunyuan 3D v3.1 smart-topology (3D-to-3D retopology), Hunyuan Part, and a Trellis 2 LoRA trainer. — [fal trellis](https://fal.ai/models/fal-ai/trellis), [fal hunyuan3d v2 turbo](https://fal.ai/models/fal-ai/hunyuan3d/v2/turbo), [fal hunyuan smart-topology](https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/smart-topology), [fal trellis-2 lora trainer](https://fal.ai/models/fal-ai/trellis-2-lora-trainer)
- Hunyuan "rapid" variants take about 2 to 3 minutes, with fixed mid-range polygon budgets and 1K textures. "Pro" variants allow 40K to 1.5M faces and up to 4K PBR textures (search snippet; describes Hunyuan generally, via Civitai). — [Civitai 3D recipes](https://developer.civitai.com/orchestration/recipes/3d)

### Inferences
- For a cheap first test, Hunyuan3D v2.1 ($0.05) or 3.1 Rapid ($0.225) on fal is the lowest-cost choice with good quality. Tripo P2 and Meshy 7.1 cost about 4 to 5 times more per mesh.
- The fal endpoint for Stable Fast 3D (SF3D) was not confirmed in this research.

### Gaps
- fal.ai pages could not be fetched, so endpoint IDs and prices are partly from search snippets. Confirm on the fal model pages before relying on them.
- No fal-published latency figures were found, apart from the general Hunyuan rapid estimate of about 2 to 3 minutes.

## Replicate image-to-3D models and pricing

### Takeaway
Replicate hosts older open models, billed by GPU time. firtoz/trellis costs about $0.039 per run (about 28 s). Hunyuan3D-2 costs about $0.11 to $0.12 (about 2 min), and Hunyuan3D-2.1 about $0.17. These are cheap, but they are older (TRELLIS v1, Hunyuan 2.x) than the 2026 models on fal.

### Cited Findings
- firtoz/trellis: about $0.039 per run (25 runs per $1), usually finishes in about 28 s (search snippet). — [replicate firtoz/trellis](https://replicate.com/firtoz/trellis)
- ndreca/hunyuan3d-2: about $0.11 per run, about 113 s. tencent/hunyuan3d-2: about $0.12 per run, about 127 s. ndreca/hunyuan3d-2.1: about $0.17 per run (search snippets). — [replicate ndreca/hunyuan3d-2](https://replicate.com/ndreca/hunyuan3d-2), [replicate tencent/hunyuan3d-2](https://replicate.com/tencent/hunyuan3d-2), [replicate ndreca/hunyuan3d-2.1](https://replicate.com/ndreca/hunyuan3d-2.1)
- For comparison, SaladCloud claims Hunyuan3D 2.1 image-to-3D at about $0.009 per generation on its own GPUs, "94% cheaper than FAL" (vendor claim, self-hosted). — [SaladCloud blog](https://blog.salad.com/hunyuan3d-2-1/)

### Inferences
- Replicate's prices vary with run time on GPU hardware, so real costs will vary. The page snippets carry no date and may be from 2025.

### Gaps
- No Replicate listing for TRELLIS 2 or Hunyuan 3.x was confirmed.

## Direct vendor APIs: Meshy, Tripo3D, Hyper3D Rodin, Tencent Hunyuan3D, Stability, CSM, Luma

### Takeaway
Tripo and Meshy have self-serve API keys, free starter credits, and roughly $0.20 to $0.30 per textured image-to-3D. Rodin's direct API needs a Business plan (about $120 per month), so calling Rodin through fal is easier. Stability's SF3D and SPAR3D are the cheapest and fastest ($0.02 to $0.10) but lower quality. Tencent HY 3D Global has a free starter quota. CSM.ai's status is uncertain, and Luma Genie has no public self-serve API.

### Cited Findings
- **Tripo3D API**:
  - 1 credit = $0.01.
  - Image-to-3D costs 20 credits ($0.20) without texture or 30 credits ($0.30) with standard texture.
  - New sign-ups get 2,000 free API credits. Web subscriptions start at $11.94 per month.
  - (Search snippet.) — [Tripo Developers pricing](https://developers.tripo3d.ai/en/pricing)
- **Meshy API**:
  - Image-to-3D costs about 20 to 30 credits.
  - Plans quoted: Free 200 credits per month, Pro $10 per month for 1,000 credits, Studio $30 per month for 4,000 credits.
  - This plan pricing comes from meshyiai.com, which does not appear to be Meshy's official domain (meshy.ai). Verify on meshy.ai/pricing.
  - (Search snippet.) — [meshyiai.com API pricing](https://meshyiai.com/api-pricing/)
- **Meshy API formats and latency**:
  - Returns GLB, FBX, OBJ(+MTL), USDZ, STL and 3MF. Accepts JPG/PNG by public URL or base64 data URI.
  - Options include PBR, remesh, topology and texture resolution.
  - A textured model takes about a minute. Meshy 5 took about 45 s.
  - Model versions are Meshy 5, 6 and 7.
  - (Search snippet.) — [Meshy docs](https://docs.meshy.ai/), [Meshy API quickstart](https://www.meshy.ai/nl/tutorials/api-quickstart-image-to-3d)
- **Hyper3D Rodin direct API**:
  - API access requires a Business subscription from $120 per month.
  - Each generation uses 0.5 credits, plus 1 more credit for HighPack (4K textures, high poly).
  - Other plans: Creator $30 per month for 30 credits, Business $120 per month for 208 credits.
  - (Search snippet.) — [3daistudio best 3D APIs 2026](https://www.3daistudio.com/blog/best-3d-model-generation-apis-2026), [dupple Rodin review](https://dupple.com/reviews/rodin-ai)
  - On fal, Rodin needs no subscription: $0.40 per run (see the fal section).
- **Tencent HY 3D Global**:
  - Tencent Cloud's international service runs Hunyuan 3D outside mainland China.
  - Billing is per generation in credits: Normal 25, Geometry 15, Sketch 25, LowPoly 30, Express 15.
  - Enterprise API users get 200 free credits at registration. The free package is valid for 1 year.
  - Another snippet claims "1,000 credits for $0", and one claims "15.00 USD/time". The 15 USD figure looks like a misreading of the 15-credit Express price. Treat it as unreliable.
  - Sources: [Tencent Cloud techpedia: HY 3D Global](https://www.tencentcloud.com/techpedia/148311?lang=en), [Tencent Cloud billing overview](https://www.tencentcloud.com/document/product/1281/74121)
- **Stability AI Stable Fast 3D (SF3D)**:
  - One snippet says 10 credits ($0.10, at 1 credit = $0.01). Another says 2 credits per successful generation, with failed runs not charged. The sources conflict.
  - New accounts get 25 free credits.
  - Sources: [Stability pricing](https://platform.stability.ai/pricing), [puter Stability pricing (Jun 2026)](https://developer.puter.com/tutorials/stability-ai-api-pricing/)
- **Stability AI SPAR3D (Stable Point Aware 3D)**:
  - Released Jan 8, 2025. Costs 4 credits per successful generation (about $0.04).
  - Open weights under the Community License. Organisations with over $1M in revenue need an Enterprise licence.
  - Sources: [Stability SPAR3D announcement](https://stability.ai/news/stable-point-aware-3d), [Stability pricing](https://platform.stability.ai/pricing)
- **CSM.ai**:
  - Has a Python SDK and REST API with universal credits.
  - One directory said service access "could not be verified as of September 21, 2026" and that official domains were unreachable. Status is uncertain.
  - Sources: [CSM API credits](https://docs.csm.ai/credits), [csm-ai python docs](https://python-docs.csm.ai/), [tasarim.ai CSM status](https://tasarim.ai/en/discover/ai-3d-modeling/csm-ai)
- **Luma Genie**:
  - Luma's legacy API for captures is no longer actively supported. For a Genie API you must contact Luma.
  - Genie is mainly text-to-3D (4 candidate meshes in under a minute).
  - Sources: [lumalabs/lumaapi-python](https://github.com/lumalabs/lumaapi-python), [llmreference Genie 3D](https://www.llmreference.com/provider/luma-api/genie-3d)
- **Hunyuan3D via other aggregators**: also offered by Atlas Cloud (hunyuan3d-pro and hunyuan3d-rapid image-to-3d) and WaveSpeed (Hunyuan3D v2.1). — [Atlas Cloud Hunyuan3D Pro](https://www.atlascloud.ai/models/tencent/hunyuan3d-pro/image-to-3d), [WaveSpeed Hunyuan3D v2.1](https://wavespeed.ai/models/wavespeed-ai/hunyuan3d/v2.1)

### Can this container reach these APIs?
Tested on Oct 7, 2026 with HEAD-style curl requests, without calling any generation endpoint:
- **Reachable:** only api.kie.ai, which returned HTTP 404 on the bare root.
- **Blocked:** the gateway answered 403 to CONNECT for fal.ai, queue.fal.run, replicate.com, api.replicate.com, www.meshy.ai, api.meshy.ai, platform.tripo3d.ai, api.tripo3d.ai, hyperhuman.deemos.com (Rodin), api.stability.ai and huggingface.co.
- **Fix:** the chosen provider's host must be added to the environment's network allowlist (cloud environment menu → Edit → Network access → Allowed domains; see https://code.claude.com/docs/en/cloud-environments#network-access).
- **Alternative:** use Figma Weave through the MCP connector instead.

Source: container proxy status (`$HTTPS_PROXY/__agentproxy/status`, recentRelayFailures) and curl tests in this session, no URL.

### Inferences
- Cheapest self-serve direct key with free credits: Tripo (2,000 free credits, about 66 textured runs).
- Best formats for 3D printing: Meshy (STL and 3MF built in).
- Rodin is better called through fal than directly, unless the user already has a Business plan.

### Gaps
- None of the vendor pricing pages could be opened. Every direct-vendor price above is from search snippets.
- Tripo P2 direct-API pricing (versus fal's $1.00 to $1.30) was not found.
- Exact Rodin Gen-2 direct API dollar cost per generation was not found.

## Which give the best quality for products/objects, characters, and people?

### Takeaway
Hunyuan3D (2.5 / 3.x) and TRELLIS / TRELLIS.2 lead the community leaderboards for single-image fidelity. Meshy 7 is seen as the most balanced complete product. Tripo and Rodin are recommended for clean, game-ready props and characters. No reliable benchmark split by object type (products vs characters vs real people) was found.

### Cited Findings
- 3D Arena-style leaderboard (search snippet, date unclear):
  1. Hunyuan3D-2.5, score 1325
  2. TRELLIS, 1290
  3. Meshy 5, 1280
  4. Tripo 2.5 Pro, 1265
  5. Rodin Gen-2, 1245

  These are older model versions. — [pixazo 3D leaderboard](https://www.pixazo.ai/leaderboard/ai-3d-model-generation)
- Hunyuan3D is described as one of the strongest open models for turning a single image into a detailed model with good materials. TRELLIS 2 (Microsoft Research) uses structured latents. — [fuser.studio best AI 3D generators](https://fuser.studio/articles/best-ai-3d-model-generators)
- One guide ranks Meshy 7 first as "the most balanced product". It recommends Tripo or Rodin for game-ready props (search snippet). — [buildmvpfast Sep 2026](https://www.buildmvpfast.com/articles/best-llms-2026-guide/3d-modeling-ai), [fuser.studio](https://fuser.studio/articles/best-ai-3d-model-generators)
- Civitai's integration guide recommends:
  - Hunyuan3D as the default for new image-to-3D integrations.
  - Tripo for fast hosted output with quad topology or HD/PBR textures.
  - Meshy when text prompts, rigging or animation are needed.
  - Source: [Civitai 3D recipes](https://developer.civitai.com/orchestration/recipes/3d)
- Meshy offers rigging and animation, which suits characters (see the previous bullet). Meshy STL/3MF output suits printing. — [Civitai 3D recipes](https://developer.civitai.com/orchestration/recipes/3d), [Meshy docs](https://docs.meshy.ai/)

### Inferences
- **Products and objects:** Hunyuan 3.1 Pro (high faces, 4K PBR) or TRELLIS.2 for faithful shape and texture. Rodin with HighPack for photoreal product materials.
- **Characters and stylised figures:** Meshy 7.x (rigging and animation) or Tripo P2 (clean low-poly topology).
- **Real people / likeness:** none of these are known for accurate facial likeness from one photo. Expect weaker results. Running Hunyuan Pro, TRELLIS.2 and Rodin side by side on a test image is the practical way to judge. This is an inference, not a benchmark result.
- **Latency, approximate:** TRELLIS about 30 s (Replicate v1), Meshy about 1 min, Hunyuan rapid about 2 to 3 min, Hunyuan2 on Replicate about 2 min. Stability SF3D/SPAR3D are marketed as taking seconds, but no API timing was found.

### Gaps
- No reliable 2026 head-to-head was found that splits results by category (product vs character vs person).
- A "polymedium 41-engine August 2026" benchmark appeared in one search result list, but it could not be found or verified.
- The leaderboard snippet uses older model versions (Meshy 5, Tripo 2.5), so it may be out of date compared with the Sep 2026 releases (Meshy 7.1, Tripo P2, Hunyuan 3.1).
