# Astronaut Health Dashboard (NASA Space Apps)

**Presented by:** Sparks of Inspiration

**Members:** Caleb Hansen, Binh Nguyen, Hannah Kim, Diego E. Benitez-Arroyo

**Disclaimer:** Our code was made with assistance from Claude.ai.

## Summary

This app is a dashboard for logging astronaut health statistics and keeping track of daily, weekly, and upcoming tests. It displays the logged data as graphs so trends are easy to see. Each category of data has its own tab at the top of the page. When a new reading is unusual compared with the trend, its tab, graph, and reading box turn from green to **orange**. When a reading is outside the safe limits, they turn **red**.

---

## How to run it (for judges)

The app runs on your own computer with a small Python server. **The only thing you need is Python 3.** There is nothing to install with pip or npm.

### 1. Check that Python 3 is installed

Open a terminal (**Terminal** on macOS/Linux, **Command Prompt** or **PowerShell** on Windows) and run:

| System | Command |
| --- | --- |
| macOS / Linux | `python3 --version` |
| Windows | `python --version` (or `py --version`) |

If it prints `Python 3.x.x`, you're ready. If not, install Python 3 from [python.org/downloads](https://www.python.org/downloads/). On Windows, tick **"Add Python to PATH"** during setup.

### 2. Download the project

Use **either** option.

**Option A: Download ZIP (no Git needed)**
1. Go to https://github.com/chans29/SpaceAppsHackathon
2. Click the green **Code** button, then **Download ZIP**.
3. Unzip it. You'll get a folder named `SpaceAppsHackathon-main`.

**Option B: Clone with Git**
```
git clone https://github.com/chans29/SpaceAppsHackathon.git
```

### 3. Start the server

In the terminal, go into the project folder, then start the server:

**macOS / Linux**
```
cd path/to/SpaceAppsHackathon
python3 server.py
```

**Windows**
```
cd path\to\SpaceAppsHackathon
python server.py
```
(If `python` isn't found, use `py server.py`.)

You should see:
```
Dashboard running at http://localhost:8000  (Ctrl+C to stop)
```

> **Tip:** an easy way to get the folder path is to type `cd ` (with a space) and then drag the project folder into the terminal window.

### 4. Open the dashboard

Open **http://localhost:8000** in any modern browser (Chrome, Edge, Firefox, or Safari). Leave the terminal open while you use the app.

### 5. Stop the server

Click in the terminal and press **Ctrl+C**.

### Troubleshooting

| Problem | Fix |
| --- | --- |
| Home says *"Couldn't load task data"* or the tabs say *"Could not load the data files"* | The page was opened by double-clicking `index.html`. Browsers block that. Start `server.py` and use http://localhost:8000. |
| *"Address already in use"* | Another program is using port 8000. Run `python3 server.py 9000` (or `python server.py 9000`) and open http://localhost:9000. |
| `python3` / `python` not recognized | Python isn't installed or isn't on PATH. See step 1. On Windows, try `py`. |
| Fonts look plain | The retro fonts load from Google Fonts. Without internet, the app still works fully, just in a fallback font. |
| Changes don't show up | Refresh the page. The server always sends fresh data, so a normal refresh is enough. |

---

## What to try

1. **Home screen.** The left column lists tests that are due today, this week, and coming up. Overdue tests are orange. The right column has a small graph for each data category. Click a graph to open its tab.
2. **Tabs at the top.** Each tab shows one data category. Pick a measure from the **Measure** menu to see its chart, its trendline, and the safe limits. Hover over the points for details. The box on the right explains whether the latest reading is Normal, Watch (orange), or Danger (red), and why.
3. **Complete a test.** Click a task on the Home screen (for example **Morning Sleep Log**) and go through the steps. When you save, the new reading is written to the matching file in `data/` and shows up in the graphs right away. The **Cognition Test Battery** includes a built-in reaction-time test.
4. **Quick Links** (bottom of Home):
   - **Calendar** shows every test's schedule.
   - **Exercise**, **CPR**, and **First aid** are zero-gravity guides with sources.
   - **Timer** is a stopwatch.
   - **Tech support** has contact info.

> **Note:** saving a test adds records to the JSON files in `data/`. To reset the sample data afterwards, re-download the project, or run `git checkout data/` if you cloned it.

---

## How the warnings work

For every measure, the app fits a trendline through all readings **except the latest one**. It then checks the latest reading:

- **Danger (red):** the reading is outside the safe limits.
- **Watch (orange):** the reading is outside the trendline's 95% prediction range, meaning it's unusual for this astronaut even if it's within the safe limits.
- **Normal (green):** neither of the above.

A tab takes the color of its worst measure. The safe limits are placeholders based on common adult reference ranges. They are not medical advice.

---

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page layout, styles, view switching, timer, and the data tabs and charts |
| `app.css` | Home screen layout and base colors |
| `tasks.js` | Test schedule, task lists, calendar, and the step-by-step questionnaires |
| `data.js` | Loads `data/*.json` and saves new records |
| `server.py` | Local server that serves the site and writes new records into `data/*.json` |
| `data/*.json` | Sample astronaut data, one file per category |

If the page is opened some other way, such as a static host or VS Code Live Server, saved answers are kept in the browser instead. They are written to the files the next time the dashboard is opened through `server.py`.

## Tests and how often they're due

The tests are defined in the `TASKS` list at the top of `tasks.js`. Change `frequencyDays` or `startDate` there to adjust the schedule.

| Test | Frequency | Saved to |
| --- | --- | --- |
| Morning Sleep Log | Daily | `sleep_team_questionnaire.json` (`type: "wake"`) |
| Evening Check-in | Daily | `sleep_team_questionnaire.json` (`type: "bedtime"`) |
| Blood Pressure, Heart Rate, and Pulse Oximetry | Daily | `cardiac.json` |
| Cognition Test Battery (with built-in reaction-time test) | Weekly | `cognition.json` |
| Saliva Sample | Every other week | `cellular_profile.json` |
| Blood & Urine Collection | Monthly | `biochemical_markers.json` |
| Microbiome swabs | Monthly | `microbiome.json` |
| Carotid artery ultrasound | Every 3 months | `carotid_intima_media_thickness.json` |

A test counts as done when a record is saved in its window. A window opens up to 3 days before the due date, so tests can be done early (daily tasks have no early window). It closes when the next window opens.