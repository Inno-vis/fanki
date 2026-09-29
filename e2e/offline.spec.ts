import { expect, test, type Page, type Route } from '@playwright/test';

// A fake Apps Script: the app build points at https://mock.fanki.test/exec (see `npm run e2e`).
const API = 'https://mock.fanki.test/exec';

type Event = { event_id: string; card_id: string; rating: number };

function mockServer(settings: Record<string, unknown> = { new_per_day: 5, cooldown_minutes: 0, show_french_help: true }, breaks: string[] = []) {
  settings = { curriculum_only: false, ...settings }; // the mock has no Curriculum tab
  const log = new Map<string, Event>();
  let posts = 0;
  let loseNextReply = false;
  const cards = ['huis', 'tafel', 'stoel', 'raam', 'boek'].map((nl, i) => ({
    id: `c_${i}`, type: 'word', nl, article: 'de', pos: 'noun', fr: `fr-${nl}`, example_nl: '', example_fr: '',
    tags: i < 2 ? ['huishouden'] : ['reizen'], tags_source: 'manual', flags: [], added: '2026-09-27', active: true
  }));
  const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

  return {
    log,
    posts: () => posts,
    loseNextReply: () => (loseNextReply = true),
    async install(page: Page) {
      await page.context().route(`${API}**`, async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (req.method() === 'GET') {
          const action = url.searchParams.get('action');
          if (action === 'ping') return json(route, { ok: true, env: 'DEV' });
          if (action === 'state') return json(route, { ok: true, progress: [] });
          return json(route, {
            ok: true, env: 'DEV', serverTime: new Date().toISOString(), cards,
            settings,
            tags: [{ tag: 'huishouden', label_nl: 'huishouden', label_fr: 'la maison' }, { tag: 'reizen', label_nl: 'reizen', label_fr: 'voyages' }],
            compliments: ['Goed zo!'], curriculum: [], breaks
          });
        }
        posts++;
        const body = JSON.parse(req.postData() || '{}');
        const accepted: string[] = [];
        const duplicate: string[] = [];
        for (const e of body.events as Event[]) {
          if (log.has(e.event_id)) duplicate.push(e.event_id);
          else {
            log.set(e.event_id, e);
            accepted.push(e.event_id);
          }
        }
        if (loseNextReply) {
          loseNextReply = false; // stored, but the phone never hears back (Google error page)
          return route.fulfill({ status: 200, contentType: 'text/html', headers: { 'access-control-allow-origin': '*' }, body: '<html>oops</html>' });
        }
        return json(route, { ok: true, accepted, duplicate, rejected: [] });
      });
    }
  };
}

async function reviewCards(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: 'Antwoord tonen' }).click();
    const overlay = page.getByRole('dialog', { name: 'De vier knoppen' });
    if (await overlay.isVisible()) await overlay.getByRole('button', { name: 'Klaar' }).click();
    await page.getByRole('button', { name: /^Goed, / }).click();
  }
}

test('offline: review without internet, reconnect, every review reaches the server exactly once', async ({ page, context }) => {
  const server = mockServer();
  await server.install(page);

  // 1. First launch online: cards are downloaded and the service worker caches the app.
  await page.goto('/fanki/dev/');
  await expect(page.getByText('Laatst gesynchroniseerd: zojuist')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('5 kaarten')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);

  // 2. No internet, and the app is reopened: it still loads, with the cards.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Geen internet').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Starten' })).toBeEnabled();

  // 3. Review 3 cards offline.
  await page.getByRole('button', { name: 'Starten' }).click();
  await expect(page.getByText('0 van 15 kaarten')).toBeVisible();
  await reviewCards(page, 3);
  await expect(page.getByText('3 van 15 kaarten')).toBeVisible();
  await page.getByRole('button', { name: /Terug/ }).click();
  await expect(page.getByText('3 antwoorden nog niet gesynchroniseerd')).toBeVisible();
  expect(server.log.size).toBe(0);

  // 4. Internet is back: the queue is pushed, and the first reply gets lost on the way.
  server.loseNextReply();
  await context.setOffline(false);
  await expect(page.getByText('3 antwoorden nog niet gesynchroniseerd')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText('Laatst gesynchroniseerd: zojuist')).toBeVisible();

  // The resend after the lost reply was de-duplicated: 3 reviews, each exactly once.
  expect(server.posts()).toBeGreaterThanOrEqual(2);
  expect(server.log.size).toBe(3);
  expect([...server.log.values()].every((e) => e.rating === 3)).toBe(true);

  // 5. Another sync sends nothing new.
  await page.getByRole('button', { name: 'Synchroniseren' }).click();
  await expect(page.getByText('Laatst gesynchroniseerd: zojuist')).toBeVisible();
  expect(server.log.size).toBe(3);

  // 6. Reviews and progress survive a restart.
  await page.reload();
  const stored = await page.evaluate(
    () =>
      new Promise<{ progress: number; queue: number }>((res) => {
        const r = indexedDB.open('fanki-dev');
        r.onsuccess = () => {
          const tx = r.result.transaction(['progress', 'queue']);
          const p = tx.objectStore('progress').count();
          const q = tx.objectStore('queue').count();
          tx.oncomplete = () => res({ progress: p.result, queue: q.result });
        };
      })
  );
  expect(stored).toEqual({ progress: 3, queue: 0 });
});

test('topics, pause and the one-time break prompt', async ({ page }) => {
  const server = mockServer(
    { new_per_day: 5, cooldown_minutes: 60, min_reviews_to_count: 2, session_max_cards: 3, show_french_help: true },
    ['Zoek iets ronds.']
  );
  await server.install(page);
  await page.goto('/fanki/dev/');
  await expect(page.getByText('Laatst gesynchroniseerd: zojuist')).toBeVisible({ timeout: 20_000 });

  // Kies een onderwerp: only "huishouden" → 2 new cards.
  await page.getByRole('button', { name: 'Onderwerp: alle' }).click();
  await page.getByRole('button', { name: /^huishouden/ }).click();
  await page.getByRole('button', { name: 'Klaar' }).click();
  await expect(page.getByRole('button', { name: 'Onderwerp: huishouden' })).toBeVisible();
  await expect(page.locator('.stat').nth(1)).toContainText('2');

  // Back to all topics, do 3 cards, stop → pause starts → break prompt once.
  await page.getByRole('button', { name: 'Onderwerp: huishouden' }).click();
  await page.getByRole('button', { name: 'Alle onderwerpen' }).click();
  await page.getByRole('button', { name: 'Klaar' }).click();
  // "Terug" after 2 cards only pauses: no countdown, "Doorgaan" continues the same session.
  await page.getByRole('button', { name: 'Starten' }).click();
  await reviewCards(page, 2);
  await page.getByRole('button', { name: /Terug/ }).click();
  await expect(page.getByRole('button', { name: 'Doorgaan (2 van 3 kaarten)' })).toBeEnabled();
  await expect(page.getByText(/Volgende sessie/)).toBeHidden();
  await page.reload(); // also after closing the app
  await page.getByRole('button', { name: 'Doorgaan (2 van 3 kaarten)' }).click();
  await expect(page.getByText('2 van 3 kaarten')).toBeVisible();

  // Third card reaches the cap → offer → Stoppen ends the session → pause + break prompt.
  await reviewCards(page, 1);
  await expect(page.getByText('Sessie voltooid! Wil je doorgaan?')).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByText('Sessie voltooid!')).toBeVisible();
  await expect(page.getByText('Zoek iets ronds.')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();

  // Home: Starten is replaced by the countdown, and it survives a restart.
  await expect(page.getByRole('button', { name: /Volgende sessie over (60|59) minuten/ })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: /Volgende sessie over (60|59) minuten/ })).toBeDisabled();
  await expect(page.getByText('Zoek iets ronds.')).toBeHidden();
});
