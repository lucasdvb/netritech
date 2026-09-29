#!/usr/bin/env python3
"""Upload a local file to KIE AI file storage and print a public URL usable with -i in kie_image.py / kie_video.py.

Usage:
  kie_upload.py path/to/file.png [more files ...]
Files are temporary (KIE deletes them after about 3 days).
API key: KIE_AI_API_KEY env var, else read from .mcp.json (kie-ai server env).
"""
import mimetypes, os, sys, uuid, json, urllib.request

from kie_image import api_key

UPLOAD = "https://kieai.redpandaai.co/api/file-stream-upload"


def upload(path, key):
    name = os.path.basename(path)
    boundary = uuid.uuid4().hex
    ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
    parts = []
    for field, value in (("uploadPath", "images/user-uploads"), ("fileName", name)):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"\r\n\r\n{value}\r\n'.encode())
    with open(path, "rb") as f:
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: {ctype}\r\n\r\n'.encode()
            + f.read() + b"\r\n"
        )
    parts.append(f"--{boundary}--\r\n".encode())
    req = urllib.request.Request(
        UPLOAD,
        data=b"".join(parts),
        headers={"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.load(r)
    if not res.get("success", res.get("code") == 200):
        sys.exit(f"upload failed: {res}")
    return res["data"]["downloadUrl"]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    key = api_key()
    for path in sys.argv[1:]:
        print(upload(path, key))


if __name__ == "__main__":
    main()
