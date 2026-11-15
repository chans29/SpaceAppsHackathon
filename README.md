# Astronaut Health Dashboard (NASA Space Apps)

## Run it

```
python3 server.py
```

Then open http://localhost:8000. No installs needed (Python 3 only).

`server.py` serves the site and lets the test questionnaires save answers into
`data/*.json`. If the page is opened some other way (e.g. a static host or
VS Code Live Server), answers are kept in the browser instead and written to the
files the next time the dashboard is opened through `server.py`.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page layout, styles, view switching, timer |
| `tasks.js` | Test schedule, task lists, calendar, and the step-by-step questionnaires |
| `data.js` | Loads `data/*.json` and saves new records |
| `main.js` | Report charts |
| `server.py` | Local server that writes new records into `data/*.json` |

## Tests and how often they're due

Defined in the `TASKS` list at the top of `tasks.js`. Change `frequencyDays`
or `startDate` there to adjust the schedule.

| Test | Frequency | Saved to |
| --- | --- | --- |
| Morning sleep log | Daily | `sleep_team_questionnaire.json` (`type: "wake"`) |
| Evening team check-in | Daily | `sleep_team_questionnaire.json` (`type: "bedtime"`) |
| Cognition test battery (with built-in reaction-time test) | Weekly | `cognition.json` |
| Saliva sample | Every other week | `cellular_profile.json` |
| Balance & blood pressure test | Every other week | `cardiac.json` |
| Blood & urine collection | Monthly | `biochemical_markers.json` |
| Microbiome swabs | Monthly | `microbiome.json` |
| Carotid artery ultrasound | Every 3 months | `carotid_intima_media_thickness.json` |

A test counts as done when a record is saved in its window. A window opens up to
3 days before the due date (so tests can be done early; daily tasks have no
early window) and closes when the next one opens.
