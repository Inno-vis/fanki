import { expect, test, type Page, type Route } from '@playwright/test';

// A fake Apps Script: the app build points at https://mock.fanki.test/exec (see `npm run e2e`).
const API = 'https://mock.fanki.test/exec';

type Event = { event_id: string; card_id: string; rating: number };

function mockServer(
  settings: Record<string, unknown> = { new_per_day: 5, cooldown_minutes: 0, show_french_help: true },
  breaks: string[] = [],
  extraCards: Record<string, unknown>[] = []
) {
  settings = { curriculum_only: false, ...settings }; // the mock has no Curriculum tab
  const log = new Map<string, Event>();
  let posts = 0;
  let loseNextReply = false;
  const cards = ['huis', 'tafel', 'stoel', 'raam', 'boek'].map((nl, i) => ({
    id: `c_${i}`, type: 'word', nl, article: 'de', pos: 'noun', fr: `fr-${nl}`, example_nl: '', example_fr: '',
    tags: i < 2 ? ['huishouden'] : ['reizen'], tags_source: 'manual', flags: [], added: '2026-09-27', active: true
  }));
  cards.unshift(...(extraCards as typeof cards));
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
            tags: [
              { tag: 'huishouden', label_nl: 'huishouden', label_fr: 'la maison' },
              { tag: 'reizen', label_nl: 'reizen', label_fr: 'voyages' },
              { tag: 'emoji', label_nl: 'emoji', label_fr: 'emoji', subject_nl: 'Wat is dit?' }
            ],
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

  // From here rate 😎 Makkelijk until the offer. The 10-minute repeats of the cards rated ✅ Goed before the
  // pause are shown first and never count: the label never goes past "3 van 3 kaarten".
  const offer = page.getByText('Sessie voltooid! Wil je doorgaan?');
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole('button', { name: 'Antwoord tonen' }).or(offer)).toBeVisible();
    if (await offer.isVisible()) break;
    await page.getByRole('button', { name: 'Antwoord tonen' }).click();
    await page.getByRole('button', { name: /^Makkelijk, / }).click();
    await expect(page.getByText(/^[0-3] van 3 kaarten$/)).toBeVisible();
  }
  await expect(page.getByText('3 van 3 kaarten')).toBeVisible();
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

test('enkel/emoji card, 🔊 without a Dutch voice, and 🚩 flags (flag, note, list, copy, resolve)', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const emoji = {
    id: 'E-01', type: 'oneway', nl: '🛏️', article: '', pos: 'emoji', fr: '', example_nl: '', example_fr: '', tags: ['emoji'],
    tags_source: 'manual', flags: [], answer: 'het bed', added: '2026-09-01', active: true
  };
  const server = mockServer({ new_per_day: 5, cooldown_minutes: 0, show_french_help: true }, [], [emoji]);
  await server.install(page);
  // Simulate a phone without a Dutch voice (the test machine may have one): hide every nl-* voice.
  await page.addInitScript(() => {
    if (!('speechSynthesis' in window)) return;
    const orig = speechSynthesis.getVoices.bind(speechSynthesis);
    speechSynthesis.getVoices = () => orig().filter((v) => !/^nl/i.test(v.lang));
  });
  await page.goto('/fanki/dev/');
  await expect(page.getByText('Laatst gesynchroniseerd: zojuist')).toBeVisible({ timeout: 20_000 });

  // The oldest card comes first: the emoji card, with its subject label; the answer only after the reveal.
  await page.getByRole('button', { name: 'Starten' }).click();
  await expect(page.getByText('Wat is dit?')).toBeVisible();
  await expect(page.getByText('🛏️')).toBeVisible();
  await expect(page.getByText('het bed')).toBeHidden();
  await page.getByRole('button', { name: 'Antwoord tonen' }).click();
  const overlay = page.getByRole('dialog', { name: 'De vier knoppen' });
  await expect(overlay).toBeVisible(); // first session in a fresh browser: the one-time French overlay
  await overlay.getByRole('button', { name: 'Klaar' }).click();
  await expect(page.getByText('het bed')).toBeVisible();

  // 🔊 on a phone/browser without a Dutch voice → clear message.
  await page.getByRole('button', { name: 'Luisteren' }).first().click();
  await expect(page.getByText('Geen Nederlandse stem op deze telefoon.')).toBeVisible();

  // 🚩 flag this card with a note; the review goes on.
  // Marked 3 times (it happens): still ONE card in the list and in the count.
  await page.getByRole('button', { name: 'Kaart markeren' }).click();
  await page.getByRole('button', { name: 'Kaart markeren' }).click();
  await page.getByRole('button', { name: 'Kaart markeren' }).click();
  await expect(page.getByText('Gemarkeerd', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ notitie' }).click();
  await page.getByPlaceholder('Notitie (mag leeg)').fill('waarom geen emoji?');
  await page.getByRole('button', { name: 'Opslaan' }).click();
  await page.getByRole('button', { name: /^Makkelijk, / }).click();
  await page.getByRole('button', { name: /Terug/ }).click();

  // Menu (tap "Fanki") → Gemarkeerd → copy text → Opgelost.
  await page.getByRole('button', { name: 'Menu openen' }).click();
  await expect(page.getByRole('menuitem', { name: /Gemarkeerd/ })).toContainText('1');
  await page.getByRole('menuitem', { name: /Gemarkeerd/ }).click();
  await expect(page.getByText('🛏️ (het bed)')).toBeVisible();
  await expect(page.locator('.mark-item')).toHaveCount(1);
  await expect(page.locator('.mark-times')).toHaveText(' 3×');
  await expect(page.getByText('“waarom geen emoji?”')).toBeVisible();
  await page.getByRole('button', { name: 'Kopieer naar klembord' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Fanki: gemarkeerde kaarten');
  expect(copied).toContain('🛏️ (het bed) · waarom geen emoji?');
  await page.getByRole('button', { name: 'Opgelost' }).click();
  await expect(page.getByText('Opgelost (1)')).toBeVisible();
  await page.getByRole('button', { name: 'Klaar' }).click();
  await page.getByRole('button', { name: 'Menu openen' }).click();
  await expect(page.getByRole('menuitem', { name: /Gemarkeerd/ })).toHaveText(/^🚩 Gemarkeerd$/);
});
