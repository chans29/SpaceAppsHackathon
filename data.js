// ---- Shared data layer ----
// Loads every data/*.json file once, and saves new records from the questionnaires.
//
// Saving: when the site is run with `python3 server.py`, new records are written
// straight into the JSON files in data/. If that server isn't running (for example
// a plain static host), records are kept in this browser instead and sent to the
// files automatically the next time the page is opened with server.py running.
//
// resetToday() takes out every record from today (midnight to midnight, this computer's time).
// It hands back what it removed, so the page can offer "Revert reset"; nothing else keeps
// a copy, so once the page lets go of it the reset is final.

const HealthData = (function () {
  const FILES = [
    "microbiome", "cellular_profile", "cognition", "personality_questionnaire",
    "actigraphy", "sleep_team_questionnaire", "cardiac",
    "biochemical_markers", "carotid_intima_media_thickness"
  ];
  const PENDING_KEY = "pending-records";

  const api = {
    FILES: FILES,
    data: {},
    ready: null
  };

  // ---- Records waiting in the browser ----
  function readPending() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writePending(pending) {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); }
    catch (e) { /* storage unavailable */ }
  }

  // Send records to server.py. Resolves true if they were written to the file.
  async function postToServer(file, records) {
    try {
      const res = await fetch("api/records/" + file, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Try to move anything saved in the browser into the real files
  async function flushPending() {
    const pending = readPending();
    for (const file of Object.keys(pending)) {
      if (pending[file].length && await postToServer(file, pending[file])) {
        delete pending[file];
      }
    }
    writePending(pending);
  }

  async function loadAll() {
    await flushPending();
    const pending = readPending();
    const entries = await Promise.all(FILES.map(async function (name) {
      const res = await fetch("data/" + name + ".json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load data/" + name + ".json (" + res.status + ")");
      const json = await res.json();
      return [name, json.data.concat(pending[name] || [])];
    }));
    api.data = Object.fromEntries(entries);
    return api.data;
  }

  // Save one record or a list of records to a file.
  api.save = async function (file, records) {
    if (!Array.isArray(records)) records = [records];
    let where = "file";
    if (!(await postToServer(file, records))) {
      const pending = readPending();
      pending[file] = (pending[file] || []).concat(records);
      writePending(pending);
      where = "browser";
    }
    api.data[file] = (api.data[file] || []).concat(records);
    document.dispatchEvent(new CustomEvent("health-data-changed", { detail: { file: file } }));
    return where;
  };

  // Reload every file, then tell the page (tabs, Home graphs, task list) to redraw
  async function reloadAndAnnounce() {
    await loadAll();
    document.dispatchEvent(new CustomEvent("health-data-changed", { detail: { file: null } }));
  }

  // Today runs from midnight to the next midnight, in this computer's time zone
  function todayRange() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    return { start: start, end: end };
  }
  function isToday(record, range) {
    const t = new Date(record && record.timestamp).getTime();
    return t >= range.start.getTime() && t < range.end.getTime();
  }

  // ---- Reset today's data: take out every record timestamped today ----
  // Resolves a backup { server: {file: [records]}, browser: {file: [records]}, total, serverRan }.
  // Keep it to revert; throw it away to make the reset final.
  api.resetToday = async function () {
    const range = todayRange();
    let server = {}, serverRan = false;
    try {
      const res = await fetch("api/reset-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: range.start.toISOString(), end: range.end.toISOString() })
      });
      if (res.ok) { server = (await res.json()).removed; serverRan = true; }
    } catch (e) { /* server.py not running: only this browser's records can be reset */ }

    // Today's records still waiting in this browser
    const pending = readPending(), browser = {};
    Object.keys(pending).forEach(function (file) {
      const todays = pending[file].filter(function (r) { return isToday(r, range); });
      if (!todays.length) return;
      browser[file] = todays;
      pending[file] = pending[file].filter(function (r) { return !isToday(r, range); });
    });
    writePending(pending);
    await reloadAndAnnounce();

    const count = function (byFile) {
      return Object.keys(byFile).reduce(function (sum, f) { return sum + byFile[f].length; }, 0);
    };
    return { server: server, browser: browser, total: count(server) + count(browser), serverRan: serverRan };
  };

  // ---- Revert reset: put back everything a resetToday() removed ----
  api.revertReset = async function (backup) {
    if (Object.keys(backup.server).length) {
      const res = await fetch("api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup.server)
      });
      if (!res.ok) throw new Error("the server couldn't put the data back (" + res.status + ")");
    }
    const pending = readPending();
    Object.keys(backup.browser).forEach(function (file) {
      pending[file] = backup.browser[file].concat(pending[file] || []);
    });
    writePending(pending);
    await reloadAndAnnounce();
    return backup.total;
  };

  // How many records are from today (what Reset would take out)
  api.countToday = function () {
    const range = todayRange();
    return Object.keys(api.data).reduce(function (sum, f) {
      return sum + api.data[f].filter(function (r) { return isToday(r, range); }).length;
    }, 0);
  };

  api.ready = loadAll();
  return api;
})();
