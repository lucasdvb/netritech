// Photo data lives outside the memory cache and is read on demand (Photos and backups load this).
import * as store from './store.js';

const disk = () => store.disk();

export const blobs = {
  async get(id) {
    const r = await disk().get('photoBlobs', id);
    return r && !r.deletedAt ? r : null;
  },
  async put(id, blob) {
    const ts = store.now();
    const prev = await disk().get('photoBlobs', id);
    const rec = { id, blob, createdAt: (!prev?.deletedAt && prev?.createdAt) || ts, updatedAt: ts, rev: (prev?.rev || 0) + 1 };
    await disk().write([{ store: 'photoBlobs', value: rec }, store.outboxEntry('photoBlobs', rec, 'put')]);
  },
  async del(id) {
    const prev = await disk().get('photoBlobs', id);
    if (!prev || prev.deletedAt) return;
    const t = store.tombstoneOf(prev, store.now());
    await disk().write([{ store: 'photoBlobs', value: t }, store.outboxEntry('photoBlobs', t, 'delete')]);
  },
  all: async () => (await disk().getAll('photoBlobs')).filter((b) => !b.deletedAt),
};
