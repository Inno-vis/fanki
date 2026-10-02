// Admin-only actions (ADMIN_TOKEN). Used by the /retag, /addwords and /promote commands.

function adminListCards_() {
  return { cards: readTable_(sheet_('Cards')).rows.filter(function (r) { return r.id; }).map(cardToJson_) };
}

function adminListUntagged_() {
  var cards = readTable_(sheet_('Cards')).rows.filter(function (r) {
    return r.id && bool_(r.active) && splitTags_(r.tags).length === 0 && sourceCode_(r.tags_source) !== 'manual';
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
        var row = {}; row.tag = tag; row.label_nl = String(t.label_nl || tag); row.label_fr = String(t.label_fr || '');
        row.description = String(t.description || '');
        sh.getRange(nextRow_(sh, 1), 1, 1, SCHEMA.Tags.length).setValues([rowFromObject_(SCHEMA.Tags, row)]);
        existing.push(tag);
        added.push(tag);
      });
    });
  }
  var tags = readTable_(sh).rows.map(function (r) {
    return { tag: String(r.tag).trim().toLowerCase(), label_nl: String(r.label_nl || ''), label_fr: String(r.label_fr || ''), description: String(r.description || '') };
  }).filter(function (x) { return x.tag; });
  return { tags: tags, added: added };
}

/** updates = [{id, tags: [..]}]. Writes tags_source=automatisch. Never touches handmatig rows. */
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
      if (sourceCode_(r.tags_source) === 'manual') { skipped.push({ id: r.id, reason: 'manual' }); return; }
      var tags = (u.tags || []).map(function (x) { return String(x).trim().toLowerCase(); }).filter(function (x) { return x; });
      var unknown = tags.filter(function (x) { return known.indexOf(x) === -1; });
      if (unknown.length) { skipped.push({ id: r.id, reason: 'unknown_tags:' + unknown.join(',') }); return; }
      if (tags.length > 3) { skipped.push({ id: r.id, reason: 'too_many_tags' }); return; }
      sh.getRange(r._row, tagsCol, 1, 2).setValues([[tags.join(', '), sourceNl_('auto')]]);
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
    var key = function (type, nl) { return (typeCode_(type) || 'word') + '|' + String(nl || '').trim().toLowerCase(); };
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
        id: newId_('c_'), type: typeNl_(typeCode_(r.type) || 'word'), nl: String(r.nl || ''),
        article: r.article === 'de' || r.article === 'het' ? r.article : '', pos: posNl_(r.pos),
        fr: String(r.fr || ''), example_nl: String(r.example_nl || ''), example_fr: String(r.example_fr || ''),
        answer: String(r.answer || ''),
        tags: tagsNl_(tags), tags_source: tags ? sourceNl_('auto') : '', flags: flags, added: today, active: true, status: STATUS_NL.proposed
      });
    });
    sh.getRange(nextRow_(sh, 3), 1, out.length, headers.length).setValues(out);
    return { appended: out.length, skipped: skipped };
  });
}

function adminListInbox_() {
  return {
    rows: readTable_(sheet_('Inbox')).rows.filter(function (r) { return r.nl; }).map(function (r) {
      var c = cardToJson_(r); c.status = statusCode_(r.status) || String(r.status || ''); return c;
    })
  };
}

/** Moves every status=approved Inbox row into Cards (added = today, active). */
function adminPromoteInbox_() {
  return withLock_(function () {
    var inbox = sheet_('Inbox');
    var cards = sheet_('Cards');
    var t = readTable_(inbox);
    var approved = t.rows.filter(function (r) { return statusCode_(r.status) === 'approved' && String(r.nl).trim(); });
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
    var latest = {}, first = {};
    readTable_(sheet_('Log')).rows.forEach(function (r) {
      var key = r.card_id + '|' + r.track;
      var ts = toDate_(r.ts);
      if (!ts) return;
      if (!first[key] || ts < first[key]) first[key] = ts;
      if (latest[key] && latest[key].ts >= ts) return;
      var snap;
      try { snap = JSON.parse(r.snapshot); } catch (e) { return; }
      latest[key] = { ts: ts, card_id: String(r.card_id), track: String(r.track), s: snap, first: first[key] };
    });
    var rows = Object.keys(latest).map(function (k) {
      var x = latest[k];
      return [x.card_id, x.track, x.s.state, new Date(x.s.due), x.s.stability, x.s.difficulty, x.s.reps, x.s.lapses, x.ts, first[k]];
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
    seedAppWords_(sh);
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

/** lines = ['Zoek …', …] → appended to Breaks (never overwrites; exact duplicates skipped). */
function adminAppendBreaks_(lines) {
  if (!Array.isArray(lines) || !lines.length) throw apiError_('bad_request', 'lines[] required');
  return withLock_(function () {
    var sh = sheet_('Breaks');
    var have = {};
    readTable_(sh).rows.forEach(function (r) { have[String(r.text_nl).trim()] = true; });
    var add = lines.map(function (x) { return String(x || '').trim(); })
      .filter(function (x) { if (!x || have[x]) return false; have[x] = true; return true; });
    if (add.length) sh.getRange(nextRow_(sh, 1), 1, add.length, 1).setValues(add.map(function (x) { return [x]; }));
    return { appended: add.length, skipped: lines.length - add.length };
  });
}

/** Changes one field of one Curriculum row (by tag). Fields: unlock_threshold, min_reviews, max_wait_days, active, order. */
function adminSetCurriculum_(tag, field, value) {
  var allowed = ['order', 'unlock_threshold', 'min_reviews', 'max_wait_days', 'active', 'open'];
  if (allowed.indexOf(field) === -1) throw apiError_('bad_request', 'field must be one of ' + allowed.join(', '));
  return withLock_(function () {
    var sh = sheet_('Curriculum');
    var t = readTable_(sh);
    var row = t.rows.filter(function (r) { return String(r.tag).trim().toLowerCase() === String(tag || '').trim().toLowerCase(); })[0];
    if (!row) throw apiError_('not_found', 'No Curriculum row for tag ' + tag);
    var v = field === 'active' ? bool_(value) : field === 'open' ? OPEN_NL[openCode_(value)] :
      (value === '' || value === null ? '' : Number(value));
    if (field === 'unlock_threshold' && v !== '' && !(v >= 0 && v <= 1)) throw apiError_('bad_request', 'unlock_threshold must be 0–1');
    sh.getRange(row._row, t.headers.indexOf(field) + 1).setValue(v);
    updateCurriculumDashboard_(true);
    return { tag: tag, field: field, value: v };
  });
}

/**
 * Replaces every Cards row tagged klok-1/2/3 with KLOK_SEED_CARDS and adds klok-3 to the app card
 * "minuut". dryRun (default) only reports what would change.
 */
function adminReplaceKlok_(dryRun) {
  return withLock_(function () {
    var sh = sheet_('Cards');
    var t = readTable_(sh);
    var newIds = {};
    KLOK_SEED_CARDS.forEach(function (l) { newIds[l.split('|')[0]] = true; });
    var isKlok = function (r) { return splitTags_(r.tags).some(function (x) { return /^klok-[123]$/.test(x); }); };
    var remove = t.rows.filter(function (r) { return isKlok(r) && !newIds[String(r.id)] && String(r.nl).trim().toLowerCase() !== 'minuut'; });
    var minuut = t.rows.filter(function (r) {
      return String(r.nl).trim().toLowerCase() === 'minuut' && splitTags_(r.tags).indexOf('app') !== -1;
    })[0];
    var existing = {};
    t.rows.forEach(function (r) { existing[String(r.id)] = true; });
    var add = klokRows_().filter(function (r) { return !existing[r[0]]; });
    // Existing K-cards whose prompt (nl) or answer differs from the seed get the seed's text.
    var seedAnswer = {}, seedNl = {};
    klokRows_().forEach(function (r) { seedAnswer[r[0]] = r[11]; seedNl[r[0]] = r[2]; });
    var differs = function (r) {
      var id = String(r.id);
      return seedAnswer.hasOwnProperty(id) && (text_(r.answer) !== seedAnswer[id] || text_(r.nl) !== seedNl[id]);
    };
    var update = t.rows.filter(differs);
    var report = {
      dryRun: dryRun,
      remove: remove.map(function (r) { return String(r.id) + ' | ' + text_(r.fr) + ' → ' + text_(r.nl); }),
      add: add.map(function (r) { return r[0] + ' | ' + r[1] + ' | ' + r[2] + (r[11] ? ' → ' + r[11] : ''); }),
      update: update.map(function (r) {
        var id = String(r.id);
        return id + ' | ' + text_(r.nl) + (text_(r.nl) !== seedNl[id] ? ' → ' + seedNl[id] : '') + ' | ' +
          text_(r.answer) + (text_(r.answer) !== seedAnswer[id] ? ' → ' + seedAnswer[id] : '');
      }),
      minuut: minuut ? String(minuut.id) + ': ' + minuut.tags + ' → ' + (splitTags_(minuut.tags).indexOf('klok-3') === -1 ? minuut.tags + ', klok-3' : '(already)') : 'not found'
    };
    if (dryRun) return report;
    remove.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (n) { sh.deleteRow(n); });
    if (minuut && splitTags_(minuut.tags).indexOf('klok-3') === -1) {
      var fresh = readTable_(sh).rows.filter(function (r) { return String(r.id) === String(minuut.id); })[0];
      sh.getRange(fresh._row, CARD_COLS.indexOf('tags') + 1).setValue(splitTags_(minuut.tags).concat(['klok-3']).join(', '));
    }
    if (update.length) {
      var ansCol = CARD_COLS.indexOf('answer') + 1, nlCol = CARD_COLS.indexOf('nl') + 1;
      readTable_(sh).rows.forEach(function (r) {
        if (!differs(r)) return;
        sh.getRange(r._row, nlCol).setNumberFormat('@').setValue(seedNl[String(r.id)]);
        sh.getRange(r._row, ansCol).setNumberFormat('@').setValue(seedAnswer[String(r.id)]);
      });
    }
    if (add.length) writeCardRows_(sh, add);
    return report;
  });
}
