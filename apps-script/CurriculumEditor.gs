// Curriculum editor (teacher page ?page=curriculum, CurriculumPage.html). Same pattern as the review page: the browser
// calls the curriculumEditor* functions through google.script.run, each checks the teacher allowlist first; no
// tokens. Saving writes the WHOLE Curriculum tab at once inside LockService, after the shared validation
// (validateCurriculum_) and a version check; the previous table is kept in the hidden tab Curriculum_backup.
// The pure parts (curriculumVersion_, curriculumSavePlan_) are unit-tested in src/curriculumEditor.test.ts.

var CURRICULUM_BACKUP = 'Curriculum_backup';

/** Version stamp of the tab: a hash of its values (dates as YYYY-MM-DD). Changes whenever any cell changes. */
function curriculumVersion_(values) {
  var text = JSON.stringify(values.map(function (row) {
    return row.map(function (v) { return v instanceof Date ? isoDate_(v) : String(v === null || v === undefined ? '' : v); });
  }));
  var h = 5381;
  for (var i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + text.length;
}

/** Editor rows (list order) → {ok, checks:[{errors, warnings}], rows (normalised, order = position)}. Pure. */
function curriculumSavePlan_(rows, tagKeys, cardCounts) {
  var clean = (rows || []).map(function (r, i) {
    var pct = r.percentage === '' || r.percentage === null || r.percentage === undefined ? null : Number(r.percentage);
    return {
      order: r.order === undefined ? i + 1 : Number(r.order),
      tag: String(r.tag || '').trim().toLowerCase(),
      rule: ruleCode_(r.rule),
      date: String(r.date || '').trim(),
      percentage: pct === null || isNaN(pct) ? null : pct,
      from_tags: (Array.isArray(r.from_tags) ? r.from_tags : splitTags_(r.from_tags)).map(function (t) { return String(t).trim().toLowerCase(); })
        .filter(function (t, j, a) { return t && a.indexOf(t) === j; })
    };
  });
  var checks = validateCurriculum_(clean, tagKeys, cardCounts);
  var ok = checks.every(function (c) { return !c.errors.length; });
  return { ok: ok, checks: checks, rows: clean };
}

/** A row for the sheet: real Date in `datum` (the column has date validation), text in van_tags. */
function curriculumSheetValues_(r) {
  var v = curriculumRowToSheet_(r);
  if (validDate_(r.date)) { var p = r.date.split('-').map(Number); v[3] = new Date(p[0], p[1] - 1, p[2]); }
  return v;
}

function curriculumTabValues_(sh) {
  var last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, SCHEMA.Curriculum.length).getValues()
    .filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); });
}

function writeCurriculumTab_(sh, values) {
  var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, SCHEMA.Curriculum.length).clearContent();
  if (values.length) sh.getRange(2, 1, values.length, SCHEMA.Curriculum.length).setValues(values);
}

function backupSheet_(ss) {
  var b = ss.getSheetByName(CURRICULUM_BACKUP);
  if (!b) {
    b = ss.insertSheet(CURRICULUM_BACKUP);
    b.getRange(1, 1, 1, SCHEMA.Curriculum.length).setValues([SCHEMA.Curriculum]);
    b.hideSheet();
  }
  return b;
}

function editorTagInfo_(ss) {
  var gate = bool_(readSettings_().require_approval), counts = {};
  readTable_(ss.getSheetByName('Cards')).rows.filter(function (r) { return cardServed_(r, gate); })
    .forEach(function (r) { splitTags_(r.tags).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
  var tags = readTable_(ss.getSheetByName('Tags')).rows.map(function (r) {
    var tag = String(r.tag).trim().toLowerCase();
    return { tag: tag, label: String(r.label_nl || tag), cards: counts[tag] || 0 };
  }).filter(function (t) { return t.tag; });
  return { tags: tags, counts: counts, keys: tags.map(function (t) { return t.tag; }) };
}

// ---------- called from the page (google.script.run) ----------

/**
 * Everything the editor needs: rows (by order), tags with label + active cards, today's score per tag (only when
 * the Progress tab has data), the bekend settings, the version stamp and whether a previous version exists.
 */
function curriculumEditorLoad() {
  requireTeacher_();
  var ss = ss_();
  var sh = ss.getSheetByName('Curriculum');
  var info = editorTagInfo_(ss);
  var settings = readSettings_();
  var known = { known_stability_days: Number(settings.known_stability_days), known_min_reviews: Number(settings.known_min_reviews) };
  var progress = readTable_(ss.getSheetByName('Progress')).rows.filter(function (r) { return r.card_id; });
  var scores = null;
  if (progress.length) {
    var status = curriculumNow_();
    scores = {};
    status.rows.forEach(function (s) { scores[s.tag] = s.score; s.fromScores.forEach(function (f) { scores[f.tag] = f.score; }); });
  }
  var rows = readCurriculum_().slice().sort(function (a, b) { return a.order - b.order; });
  var backup = ss.getSheetByName(CURRICULUM_BACKUP);
  return {
    env: env_(), today: isoDate_(new Date()), rows: rows, tags: info.tags, scores: scores, known: known,
    version: curriculumVersion_(curriculumTabValues_(sh)), hasBackup: !!backup && backup.getLastRow() > 1
  };
}

/**
 * Saves the editor's rows (list order). Nothing is written when there are errors or when the tab changed since
 * `version` was loaded. Returns {ok, checks} | {ok:false, conflict:true} | {ok:true, version, checks}.
 */
function curriculumEditorSave(rows, version) {
  requireTeacher_();
  return withLock_(function () {
    var ss = ss_();
    var sh = ss.getSheetByName('Curriculum');
    var current = curriculumTabValues_(sh);
    if (curriculumVersion_(current) !== version) return { ok: false, conflict: true };
    var info = editorTagInfo_(ss);
    var plan = curriculumSavePlan_(rows, info.keys, info.counts);
    if (!plan.ok) return { ok: false, checks: plan.checks };
    var b = backupSheet_(ss);
    writeCurriculumTab_(b, current);
    var values = plan.rows.map(curriculumSheetValues_);
    writeCurriculumTab_(sh, values);
    SpreadsheetApp.flush();
    try { updateCurriculumDashboard_(true); } catch (e) { /* the Dashboard must never block a save */ }
    return { ok: true, checks: plan.checks, version: curriculumVersion_(curriculumTabValues_(sh)) };
  });
}

/** "Vorige versie terugzetten": swaps the tab and Curriculum_backup (so it can be undone). Version-checked. */
function curriculumEditorRestore(version) {
  requireTeacher_();
  return withLock_(function () {
    var ss = ss_();
    var sh = ss.getSheetByName('Curriculum');
    var current = curriculumTabValues_(sh);
    if (curriculumVersion_(current) !== version) return { ok: false, conflict: true };
    var b = ss.getSheetByName(CURRICULUM_BACKUP);
    if (!b || b.getLastRow() < 2) return { ok: false, message: 'Er is geen vorige versie.' };
    var previous = curriculumTabValues_(b);
    writeCurriculumTab_(b, current);
    writeCurriculumTab_(sh, previous);
    SpreadsheetApp.flush();
    try { updateCurriculumDashboard_(true); } catch (e) { /* ignore */ }
    return { ok: true };
  });
}

/** "Nieuw onderwerp": a new Tags row (key a-z0-9-, label_nl, label_fr). It is not in the curriculum yet. */
function curriculumEditorNewTopic(tag, labelNl, labelFr) {
  requireTeacher_();
  var key = String(tag || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) throw new Error('Gebruik voor de code alleen a-z, 0-9 en -.');
  if (!String(labelNl || '').trim()) throw new Error('Vul een naam in.');
  return withLock_(function () {
    var sh = sheet_('Tags');
    var have = readTable_(sh).rows.map(function (r) { return String(r.tag).trim().toLowerCase(); });
    if (have.indexOf(key) !== -1) throw new Error('Onderwerp "' + key + '" bestaat al.');
    sh.getRange(nextRow_(sh, 1), 1, 1, SCHEMA.Tags.length).setValues([rowFromObject_(SCHEMA.Tags,
      { tag: key, label_nl: String(labelNl).trim(), label_fr: String(labelFr || '').trim(), description: '', subject_nl: '' })]);
    return { tag: key, label: String(labelNl).trim(), cards: 0 };
  });
}
