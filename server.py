"""Small local server for the dashboard.

Serves the site like `python3 -m http.server`, and also lets the task
questionnaires save their answers into the JSON files in data/.

Run:   python3 server.py          (then open http://localhost:8000)
       python3 server.py 9000     (use a different port)

Saving: the page sends POST /api/records/<name> with a JSON record (or a
list of records). They are added to the "data" list in data/<name>.json.
"""

import json
import os
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")

# Only these files can be written to
ALLOWED = {
    "microbiome", "cellular_profile", "cognition", "personality_questionnaire",
    "actigraphy", "sleep_team_questionnaire", "sensorimotor",
    "biochemical_markers", "carotid_intima_media_thickness",
}
MAX_BODY = 1_000_000  # 1 MB is far more than any questionnaire needs
write_lock = Lock()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Always serve fresh JSON so new records show up right away
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        prefix = "/api/records/"
        if not self.path.startswith(prefix):
            return self.send_json(404, {"error": "not found"})
        name = self.path[len(prefix):].strip("/")
        if name not in ALLOWED:
            return self.send_json(400, {"error": f"unknown data file '{name}'"})

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self.send_json(400, {"error": "missing or oversized body"})
        try:
            records = json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            return self.send_json(400, {"error": "body is not valid JSON"})
        if isinstance(records, dict):
            records = [records]
        if not isinstance(records, list) or not all(isinstance(r, dict) for r in records):
            return self.send_json(400, {"error": "expected a record or a list of records"})

        path = os.path.join(DATA_DIR, name + ".json")
        with write_lock:
            with open(path, encoding="utf-8") as f:
                doc = json.load(f)
            doc.setdefault("data", []).extend(records)
            # Write to a temp file first, then swap it in, so a crash can't leave a half-written file
            fd, tmp = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(doc, f, indent=2)
            os.replace(tmp, path)

        self.send_json(200, {"saved": len(records), "total": len(doc["data"])})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Dashboard running at http://localhost:{port}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
