/* Offline unit checks for the public shell. These do not replace a browser/device test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p));
const publicFile = url => path.join(root, 'public', url.replace(/^\//, ''));
const manifest = read('src/app/manifest.ts').toString();
const layout = read('src/app/layout.tsx').toString();
for (const [name, size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]]) {
  const url = `/icons/${name}`;
  assert.ok((manifest + layout).includes(url), `${url} must be referenced`);
  const data = fs.readFileSync(publicFile(url));
  assert.equal(data.subarray(0,8).toString('hex'), '89504e470d0a1a0a', `${url} must be PNG`);
  assert.equal(data.readUInt32BE(16), size);
  assert.equal(data.readUInt32BE(20), size);
}
const handlers = {};
const saved = new Map();
const cache = {
  async addAll(urls) {
    for (const url of urls) {
      assert.ok(fs.existsSync(publicFile(url)), `Missing precache asset ${url}`);
      saved.set(url, new Response(read('public' + url)));
    }
  },
  async match(request) { return saved.get(typeof request === 'string' ? request : new URL(request.url).pathname); },
  async put(request, response) { saved.set(new URL(request.url).pathname, response); },
  async keys() { return [...saved.keys()].map(url => ({url: `https://example.test${url}`})); },
  async delete(request) { return saved.delete(new URL(request.url).pathname); },
};
const caches = {async open() {return cache;}, async keys() {return [];}, async delete() {}, async match(url) {return cache.match(url);}};
let online = true;
const self = {location: {origin:'https://example.test'}, clients:{async claim() {}}, async skipWaiting() {}, addEventListener(name, cb) {handlers[name] = cb;}};
vm.runInNewContext(read('public/sw.js').toString(), {self, caches, URL, Response, fetch: async () => {if (!online) throw Error('offline'); return new Response('online');}});
(async () => {
  let pending;
  handlers.install({waitUntil(p) {pending = p;}});
  await pending;
  assert.ok(saved.has('/offline.html'));
  handlers.activate({waitUntil(p) {pending = p;}});
  await pending;
  let response;
  handlers.fetch({request:{method:'GET',url:'https://example.test/api/dashboard',mode:'cors'},respondWith(p) {response = p;}});
  assert.equal(response, undefined, 'private API requests must bypass the worker');
  online = false;
  handlers.fetch({request:{method:'GET',url:'https://example.test/',mode:'navigate'},respondWith(p) {response = p;}});
  assert.match(await (await response).text(), /offline/i);
  console.log('Public shell assets, simulated install and offline privacy checks passed. Real browser installation not tested.');
})().catch(error => {console.error(error); process.exitCode = 1;});
