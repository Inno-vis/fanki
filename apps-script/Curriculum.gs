// Curriculum: reading the tab + the Dashboard block.
// The phone decides what to introduce (src/curriculum.ts). This file mirrors that calculation ONLY
// to show the status on the Dashboard — keep the two in sync (see docs/SHEET.md › Curriculum).

var DAY_MS = 86400000;

/** Active + inactive rows, sorted by order. max_wait_days = null when blank. */
function readCurriculum_() {
  var sh = ss_().getSheetByName('Curriculum');
  if (!sh) return [];
  return readTable_(sh).rows.filter(function (r) { return String(r.tag).trim(); }).map(function (r) {
    var wait = r.max_wait_days;
    return {
      order: Number(r.order) || 0,
      tag: String(r.tag).trim().toLowerCase(),
      unlock_threshold: r.unlock_threshold === '' ? 0.8 : Number(r.unlock_threshold),
      min_reviews: r.min_reviews === '' ? 2 : Number(r.min_reviews),
      max_wait_days: wait === '' || wait === null ? null : Number(wait),
      active: r.active === '' ? true : bool_(r.active),
      open: openCode_(r.open)
    };
  }).sort(function (a, b) { return a.order - b.order; });
}

/**
 * Same rules as src/curriculum.ts:
 *  - card is mature: primary-track stability >= mature_stability_days AND reps >= row.min_reviews
 *  - score = mature / active cards with the tag (a tag without cards counts as passed)
 *  - first active row is unlocked; row N+1 is unlocked when row N is unlocked AND
 *    (score >= threshold OR max_wait_days passed since the tag's first shown card)
 *  - inactive rows are skipped: they don't gate the next row
 */
function curriculumStatus_(rows, cards, progressByKey, matureDays, now) {
  var out = [];
  var prevOpen = true; // does the previous active row let the next one through?
  var countdown = '';  // days until THIS row unlocks through the previous row's max_wait_days
  rows.filter(function (r) { return r.active; }).forEach(function (row) {
    var tagged = cards.filter(function (c) { return c.tags.indexOf(row.tag) !== -1; });
    var mature = 0, firstShown = null;
    tagged.forEach(function (c) {
      var p = progressByKey[c.id + '|' + (c.type === 'word' ? 'recog' : 'prod')];
      if (!p) return;
      if (Number(p.stability) >= matureDays && Number(p.reps) >= row.min_reviews) mature++;
      var f = toDate_(p.first_review) || toDate_(p.last_review);
      if (f && (!firstShown || f < firstShown)) firstShown = f;
    });
    var score = tagged.length ? mature / tagged.length : 1;
    var unlocked = row.open === 'always' ? true : row.open === 'closed' ? false : prevOpen;
    var waitOver = row.max_wait_days !== null && firstShown && (now - firstShown) >= row.max_wait_days * DAY_MS;
    var passes = score >= row.unlock_threshold || !!waitOver;
    out.push({ order: row.order, tag: row.tag, cards: tagged.length, mature: mature, score: score,
      unlocked: unlocked, passes: passes, firstShown: firstShown, daysLeft: unlocked || row.open === 'closed' ? '' : countdown });
    countdown = '';
    if (unlocked && !passes && row.max_wait_days !== null && firstShown) {
      countdown = Math.max(0, Math.ceil(row.max_wait_days - (now - firstShown) / DAY_MS));
    }
    prevOpen = unlocked && passes;
  });
  return out;
}

/** Writes the Curriculum block on the Dashboard (columns D:I). Throttled to every 10 min unless forced. */
function updateCurriculumDashboard_(force) {
  var cache = CacheService.getScriptCache();
  if (!force && cache.get('curriculum_dash')) return null;
  cache.put('curriculum_dash', '1', 600);

  var ss = ss_();
  var cards = readTable_(ss.getSheetByName('Cards')).rows
    .filter(function (r) { return r.id && bool_(r.active); })
    .map(function (r) { return { id: String(r.id), type: typeCode_(r.type), tags: splitTags_(r.tags) }; });
  var byKey = {};
  readTable_(ss.getSheetByName('Progress')).rows.forEach(function (r) { byKey[r.card_id + '|' + r.track] = r; });
  var status = curriculumStatus_(readCurriculum_(), cards, byKey, Number(readSettings_().mature_stability_days) || 21, new Date());

  var dash = ss.getSheetByName('Dashboard');
  dash.getRange('D1:I40').clearContent();
  var rows = [['Curriculum (tag)', 'gekend', 'score', 'open', 'dagen tot automatisch open', 'eerst gezien']];
  status.forEach(function (s) {
    rows.push([s.tag, s.mature + ' / ' + s.cards, s.score, s.unlocked ? 'ja' : 'nee', s.daysLeft, s.firstShown || '']);
  });
  dash.getRange(1, 4, rows.length, rows[0].length).setValues(rows);
  dash.getRange(1, 4, 1, rows[0].length).setFontWeight('bold').setBackground('#e8eaed');
  if (rows.length > 1) {
    dash.getRange(2, 6, rows.length - 1, 1).setNumberFormat('0%');
    dash.getRange(2, 9, rows.length - 1, 1).setNumberFormat('yyyy-mm-dd');
  }
  dash.getRange(rows.length + 2, 4).setValue('Bijgewerkt: ' + Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm') +
    ' (na herhalingen, max. elke 10 min)');
  return status;
}

/** Sheet value of Curriculum.open → 'auto' | 'always' | 'closed' (blank = auto). */
function openCode_(v) {
  var s = String(v || '').trim().toLowerCase();
  if (s === 'always' || s === 'altijd open') return 'always';
  if (s === 'closed' || s === 'dicht') return 'closed';
  return 'auto';
}
