/* Optional self-hosted scheduler. Run under a process supervisor; no credentials in arguments. */
const origin = process.env.APP_ORIGIN;
const secret = process.env.WATER_PUSH_CRON_SECRET;
let url;
try {
  url = new URL('/api/cron/water-push', origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw Error('HTTPS required');
  if (url.username || url.password || !secret || secret.length < 32) throw Error('configuration missing');
} catch {
  console.error('Set APP_ORIGIN to an HTTPS app origin (or local development URL) and WATER_PUSH_CRON_SECRET to a secret of at least 32 characters.');
  process.exit(1);
}
let stopped = false;
let timer;
async function tick() {
  try {
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(45000) });
    if (!response.ok) console.error(`Water push scheduler: server returned ${response.status}; check server setup.`);
    else {
      const result = await response.json();
      console.log(`Water push scheduler: attempted=${result.attempted}, accepted=${result.accepted}, expired=${result.expired}, failed=${result.failed}.`);
    }
  } catch { console.error('Water push scheduler: request failed or timed out.'); }
  if (!stopped) timer = setTimeout(tick, 60000);
}
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => { stopped = true; clearTimeout(timer); });
void tick();
