"""Small local server for the dashboard.

Serves the site like `python3 -m http.server`, and also lets the task
questionnaires save their answers into the JSON files in data/.

Run:   python3 server.py          (then open http://localhost:8000)
       python3 server.py 9000     (use a different port)

Reset and revert:
  POST /api/reset-day   removes every record timestamped during one day (the page sends
                        {"start": ..., "end": ...} for today in its own time zone) and sends
                        the removed records back to the page
  POST /api/restore     puts records back, used by the page's "Revert reset" button.
                        The server keeps no copy: once the page drops its copy, the reset is final.

"""

import json
import os
from datetime import datetime
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")

# Only these files can be written to
ALLOWED = {
    "microbiome", "cellular_profile", "cognition", "personality_questionnaire",
    "actigraphy", "sleep_team_questionnaire", "cardiac",
    "biochemical_markers", "carotid_intima_media_thickness",
}
MAX_BODY = 1_000_000  # 1 MB is far more than any questionnaire needs
MAX_RESTORE_BODY = 50_000_000  # a revert sends back every file at once, so allow more
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

    def read_body(self, limit):
        """The request body as JSON, or None (after answering with an error)."""
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > limit:
            self.send_json(400, {"error": "missing or oversized body"})
            return None
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            self.send_json(400, {"error": "body is not valid JSON"})
            return None

    def do_POST(self):
        route = self.path.rstrip("/")
        if route == "/api/reset-day":
            return self.reset_day()
        if route == "/api/restore":
            return self.restore()
        prefix = "/api/records/"
        if not self.path.startswith(prefix):
            return self.send_json(404, {"error": "not found"})
        name = self.path[len(prefix):].strip("/")
        if name not in ALLOWED:
            return self.send_json(400, {"error": f"unknown data file '{name}'"})

        records = self.read_body(MAX_BODY)
        if records is None:
            return
        if isinstance(records, dict):
            records = [records]
        if not isinstance(records, list) or not all(isinstance(r, dict) for r in records):
            return self.send_json(400, {"error": "expected a record or a list of records"})

        with write_lock:
            doc = read_doc(name)
            doc.setdefault("data", []).extend(records)
            write_doc(name, doc)

        self.send_json(200, {"saved": len(records), "total": len(doc["data"])})

    # ---- Reset today's data: take out every record from one day ----
    def reset_day(self):
        body = self.read_body(MAX_BODY)
        if body is None:
            return
        try:
            start, end = parse_time(body["start"]), parse_time(body["end"])
        except (KeyError, TypeError, ValueError):
            return self.send_json(400, {"error": "expected {\"start\": ISO time, \"end\": ISO time}"})

        def in_day(record):
            try:
                return start <= parse_time(record.get("timestamp")) < end
            except (TypeError, ValueError, AttributeError):
                return False   # no usable timestamp: leave it alone

        removed = {}
        with write_lock:
            for name in sorted(ALLOWED):
                if not os.path.exists(data_path(name)):
                    continue
                doc = read_doc(name)
                rows = doc.get("data", [])
                todays = [r for r in rows if in_day(r)]
                if not todays:
                    continue
                doc["data"] = [r for r in rows if not in_day(r)]
                write_doc(name, doc)
                removed[name] = todays
        # The removed records go back to the page, which holds them only while it stays open
        self.send_json(200, {"removed": removed, "total": sum(len(v) for v in removed.values())})

    # ---- Revert reset: put back the records the page was holding ----
    def restore(self):
        body = self.read_body(MAX_RESTORE_BODY)
        if body is None:
            return
        if not isinstance(body, dict):
            return self.send_json(400, {"error": "expected {file: [records]}"})
        restored = {}
        with write_lock:
            for name, records in body.items():
                if name not in ALLOWED or not isinstance(records, list) or not os.path.exists(data_path(name)):
                    continue
                doc = read_doc(name)
                # Old records first, then anything saved since the reset
                doc["data"] = [r for r in records if isinstance(r, dict)] + doc.get("data", [])
                write_doc(name, doc)
                restored[name] = len(records)
        self.send_json(200, {"restored": restored, "total": sum(restored.values())})


def parse_time(text):
    """ISO time like 2026-11-15T06:00:00.000Z -> a time that can be compared."""
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def data_path(name):
    return os.path.join(DATA_DIR, name + ".json")


def read_doc(name):
    with open(data_path(name), encoding="utf-8") as f:
        return json.load(f)


def write_doc(name, doc):
    """Write to a temporary file first, then swap it in, so a crash never leaves half a file."""
    fd, tmp = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2)
    os.replace(tmp, data_path(name))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Dashboard running at http://localhost:{port}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
