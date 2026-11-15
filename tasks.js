const CREW_ID = "CM-01";
const MISSION_PHASE = "in-flight";

// ---- The tasks ----
// To add a test: copy one of these, give it a new id, and set:
//   frequencyDays  how often it repeats (1 = daily, 14 = every other week)
//   startDate      the first day it's due (YYYY-MM-DD); later dates follow from the frequency
//   file           which data/*.json file the answers go into
//   isRecord(r)    which records in that file count as this task being done
//   steps          the screens of the questionnaire (see "Questionnaire" below for field types)
//   build(v, ctx)  turns the answers into the record(s) to save

const TASKS = [
  {
    id: "sleep-wake",
    name: "Morning Sleep Log",
    short: "Sleep Log",
    frequencyDays: 1,
    startDate: "2026-11-01",
    file: "sleep_team_questionnaire",
    isRecord: function (r) { return r.type === "wake"; },
    steps: [
      {
        title: "Before you start",
        text: ["Complete this questionnaire within 30 minutes of waking up, before consuming caffeine or starting work.",
               "Answer to the best of your ability about your sleep last night."]
      },
      {
        title: "Sleep Quantitative Metrics",
        fields: [
          { key: "sleep_duration_hours", label: "How many hours did you sleep?", type: "number", unit: "hours", min: 0, max: 16, step: 0.1 },
          { key: "sleep_latency_min", label: "About how long did it take to fall asleep?", type: "number", unit: "min", min: 0, max: 240, step: 1 },
          { key: "awakenings", label: "How many times did you wake up during the night?", type: "number", min: 0, max: 30, step: 1 }
        ]
      },
      {
        title: "Sleep Qualitative Metrics",
        fields: [
          { key: "sleep_quality_1_5", label: "Overall, how well would you rate your sleep?", type: "scale", low: "Very poorly", high: "Very well" },
          { key: "refreshed_1_5", label: "Did you wake up feeling refreshed?", type: "scale", low: "Not at all", high: "Fully refreshed" }
        ]
      }
    ],
    build: function (v, ctx) {
      return {
        crew_id: CREW_ID, type: "wake", timestamp: ctx.timestamp,
        sleep_duration_hours: v.sleep_duration_hours, sleep_latency_min: v.sleep_latency_min,
        awakenings: v.awakenings, sleep_quality_1_5: v.sleep_quality_1_5, refreshed_1_5: v.refreshed_1_5
      };
    }
  },

  {
    id: "sleep-bedtime",
    name: "Evening Check-in",
    short: "Evening Check-in",
    frequencyDays: 1,
    startDate: "2026-11-01",
    file: "sleep_team_questionnaire",
    isRecord: function (r) { return r.type === "bedtime"; },
    steps: [
      {
        title: "Before you start",
        text: ["Complete this questionnaire shortly before going to sleep. Try to remember how you felt early in the day as well as how you feel now.",
               "Your answers are confidential to the medical team."]
      },
      {
        title: "Individually",
        fields: [
          { key: "mood_1_5", label: "Was today enjoyable?", type: "scale", low: "Not at all", high: "Very enjoyable" },
          { key: "stress_1_5", label: "How stressed were you?", type: "scale", low: "Not at all", high: "Extremely" },
          { key: "workload_1_5", label: "How heavy was your workload?", type: "scale", low: "Very light", high: "Overwhelming" }
        ]
      },
      {
        title: "The Team",
        fields: [
          { key: "team_cohesion_1_5", label: "How well did the crew get along?", type: "scale", low: "Poorly", high: "Very well" },
          { key: "team_performance_1_5", label: "How well did the crew work together on tasks?", type: "scale", low: "Poorly", high: "Very well" },
          { key: "livability_habitability_1_5", label: "Was the habitat a comfortable living space?", type: "scale", low: "Very uncomfortable", high: "Very comfortable" }
        ]
      }
    ],
    build: function (v, ctx) {
      return {
        crew_id: CREW_ID, type: "bedtime", timestamp: ctx.timestamp,
        mood_1_5: v.mood_1_5, stress_1_5: v.stress_1_5, team_cohesion_1_5: v.team_cohesion_1_5,
        team_performance_1_5: v.team_performance_1_5, workload_1_5: v.workload_1_5,
        livability_habitability_1_5: v.livability_habitability_1_5
      };
    }
  },

  {
    id: "saliva",
    name: "Saliva Sample",
    short: "Saliva Sample",
    frequencyDays: 14,
    startDate: "2026-11-12",
    file: "cellular_profile",
    isRecord: function (r) { return !!r.saliva; },
    steps: [
      {
        title: "Before you start",
        text: ["Collect the sample first thing in the morning."],
        list: ["Ensure you have had no food, drinks (except water), gum, or have not brushed your teeth in the last 30 minutes.",
               "Wash and dry your hands.",
               "Have ready: a saliva swab tube from the kit, a sample label, and a cold-stowage bag."],
        fields: [
          { key: "protocol_followed", label: "Have you gone 30 minutes without eating, drinking (except water) or brushing your teeth?", type: "yesno" }
        ]
      },
      {
        title: "Rinse",
        text: ["Rinse your mouth with water and swallow or spit it out. Then wait 10 minutes."],
        countdown: 600
      },
      {
        title: "Collect the sample",
        list: ["Open the tube and tip the swab into your mouth. Don't touch the swab with your fingers.",
               "Hold it under your tongue, for 2 minutes until it's soaked.",
               "Tip the swab back into the tube without touching it and press the cap on firmly."],
        countdown: 120
      },
      {
        title: "Label and stow",
        list: ["Write your crew ID, today's date and the time on the label and stick it on the tube.",
               "Put the tube in the cold-stowage bag and place it in the freezer within 30 minutes."],
        fields: [
          { key: "stowed", label: "Is the sample labeled and in cold stowage?", type: "yesno", mustBe: true,
            mustBeMessage: "Label and stow the sample before continuing." }
        ]
      },
      {
        title: "Results (optional)",
        text: ["If the on-board analyzer has already given results, enter them here. Otherwise leave these blank."],
        fields: [
          { key: "cortisol_nmol_l", label: "Cortisol", type: "number", unit: "nmol/L", min: 0, max: 200, step: 0.1, required: false },
          { key: "ebv_dna_copies_per_ml", label: "EBV DNA", type: "number", unit: "copies/mL", min: 0, max: 1000000, step: 1, required: false },
          { key: "cmv_dna_copies_per_ml", label: "CMV DNA", type: "number", unit: "copies/mL", min: 0, max: 1000000, step: 1, required: false }
        ]
      }
    ],
    build: function (v, ctx) {
      return {
        crew_id: CREW_ID, phase: MISSION_PHASE, timestamp: ctx.timestamp,
        sample_protocol_followed: v.protocol_followed,
        saliva: {
          cortisol_nmol_l: orNull(v.cortisol_nmol_l),
          ebv_dna_copies_per_ml: orNull(v.ebv_dna_copies_per_ml),
          cmv_dna_copies_per_ml: orNull(v.cmv_dna_copies_per_ml)
        }
      };
    }
  },

  {
    id: "cognition",
    name: "Cognition Test Battery",
    short: "Cognition Test Battery",
    frequencyDays: 7,
    startDate: "2026-11-16",
    file: "cognition",
    isRecord: function () { return true; },
    steps: [
      {
        title: "Before you start",
        list: ["Find a quiet spot where you won't be interrupted for about 25 minutes.",
               "Use the same laptop and position as last time if you can.",
               "No caffeine in the last hour, if possible."]
      },
      {
        title: "Reaction-time test",
        text: ["This is a short reaction speed test. Wait for the box to turn green, then click it (or press the space bar) as fast as you can.",
               "Don't click before it turns green. There are 5 rounds."],
        fields: [
          { key: "psychomotor_vigilance", label: "Reaction-time test", type: "pvt", trials: 5 }
        ]
      },
      {
        title: "Memory and reasoning tests",
        text: ["Complete the rest of the Cognition tests on the station laptop and copy each score here. Leave any test you skipped blank."],
        fields: [
          { key: "visual_object_learning", label: "Visual object learning", type: "number", unit: "% correct", min: 0, max: 100, step: 0.1, required: false },
          { key: "fractal_2_back", label: "Fractal 2-back", type: "number", unit: "% correct", min: 0, max: 100, step: 0.1, required: false },
          { key: "abstract_matching", label: "Abstract matching", type: "number", unit: "% correct", min: 0, max: 100, step: 0.1, required: false },
          { key: "line_orientation", label: "Line orientation", type: "number", unit: "% correct", min: 0, max: 100, step: 0.1, required: false },
          { key: "matrix_reasoning", label: "Matrix reasoning", type: "number", unit: "% correct", min: 0, max: 100, step: 0.1, required: false }
        ]
      },
      {
        title: "Speed and decision tests",
        fields: [
          { key: "motor_praxis", label: "Motor praxis", type: "number", unit: "ms", min: 0, max: 5000, step: 0.1, required: false },
          { key: "emotion_recognition", label: "Emotion recognition", type: "number", unit: "% correct", min: 0, max: 100, step: 0.1, required: false },
          { key: "digit_symbol_substitution", label: "Digit symbol substitution", type: "number", unit: "correct", min: 0, max: 200, step: 1, required: false },
          { key: "balloon_analog_risk", label: "Balloon analog risk", type: "number", unit: "avg pumps", min: 0, max: 200, step: 0.1, required: false }
        ]
      }
    ],
    build: function (v, ctx) {
      const units = {
        motor_praxis: "ms", visual_object_learning: "pct_correct", fractal_2_back: "pct_correct",
        abstract_matching: "pct_correct", line_orientation: "pct_correct", emotion_recognition: "pct_correct",
        matrix_reasoning: "pct_correct", digit_symbol_substitution: "correct_responses",
        balloon_analog_risk: "avg_pumps"
      };
      const tests = [];
      Object.keys(units).forEach(function (test) {
        if (v[test] != null) tests.push({ test: test, unit: units[test], score: v[test], duration_seconds: null });
      });
      const pvt = v.psychomotor_vigilance;
      tests.push({ test: "psychomotor_vigilance", unit: "ms", score: pvt.mean_ms, duration_seconds: pvt.duration_seconds });
      return { crew_id: CREW_ID, timestamp: ctx.timestamp, phase: MISSION_PHASE, tests: tests };
    }
  },

  {
    id: "cardiac",
    name: "Blood Pressure, Heart Rate, and Pulse Oximetry",
    short: "Blood Pressure, Heart Rate, and Pulse Oximetry",
    frequencyDays: 1,
    startDate: "2026-11-18",
    file: "cardiac",
    isRecord: function () { return true; },
    steps: [
      {
        title: "Blood Pressure, Heart Rate, and Pulse Oximetry",
        text: ["Place the blood pressure cuff on your upper arm and the pulse oximeter on your finger. Raise your arm to heart level, then record the readings here."],
        countdown: 300,
        fields: [
          { key: "heart_rate", label: "Heart rate", type: "number", unit: "bpm", min: 25, max: 220, step: 1 },
          { key: "bp_systolic", label: "Blood pressure, top number (systolic)", type: "number", unit: "mmHg", min: 50, max: 250, step: 1 },
          { key: "bp_diastolic", label: "Blood pressure, bottom number (diastolic)", type: "number", unit: "mmHg", min: 30, max: 150, step: 1 },
          { key: "pulse_oximetry", label: "Pulse oximetry", type: "number", unit: "%", min: 50, max: 100, step: 1 }
        ]
      }
    ],
    build: function (v, ctx) {
      return {
        crew_id: CREW_ID, phase: MISSION_PHASE, timestamp: ctx.timestamp,
        heart_rate: v.heart_rate,
        bp_systolic: v.bp_systolic,
        bp_diastolic: v.bp_diastolic,
        pulse_oximetry: v.pulse_oximetry
      };
    }
  },

  {
    id: "blood-urine",
    name: "Blood & Urine Collection",
    short: "Blood & Urine",
    frequencyDays: 30,
    startDate: "2026-11-21",
    file: "biochemical_markers",
    isRecord: function () { return true; },
    steps: [
      {
        title: "Before you start",
        text: ["This test has two parts: a 24-hour urine collection, which you should have just completed, and a fasting blood draw done by the crew medical officer."],
        list: ["No food for 8 hours before the blood draw. Water is fine.",
               "Have ready: the blood collection kit, the 24-hour urine container, labels, and the centrifuge."],
        fields: [
          { key: "fasted", label: "Have you fasted for at least 8 hours?", type: "yesno" },
          { key: "urine_complete", label: "Was every urination in the last 24 hours collected?", type: "yesno" }
        ]
      },
      {
        title: "Blood draw",
        list: ["The crew medical officer will draw blood according to the kit instructions.",
               "Gently turn each tube upside down 8 to 10 times, then spin them in the centrifuge as per the kit instructions.",
               "Label each tube and put them in cold stowage."],
        fields: [
          { key: "blood_stowed", label: "Are all tubes labeled and in cold stowage?", type: "yesno", mustBe: true,
            mustBeMessage: "Label and stow the tubes before continuing." }
        ]
      },
      {
        title: "Blood results (optional)",
        text: ["If the on-board analyzer has results, enter them. Otherwise leave these blank."],
        fields: [
          { key: "glucose_mg_dl", label: "Glucose", type: "number", unit: "mg/dL", min: 0, max: 600, step: 0.1, required: false },
          { key: "total_cholesterol_mg_dl", label: "Total cholesterol", type: "number", unit: "mg/dL", min: 0, max: 600, step: 1, required: false },
          { key: "hdl_mg_dl", label: "HDL", type: "number", unit: "mg/dL", min: 0, max: 200, step: 1, required: false },
          { key: "ldl_mg_dl", label: "LDL", type: "number", unit: "mg/dL", min: 0, max: 400, step: 1, required: false },
          { key: "vitamin_d_ng_ml", label: "Vitamin D", type: "number", unit: "ng/mL", min: 0, max: 200, step: 0.1, required: false },
          { key: "ferritin_ng_ml", label: "Ferritin", type: "number", unit: "ng/mL", min: 0, max: 2000, step: 1, required: false },
          { key: "crp_mg_l", label: "CRP", type: "number", unit: "mg/L", min: 0, max: 300, step: 0.01, required: false },
          { key: "serum_calcium_mg_dl", label: "Serum calcium", type: "number", unit: "mg/dL", min: 0, max: 20, step: 0.01, required: false }
        ]
      },
      {
        title: "Urine results (optional)",
        fields: [
          { key: "ntx_nmol_bce_mmol_creat", label: "NTx", type: "number", unit: "nmol BCE/mmol creat", min: 0, max: 500, step: 0.1, required: false },
          { key: "urine_cortisol_ug_24h", label: "Cortisol", type: "number", unit: "µg/24h", min: 0, max: 1000, step: 0.1, required: false },
          { key: "sodium_mmol_24h", label: "Sodium", type: "number", unit: "mmol/24h", min: 0, max: 1000, step: 1, required: false },
          { key: "urine_calcium_mg_24h", label: "Calcium", type: "number", unit: "mg/24h", min: 0, max: 1000, step: 1, required: false }
        ]
      }
    ],
    build: function (v, ctx) {
      return {
        crew_id: CREW_ID, phase: MISSION_PHASE, timestamp: ctx.timestamp,
        fasted: v.fasted, urine_collection_complete: v.urine_complete,
        blood: {
          glucose_mg_dl: orNull(v.glucose_mg_dl), total_cholesterol_mg_dl: orNull(v.total_cholesterol_mg_dl),
          hdl_mg_dl: orNull(v.hdl_mg_dl), ldl_mg_dl: orNull(v.ldl_mg_dl),
          vitamin_d_ng_ml: orNull(v.vitamin_d_ng_ml), ferritin_ng_ml: orNull(v.ferritin_ng_ml),
          crp_mg_l: orNull(v.crp_mg_l), serum_calcium_mg_dl: orNull(v.serum_calcium_mg_dl)
        },
        urine: {
          ntx_nmol_bce_mmol_creat: orNull(v.ntx_nmol_bce_mmol_creat), cortisol_ug_24h: orNull(v.urine_cortisol_ug_24h),
          sodium_mmol_24h: orNull(v.sodium_mmol_24h), calcium_mg_24h: orNull(v.urine_calcium_mg_24h)
        }
      };
    }
  },

  {
    id: "microbiome",
    name: "Microbiome swabs",
    short: "Microbiome",
    frequencyDays: 30,
    startDate: "2026-11-28",
    file: "microbiome",
    isRecord: function () { return true; },
    steps: [
      {
        title: "Before you start",
        list: ["Take the skin swab before cleaning yourself.",
               "Have ready: the microbiome kit (fecal, saliva and skin swabs), labels and a cold-stowage bag."]
      },
      {
        title: "Collect the swabs",
        list: ["Fecal: after a bowel movement, swab the used wipe as the kit card shows.",
               "Saliva: rub the swab along the inside of your cheek for 30 seconds.",
               "Skin: rub the swab firmly on the inside of your forearm for 30 seconds.",
               "Put each swab in its own tube, cap it, label it, and place it in cold stowage."],
        fields: [
          { key: "sites", label: "Which samples did you collect?", type: "checks",
            options: [{ value: "fecal", label: "Fecal" }, { value: "saliva", label: "Saliva" }, { value: "skin", label: "Skin" }] }
        ]
      },
      {
        title: "Results (optional)",
        text: ["If the on-board sequencer has a Shannon diversity number for a sample, enter it. Otherwise leave it blank."],
        fields: [
          { key: "shannon_fecal", label: "Fecal: Shannon diversity", type: "number", unit: "index", min: 0, max: 10, step: 0.01, required: false,
            showIf: function (v) { return (v.sites || []).indexOf("fecal") !== -1; } },
          { key: "shannon_saliva", label: "Saliva: Shannon diversity", type: "number", unit: "index", min: 0, max: 10, step: 0.01, required: false,
            showIf: function (v) { return (v.sites || []).indexOf("saliva") !== -1; } },
          { key: "shannon_skin", label: "Skin: Shannon diversity", type: "number", unit: "index", min: 0, max: 10, step: 0.01, required: false,
            showIf: function (v) { return (v.sites || []).indexOf("skin") !== -1; } }
        ]
      }
    ],
    // One record per sample site, the same way the existing file stores them
    build: function (v, ctx) {
      return v.sites.map(function (site) {
        return {
          crew_id: CREW_ID, phase: MISSION_PHASE, timestamp: ctx.timestamp, sample_site: site,
          shannon_diversity: orNull(v["shannon_" + site]), relative_abundance: null
        };
      });
    }
  },

  {
    id: "carotid",
    name: "Carotid artery ultrasound",
    short: "Carotid scan",
    frequencyDays: 90,
    startDate: "2026-12-03",
    file: "carotid_intima_media_thickness",
    isRecord: function () { return true; },
    steps: [
      {
        title: "Before you start",
        list: ["You will need a crewmate to operate the ultrasound.",
               "Have ready: the ultrasound unit, linear probe, and gel.",
               "Rest for 5 minutes before scanning."]
      },
      {
        title: "Left side",
        list: ["Remain still and relaxed with your head turned about 45° to the right.",
               "The operator finds the left common carotid artery, about 1 cm below where it splits.",
               "Measure the thickness of the far wall (intima-media) and read it from the screen."],
        fields: [
          { key: "left_cca_imt", label: "Left carotid wall thickness", type: "number", unit: "mm", min: 0.2, max: 3, step: 0.001 }
        ]
      },
      {
        title: "Right side",
        list: ["Turn your head about 45° to the left.",
               "Repeat the same measurement on the right common carotid artery."],
        fields: [
          { key: "right_cca_imt", label: "Right carotid wall thickness", type: "number", unit: "mm", min: 0.2, max: 3, step: 0.001 }
        ]
      },
      {
        title: "Plaque check",
        fields: [
          { key: "plaque_detected", label: "Did you or your crewmate observe any plaque on either side?", type: "yesno" }
        ]
      }
    ],
    build: function (v, ctx) {
      return {
        crew_id: CREW_ID, phase: MISSION_PHASE, timestamp: ctx.timestamp, unit: "mm",
        left_cca_imt: v.left_cca_imt, right_cca_imt: v.right_cca_imt, plaque_detected: v.plaque_detected
      };
    }
  }
];

function orNull(value) { return value == null ? null : value; }
function findTask(id) { return TASKS.find(function (t) { return t.id === id; }); }


// ---- Dates ----
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date, n) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n); }
function todayDate() { return startOfDay(new Date()); }
function parseDay(text) {
  const parts = text.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS); }
function sameDay(a, b) { return daysBetween(a, b) === 0; }

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatFrequency(days) {
  if (days === 1) return "Daily";
  if (days === 7) return "Weekly";
  if (days === 14) return "Every other week";
  if (days === 30) return "Monthly";
  if (days === 90) return "Every 3 months";
  if (days % 7 === 0) return "Every " + (days / 7) + " weeks";
  return "Every " + days + " days";
}

function formatDue(date) {
  const diff = daysBetween(todayDate(), date);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff > 1 && diff < 7) return "Due " + date.toLocaleDateString("en-US", { weekday: "long" });
  return "Due " + formatShortDate(date);
}

// How many days ahead a test can be done and still count (none for daily tasks)
function earlyDays(task) { return Math.min(3, Math.floor(task.frequencyDays / 2)); }

function recordsFor(task) {
  return (HealthData.data[task.file] || []).filter(task.isRecord);
}

// The latest due date on or before `date` (null if the task hasn't started yet)
function dueOnOrBefore(task, date) {
  const start = parseDay(task.startDate);
  const diff = daysBetween(start, date);
  if (diff < 0) return null;
  return addDays(start, diff - (diff % task.frequencyDays));
}

function isDueDate(task, date) {
  const diff = daysBetween(parseDay(task.startDate), date);
  return diff >= 0 && diff % task.frequencyDays === 0;
}

function doneInWindow(task, dueDate) {
  const begin = addDays(dueDate, -earlyDays(task));
  const end = addDays(begin, task.frequencyDays);
  return recordsFor(task).some(function (r) {
    const when = new Date(r.timestamp);
    return when >= begin && when < end;
  });
}

function lastDone(task) {
  let latest = null;
  recordsFor(task).forEach(function (r) {
    const when = new Date(r.timestamp);
    if (!latest || when > latest) latest = when;
  });
  return latest;
}

// Where a task stands right now:
//   due      the due date it's shown under
//   done     already done for that due date
//   overdue  that date has passed and it still isn't done
//   bucket   which dashboard panel it goes in: "today", "week" or "later"

function taskStatus(task) {
  const today = todayDate();
  // The due date whose window today falls in
  const active = dueOnOrBefore(task, addDays(today, earlyDays(task)));
  let due, done = false, overdue = false;

  if (!active) {
    due = parseDay(task.startDate);            // hasn't started yet
  } else if (doneInWindow(task, active)) {
    if (active >= today) { due = active; done = true; }      // done today, or done early
    else due = addDays(active, task.frequencyDays);           // done; show the next one
  } else {
    due = active;
    overdue = active < today;
  }

  const daysAway = daysBetween(today, due);
  const bucket = daysAway <= 0 ? "today" : daysAway < 7 ? "week" : "later";
  return { due: due, done: done, overdue: overdue, bucket: bucket };
}

function dueText(status) {
  if (status.overdue) return "Overdue since " + formatShortDate(status.due);
  if (status.done) return sameDay(status.due, todayDate()) ? "Done today" : "Done early · " + formatDue(status.due);
  return formatDue(status.due);
}


// ---- Dashboard (left column) ----
const PANELS = [
  { bucket: "today", title: "Due today", empty: "Nothing else due today." },
  { bucket: "week", title: "This week", empty: "Nothing else this week." },
  { bucket: "later", title: "Coming up", empty: "Nothing scheduled." }
];

function sortByDue(a, b) { return a.status.due - b.status.due || a.task.name.localeCompare(b.task.name); }

function renderDashboardTasks() {
  const section = document.getElementById("dashboard-tasks");
  section.innerHTML = "";

  const items = TASKS.map(function (task) { return { task: task, status: taskStatus(task) }; });

  PANELS.forEach(function (panel) {
    const article = document.createElement("article");
    article.className = "panel";

    const heading = document.createElement("h3");
    const headingLink = document.createElement("a");
    headingLink.className = "task-link";
    headingLink.href = "#";
    headingLink.dataset.openList = "";
    headingLink.textContent = panel.title;
    heading.appendChild(headingLink);
    article.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "checklist";

    const inPanel = items.filter(function (item) { return item.status.bucket === panel.bucket; })
      .sort(function (a, b) { return (a.status.done - b.status.done) || sortByDue(a, b); });

    inPanel.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "task-item";
      if (item.status.done) li.classList.add("done");
      if (item.status.overdue) li.classList.add("overdue");

      const mark = document.createElement("span");
      mark.className = "task-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = item.status.done ? "✓" : item.status.overdue ? "!" : "";

      const text = document.createElement("div");
      const link = document.createElement("a");
      link.className = "task-link";
      link.href = "#";
      link.dataset.task = item.task.id;
      link.textContent = item.task.name;
      const meta = document.createElement("div");
      meta.className = "task-meta";
      meta.textContent = formatFrequency(item.task.frequencyDays) + " · " + dueText(item.status);
      text.appendChild(link);
      text.appendChild(meta);

      li.appendChild(mark);
      li.appendChild(text);
      list.appendChild(li);
    });

    if (!inPanel.length) {
      const li = document.createElement("li");
      li.className = "task-empty";
      li.textContent = panel.empty;
      list.appendChild(li);
    }

    article.appendChild(list);
    section.appendChild(article);
  });
}


// ---- All Tasks: List tab ----
function renderTaskList() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  TASKS.map(function (task) { return { task: task, status: taskStatus(task) }; })
    .sort(sortByDue)
    .forEach(function (item) {
      const li = document.createElement("li");
      li.dataset.task = item.task.id;
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      if (item.status.done) li.classList.add("done");

      const text = document.createElement("div");
      text.className = "task-list-text";
      const name = document.createElement("div");
      name.className = "task-list-name";
      name.textContent = item.task.name;
      const meta = document.createElement("div");
      meta.className = "task-meta";
      const last = lastDone(item.task);
      meta.textContent = dueText(item.status) + " · Last done " + (last ? formatShortDate(last) : "never");
      text.appendChild(name);
      text.appendChild(meta);

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = formatFrequency(item.task.frequencyDays);

      li.appendChild(text);
      li.appendChild(tag);
      list.appendChild(li);
    });
}


// ---- All Tasks: Calendar tab ----
const shownMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function renderCalendar() {
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const today = todayDate();
  document.getElementById("cal-title").textContent =
    shownMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(function (dayName) {
    const el = document.createElement("div");
    el.className = "cal-weekday";
    el.textContent = dayName;
    grid.appendChild(el);
  });

  // Blank boxes before the 1st, so the 1st lands on the right weekday
  const firstWeekday = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-day empty";
    grid.appendChild(blank);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (sameDay(date, today)) cell.classList.add("today");

    const dateNum = document.createElement("div");
    dateNum.className = "cal-date";
    dateNum.textContent = day;
    cell.appendChild(dateNum);

    // Every task due on this day
    TASKS.forEach(function (task) {
      if (!isDueDate(task, date)) return;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "cal-task";
      chip.dataset.task = task.id;

      const windowOver = daysBetween(addDays(date, task.frequencyDays - earlyDays(task)), today) >= 0;
      let state = "";
      if (doneInWindow(task, date)) { chip.classList.add("done"); state = " (done)"; }
      else if (date < today && windowOver) { chip.classList.add("missed"); state = " (missed)"; }
      else if (date < today) { chip.classList.add("overdue"); state = " (overdue)"; }

      chip.textContent = task.short;
      chip.title = task.name + " · " + formatFrequency(task.frequencyDays) + state;
      chip.setAttribute("aria-label", task.name + ", " + formatShortDate(date) + state);
      cell.appendChild(chip);
    });

    grid.appendChild(cell);
  }
}

document.getElementById("cal-prev").addEventListener("click", function () {
  shownMonth.setMonth(shownMonth.getMonth() - 1);
  renderCalendar();
});
document.getElementById("cal-next").addEventListener("click", function () {
  shownMonth.setMonth(shownMonth.getMonth() + 1);
  renderCalendar();
});

function renderAllTasks() {
  renderDashboardTasks();
  renderTaskList();
  if (!document.getElementById("calendar-panel").hidden) renderCalendar();
}


// ---- Questionnaire ----
// Field types:
//   number  a number, with optional unit, min, max and step
//   scale   1 to 5, with `low` and `high` labels for the ends
//   yesno   Yes / No (saved as true / false). `mustBe: true` means they can't go on until it's Yes
//   checks  pick one or more of `options`
//   pvt     the built-in reaction-time test
// Every field is required unless it has `required: false`. `showIf(values)` hides a field until it returns true.
// A step can also have `text` (paragraphs), `list` (numbered steps) and `countdown` (seconds, shows a timer).

let quiz = null;          // { task, stepIndex, values, savedTo }
const drafts = {};        // unfinished answers, kept per task until saved

const qTitle = document.getElementById("q-title");
const qKicker = document.getElementById("q-kicker");
const qCount = document.getElementById("q-count");
const qBar = document.getElementById("q-bar");
const qBody = document.getElementById("q-body");
const qPrev = document.getElementById("q-prev");
const qNext = document.getElementById("q-next");

function openQuestionnaire(taskId) {
  const task = findTask(taskId);
  if (!task) return;
  if (!quiz || quiz.task !== task || quiz.savedTo) {
    const draft = drafts[task.id];
    quiz = draft || { task: task, stepIndex: 0, values: {}, savedTo: null };
    drafts[task.id] = quiz;
  }
  showView("questionnaire");
  renderStep();
}

function visibleFields(step) {
  return (step.fields || []).filter(function (f) { return !f.showIf || f.showIf(quiz.values); });
}

// Steps plus the automatic review screen at the end
function stepCount() { return quiz.task.steps.length + 1; }
function onReview() { return quiz.stepIndex === quiz.task.steps.length; }

function renderStep() {
  stopCountdown();
  stopPvt();
  const task = quiz.task;
  const status = taskStatus(task);
  qTitle.textContent = task.name;
  qKicker.textContent = formatFrequency(task.frequencyDays) + " · " + dueText(status);
  qBody.innerHTML = "";

  if (quiz.savedTo) return renderSaved();

  const total = stepCount();
  qCount.textContent = "Step " + (quiz.stepIndex + 1) + " of " + total;
  qBar.style.width = ((quiz.stepIndex + 1) / total * 100) + "%";
  qPrev.hidden = quiz.stepIndex === 0;
  qNext.hidden = false;
  qNext.disabled = false;
  qNext.textContent = onReview() ? "Save results" : "Next";

  if (onReview()) return renderReview();

  const step = task.steps[quiz.stepIndex];
  const h2 = document.createElement("h2");
  h2.textContent = step.title;
  qBody.appendChild(h2);

  (step.text || []).forEach(function (para) {
    const p = document.createElement("p");
    p.textContent = para;
    qBody.appendChild(p);
  });

  if (step.list) {
    const ol = document.createElement("ol");
    ol.className = "q-steps";
    step.list.forEach(function (line) {
      const li = document.createElement("li");
      li.textContent = line;
      ol.appendChild(li);
    });
    qBody.appendChild(ol);
  }

  if (step.countdown) qBody.appendChild(buildCountdown(step.countdown));

  const fieldsWrap = document.createElement("div");
  fieldsWrap.className = "q-fields";
  visibleFields(step).forEach(function (field) { fieldsWrap.appendChild(buildField(field)); });
  qBody.appendChild(fieldsWrap);

  const first = qBody.querySelector("input");
  if (first && first.type === "number") first.focus();
}

function buildField(field) {
  const wrap = document.createElement("div");
  wrap.className = "q-field";
  wrap.dataset.key = field.key;

  const label = document.createElement("div");
  label.className = "q-label";
  label.id = "q-label-" + field.key;
  label.textContent = field.label + (field.required === false ? " (optional)" : "");
  wrap.appendChild(label);

  const value = quiz.values[field.key];

  if (field.type === "number") {
    const row = document.createElement("div");
    row.className = "q-number";
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.setAttribute("aria-labelledby", label.id);
    if (field.min != null) input.min = field.min;
    if (field.max != null) input.max = field.max;
    input.step = field.step || "any";
    if (value != null) input.value = value;
    input.addEventListener("input", function () {
      quiz.values[field.key] = input.value === "" ? null : Number(input.value);
      clearError(wrap);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); goNext(); }
    });
    row.appendChild(input);
    if (field.unit) {
      const unit = document.createElement("span");
      unit.className = "q-unit";
      unit.textContent = field.unit;
      row.appendChild(unit);
    }
    wrap.appendChild(row);
  }

  if (field.type === "scale" || field.type === "yesno") {
    const options = field.type === "scale"
      ? [1, 2, 3, 4, 5].map(function (n) { return { value: n, label: String(n) }; })
      : [{ value: true, label: "Yes" }, { value: false, label: "No" }];
    const group = document.createElement("div");
    group.className = "q-choices" + (field.type === "scale" ? " q-scale" : "");
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-labelledby", label.id);
    options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "q-choice";
      btn.textContent = opt.label;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", value === opt.value);
      btn.addEventListener("click", function () {
        quiz.values[field.key] = opt.value;
        group.querySelectorAll(".q-choice").forEach(function (b) { b.setAttribute("aria-checked", b === btn); });
        clearError(wrap);
      });
      group.appendChild(btn);
    });
    wrap.appendChild(group);
    if (field.type === "scale") {
      const ends = document.createElement("div");
      ends.className = "q-scale-ends";
      const low = document.createElement("span");
      low.textContent = "1 = " + field.low;
      const high = document.createElement("span");
      high.textContent = "5 = " + field.high;
      ends.appendChild(low);
      ends.appendChild(high);
      wrap.appendChild(ends);
    }
  }

  if (field.type === "checks") {
    const group = document.createElement("div");
    group.className = "q-choices";
    group.setAttribute("aria-labelledby", label.id);
    const chosen = value || [];
    field.options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "q-choice";
      btn.textContent = opt.label;
      btn.setAttribute("aria-pressed", chosen.indexOf(opt.value) !== -1);
      btn.addEventListener("click", function () {
        const current = quiz.values[field.key] || [];
        const on = current.indexOf(opt.value) === -1;
        quiz.values[field.key] = on
          ? current.concat(opt.value)
          : current.filter(function (v) { return v !== opt.value; });
        btn.setAttribute("aria-pressed", on);
        clearError(wrap);
      });
      group.appendChild(btn);
    });
    wrap.appendChild(group);
  }

  if (field.type === "pvt") wrap.appendChild(buildPvt(field, wrap));

  const error = document.createElement("div");
  error.className = "q-error";
  error.setAttribute("role", "alert");
  wrap.appendChild(error);
  return wrap;
}

function showError(wrap, message) {
  wrap.classList.add("invalid");
  wrap.querySelector(".q-error").textContent = message;
}
function clearError(wrap) {
  wrap.classList.remove("invalid");
  wrap.querySelector(".q-error").textContent = "";
}

// Check the fields on the current step. Returns true if they're all OK.
function validateStep() {
  const step = quiz.task.steps[quiz.stepIndex];
  let ok = true;
  visibleFields(step).forEach(function (field) {
    const wrap = qBody.querySelector('.q-field[data-key="' + field.key + '"]');
    const value = quiz.values[field.key];
    const empty = value == null || (Array.isArray(value) && !value.length);
    let message = "";
    if (empty) {
      if (field.required !== false) {
        message = field.type === "pvt" ? "Finish the reaction-time test to continue."
          : field.type === "checks" ? "Pick at least one."
          : field.type === "number" ? "Enter a number."
          : "Choose an answer.";
      }
    } else if (field.type === "number") {
      if (field.min != null && value < field.min) message = "Must be at least " + field.min + ".";
      else if (field.max != null && value > field.max) message = "Must be " + field.max + " or less.";
    } else if (field.mustBe != null && value !== field.mustBe) {
      message = field.mustBeMessage || "This is needed to continue.";
    }
    if (message) { showError(wrap, message); ok = false; }
  });
  if (!ok) {
    const firstBad = qBody.querySelector(".q-field.invalid");
    firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
    const input = firstBad.querySelector("input");
    if (input) input.focus();
  }
  return ok;
}

// Readable version of an answer, for the review screen
function displayValue(field, value) {
  if (value == null || (Array.isArray(value) && !value.length)) return "—";
  if (field.type === "yesno") return value ? "Yes" : "No";
  if (field.type === "scale") return value + " / 5";
  if (field.type === "checks") {
    return value.map(function (v) {
      return field.options.find(function (o) { return o.value === v; }).label;
    }).join(", ");
  }
  if (field.type === "pvt") return value.mean_ms + " ms average (" + value.trials.length + " rounds)";
  return value + (field.unit ? " " + field.unit : "");
}

function renderReview() {
  const h2 = document.createElement("h2");
  h2.textContent = "Check your answers";
  qBody.appendChild(h2);
  const p = document.createElement("p");
  p.textContent = "Go back to change anything. When it looks right, save.";
  qBody.appendChild(p);

  const table = document.createElement("dl");
  table.className = "q-review";
  quiz.task.steps.forEach(function (step) {
    visibleFields(step).forEach(function (field) {
      const dt = document.createElement("dt");
      dt.textContent = field.label;
      const dd = document.createElement("dd");
      dd.textContent = displayValue(field, quiz.values[field.key]);
      table.appendChild(dt);
      table.appendChild(dd);
    });
  });
  qBody.appendChild(table);
}

function renderSaved() {
  qCount.textContent = "Complete";
  qBar.style.width = "100%";
  qPrev.hidden = true;
  qNext.hidden = true;

  const h2 = document.createElement("h2");
  h2.textContent = "Saved ✓";
  qBody.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = quiz.savedTo === "file"
    ? "Your results were added to data/" + quiz.task.file + ".json."
    : "Your results are saved in this browser. They'll be written to data/" + quiz.task.file +
      ".json the next time the dashboard is opened with server.py running.";
  qBody.appendChild(p);

  const next = taskStatus(quiz.task);
  const p2 = document.createElement("p");
  p2.textContent = "Next one: " + formatShortDate(next.done ? addDays(next.due, quiz.task.frequencyDays) : next.due) + ".";
  qBody.appendChild(p2);

  const back = document.createElement("button");
  back.type = "button";
  back.className = "back-btn";
  back.textContent = "Back to dashboard";
  qBody.appendChild(back);
}

function cleanValues() {
  // Drop answers to fields that are hidden now (e.g. a sample site that was unticked)
  const values = {};
  quiz.task.steps.forEach(function (step) {
    visibleFields(step).forEach(function (f) { values[f.key] = quiz.values[f.key]; });
  });
  return values;
}

async function goNext() {
  if (onReview()) {
    qNext.disabled = true;
    qNext.textContent = "Saving…";
    try {
      const records = quiz.task.build(cleanValues(), { timestamp: new Date().toISOString() });
      quiz.savedTo = await HealthData.save(quiz.task.file, records);
      delete drafts[quiz.task.id];
    } catch (err) {
      console.error(err);
      qNext.disabled = false;
      qNext.textContent = "Save results";
      alertInline("Couldn't save: " + err.message);
      return;
    }
    renderAllTasks();
    renderStep();
    return;
  }
  if (!validateStep()) return;
  quiz.stepIndex++;
  renderStep();
  window.scrollTo(0, 0);
}

function alertInline(message) {
  const p = document.createElement("p");
  p.className = "q-error";
  p.textContent = message;
  qBody.appendChild(p);
}

qNext.addEventListener("click", goNext);
qPrev.addEventListener("click", function () {
  if (quiz.stepIndex > 0) quiz.stepIndex--;
  renderStep();
  window.scrollTo(0, 0);
});


// ---- Countdown timer (inside a step) ----
let countdownTick = null;

function stopCountdown() {
  if (countdownTick) clearInterval(countdownTick);
  countdownTick = null;
}

function buildCountdown(seconds) {
  const box = document.createElement("div");
  box.className = "q-countdown";
  const display = document.createElement("div");
  display.className = "q-countdown-time";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "q-btn secondary";

  let left = seconds;
  function show() {
    const m = Math.floor(left / 60), s = left % 60;
    display.textContent = m + ":" + String(s).padStart(2, "0");
  }
  function reset() {
    stopCountdown();
    left = seconds;
    btn.textContent = "Start timer";
    box.classList.remove("finished");
    show();
  }
  btn.addEventListener("click", function () {
    if (countdownTick) return reset();
    if (left <= 0) reset();
    const endAt = Date.now() + left * 1000;
    btn.textContent = "Reset";
    countdownTick = setInterval(function () {
      left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      show();
      if (left === 0) {
        stopCountdown();
        box.classList.add("finished");
        display.textContent = "Done";
        btn.textContent = "Restart timer";
      }
    }, 200);
  });

  reset();
  box.appendChild(display);
  box.appendChild(btn);
  return box;
}


// ---- Reaction-time test (short psychomotor vigilance test) ----
let pvt = null;          // the test currently running, if any
let pvtRespond = null;   // the response handler of the test on screen

function stopPvt() {
  if (pvt && pvt.timer) clearTimeout(pvt.timer);
  if (pvt && pvt.frame) cancelAnimationFrame(pvt.frame);
  pvt = null;
  pvtRespond = null;
}

// Space bar = click, while the reaction-time test is on screen
document.addEventListener("keydown", function (event) {
  if (event.key !== " " || !pvtRespond) return;
  if (!document.querySelector('.view.active[data-view="questionnaire"]')) return;
  event.preventDefault();
  if (!event.repeat) pvtRespond();
});

function buildPvt(field, wrap) {
  const trials = field.trials || 5;
  const box = document.createElement("div");
  box.className = "pvt";

  const target = document.createElement("button");
  target.type = "button";
  target.className = "pvt-target";
  const info = document.createElement("div");
  info.className = "pvt-info";
  box.appendChild(target);
  box.appendChild(info);

  function idle() {
    const done = quiz.values[field.key];
    target.className = "pvt-target";
    target.textContent = done ? "Run again" : "Start test";
    info.textContent = done
      ? "Result: " + done.mean_ms + " ms average over " + done.trials.length + " rounds."
      : "Click Start, then wait for green.";
  }

  function nextTrial() {
    target.className = "pvt-target waiting";
    target.textContent = "Wait…";
    info.textContent = "Round " + (pvt.results.length + 1) + " of " + trials;
    const delay = 2000 + Math.random() * 4000;   // 2 to 6 seconds, so it can't be predicted
    pvt.timer = setTimeout(function () {
      pvt.shownAt = performance.now();
      target.className = "pvt-target go";
      (function tick() {
        target.textContent = Math.round(performance.now() - pvt.shownAt) + " ms";
        pvt.frame = requestAnimationFrame(tick);
      })();
    }, delay);
  }

  function respond() {
    if (!pvt) {
      // Start a fresh run
      pvt = { results: [], falseStarts: 0, startedAt: performance.now(), shownAt: null, timer: null, frame: null };
      clearError(wrap);
      nextTrial();
      return;
    }
    if (pvt.shownAt == null) {
      // Clicked before green
      clearTimeout(pvt.timer);
      pvt.falseStarts++;
      target.className = "pvt-target early";
      target.textContent = "Too soon";
      info.textContent = "Wait for green. Restarting this round…";
      pvt.timer = setTimeout(nextTrial, 1200);
      return;
    }
    const rt = performance.now() - pvt.shownAt;
    cancelAnimationFrame(pvt.frame);
    pvt.shownAt = null;
    pvt.results.push(Math.round(rt));
    target.className = "pvt-target";
    target.textContent = Math.round(rt) + " ms";

    if (pvt.results.length < trials) {
      pvt.timer = setTimeout(nextTrial, 800);
      return;
    }
    const mean = pvt.results.reduce(function (a, b) { return a + b; }, 0) / pvt.results.length;
    quiz.values[field.key] = {
      mean_ms: Math.round(mean * 10) / 10,
      trials: pvt.results,
      false_starts: pvt.falseStarts,
      duration_seconds: Math.round((performance.now() - pvt.startedAt) / 1000)
    };
    pvt = null;
    setTimeout(idle, 900);
  }

  // pointerdown reacts faster than click; the space bar works too (see below)
  target.addEventListener("pointerdown", function (event) { event.preventDefault(); respond(); });
  pvtRespond = respond;

  idle();
  return box;
}


// ---- Clicks ----
document.addEventListener("click", function (event) {
  const listLink = event.target.closest("[data-open-list]");
  if (listLink) {
    event.preventDefault();
    showView("tasks");
    showTab("list");
    return;
  }
  const taskEl = event.target.closest("[data-task]");
  if (taskEl) {
    event.preventDefault();
    openQuestionnaire(taskEl.dataset.task);
  }
});
document.getElementById("task-list").addEventListener("keydown", function (event) {
  const li = event.target.closest("li[data-task]");
  if (li && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openQuestionnaire(li.dataset.task);
  }
});

// Stop timers when leaving the questionnaire
document.addEventListener("click", function (event) {
  if (event.target.closest(".back-btn")) { stopCountdown(); stopPvt(); }
});

// Draw once the data has loaded, and again at midnight-ish (checked every minute)
HealthData.ready.then(renderAllTasks).catch(function (err) {
  console.error(err);
  document.getElementById("dashboard-tasks").textContent = "Couldn't load task data: " + err.message;
});
let lastRenderDay = todayDate().getTime();
setInterval(function () {
  if (todayDate().getTime() !== lastRenderDay) {
    lastRenderDay = todayDate().getTime();
    renderAllTasks();
  }
}, 60000);
