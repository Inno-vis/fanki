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
    var current = sh.getRange(1, 1, 1, headers.length).getValues()[0];
    if (current.join('|') !== headers.join('|')) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8eaed');
    sh.setFrozenRows(1);
  });
  var blank = ss.getSheetByName('Sheet1') || ss.getSheetByName('Feuille 1') || ss.getSheetByName('Blad1');
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);

  // 4. Validation + formats.
  applyCardValidation_(ss.getSheetByName('Cards'), false);
  applyCardValidation_(ss.getSheetByName('Inbox'), true);
  var prog = ss.getSheetByName('Progress');
  prog.getRange('D2:D').setNumberFormat('yyyy-mm-dd hh:mm');
  prog.getRange('I2:I').setNumberFormat('yyyy-mm-dd hh:mm');
  var log = ss.getSheetByName('Log');
  log.getRange('D2:D').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  log.getRange('A2:A').setNumberFormat('@');
  log.getRange('H2:H').setNumberFormat('@');
  var protection = log.protect().setDescription('Log is append-only (written by the API)');
  protection.setWarningOnly(true);

  // 5. Seeds (only into empty tabs; Settings adds missing keys).
  seedSettings_(ss.getSheetByName('Settings'));
  seedIfEmpty_(ss.getSheetByName('Tags'), TAGS_SEED);
  seedIfEmpty_(ss.getSheetByName('Compliments'), COMPLIMENTS_SEED.map(function (t) { return [t]; }));
  if (env === 'DEV') seedCards_(ss.getSheetByName('Cards'));
  buildDashboard_(ss.getSheetByName('Dashboard'));

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
  sh.getRange('J2:J').setDataValidation(list(['manual', 'auto']));
  sh.getRange('L2:L').setNumberFormat('yyyy-mm-dd');
  sh.getRange('M2:M').setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  if (isInbox) sh.getRange('N2:N').setDataValidation(list(['proposed', 'approved']));
}

function seedSettings_(sh) {
  var existing = readTable_(sh).rows.map(function (r) { return String(r.key); });
  SETTINGS_DEFAULTS.forEach(function (row) {
    if (existing.indexOf(row[0]) === -1) sh.appendRow(row);
  });
  var rows = readTable_(sh).rows;
  rows.forEach(function (r) {
    if (r.key === 'compliments_enabled') {
      sh.getRange(r._row, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    }
  });
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
    return [newId_('c_'), f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8], f[9], today, true];
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function buildDashboard_(sh) {
  sh.getRange('A2:B30').clearContent();
  var rows = [
    ['Cartes dues (toutes pistes)', '=COUNTIFS(Progress!D2:D,"<="&NOW())'],
    ['Taux de réussite (30 j)', '=IFERROR(COUNTIFS(Log!E2:E,">1",Log!D2:D,">="&NOW()-30)/COUNTIFS(Log!D2:D,">="&NOW()-30),"—")'],
    ['Révisions cette semaine', '=COUNTIFS(Log!D2:D,">="&(TODAY()-WEEKDAY(TODAY(),3)))'],
    ['Cartes actives', '=COUNTIF(Cards!M2:M,TRUE)'],
    ['Dernière synchro', '=IF(COUNT(Log!D2:D)=0,"—",MAX(Log!D2:D))'],
    ['', ''],
    ['Cartes les plus oubliées (nl | piste | oublis)', '']
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
