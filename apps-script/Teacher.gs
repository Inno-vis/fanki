// Teacher review UI ("Fanki – controleren"): an HtmlService page served by a SEPARATE web-app deployment of
// this project that requires a Google login and runs as the visiting teacher (USER_ACCESSING). The public
// card API deployment (anonymous) never serves this page. The browser gets no token: it calls the review*
// functions below through google.script.run, each of which checks the teacher allowlist first.
//
// Allowlist: Script Property TEACHER_EMAILS (comma-separated) and/or TEACHER_DOMAIN (e.g. school.be).
// setup() puts the owner's address in TEACHER_EMAILS when it is empty. A teacher also needs edit access
// to the spreadsheet (the code runs with their own Google permissions).

var REVIEW_EDITABLE = ['type', 'nl', 'article', 'pos', 'fr', 'example_nl', 'example_fr', 'tags', 'flags', 'answer'];

/** The visiting teacher's address, or '' (anonymous API deployment / no userinfo.email scope). */
function teacherEmail_() {
  try {
    return String(Session.getActiveUser().getEmail() || '').toLowerCase();
  } catch (e) {
    return '';
  }
}

function teacherAllowed_(email) {
  if (!email) return false;
  var p = props_();
  var list = String(p.getProperty('TEACHER_EMAILS') || '').toLowerCase().split(/[\s,;]+/).filter(String);
  var domain = String(p.getProperty('TEACHER_DOMAIN') || '').toLowerCase().replace(/^@/, '');
  return list.indexOf(email) !== -1 || (!!domain && email.split('@')[1] === domain);
}

function requireTeacher_() {
  var email = teacherEmail_();
  if (!teacherAllowed_(email)) throw new Error('Geen toegang' + (email ? ' voor ' + email : '') + '.');
  return email;
}

/** doGet(?page=review) → the page, only for an allowed teacher; null otherwise (caller returns JSON). */
function serveReview_() {
  if (!teacherAllowed_(teacherEmail_())) return null;
  return HtmlService.createTemplateFromFile('Review').evaluate()
    .setTitle('Fanki – controleren (' + env_() + ')')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- row <-> object ----------

function reviewRow_(r, isInbox) {
  var c = cardToJson_(r);
  c.row = r._row;
  c.status = isInbox ? (statusCode_(r.status) || 'proposed') : '';
  c.pos = String(r.pos || '');
  return c;
}

function findById_(sh, id) {
  return readTable_(sh).rows.filter(function (r) { return String(r.id) === String(id); })[0] || null;
}

/** Writes the editable fields (client codes → Dutch sheet values) into one row. */
function writeFields_(sh, row, fields) {
  var headers = readTable_(sh).headers;
  REVIEW_EDITABLE.forEach(function (k) {
    if (!fields.hasOwnProperty(k)) return;
    var v = fields[k];
    if (k === 'type') v = typeNl_(typeCode_(v) || 'word');
    else if (k === 'tags') v = (Array.isArray(v) ? v : splitTags_(v)).join(', ');
    else if (k === 'flags') v = (Array.isArray(v) ? v : splitTags_(v)).join(', ');
    else if (k === 'article') v = v === 'de' || v === 'het' ? v : '';
    else v = String(v == null ? '' : v).trim();
    var col = headers.indexOf(k) + 1;
    if (col) sh.getRange(row._row, col).setNumberFormat(k === 'tags' || k === 'flags' || k === 'type' || k === 'article' ? 'General' : '@').setValue(v);
  });
}

/** Required fields per type (Dutch messages for the page). */
function validateCard_(c) {
  var errors = [];
  var type = typeCode_(c.type) || 'word';
  if (!String(c.nl || '').trim()) errors.push('nl ontbreekt');
  if (type === 'oneway' && !String(c.answer || '').trim()) errors.push('answer ontbreekt (enkel)');
  if (type !== 'oneway' && !String(c.fr || '').trim()) errors.push('fr ontbreekt');
  if (type === 'sentence' && !/\{[^}]+\}/.test(String(c.nl || ''))) errors.push('zin: zet het doelwoord tussen {accolades}');
  var noun = /zelfstandig|noun/i.test(String(c.pos || ''));
  if (type === 'word' && noun && c.article !== 'de' && c.article !== 'het') errors.push('zelfstandig naamwoord zonder de/het');
  return errors;
}

// ---------- called from the page (google.script.run) ----------

function reviewBootstrap() {
  var email = requireTeacher_();
  return {
    env: env_(),
    build: typeof REVIEW_BUILD === 'string' ? REVIEW_BUILD : 'repo',
    email: email,
    tags: readTable_(sheet_('Tags')).rows.map(function (r) {
      return { tag: String(r.tag).trim().toLowerCase(), label: String(r.label_nl || r.tag) };
    }).filter(function (t) { return t.tag; }),
    types: [{ code: 'word', nl: 'dubbel' }, { code: 'oneway', nl: 'enkel' }, { code: 'sentence', nl: 'zin' }, { code: 'question', nl: 'vraag' }],
    flags: ['false-friend', 'separable']
  };
}

/** Inbox rows with status voorgesteld, oldest first. */
function reviewListInbox() {
  requireTeacher_();
  return readTable_(sheet_('Inbox')).rows
    .filter(function (r) { return String(r.nl).trim() && statusCode_(r.status) !== 'approved'; })
    .map(function (r) { return reviewRow_(r, true); })
    .sort(function (a, b) { return a.added.localeCompare(b.added) || a.row - b.row; });
}

/** Cards, paged; optional text query (nl/fr/answer) and tag. */
function reviewListCards(offset, limit, query, tag) {
  requireTeacher_();
  var q = String(query || '').trim().toLowerCase();
  var all = readTable_(sheet_('Cards')).rows.filter(function (r) { return String(r.id).trim() && String(r.nl).trim(); })
    .map(function (r) { return reviewRow_(r, false); })
    .filter(function (c) {
      if (tag && c.tags.indexOf(tag) === -1) return false;
      return !q || (c.nl + ' ' + c.fr + ' ' + c.answer).toLowerCase().indexOf(q) !== -1;
    });
  offset = Math.max(0, Number(offset) || 0);
  limit = Math.min(200, Math.max(1, Number(limit) || 50));
  return { total: all.length, offset: offset, rows: all.slice(offset, offset + limit) };
}

function reviewSave(source, id, fields) {
  requireTeacher_();
  return withLock_(function () {
    var sh = sheet_(source === 'cards' ? 'Cards' : 'Inbox');
    var row = findById_(sh, id);
    if (!row) throw new Error('Rij niet gevonden (al verplaatst?)');
    writeFields_(sh, row, fields || {});
    return reviewRow_(findById_(sh, id), source !== 'cards');
  });
}

/** Goedkeuren: save the edits, validate, move the Inbox row to Cards (added = today, active). */
function reviewApprove(id, fields) {
  requireTeacher_();
  return withLock_(function () {
    var inbox = sheet_('Inbox');
    var row = findById_(inbox, id);
    if (!row) throw new Error('Rij niet gevonden (al verplaatst?)');
    if (fields) {
      writeFields_(inbox, row, fields);
      row = findById_(inbox, id);
    }
    var c = reviewRow_(row, true);
    var errors = validateCard_(c);
    if (errors.length) return { ok: false, errors: errors };
    var cards = sheet_('Cards');
    var taken = !!findById_(cards, id);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var o = {};
    CARD_COLS.forEach(function (h) { o[h] = row[h]; });
    if (!o.id || taken) o.id = newId_('c_');
    o.added = today;
    o.active = true;
    writeCardRows_(cards, [rowFromObject_(CARD_COLS, o)]);
    inbox.deleteRow(row._row);
    return { ok: true, id: o.id };
  });
}

/** Keur alle goed: approves several Inbox rows in one go (rows marked "nakijken" are skipped). */
function reviewApproveMany(ids) {
  requireTeacher_();
  var results = [];
  (ids || []).forEach(function (id) {
    var row = findById_(sheet_('Inbox'), id);
    if (row && statusCode_(row.status) === 'review') { results.push({ id: id, ok: false, errors: ['gemarkeerd om na te kijken'] }); return; }
    try {
      var r = reviewApprove(id, null);
      results.push({ id: id, ok: r.ok, errors: r.errors || [] });
    } catch (e) {
      results.push({ id: id, ok: false, errors: [String(e.message || e)] });
    }
  });
  return results;
}

/** 🚩 Nakijken: mark an Inbox row to check later (status nakijken) or unmark it (voorgesteld). */
function reviewSetFlag(id, flagged) {
  requireTeacher_();
  return withLock_(function () {
    var inbox = sheet_('Inbox');
    var row = findById_(inbox, id);
    if (!row) throw new Error('Rij niet gevonden (al verplaatst?)');
    var col = readTable_(inbox).headers.indexOf('status') + 1;
    inbox.getRange(row._row, col).setValue(flagged ? STATUS_NL.review : STATUS_NL.proposed);
    return reviewRow_(findById_(inbox, id), true);
  });
}

/** Afwijzen: delete the Inbox row. */
function reviewReject(id) {
  requireTeacher_();
  return withLock_(function () {
    var inbox = sheet_('Inbox');
    var row = findById_(inbox, id);
    if (!row) throw new Error('Rij niet gevonden (al verplaatst?)');
    inbox.deleteRow(row._row);
    return { ok: true };
  });
}

/** Terug naar Inbox: move a card back (status voorgesteld; same id, so its progress returns if re-approved). */
function reviewCardToInbox(id) {
  requireTeacher_();
  return withLock_(function () {
    var cards = sheet_('Cards');
    var row = findById_(cards, id);
    if (!row) throw new Error('Kaart niet gevonden');
    var inbox = sheet_('Inbox');
    var o = {};
    CARD_COLS.forEach(function (h) { o[h] = row[h]; });
    o.status = STATUS_NL.proposed;
    var start = nextRow_(inbox, 3);
    inbox.getRange(start, 1, 1, SCHEMA.Inbox.length).setValues([rowFromObject_(SCHEMA.Inbox, o)]);
    cards.deleteRow(row._row);
    return { ok: true };
  });
}
