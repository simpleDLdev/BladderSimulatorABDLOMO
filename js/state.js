/* ===========================
   state.js — Utilities & all state variables
   =========================== */

/* ===========================
   ABDL Bladder Game — v0.1
   =========================== */

let hydrationTimer = null;
let isHydrationPending = false; // New flag to track drink orders
const $ = (id) => document.getElementById(id);
function toast(msg) {
  const t = $('puToast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._id); toast._id = setTimeout(() => t.classList.remove('show'), 1800);
}
function d(s) { return Math.floor(Math.random() * s) + 1; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

/* ---------- State ---------- */
// MANUAL INPUTS
let manualPressure = 0;    // User sets this via slider (0-100)
let manualSaturation = 0;  // User sets this via slider (0-100)

let hydrationML = 400;     // Kept for logging, but doesn't auto-drive pressure anymore
let microNoiseOn = true;
let microStreak = 0;

let sessionRunning = false;
let meetingActive = false; // New: Blocks changes
let meetingTimer = null;
let lastChangeTime = Date.now();

let profileMode = localStorage.getItem('profileMode') || 'early';

let pendingMainEvent = null;
let pendingAmbientEvent = null;
let lastMicroEvent = null;
let lastMacroEvent = null;

let mainTimer = null, preChimeTimer = null, microTimer = null, tickInterval = null, audioNode = null;
let hideCountdown = true;
let mainEndAt = null;
let microEndAt = null;

let isGuideComplete = false;

/* --- NEW STATE VARIABLES --- */
let reactionInterval = null;
let reactionTimeLeft = 0;

let targetMicrosPerMain = 0;
let microCountThisMain = 0;
let microPauseUntilTs = 0;

let hydrationEndAt = null;

/* Add these with your other state variables */
let holdPenaltyCount = 0;   // Increases difficulty when you choose "Hold"
let regressionLeaks = 0;    // Tracks failures for "Back to Diapers"
let preSoakTimer = null;    // Timer for random background leaks

/* --- DESK MODE (filters out movement-heavy & hard-to-do events) --- */
let deskModeEnabled = JSON.parse(localStorage.getItem('deskModeEnabled') || 'false');

/* Event tags for filtering */
const EVENT_TAG = {
  REQUIRES_STANDING: 'requires_standing',
  REQUIRES_WALKING:  'requires_walking',
  REQUIRES_FLOOR:    'requires_floor',       // lying, planking, hands-and-knees
  REQUIRES_SQUAT:    'requires_squat',
  INVOLUNTARY:       'involuntary',          // laugh, sneeze, hiccup, shiver — can't do on demand
  REQUIRES_PERSON:   'requires_person',      // tickle, cuddle — needs another person
  REQUIRES_CONTEXT:  'requires_context',     // morning pressure, warm bath, doorbell — situational
};

/* Tags that desk mode filters out */
const DESK_MODE_BLOCKED_TAGS = [
  EVENT_TAG.REQUIRES_STANDING,
  EVENT_TAG.REQUIRES_WALKING,
  EVENT_TAG.REQUIRES_FLOOR,
  EVENT_TAG.REQUIRES_SQUAT,
];

/* Involuntary event filter (sneeze/laugh/hiccup/cough/tickle) */
let involuntaryFilterEnabled = JSON.parse(localStorage.getItem('involuntaryFilterEnabled') || 'false');

/**
 * Filter an array of events based on active mode filters (desk mode + involuntary).
 * Works on raw table arrays (items with optional `tags` property).
 * Returns the filtered array, or the original if filtering would leave it empty.
 */
function filterByTags(arr) {
  if (!deskModeEnabled && !involuntaryFilterEnabled) return arr;
  const blocked = [];
  if (deskModeEnabled) blocked.push(...DESK_MODE_BLOCKED_TAGS);
  if (involuntaryFilterEnabled) blocked.push(EVENT_TAG.INVOLUNTARY, EVENT_TAG.REQUIRES_PERSON, EVENT_TAG.REQUIRES_CONTEXT);
  const filtered = arr.filter(item => {
    const tags = item.tags || [];
    return !tags.some(t => blocked.includes(t));
  });
  return filtered.length ? filtered : arr;
}

/* --- PUSH-TO-LEAK MODE --- */
let pushToLeakEnabled = JSON.parse(localStorage.getItem('pushToLeakEnabled') || 'false');
let pushToLeakSkipLong = JSON.parse(localStorage.getItem('pushToLeakSkipLong') || 'false');
let pushToLeakHeld = false; // Whether the leak button is currently being held

/* --- PROTECTION STASH SYSTEM --- */
let protectionStash = JSON.parse(localStorage.getItem('protectionStash') || 'null') || {
  pad: null,        // null = unlimited/not tracked, number = exact count
  pullups: null,
  diapers: null,
  thick_diapers: null
};
let stashTrackingEnabled = JSON.parse(localStorage.getItem('stashTrackingEnabled') || 'false');

/* --- CUSTOM PROFILE SYSTEM --- */
let activeCustomProfile = JSON.parse(localStorage.getItem('activeCustomProfile') || 'null');
let customProfileRuntime = activeCustomProfile?.runtime || null;
let disabledEventsByProfile = JSON.parse(localStorage.getItem('disabledEventsByProfile') || '{}');
let appendedEventsByProfile = JSON.parse(localStorage.getItem('appendedEventsByProfile') || '{}');
let eventBuilderState = { index: 0, events: [] };
let _profileDetailsCurrent = null;
let progressionUpgradeThreshold = 3;
let progressionDowngradeThreshold = 2;

/* ---------- URGENCY SCALE (0-10) — Full per-profile tables ---------- */

// Track scheduled micro IDs so they can be cancelled when a new cycle starts
let babysitterMicroTimerIds = [];

/* --- BABYSITTER NPT MODE --- */
// When true, skip potty cycles entirely for mostly/fully incontinent — pure auto-void/change flow
let babysitterNPTMode = JSON.parse(localStorage.getItem('babysitterNPTMode') || 'false');

/* --- DEPENDENT MODE STATE --- */
let depMicroCount = 0;
let depMicroTarget = 3; // Will be randomized
let sessionStartTime = Date.now();

// Dependent profile custom settings (loaded from setup modal)
let depQueueMin = 1;
let depQueueMax = 6;
let depSpasmMin = 8;
let depSpasmMax = 15;
let depSipMin = 2;
let depSipMax = 5;
let depUseDiuretics = true;

/* --- TRAINING PROFILES SETUP DATA --- */
let rookieVoidMin = 25;
let rookieVoidMax = 50;
let rookieSuccessRate = 60;
let rookieMercy = true;

let proVoidMin = 50;
let proVoidMax = 90;
let proSuccessRate = 35;
let proMercy = true;

let nptVoidMin = 45;
let nptVoidMax = 90;
let nptSatThreshold = 85;
let nptMercy = true;
let nptSipMin = 2;
let nptSipMax = 5;

let chaosSipMin = 2;
let chaosSipMax = 6;

/* --- OMORASHI MODE STATE --- */
let omorashiHoldMinMins = 45;
let omorashiHoldMaxMins = 90;
let omorashiSipMin = 1;
let omorashiSipMax = 3;
let omorashiStressTestMinMins = 8;  // Stress test interval min (minutes)
let omorashiStressTestMaxMins = 20; // Stress test interval max (minutes)
let omorashiDurationMs = 30 * 60000; // Default 30 minutes
let omorashiPermissionRate = 50; // 50% chance to get permission
let omorashiStartTime = null;
let omorashiStressTestTimer = null;
let omorashiSessionActive = false;
let currentOmorashiSipAmount = 2; // Current cycle's sip amount
let omorashiGuideActive = false; // Prevent stacking guides

/* --- BABYSITTER MODE STATE --- */
let babysitterDryStreak = 0; // Number of successful holds without failing
let babysitterTotalCycles = 0; // Total potty check cycles completed
let babysitterFailureCount = 0; // Cumulative failures (for escalation)
let lastBabysitterAccidentMeta = null;
let babysitterCheckTimer = null; // Timer for periodic babysitter check-in events

/* --- BABYSITTER DIAPERING SYSTEM STATE --- */
let protectionTypes = ['pad']; // User-selected protection types
let currentProtectionLevel = 'pad'; // Current level: pad, pullups, diapers, thick_diapers
let protectionSuccesses = 0; // Successes at current level
let protectionFailures = 0; // Failures at current level
let autoModeEnabled = false;
let autoDifficulty = 'medium'; // easy, medium, hard
const PROTECTION_HIERARCHY = ['pad', 'pullups', 'diapers', 'thick_diapers']; // Progression order

/* --- CONTINENCE LEVEL SYSTEM --- */
let currentContinenceLevel = 'mostly_continent';
const CONTINENCE_LEVELS = ['fully_continent', 'mostly_continent', 'somewhat_incontinent', 'mostly_incontinent', 'fully_incontinent'];

/* --- SYMPTOM / CURSE SYSTEM --- */
let activeSymptoms = []; // Array of symptom keys active this session
let activeCurses = [];   // Array of curse keys active this session
let pottyPasses = 0;


let audioCtx = null;
let alarmInterval = null;


let dailyChangeCount = 0;

