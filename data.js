// ---- Shared data layer ----
// Loads every data/*.json file once, and saves new records from the questionnaires.
//
// Saving: when the site is run with `python3 server.py`, new records are written
// straight into the JSON files in data/. If that server isn't running (for example
// a plain static host), records are kept in this browser instead and sent to the
// files automatically the next time the page is opened with server.py running.

const HealthData = (function () {
  const FILES = [
    "microbiome", "cellular_profile", "cognition", "personality_questionnaire",
    "actigraphy", "sleep_team_questionnaire", "sensorimotor",
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

  api.ready = loadAll();
  return api;
})();
