# SPM Home Lab: rollback snapshot, 2026-10-07

This is the live state of the Instatic page **SPM Home Lab** (`/home-lab`, pageId `-yR6jxax4og1b4rJgXsM1`), saved just before the galaxy (2nd hero object) was swapped for the headset GLB.

The hero at this point:
- Vesper scene: orb, then galaxy, then brain.
- SPM tint G.
- V3 text sweep on the 3 headlines.
- White Apple-style glass menu.

## Restore the hero only (the usual case)

The GLB swap only touches these two files. To roll back, write them back:

1. Run `site_write_code_asset` with path `src/scripts/hlab-hero-vesper.js`, type `script`, and content `scripts/hlab-hero-vesper.js`. The file is about 107K chars, so write it in chunks with the `/*__HLAB_CONT__*/` marker plus `site_patch_code_asset`.
2. Run `site_write_code_asset` with path `src/styles/hlab-x8-hero-vesper.css`, type `style`, and content `styles/hlab-x8-hero-vesper.css`.
3. Check that the stored hashes match the table below.
4. Run `site_publish`, only with approval.

If the hero markup was changed too, put the stage back with `site_replace_node_html`:
- Node: hero header `rGZYX-wpffO7mODF6OVaS`.
- Source: the `<header … class="hlab-hero">` element in `page/home-lab-root.html`.

Do **not** open or render the Home Lab page in the Instatic editor, because it freezes the editor.

## Full restore

1. Write every file below to its path.
2. If the page body changed, replace root node `E2CueHP6Ha_sUGglkHafm` with `page/home-lab-root.html`.

Notes on the files:
- Every file is self-guarded and inert outside `/home-lab`. This is needed because the MCP stores them as all-pages, priority 100.
- Styles load alphabetically, so keep the `x1`…`x8` names.
- The 69 `hlab-*` classes in the design system are not included here. The GLB swap does not touch them.

| Path | sha256 |
|---|---|
| `src/scripts/hlab-buttons.js` | `087a887304f5ed2d7ddd1b90491d966bd9a8d769019a0fd3f6507801fed3ba48` |
| `src/scripts/hlab-fs.js` | `e2a451a6c267a2ab48ab66806932a5457c30acca507c7eeb17cb7d6b563b7de8` |
| `src/scripts/hlab-hero-nav.js` | `7a7ad934a3013642177e6d290132d3ec1ca6825f81951965f1787d94e926ee2f` |
| `src/scripts/hlab-hero-scroll.js` | `6e38f1c33623c60a663ab70056a7e4bffad95453947209ef5107290954e4e33f` |
| `src/scripts/hlab-hero-vesper.js` | `07c8d37bd0deaa72a6da9c64fd87698e5ea06a70ac253b05fee77bc7739e9ea1` |
| `src/scripts/hlab-review.js` | `1fe65708c199c51684efda767d66acc60bacb2d9f94455f34d06dcd4cacd879c` |
| `src/scripts/hlab-sections.js` | `a806f4af44bd1631116d4d185755dc779ae5e771a3b71cbe622bdde4e305c8c7` |
| `src/scripts/hlab-spm-a11y.js` | `be085eb2e5ba3763e3923068d9afe5eb4f33a32917a5f0972ddbe2f812716a8c` |
| `src/scripts/hlab-spm-chrome.js` | `6a67e7a4dc27f9b0c8a38f992a759b676a280a0f6efddea2e5a46138b308536d` |
| `src/scripts/hlab-spm-faq.js` | `e2c380e69547e2be83510de7ad68c48ec66c0fe6aabf0807a89c664cb689fe0b` |
| `src/scripts/hlab-spm-feature-sweep.js` | `3f6890e9a0e34764df38615c76dcd1f511b7d5ee5f0c997a007b678c0d26d0ca` |
| `src/scripts/hlab-spm-footer-fx.js` | `bd29bbc2c164e6ebbb5701dd723e72682b54c89d84e6dfd20cc909f41b7116ea` |
| `src/scripts/hlab-spm-footer.js` | `1b4828c05213b0d59d7f3d22e59a2ba434f725dd3bd5b237d416b731353d47ca` |
| `src/scripts/hlab-spm-lazy-video.js` | `74461a15a6864301744b4884f026bf82acdd9c913b5daa122c79e9f2d66c03d7` |
| `src/scripts/hlab-spm-lead-form.js` | `b9832bd252ccb686001cf9634ba8f2427ab37348aa89d1053ff11c112f8eec38` |
| `src/scripts/hlab-spm-logos.js` | `49d8aa7078210691f8f6bbd748fabf34e49944d359a614bb05232b5d17c041ad` |
| `src/scripts/hlab-spm-scroll.js` | `05366312ca971851a6972fe00df39780a24b555e7137bac5a0c3c7ec3069ad6b` |
| `src/scripts/hlab-spm-seo.js` | `33cd0af7a229b70fd22501a9d882ae8d7b47bcb2bdff43fff9cadb1f3fd80a27` |
| `src/scripts/hlab-spm-teams.js` | `a4275f2847e57c9bd29b448bdb4fc82b99b4cd46c6c60ee76bf4133fe52595cc` |
| `src/scripts/hlab-tm2.js` | `37bb795a06d95f971d440d1ecddd99fc439ed384fd19214f9871f72ddb4e9a3e` |
| `src/styles/hlab-styles.css` | `488c5d445b28093d02857d307edba35fabc797c341d8bf3a4d458a60591f46eb` |
| `src/styles/hlab-x1-hero.css` | `dd1ae358a7189a84c184223897fb06f60438d9bd29ad58c0d717b0a7c0ac9e01` |
| `src/styles/hlab-x2-logo-grid.css` | `a5789720cd5ced77e1bb53d1b4a7f279093e462b126480c37a6f203b7be509df` |
| `src/styles/hlab-x3-buttons.css` | `344b4dbbe3c5af9d6b788954597f90989127cf7f39ecf7be98878d22d5e45e46` |
| `src/styles/hlab-x4-mobile.css` | `b23c37724d7649bf932cf4af7412b7af7a4678c758bfa6abcb8e2fe1c80851f4` |
| `src/styles/hlab-x5-tm2.css` | `d4f84fd3f3ee9c2f2784ab4530b384f032ae48b8f8dd2e19e667bf2778ae124b` |
| `src/styles/hlab-x6-fs.css` | `01500fc7aea05a2e0e249b4e8975f3794657c77d0f1c10eb0f19eedfff4705df` |
| `src/styles/hlab-x7-review.css` | `01300473b8a9078284c8c02dbc00dfb1e6a5b89abc4a1d94784545ea8c17217b` |
| `src/styles/hlab-x8-hero-vesper.css` | `8ae1b96d76bc0c5f6b3e9cc03ba13d62c3e9889ff43c4eedede2bc6c62211e40` |

`page/home-lab-root.html` is the output of `site_get_node_html` on the page root.
