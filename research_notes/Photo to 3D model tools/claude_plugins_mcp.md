# Claude Code plugins, skills and MCP servers for photo-to-3D (as of 2026-10-07)

Research method: session catalog tools (SearchPlugins, SearchSkills, SearchMcpRegistry), the official MCP registry API, GitHub repo search (GitHub MCP), npm/PyPI registries, vendor READMEs and web search. Nothing was installed, connected or generated. Star counts and "updated" timestamps come from GitHub search results pulled on 2026-10-07 ("updated" is the repo's last-updated time, a rough proxy for the last commit).

**Critical environment finding (applies to every option below).** From this cloud container, the egress proxy refuses CONNECT (HTTP 403, policy denial) to every 3D backend tested: api.meshy.ai, www.meshy.ai, docs.meshy.ai, api.tripo3d.ai, platform.tripo3d.ai, api.hyper3d.com, hyperhuman.deemos.com, fal.ai, queue.fal.run, mcp.fal.ai, api.replicate.com, mcp.replicate.com, hunyuan.tencentcloudapi.com, ai3d.tencentcloudapi.com, api.stability.ai, api.3daistudio.com and huggingface.co. registry.npmjs.org, pypi.org, github.com and api.kie.ai are reachable. Source: curl probes plus the proxy's `/__agentproxy/status` recentRelayFailures list (this session, 2026-10-07). So no local stdio MCP server, skill or script that calls these APIs will work here until the user adds the host under Network access → Allowed domains in the cloud environment settings ([Claude Code docs: cloud environments, network access](https://code.claude.com/docs/en/cloud-environments#network-access)).

---

## 1. Which MCP servers exist for photo-to-3D (Meshy, Tripo, Rodin, Hunyuan3D, fal, Replicate, Stability, Luma, CSM, Sloyd, 3D AI Studio, etc.)?

### Takeaway
There are now first-party options for Meshy (an official npm MCP server and an official Claude plugin in the Anthropic Directory), Hyper3D Rodin (an official Claude Code skill and plugin marketplace), fal.ai (an official hosted HTTP MCP) and Replicate (an official hosted MCP). Hunyuan3D has a Tencent CloudBase MCP template. Tripo's official MCP only drives the Tripo Blender add-on, so for headless use the community npm `tripo-ai-mcp-server` is the practical one. I found no Stability AI, Luma, CSM.ai or Sloyd MCP with image-to-3D. The cleanest fit for a headless Linux container is a direct-API server (Meshy, fal, Replicate, Tripo community, Rodin skill), and only after the proxy allowlist is changed.

### Cited Findings

**Meshy (official)**
- **Meshy MCP Server (official).** Repo [meshy-dev/meshy-mcp-server](https://github.com/meshy-dev/meshy-mcp-server). TypeScript, 49 stars, 13 forks, created 2026-04-03, updated 2026-10-05 — [GitHub search](https://github.com/meshy-dev/meshy-mcp-server). npm `@meshy-ai/meshy-mcp-server`, latest version 0.6.0 — [npm registry](https://registry.npmjs.org/@meshy-ai/meshy-mcp-server/latest).
  - Claude Code install: `claude mcp add-json meshy '{"command":"npx","args":["-y","@meshy-ai/meshy-mcp-server"],"env":{"MESHY_API_KEY":"msy_..."}}'`. 24 tools covering text-to-3D, image-to-3D, multi-image-to-3D, remesh, retexture, rig, animate, convert, resize, UV-unwrap, text-to-image, image-to-image and a 3D-printing suite (printability analysis, repair, multicolor). Environment variables: `MESHY_API_KEY` (required), `MESHY_API_HOST`, `TRANSPORT` (stdio or http) and `PORT`. — [README](https://github.com/meshy-dev/meshy-mcp-server)
  - Tool names include `meshy_image_to_3d`, `meshy_multi_image_to_3d` and `meshy_text_to_3d_refine`. Quick install via `npx add-mcp @meshy-ai/meshy-mcp-server --env MESHY_API_KEY=...`. API key from meshy.ai/settings/api. — [Meshy docs, AI Integration (search snippet)](https://docs.meshy.ai/en/api/ai) (docs.meshy.ai is blocked from this container, so this was not fetched directly)
- **Meshy plugin in the Anthropic Directory (official, "partner" tier).** Display name "Meshy": "Generate 3D models, textures, and images, rig and animate characters, and prepare models for 3D printing with the Meshy AI API." Marketplace `anthropic-plugin-directory`, authored version 0.6.0, upstream [meshy-dev/meshy-3d-agent](https://github.com/meshy-dev/meshy-3d-agent). Components are skills only: `meshy-3d-generation`, `meshy-3d-printing` and `meshy-openclaw`. Not enabled for this user. — SearchPlugins result in this session (plugin id plugin_01LLaHeMvnzBdyHYEGGSUNZi)
  - meshy-3d-agent: 97 stars, release 0.6.0, MIT license. Skills drive the Meshy CLI (no MCP server). Supports text, image, 2D and motion workflows plus texture, remesh, convert and resize. Outputs include GLB, OBJ, STL and FBX. Auth is browser OAuth login, or `MESHY_API_KEY` to override it. Install by dropping the skill into `.claude/skills/` or through the Claude plugin manifest. — [README](https://github.com/meshy-dev/meshy-3d-agent)
- **Meshy API pricing.** Image-to-3D with Meshy-6 costs 20 credits untextured or 30 credits textured. Older models cost 5 or 15. API credits are prepaid ("pay-before-you-go"). — [Meshy API pricing (search snippet)](https://docs.meshy.ai/api/pricing). The USD price per credit was not retrievable (see Gaps).
- **Community Meshy servers.** [pasie15/meshy-ai-mcp-server](https://lobehub.com/ru/mcp/pasie15-meshy-ai-mcp-server). [zyadhajaji/meshy-mcp](https://github.com/zyadhajaji/meshy-mcp): 3 stars, last updated 2026-05-20, GLB/FBX/USDZ. [gwizards/meshy-mcp-server](https://github.com/gwizards/meshy-mcp-server): 1 star, last updated 2026-04. [shoyu-ramen/meshy-claude-plugin](https://github.com/shoyu-ramen/meshy-claude-plugin): a Claude Code plugin with 18 MCP tools, a skill and slash commands; 0 stars, last updated 2026-08-06. — [GitHub search](https://github.com/search?q=mcp+image-to-3d)

**Tripo3D**
- **Official Tripo MCP.** Repo [VAST-AI-Research/tripo-mcp](https://github.com/VAST-AI-Research/tripo-mcp), 210 stars, 8 commits, described as "alpha". It "currently supports Tripo Blender Addon integration" and requires Blender plus the Tripo AI Blender Addon. Install with `uvx tripo-mcp`. — [README](https://github.com/VAST-AI-Research/tripo-mcp). It is not a headless direct-API server.
- **Community `tripo-ai-mcp-server`** by pasie15. npm `tripo-ai-mcp-server` v1.1.0 — [npm](https://registry.npmjs.org/tripo-ai-mcp-server/latest).
  - Tools: `text_to_3d`, `image_to_3d` (local paths are auto-uploaded), `multiview_to_3d`, `get_task_status`, `upload_file`, `animate_model` and `stylize_model`. Needs the env var `TRIPO_API_SECRET`. — [Glama listing](https://glama.ai/mcp/servers/@pasie15/tripo-ai-mcp-server)
- **Other Tripo servers.** [lixmal/tripo-mcp](https://github.com/lixmal/tripo-mcp) is new (created 2026-10-03) with 0 stars, tagged claude-code, image-to-3d and rigging. [dcc-mcp/dcc-ai-tripo3d](https://github.com/dcc-mcp/dcc-ai-tripo3d) is a provider skill with 1 star, updated 2026-10-02. — [GitHub search](https://github.com/search?q=mcp+image-to-3d). The Composio "Tripo3D" toolkit can also be connected to Claude. — [Composio](https://composio.dev/toolkits/tripo3d/framework/claude-cowork)
- **Tripo pricing (web app).** Plans are Free ($0, 300 credits), Professional ($19.90/month, 3,000 credits), Max ($89.90/month) and Team ($109.90/month). HD-texture image-to-3D with stylization and quad mesh costs about 50 credits. API pricing is separate, also charged per task in credits. — [Tripo credits guide](https://www.tripo3d.ai/getting-started/zero-to-3d-getting-started-credits-pricing-guide); [CostBench](https://www.costbench.com/software/ai-3d-generation/tripo-ai/). Exact API per-task prices are not confirmed.

**Hyper3D Rodin (Deemos)**
- **Rodin3D Skills (official, Deemos).** Repo [DeemosTech/rodin3d-skills](https://github.com/DeemosTech/rodin3d-skills), 17 stars, 15 commits. It is a Claude Code skill, not an MCP server. Install with `/plugin marketplace add DeemosTech/rodin3d-skills` then `/plugin install rodin3d-skill@rodin3d-skills`.
  - Needs env var `HYPER3D_API_KEY`. Image-to-3D accepts 1–5 images (JPEG/PNG/WEBP, 512–4096 px, max 16 MB).
  - Outputs: GLB, OBJ, FBX, STL and USDZ. Quality tiers: Gen-2, Detail, Smooth, Regular and Sketch. — [README](https://github.com/DeemosTech/rodin3d-skills)
- **Rodin pricing.** The reseller EmpirioLabs charges $0.80 per Hyper3D Gen-2 request — [EmpirioLabs](https://empiriolabs.ai/models/hyper3d-gen2). One source says a Gen-2 high-density download costs about 40 credits — [CostBench](https://costbench.com/software/ai-3d-generation/rodin-hyper3d/hidden-costs/). Both are secondary sources; I did not find a first-party per-call USD price.

**Hunyuan3D (Tencent)**
- **Tencent CloudBase template "cloudrun-mcp-hunyuan-3d".** Tools `submitHunyuanTo3DJob` (Prompt / ImageBase64 / ImageUrl) and `queryHunyuanTo3DJob`. Env vars `TENCENTCLOUD_SECRET_ID` and `TENCENTCLOUD_SECRET_KEY`. — [CloudBase docs](https://docs.cloudbase.net/en/ai/mcp/develop/server-templates/cloudrun-mcp-hunyuan-3d)
- **Hunyuan3D model variants.** Hunyuan3D-rapid takes about 2–3 minutes per job. Hunyuan3D-pro offers configurable polygon count and up to 4K PBR textures. — [Atlas Cloud model page](https://www.atlascloud.ai/hi/models/tencent/hunyuan3d-rapid/image-to-3d)
- **Hunyuan 3D 3.1 Pro pricing on Runware.** From $0.225 for geometry. Multiview input, PBR textures and face-count control each add $0.15. — [3daistudio blog citing Runware](https://www.3daistudio.com/blog/is-trellis-2-free-pricing-how-to-get-started)
- **Community wrappers.** [dcc-mcp/dcc-ai-hunyuan3d](https://github.com/dcc-mcp/dcc-ai-hunyuan3d) calls the API through `tccli`. [JimCline/hy3d-mcp](https://github.com/JimCline/hy3d-mcp) is an MCP server plus Claude Code plugin, but it runs the model locally on Apple Silicon (MLX) and does not suit a Linux, no-GPU container. — [GitHub search](https://github.com/search?q=mcp+image-to-3d)

**fal.ai (official hosted MCP; aggregator for TRELLIS 2, Hunyuan3D, Meshy, Tripo, etc.)**
- fal hosts an MCP server at `mcp.fal.ai/mcp`. It can search models, check schemas, run inference, upload files and browse docs. It is stateless and uses your own key.
  - Claude Code install: `claude mcp add --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer YOUR_FAL_KEY"`. — [fal docs: MCP](https://fal.ai/docs/model-apis/mcp); [fal blog](https://blog.fal.ai/connect-your-ai-to-1-000-models-with-the-fal-mcp-server)
- fal has a 3D API category — [fal 3D API overview](https://fal.ai/docs/model-api-reference/3d-api/overview.md) (blocked here, not read).
- **Community fal MCP.** [Szotasz/fal-ai-mcp-server](https://glama.ai/mcp/servers/Szotasz/fal-ai-mcp-server) is built with FastMCP and lists "Meshy V6 image to 3D (~$0.15/model)" and "Trellis 2 fast image to 3D with textures (~$0.10/model)". — [Glama](https://glama.ai/mcp/servers/Szotasz/fal-ai-mcp-server). These are community-reported prices, not checked against fal's pricing page.

**Replicate (official hosted MCP)**
- The official hosted MCP lets Claude discover and run Replicate models; Replicate hosts 3D models such as TRELLIS and Hunyuan3D community ports.
  - Claude Code install: `claude mcp add replicate https://mcp.replicate.com/sse --transport sse --scope user`, then `/mcp` for browser OAuth. Replicate calls it the recommended route over community servers. — [Replicate MCP](https://mcp.replicate.com/); [Replicate docs](https://replicate.com/docs/reference/mcp)
- npm `replicate-mcp` is the TypeScript server — [jsDelivr README](https://cdn.jsdelivr.net/npm/replicate-mcp@0.9.0/README.md). [sena-labs/replicate-mcp-server](https://github.com/sena-labs/replicate-mcp-server) is a community server listing 3D among its categories (4 stars).

**3D AI Studio**
- **`mcp-server-3daistudio`**, official registry name `io.github.whale-professor/mcp-server-3daistudio`, v1.0.1 (stdio). It generates 3D models from text or images using Hunyuan and TRELLIS. — [claudemarketplaces listing](https://claudemarketplaces.com/mcp/io.github.whale-professor/mcp-server-3daistudio); [mcpplaygroundonline](https://mcpplaygroundonline.com/mcp-servers/io-github-whale-professor-mcp-server-3daistudio). The GitHub URL github.com/whale-professor/mcp-server-3daistudio returned 404 on 2026-10-07, so the repo may have been renamed or made private.
- **3D AI Studio pricing.** Trellis 2 costs 10 credits per generation; Hunyuan 3D costs 35–100 credits. — [3daistudio blog](https://www.3daistudio.com/blog/is-trellis-2-free-pricing-how-to-get-started)

**Multi-provider and other community MCP servers with image-to-3D**
- [mordor-forge/trident-mcp](https://github.com/mordor-forge/trident-mcp): Go, 5 stars, updated 2026-10-05. Covers Tripo, Meshy and Rodin: text, image and multiview to 3D, retopology, format conversion and stylization.
- [kevinten-ai/mcp-3d-gen](https://github.com/kevinten-ai/mcp-3d-gen): Python, 1 star, updated 2026-07. Covers Tripo3D and Meshy.
- [UModeler/picoberry-mcp](https://github.com/UModeler/picoberry-mcp): PicoBerry's own API (text and image to 3D, remesh, texture, animate). 1 star, updated 2026-10-02.
- [codeofaxel/Kiln](https://github.com/codeofaxel/Kiln): an MCP server for 3D printing that includes image-to-3D and text-to-3D, then slices and prints. 90 stars, updated 2026-10-06.
- [nirholas/three.ws](https://github.com/nirholas/three.ws): 227 stars, updated 2026-10-07. Text or photo to a rigged, animated GLB avatar via a remote MCP. The official registry lists `io.github.nirholas/threews-3d-studio` ("Turn text or an image into an animation-ready 3D model (GLB)") and `threews-3d-studio-free` ("Free text/image → 3D … No auth, no payment"). The paid tools use x402 crypto payments. — [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?search=3d). The underlying model backend is not stated.
- [RareSense/Nova3D](https://github.com/RareSense/Nova3D) (registry `io.github.RareSense/Nova3D` v0.4.0): "Structured, part-aware 3D generation … Named-part GLB, preview URL, Blender script." — [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?search=3d)
- `io.github.cottom/3dlogo` v1.3.0 (3DLogo.io): "3D models from photos or prompts." — [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?search=3d)
- Local-GPU-only servers, unsuitable for a no-GPU container:
  - [FishWoWater/trellis_mcp](https://github.com/FishWoWater/trellis_mcp) (TRELLIS, 11 stars)
  - [Lanc3/Cognito-3D-MCP](https://github.com/Lanc3/Cognito-3D-MCP) (local Hunyuan3D, SPAR3D and Stable Fast 3D; 0 stars)
  - [davidemodolo/local-asset-gen-mcp](https://github.com/davidemodolo/local-asset-gen-mcp) (TripoSR)
  - [felippeomgt/mymeshy](https://github.com/felippeomgt/mymeshy) ("Runs 100% on your own GPU")
  - [zavora-ai/mcp-meshgen](https://github.com/zavora-ai/mcp-meshgen) (TRELLIS.2 on Apple Silicon)
  - Source for all five: [GitHub search](https://github.com/search?q=mcp+image-to-3d)
- [Bigchx/mcp_3d_relief](https://github.com/Bigchx/mcp_3d_relief): image to a 3D relief STL (a depth-map bas-relief, not a full mesh). 22 stars. — [GitHub](https://github.com/Bigchx/mcp_3d_relief)

**Post-processing (no generation)**
- `dev.glbforge/glbforge` v0.8.0: "Make AI-generated 3D assets web-ready: budgets, SSIM-verified optimization, STL/USDZ export." — [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?search=glb)

### Inferences
- **Most official, fewest moving parts:** the Meshy MCP (npm, stdio) or the Meshy plugin from the Anthropic Directory. Each needs only `MESHY_API_KEY` and an allowlist entry for `api.meshy.ai`. It also covers remesh, convert and print-repair, which suits GLB/STL/FBX output.
- **Widest model choice from one key:** fal's hosted MCP, with TRELLIS 2, Hunyuan3D and Meshy/Tripo endpoints at roughly $0.10–0.15 per model (community-reported). Allowlist needed: `mcp.fal.ai`, plus `fal.media`/CDN hosts for downloading results (not verified).
- **Rodin:** the official skill is the cleanest route but probably the most expensive (about $0.80 per generation, reseller figure).
- **Tripo:** use the community `tripo-ai-mcp-server`, because the official `tripo-mcp` needs a running Blender with the Tripo add-on.
- Hosted remote MCPs (fal, Replicate) added through `claude mcp add --transport http/sse` connect from the container, so they are blocked too. Whether one added as a claude.ai custom connector (brokered by Anthropic's `mcp-proxy.anthropic.com`, which is in the proxy no-proxy list) would get around the container egress policy is untested.

### Gaps
- **No official MCP found for:** Stability AI 3D (SF3D/SPAR3D appear only in local-GPU community servers), Luma (I found no current Luma 3D API), CSM.ai, Sloyd. Searches returned nothing relevant.
- **Pricing not confirmed:** exact USD per Meshy API credit, Tripo API per-task prices, a first-party Rodin API price and fal's official per-model 3D prices. The vendor pricing pages (docs.meshy.ai, platform.tripo3d.ai, fal.ai) are blocked by the container proxy.
- The 3D AI Studio MCP repo URL returned 404, so its maintenance status and stars are unknown.
- Last-commit dates are approximated by GitHub "updated_at", because `gh api` is not enabled for these repos in this session.

---

## 2. Blender MCP (ahujasid/blender-mcp): Rodin and Hunyuan3D integration, and does it work headless?

### Takeaway
ahujasid/blender-mcp is very popular (about 30.2k stars) and actively released (PyPI `mcp-for-blender` 2.1.9 on 2026-10-06). It can call Tripo, Hyper3D Rodin and Hunyuan3D, but it needs a running Blender with its add-on socket server. It has no supported headless mode, and it adds Blender as a dependency on top of the same blocked cloud APIs. Several small community forks claim headless or virtual-display operation, but none is mature.

### Cited Findings
- **Stars and generators.** 30.2k stars, 2.7k forks, 244 commits. It supports three AI generators through a `generate_3d` tool: Tripo, Hyper3D Rodin and Hunyuan3D ("premium generators are preferred automatically"). Hunyuan3D uses official Tencent Cloud API access with region-specific endpoints. — [README](https://github.com/ahujasid/blender-mcp)
- **Architecture.** Uses "a socket-based server" inside the Blender add-on, which starts when Blender opens. The README says "Blender itself still runs on your machine" even when the server runs in Docker. The demo prompt "Give a reference image, and create a Blender scene out of it" shows reference-image workflows. — [README](https://github.com/ahujasid/blender-mcp)
- **Claude Code install:** `claude mcp add blender uvx mcp-for-blender`. — [README](https://github.com/ahujasid/blender-mcp)
- **Package rename.** PyPI `blender-mcp` 2.0.0 now says "Renamed to mcp-for-blender. Installing this package installs it for you." `mcp-for-blender` 2.1.9 was uploaded 2026-10-06T15:07. — [PyPI blender-mcp](https://pypi.org/pypi/blender-mcp/json); [PyPI mcp-for-blender](https://pypi.org/pypi/mcp-for-blender/json). Older guides that say `uvx blender-mcp` are outdated.
- **Headless or alternative Blender MCPs:**
  - [sandraschi/blender-mcp](https://github.com/sandraschi/blender-mcp): "Headless Blender automation via FastMCP — 41 portmanteau tools (150+ ops) … optional live bridge". 54 stars, updated 2026-10-06. Generation integrations are not stated.
  - [digitable-lol/blender-mcp](https://github.com/digitable-lol/blender-mcp): "Headless blender-mcp: Blender on a virtual display with offscreen viewport screenshots, so an agent can model and export 3D without a GPU". 0 stars, updated 2026-08-11.
  - [pflerman/blender-mcp-headless](https://github.com/pflerman/blender-mcp-headless): headless Flatpak wrapper around the ahujasid add-on on Fedora. 1 star.
  - [ellmos-ai/ellmos-blender-use-mcp](https://github.com/ellmos-ai/ellmos-blender-use-mcp) (registry `io.github.ellmos-ai/ellmos-blender-use-mcp` 0.1.0-alpha.4): "background script runs and FBX reimport verification. No add-on, no TCP port." For QA only.
  - [cUDGk/blender-mcp](https://github.com/cUDGk/blender-mcp) (persistent headless bpy) and [Kiet1308/blender-headless-fleet](https://github.com/Kiet1308/blender-headless-fleet): 0 stars each.
  - [lxsolutions/studio-foundation](https://github.com/lxsolutions/studio-foundation) "bforge": a headless Blender asset forge with 138 ops. 29 stars, source-available.
  - [RFingAdam/mcp-blender](https://github.com/RFingAdam/mcp-blender): 218 tools including "AI generation". 19 stars.
  - Registry entry `io.github.nirholas/blender-mcp` v0.5.0: "Drive a local Blender headlessly: inspect, convert, render and script 3D files." — [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?search=blender)
  - Hosted option: `dev.willitblender/willitblender` v0.5.0, "Blender-as-a-service for agents", remote URL `https://willitblender.dev/mcp`. — [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?search=blender)
  - Source for the GitHub entries above: [GitHub search "blender mcp headless"](https://github.com/search?q=blender+mcp+headless)
- **Blender-based Claude Code plugins/skills for 3D generation:**
  - [elithril/blender-kiln](https://github.com/elithril/blender-kiln): "Blender skill and plugin for Claude Code — 3D asset pipeline from text brief to production GLB: Blender MCP, Hunyuan3D generation, texturing, rigging, batch mode". 29 stars, updated 2026-10-06.
  - [FishWoWater/trellis_blender](https://github.com/FishWoWater/trellis_blender): Blender plugin plus MCP for TRELLIS/TRELLIS.2. 74 stars.
  - [LumosLab-Innovation/3D-lab-skills](https://github.com/LumosLab-Innovation/3D-lab-skills): 2 stars.
  - Source: [GitHub search](https://github.com/search?q=mcp+3d+generation)

### Inferences
- For a GPU-less cloud container, Blender MCP is the wrong primary tool for photo-to-3D. The generation happens on the Tripo, Rodin or Hunyuan cloud APIs anyway, and Blender only imports the result. Calling those APIs directly (Meshy/Tripo/fal MCP or the Rodin skill) avoids installing Blender and running an Xvfb virtual display.
- Headless Blender (`blender -b` with bpy scripts) is still useful after generation for format conversion (GLB↔OBJ/STL/FBX), decimation and renders. The headless forks or a plain bpy script could cover that, but whether Blender can be downloaded through this proxy was not tested. download.blender.org was not probed.

### Gaps
- I could not confirm whether ahujasid/blender-mcp's Rodin and Hunyuan paths take an input image (true image-to-3D) or only text prompts in the current release. The README excerpt only showed the reference-image scene demo.
- The exact last-commit date for ahujasid/blender-mcp was not shown. The PyPI release of 2026-10-06 shows it is active.

---

## 3. Claude Code plugins and Agent Skills for 3D generation, and what the session catalog searches return

### Takeaway
The org-visible Anthropic Directory plugin catalog contains one first-party photo-to-3D plugin, **Meshy** (partner tier, skills only), plus two general plugins with 3D features: **CellCog** (a "3d-model-generation" skill plus an MCP server) and **Car Image API** (a vehicle-only 3D skill). The claude.ai connector registry has no image-to-3D connector, only a Three.js viewer and Trimble SketchUp. The user's own skills contain nothing for 3D. Outside the catalog, the official Rodin skill marketplace is the main Claude-native skill.

### Cited Findings
- **SearchPlugins** (keywords: 3d, image to 3d, mesh, meshy, tripo, blender, glb, 3d model, then hunyuan3d, rodin, fal.ai, replicate, 3d printing, game assets) returned these relevant results. All are in the `anthropic-plugin-directory` marketplace and none is enabled. — SearchPlugins (this session)
  - **Meshy** (plugin_01LLaHeMvnzBdyHYEGGSUNZi): partner publisher `meshy-dev`, v0.6.0, upstream github.com/meshy-dev/meshy-3d-agent. Skills `meshy-3d-generation`, `meshy-3d-printing` and `meshy-openclaw`. "Reach: contained" (no MCP server).
  - **CellCog** (plugin_01Y1FrQ7NpCgsotJqJGNjEhJ): community, v2.3.0, added 2026-10-06. "Generate images, videos, … 3D models … game assets." Includes the skill `3d-model-generation-cellcog`, the skill `game-asset-generation-cellcog` and the MCP server `cellcog`. The backend 3D model and whether it accepts photos are not stated.
  - **Car Image API** by Meter (plugin_01L5gRxPihiU3PwuJCLNr7w1): v1.15.0. "Build a 3D model of any vehicle" via the skill `car-3d`. Vehicle-only and catalog-based, not arbitrary photo-to-3D.
  - **Adjacent, non-generation:** "3D CAD Converter" by ContentaSoft converts STEP/IGES/STL/OBJ/FBX/glTF/3MF, but on a Windows PC. "Simplio3D" is a product configurator. "3DOptix" is optical simulation.
- **SearchMcpRegistry** (claude.ai connectors) returned no image-to-3D connector for any keyword set. The closest results:
  - "Three.js 3D Viewer" (authless demo viewer that renders 3D scenes and models; uuid 471ca2be-…)
  - "Trimble SketchUp" ("Create and iterate 3D models for use in SketchUp"; tools `build_model`, `get_docs`, `save_model`; uuid b982ecd1-…)
  - Searches for fal, replicate, hunyuan, rodin and text-to-3d returned only unrelated connectors. — SearchMcpRegistry (this session)
- **SearchSkills** (the user's own skills) returned only `banner-design`, which mentions a "3D" visual style and is not relevant. The user's KIE skills (`kie-generate` etc.) explicitly list 3D as out of scope ("NOT for: … 3D"). — SearchSkills (this session); skill listing in this session
- **Official MCP registry API, search "3d"** (registry.modelcontextprotocol.io). Generation-relevant entries:
  - `io.github.nirholas/threews-3d-studio` 1.0.1 and `threews-3d-studio-free` 1.0.1
  - `io.github.nirholas/3d-agent-mcp` 1.2.2
  - `io.github.RareSense/Nova3D` 0.4.0
  - `io.github.cottom/3dlogo` 1.3.0
  - `com.3dtexel/mcp` (PBR materials, HDRIs and 3D asset search/download)
  - `dev.3dassets/catalogue` (free CC0 GLB models; search, not generation)
  - Searches for "meshy", "tripo" and "hunyuan" returned no matching registry servers ("tripo" matched only a Tripoli timezone server). The "rodin" and "trellis" queries timed out. — [MCP registry search=3d](https://registry.modelcontextprotocol.io/v0/servers?search=3d); [search=glb](https://registry.modelcontextprotocol.io/v0/servers?search=glb); [search=blender](https://registry.modelcontextprotocol.io/v0/servers?search=blender)
- **Rodin3D Skills** is a Claude Code plugin marketplace (`/plugin marketplace add DeemosTech/rodin3d-skills`) — [GitHub](https://github.com/DeemosTech/rodin3d-skills).
- **[DojoCodingLabs/remotion-superpowers](https://github.com/DojoCodingLabs/remotion-superpowers):** a Claude Code plugin with 5 MCP servers that lists "3D". 130 stars. Its 3D is likely scene or animation work, not photo-to-mesh (unverified).
- **Directories:** [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) (95.9k stars) and [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) (76.6k stars) are the main curated lists. [butzhang/awesome-3d-mcp](https://github.com/butzhang/awesome-3d-mcp) is a 3D-specific list but stale (last updated 2025-10-28). — [GitHub search](https://github.com/search?q=mcp+3d)
- **Glama** lists the Tripo servers (VAST-AI-Research/tripo-mcp, pasie15/tripo-ai-mcp-server), a "Trellis MCP Server", a Meshy MCP server and fal servers. — [Glama Tripo](https://glama.ai/mcp/servers/VAST-AI-Research/tripo-mcp); [Glama Meshy](https://glama.ai/mcp/servers/apdm4ty7gp); [Glama Trellis](https://glama.ai/mcp/servers/zmzgbi9ia8)

### Inferences
- **Lowest-friction installs in this org's catalog:** Meshy (Anthropic Directory, partner) for the skills route. For an MCP route, the official `@meshy-ai/meshy-mcp-server` via `claude mcp add-json`.
- **Rodin:** the official `rodin3d-skills` plugin marketplace.
- **Best breadth:** fal's hosted MCP (an http transport `claude mcp add`).
- **Every route needs:** a vendor API key, and the vendor's API host (plus its result-download CDN) added to the cloud environment's allowed domains.
- **KIE AI:** api.kie.ai is reachable from this container and already configured for this user, but I found no evidence that KIE offers a 3D or image-to-mesh model. The user's KIE skills state 3D is out of scope.

### Gaps
- Smithery, mcp.so and skillsmp could not be checked directly within the tool budget. Several third-party directory sites (mcpservers.org, getdrio.com) fail DNS from WebFetch in this environment.
- I could not determine CellCog's 3D backend, whether it accepts photos, or its pricing.
- Result-download CDN hostnames for each vendor (needed for the allowlist) were not verified.
