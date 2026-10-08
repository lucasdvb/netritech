// A stand-in for Cloudflare D1 over node:sqlite, so the server's real SQL runs in the tests:
// prepare(sql).bind(...).run() / .all() / .first(), and batch([...]) as one transaction.
import { DatabaseSync } from 'node:sqlite';

export function d1(file = ':memory:') {
  const db = new DatabaseSync(file);
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async () => db.prepare(sql).get(...args) ?? null,
    exec: () => db.prepare(sql).run(...args),
  });
  return {
    prepare: (sql) => stmt(sql),
    async batch(list) {
      db.exec('BEGIN');
      try { for (const s of list) s.exec(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
      return list.map(() => ({ success: true }));
    },
    raw: db,
  };
}
