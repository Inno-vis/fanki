// Admin-only actions (ADMIN_TOKEN). Used by the /retag, /addwords and /promote commands.

function adminListCards_() {
  return { cards: readTable_(sheet_('Cards')).rows.filter(function (r) { return r.id; }).map(cardToJson_) };
}

function adminListUntagged_() {
  var cards = readTable_(sheet_('Cards')).rows.filter(function (r) {
    return r.id && bool_(r.active) && splitTags_(r.tags).length === 0 && String(r.tags_source).trim() !== 'manual';
  }).map(cardToJson_);
  return { cards: cards };
}

/** Lists tags; optionally appends new ones: add = [{tag, label_fr, description}]. */
function adminTags_(add) {
  var sh = sheet_('Tags');
  var added = [];
  if (Array.isArray(add) && add.length) {
    withLock_(function () {
      var existing = readTable_(sh).rows.map(function (r) { return String(r.tag).trim().toLowerCase(); });
      add.forEach(function (t) {
        var tag = String(t && t.tag || '').trim().toLowerCase();
        if (!/^[a-z0-9-]{2,30}$/.test(tag) || existing.indexOf(tag) !== -1) return;
        sh.appendRow([tag, String(t.label_fr || ''), String(t.description || '')]);
        existing.push(tag);
        added.push(tag);
      });
    });
  }
  var tags = readTable_(sh).rows.map(function (r) {
    return { tag: String(r.tag).trim().toLowerCase(), label_fr: String(r.label_fr || ''), description: String(r.description || '') };
  }).filter(function (x) { return x.tag; });
  return { tags: tags, added: added };
}

/** updates = [{id, tags: [..]}]. Writes tags_source=auto. Never touches manual rows. */
function adminSetTags_(updates) {
  if (!Array.isArray(updates)) throw apiError_('bad_request', 'updates[] required');
  return withLock_(function () {
    var sh = sheet_('Cards');
    var t = readTable_(sh);
    var known = readTable_(sheet_('Tags')).rows.map(function (r) { return String(r.tag).trim().toLowerCase(); });
    var byId = {};
    t.rows.forEach(function (r) { byId[String(r.id)] = r; });
    var tagsCol = t.headers.indexOf('tags') + 1;
    var updated = [], skipped = [];
    updates.forEach(function (u) {
      var r = byId[String(u && u.id)];
      if (!r) { skipped.push({ id: u && u.id, reason: 'not_found' }); return; }
      if (String(r.tags_source).trim() === 'manual') { skipped.push({ id: r.id, reason: 'manual' }); return; }
      var tags = (u.tags || []).map(function (x) { return String(x).trim().toLowerCase(); }).filter(function (x) { return x; });
      var unknown = tags.filter(function (x) { return known.indexOf(x) === -1; });
      if (unknown.length) { skipped.push({ id: r.id, reason: 'unknown_tags:' + unknown.join(',') }); return; }
      if (tags.length > 3) { skipped.push({ id: r.id, reason: 'too_many_tags' }); return; }
      sh.getRange(r._row, tagsCol, 1, 2).setValues([[tags.join(', '), 'auto']]);
      updated.push(r.id);
    });
    return { updated: updated, skipped: skipped };
  });
}

/** rows = [{type, nl, article, pos, fr, example_nl, example_fr, tags, flags}] → Inbox, status=proposed. */
function adminAppendInbox_(rows) {
  if (!Array.isArray(rows) || !rows.length) throw apiError_('bad_request', 'rows[] required');
  return withLock_(function () {
    var sh = sheet_('Inbox');
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var headers = SCHEMA.Inbox;
    // Idempotent: skip anything whose (type, nl) already exists in Cards or Inbox.
    var key = function (type, nl) { return String(type || 'word') + '|' + String(nl || '').trim().toLowerCase(); };
    var seen = {};
    readTable_(sheet_('Cards')).rows.concat(readTable_(sh).rows)
      .forEach(function (r) { if (r.nl) seen[key(r.type, r.nl)] = true; });
    var skipped = [];
    rows = rows.filter(function (r) {
      var k = key(r.type, r.nl);
      if (!String(r.nl || '').trim() || seen[k]) { skipped.push(r.nl); return false; }
      seen[k] = true;
      return true;
    });
    if (!rows.length) return { appended: 0, skipped: skipped };
    var out = rows.map(function (r) {
      var tags = Array.isArray(r.tags) ? r.tags.join(', ') : String(r.tags || '');
      var flags = Array.isArray(r.flags) ? r.flags.join(', ') : String(r.flags || '');
      return rowFromObject_(headers, {
        id: newId_('c_'), type: CARD_TYPES.indexOf(r.type) === -1 ? 'word' : r.type, nl: String(r.nl || ''),
        article: r.article === 'de' || r.article === 'het' ? r.article : '', pos: String(r.pos || ''),
        fr: String(r.fr || ''), example_nl: String(r.example_nl || ''), example_fr: String(r.example_fr || ''),
        tags: tags, tags_source: tags ? 'auto' : '', flags: flags, added: today, active: true, status: 'proposed'
      });
    });
    sh.getRange(nextRow_(sh, 3), 1, out.length, headers.length).setValues(out);
    return { appended: out.length, skipped: skipped };
  });
}

function adminListInbox_() {
  return {
    rows: readTable_(sheet_('Inbox')).rows.filter(function (r) { return r.nl; }).map(function (r) {
      var c = cardToJson_(r); c.status = String(r.status || ''); return c;
    })
  };
}

/** Moves every status=approved Inbox row into Cards (added = today, active). */
function adminPromoteInbox_() {
  return withLock_(function () {
    var inbox = sheet_('Inbox');
    var cards = sheet_('Cards');
    var t = readTable_(inbox);
    var approved = t.rows.filter(function (r) { return String(r.status).trim() === 'approved' && String(r.nl).trim(); });
    if (!approved.length) return { promoted: [] };
    var existingIds = {};
    readTable_(cards).rows.forEach(function (r) { existingIds[String(r.id)] = true; });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var rows = approved.map(function (r) {
      var o = {};
      CARD_COLS.forEach(function (h) { o[h] = r[h]; });
      if (!o.id || existingIds[String(o.id)]) o.id = newId_('c_');
      o.added = today;
      o.active = true;
      return rowFromObject_(CARD_COLS, o);
    });
    cards.getRange(nextRow_(cards, 3), 1, rows.length, CARD_COLS.length).setValues(rows);
    approved.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (n) { inbox.deleteRow(n); });
    return { promoted: rows.map(function (r) { return { id: r[0], nl: r[2], fr: r[5] }; }) };
  });
}

/** Rewrites Progress from the latest Log snapshot per (card_id, track). */
function adminRebuildProgress_() {
  return withLock_(function () {
    var latest = {};
    readTable_(sheet_('Log')).rows.forEach(function (r) {
      var key = r.card_id + '|' + r.track;
      var ts = toDate_(r.ts);
      if (!ts) return;
      if (latest[key] && latest[key].ts >= ts) return;
      var snap;
      try { snap = JSON.parse(r.snapshot); } catch (e) { return; }
      latest[key] = { ts: ts, card_id: String(r.card_id), track: String(r.track), s: snap };
    });
    var rows = Object.keys(latest).map(function (k) {
      var x = latest[k];
      return [x.card_id, x.track, x.s.state, new Date(x.s.due), x.s.stability, x.s.difficulty, x.s.reps, x.s.lapses, x.ts];
    });
    var sh = sheet_('Progress');
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, SCHEMA.Progress.length).clearContent();
    if (rows.length) sh.getRange(2, 1, rows.length, SCHEMA.Progress.length).setValues(rows);
    return { rows: rows.length };
  });
}

/** Raw values of one tab (for debugging and the slash commands). */
function adminReadTab_(tab, rows) {
  if (!SCHEMA[tab]) throw apiError_('bad_request', 'Unknown tab ' + tab);
  var sh = sheet_(tab);
  var last = rows ? Math.min(Number(rows), sh.getMaxRows()) : Math.max(nextRow_(sh, 1), nextRow_(sh, 3)) - 1;
  var values = last >= 1 ? sh.getRange(1, 1, last, sh.getLastColumn()).getValues() : [];
  return { lastRow: sh.getLastRow(), values: values };
}

/** DEV only: wipes Cards and re-inserts the seed data. */
function adminReseedDev_() {
  if (env_() !== 'DEV') throw apiError_('forbidden', 'reseedDev only runs on DEV');
  return withLock_(function () {
    var sh = sheet_('Cards');
    if (sh.getMaxRows() > 1) sh.getRange(2, 1, sh.getMaxRows() - 1, CARD_COLS.length).clearContent();
    seedCards_(sh);
    applyCardValidation_(sh, false);
    return { rows: nextRow_(sh, 3) - 2 };
  });
}

/** Removes rows written by scripts/smoke.sh (card_id __smoke__) from Log and Progress. */
function adminPurgeSmoke_() {
  return withLock_(function () {
    var removed = 0;
    ['Log', 'Progress'].forEach(function (tab) {
      var sh = sheet_(tab);
      readTable_(sh).rows.filter(function (r) { return String(r.card_id) === '__smoke__'; })
        .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
        .forEach(function (n) { sh.deleteRow(n); removed++; });
    });
    return { removed: removed };
  });
}
