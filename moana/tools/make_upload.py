"""Builds themeFilesUpsert batches (GraphQL variables) from ../theme for the Admin API.
JSON files are compacted; binary assets go as BASE64. Batch boundaries follow Shopify's validation order."""
import json, base64, os, sys
ROOT = os.path.join(os.path.dirname(__file__), '..', 'theme')
THEME_ID = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'dev', 'out', 'upload')
BIN = {'.webp', '.jpg', '.png'}
SKIP_BIN = {'about-800.jpg', 'about-1200.jpg', 'hero-bg-800.jpg', 'hero-bg-1600.jpg', 'hero-bg-800.webp', 'hero-bg-1600.webp'}  # already in the duplicated theme, unchanged

def body(path):
    ext = os.path.splitext(path)[1]
    raw = open(os.path.join(ROOT, path), 'rb').read()
    if ext in BIN:
        return {'type': 'BASE64', 'value': base64.b64encode(raw).decode()}
    text = raw.decode('utf8')
    if ext == '.json':
        text = json.dumps(json.loads(text), ensure_ascii=False, separators=(',', ':'))
    return {'type': 'TEXT', 'value': text}

def batch(name, files):
    payload = {'themeId': THEME_ID, 'files': [{'filename': f, 'body': body(f)} for f in files]}
    s = json.dumps(payload, ensure_ascii=False)
    open(os.path.join(OUT, name + '.json'), 'w').write(s)
    print(name, len(files), 'files', len(s), 'chars')

ls = lambda d: sorted(os.path.join(d, f) for f in os.listdir(os.path.join(ROOT, d)))
assets = [a for a in ls('assets') if os.path.basename(a) not in SKIP_BIN and not a.endswith('.woff2')]
batch('1-base', ls('snippets') + ls('locales') + ls('config') + [a for a in assets if a.endswith(('.css', '.js'))])
batch('2-images', [a for a in assets if not a.endswith(('.css', '.js'))])
secs = [s for s in ls('sections') if s.endswith('.liquid')]
half = len(secs) // 2
batch('3a-sections', secs[:half])
batch('3b-sections', secs[half:])
batch('4-templates', [s for s in ls('sections') if s.endswith('.json')] + ls('templates') + ls('layout'))
