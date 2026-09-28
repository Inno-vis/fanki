// setup(): creates (or repairs) the spreadsheet for this project. Safe to re-run.

function setup() {
  var p = props_();

  // 1. Secrets → Script Properties (only when the temporary Secrets.gs carries values).
  if (SECRETS.ENV) p.setProperty('ENV', SECRETS.ENV);
  if (SECRETS.LEARNER_TOKEN) p.setProperty('LEARNER_TOKEN', SECRETS.LEARNER_TOKEN);
  if (SECRETS.ADMIN_TOKEN) p.setProperty('ADMIN_TOKEN', SECRETS.ADMIN_TOKEN);
  var env = p.getProperty('ENV');
  if (env !== 'DEV' && env !== 'PROD') throw new Error('ENV missing: push secrets first (scripts/push-secrets.sh).');
  if (!p.getProperty('LEARNER_TOKEN') || !p.getProperty('ADMIN_TOKEN')) throw new Error('Tokens missing: push secrets first.');

  // 2. Spreadsheet (reuse if it still exists).
  var ss = null;
  var id = p.getProperty('SHEET_ID');
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Dutch ' + env);
    p.setProperty('SHEET_ID', ss.getId());
  }
  ss.setSpreadsheetTimeZone('Europe/Brussels');

  // 3. Tabs, headers, frozen row.
  Object.keys(SCHEMA).forEach(function (name, i) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name, i);
    var headers = SCHEMA[name];
    ensureHeaders_(sh, headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8eaed');
    sh.setFrozenRows(1);
  });
  var blank = ss.getSheetByName('Sheet1') || ss.getSheetByName('Feuille 1') || ss.getSheetByName('Blad1');
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);

  // 3b. One-time conversion of English sheet values to Dutch (before validation is re-applied).
  if (p.getProperty('MIGRATED_NL') !== '2') {
    migrateToDutch_(ss);
    p.setProperty('MIGRATED_NL', '2');
  }

  // 4. Validation + formats.
  applyCardValidation_(ss.getSheetByName('Cards'), false);
  applyCardValidation_(ss.getSheetByName('Inbox'), true);
  var prog = ss.getSheetByName('Progress');
  prog.getRange('D2:D').setNumberFormat('yyyy-mm-dd hh:mm');
  prog.getRange('I2:J').setNumberFormat('yyyy-mm-dd hh:mm');
  var log = ss.getSheetByName('Log');
  log.getRange('D2:D').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  log.getRange('A2:A').setNumberFormat('@');
  log.getRange('H2:H').setNumberFormat('@');
  var protection = log.protect().setDescription('Log is append-only (written by the API)');
  protection.setWarningOnly(true);

  // 5. Seeds (only into empty tabs; Settings adds missing keys).
  seedSettings_(ss.getSheetByName('Settings'));
  seedTags_(ss.getSheetByName('Tags'));
  seedCompliments_(ss.getSheetByName('Compliments'));
  seedIfEmpty_(ss.getSheetByName('Breaks'), BREAKS_SEED.map(function (x) { return [x]; }));
  ss.getSheetByName('Breaks').setColumnWidth(1, 520);
  if (env === 'DEV') seedCards_(ss.getSheetByName('Cards'));
  seedAppWords_(ss.getSheetByName('Cards'));
  seedKlokCards_(ss.getSheetByName('Cards'));
  seedCurriculum_(ss.getSheetByName('Curriculum'));
  applyCurriculumValidation_(ss.getSheetByName('Curriculum'));
  backfillFirstReview_(ss);
  buildDashboard_(ss.getSheetByName('Dashboard'));
  updateCurriculumDashboard_(true);

  // 6. Trigger: fill blank ids when the teacher edits Cards/Inbox.
  var hasTrigger = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'onSheetEdit'; });
  if (!hasTrigger) ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();

  var url = ss.getUrl();
  Logger.log('Dutch ' + env + ' spreadsheet: ' + url);
  return url;
}

function applyCardValidation_(sh, isInbox) {
  var list = function (vals) {
    return SpreadsheetApp.newDataValidation().requireValueInList(vals, true).setAllowInvalid(false).build();
  };
  sh.getRange('B2:B').setDataValidation(list(CARD_TYPES));
  sh.getRange('D2:D').setDataValidation(list(['de', 'het']));
  sh.getRange('J2:J').setDataValidation(list(TAG_SOURCES));
  sh.getRange('L2:L').setNumberFormat('yyyy-mm-dd');
  // Text columns stay text: otherwise Sheets turns "7:15" into a time and "1/2" into a date.
  sh.getRange('C2:C').setNumberFormat('@');
  sh.getRange('F2:H').setNumberFormat('@');
  sh.getRange('M2:M').setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  if (isInbox) sh.getRange('N2:N').setDataValidation(list([STATUS_NL.proposed, STATUS_NL.approved]));
}

function seedSettings_(sh) {
  var existing = readTable_(sh).rows.map(function (r) { return String(r.key); });
  SETTINGS_DEFAULTS.forEach(function (row) {
    if (existing.indexOf(row[0]) === -1) sh.appendRow(row);
  });
  var rows = readTable_(sh).rows;
  var desc = {};
  SETTINGS_DEFAULTS.forEach(function (d) { desc[d[0]] = d[2]; });
  rows.forEach(function (r) {
    if (desc[r.key] && r.description !== desc[r.key]) sh.getRange(r._row, 3).setValue(desc[r.key]);
  });
  rows.forEach(function (r) {
    if (r.key === 'compliments_enabled' || r.key === 'show_french_help') {
      sh.getRange(r._row, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    }
  });
}

/**
 * Makes row 1 match `headers`. A missing column is INSERTED at its position (existing data shifts
 * right with its header), so adding a column to the schema never misaligns data.
 */
function ensureHeaders_(sh, headers) {
  for (var i = 0; i < headers.length; i++) {
    var width = Math.max(sh.getLastColumn(), 1);
    var current = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
    if (current[i] === headers[i]) continue;
    var hasData = sh.getLastRow() > 1 || current.some(function (h) { return h !== ''; });
    if (hasData && current.indexOf(headers[i]) === -1 && current[i] !== '' && i < width) {
      sh.insertColumnBefore(i + 1);
    }
    sh.getRange(1, i + 1).setValue(headers[i]);
  }
}

/** Seeds missing tags and fills blank label_nl for known tags. */
function seedTags_(sh) {
  var t = readTable_(sh);
  var byTag = {};
  t.rows.forEach(function (r) { byTag[String(r.tag).trim().toLowerCase()] = r; });
  var col = t.headers.indexOf('label_nl') + 1;
  TAGS_SEED.forEach(function (row) {
    var r = byTag[row[0]];
    if (!r) sh.getRange(nextRow_(sh, 1), 1, 1, row.length).setValues([row]);
    else if (!String(r.label_nl || '').trim()) sh.getRange(r._row, col).setValue(row[1]);
  });
}

/** Seeds an empty tab; replaces the old French seed if it was never edited. */
function seedCompliments_(sh) {
  var current = readTable_(sh).rows.map(function (r) { return String(r.text).trim(); }).filter(String);
  var untouchedOld = current.length === OLD_COMPLIMENTS_FR.length &&
    current.every(function (x, i) { return x === OLD_COMPLIMENTS_FR[i]; });
  if (current.length && !untouchedOld) return;
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).clearContent();
  sh.getRange(2, 1, COMPLIMENTS_SEED.length, 1).setValues(COMPLIMENTS_SEED.map(function (x) { return [x]; }));
}

/** Adds the interface vocabulary (both envs). Skips any (type, nl) already in Cards. */
function seedAppWords_(sh) {
  var have = {};
  readTable_(sh).rows.forEach(function (r) { have[typeCode_(r.type) + '|' + String(r.nl).trim().toLowerCase()] = true; });
  var parts = APP_SEED_ADDED.split('-');
  var added = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var rows = APP_SEED_CARDS.map(function (line) { return line.split('|'); })
    .filter(function (f) { return !have[f[0] + '|' + f[1].toLowerCase()]; })
    .map(function (f) { return toSheetRow_(f, newId_('c_'), added); });
  if (rows.length) sh.getRange(nextRow_(sh, 3), 1, rows.length, rows[0].length).setValues(rows);
}

/** Adds the clock course cards (both envs), keyed by their fixed ids. */
function seedKlokCards_(sh) {
  var have = {};
  var byId = {};
  readTable_(sh).rows.forEach(function (r) { have[String(r.id)] = true; byId[String(r.id)] = r; });
  // Repair: cells Sheets had already converted to times (e.g. "3:45") get their text back.
  KLOK_SEED_CARDS.forEach(function (line) {
    var f = line.split('|'), r = byId[f[0]];
    if (r && (r.nl instanceof Date || r.fr instanceof Date)) {
      sh.getRange(r._row, 3).setNumberFormat('@').setValue(f[3]);
      sh.getRange(r._row, 6).setNumberFormat('@').setValue(f[2]);
    }
  });
  var parts = KLOK_SEED_ADDED.split('-');
  var added = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var rows = KLOK_SEED_CARDS.map(function (line) { return line.split('|'); })
    .filter(function (f) { return !have[f[0]]; })
    .map(function (f) {
      return [f[0], typeNl_('question'), f[3], '', posNl_('question'), f[2], '', '', 'klok-' + f[1], sourceNl_('manual'), '', added, true];
    });
  if (rows.length) {
    var start = nextRow_(sh, 3);
    sh.getRange(start, 3, rows.length, 1).setNumberFormat('@');
    sh.getRange(start, 6, rows.length, 1).setNumberFormat('@');
    sh.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function seedCurriculum_(sh) {
  if (nextRow_(sh, 2) > 2) return;
  sh.getRange(2, 1, CURRICULUM_SEED.length, CURRICULUM_SEED[0].length).setValues(CURRICULUM_SEED);
}

function applyCurriculumValidation_(sh) {
  var tags = sh.getParent().getSheetByName('Tags');
  sh.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false).setHelpText('Volgorde (1, 2, 3…)').build());
  sh.getRange('B2:B').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(tags.getRange('A2:A'), true)
    .setAllowInvalid(false).setHelpText('Een tag uit het tabblad Tags').build());
  sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 1)
    .setAllowInvalid(false).setHelpText('Tussen 0 en 1 (0,8 = 80 % van de kaarten gekend)').build());
  sh.getRange('D2:D').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false).setHelpText('Minimum aantal herhalingen (2)').build());
  sh.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false).setHelpText('Max. dagen voordat het volgende onderwerp opengaat (leeg = geen limiet)').build());
  sh.getRange('F2:F').setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  sh.getRange('C2:C').setNumberFormat('0%');
}

/** Fills Progress.first_review where blank, from the earliest Log ts of that card+track. */
function backfillFirstReview_(ss) {
  var prog = ss.getSheetByName('Progress');
  var t = readTable_(prog);
  var col = t.headers.indexOf('first_review') + 1;
  var missing = t.rows.filter(function (r) { return r.card_id && !(r.first_review instanceof Date); });
  if (!missing.length || !col) return;
  var first = {};
  readTable_(ss.getSheetByName('Log')).rows.forEach(function (r) {
    var k = r.card_id + '|' + r.track, ts = toDate_(r.ts);
    if (ts && (!first[k] || ts < first[k])) first[k] = ts;
  });
  missing.forEach(function (r) {
    var ts = first[r.card_id + '|' + r.track] || toDate_(r.last_review);
    if (ts) prog.getRange(r._row, col).setValue(ts);
  });
}

/** Seed line fields (brief format, English codes) → a Cards row with Dutch sheet values. */
function toSheetRow_(f, id, added) {
  return [id, typeNl_(f[0]), f[1], f[2], posNl_(f[3]), f[4], f[5], f[6], tagsNl_(f[7]), sourceNl_(f[8]), f[9], added, true];
}

/**
 * Converts English sheet values to Dutch: Cards/Inbox type, pos, tags, tags_source; Tags keys and
 * descriptions; Curriculum tags. Runs once per spreadsheet (Script Property MIGRATED_NL). Returns the
 * number of rows changed.
 */
function migrateToDutch_(ss) {
  var changed = 0;
  ['Cards', 'Inbox'].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    var last = nextRow_(sh, 3) - 1;
    if (last < 2) return;
    if (name === 'Inbox') {
      sh.getRange('N2:N').clearDataValidations();
      var st = sh.getRange(2, 14, last - 1, 1);
      st.setValues(st.getValues().map(function (r) { return [statusCode_(r[0]) ? STATUS_NL[statusCode_(r[0])] : r[0]]; }));
    }
    sh.getRange('B2:B').clearDataValidations();
    sh.getRange('J2:J').clearDataValidations();
    var range = sh.getRange(2, 1, last - 1, CARD_COLS.length);
    var values = range.getValues();
    values.forEach(function (r) {
      var before = r.join('\u0001');
      if (typeCode_(r[1])) r[1] = typeNl_(r[1]);
      r[4] = posNl_(r[4]);
      r[8] = tagsNl_(r[8]);
      if (sourceCode_(r[9])) r[9] = sourceNl_(r[9]);
      if (r.join('\u0001') !== before) changed++;
    });
    range.setValues(values);
  });

  var tags = ss.getSheetByName('Tags');
  var seed = {};
  TAGS_SEED.forEach(function (row) { seed[row[0]] = row; });
  readTable_(tags).rows.forEach(function (r) {
    var key = String(r.tag).trim().toLowerCase();
    var nl = TAG_RENAME[key] || key;
    if (!seed[nl]) return;
    tags.getRange(r._row, 1, 1, 4).setValues([[nl, r.label_nl || seed[nl][1], r.label_fr || seed[nl][2], seed[nl][3]]]);
    changed++;
  });

  var cur = ss.getSheetByName('Curriculum');
  if (cur) {
    readTable_(cur).rows.forEach(function (r) {
      var key = String(r.tag).trim().toLowerCase();
      if (TAG_RENAME[key]) { cur.getRange(r._row, 2).setValue(TAG_RENAME[key]); changed++; }
    });
  }
  return changed;
}

function seedIfEmpty_(sh, rows) {
  if (sh.getLastRow() > 1 || !rows.length) return;
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedCards_(sh) {
  if (nextRow_(sh, 3) > 2) return;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var rows = SEED_CARDS.map(function (line) {
    var f = line.split('|');
    while (f.length < 10) f.push('');
    return toSheetRow_(f, newId_('c_'), today);
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function buildDashboard_(sh) {
  sh.getRange('A2:B30').clearContent();
  var rows = [
    ['Te herhalen (alle richtingen)', '=COUNTIFS(Progress!D2:D,"<="&NOW())'],
    ['Goed onthouden (30 dagen)', '=IFERROR(COUNTIFS(Log!E2:E,">1",Log!D2:D,">="&NOW()-30)/COUNTIFS(Log!D2:D,">="&NOW()-30),"—")'],
    ['Herhalingen deze week', '=COUNTIFS(Log!D2:D,">="&(TODAY()-WEEKDAY(TODAY(),3)))'],
    ['Actieve kaarten', '=COUNTIF(Cards!M2:M,TRUE)'],
    ['Laatst gesynchroniseerd', '=IF(COUNT(Log!D2:D)=0,"—",MAX(Log!D2:D))'],
    ['', ''],
    ['Vaakst vergeten (nl | richting | keer vergeten)', '']
  ];
  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.getRange('B3').setNumberFormat('0%');
  sh.getRange('B6').setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange('A9').setFormula(
    '=IFERROR(QUERY({ARRAYFORMULA(IFERROR(VLOOKUP(Progress!A2:A,{Cards!A2:A,Cards!C2:C},2,FALSE),Progress!A2:A)),' +
    'Progress!B2:B,Progress!H2:H},"select Col1, Col2, Col3 where Col3 > 0 order by Col3 desc limit 10",0),"—")');
  sh.setColumnWidth(1, 320);
}

/** Installable onEdit trigger (created by setup). Fills blank ids in Cards/Inbox. */
function onSheetEdit(e) {
  var name = e && e.range ? e.range.getSheet().getName() : '';
  if (name !== 'Cards' && name !== 'Inbox') return;
  fillIds_(e.range.getSheet());
}

/** Gives every row that has content but no id a fresh id; also defaults added/active. Returns count. */
function fillIds_(sh) {
  var last = nextRow_(sh, 3) - 1;
  if (last < 2) return 0;
  var range = sh.getRange(2, 1, last - 1, CARD_COLS.length);
  var values = range.getValues();
  var changed = 0;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  values.forEach(function (r) {
    var hasContent = String(r[2]).trim() !== '' || String(r[5]).trim() !== '';
    if (!hasContent) return;
    if (String(r[0]).trim() === '') { r[0] = newId_('c_'); changed++; }
    if (r[11] === '') { r[11] = today; changed++; }
    if (r[12] === '' && sh.getName() === 'Cards') { r[12] = true; changed++; }
  });
  if (changed) range.setValues(values);
  return changed;
}
