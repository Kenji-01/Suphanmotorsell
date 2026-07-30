/* ===================================================================
   SuphanBookings — booking client for both booking forms and admin.

   Talks to the Google Apps Script backend in
   scripts/apps-script/Code.gs. Set the endpoint URL in config.js.

   ---------------------------------------------------------------------
   Two things here are load-bearing. Please read before editing.
   ---------------------------------------------------------------------
   1. NO CUSTOM HEADERS ON THE FETCH. Passing
      `headers: {'Content-Type': 'application/json'}` turns this into a
      CORS preflighted request, and Apps Script does not answer OPTIONS
      — every booking would fail. With a plain string body the browser
      sends text/plain and it stays a "simple request". The backend
      JSON.parses the body itself.

   2. localStorage is a BACKUP, not the store. Older versions of this
      file used localStorage as the only store, which meant staff never
      saw a booking made on a customer's phone. Now every submission is
      also written locally so a network failure loses nothing, and
      unsent ones are retried on the next page load.
   =================================================================== */

window.SuphanBookings = (function () {
  const KEY = 'suphan_bookings_outbox';
  const TIMEOUT_MS = 20000;   // Apps Script cold starts are slow

  const cfg = window.SUPHAN_CONFIG || {};

  function endpoint() {
    return String(cfg.BOOKING_ENDPOINT || '').trim();
  }
  function configured() {
    return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(endpoint());
  }

  /* -----------------------------------------------------------------
     Local outbox — every submission this browser made, synced or not
  ----------------------------------------------------------------- */

  function storageOk() {
    try {
      localStorage.setItem('__t__', '1');
      localStorage.removeItem('__t__');
      return true;
    } catch (e) {
      return false;   // Safari private mode, or storage disabled
    }
  }

  function outbox() {
    if (!storageOk()) return [];
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveOutbox(list) {
    if (!storageOk()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remember(entry, synced) {
    let list = outbox();
    const existing = list.find(function (x) { return x.localId === entry.localId; });

    if (existing) {
      existing.synced = synced;
    } else {
      /* Drop earlier failed attempts by the same person at the same
         form. Without this, a customer whose first submit failed and
         whose second succeeded leaves an orphaned unsent copy behind,
         and flush() posts it on their next visit — the shop gets the
         same booking twice. */
      list = list.filter(function (x) {
        return x.synced || !(x.type === entry.type && x.phone === entry.phone);
      });

      entry.synced = synced;
      list.push(entry);
      /* Keep the outbox from growing without bound on a shared shop
         tablet. Synced entries are already safe in the Sheet. */
      while (list.length > 50) list.shift();
    }
    saveOutbox(list);
  }

  /* -----------------------------------------------------------------
     Transport
  ----------------------------------------------------------------- */

  function post(payload) {
    if (!configured()) {
      return Promise.resolve({ ok: false, error: 'not_configured' });
    }

    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;

    return fetch(endpoint(), {
      method: 'POST',
      body: JSON.stringify(payload),          // see note 1 at the top
      redirect: 'follow',                     // Apps Script 302s to googleusercontent
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error('http_' + res.status);
        return res.json();
      })
      .catch(function (err) {
        return {
          ok: false,
          error: (err && err.name === 'AbortError') ? 'timeout' : 'network',
          detail: String(err && err.message || err)
        };
      })
      .then(function (result) {
        if (timer) clearTimeout(timer);
        return result;
      });
  }

  /* -----------------------------------------------------------------
     Public API — customer side
  ----------------------------------------------------------------- */

  /**
   * Send one booking. Resolves to { ok, error }. A false `ok` means the
   * customer must NOT be shown a success screen — the shop has no
   * record of the booking beyond this browser's outbox.
   */
  function submit(booking) {
    booking.localId = booking.localId ||
      ((window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2));
    booking.ts = booking.ts || new Date().toISOString();

    remember(booking, false);

    return post({ action: 'create', booking: booking }).then(function (res) {
      if (res && res.ok) remember(booking, true);
      return res || { ok: false, error: 'network' };
    });
  }

  /**
   * Retry anything that never reached the server — e.g. the customer
   * submitted on a dead connection and came back later. Fire and
   * forget; nothing in the UI depends on the outcome.
   *
   * Stale bookings are abandoned rather than sent: a service request
   * stranded offline for a week would arrive looking brand new, for an
   * appointment date that has already passed. Better that the shop
   * never sees it than acts on it.
   */
  const MAX_RETRY_AGE_MS = 24 * 60 * 60 * 1000;
  const inFlight = {};

  function flush() {
    if (!configured()) return;

    const now = Date.now();
    let changed = false;
    const list = outbox();

    list.forEach(function (entry) {
      if (entry.synced || inFlight[entry.localId]) return;

      if (now - Date.parse(entry.ts) > MAX_RETRY_AGE_MS) {
        entry.synced = true;        // give up; stops it retrying forever
        entry.abandoned = true;
        changed = true;
        return;
      }

      inFlight[entry.localId] = true;
      post({ action: 'create', booking: entry }).then(function (res) {
        delete inFlight[entry.localId];
        if (res && res.ok) remember(entry, true);
      });
    });

    if (changed) saveOutbox(list);
  }

  /* -----------------------------------------------------------------
     Public API — admin side

     The passphrase is never stored in any file on this site. Staff type
     it, the backend verifies it, and it lives in sessionStorage only
     until the tab closes.
  ----------------------------------------------------------------- */

  function list(pass) {
    return post({ action: 'list', pass: pass });
  }

  function setCalled(pass, id, called) {
    return post({ action: 'setCalled', pass: pass, id: id, called: !!called });
  }

  return {
    KEY: KEY,
    configured: configured,
    endpoint: endpoint,
    submit: submit,
    flush: flush,
    list: list,
    setCalled: setCalled,
    outbox: outbox
  };
})();
