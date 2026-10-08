# Life OS server

One small Cloudflare Worker you own. It syncs your devices, and it never sees your data: every
record is encrypted on the device with your sync key before it's sent, and named with a keyed
hash, so the server holds only opaque names, timestamps and ciphertext.

## Set it up in the dashboard (about five minutes, once)

1. Sign in at **dash.cloudflare.com**. The free plan is plenty.
2. **Storage & databases › D1 SQL database › Create**: name it `lifeos`, then **Create**.
3. **Workers & Pages › Create › Start with Hello World**: name it `lifeos-sync`, then **Deploy**.
4. **Edit code**: select everything and replace it with `worker.js` from this folder. In the app,
   *You › Sync › How to set it up › Copy the server code* copies it for you. Then **Deploy**.
5. The Worker's **Settings › Bindings › Add binding › D1 database**: variable name `DB`,
   database `lifeos`, then **Add binding**.
6. Copy the Worker's address (`https://lifeos-sync.<your-subdomain>.workers.dev`).

Then in Life OS on your phone: **You › Sync**, paste the address, **Check the server**,
**Start sync here**. Copy your sync key somewhere safe. On your computer: **You › Sync**, the
same address, your key, **Join**.

The tables are created by the Worker the first time it's used. The first sync key to use it
becomes its owner; other keys are turned away (set a variable `OPEN` = `1` to allow more).

## Or from a terminal

```sh
npx wrangler d1 create lifeos          # copy the database_id it prints into wrangler.toml
npx wrangler deploy
```

## What it stores

| Table | What |
|---|---|
| `spaces` | your space id and a hash of its password (both derived from your sync key) |
| `items` | one row per record: an opaque name, its last-changed time, which device wrote it, and the ciphertext |

Deleting the database deletes everything on the server; your devices keep their own copies.
