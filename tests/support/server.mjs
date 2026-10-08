// Runs server/worker.js in Node for the tests: node tests/support/server.mjs [port]
// The database is SQLite in memory (tests/support/d1.mjs); requests and responses are the
// standard Request and Response, as on Cloudflare.
import { createServer } from 'node:http';
import worker from '../../server/worker.js';
import { d1 } from './d1.mjs';

export function serve(port, env = { DB: d1() }) {
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, env, close: () => new Promise((r) => server.close(r)) })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2] || 8787);
  await serve(port);
  console.log(`life-os server on http://localhost:${port}`);
}
