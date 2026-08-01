/**
 * =====================================================================
 * SUPHAN MOTORSALE — booking backend (Google Apps Script)
 *
 * This is the server the static site was missing. It receives both
 * booking types (จองทดลองขับ / จองเข้ารับบริการ) from any customer's
 * phone, stores them in a Google Sheet, and serves them back to
 * admin.html so staff see the same list on every device.
 *
 * THIS FILE IS NOT PART OF THE WEBSITE. It is pasted into a Google
 * Apps Script project bound to a Google Sheet. Setup instructions:
 * scripts/apps-script/SETUP-TH.md
 *
 * ---------------------------------------------------------------------
 * Design notes for whoever maintains this
 * ---------------------------------------------------------------------
 * - Everything goes through doPost, including reads. That is deliberate:
 *   a GET would put the admin passphrase in a URL, where it lands in
 *   browser history and server logs.
 * - The browser posts a plain string body with no custom headers, so
 *   the request stays a CORS "simple request". Apps Script does not
 *   answer OPTIONS preflights, so setting Content-Type: application/json
 *   on the client WILL break this. Don't.
 * - The admin passphrase lives in Script Properties, never in the repo
 *   and never in the site's source. A static site cannot hold a secret;
 *   this backend can.
 * - Writes are open (customers must post without logging in). Reads are
 *   passphrase-gated and fail closed if no passphrase is configured.
 * =====================================================================
 */

var SHEET_NAME = 'bookings';

/* Column order in the sheet. Changing this order is safe — the code
   looks columns up by name — but renaming a header is not. */
var HEADERS = [
  'id', 'ts', 'type', 'name', 'phone', 'email',
  'model', 'branch', 'plate', 'serviceType', 'date', 'timeSlot',
  'marketing', 'called', 'note'
];

var MAX_LIST = 500;      // most recent N bookings returned to admin
var FLOOD_LIMIT = 10;    // max new bookings accepted per rolling minute
var MAX_LEN = 200;       // hard cap on any single text field

/* Columns that must never be auto-converted to a number. Sheets will
   silently strip a leading zero from "0812345678" the moment it looks
   like a number to Sheets' own type-detection — this happens even when
   the value arrives from Apps Script as a JS string, and even with the
   whole column pre-set to Plain Text via setNumberFormat('@') back when
   the sheet was first created in getSheet(). What actually holds is
   forcing the format on the exact destination cell again, immediately
   before that cell's value is set — see writeRow() below. (A leading
   apostrophe, the usual trick for this in the Sheets UI, does NOT save
   you here: that is a UI-paste-parsing behaviour, not something
   Range.setValue() from Apps Script triggers — tested and confirmed.) */
var FORCE_TEXT_COLS = { phone: true, plate: true };

/* Script Property names. Set these in the Apps Script editor under
   Project Settings → Script properties. */
var PROP_PASSPHRASE = 'ADMIN_PASSPHRASE';
var PROP_NOTIFY = 'NOTIFY_EMAIL';   // optional


/* =====================================================================
   Entry points
   ===================================================================== */

/**
 * Health check. Opening the /exec URL in a browser hits this, which is
 * the quickest way to confirm a deployment is live. It deliberately
 * returns no booking data.
 */
function doGet(e) {
  return json({
    ok: true,
    service: 'suphan-bookings',
    configured: !!getPassphrase()
  });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ ok: false, error: 'bad_json' });
  }

  var action = String(body.action || '');

  try {
    if (action === 'create')    return handleCreate(body);
    if (action === 'list')      return handleList(body);
    if (action === 'setCalled') return handleSetCalled(body);
    if (action === 'ping')      return json({ ok: true, configured: !!getPassphrase() });
    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    // Never leak a stack trace to the browser, but do leave one in the
    // Apps Script execution log for debugging.
    console.error(err && err.stack ? err.stack : err);
    return json({ ok: false, error: 'server_error' });
  }
}


/* =====================================================================
   create — a customer submitted a booking form
   ===================================================================== */

function handleCreate(body) {
  var b = body.booking || {};
  var type = String(b.type || '');

  if (type !== 'test-drive' && type !== 'service') {
    return json({ ok: false, error: 'bad_type' });
  }

  var name = clean(b.name);
  var phone = String(b.phone || '').replace(/\D/g, '');

  if (!name) return json({ ok: false, error: 'missing_name' });
  if (!/^0?[689]\d{8}$/.test(phone)) return json({ ok: false, error: 'bad_phone' });
  if (phone.length === 9) phone = '0' + phone;   // normalise to 10 digits

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json({ ok: false, error: 'busy' });

  try {
    var sheet = getSheet();

    if (isFlooding(sheet)) return json({ ok: false, error: 'rate_limited' });

    var row = {
      id: Utilities.getUuid(),
      ts: new Date().toISOString(),
      type: type,
      name: name,
      phone: phone,
      email: clean(b.email),
      model: clean(b.model),
      branch: clean(b.branch),
      plate: clean(b.plate),
      serviceType: clean(b.serviceType),
      date: clean(b.date),
      timeSlot: clean(b.timeSlot),
      marketing: b.marketing ? 'yes' : '',
      called: '',
      note: ''
    };

    writeRow(sheet, row);

    notify(row);
    return json({ ok: true, id: row.id });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends one booking as a new row. FORCE_TEXT_COLS columns get their
 * number format reset to Plain Text on this exact destination cell,
 * immediately before the value is written to it. That ordering is what
 * actually stops Sheets' auto-detection from reading "0812345678" as a
 * number and dropping the leading zero — pre-formatting the column in
 * bulk once, back when the sheet was created, was not enough on its
 * own (confirmed: a real test booking still lost its leading zero).
 */
function writeRow(sheet, row) {
  var nextRow = sheet.getLastRow() + 1;

  Object.keys(FORCE_TEXT_COLS).forEach(function (h) {
    var col = HEADERS.indexOf(h) + 1;
    sheet.getRange(nextRow, col).setNumberFormat('@');
  });

  var values = HEADERS.map(function (h) { return row[h]; });
  sheet.getRange(nextRow, 1, 1, values.length).setValues([values]);
}

/**
 * Crude flood guard. Apps Script gives us no client IP, so this is a
 * global cap rather than a per-visitor one: if the last FLOOD_LIMIT
 * rows all landed within the past minute, stop accepting. A real
 * dealership will never hit this; a bored bot will.
 */
function isFlooding(sheet) {
  var last = sheet.getLastRow();
  if (last <= FLOOD_LIMIT) return false;

  var tsCol = HEADERS.indexOf('ts') + 1;
  var stamps = sheet.getRange(last - FLOOD_LIMIT + 1, tsCol, FLOOD_LIMIT, 1).getValues();
  var cutoff = Date.now() - 60 * 1000;

  for (var i = 0; i < stamps.length; i++) {
    var t = Date.parse(stamps[i][0]);
    if (isNaN(t) || t < cutoff) return false;
  }
  return true;
}

/**
 * Optional email ping to the shop so staff don't have to sit refreshing
 * admin.html. Silent no-op unless NOTIFY_EMAIL is set. Wrapped in
 * try/catch on purpose: a failed email must never fail the booking —
 * the customer's data is already safely in the sheet by this point.
 */
function notify(row) {
  var to = PropertiesService.getScriptProperties().getProperty(PROP_NOTIFY);
  if (!to) return;

  var isTD = row.type === 'test-drive';
  var lines = [
    'ชื่อ: ' + row.name,
    'เบอร์โทร: ' + row.phone
  ];
  if (isTD) {
    if (row.model) lines.push('รุ่นที่สนใจ: ' + row.model);
    if (row.branch) lines.push('สาขา: ' + row.branch);
    if (row.email) lines.push('อีเมล: ' + row.email);
  } else {
    if (row.model) lines.push('รุ่น: ' + row.model);
    if (row.plate) lines.push('ทะเบียน: ' + row.plate);
    if (row.serviceType) lines.push('ประเภทบริการ: ' + row.serviceType);
    if (row.date) lines.push('วันที่นัด: ' + row.date + (row.timeSlot ? ' ' + row.timeSlot : ''));
  }

  try {
    MailApp.sendEmail({
      to: to,
      subject: (isTD ? '[จองทดลองขับ] ' : '[จองเข้ารับบริการ] ') + row.name,
      body: lines.join('\n') + '\n\n— แจ้งอัตโนมัติจากเว็บไซต์ suphanmotorsale'
    });
  } catch (err) {
    console.error('notify failed: ' + err);
  }
}


/* =====================================================================
   list — admin.html asking for the bookings
   ===================================================================== */

function handleList(body) {
  var gate = checkPass(body);
  if (gate) return gate;

  var sheet = getSheet();
  var last = sheet.getLastRow();
  if (last < 2) return json({ ok: true, bookings: [] });

  var start = Math.max(2, last - MAX_LIST + 1);
  var values = sheet.getRange(start, 1, last - start + 1, HEADERS.length).getValues();

  var out = values.map(function (r) {
    var o = {};
    for (var i = 0; i < HEADERS.length; i++) o[HEADERS[i]] = r[i];
    o.ts = toIso(o.ts);
    o.date = toDateStr(o.date);
    o.marketing = String(o.marketing).toLowerCase() === 'yes';
    o.called = String(o.called).toLowerCase() === 'yes';
    return o;
  }).filter(function (o) { return o.id; });

  return json({ ok: true, bookings: out, total: last - 1 });
}


/* =====================================================================
   setCalled — staff ticked "โทรกลับแล้ว"
   ===================================================================== */

function handleSetCalled(body) {
  var gate = checkPass(body);
  if (gate) return gate;

  var id = String(body.id || '');
  if (!id) return json({ ok: false, error: 'missing_id' });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json({ ok: false, error: 'busy' });

  try {
    var sheet = getSheet();
    var last = sheet.getLastRow();
    if (last < 2) return json({ ok: false, error: 'not_found' });

    var idCol = HEADERS.indexOf('id') + 1;
    var calledCol = HEADERS.indexOf('called') + 1;
    var ids = sheet.getRange(2, idCol, last - 1, 1).getValues();

    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === id) {
        sheet.getRange(i + 2, calledCol).setValue(body.called ? 'yes' : '');
        return json({ ok: true });
      }
    }
    return json({ ok: false, error: 'not_found' });
  } finally {
    lock.releaseLock();
  }
}


/* =====================================================================
   Helpers
   ===================================================================== */

function getPassphrase() {
  var p = PropertiesService.getScriptProperties().getProperty(PROP_PASSPHRASE);
  return p ? String(p) : '';
}

/**
 * Returns null when the caller is allowed through, or a ready-to-return
 * error response when it is not. Fails closed: with no passphrase
 * configured, nobody can read the bookings.
 */
function checkPass(body) {
  var expected = getPassphrase();
  if (!expected) return json({ ok: false, error: 'not_configured' });
  if (String(body.pass || '') !== expected) return json({ ok: false, error: 'unauthorized' });
  return null;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    /* Phone numbers and licence plates must stay text — as numbers,
       Sheets eats the leading zero off 08x and mangles plates. */
    sheet.getRange(2, HEADERS.indexOf('phone') + 1, sheet.getMaxRows() - 1, 1)
         .setNumberFormat('@');
    sheet.getRange(2, HEADERS.indexOf('plate') + 1, sheet.getMaxRows() - 1, 1)
         .setNumberFormat('@');
  }
  return sheet;
}

function clean(v) {
  return String(v == null ? '' : v).trim().slice(0, MAX_LEN);
}

/** Sheets may hand back a Date object or a string depending on cell format. */
function toIso(v) {
  if (v instanceof Date) return v.toISOString();
  var s = String(v || '');
  var t = Date.parse(s);
  return isNaN(t) ? s : new Date(t).toISOString();
}

function toDateStr(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Bangkok', 'yyyy-MM-dd');
  return String(v || '');
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* =====================================================================
   Run this once from the Apps Script editor (Run ▸ setup) to create the
   sheet and its headers before the first real booking arrives. Also a
   convenient way to trigger the authorisation prompt.
   ===================================================================== */
function setup() {
  getSheet();
  var pass = getPassphrase();
  Logger.log(pass
    ? 'Sheet ready. Admin passphrase IS set.'
    : 'Sheet ready. ⚠ ADMIN_PASSPHRASE is NOT set — admin.html cannot read bookings yet.');
}
