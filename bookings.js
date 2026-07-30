/* ===================================================================
   SuphanBookings — client-side test-drive booking store.

   IMPORTANT LIMITATION: this reads/writes the browser's own
   localStorage. It is scoped to one browser on one device — a
   customer's phone and the dealership's admin computer do NOT share
   this data. There is no server here to receive it. This is a working
   prototype of the booking UX, not a real multi-device inbox. See the
   banner on admin.html for the same warning surfaced to whoever uses
   the page.
   =================================================================== */

window.SuphanBookings = (function () {
  const KEY = 'suphan_test_drive_bookings';

  function available() {
    try {
      const t = '__t__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  function all() {
    if (!available()) return [];
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    if (!available()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function add(entry) {
    const list = all();
    list.push(entry);
    save(list);
    return entry;
  }

  function setCalled(id, called) {
    const list = all();
    const item = list.find(function (x) { return x.id === id; });
    if (item) {
      item.called = !!called;
      save(list);
    }
    return list;
  }

  function isSameDay(iso, ref) {
    const t = new Date(iso);
    return t.getFullYear() === ref.getFullYear() &&
           t.getMonth() === ref.getMonth() &&
           t.getDate() === ref.getDate();
  }

  function today() {
    const now = new Date();
    return all().filter(function (x) { return isSameDay(x.ts, now); });
  }

  return { KEY: KEY, available: available, all: all, add: add, setCalled: setCalled, today: today };
})();
