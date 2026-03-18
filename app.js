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
const URGENCY_SCALE = {
  neutral: [
    'No urge whatsoever — bladder feels empty, not thinking about it at all.',
    'Slightest hint of an urge, not enough to distract you from anything.',
    'First clear feeling of an urge. Still comfortable.',
    'A clear urge that lingers whenever you\'re not busy with something interesting.',
    'The urge is starting to become uncomfortable.',
    'Aware of the urge almost constantly. Shifting, squeezing thighs together.',
    'Very aware of the urge. Squirming, fidgeting, maybe crossing legs.',
    'Constant urge to squirm and fidget. Tightly crossed legs. "Gotta pee gotta pee!"',
    'Bursting. You know you can\'t hold much longer. Can\'t sit still, maybe using a hand.',
    'Not wetting yet, but right on the edge. Maybe leaking. Doing everything to hold.',
    'You\'re peeing.'
  ],
  dependent: [
    'Nothing right now. Bladder feels empty. Enjoy the calm while it lasts.',
    'The faintest twinge — barely there, easily ignored.',
    'A gentle nudge. Your bladder is starting to fill but you\'re fine.',
    'A steady, low hum of need. Easy to forget if you\'re distracted.',
    'Getting harder to ignore. The spasm queue is starting to build.',
    'Uncomfortable now. Shifting around, squeezing thighs together instinctively.',
    'Squirming constantly. Your body is reminding you that control is slipping.',
    'Can\'t sit still. Rocking, pressing, desperate little movements. Spasms coming fast.',
    'Spasms building fast. Another void is coming whether you want it or not.',
    'Bladder releasing on its own. Nothing you can do — it\'s happening.',
    'Uh-oh — wetting again. That\'s just how it goes now.'
  ],
  npt: [
    'Nothing happening. Completely empty and relaxed.',
    'The tiniest hint of warmth or fullness — barely registers.',
    'A soft, distant signal. Your body is filling but you\'re not concerned.',
    'Mild background awareness. You notice it if you think about it.',
    'Pressure building. Harder to tune out now.',
    'Constant low-level need. You\'re shifting without thinking about it.',
    'Your body is getting louder. Fidgeting, squeezing, trying to delay the inevitable.',
    'Desperate. Clenching hard, rocking, pressing thighs together. Losing ground fast.',
    'Body is giving up control. A flood is very close.',
    'Barely holding — probably already dribbling. This is the last moment.',
    'Uh-oh… you\'re wetting.'
  ],
  train_rookie: [
    'Totally empty. Ready for your training session.',
    'A tiny signal — so faint it could be nothing.',
    'First real sensation. You can feel the fill starting.',
    'Noticeable now. Your bladder is getting your attention.',
    'The hold is getting real. You\'re starting to feel tested.',
    'Squirming starts here. The urge is constant and annoying.',
    'Very uncomfortable. You\'re second-guessing how long you can last.',
    'Desperate territory. Everything is tight, pressed, and precarious.',
    'On the verge. You\'re gripping hard and praying for the timer.',
    'Leaking! Clench hard — you might save some.',
    'Having an accident! Try to stop the flow if you can.'
  ],
  train_pro: [
    'Bone dry. Nothing to report.',
    'Whisper of an urge. Barely worth noting.',
    'A clear sensation — your training begins now.',
    'Steady pressure. Manageable, but present.',
    'The challenge is setting in. Your focus narrows.',
    'Uncomfortable. Staying still takes effort.',
    'Squirming despite yourself. Each minute feels longer.',
    'Rock solid hold, but the cracks are showing. Every second is work.',
    'Breaking point territory. Muscles trembling with effort.',
    'Right on the edge — one slip and it\'s over.',
    'Lost control entirely.'
  ],
  babysitter_continent: [
    'Nothing at all. Bladder feels empty. Babysitter doesn\'t need to worry.',
    'Tiniest hint. Not even worth mentioning to your sitter.',
    'First gentle nudge. You know it\'s starting but you\'re comfortable.',
    'A clear hum of need. You could ask for potty, but no rush.',
    'Getting noticeable. Starting to think about when babysitter will offer.',
    'Squirming a little. Babysitter might notice if she\'s watching.',
    'Really need to go. Fidgeting, shifting. "Can I go potty?"',
    'Desperate. Babysitter better say yes soon or there\'ll be trouble.',
    'Bursting. Better hope you have permission soon.',
    'Desperately holding. One more minute might be too many.',
    'Having an accident. Babysitter will notice soon.'
  ],
  babysitter_incontinent: [
    'Nothing right now. Padding is still fresh.',
    'The faintest tingle. Probably nothing — probably.',
    'A soft warmth building. You know the pattern by now.',
    'Steady pressure. It won\'t be long before something happens.',
    'Getting uncomfortable. Your body isn\'t great at waiting.',
    'Shifting and leaking a little already. Babysitter gives you a look.',
    'Can\'t stop squirming. Small leaks keep escaping. It\'s only a matter of time.',
    'Desperate but your body isn\'t listening. Leaks are getting bigger.',
    'Flooding is close. Your muscles are giving up the fight.',
    'Basically already wetting. Every clench lets a little more through.',
    'Wetting. Babysitter is already reaching for the changing supplies.'
  ],
  omorashi_hold: [
    'Totally empty. The hold hasn\'t really started yet.',
    'The faintest whisper. You barely notice it.',
    'First real twinge of need. The timer starts now.',
    'Steady pressure that keeps your attention. The hold is real.',
    'Growing uncomfortable. Every sip makes it worse.',
    'Constant, nagging desperation. Crossing legs, pressing thighs.',
    'Very desperate. Squirming non-stop. This is the sweet spot.',
    'Agony. Rocking, bouncing, pressed into yourself. Pure desperation.',
    'Bursting — every second counts now.',
    'At the absolute limit. Leaking between clenches.',
    'It\'s coming out. The hold is over.'
  ],
  chaos_manual: [
    'Empty. Waiting for chaos to begin.',
    'Barely there. A faint trickle of awareness.',
    'Something is building. You can feel the setup.',
    'Present and growing. The chaos factor is kicking in.',
    'Uncomfortable. Random spikes keeping you on edge.',
    'Can\'t predict what\'s next. Shifting, clenching, guessing.',
    'Chaos is in control. You\'re just along for the ride.',
    'Total unpredictability. Every moment could be the tipping point.',
    'Hanging on by a thread. The next spike could finish you.',
    'About to lose it. One more trigger and it\'s over.',
    'Full release.'
  ]
};

/* Urgency table toggle state: false = profile text (default), true = neutral text */
let urgencyShowNeutral = false;

function getUrgencyDesc(level, profile) {
  const lv = clamp(Math.round(level), 0, 10);
  const table = _resolveUrgencyTable(profile);
  return table[lv] || URGENCY_SCALE.neutral[lv];
}

function _resolveUrgencyTable(profile) {
  if (urgencyShowNeutral) return URGENCY_SCALE.neutral;
  if (profile === 'babysitter') {
    const inc = ['somewhat_incontinent', 'mostly_incontinent', 'fully_incontinent'];
    return inc.includes(currentContinenceLevel)
      ? URGENCY_SCALE.babysitter_incontinent
      : URGENCY_SCALE.babysitter_continent;
  }
  return URGENCY_SCALE[profile] || URGENCY_SCALE.neutral;
}

function getUrgencyLevel(pct) {
  return clamp(Math.round(pct / 10), 0, 10);
}

function buildUrgencyTableHTML(profile) {
  const table = _resolveUrgencyTable(profile);
  return table.map((desc, i) => {
    return `<tr><td style="padding:5px 8px; color:#dfe6ed; white-space:nowrap;">${i}/10</td><td style="padding:5px 8px; color:#b8c3d6; font-size:0.92em;">${desc}</td></tr>`;
  }).join('');
}

function _urgencyToggleBtn() {
  return `<button onclick="toggleUrgencyNeutral()" style="background:none; border:1px solid #5d7bd8; color:#a6c8ff; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.78em; margin-bottom:8px;">
    ${urgencyShowNeutral ? '🎭 Show Profile Text' : '📄 Show Neutral Text'}
  </button>`;
}

function toggleUrgencyNeutral() {
  urgencyShowNeutral = !urgencyShowNeutral;
  showUrgencyRefTable();
}

function showUrgencyRefTable() {
  const body = $('infoModalBody');
  const backdrop = $('infoModalBackdrop');
  if (!body || !backdrop) return;
  const label = urgencyShowNeutral ? 'Neutral' : profileMode;
  body.innerHTML = `<h2>Urgency Scale (${label})</h2>
    ${_urgencyToggleBtn()}
    <table style="width:100%; border-collapse:collapse; font-size:0.88em;">
      <thead><tr>
        <th style="text-align:left; color:#8ea0b6; border-bottom:1px solid #2b3348; padding:6px;">Level</th>
        <th style="text-align:left; color:#8ea0b6; border-bottom:1px solid #2b3348; padding:6px;">How it feels</th>
      </tr></thead>
      <tbody>${buildUrgencyTableHTML(profileMode)}</tbody>
    </table>`;
  backdrop.style.display = 'block';
}

/* --- BABYSITTER MICRO TIMER TRACKING --- */
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

const CONTINENCE_PROFILE_META = {
  fully_continent: {
    title: 'Fully Continent',
    inCharacter: 'You have strong bladder control. Holding for long stretches is easy and accidents are rare — even when babysitter teases or delays you.',
    gameplay: 'The most relaxed setting. Leaks only happen at very high pressure or with certain symptoms enabled.',
    recommendedProtection: 'Pads for most sessions.',
    tone: 'calm',
    stats: {
      pottyChancePct: '85–95%',
      microFreq: 'Rare (0–1 per cycle)',
      leakSize: 'Tiny twinges — almost never a real leak',
      accidentRisk: 'Very low',
      loopDesc: 'Long gaps between events. Potty permission is almost always granted. Protection changes are extremely rare. A relaxed, low-intensity experience.'
    }
  },
  mostly_continent: {
    title: 'Mostly Continent',
    inCharacter: 'You can usually hold, but once the urge builds you sometimes have small leaks before making it to the potty.',
    gameplay: 'Balanced pacing with occasional dribbles and close calls. Good for a realistic experience with some tension.',
    recommendedProtection: 'Pads or Pullups.',
    tone: 'watchful',
    stats: {
      pottyChancePct: '70–80%',
      microFreq: 'Occasional (1–2 per cycle)',
      leakSize: 'Small dribbles and spurts',
      accidentRisk: 'Low to Moderate',
      loopDesc: 'Events spaced comfortably. Small dribbles happen between main events. Most potty requests are granted. Accidents are partial and forgiving.'
    }
  },
  somewhat_incontinent: {
    title: 'Somewhat Incontinent',
    inCharacter: 'You leak in spurts when urgency spikes, especially if babysitter makes you wait. Holding is possible but unreliable.',
    gameplay: 'Frequent leak prompts and more babysitter checks. You\'ll be actively managing wetness instead of coasting.',
    recommendedProtection: 'Pullups or Diapers.',
    tone: 'nurturing',
    stats: {
      pottyChancePct: '50–60%',
      microFreq: 'Frequent (2–3 per cycle)',
      leakSize: 'Moderate spurts and streams',
      accidentRisk: 'Moderate to High',
      loopDesc: 'Leaks happen often and produce real saturation. Potty permission is a coin-flip. Protection changes happen semi-regularly.'
    }
  },
  mostly_incontinent: {
    title: 'Mostly Incontinent',
    inCharacter: 'Holding is really difficult. Leaks come often, especially during movement or when babysitter denies you. Potty trips rarely succeed.',
    gameplay: 'High-intensity with frequent leaks and accidents. Protection management becomes a big part of the experience.',
    recommendedProtection: 'Diapers (or Thick Diapers for longer sessions).',
    tone: 'matter-of-fact',
    stats: {
      pottyChancePct: '25–35%',
      microFreq: 'Very frequent (3–5 per cycle)',
      leakSize: 'Heavy spurts, streams, and floods',
      accidentRisk: 'Very high — most cycles end in an accident',
      loopDesc: 'Permission is the exception. Accidents use a harder table with total floods. Turn on "Not Potty Trained" mode for a fully automatic experience — no potty trips, just wetting and changes.'
    }
  },
  fully_incontinent: {
    title: 'Fully Incontinent',
    inCharacter: 'Control is minimal. Wetting happens without warning and your babysitter focuses on keeping you comfortable and changed.',
    gameplay: 'Constant wetting and frequent changes. Best for an intense dependency experience.',
    recommendedProtection: 'Thick Diapers.',
    tone: 'gentle',
    stats: {
      pottyChancePct: '5–10% (effectively 0 with Not Potty Trained on)',
      microFreq: 'Constant (4–6+ per cycle)',
      leakSize: 'Full voids and overflow events',
      accidentRisk: 'Guaranteed every cycle',
      loopDesc: 'No real control exists. With "Not Potty Trained" on, every event is an automatic void — babysitter just changes you. Without it, potty permission is almost always denied. Use Thick Diapers.'
    }
  }
};

const BABYSITTER_CURSES = {
  strict_sitter: { key: 'strict_sitter', name: 'Strict Sitter', pottyChancePenalty: 10 },
  no_free_passes: { key: 'no_free_passes', name: 'No Free Passes', blockPassGain: true },
  slippery_focus: { key: 'slippery_focus', name: 'Slippery Focus', leakScalar: 1.2 },
  hydration_debt: { key: 'hydration_debt', name: 'Hydration Debt', extraSipOrders: true }
};

const BABYSITTER_SYMPTOMS = {
  overactive_bladder: {
    key: 'overactive_bladder',
    name: '💢 Overactive Bladder',
    icon: '💢',
    desc: "Your bladder sends urgent signals even when it's not very full. Spasms can hit at any pressure level, and when they do, it feels like an emergency even if you only drank a sip.",
    effect: "Extra pressure checks mid-cycle. Spasms can trigger accidents even at low pressure (40%+). Micro events hit harder.",
    modifiers: { extraPressureChecks: true, lowPressureSpasms: true, microSeverity: 1.3 }
  },
  stress_incontinence: {
    key: 'stress_incontinence',
    name: '🤧 Stress Incontinence',
    icon: '🤧',
    desc: "Physical actions betray you. Laughing, coughing, sneezing, standing up too fast—any sudden abdominal pressure can squeeze out a leak before you even realize it's happening.",
    effect: "Physical action micros are more frequent and cause bigger leaks. Coughing/laughing/standing events have longer relax phases.",
    modifiers: { physicalTriggerBoost: true, microFrequency: 1.4 }
  },
  urge_incontinence: {
    key: 'urge_incontinence',
    name: '⚡ Urge Incontinence',
    icon: '⚡',
    desc: "When the urge hits, it hits like a wall. You go from 'fine' to 'desperate' in seconds. Once the urge starts, you have very little time to reach the potty before things get messy.",
    effect: "Shorter hold windows after urge onset. Potty chance drops faster with pressure. Failed holds escalate to bigger accidents.",
    modifiers: { urgencyEscalation: true, pottyChancePenalty: 15, accidentSeverity: 1.3 }
  },
  nocturnal_wetter: {
    key: 'nocturnal_wetter',
    name: '🌙 Relaxation Wetter',
    icon: '🌙',
    desc: "The moment you zone out, relax, or get comfortable, your body lets go. Watching a show, reading, or just sitting still can lead to slow, quiet wetting you don't notice until it's too late.",
    effect: "Relaxation-based micros are more common. 'Stealth' leaks happen without obvious triggers. More relax-phase guide steps.",
    modifiers: { relaxationLeaks: true, stealthMicros: true, microFrequency: 1.2 }
  },
  giggle_incontinence: {
    key: 'giggle_incontinence',
    name: '😂 Giggle Incontinence',
    icon: '😂',
    desc: "Babysitter knows exactly how to make you laugh—and every time you do, your bladder empties a little (or a lot). The harder you laugh, the worse the flood.",
    effect: "Laugh-triggered events cause significantly larger leaks. Babysitter tells more jokes/funny things. Giggle events can cascade.",
    modifiers: { giggleSeverity: 2.0, extraGiggleMicros: true }
  },
  pre_void_dribble: {
    key: 'pre_void_dribble',
    name: '💧 Pre-Void Dribbler',
    icon: '💧',
    desc: "When the babysitter finally says you can go, your bladder starts leaking before you reach the potty.",
    effect: "On potty-permission events, there is a chance of a small pre-void dribble prompt before the trip.",
    modifiers: { preVoidDribble: true, pottyDribbleChance: 0.4 }
  }
};

function hasSymptom(key) {
  // Backward compatibility for old saved sessions.
  if (key === 'pre_void_dribble' && activeSymptoms.includes('post_void_dribble')) return true;
  return activeSymptoms.includes(key);
}

function hasCurse(key) {
  return activeCurses.includes(key);
}

function formatProtectionLevel(level) {
  if (level === 'guards') level = 'pad'; // Legacy migration
  const names = { 'pad': 'Pad', 'pullups': 'Pullups', 'diapers': 'Diapers', 'thick_diapers': 'Thick Diapers' };
  return names[level] || (level || '').replace(/_/g, ' ');
}

function getContinenceMeta(level = currentContinenceLevel) {
  return CONTINENCE_PROFILE_META[level] || CONTINENCE_PROFILE_META.mostly_continent;
}

function updateContinencePreview() {
  const select = $('continenceSelect');
  const level = select ? select.value : currentContinenceLevel;
  const meta = getContinenceMeta(level);

  const titleEl = $('continencePreviewTitle');
  const descEl = $('continencePreviewDesc');
  const recEl = $('continencePreviewRec');
  const gameEl = $('continencePreviewGameplay');
  const statsEl = $('continencePreviewStats');
  if (titleEl) titleEl.textContent = meta.title;
  if (descEl) descEl.textContent = meta.inCharacter;
  if (gameEl) gameEl.textContent = meta.gameplay || '';
  if (recEl) recEl.textContent = `Recommended: ${meta.recommendedProtection}`;

  // Render rich stats block
  if (statsEl && meta.stats) {
    const s = meta.stats;
    statsEl.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:8px;">
        <div style="background:#1b2030; padding:7px 10px; border-radius:6px; border:1px solid #2b3348;">
          <div style="color:#81ecec; font-size:0.72em; font-weight:bold; margin-bottom:2px;">POTTY SUCCESS</div>
          <div style="color:#eee; font-size:0.85em;">${s.pottyChancePct}</div>
        </div>
        <div style="background:#1b2030; padding:7px 10px; border-radius:6px; border:1px solid #2b3348;">
          <div style="color:#fdcb6e; font-size:0.72em; font-weight:bold; margin-bottom:2px;">MICRO FREQUENCY</div>
          <div style="color:#eee; font-size:0.85em;">${s.microFreq}</div>
        </div>
        <div style="background:#1b2030; padding:7px 10px; border-radius:6px; border:1px solid #2b3348;">
          <div style="color:#fab1a0; font-size:0.72em; font-weight:bold; margin-bottom:2px;">LEAK SIZE</div>
          <div style="color:#eee; font-size:0.78em; line-height:1.3;">${s.leakSize}</div>
        </div>
        <div style="background:#1b2030; padding:7px 10px; border-radius:6px; border:1px solid #2b3348;">
          <div style="color:#ff7675; font-size:0.72em; font-weight:bold; margin-bottom:2px;">ACCIDENT RISK</div>
          <div style="color:#eee; font-size:0.78em; line-height:1.3;">${s.accidentRisk}</div>
        </div>
      </div>
      <div style="background:#14202e; padding:9px 12px; border-radius:6px; margin-top:8px; border-left:3px solid #a29bfe;">
        <div style="color:#a29bfe; font-size:0.72em; font-weight:bold; margin-bottom:4px;">GAMEPLAY LOOP</div>
        <div style="color:#cdd7e6; font-size:0.8em; line-height:1.5;">${s.loopDesc}</div>
      </div>
    `;
  }

  // Show/hide NPT toggle based on level
  const nptRow = $('nptModeRow');
  if (nptRow) {
    const showNpt = level === 'mostly_incontinent' || level === 'fully_incontinent';
    nptRow.style.display = showNpt ? 'flex' : 'none';
  }
}

function getContinenceLeakScalar() {
  const map = {
    fully_continent: 0.6,
    mostly_continent: 0.85,
    somewhat_incontinent: 1.0,
    mostly_incontinent: 1.25,
    fully_incontinent: 1.55
  };
  let scalar = map[currentContinenceLevel] || 1.0;
  if (hasSymptom('overactive_bladder')) scalar *= 1.2;
  if (hasSymptom('urge_incontinence')) scalar *= 1.2;
  if (hasSymptom('stress_incontinence')) scalar *= 1.1;
  if (hasCurse('slippery_focus')) scalar *= 1.2;
  return scalar;
}

function getMainProtectionCapacity() {
  return PROTECTION_CAPACITY[currentProtectionLevel] || 50;
}

function getStartingPottyPasses() {
  const baseByContinence = {
    fully_continent: 2,
    mostly_continent: 2,
    somewhat_incontinent: 1,
    mostly_incontinent: 1,
    fully_incontinent: 0
  };
  const baseByProtection = {
    pad: 0,
    pullups: 1,
    diapers: 1,
    thick_diapers: 2
  };
  let passes = (baseByContinence[currentContinenceLevel] || 1) + (baseByProtection[currentProtectionLevel] || 0);
  if (hasCurse('no_free_passes')) passes = 0;
  return clamp(passes, 0, 4);
}

function maybeAwardPottyPass(reason) {
  if (profileMode !== 'babysitter') return;
  if (hasCurse('no_free_passes')) return;
  if (pottyPasses >= 4) return;

  let chance = 0;
  if (reason === 'dry_streak') chance = 0.5;
  if (reason === 'good_check') chance = 0.35;
  if (reason === 'heavy_protection') chance = 0.6;
  if (Math.random() > chance) return;

  pottyPasses++;
  updateBabysitterUI();
  logToOutput(`<span style="color:#81ecec;">🎟️ <b>Potty Pass Earned:</b> Babysitter trusts you with an emergency pass (${pottyPasses} available).</span>`);
}

function createBabysitterLeakPayload(sourceType, sourceLabel) {
  const baseByType = {
    micro: randInt(3, 7),
    spasm: randInt(5, 12),
    accident_partial: randInt(12, 20),
    accident_full: randInt(25, 45),
    dribble: randInt(2, 6)
  };

  let amount = baseByType[sourceType] || randInt(4, 10);
  amount = Math.round(amount * getContinenceLeakScalar());

  if (hasSymptom('giggle_incontinence') && /laugh|giggle/i.test(sourceLabel || '')) {
    amount = Math.round(amount * 1.5);
  }
  if (hasSymptom('stress_incontinence') && /cough|sneeze|stand|move|wiggle/i.test(sourceLabel || '')) {
    amount = Math.round(amount * 1.25);
  }
  if (hasSymptom('nocturnal_wetter') && /relax|lullaby|soft|doze/i.test(sourceLabel || '')) {
    amount = Math.round(amount * 1.2);
  }

  const pressureDrop = clamp(Math.round(amount * randInt(1, 2) / 2), 2, 20);
  return {
    type: sourceType,
    label: sourceLabel || 'Leak Event',
    amount: clamp(amount, 1, 60),
    pressureDrop,
    at: Date.now()
  };
}

function getPressureBand(pressure) {
  if (pressure >= 85) return 'critical';
  if (pressure >= 70) return 'high';
  if (pressure >= 55) return 'elevated';
  if (pressure >= 40) return 'moderate';
  return 'low';
}

function buildSymptomImpactSummary() {
  const lines = [];
  if (hasSymptom('overactive_bladder')) lines.push('💢 Overactive: extra mid-cycle checks and spasm risk spikes.');
  if (hasSymptom('stress_incontinence')) lines.push('🤧 Stress: movement-trigger leaks get stronger and more frequent.');
  if (hasSymptom('urge_incontinence')) lines.push('⚡ Urge: potty approvals drop harder as pressure climbs.');
  if (hasSymptom('nocturnal_wetter')) lines.push('🌙 Relaxation: calm moments are more likely to leak.');
  if (hasSymptom('giggle_incontinence')) lines.push('😂 Giggle: laugh-themed events are favored and hit harder.');
  if (hasSymptom('pre_void_dribble')) lines.push('💧 Pre-void dribble: small leaks can happen right after potty permission.');
  if (hasCurse('strict_sitter')) lines.push('👿 Strict: lower permission rates and weaker pass saves.');
  if (hasCurse('no_free_passes')) lines.push('🚫 No passes: emergency pass economy is disabled.');
  if (hasCurse('slippery_focus')) lines.push('🧊 Slippery focus: all leak payloads scale up.');
  if (hasCurse('hydration_debt')) lines.push('🥤 Hydration debt: more sip reminders over each cycle.');
  return lines;
}

function classifyBabysitterAccident(event, payload, pottyChance) {
  const text = `${event?.label || ''} ${event?.flow || ''}`.toLowerCase();
  let type = event?.partial ? 'Partial Overflow' : 'Full Overflow';
  let trigger = 'Hold failure under delay';

  if (/laugh|giggle|funny/.test(text)) {
    type = 'Giggle Cascade';
    trigger = 'Laughter reflex release';
  } else if (/sneeze|cough|stand|shiver|movement|spurt/.test(text)) {
    type = 'Stress Burst';
    trigger = 'Physical trigger pressure spike';
  } else if (/hesitat|denied|desperate|dam breaks|wait/.test(text)) {
    type = 'Urgency Collapse';
    trigger = 'Denied or delayed potty release';
  } else if (/relax|distract|doze|sleep/.test(text)) {
    type = 'Relaxation Slip';
    trigger = 'Guard dropped during relaxed phase';
  }

  const amount = payload?.amount || 0;
  const severity = amount >= 35 ? 'severe' : amount >= 20 ? 'moderate' : 'light';
  const pressureBand = getPressureBand(manualPressure);
  return {
    type,
    trigger,
    severity,
    pressureBand,
    amount,
    partial: !!event?.partial,
    pottyChance
  };
}

function maybeRunOveractiveUrgencyCheck() {
  if (!hasSymptom('overactive_bladder')) return;
  if (!sessionRunning || profileMode !== 'babysitter') return;
  if ($('statusModalBackdrop')?.style.display === 'block') return;

  const pressureBand = getPressureBand(manualPressure);
  if (manualPressure < 55) {
    logToOutput(`<span style="color:#fdcb6e;">💢 <b>Overactive Check:</b> Babysitter asks how your urge feels. Current pressure band: <b>${pressureBand}</b>.</span>`);
    if (Math.random() < 0.2) triggerBabysitterMicro('spasm');
    return;
  }

  logToOutput(`<span style="color:#fdcb6e;">💢 <b>Overactive Check:</b> Urge feels jumpy. Do a quick Bio-Check now so babysitter can react to your current pressure.</span>`);
  openStatusModal(function() {
    const updatedBand = getPressureBand(manualPressure);
    logToOutput(`<span style="color:#fdcb6e;">💢 <b>Overactive Bio-Feedback:</b> Urgency at <b>${getUrgencyLevel(manualPressure)}/10</b> (${updatedBand}).</span>`);

    let spasmChance = 0.15;
    if (manualPressure >= 85) spasmChance = 0.55;
    else if (manualPressure >= 70) spasmChance = 0.35;
    else if (manualPressure >= 55) spasmChance = 0.22;

    if (Math.random() < spasmChance) {
      logToOutput(`<span style="color:#ff7675;">💢 <b>Overactive Surge:</b> feedback check triggered a sudden urgency spasm.</span>`);
      triggerBabysitterMicro('spasm');
    } else {
      logToOutput(`<span style="color:#55efc4;">💢 <b>Overactive Managed:</b> you stabilized this surge for now.</span>`);
    }
  });
}

/* --- BABYSITTER CHECK-IN EVENT SYSTEM --- */
// Protection-based check intervals (minutes): lighter protection = more frequent checks
const BABYSITTER_CHECK_INTERVALS = {
  'pad':           { min: 15, max: 30 },
  'pullups':       { min: 25, max: 45 },
  'diapers':       { min: 40, max: 70 },
  'thick_diapers': { min: 55, max: 90 }
};

const BABYSITTER_CHECKIN_EVENTS = [
  { label: "Pad Pat", desc: "Babysitter casually reaches over and pats your padding. 'Just checking... how are we doing in there?'", forProt: ['pad', 'pullups'] },
  { label: "Waistband Peek", desc: "Babysitter tugs the waistband of your protection and peeks inside. 'Let me see... hmm.'", forProt: ['pullups', 'diapers', 'thick_diapers'] },
  { label: "Squeeze Test", desc: "Babysitter gives the front of your protection a gentle squeeze. 'I need to know how full this is.'", forProt: ['diapers', 'thick_diapers'] },
  { label: "Sniff Check", desc: "Babysitter leans close and sniffs. 'I think someone might need a change soon...'", forProt: ['diapers', 'thick_diapers'] },
  { label: "Casual Ask", desc: "Babysitter looks at you. 'Hey, are you still dry? Be honest with me.'", forProt: ['pad', 'pullups', 'diapers', 'thick_diapers'] },
  { label: "Touch Check", desc: "Babysitter puts a hand on the outside of your protection. 'Feels a little warm... let me check properly.'", forProt: ['pullups', 'diapers', 'thick_diapers'] },
  { label: "Visual Inspection", desc: "Babysitter glances down at your padding. 'I can see it's starting to swell. How long ago did this happen?'", forProt: ['pad', 'pullups', 'diapers'] },
  { label: "Timer Check", desc: "Babysitter checks the time. 'It's been a while since your last change. Let's do a quick check.'", forProt: ['pad', 'pullups', 'diapers', 'thick_diapers'] },
  { label: "Sit Down Test", desc: "Babysitter says: 'Sit down for me.' They watch how you react and check for wetness.", forProt: ['pad', 'pullups', 'diapers'] },
  { label: "Comfort Check", desc: "Babysitter asks gently: 'Are you comfortable? Nothing bothering you down there?' They know you might be hiding it.", forProt: ['pad', 'pullups', 'diapers', 'thick_diapers'] }
];

function scheduleBabysitterCheckIn() {
  if (babysitterCheckTimer) clearTimeout(babysitterCheckTimer);
  if (!sessionRunning || profileMode !== 'babysitter') return;

  const intervals = BABYSITTER_CHECK_INTERVALS[currentProtectionLevel] || { min: 30, max: 60 };
  // Continence also modifies: lower continence = slightly more frequent
  const contMod = { fully_continent: 1.3, mostly_continent: 1.1, somewhat_incontinent: 1.0, mostly_incontinent: 0.85, fully_incontinent: 0.7 };
  const mod = contMod[currentContinenceLevel] || 1.0;
  const min = Math.max(10, Math.round(intervals.min * mod));
  const max = Math.max(min + 5, Math.round(intervals.max * mod));
  const minutes = randInt(min, max);

  babysitterCheckTimer = setTimeout(() => {
    if (!sessionRunning || profileMode !== 'babysitter') return;
    triggerBabysitterCheckIn();
  }, minutes * 60000);
}

function triggerBabysitterCheckIn() {
  if (!sessionRunning || profileMode !== 'babysitter') return;
  // Filter events by current protection
  const applicable = BABYSITTER_CHECKIN_EVENTS.filter(e => e.forProt.includes(currentProtectionLevel));
  const event = pick(applicable.length > 0 ? applicable : BABYSITTER_CHECKIN_EVENTS);

  startChime(440);
  logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:8px 0; border-left:3px solid #e17055;">
    <span style="color:#e17055; font-weight:bold;">👀 Babysitter Check-In</span><br>
    <span style="color:#cdd7e6;">${event.desc}</span>
  </div>`);

  // Opens bio-check modal with a check-in specific callback
  openStatusModal(function() {
    stopChime();
    const sat = manualSaturation;
    const pressure = manualPressure;
    const capacity = getMainProtectionCapacity();

    let response = '';
    if (sat > capacity * 0.9) {
      response = `<span style="color:#ff7675;">😟 Babysitter: "Oh dear, you're completely soaked. We need to deal with this right now."</span>`;
      checkBabysitterProgression('accident');
    } else if (sat > capacity * 0.5) {
      response = `<span style="color:#fdcb6e;">🤔 Babysitter: "Getting pretty wet in there. I'll keep an eye on you."</span>`;
    } else if (sat > 10) {
      response = `<span style="color:#81ecec;">😊 Babysitter: "A little damp but nothing to worry about yet."</span>`;
    } else {
      response = `<span style="color:#55efc4;">😄 Babysitter: "Still dry! Good job, keep it up."</span>`;
      if (pressure < 30) maybeAwardPottyPass('good_check');
    }

    if (pressure >= 80) {
      response += `<br><span style="color:#fab1a0;">💢 Babysitter notices you're squirming: "You look like you really need to go..."</span>`;
    }

    // Stash warning during check-in
    if (stashTrackingEnabled) {
      const currentCount = protectionStash[currentProtectionLevel];
      if (currentCount !== null && currentCount <= 1) {
        response += `<br><span style="color:#fdcb6e;">📦 Babysitter peeks at the supply bag: "Hmm, you only have ${currentCount === 0 ? 'no' : 'one'} ${formatProtectionLevel(currentProtectionLevel)} left. Better be careful!"</span>`;
      }
    }

    logToOutput(response);
    scheduleBabysitterCheckIn(); // Schedule next check-in
  });
}

function applyBabysitterLeakPayload(payload) {
  if (!payload || profileMode !== 'babysitter') return;

  const leakThroughThreshold = getMainProtectionCapacity();
  const wouldLeakThrough = manualSaturation > leakThroughThreshold * 0.8;

  logToOutput(`<div style="background:#1b2030; padding:8px; border-radius:6px; margin:4px 0; border-left:3px solid #fdcb6e;">
    <span style="color:#fdcb6e; font-weight:bold;">💧 ${payload.label}</span>
  </div>`);

  if (wouldLeakThrough) {
    logToOutput(`<span style="color:#ff7675;"><b>⚠️ Leak-through risk:</b> ${formatProtectionLevel(currentProtectionLevel)} capacity is ${leakThroughThreshold}%. If you feel you've leaked through, use <b>Emergency</b> to report it before the next check.</span>`);
  }
}

function emitBabysitterEvent(type, detail) {
  const evt = new CustomEvent('abdl:babysitter:event', {
    detail: {
      type,
      ...detail,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(evt);
}

let babysitterEventBusBound = false;
function bindBabysitterEventBus() {
  if (babysitterEventBusBound) return;
  babysitterEventBusBound = true;

  window.addEventListener('abdl:babysitter:event', (evt) => {
    if (!evt || !evt.detail || profileMode !== 'babysitter') return;
    if (evt.detail.type === 'leak') {
      applyBabysitterLeakPayload(evt.detail.payload);
    }
  });
}

/* --- PROTECTION CAPACITY (for leak-through detection) --- */
const PROTECTION_CAPACITY = {
  'pad': 25,         // Very light — overflows easily
  'pullups': 50,        // Medium — handles moderate leaks
  'diapers': 80,        // Heavy — handles most accidents
  'thick_diapers': 100  // Maximum — rarely overflows
};

/* --- DAY TRACKER SYSTEM --- */
function getDayTrackerKey() {
  return 'dayTracker_' + new Date().toISOString().slice(0, 10);
}

function getDayTracker() {
  const key = getDayTrackerKey();
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  return {
    date: new Date().toISOString().slice(0, 10),
    pottySuccesses: 0,
    accidents: 0,
    partialAccidents: 0,
    changes: 0,
    protectionChanges: [],  // [{from, to, time}]
    totalSessionMinutes: 0,
    sessionStartTime: null,
    highestProtection: null,
    lowestProtection: null,
    dryStreakBest: 0,
    continenceLevel: null
  };
}

function saveDayTracker(tracker) {
  localStorage.setItem(getDayTrackerKey(), JSON.stringify(tracker));
  renderDayTracker();
}

function trackDayEvent(eventType, details) {
  const tracker = getDayTracker();
  
  switch (eventType) {
    case 'potty_success':
      tracker.pottySuccesses++;
      break;
    case 'accident':
      tracker.accidents++;
      break;
    case 'partial_accident':
      tracker.partialAccidents++;
      break;
    case 'change':
      tracker.changes++;
      break;
    case 'protection_change':
      tracker.protectionChanges.push({
        from: details.from,
        to: details.to,
        time: new Date().toLocaleTimeString()
      });
      break;
    case 'session_start':
      tracker.sessionStartTime = Date.now();
      tracker.continenceLevel = currentContinenceLevel;
      break;
    case 'session_end':
      if (tracker.sessionStartTime) {
        tracker.totalSessionMinutes += Math.round((Date.now() - tracker.sessionStartTime) / 60000);
        tracker.sessionStartTime = null;
      }
      break;
    case 'streak_update':
      if (details.streak > tracker.dryStreakBest) tracker.dryStreakBest = details.streak;
      break;
  }
  
  // Track protection range
  if (currentProtectionLevel) {
    const idx = PROTECTION_HIERARCHY.indexOf(currentProtectionLevel);
    const highIdx = tracker.highestProtection ? PROTECTION_HIERARCHY.indexOf(tracker.highestProtection) : -1;
    const lowIdx = tracker.lowestProtection ? PROTECTION_HIERARCHY.indexOf(tracker.lowestProtection) : 999;
    if (idx > highIdx) tracker.highestProtection = currentProtectionLevel;
    if (idx < lowIdx) tracker.lowestProtection = currentProtectionLevel;
  }
  
  saveDayTracker(tracker);
}

function renderDayTracker() {
  const panel = $('dayTrackerPanel');
  if (!panel) return;
  
  const tracker = getDayTracker();
  
  // Calculate active session time
  let activeMinutes = tracker.totalSessionMinutes;
  if (tracker.sessionStartTime) {
    activeMinutes += Math.round((Date.now() - tracker.sessionStartTime) / 60000);
  }
  
  const protChangeList = tracker.protectionChanges.length > 0
    ? tracker.protectionChanges.map(c => `<span style="font-size:0.8em; color:#888;">${c.time}: ${c.from} → ${c.to}</span>`).join('<br>')
    : '<span style="color:#555;">None yet</span>';
  
  panel.innerHTML = `
    <div style="color:#81ecec; font-weight:bold; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      📅 Today's Log <span style="font-size:0.75em; color:#888;">${tracker.date}</span>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; font-size:0.9em;">
      <div><span style="color:#2ecc71;">🚽 Potty Trips:</span> <b style="color:#fff;">${tracker.pottySuccesses}</b></div>
      <div><span style="color:#ff7675;">💦 Accidents:</span> <b style="color:#fff;">${tracker.accidents}</b></div>
      <div><span style="color:#fdcb6e;">💧 Partials:</span> <b style="color:#fff;">${tracker.partialAccidents}</b></div>
      <div><span style="color:#a29bfe;">🧷 Changes:</span> <b style="color:#fff;">${tracker.changes}</b></div>
      <div><span style="color:#7cc4ff;">⏱️ Time:</span> <b style="color:#fff;">${activeMinutes}m</b></div>
      <div><span style="color:#2ecc71;">⭐ Best Streak:</span> <b style="color:#fff;">${tracker.dryStreakBest}</b></div>
    </div>
    ${tracker.protectionChanges.length > 0 ? `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #2b3348;">
      <span style="color:#9b59b6; font-size:0.85em;">🔄 Protection Changes:</span><br>${protChangeList}
    </div>` : ''}
    <div style="display:flex; gap:6px; margin-top:8px;">
      <button onclick="editDayTrackerStats()" style="flex:1; padding:6px; border-radius:6px; border:1px solid #2b3348; background:#0f1115; color:#81ecec; cursor:pointer;">Edit Log</button>
      <button onclick="openStatusModal()" style="flex:1; padding:6px; border-radius:6px; border:1px solid #2b3348; background:#0f1115; color:#a29bfe; cursor:pointer;">Quick Bio-Check</button>
    </div>
  `;
}

function editDayTrackerStats() {
  const tracker = getDayTracker();
  const pottySuccesses = parseInt(prompt('Potty trips today:', tracker.pottySuccesses), 10);
  if (Number.isNaN(pottySuccesses)) return;
  const accidents = parseInt(prompt('Accidents today:', tracker.accidents), 10);
  if (Number.isNaN(accidents)) return;
  const partialAccidents = parseInt(prompt('Partials today:', tracker.partialAccidents), 10);
  if (Number.isNaN(partialAccidents)) return;
  const changes = parseInt(prompt('Protection changes today:', tracker.changes), 10);
  if (Number.isNaN(changes)) return;
  const dryStreakBest = parseInt(prompt('Best dry streak today:', tracker.dryStreakBest), 10);
  if (Number.isNaN(dryStreakBest)) return;

  tracker.pottySuccesses = Math.max(0, pottySuccesses);
  tracker.accidents = Math.max(0, accidents);
  tracker.partialAccidents = Math.max(0, partialAccidents);
  tracker.changes = Math.max(0, changes);
  tracker.dryStreakBest = Math.max(0, dryStreakBest);
  saveDayTracker(tracker);
  logToOutput(`<span style="color:#81ecec;">🛠️ <b>Tracker updated:</b> Manual day log edits applied.</span>`);
}

// Babysitter Update
/* --- BABYSITTER MICROS (Small Spasms/Twinges - 0-2 per cycle) --- */


/* --- EXPANDED BABYSITTER MICROS (D20 - More Variety) --- */
const MICRO_BABYSITTER_D20 = [
  { label: "Twinge Reminder", desc: "Babysitter says: 'Feel that little twinge? Try to hold it, but relax if it's too much.' Dribble a tiny bit.", classKey: "micro_tiny", guide: [{ text: "FEEL TWINGE", time: 2, type: "relax" }] },
  { label: "Posture Nudge", desc: "Shift your weight like Babysitter asked. The movement causes a small leak.", classKey: "micro_small", guide: [{ text: "SHIFT POSTURE", time: 3, type: "push" }] },
  { label: "Sip Check", desc: "Babysitter reminds you to sip water. The added fluid makes your bladder twitch.", classKey: "micro_tiny", guide: [{ text: "SIP WATER", time: 5, type: "stop" }, { text: "TWITCH HOLD", time: 2, type: "stop" }] },
  { label: "Relax Moment", desc: "Babysitter says: 'Breathe deep and relax your tummy.' A small dribble escapes.", classKey: "micro_small", guide: [{ text: "DEEP BREATH", time: 3, type: "relax" }] },
  { label: "Gravity Pull", desc: "Stand up for a quick stretch. Gravity pulls a tiny spurt out.", classKey: "micro_tiny", guide: [{ text: "STAND STRETCH", time: 2, type: "push" }] },
  { label: "Hold Practice", desc: "Babysitter tests: 'Try to hold tight for 5 seconds.' A spasm makes you leak.", classKey: "micro_small", guide: [{ text: "HOLD TIGHT", time: 5, type: "stop" }, { text: "SPASM LEAK", time: 1, type: "push" }] },
  { label: "Warm Reminder", desc: "Babysitter pats your padding: 'Is it warm yet?' The touch triggers release.", classKey: "micro_tiny", guide: [{ text: "PAT CHECK", time: 2, type: "relax" }] },
  { label: "Laugh Test", desc: "Babysitter tells a joke. Laugh and feel the spasm.", classKey: "micro_small", guide: [{ text: "LAUGH", time: 3, type: "push" }] },
  { label: "Soft Drop", desc: "Babysitter says: 'Soften your muscles.' A tiny chain of dribbles starts.", classKey: "micro_tiny", guide: [{ text: "SOFTEN", time: 4, type: "relax" }] },
  { label: "Urge Whisper", desc: "Babysitter whispers: 'Do you need to go yet?' Your bladder responds with a leak.", classKey: "micro_small", guide: [{ text: "WHISPER URGE", time: 2, type: "push" }] },
  { label: "Message Pause", desc: "Babysitter gets distracted texting. The pause makes you suddenly clench hard.", classKey: "micro_tiny", guide: [{ text: "CLENCH", time: 4, type: "stop" }, { text: "UNWANTED RELEASE", time: 2, type: "relax" }] },
  { label: "Cuddle Sneak", desc: "Babysitter sits close for a hug. The pressure and warmth trigger a spasm.", classKey: "micro_small", guide: [{ text: "CUDDLE", time: 3, type: "push" }, { text: "LEAK", time: 2, type: "relax" }] },
  { label: "Toy Tempt", desc: "Babysitter offers a distraction toy. Focusing makes you lose control slightly.", classKey: "micro_small", guide: [{ text: "PLAY DISTRACTED", time: 5, type: "push" }] },
  { label: "Focus Slip", desc: "Babysitter notices you're really focused. 'Don't forget to relax down there.' You relax too much.", classKey: "micro_tiny", guide: [{ text: "RELAX MUSCLES", time: 3, type: "relax" }, { text: "SMALL LEAK", time: 2, type: "relax" }] },
  { label: "Praise Flush", desc: "Babysitter praises you: 'You're doing SO good!' The excitement triggers a spasm.", classKey: "micro_small", guide: [{ text: "FLUSH WITH JOY", time: 3, type: "push" }] },
  { label: "Couch Sink", desc: "You sink deeper into the cushions. The comfort and compression together squeeze out a small leak.", classKey: "micro_tiny", guide: [{ text: "SINK DOWN", time: 4, type: "relax" }] },
  { label: "Wiggle Trigger", desc: "Babysitter says: 'Can you wiggle without leaking?' Of course you can't.", classKey: "micro_small", guide: [{ text: "WIGGLE", time: 3, type: "push" }] },
  { label: "Hum Relax", desc: "Babysitter softly hums something calming. You relax your whole body—including what you shouldn't.", classKey: "micro_tiny", guide: [{ text: "CLOSE EYES", time: 4, type: "relax" }] },
  { label: "Praise Flush", desc: "Babysitter praises you: 'You're doing SO good!' The excitement triggers a spasm.", classKey: "micro_small", guide: [{ text: "FLUSH WITH JOY", time: 3, type: "push" }] },
  { label: "Silent Spasm", desc: "A random internal spasm hits with no warning. Small involuntary release.", classKey: "micro_tiny", guide: [{ text: "BREATHE THROUGH", time: 4, type: "relax" }] }
];

/* --- CONTINENCE-SPECIFIC MICRO TABLES (D10 each) --- */

// Fully Continent: Rare twinges, almost always hold successfully
const MICRO_CONTINENT_D10 = [
  { label: "Tiny Twinge", desc: "A very small urge passes through. You hold easily—barely noticeable.", classKey: "micro_tiny", guide: [{ text: "BRIEF TWINGE", time: 2, type: "stop" }] },
  { label: "Sudden Awareness", desc: "You suddenly become aware of your bladder. The feeling passes quickly.", classKey: "micro_tiny", guide: [{ text: "NOTICE BLADDER", time: 3, type: "stop" }] },
  { label: "Stretch Twinge", desc: "Stretching causes a brief urge. You clench and it's fine.", classKey: "micro_tiny", guide: [{ text: "STRETCH & CLENCH", time: 2, type: "stop" }] },
  { label: "Cough Hold", desc: "A cough puts brief pressure on your bladder. You hold without issue.", classKey: "micro_tiny", guide: [{ text: "COUGH HOLD", time: 2, type: "stop" }] },
  { label: "Deep Breath", desc: "Taking a deep breath reminds you of the pressure. Easy to ignore.", classKey: "micro_tiny", guide: [{ text: "BREATHE & HOLD", time: 3, type: "stop" }] },
  { label: "Position Shift", desc: "Changing positions sends a brief signal. Your muscles respond automatically.", classKey: "micro_tiny", guide: [{ text: "SHIFT & HOLD", time: 2, type: "stop" }] },
  { label: "Mild Wave", desc: "A mild wave of urgency comes and goes. No leaking at all.", classKey: "micro_tiny", guide: [{ text: "WAVE PASSES", time: 3, type: "stop" }] },
  { label: "Water Sound", desc: "You hear running water. A brief urge, but you control it easily.", classKey: "micro_tiny", guide: [{ text: "IGNORE SOUND", time: 3, type: "stop" }] },
  { label: "Cold Shiver", desc: "A shiver makes you clench. No leak—just a brief reminder.", classKey: "micro_tiny", guide: [{ text: "SHIVER & HOLD", time: 2, type: "stop" }] },
  { label: "Laugh Clench", desc: "Something funny makes you laugh. You clench reflexively—all good.", classKey: "micro_tiny", guide: [{ text: "LAUGH & CLENCH", time: 3, type: "stop" }] }
];

// Somewhat Incontinent: Frequent twinges, occasional small leaks
const MICRO_SOMEWHAT_INCONTINENT_D10 = [
  { label: "Stress Dribble", desc: "A cough or sneeze presses your bladder. A small dribble escapes before you can stop it.", classKey: "micro_small", guide: [{ text: "COUGH", time: 1, type: "push" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Urgency Spike", desc: "A sudden urgency spike hits. You cross your legs but a tiny leak happens.", classKey: "micro_small", guide: [{ text: "URGENCY", time: 2, type: "push" }, { text: "CROSS LEGS", time: 3, type: "stop" }] },
  { label: "Relaxation Leak", desc: "You relaxed too much watching something. A small warm dribble spreads.", classKey: "micro_small", guide: [{ text: "RELAX TOO MUCH", time: 3, type: "relax" }, { text: "CATCH YOURSELF", time: 2, type: "stop" }] },
  { label: "Standing Spurt", desc: "Standing up quickly sends a spurt into your protection. You quickly clench.", classKey: "micro_small", guide: [{ text: "STAND UP", time: 2, type: "push" }, { text: "CLENCH", time: 2, type: "stop" }] },
  { label: "Focus Slip", desc: "Concentrating on something else, your muscles slip and a little escapes.", classKey: "micro_small", guide: [{ text: "LOSE FOCUS", time: 3, type: "relax" }, { text: "REGAIN CONTROL", time: 2, type: "stop" }] },
  { label: "Giggle Leak", desc: "Something makes you giggle and a spurt comes out. Babysitter notices.", classKey: "micro_small", guide: [{ text: "GIGGLE", time: 2, type: "push" }, { text: "SPURT", time: 2, type: "relax" }] },
  { label: "Cold Trigger", desc: "A cold sensation triggers a leak reflex. Small but noticeable.", classKey: "micro_small", guide: [{ text: "COLD TRIGGER", time: 2, type: "push" }, { text: "LEAK", time: 2, type: "relax" }] },
  { label: "Drink Pressure", desc: "Your recent drinks are catching up. Pressure builds and a dribble slips out.", classKey: "micro_small", guide: [{ text: "PRESSURE BUILD", time: 3, type: "push" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Yawn Release", desc: "A big yawn relaxes everything—including your bladder. Small warm spot.", classKey: "micro_tiny", guide: [{ text: "YAWN", time: 3, type: "relax" }] },
  { label: "Walking Leak", desc: "Each step puts a little pressure on your bladder. Tiny spurts escape with movement.", classKey: "micro_small", guide: [{ text: "WALK", time: 4, type: "push" }] }
];

// Mostly Incontinent: Frequent, harder-to-control leaks
const MICRO_MOSTLY_INCONTINENT_D10 = [
  { label: "Constant Dribble", desc: "A steady dribble starts without warning. You can't seem to stop it.", classKey: "micro_small", guide: [{ text: "DRIBBLING", time: 4, type: "relax" }, { text: "TRY TO STOP", time: 3, type: "stop" }] },
  { label: "Spasm Flood", desc: "A spasm hits hard and a significant stream escapes. Babysitter definitely notices.", classKey: "micro_small", guide: [{ text: "SPASM", time: 2, type: "push" }, { text: "STREAM", time: 4, type: "relax" }] },
  { label: "Position Failure", desc: "Any change in position releases a stream. Your muscles just can't hold.", classKey: "micro_small", guide: [{ text: "MOVE", time: 2, type: "push" }, { text: "RELEASE", time: 4, type: "relax" }] },
  { label: "Laugh Flood", desc: "Laughing opens the floodgates. A big warm gush fills your protection.", classKey: "micro_small", guide: [{ text: "LAUGH HARD", time: 2, type: "push" }, { text: "GUSH", time: 4, type: "relax" }] },
  { label: "Relax Failure", desc: "The moment you stop actively holding, everything starts leaking again.", classKey: "micro_small", guide: [{ text: "STOP HOLDING", time: 3, type: "relax" }, { text: "LEAK RESUMES", time: 3, type: "relax" }] },
  { label: "Sneeze Release", desc: "A sneeze completely overwhelms your control. Big spurt fills your padding.", classKey: "micro_small", guide: [{ text: "SNEEZE", time: 1, type: "push" }, { text: "BIG SPURT", time: 4, type: "relax" }] },
  { label: "Warmth Spreading", desc: "You suddenly feel warmth spreading. You didn't even realize you were leaking.", classKey: "micro_small", guide: [{ text: "NOTICE WARMTH", time: 3, type: "relax" }, { text: "STILL GOING", time: 3, type: "relax" }] },
  { label: "Gravity Stream", desc: "Standing releases a stream. Your protection is working overtime.", classKey: "micro_small", guide: [{ text: "STAND", time: 2, type: "push" }, { text: "STREAM DOWN", time: 4, type: "relax" }] },
  { label: "Squeeze Futile", desc: "Babysitter asks you to hold. You squeeze hard but it leaks through anyway.", classKey: "micro_small", guide: [{ text: "SQUEEZE TIGHT", time: 3, type: "stop" }, { text: "LEAKS THROUGH", time: 3, type: "relax" }] },
  { label: "Trickling Away", desc: "A constant trickle you can't control. It just keeps going slowly.", classKey: "micro_small", guide: [{ text: "TRICKLE", time: 5, type: "relax" }] }
];

// Fully Incontinent: No real control, constant wetting
const MICRO_FULLY_INCONTINENT_D10 = [
  { label: "Unaware Wetting", desc: "You didn't even notice it happening. Babysitter checks and finds you soaking.", classKey: "micro_small", guide: [{ text: "WETTING", time: 5, type: "relax" }] },
  { label: "Steady Stream", desc: "A steady stream flows with no effort to stop. This is just how it works now.", classKey: "micro_small", guide: [{ text: "FLOWING", time: 6, type: "relax" }] },
  { label: "Movement Flood", desc: "Every movement pushes more out. Walking, sitting, shifting—all wet.", classKey: "micro_small", guide: [{ text: "MOVE & FLOOD", time: 4, type: "push" }, { text: "KEEP GOING", time: 3, type: "relax" }] },
  { label: "Complete Relax", desc: "Your body doesn't even try to hold anymore. It flows freely.", classKey: "micro_small", guide: [{ text: "FLOWING FREELY", time: 6, type: "relax" }] },
  { label: "Babysitter Finds Out", desc: "Babysitter pats your padding and feels the warmth. 'Already? You literally just got changed.'", classKey: "micro_small", guide: [{ text: "PAT CHECK", time: 2, type: "relax" }, { text: "STILL GOING", time: 4, type: "relax" }] },
  { label: "Passive Release", desc: "Without even trying, your bladder empties a bit more. It's automatic now.", classKey: "micro_small", guide: [{ text: "PASSIVE FLOW", time: 5, type: "relax" }] },
  { label: "Laugh Gush", desc: "A laugh triggers a major gush. Your padding swells noticeably.", classKey: "micro_small", guide: [{ text: "LAUGH", time: 2, type: "push" }, { text: "MAJOR GUSH", time: 5, type: "relax" }] },
  { label: "Sitting Puddle", desc: "After sitting for a while, you realize you've been slowly flooding your protection.", classKey: "micro_small", guide: [{ text: "REALIZE", time: 2, type: "relax" }, { text: "STILL FLOWING", time: 4, type: "relax" }] },
  { label: "Screen Drift", desc: "You zone out staring at the screen. A slow leak happens while your mind wanders—you only notice when the warmth spreads.", classKey: "micro_small", guide: [{ text: "ZONE OUT", time: 4, type: "relax" }, { text: "PASSIVE FLOW", time: 4, type: "relax" }] },
  { label: "Ghost Leak", desc: "No urge. No warning. Your body just goes ahead without you. Nothing to do but feel the warmth spread into your padding.", classKey: "micro_small", guide: [{ text: "RELAX COMPLETELY", time: 5, type: "relax" }] }
];

// Map continence levels to their micro tables
function getMicroTableForContinence() {
  switch (currentContinenceLevel) {
    case 'fully_continent': return MICRO_CONTINENT_D10;
    case 'mostly_continent': return MICRO_BABYSITTER_D20; // Original table works well for this
    case 'somewhat_incontinent': return MICRO_SOMEWHAT_INCONTINENT_D10;
    case 'mostly_incontinent': return MICRO_MOSTLY_INCONTINENT_D10;
    case 'fully_incontinent': return MICRO_FULLY_INCONTINENT_D10;
    default: return MICRO_BABYSITTER_D20;
  }
}


/* --- BABYSITTER POTTY PERMISSION TABLE (D10 - When granted potty) --- */
const BABYSITTER_POTTY_PERMISSION_D10 = [
  { label: "Good Permission", flow: "Babysitter says: 'You've been good—go potty now before it's too late.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Quick Check Go", flow: "Babysitter checks your padding: 'Hmm... Okay, go potty—hurry!'", guide: [{ text: "HURRY TO POTTY", time: 0, type: "stop" }] },
  { label: "Sip & Go", flow: "Babysitter reminds: 'Sip some water first, then you can go potty.'", guide: [{ text: "SIP WATER", time: 5, type: "stop" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Stand & Release", flow: "Babysitter instructs: 'Stand up carefully and go to the potty. No accidents!'", guide: [{ text: "STAND SLOW", time: 3, type: "stop" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Hold Reward", flow: "Babysitter praises: 'You held well—permission granted. Empty at the potty.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Gentle Reminder Go", flow: "Babysitter says: 'Time to try the potty like a big kid. Go now.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Breathe Permission", flow: "Babysitter guides: 'Take a deep breath, then head to the potty.'", guide: [{ text: "DEEP BREATH", time: 3, type: "relax" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Earned Break", flow: "Babysitter: 'You've earned it—permission to potty. Don't dawdle.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Sip Challenge Go", flow: "Babysitter: 'One more sip, then potty time.'", guide: [{ text: "SIP WATER", time: 5, type: "stop" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Quick Go", flow: "Babysitter urges: 'Hurry to the potty—you can make it!'", guide: [{ text: "HURRY TO POTTY", time: 0, type: "stop" }] }
];

/* --- BABYSITTER ACCIDENT TABLE (D10 - When potty denied / accident happens) --- */
const BABYSITTER_ACCIDENT_D10 = [
  { label: "Partial Slip", flow: "Babysitter says: 'Try to hold while running to potty.' But you leak on the way.", partial: true, guide: [{ text: "RUN TO POTTY", time: 5, type: "push" }, { text: "PARTIAL LEAK", time: 3, type: "relax" }, { text: "FINISH IN POTTY", time: 0, type: "stop" }] },
  { label: "Hesitation Leak", flow: "Babysitter: 'Go potty now!' But hesitation causes an accident before you make it.", partial: false, guide: [{ text: "HESITATE", time: 3, type: "stop" }, { text: "ACCIDENT", time: 5, type: "push" }] },
  { label: "Gravity Failure", flow: "Babysitter instructs: 'Stand and go.' But standing pops the cork—a flood happens.", partial: false, guide: [{ text: "STAND UP", time: 2, type: "stop" }, { text: "FLOOD", time: 8, type: "push" }] },
  { label: "Full Oops", flow: "Babysitter sighs: 'You waited too long—accident time.' Let it all go in your protection.", partial: false, guide: [{ text: "OOPS MOMENT", time: 10, type: "relax" }] },
  { label: "Sneeze Flood", flow: "You sneeze suddenly—Babysitter gasps as your protection fills up instantly.", partial: false, guide: [{ text: "SNEEZE", time: 1, type: "push" }, { text: "LOSING IT", time: 6, type: "relax" }] },
  { label: "Laugh Accident", flow: "Babysitter told a funny story—and you lost it laughing. Everything is flooding.", partial: false, guide: [{ text: "LAUGH HARD", time: 3, type: "push" }, { text: "TOTAL LOSS", time: 7, type: "relax" }] },
  { label: "Cold Shiver", flow: "A shiver runs down your spine—and everything lets go. Babysitter notices immediately.", partial: true, guide: [{ text: "SHIVER", time: 2, type: "push" }, { text: "PARTIAL RELEASE", time: 4, type: "relax" }, { text: "TRY TO STOP", time: 3, type: "stop" }] },
  { label: "Standing Spurt", flow: "You stood up too fast—a big spurt escapes before you can clench.", partial: true, guide: [{ text: "STAND FAST", time: 2, type: "push" }, { text: "SPURT", time: 3, type: "relax" }, { text: "CLENCH HARD", time: 3, type: "stop" }] },
  { label: "Distracted Release", flow: "Babysitter was doing something else—you relaxed too much and let go completely.", partial: false, guide: [{ text: "RELAX TOO MUCH", time: 4, type: "relax" }, { text: "FULL RELEASE", time: 8, type: "relax" }] },
  { label: "Desperate Attempt", flow: "Babysitter denied potty: 'You can hold it.' But you couldn't. The dam breaks.", partial: false, guide: [{ text: "TRY TO HOLD", time: 5, type: "stop" }, { text: "DAM BREAKS", time: 8, type: "relax" }] }
];

/* --- CONTINENCE-SPECIFIC ACCIDENT TABLES (used when Not Potty Trained mode is off) --- */
// Somewhat Incontinent: More urgency-based, harder holds
const BABYSITTER_ACCIDENT_SOMEWHAT_D10 = [
  { label: "Urgency Wall", flow: "The urge hits like a wall out of nowhere. You sprint but don't make it—a significant stream goes before you stop it.", partial: true, guide: [{ text: "URGENCY SPIKE", time: 2, type: "push" }, { text: "STREAM OUT", time: 4, type: "relax" }, { text: "CLENCH HARD", time: 4, type: "stop" }] },
  { label: "Focus Break", flow: "You were so focused you forgot to hold. Babysitter looks up and raises an eyebrow.", partial: false, guide: [{ text: "LOSE FOCUS", time: 3, type: "relax" }, { text: "WARM FLOOD", time: 6, type: "push" }] },
  { label: "Laugh Spill", flow: "Babysitter made you laugh hard. A big gush spills before you can stop.", partial: false, guide: [{ text: "LAUGH OUT LOUD", time: 3, type: "push" }, { text: "GUSH", time: 5, type: "relax" } ]},
  { label: "Cold Floor", flow: "Cold air hits you and your muscles just let go. An involuntary stream runs.", partial: false, guide: [{ text: "COLD HITS", time: 2, type: "push" }, { text: "STREAM", time: 5, type: "relax" } ]},
  { label: "Position Spasm", flow: "Changing positions triggered a spasm-release. Warm and immediate.", partial: true, guide: [{ text: "SPASM", time: 2, type: "push" }, { text: "PARTIAL RELEASE", time: 4, type: "relax" }, { text: "CLAMP", time: 3, type: "stop" }] },
  { label: "Too Long Wait", flow: "Babysitter made you wait 30 seconds too long. The urge escalated into a full accident.", partial: false, guide: [{ text: "HOLD IT", time: 5, type: "stop" }, { text: "LOSE IT", time: 7, type: "push" } ]},
  { label: "Sneeze Cascade", flow: "Three sneezes in a row—each one pushed more out. Nothing you could do.", partial: false, guide: [{ text: "SNEEZE x3", time: 3, type: "push" }, { text: "CASCADE RELEASE", time: 5, type: "relax" } ]},
  { label: "Distraction Leak", flow: "You got completely distracted and stopped holding without realizing it.", partial: true, guide: [{ text: "DISTRACTED", time: 4, type: "relax" }, { text: "NOTICE & CLENCH", time: 3, type: "stop" }] },
  { label: "Babysitter Tease", flow: "Babysitter playfully pressed on your tummy: 'Stop squirming!' It triggered an immediate release.", partial: false, guide: [{ text: "PRESSED", time: 2, type: "push" }, { text: "IMMEDIATE FLOOD", time: 6, type: "relax" } ]},
  { label: "Standing Cascades", flow: "Every time you stood, another wave escaped. Three times in a row. Babysitter sighs.", partial: true, guide: [{ text: "STAND", time: 2, type: "push" }, { text: "WAVE 1", time: 2, type: "relax" }, { text: "WAVE 2", time: 2, type: "relax" }, { text: "CLENCH", time: 3, type: "stop" }] }
];

// Mostly Incontinent: Bad control, nearly always floods
const BABYSITTER_ACCIDENT_MOSTLY_D10 = [
  { label: "Total Flood", flow: "Your bladder had enough. With no real ability to hold, a complete release fills your padding in seconds.", partial: false, guide: [{ text: "CAN'T HOLD", time: 2, type: "relax" }, { text: "FLOODING", time: 8, type: "relax" }, { text: "STILL GOING", time: 4, type: "relax" }] },
  { label: "Movement Trigger", flow: "Any movement triggers it. You barely shifted and a full stream ran. Babysitter reaches for the changing supplies.", partial: false, guide: [{ text: "SHIFT", time: 1, type: "push" }, { text: "INSTANT STREAM", time: 6, type: "relax" }, { text: "OVERFLOW", time: 4, type: "relax" }] },
  { label: "Squeeze Failure", flow: "Babysitter asked you to hold. You squeezed as hard as you could. It didn't matter.", partial: false, guide: [{ text: "MAX SQUEEZE", time: 4, type: "stop" }, { text: "LEAKS THROUGH", time: 5, type: "relax" }, { text: "FULL RELEASE", time: 5, type: "relax" }] },
  { label: "Relax Override", flow: "The moment you relaxed even slightly, your bladder overrode your muscles entirely. It just goes.", partial: false, guide: [{ text: "RELAX ATTEMPT", time: 2, type: "relax" }, { text: "OVERRIDE", time: 7, type: "push" }, { text: "FLOW THROUGH", time: 5, type: "relax" }] },
  { label: "Babysitter Gives Up", flow: "Babysitter looks at you, looks at your padding, then just shakes her head. 'Don't even bother trying to hold it.'", partial: false, guide: [{ text: "HEAR THE WORDS", time: 3, type: "relax" }, { text: "STOP TRYING", time: 3, type: "relax" }, { text: "LET IT FLOW", time: 8, type: "relax" }] },
  { label: "Laugh Geyser", flow: "You laughed and essentially became a fountain. Total flooding—Babysitter already has the changing mat out.", partial: false, guide: [{ text: "LAUGH HARD", time: 2, type: "push" }, { text: "GEYSER RELEASE", time: 8, type: "relax" }] },
  { label: "Spasm Chain", flow: "Three separate spasms in 10 seconds. By the third, you're completely soaked.", partial: false, guide: [{ text: "SPASM 1", time: 2, type: "push" }, { text: "SPASM 2", time: 2, type: "push" }, { text: "SPASM 3—DONE", time: 3, type: "push" }, { text: "FULLY SOAKED", time: 4, type: "relax" }] },
  { label: "Pressure Blowout", flow: "The pressure had been building so long your muscles just gave out all at once. No warning, no chance.", partial: false, guide: [{ text: "PRESSURE MAXED", time: 2, type: "push" }, { text: "BLOWOUT", time: 10, type: "push" }] },
  { label: "Passive Overflow", flow: "You weren't even doing anything. Your bladder reached capacity and just... overflowed. Babysitter noticed the silence.", partial: false, guide: [{ text: "JUST SITTING", time: 4, type: "relax" }, { text: "OVERFLOW BEGINS", time: 7, type: "relax" }] },
  { label: "Denied & Drenched", flow: "Babysitter denied your request with a smile: 'Not yet.' Three seconds later you proved her wrong.", partial: false, guide: [{ text: "DENIED", time: 3, type: "stop" }, { text: "COULDN'T WAIT", time: 2, type: "push" }, { text: "COMPLETE FLOOD", time: 8, type: "relax" }] }
];

/* --- NOT POTTY TRAINING (NPT) MODE MACRO TABLES --- */
// Used when Not Potty Trained mode is active for mostly/fully incontinent. No potty trips—just auto-void and change cycles.

const MACRO_NPT_MOSTLY_INCONTINENT_D10 = [
  { label: "Quiet Overflow", flow: "You didn't even try. The warmth spreads slowly—you've completely filled your protection. Babysitter sets down her phone.", autoVoid: true, guide: [{ text: "RELAX EVERYTHING", time: 5, type: "relax" }, { text: "LET IT FLOW", time: 7, type: "relax" }, { text: "STILL GOING", time: 4, type: "relax" }] },
  { label: "Sitter's Check", flow: "Babysitter comes over: 'Let me check you, sweetie.' She pats your padding and nods. 'Yeah, we're doing a change.'", autoVoid: true, guide: [{ text: "PAT CHECK", time: 3, type: "relax" }, { text: "CONFIRMED WET", time: 3, type: "relax" }, { text: "PASSIVE FLOW", time: 6, type: "relax" }] },
  { label: "Movement Flood", flow: "You stood up and everything shifted—a torrent ran out with the movement. Babysitter catches it immediately.", autoVoid: true, guide: [{ text: "STAND UP", time: 2, type: "push" }, { text: "FLOOD RUNS", time: 7, type: "relax" }, { text: "STILL DRAINING", time: 4, type: "relax" }] },
  { label: "Laugh & Let Go", flow: "Babysitter said something funny. You started laughing and that was that—everything came out. She's already reaching for the changing mat.", autoVoid: true, guide: [{ text: "LAUGH FREELY", time: 3, type: "push" }, { text: "COMPLETE RELEASE", time: 8, type: "relax" }] },
  { label: "Tummy Pressure", flow: "Babysitter leaned over to check something and accidentally pressed your tummy. That was all it needed.", autoVoid: true, guide: [{ text: "PRESSURE APPLIED", time: 2, type: "push" }, { text: "INSTANT FLOOD", time: 7, type: "relax" }, { text: "OVERFLOW", time: 3, type: "relax" }] },
  { label: "Deep Relax Void", flow: "You were relaxing watching something, and your body just slowly emptied without any signal. You only notice when the warmth reaches the edge.", autoVoid: true, guide: [{ text: "ZONE OUT", time: 5, type: "relax" }, { text: "SLOW EMPTYING", time: 8, type: "relax" }] },
  { label: "Sneeze Cascade", flow: "Two sneezes and it's over. Completely flooded before the second sneeze finished.", autoVoid: true, guide: [{ text: "SNEEZE 1", time: 1, type: "push" }, { text: "SNEEZE 2—GONE", time: 1, type: "push" }, { text: "TOTAL FLOOD", time: 8, type: "relax" }] },
  { label: "No Signal Void", flow: "No urge. No warning. You're sitting there and then suddenly realize—you're already soaked. Babysitter is matter-of-fact: 'Time for a change.'", autoVoid: true, guide: [{ text: "REALIZE WETTING", time: 3, type: "relax" }, { text: "STILL FLOWING", time: 6, type: "relax" }] },
  { label: "Squeeze and Stream", flow: "You tried to hold it. You squeezed as hard as you could. A full stream ran anyway. Babysitter gives an understanding look.", autoVoid: true, guide: [{ text: "SQUEEZE TIGHT", time: 4, type: "stop" }, { text: "STREAM THROUGH", time: 6, type: "relax" }, { text: "KEEP FLOWING", time: 4, type: "relax" }] },
  { label: "Held-Then-Gone", flow: "You held for about 20 seconds before your muscles just gave out completely. The flood was total.", autoVoid: true, guide: [{ text: "HOLD", time: 5, type: "stop" }, { text: "MUSCLES GIVE", time: 2, type: "push" }, { text: "COMPLETE FLOOD", time: 8, type: "relax" }] }
];

const MACRO_NPT_FULLY_INCONTINENT_D10 = [
  { label: "Automatic Release", flow: "No conscious effort involved. Your body simply empties itself while you're sitting here. Babysitter's already getting the changing supplies—this is just how it goes now.", autoVoid: true, guide: [{ text: "BODY TAKES OVER", time: 3, type: "relax" }, { text: "FULL VOID", time: 8, type: "relax" }, { text: "STILL GOING", time: 5, type: "relax" }] },
  { label: "Sitting Flood", flow: "The padding swells steadily under you. You've been flooding for the last minute without noticing. Babysitter pats your side: 'There we go—change time.'", autoVoid: true, guide: [{ text: "FLOWING", time: 10, type: "relax" }, { text: "PADDING SWELLS", time: 4, type: "relax" }] },
  { label: "Movement Trigger", flow: "Every movement triggers a new wave. Standing, sitting, rolling—it doesn't matter. Your body treats any position change as permission.", autoVoid: true, guide: [{ text: "MOVE", time: 2, type: "push" }, { text: "WAVE POURS", time: 5, type: "relax" }, { text: "ANOTHER WAVE", time: 5, type: "relax" }] },
  { label: "Zero Warning Void", flow: "Completely without warning or sensation. Babysitter noticed the sounds before you did. 'Okay, let's get you changed sweetie—you went again.'", autoVoid: true, guide: [{ text: "NO SIGNAL", time: 2, type: "relax" }, { text: "JUST POURING", time: 10, type: "relax" }] },
  { label: "Laugh Geyser", flow: "Babysitter made you laugh—and you turned into a fountain. This is actually funny. She's laughing too while getting the mat.", autoVoid: true, guide: [{ text: "LAUGH HARD", time: 3, type: "push" }, { text: "GEYSER", time: 9, type: "relax" } ]},
  { label: "Relaxation Void", flow: "You were completely calm—and that calmness meant your bladder just went whenever it felt ready. No resistance, no attempt. Babysitter whispers: 'Good job relaxing.'", autoVoid: true, guide: [{ text: "COMPLETELY CALM", time: 6, type: "relax" }, { text: "FLOWING FREELY", time: 8, type: "relax" }] },
  { label: "Overflow Flood", flow: "Unaware that you were even close to capacity. Now you're overflowing. The padding is absolutely saturated. Babysitter already has everything laid out.", autoVoid: true, guide: [{ text: "OVERFLOW STARTS", time: 3, type: "relax" }, { text: "HEAVY FLOOD", time: 10, type: "relax" }] },
  { label: "Passive Stream", flow: "A steady, passive stream that runs without any muscle input at all. It just flows until it doesn't. Babysitter watches with a gentle look: 'All done?'", autoVoid: true, guide: [{ text: "PASSIVE FLOW", time: 12, type: "relax" }] },
  { label: "Body Decides", flow: "Your body decided it was time. Not you—your body. You're just a passenger. Babysitter: 'See? This is why we use thick ones.'", autoVoid: true, guide: [{ text: "BODY TAKES CONTROL", time: 3, type: "relax" }, { text: "TOTAL RELEASE", time: 10, type: "relax" } ]},
  { label: "Complete Soaking", flow: "Head to toe warmth spreads as you completely flood your padding in one long, unstoppable release. Babysitter is already beside you, changing mat in hand.", autoVoid: true, guide: [{ text: "WARMTH SPREADS", time: 3, type: "relax" }, { text: "FULL RELEASE", time: 10, type: "relax" }, { text: "SOAKED THROUGH", time: 2, type: "relax" }] }
];

/* --- PROTECTION TRANSITION EVENTS (D6 Tables) --- */
// DOWNGRADE: Pad → Pullups
const TRANSITION_PAD_TO_PULLUPS_D6 = [
  { label: "Gentle Change", desc: "Babysitter pulls off your wet pad. 'Oh sweetie, this is soaked. Let's get you in pullups—they'll keep you safer.'", guide: [{ text: "PEEL OFF WET PAD", time: 4, type: "relax" }, { text: "FEEL THE AIR", time: 3, type: "relax" }, { text: "STEP INTO PULLUPS", time: 5, type: "push" }, { text: "SECURE & COMFORTABLE", time: 2, type: "relax" }] },
  { label: "Scolding Change", desc: "Babysitter frowns at your padding. 'A pad isn't cutting it anymore, little one. Into pullups where you belong.'", guide: [{ text: "ACCEPT SCOLDING", time: 3, type: "relax" }, { text: "REMOVE OLD PAD", time: 3, type: "push" }, { text: "PULL ON PULLUPS", time: 4, type: "stop" }, { text: "BABYSITTER FASTENS", time: 3, type: "relax" }] },
  { label: "Practicality Change", desc: "Babysitter says: 'That pad is done for. Let's use pullups—much more practical for you at this point.'", guide: [{ text: "ACKNOWLEDGE", time: 2, type: "relax" }, { text: "STRIP OFF PAD", time: 4, type: "push" }, { text: "STEP INTO PULLUPS", time: 5, type: "stop" }, { text: "ADJUST WAISTBAND", time: 2, type: "relax" }] },
  { label: "Caring Change", desc: "Babysitter pats your leg kindly. 'Don't worry, sweetie—pullups are just the next step. You're still my good boy/girl.'", guide: [{ text: "GET PAT OF COMFORT", time: 3, type: "relax" }, { text: "REMOVE PAD", time: 3, type: "push" }, { text: "PUT ON PULLUPS", time: 4, type: "relax" }, { text: "BABYSITTER CHECKS FIT", time: 3, type: "relax" }] },
  { label: "Efficient Change", desc: "Babysitter works quickly. 'Right, let's swap these out. Pullups will be much better at this point.'", guide: [{ text: "STAY STILL", time: 2, type: "stop" }, { text: "PEEL OFF", time: 3, type: "push" }, { text: "SLIDE INTO PULLUPS", time: 5, type: "stop" }, { text: "TIDY UP", time: 2, type: "relax" }] },
  { label: "Disappointed Change", desc: "Babysitter sighs. 'I hoped the pad would work, but you need more protection now. Let's try pullups.'", guide: [{ text: "LISTEN TO SIGH", time: 2, type: "relax" }, { text: "REMOVE WET PAD", time: 4, type: "push" }, { text: "ACCEPT PULLUPS", time: 4, type: "relax" }, { text: "FEEL SNUG FIT", time: 3, type: "relax" }] }
];

// DOWNGRADE: Pullups → Diapers
const TRANSITION_PULLUPS_TO_DIAPERS_D6 = [
  { label: "Concerned Change", desc: "Babysitter gently removes your pullups. 'Sweetie, even these aren't enough. Let's get you into diapers for safety.'", guide: [{ text: "UNDERSTAND CONCERN", time: 3, type: "relax" }, { text: "PULL DOWN PULLUPS", time: 4, type: "push" }, { text: "LIE DOWN FOR DIAPER", time: 5, type: "relax" }, { text: "BABYSITTER SECURES TAPES", time: 4, type: "relax" }] },
  { label: "No Choice Change", desc: "Babysitter says firmly: 'Pullups didn't work out. Into diapers now. This is what's best for you.'", guide: [{ text: "ACCEPT REALITY", time: 3, type: "relax" }, { text: "REMOVE PULLUPS", time: 3, type: "push" }, { text: "LAY ON CHANGING PAD", time: 4, type: "relax" }, { text: "DIAPER GOES ON", time: 5, type: "relax" }] },
  { label: "Mothering Change", desc: "Babysitter coos softly: 'It's okay, honey. Diapers are right for you—let Babysitter take care of you properly.'", guide: [{ text: "HEAR GENTLENESS", time: 3, type: "relax" }, { text: "LET GO OF PULLUPS", time: 3, type: "push" }, { text: "GET ON CHANGING TABLE", time: 4, type: "relax" }, { text: "FULL DIAPER SECURED", time: 5, type: "relax" }] },
  { label: "Practical Switch", desc: "Babysitter matter-of-factly changes you. 'You need the absorbency. Diapers it is from now on.'", guide: [{ text: "STAY CALM", time: 2, type: "relax" }, { text: "REMOVE PULLUPS", time: 3, type: "push" }, { text: "POSITION FOR CHANGE", time: 4, type: "relax" }, { text: "HEAVY DIAPER APPLIED", time: 5, type: "relax" }] },
  { label: "Proud Change", desc: "Babysitter smiles: 'You're doing great accepting your needs. Into diapers—the responsible choice.'", guide: [{ text: "ACCEPT PRAISE", time: 3, type: "relax" }, { text: "SLIP OFF PULLUPS", time: 3, type: "push" }, { text: "READY YOURSELF", time: 4, type: "relax" }, { text: "DIAPER FULLY ON", time: 5, type: "relax" }] },
  { label: "Resigned Change", desc: "Babysitter with understanding: 'Don't be sad, sweetie. Diapers mean Babysitter will take extra good care of you.'", guide: [{ text: "FEEL UNDERSTOOD", time: 3, type: "relax" }, { text: "OUT WITH PULLUPS", time: 3, type: "push" }, { text: "SURRENDER TO CHANGE", time: 4, type: "relax" }, { text: "SECURED IN DIAPER", time: 5, type: "relax" }] }
];

// DOWNGRADE: Diapers → Thick Diapers
const TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6 = [
  { label: "Final Step", desc: "Babysitter removes your diaper decisively. 'Regular diapers aren't working anymore. It's time for nighttime thick ones—the most protection for you.'", guide: [{ text: "ACCEPT FINALITY", time: 3, type: "relax" }, { text: "DIAPER COMES OFF", time: 3, type: "push" }, { text: "FEEL EXPOSED", time: 2, type: "relax" }, { text: "THICK DIAPER APPLIED", time: 6, type: "relax" }, { text: "BULKY BUT SAFE", time: 3, type: "relax" }] },
  { label: "Tender Care", desc: "Babysitter gently changes you with care. 'Oh sweetie, you need the thickest ones now. Let me make sure you're completely protected.'", guide: [{ text: "TRUST BABYSITTER", time: 3, type: "relax" }, { text: "REGULAR DIAPER OFF", time: 3, type: "push" }, { text: "POWDER APPLIED", time: 3, type: "relax" }, { text: "THICK DIAPER READY", time: 5, type: "relax" }, { text: "EVERYTHING SECURED", time: 3, type: "relax" }] },
  { label: "No More Accidents", desc: "Babysitter says seriously: 'These thicker ones will keep you safely padded all day. No more leaks, no more worry.'", guide: [{ text: "UNDERSTAND NECESSITY", time: 2, type: "relax" }, { text: "DIAPER PULLED DOWN", time: 3, type: "push" }, { text: "CLEAN UP", time: 3, type: "relax" }, { text: "THICK DIAPER FITTED", time: 6, type: "relax" }, { text: "COMPLETELY PROTECTED", time: 2, type: "relax" }] },
  { label: "Proud Sitter", desc: "Babysitter beams: 'You're being so brave accepting the thick ones. Babysitter is so proud of you.'", guide: [{ text: "BLUSH AT PRAISE", time: 3, type: "relax" }, { text: "REMOVE OLD DIAPER", time: 3, type: "push" }, { text: "READY FOR UPGRADE", time: 3, type: "relax" }, { text: "THICK DIAPER GOES ON", time: 6, type: "relax" }, { text: "FEEL CARED FOR", time: 3, type: "relax" }] },
  { label: "Knowing Best", desc: "Babysitter matter-of-factly works: 'These thicks are what you need now. Trust Babysitter to know what's right.'", guide: [{ text: "SURRENDER CONTROL", time: 2, type: "relax" }, { text: "DIAPER REMOVAL", time: 3, type: "push" }, { text: "MOMENT OF CARE", time: 3, type: "relax" }, { text: "THICK PROTECTION APPLIED", time: 6, type: "relax" }, { text: "FULLY SECURE", time: 2, type: "relax" }] },
  { label: "Forever Care", desc: "Babysitter whispers: 'These will be your new normal, sweetie. Babysitter will always keep you safe and clean.'", guide: [{ text: "HEAR PROMISE", time: 3, type: "relax" }, { text: "OFF WITH OLD", time: 3, type: "push" }, { text: "BABYSITTER WORKS", time: 4, type: "relax" }, { text: "THICK DIAPER SECURE", time: 6, type: "relax" }, { text: "HELD SAFELY", time: 3, type: "relax" }] }
];

// UPGRADE: Thick Diapers → Diapers
const TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6 = [
  { label: "Progress Milestone", desc: "Babysitter celebrates: 'Look at you! You've been doing so good—let's try regular diapers again. I'm so proud!'", guide: [{ text: "ACCEPT PRAISE", time: 3, type: "relax" }, { text: "THICK DIAPER OFF", time: 3, type: "push" }, { text: "FEEL LIGHTER", time: 3, type: "relax" }, { text: "REGULAR DIAPER APPLIED", time: 5, type: "relax" }, { text: "MORE FREEDOM", time: 2, type: "relax" }] },
  { label: "Earned Achievement", desc: "Babysitter smiles warmly: 'You've earned this! Switching you back to regular diapers—you're doing such a good job.'", guide: [{ text: "FEEL ACHIEVEMENT", time: 3, type: "relax" }, { text: "THICKS COME OFF", time: 3, type: "push" }, { text: "CLEAN AND FRESH", time: 3, type: "relax" }, { text: "REGULAR DIAPER ON", time: 5, type: "relax" }, { text: "PROUD MOMENT", time: 2, type: "relax" }] },
  { label: "Happy Change", desc: "Babysitter gently removes the thick ones: 'You're ready for a step up, sweetie. Back to regular diapers you go!'", guide: [{ text: "SMILE AT NEWS", time: 3, type: "relax" }, { text: "THICK DIAPER REMOVED", time: 3, type: "push" }, { text: "GENTLE CLEANUP", time: 3, type: "relax" }, { text: "REGULAR DIAPER FITTED", time: 5, type: "relax" }, { text: "PROGRESS FELT", time: 2, type: "relax" }] },
  { label: "Confident Step", desc: "Babysitter says reassuringly: 'Regular diapers again—but Babysitter's still here if you need the thick ones.'", guide: [{ text: "FEEL SECURE", time: 3, type: "relax" }, { text: "THICKS OFF", time: 3, type: "push" }, { text: "REASSURANCE GIVEN", time: 3, type: "relax" }, { text: "REGULAR DIAPER SECURED", time: 5, type: "relax" }, { text: "READY TO TRY", time: 2, type: "relax" }] },
  { label: "Quick Reward", desc: "Babysitter swiftly changes you with a wink: 'Look at you progressing! Back to regular diapers, champ!'", guide: [{ text: "FEEL CELEBRATED", time: 2, type: "relax" }, { text: "THICK DIAPER SWAP", time: 3, type: "push" }, { text: "QUICK CHANGE", time: 3, type: "relax" }, { text: "REGULAR DIAPER READY", time: 4, type: "relax" }, { text: "ALL SET", time: 2, type: "relax" }] },
  { label: "Tender Pride", desc: "Babysitter whispers proudly while changing you: 'You're growing up so well. Regular diapers now—but Babysitter's always watching.'", guide: [{ text: "HEAR PRIDE", time: 3, type: "relax" }, { text: "REMOVE THICKS", time: 3, type: "push" }, { text: "CARE AND ATTENTION", time: 3, type: "relax" }, { text: "REGULAR DIAPER APPLIED", time: 5, type: "relax" }, { text: "GENTLY MONITORED", time: 2, type: "relax" }] }
];

// UPGRADE: Diapers → Pullups
const TRANSITION_DIAPERS_TO_PULLUPS_D6 = [
  { label: "Trust Test", desc: "Babysitter smiles encouragingly: 'I think you're ready to try pullups again. Show me you can handle it, okay?'", guide: [{ text: "FEEL ENCOURAGED", time: 3, type: "relax" }, { text: "DIAPER COMES OFF", time: 3, type: "push" }, { text: "FRESH START", time: 2, type: "relax" }, { text: "PULLUPS ON", time: 4, type: "relax" }, { text: "READY TO PROVE IT", time: 2, type: "relax" }] },
  { label: "Earned Upgrade", desc: "Babysitter claps her hands: 'You've been doing so well! Pull-ups again—I believe in you, sweetie!'", guide: [{ text: "FEEL PROUD", time: 3, type: "relax" }, { text: "DIAPER OFF CAREFULLY", time: 3, type: "push" }, { text: "FINAL CHECK", time: 2, type: "relax" }, { text: "PULLUPS FITTED", time: 4, type: "relax" }, { text: "CONFIDENCE BOOST", time: 2, type: "relax" }] },
  { label: "Hopeful Change", desc: "Babysitter removes your diaper hopefully: 'Let's see if pullups work better for you now. You've got this!'", guide: [{ text: "FEEL HOPE", time: 3, type: "relax" }, { text: "DIAPER PEELED OFF", time: 3, type: "push" }, { text: "LIGHTER FEELINGS", time: 2, type: "relax" }, { text: "PULLUPS READY", time: 4, type: "relax" }, { text: "NEW CHANCE", time: 2, type: "relax" }] },
  { label: "Cautious Upgrade", desc: "Babysitter carefully changes you: 'Back to pull-ups, but if you slip up, that's okay—diapers are always here for you.'", guide: [{ text: "HEAR REASSURANCE", time: 3, type: "relax" }, { text: "DIAPER REMOVAL", time: 3, type: "push" }, { text: "SAFETY NET REMINDER", time: 2, type: "relax" }, { text: "PULLUPS APPLIED", time: 4, type: "relax" }, { text: "SUPPORTED ATTEMPT", time: 2, type: "relax" }] },
  { label: "Big Step", desc: "Babysitter declares: 'You've earned this step back. Pullups again—make Babysitter proud!'", guide: [{ text: "ACCEPT RESPONSIBILITY", time: 3, type: "relax" }, { text: "DIAPER SWITCHED OUT", time: 3, type: "push" }, { text: "MOMENT OF TRUTH", time: 2, type: "relax" }, { text: "PULLUPS SECURED", time: 4, type: "relax" }, { text: "DETERMINED FEELING", time: 2, type: "relax" }] },
  { label: "Joyful Change", desc: "Babysitter beams while changing you: 'I'm so happy! Back to pullups—you're such a good boy/girl for trying so hard!'", guide: [{ text: "FEEL JOY", time: 3, type: "relax" }, { text: "DIAPER REMOVED LOVINGLY", time: 3, type: "push" }, { text: "PRAISED FOR EFFORT", time: 2, type: "relax" }, { text: "PULLUPS PUT ON", time: 4, type: "relax" }, { text: "LOVED AND SUPPORTED", time: 2, type: "relax" }] }
];

// UPGRADE: Pullups → Pad
const TRANSITION_PULLUPS_TO_PAD_D6 = [
  { label: "Big Boy/Girl", desc: "Babysitter beams with pride: 'You did it! Back to just a pad—you've become such a big boy/girl. I'm so proud!'", guide: [{ text: "FEEL PRIDE", time: 3, type: "relax" }, { text: "PULLUPS REMOVED", time: 3, type: "push" }, { text: "FREEDOM MOMENT", time: 2, type: "relax" }, { text: "PAD APPLIED", time: 3, type: "relax" }, { text: "CELEBRATED", time: 2, type: "relax" }] },
  { label: "Victory Moment", desc: "Babysitter removes the pullups excitedly: 'Look at you! Back to a pad—what a champion you are!'", guide: [{ text: "HEAR CELEBRATION", time: 3, type: "relax" }, { text: "PULLUPS COME OFF", time: 3, type: "push" }, { text: "ALMOST GROWN UP", time: 2, type: "relax" }, { text: "PAD READY", time: 3, type: "relax" }, { text: "CHAMPION FEELING", time: 2, type: "relax" }] },
  { label: "Excited Change", desc: "Babysitter quickly swaps you into a pad: 'You've earned light protection again! You're doing so amazing!'", guide: [{ text: "FEEL EXCITEMENT", time: 3, type: "relax" }, { text: "PULLUPS OFF", time: 3, type: "push" }, { text: "FREEDOM RETURNS", time: 2, type: "relax" }, { text: "PAD FITTED", time: 3, type: "relax" }, { text: "AMAZING FEELING", time: 2, type: "relax" }] },
  { label: "Trust Reward", desc: "Babysitter says warmly: 'You've shown such great control. Back to a pad—you've earned it!'", guide: [{ text: "FEEL TRUSTED", time: 3, type: "relax" }, { text: "PULLUPS REMOVED", time: 3, type: "push" }, { text: "EARN LIGHTER LOAD", time: 2, type: "relax" }, { text: "PAD ON", time: 3, type: "relax" }, { text: "RESPONSIBILITY FELT", time: 2, type: "relax" }] },
  { label: "Bright Future", desc: "Babysitter smiles hopefully while changing you: 'Look how far you've come! Just a pad again—the sky's the limit!'", guide: [{ text: "SEE POTENTIAL", time: 3, type: "relax" }, { text: "PULLUPS SWAPPED OUT", time: 3, type: "push" }, { text: "PROGRESS ACKNOWLEDGED", time: 2, type: "relax" }, { text: "PAD SECURED", time: 3, type: "relax" }, { text: "HOPEFUL", time: 2, type: "relax" }] },
  { label: "Tender Victory", desc: "Babysitter gently changes you with genuine delight: 'You're my special one. Just a pad again—Babysitter's so happy for you!'", guide: [{ text: "FEEL SPECIAL", time: 3, type: "relax" }, { text: "PULLUPS OFF", time: 3, type: "push" }, { text: "BABYSITTER HAPPY", time: 2, type: "relax" }, { text: "PAD APPLIED WITH LOVE", time: 3, type: "relax" }, { text: "LOVED & CELEBRATED", time: 2, type: "relax" }] }
];


/* ---------- Audio Engine (v12.5 Looping) ---------- */
let audioCtx = null;
let alarmInterval = null;

function startChime(freq = 880) {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Clear any existing loop to prevent doubling up
  clearInterval(alarmInterval);

  // Create a function for a single beep
  const playBeep = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };

  // Initial beep
  playBeep();

  // Loop every 1 second until stopChime() is called
  alarmInterval = setInterval(playBeep, 1000);
}

function stopChime() {
  clearInterval(alarmInterval);
  alarmInterval = null;
}

/* ---------- PERSISTENCE (Save/Load) ---------- */
function saveState() {
  const state = {
    manualPressure,
    manualSaturation,
    sessionRunning,
    mainEndAt,
    hydrationEndAt, // NEW: Save the drink timer
    profileMode,
    sessionStartTime,
    depMicroCount,
    depMicroTarget
  };
  localStorage.setItem('abdlSimState', JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem('abdlSimState');
  if (!raw) return false;

  const state = JSON.parse(raw);
  manualPressure = state.manualPressure || 0;
  manualSaturation = state.manualSaturation || 0;
  profileMode = state.profileMode || 'early';
  meetingActive = state.meetingActive || false;

  sessionStartTime = state.sessionStartTime || Date.now();
  depMicroCount = state.depMicroCount || 0;
  depMicroTarget = state.depMicroTarget || 3;
  hydrationEndAt = state.hydrationEndAt || null; // Restore drink timer

  $('pressureSlider').value = manualPressure;
  $('saturationSlider').value = manualSaturation;
  $('profileSelect').value = profileMode;
  updatePressureUI(manualPressure);
  updateSaturationUI(manualSaturation);

  if (meetingActive) {
    $('meetingBanner').style.display = 'block';
    $('btnChange').classList.add('locked');
    $('btnMeeting').textContent = "▶ Resume Alarm";
  }

  // Only return true if there is an active session to resume
  if (state.sessionRunning && state.mainEndAt > Date.now()) {
    mainEndAt = state.mainEndAt;
    return true;
  }
  return false;
}

// Hook saveState into key actions
window.addEventListener('beforeunload', saveState);

/* ---------- MANUAL UI UPDATES ---------- */
// This replaces the old setPressureLevel
function updatePressureUI(val) {
  manualPressure = parseInt(val, 10);
  const lv = getUrgencyLevel(manualPressure);
  $('pressureVal').textContent = lv + '/10';
  const descSpan = $('pressureDesc');
  if (descSpan) descSpan.textContent = getUrgencyDesc(lv, profileMode);

  // Feedback Loop: If pressure is high, we might need to expedite the next event
  if (sessionRunning && manualPressure > 75) {
    checkUrgencyOverride();
  }
}

function updateSaturationUI(val) {
  manualSaturation = parseInt(val, 10);
  $('saturationVal').textContent = manualSaturation + "%";

  // Trigger overflow logic if it hits 110%
  checkOverflowSaturation(manualSaturation);
}

function checkUrgencyOverride() {
  // If the timer is very far away (>20 mins) but pressure is HIGH, shorten it.
  const remaining = getMainTimerRemaining(); // seconds
  if (remaining > 1200) { // > 20 mins
    toast("Pressure High: Timer accelerated!");
    rescheduleMainEventForUrgency();
  }
}

/* ---------- MEETING MODE ---------- */
function toggleMeetingMode() {
  if (meetingActive) {
    // End Meeting
    meetingActive = false;
    $('meetingBanner').style.display = 'none';
    $('btnChange').classList.remove('locked');
    $('btnMeeting').textContent = "⏸ Pause Alarm (30m)";
    $('output').textContent = "▶ Alarm resumed. Controls unlocked.";
    clearTimeout(meetingTimer);
  } else {
    // Start Meeting
    meetingActive = true;
    $('meetingBanner').style.display = 'block';
    $('btnChange').classList.add('locked');
    $('btnMeeting').textContent = "▶ Resume Alarm";
    $('output').textContent = "⏸ Alarm paused for 30 mins. No changes until resumed.";

    meetingTimer = setTimeout(() => {
      if (meetingActive) toggleMeetingMode();
    }, 30 * 60 * 1000);
  }
}

/* --- MATRON WARD MICROS (Conditioning & Checks) --- */
const MICRO_WARD_D10 = [
  { label: "Uniform Inspection", flow: "Stand up. Check for sagging. If dry, release a 2-second 'marking' spurt.", classKey: "micro_small", guide: [{ text: "STAND", time: 2, type: "stop" }, { text: "MARK", time: 2, type: "push" }] },
  { label: "The Cold Snap", flow: "Simulate a draft or cold air. Shiver and release tension.", classKey: "micro_tiny", guide: [{ text: "SHIVER", time: 2, type: "push" }, { text: "DRIP", time: 2, type: "relax" }] },
  { label: "Cough Test", flow: "Force a hard cough. Do not hold back the stress leak.", classKey: "micro_big", guide: [{ text: "COUGH HARD", time: 1, type: "push" }, { text: "STRESS LEAK", time: 3, type: "relax" }] },
  { label: "The Squat", flow: "Assume the 'Cat Feeding' squat position. Push for 3 seconds.", classKey: "micro_big", guide: [{ text: "SQUAT DOWN", time: 3, type: "stop" }, { text: "PUSH", time: 3, type: "push" }] },
  { label: "Hydration Penalty", flow: "You look thirsty. Drink, then leak to make room.", classKey: "micro_small", guide: [{ text: "DRINK", time: 5, type: "stop" }, { text: "DISPLACE", time: 5, type: "push" }] },
  { label: "Posture Check", flow: "Sit up straight. Shoulders back. The shift releases a dribble.", classKey: "micro_tiny", guide: [{ text: "POSTURE UP", time: 3, type: "stop" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Diaper Pat", flow: "Check the bulk. Is it mushy? Add to it.", classKey: "micro_small", guide: [{ text: "PAT FRONT", time: 3, type: "stop" }, { text: "ADD WARMTH", time: 3, type: "push" }] },
  { label: "The Ghost Urge", flow: "You feel the urge. Verify it by pushing.", classKey: "micro_small", guide: [{ text: "VERIFY", time: 2, type: "push" }, { text: "CONFIRMED", time: 4, type: "relax" }] },
  { label: "Relaxation Order", flow: "Matron command: Relax your sphincter for 5 seconds.", classKey: "micro_big", guide: [{ text: "OBEY", time: 5, type: "relax" }] },
  { label: "Status Report", flow: "Touch your protection. If warm, pulse twice. If cold, pulse once.", classKey: "micro_tiny", guide: [{ text: "CHECK TEMP", time: 3, type: "stop" }, { text: "PULSE", time: 2, type: "push" }] }
];

/* --- MATRON WARD MACROS (Permission & Punishment) --- */
const MACRO_WARD_D20 = [
  // --- PERMISSION GRANTED (The Reward) ---
  { 
    label: "Permission Granted", 
    flow: "<b>Authorized:</b> The Matron is pleased. You have 3 minutes to use the toilet. Go now.", 
    cls: "full_light", 
    guide: [{ text: "GO TO TOILET", time: 0, type: "stop" }] 
  },
  { 
    label: "Hygiene Check", 
    flow: "<b>Inspection:</b> Go to the bathroom. Check your Guard. If it is dry/damp, you may use the toilet. If it is soaked, you must use the Guard.", 
    cls: "full_light", 
    guide: [{ text: "CHECK STATUS", time: 0, type: "stop" }] 
  },
  { 
    label: "The Mercy Rule", 
    flow: "<b>Relief:</b> You look desperate. Permission granted to empty fully in the toilet.", 
    cls: "full_light", 
    guide: [{ text: "RUN", time: 0, type: "stop" }] 
  },
  { 
    label: "Pad Change", 
    flow: "<b>Maintenance:</b> Go to the bathroom. Dispose of the current Guard. Try to pee in the toilet before putting a new one in.", 
    cls: "full_light", 
    guide: [{ text: "CHANGE & VOID", time: 0, type: "stop" }] 
  },
  { 
    label: "The Coin Flip", 
    flow: "<b>Chance:</b> Flip a coin. Heads = Toilet. Tails = Diaper. Do not cheat.", 
    cls: "full_moderate", 
    guide: [{ text: "FLIP COIN", time: 5, type: "stop" }, { text: "EXECUTE", time: 0, type: "stop" }] 
  },

  // --- CONTROLLED GUARD USE (The Training) ---
  { 
    label: "Capacity Test", 
    flow: "<b>Target Practice:</b> Release exactly 50% into the Tena Guard. Stop before it leaks onto the Goodnite.", 
    cls: "full_moderate", 
    guide: [
      { text: "START SLOW", time: 5, type: "push" }, 
      { text: "HOLD 50%", time: 5, type: "stop" },
      { text: "STOP", time: 2, type: "stop" }
    ] 
  },
  { 
    label: "The Pulse", 
    flow: "<b>Valve Control:</b> 5 short bursts into the Guard. Do not flood it.", 
    cls: "full_moderate", 
    guide: [
      { text: "BURST 1", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 2", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 3", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 4", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 5", time: 1, type: "push" }
    ] 
  },
  { 
    label: "The Soak", 
    flow: "<b>Saturation:</b> Fill the Guard until it is heavy. Do not let it overflow.", 
    cls: "full_moderate", 
    guide: [{ text: "FILL GUARD", time: 10, type: "relax" }] 
  },
  { 
    label: "The Squeeze", 
    flow: "<b>Pressure:</b> Cross your legs. Squeeze your thighs. Let the Guard catch the squeeze-leak.", 
    cls: "full_moderate", 
    guide: [{ text: "SQUEEZE", time: 5, type: "stop" }, { text: "LEAK", time: 5, type: "push" }] 
  },
  { 
    label: "Stand & Deliver", 
    flow: "<b>Gravity:</b> Stand up. Release a steady stream into the Guard for 5 seconds.", 
    cls: "full_moderate", 
    guide: [{ text: "STAND", time: 2, type: "stop" }, { text: "STREAM", time: 5, type: "push" }] 
  },

  // --- FORCED FAILURE (The Punishment) ---
  { 
    label: "Total Denial", 
    flow: "<b>Access Denied:</b> The toilet is locked. You must empty fully into your protection right now.", 
    cls: "full_heavy", 
    guide: [{ text: "EMPTY FULLY", time: 20, type: "relax" }] 
  },
  { 
    label: "The Flood", 
    flow: "<b>Overflow:</b> Do not aim for the Guard. Aim for the Goodnite. Flood everything.", 
    cls: "full_total", 
    guide: [{ text: "FLOOD IT ALL", time: 15, type: "push" }] 
  },
  { 
    label: "Freeze Protocol", 
    flow: "<b>Don't Move:</b> You are not allowed to move from your chair. If you have to go, you go right there.", 
    cls: "full_heavy", 
    guide: [{ text: "STAY SEATED", time: 5, type: "stop" }, { text: "RELEASE", time: 15, type: "relax" }] 
  },
  { 
    label: "The Shiver", 
    flow: "<b>Spasm:</b> Matron induces a cold shiver. You lose control.", 
    cls: "full_heavy", 
    guide: [{ text: "SHIVER", time: 2, type: "push" }, { text: "LOSS OF CONTROL", time: 10, type: "relax" }] 
  },
  { 
    label: "Ignored Plea", 
    flow: "<b>Silence:</b> You asked to leave. Matron didn't answer. You wet yourself waiting.", 
    cls: "full_heavy", 
    guide: [{ text: "WAIT...", time: 5, type: "stop" }, { text: "GIVE UP", time: 10, type: "relax" }] 
  },
  // --- REPEATS to balance probability ---
  { label: "Permission Granted", flow: "<b>Authorized:</b> Go use the toilet.", cls: "full_light", guide: [{ text: "GO TO TOILET", time: 0, type: "stop" }] },
  { label: "Capacity Test", flow: "<b>Target Practice:</b> Fill the Guard, keep the Pull-up dry.", cls: "full_moderate", guide: [{ text: "FILL GUARD", time: 8, type: "relax" }] },
  { label: "Total Denial", flow: "<b>No:</b> Use your diaper.", cls: "full_heavy", guide: [{ text: "USE DIAPER", time: 15, type: "push" }] },
  { label: "The Coin Flip", flow: "<b>Chance:</b> Heads = Potty, Tails = Pad.", cls: "full_moderate", guide: [{ text: "FLIP COIN", time: 5, type: "stop" }] },
  { label: "Permission Granted", flow: "<b>Authorized:</b> Go use the toilet.", cls: "full_light", guide: [{ text: "GO TO TOILET", time: 0, type: "stop" }] }
];
/* --- DEPENDENT MODE MICROS (The "Leak" Queue) --- */
const MICRO_DEPENDENT_D20 = [
  { label: "The Crotch Press", flow: "Press your hand flat against your padding. Feel the warmth spread against your palm.", guide: [{ text: "PRESS HAND", time: 3, type: "stop" }, { text: "LEAK INTO HAND", time: 3, type: "relax" }] },
  { label: "Leg Cross Squeeze", flow: "Cross your legs tight. The pressure forces a leak right into the middle.", guide: [{ text: "CROSS LEGS", time: 2, type: "stop" }, { text: "SQUEEZE & LEAK", time: 3, type: "push" }] },
  { label: "The Diaper Pat", flow: "Pat the front of your diaper to check bulk. Release a spurt while patting.", guide: [{ text: "PAT FRONT", time: 2, type: "stop" }, { text: "SPURT", time: 1, type: "push" }, { text: "PAT FRONT", time: 2, type: "stop" }] },
  { label: "Wide Stance", flow: "Stand up and spread legs wide. Gravity pulls the wetness down.", guide: [{ text: "STAND WIDE", time: 2, type: "stop" }, { text: "GRAVITY FLOW", time: 4, type: "relax" }] },
  { label: "Knee Bounce", flow: "Bounce your leg nervously under the desk. Each bounce pumps out a leak.", guide: [{ text: "BOUNCE LEG", time: 1, type: "push" }, { text: "BOUNCE LEG", time: 1, type: "push" }, { text: "BOUNCE LEG", time: 1, type: "push" }] },
  { label: "The Glute Clench", flow: "Squeeze your butt cheeks together, but let your front relax.", guide: [{ text: "CLENCH GLUTES", time: 3, type: "stop" }, { text: "FRONT LEAK", time: 3, type: "relax" }] },
  { label: "Forward Fold", flow: "Lean forward in your chair until your chest nearly touches your knees. The compression forces a seep.", guide: [{ text: "LEAN FORWARD", time: 3, type: "stop" }, { text: "COMPRESSION LEAK", time: 4, type: "relax" }] },
  { label: "The Waddle Shift", flow: "Shift weight left, then right, grinding the wetness into the pad.", guide: [{ text: "LEAN LEFT", time: 2, type: "relax" }, { text: "LEAN RIGHT", time: 2, type: "relax" }] },
  { label: "Thigh Rub", flow: "Rub your thighs together. The friction triggers a release.", guide: [{ text: "RUB THIGHS", time: 4, type: "push" }] },
  { label: "Check the Back", flow: "Reach back to check for bulk. Leak while distracted.", guide: [{ text: "CHECK BACK", time: 3, type: "stop" }, { text: "UNNOTICED DRIP", time: 3, type: "relax" }] },
  { label: "Toes Curl", flow: "Curl your toes tight in your shoes. Your bladder mirrors the spasm.", guide: [{ text: "CURL TOES", time: 2, type: "stop" }, { text: "SPASM", time: 2, type: "push" }] },
  { label: "Deep Breath In", flow: "Take a massive inhale. Leak as your diaphragm presses down.", guide: [{ text: "DEEP INHALE", time: 2, type: "stop" }, { text: "PRESSURE LEAK", time: 2, type: "push" }] },
  { label: "The Shrug", flow: "Shrug your shoulders up to your ears. Lose control below.", guide: [{ text: "SHRUG HIGH", time: 3, type: "stop" }, { text: "DROP & LEAK", time: 2, type: "relax" }] },
  { label: "Waistband Tug", flow: "Pull your waistband out to look. Leak while checking.", guide: [{ text: "PULL WAISTBAND", time: 2, type: "stop" }, { text: "LOOK & LEAK", time: 3, type: "relax" }] },
  { label: "Lazy Slouch", flow: "Slouch down until you are sitting on your lower back.", guide: [{ text: "SLOUCH LOW", time: 3, type: "stop" }, { text: "PASSIVE SEEP", time: 5, type: "relax" }] },
  { label: "Double Tap", flow: "Tap your crotch twice. Two quick spurts follow.", guide: [{ text: "TAP", time: 0.5, type: "stop" }, { text: "SPURT", time: 1, type: "push" }, { text: "TAP", time: 0.5, type: "stop" }, { text: "SPURT", time: 1, type: "push" }] },
  { label: "Stretch Up", flow: "Reach hands to the ceiling. Release tension in your pelvic floor.", guide: [{ text: "REACH UP", time: 3, type: "stop" }, { text: "RELEASE", time: 3, type: "relax" }] },
  { label: "Fetal Curl", flow: "Pull both knees up toward your chest while seated. Squeeze it out.", guide: [{ text: "KNEES UP", time: 3, type: "stop" }, { text: "SQUEEZE OUT", time: 3, type: "push" }] },
  { label: "The Hump", flow: "Rock your hips forward against the chair edge.", guide: [{ text: "ROCK FORWARD", time: 2, type: "stop" }, { text: "GRIND LEAK", time: 3, type: "relax" }] },
  { label: "Just Go", flow: "No trigger. Just a simple command to use your padding.", guide: [{ text: "USE DIAPER", time: 4, type: "push" }] }
];

/* --- DEPENDENT MODE MACROS (The "Full Voids") --- */
const MACRO_DEPENDENT_D20 = [
  { label: "The Floodgate", flow: "Don't push. Just relax every muscle and let it pour.", guide: [{ text: "TOTAL RELAX", time: 5, type: "relax" }, { text: "HEAVY FLOOD", time: 15, type: "relax" }] },
  { label: "Squat & Fill", flow: "Stand up, Squat down, and fill the back of the diaper.", guide: [{ text: "SQUAT DOWN", time: 3, type: "stop" }, { text: "FILL BACK", time: 10, type: "push" }, { text: "STAND UP", time: 3, type: "stop" }] },
  { label: "The Pulse-Check", flow: "Hand on crotch. Feel the diaper swell with each pulse.", guide: [{ text: "HAND ON", time: 2, type: "stop" }, { text: "SWELL", time: 3, type: "push" }, { text: "SWELL", time: 3, type: "push" }, { text: "SWELL", time: 3, type: "push" }] },
  { label: "The Rocking Chair", flow: "Rock back and forth. Leak on forward, stop on back.", guide: [{ text: "ROCK FWD (WET)", time: 2, type: "push" }, { text: "ROCK BACK", time: 1, type: "stop" }, { text: "ROCK FWD (WET)", time: 2, type: "push" }, { text: "ROCK BACK", time: 1, type: "stop" }, { text: "FINISH", time: 5, type: "relax" }] },
  { label: "Thigh Gap Fill", flow: "Stand with legs touching. Feel the warm trickle down your inner thighs.", guide: [{ text: "LEGS TOGETHER", time: 3, type: "stop" }, { text: "TRICKLE DOWN", time: 12, type: "relax" }] },
  { label: "The Stutter-Soak", flow: "Your control is broken. It starts and stops on its own.", guide: [{ text: "START", time: 2, type: "push" }, { text: "STOP?", time: 1, type: "stop" }, { text: "START", time: 4, type: "push" }, { text: "STOP?", time: 1, type: "stop" }, { text: "GUSH", time: 8, type: "relax" }] },
  { label: "Front to Back", flow: "Lean forward to wet the front, then lean back to soak the rear.", guide: [{ text: "LEAN FWD", time: 3, type: "stop" }, { text: "WET FRONT", time: 6, type: "push" }, { text: "LEAN BACK", time: 3, type: "stop" }, { text: "SOAK REAR", time: 8, type: "relax" }] },
  { label: "The Mush", flow: "Sit heavy. Mush your bottom into the chair and just go.", guide: [{ text: "MUSH DOWN", time: 4, type: "stop" }, { text: "SLOW RELEASE", time: 20, type: "relax" }] },
  { label: "Push Challenge", flow: "See how hard you can push for 10 seconds straight.", guide: [{ text: "PUSH HARD", time: 10, type: "push" }, { text: "RECOVER", time: 5, type: "relax" }] },
  { label: "The Lazy River", flow: "A slow, low-pressure release that takes forever to finish.", guide: [{ text: "SLOW STREAM", time: 30, type: "relax" }] },
  { label: "Crotch Grab Flood", flow: "Hold your crotch tight with both hands. Flood against the pressure.", guide: [{ text: "GRAB TIGHT", time: 5, type: "stop" }, { text: "FLOOD HANDS", time: 10, type: "push" }] },
  { label: "The Shiver-Flood", flow: "Induce a shiver. Let the shiver turn into a full void.", guide: [{ text: "SHIVER", time: 2, type: "stop" }, { text: "RELEASE", time: 12, type: "relax" }] },
  { label: "Wide Leg Waddle", flow: "Waddle to the door and back, leaking heavy the whole way.", guide: [{ text: "WADDLE FWD", time: 5, type: "relax" }, { text: "TURN", time: 2, type: "stop" }, { text: "WADDLE BACK", time: 5, type: "relax" }] },
  { label: "Chair Seat Rock", flow: "Rock your hips back in your chair, feet lifted slightly off the floor. Hold the angle and let gravity do the rest.", guide: [{ text: "ROCK BACK", time: 3, type: "stop" }, { text: "OPEN HIPS", time: 5, type: "relax" }, { text: "OPEN BLADDER", time: 12, type: "relax" }] },
  { label: "The Double Clutch", flow: "Empty half. Stop. Wait. Empty the rest.", guide: [{ text: "EMPTY HALF", time: 8, type: "push" }, { text: "WAIT", time: 3, type: "stop" }, { text: "EMPTY REST", time: 10, type: "push" }] },
  { label: "Chair Slump Flood", flow: "Slump way down into your seat until you're sitting on your tailbone. Let gravity and compression do the work.", guide: [{ text: "SLUMP LOW", time: 4, type: "stop" }, { text: "BELLY COMPRESS", time: 5, type: "push" }, { text: "FLOOD OUT", time: 10, type: "relax" }] },
  { label: "Sneeze Chain", flow: "Fake 3 sneezes. Each one forces a large spurt.", guide: [{ text: "AH-CHOO", time: 1, type: "push" }, { text: "AH-CHOO", time: 1, type: "push" }, { text: "AH-CHOO", time: 1, type: "push" }, { text: "DRAIN OUT", time: 8, type: "relax" }] },
  { label: "Safety Check", flow: "Check leak pad with finger. Flood to test it.", guide: [{ text: "CHECK PAD", time: 3, type: "stop" }, { text: "TEST LIMITS", time: 12, type: "push" }] },
  { label: "The Aftershock", flow: "Finish voiding. Wait. Then force out the hidden reserve.", guide: [{ text: "VOID", time: 10, type: "relax" }, { text: "WAIT", time: 3, type: "stop" }, { text: "AFTERSHOCK", time: 5, type: "push" }] },
  { label: "Diaper Squeeze", flow: "Use your thighs to squeeze the diaper. Wet into the squeeze.", guide: [{ text: "SQUEEZE THIGHS", time: 5, type: "stop" }, { text: "WET MIDDLE", time: 10, type: "push" }] }
];



/* ---------- MICRO TABLES (Restored) ---------- */
/* Replaces MICRO_DIAPER_D8 in app.js */
const MICRO_DIAPER_D8 = [
  {
    label: "Pressure Check",
    flow: "Quick squeeze. Just a single pulse to check capacity.",
    classKey: "micro_tiny",
    tmin: 5, tmax: 12,
    guide: [{ text: "PULSE", time: 0.5, type: "push" }]
  },
  {
    label: "The Shiver",
    flow: "A shiver runs down your spine. Release a short dribble (2s).",
    classKey: "micro_small",
    tmin: 8, tmax: 15,
    guide: [{ text: "DRIBBLE", time: 2, type: "relax" }]
  },
  {
    label: "Double Tap",
    flow: "Two quick spurts. Push-Stop-Push.",
    classKey: "micro_small",
    tmin: 6, tmax: 14,
    guide: [
      { text: "SPURT", time: 0.5, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "SPURT", time: 0.5, type: "push" }
    ]
  },
  {
    label: "Laugh/Cough",
    flow: "Force a cough. Allow a single squirt to escape.",
    classKey: "micro_tiny",
    tmin: 5, tmax: 10,
    guide: [{ text: "COUGH & PUSH", time: 0.5, type: "push" }]
  },
  {
    label: "Position Leak",
    flow: "Shift your weight. Let a small amount escape while moving (1.5s).",
    classKey: "micro_big",
    tmin: 10, tmax: 20,
    guide: [{ text: "SHIFT & LEAK", time: 1.5, type: "relax" }]
  },
  {
    label: "Focus Drip",
    flow: "Do not stop working. Just relax your sphincter for 3 seconds.",
    classKey: "micro_big",
    tmin: 8, tmax: 18,
    guide: [{ text: "RELAX", time: 3, type: "relax" }]
  },
  {
    label: "Seepage",
    flow: "Continuous very low-pressure release for 4 seconds.",
    classKey: "micro_big",
    tmin: 12, tmax: 22,
    guide: [{ text: "SEEP", time: 4, type: "relax" }]
  },
  {
    label: "Stand-Up Squirt",
    flow: "Stand up. Immediately release a 1-second spurt.",
    classKey: "micro_big",
    tmin: 10, tmax: 15,
    guide: [{ text: "STAND & SPURT", time: 1, type: "push" }]
  }
];

const MICRO_STD_D6 = [
  {
    label: "Pinprick Blink",
    flow: "A tiny involuntary spurt catches you off guard—barely a blink, but it's there. Update your saturation.",
    classKey: "micro_tiny",
    guide: [{ text: "QUICK SPURT", time: 1, type: "push" }]
  },
  {
    label: "Double Blink",
    flow: "Two quick spurts escape as you shift—each one a sharp, uncontrolled pulse. Feel them and breathe.",
    classKey: "micro_small",
    guide: [{ text: "FIRST SPURT", time: 1, type: "push" }, { text: "HOLD", time: 2, type: "stop" }, { text: "SECOND SPURT", time: 1, type: "push" }]
  },
  {
    label: "Thin Dribble",
    flow: "A warm dribble trickles slowly. You feel it spreading before you can clench tight enough to stop it.",
    classKey: "micro_small",
    guide: [{ text: "DRIBBLE STARTS", time: 3, type: "relax" }, { text: "CLENCH TIGHT", time: 3, type: "stop" }]
  },
  {
    label: "Peppery Patter",
    flow: "Three or four sharp spurts fire in quick succession—each one a little bigger than the last. Breathe through it.",
    classKey: "micro_big",
    guide: [{ text: "SPURT", time: 1, type: "push" }, { text: "SPURT", time: 1, type: "push" }, { text: "SPURT", time: 1, type: "push" }, { text: "CLENCH HARD", time: 3, type: "stop" }]
  },
  {
    label: "Mini Stream",
    flow: "A steady little stream runs out before you clamp down. Warm and unmistakable. Update your saturation.",
    classKey: "micro_big",
    guide: [{ text: "STREAM STARTS", time: 2, type: "push" }, { text: "FLOWING", time: 4, type: "relax" }, { text: "CLAMP DOWN", time: 3, type: "stop" }]
  },
  {
    label: "Sticky Linger",
    flow: "A slow, extended release you can't seem to cut off all the way. It just keeps seeping while you squeeze.",
    classKey: "micro_big",
    guide: [{ text: "SEEPING", time: 4, type: "relax" }, { text: "SQUEEZE", time: 3, type: "stop" }, { text: "STILL SEEPING", time: 3, type: "relax" }]
  }
];

/* --- OMORASHI MODE STRESS TESTS (Holding Guides - Micro Frequency) --- */
const OMORASHI_HOLDING_GUIDES = [
  {
    label: "Stand & Spread",
    guide: [
      { text: "STAND UP", time: 3, type: "stop" },
      { text: "LEGS WIDE", time: 8, type: "stop" },
      { text: "HOLD STEADY", time: 7, type: "stop" }
    ]
  },
  {
    label: "The Fold",
    guide: [
      { text: "SIT ON EDGE", time: 2, type: "stop" },
      { text: "CHEST TO KNEES", time: 10, type: "stop" },
      { text: "STAY FOLDED", time: 8, type: "stop" }
    ]
  },
  {
    label: "Knee Hug",
    guide: [
      { text: "LIFT LEFT KNEE", time: 2, type: "stop" },
      { text: "HUG TO CHEST", time: 8, type: "stop" },
      { text: "HOLD IT", time: 2, type: "stop" }
    ]
  },
  {
    label: "Hip Rotation",
    guide: [
      { text: "ROTATE LEFT", time: 5, type: "stop" },
      { text: "CENTER", time: 2, type: "stop" },
      { text: "ROTATE RIGHT", time: 5, type: "stop" }
    ]
  },
  {
    label: "Deep Breath Hold",
    guide: [
      { text: "DEEP INHALE", time: 3, type: "stop" },
      { text: "HOLD BREATH", time: 10, type: "stop" },
      { text: "TIGHTEN CORE", time: 5, type: "stop" },
      { text: "EXHALE", time: 3, type: "stop" }
    ]
  },
  {
    label: "Cross Leg Squeeze",
    guide: [
      { text: "CROSS LEGS TIGHT", time: 5, type: "stop" },
      { text: "SQUEEZE THIGHS", time: 8, type: "stop" },
      { text: "UNCROSS", time: 3, type: "stop" }
    ]
  },
  {
    label: "Wall Sit Test",
    guide: [
      { text: "BACK TO WALL", time: 2, type: "stop" },
      { text: "SLIDE DOWN", time: 3, type: "stop" },
      { text: "HOLD SQUAT", time: 15, type: "stop" },
      { text: "STAND UP", time: 3, type: "stop" }
    ]
  },
  {
    label: "Calf Raises",
    guide: [
      { text: "STAND TALL", time: 2, type: "stop" },
      { text: "RAISE ON TOES (8 reps)", time: 12, type: "stop" },
      { text: "HOLD TOP", time: 5, type: "stop" },
      { text: "DOWN", time: 2, type: "stop" }
    ]
  },
  {
    label: "Plank Hold",
    guide: [
      { text: "ASSUME PLANK", time: 3, type: "stop" },
      { text: "HOLD POSITION", time: 15, type: "stop" },
      { text: "REST", time: 2, type: "stop" }
    ]
  },
  {
    label: "Leg Raise",
    guide: [
      { text: "LIE BACK", time: 2, type: "stop" },
      { text: "RAISE LEGS 90°", time: 15, type: "stop" },
      { text: "LOWER", time: 3, type: "stop" }
    ]
  },
  {
    label: "Glute Clench",
    guide: [
      { text: "CLENCH BUTTOCKS", time: 5, type: "stop" },
      { text: "HOLD EVERYTHING", time: 8, type: "stop" },
      { text: "DON'T LET GO", time: 3, type: "stop" }
    ]
  },
  {
    label: "Sitting Rock",
    guide: [
      { text: "SIT FORWARD", time: 3, type: "stop" },
      { text: "SIT BACK", time: 3, type: "stop" },
      { text: "ROCK (5 times)", time: 10, type: "stop" }
    ]
  },
  {
    label: "Kegel Strength",
    guide: [
      { text: "CONTRACT PELVIC FLOOR", time: 5, type: "stop" },
      { text: "HOLD MAXIMUM", time: 8, type: "stop" },
      { text: "REST", time: 4, type: "stop" }
    ]
  },
  {
    label: "Stretcher",
    guide: [
      { text: "REACH TO TOES", time: 8, type: "stop" },
      { text: "FEEL THE STRETCH", time: 5, type: "stop" }
    ]
  },
  {
    label: "Chair Grind",
    guide: [
      { text: "LEAN FORWARD", time: 5, type: "stop" },
      { text: "HOLD", time: 5, type: "stop" },
      { text: "LEAN BACK", time: 5, type: "stop" }
    ]
  },
  {
    label: "The Stair Step",
    guide: [
      { text: "STEP UP (chair/step)", time: 3, type: "stop" },
      { text: "STEP DOWN", time: 3, type: "stop" },
      { text: "REPEAT (4 times)", time: 12, type: "stop" }
    ]
  },
  {
    label: "Belly Compression",
    guide: [
      { text: "HANDS ON BELLY", time: 2, type: "stop" },
      { text: "PRESS DOWN", time: 10, type: "stop" },
      { text: "HOLD", time: 3, type: "stop" }
    ]
  },
  {
    label: "Jumping Jacks",
    guide: [
      { text: "DO 15 JUMPING JACKS", time: 15, type: "stop" },
      { text: "FEEL THE PRESSURE", time: 5, type: "stop" }
    ]
  },
  {
    label: "Stair Climb",
    guide: [
      { text: "CLIMB STAIRS (20 steps)", time: 15, type: "stop" },
      { text: "HOLD AT TOP", time: 8, type: "stop" }
    ]
  },
  {
    label: "The Hold",
    guide: [
      { text: "SIT STILL", time: 5, type: "stop" },
      { text: "JUST... HOLD", time: 15, type: "stop" },
      { text: "DON'T MOVE", time: 10, type: "stop" }
    ]
  }
];

/* --- OMORASHI GAUNTLET OPTIONS (Intensive Final Challenges) --- */
const OMORASHI_GAUNTLETS = [
  {
    name: "Silent Squeeze Protocol",
    guide: [
      { text: "SIT ON EDGE OF CHAIR", time: 5, type: "stop" },
      { text: "LEGS WIDE", time: 3, type: "stop" },
      { text: "FOLD CHEST TO KNEES", time: 5, type: "stop" },
      { text: "HOLD BELLY TIGHT", time: 10, type: "stop" },
      { text: "STAY FOLDED", time: 10, type: "stop" },
      { text: "SIT UP SLOWLY", time: 5, type: "stop" },
      { text: "ROTATE HIPS LEFT", time: 5, type: "stop" },
      { text: "ROTATE HIPS RIGHT", time: 5, type: "stop" },
      { text: "HOLD IN PLACE", time: 10, type: "stop" },
      { text: "LIFT LEFT KNEE", time: 3, type: "stop" },
      { text: "HUG KNEE TO CHEST", time: 5, type: "stop" },
      { text: "SQUEEZE HARD", time: 5, type: "stop" },
      { text: "DROP LEG", time: 2, type: "stop" },
      { text: "LIFT RIGHT KNEE", time: 3, type: "stop" },
      { text: "HUG KNEE TO CHEST", time: 5, type: "stop" },
      { text: "DROP LEG", time: 2, type: "stop" },
      { text: "HANDS ON STOMACH", time: 3, type: "stop" },
      { text: "DEEP INHALE (MAX)", time: 5, type: "stop" },
      { text: "HOLD BREATH", time: 10, type: "stop" },
      { text: "TIGHTEN CORE", time: 5, type: "stop" },
      { text: "EXHALE & HOLD", time: 5, type: "stop" }
    ]
  },
  {
    name: "The Endurance Trial",
    guide: [
      { text: "STAND UP", time: 2, type: "stop" },
      { text: "LEGS WIDE", time: 5, type: "stop" },
      { text: "SQUAT DOWN (hold)", time: 20, type: "stop" },
      { text: "STAND", time: 2, type: "stop" },
      { text: "REPEAT SQUAT", time: 20, type: "stop" },
      { text: "STAND", time: 2, type: "stop" },
      { text: "FINAL SQUAT", time: 20, type: "stop" },
      { text: "REST", time: 3, type: "stop" }
    ]
  },
  {
    name: "The Compression",
    guide: [
      { text: "SIT FRONT OF CHAIR", time: 3, type: "stop" },
      { text: "CROSS LEGS TIGHT", time: 5, type: "stop" },
      { text: "SQUEEZE WITH ALL STRENGTH", time: 15, type: "stop" },
      { text: "LEAN FORWARD", time: 5, type: "stop" },
      { text: "HUG KNEES", time: 10, type: "stop" },
      { text: "BREATHE (barely)", time: 10, type: "stop" },
      { text: "UNFOLD", time: 3, type: "stop" }
    ]
  },
  {
    name: "The Burn",
    guide: [
      { text: "PLANK POSITION", time: 3, type: "stop" },
      { text: "HOLD 30 SECONDS", time: 30, type: "stop" },
      { text: "CALF RAISES (15 reps)", time: 15, type: "stop" },
      { text: "HOLD TOP POSITION", time: 10, type: "stop" },
      { text: "REST", time: 2, type: "stop" }
    ]
  },
  {
    name: "The Grinder",
    guide: [
      { text: "SIT HEAVILY IN CHAIR", time: 3, type: "stop" },
      { text: "HIPS FORWARD", time: 5, type: "stop" },
      { text: "HIPS BACK", time: 5, type: "stop" },
      { text: "CIRCULAR MOTION (10 circles)", time: 15, type: "stop" },
      { text: "GRINDING MOTION (10 more)", time: 15, type: "stop" },
      { text: "STOP & HOLD", time: 10, type: "stop" }
    ]
  },
  {
    name: "The Breath Torture",
    guide: [
      { text: "LIE ON BACK", time: 2, type: "stop" },
      { text: "LEGS STRAIGHT UP (90°)", time: 5, type: "stop" },
      { text: "DEEP BREATH IN", time: 5, type: "stop" },
      { text: "HOLD BREATH", time: 15, type: "stop" },
      { text: "EXHALE (slowly)", time: 5, type: "stop" },
      { text: "REPEAT (2 more times)", time: 30, type: "stop" },
      { text: "LOWER LEGS SLOWLY", time: 5, type: "stop" }
    ]
  },
  {
    name: "The Staircase",
    guide: [
      { text: "STAND AT BASE", time: 1, type: "stop" },
      { text: "CLIMB 2 FLIGHTS FAST", time: 20, type: "stop" },
      { text: "STAND AT TOP", time: 10, type: "stop" },
      { text: "DESCEND SLOWLY", time: 15, type: "stop" }
    ]
  },
  {
    name: "The Kegel Crusher",
    guide: [
      { text: "PELVIC CONTRACT (MAX)", time: 10, type: "stop" },
      { text: "HOLD IT (no relaxing)", time: 15, type: "stop" },
      { text: "PULSES (10 rapid)", time: 8, type: "stop" },
      { text: "FINAL HOLD", time: 10, type: "stop" },
      { text: "REST", time: 5, type: "stop" }
    ]
  }
];


function microTableForMode(roll) {
  const profile = profileMode;

  // Profile-appended events are merged in at runtime
  const appended = (appendedEventsByProfile?.[profile] || []).filter(e => (e.type || 'micro') === 'micro' && Array.isArray(e.guide));
  if (appended.length && Math.random() < 0.35) {
    const evt = pick(appended);
    return {
      kind: 'micro',
      desc: evt.flow || evt.desc || `${evt.label || 'Custom Micro'}: Leak event.`,
      classKey: evt.classKey || 'micro_small',
      guide: evt.guide
    };
  }

  if (customProfileRuntime?.customMicroEvents?.length && customProfileRuntime.baseProfile === profileMode) {
    const e = pick(customProfileRuntime.customMicroEvents);
    return {
      kind: 'micro',
      desc: e.flow || e.desc || `${e.label || 'Custom Micro'}: Leak event.`,
      classKey: e.classKey || 'micro_small',
      guide: e.guide
    };
  }

  let table;

  if (profileMode === 'dependent') {
    const enabled = filterEnabledCatalog('dependent', 'MICRO_DEPENDENT_D20', MICRO_DEPENDENT_D20);
    const pickMeta = pick(enabled);
    const e = pickMeta.e;
    return {
      kind: 'micro',
      desc: e.flow,
      guide: e.guide
    };
  } else if (profileMode.startsWith('train_')) {
    table = MICRO_TRAINING_D8;
  } else if (profileMode === 'npt' || profileMode === 'toddler') {
    table = MICRO_DIAPER_D8;
  } 
  else if (profileMode === 'matron_ward') {
    // Matron Ward: Strict checks
    table = MICRO_WARD_D10;
  } else {
    table = MICRO_STD_D6;
  }

  const sourceByProfile = {
    npt: 'MICRO_DIAPER_D8',
    toddler: 'MICRO_DIAPER_D8',
    train_rookie: 'MICRO_TRAINING_D8',
    train_pro: 'MICRO_TRAINING_D8',
    matron_ward: 'MICRO_WARD_D10'
  };
  const source = sourceByProfile[profileMode] || 'MICRO_STD_D6';
  const enabled = filterEnabledCatalog(profileMode, source, table);
  const idx = clamp(roll, 1, enabled.length) - 1;
  const e = enabled[idx].e;

  return {
    kind: 'micro',
    desc: e.flow ? e.flow : `${e.label}: Small release.`,
    classKey: e.classKey,
    guide: e.guide
  };
}

window.mercyMode = true; // Default to ON

function toggleMercy() {
  window.mercyMode = !window.mercyMode;
  const btn = $('btnMercy');
  if (window.mercyMode) {
    btn.textContent = "Mercy: ON";
    btn.style.color = "#55efc4"; // Green
    btn.style.borderColor = "#55efc4";
    toast("Mercy Mode Enabled: Recovery possible.");
  } else {
    btn.textContent = "Mercy: OFF";
    btn.style.color = "#ff6b6b"; // Red
    btn.style.borderColor = "#ff6b6b";
    toast("Mercy Mode Disabled: No escape.");
  }
}

/* --- NEW: Training Mode Micros (Panic & Pressure) --- */
const MICRO_TRAINING_D8 = [
  // --- SEATED (Originals & Additions) ---
  {
    label: "Gravity Drain",
    flow: "You lean all the way back in your chair. Gravity pulls a steady trickle out.",
    classKey: "micro_small",
    guide: [
      { text: "LEAN BACK", time: 3, type: "stop" },
      { text: "GRAVITY LEAK", time: 4, type: "relax" }
    ]
  },
  {
    label: "Typing Surge",
    flow: "You try to keep working through a surge, resulting in rhythmic spurts with each keystroke.",
    classKey: "micro_small",
    guide: [
      { text: "WORK/TYPE FAST", time: 2, type: "stop" },
      { text: "SPURT", time: 1, type: "push" },
      { text: "WORK/TYPE FAST", time: 2, type: "stop" },
      { text: "SPURT", time: 1, type: "push" }
    ]
  },
  {
    label: "The Crotch-Press",
    flow: "You press your hand firmly against your crotch. It spurts around your fingers.",
    classKey: "micro_small",
    guide: [
      { text: "PRESS HARD", time: 4, type: "stop" },
      { text: "SQUIRT", time: 2, type: "push" },
      { text: "STEADY DRIP", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Shiver-Spasm",
    flow: "A cold chill makes you shiver violently, triggering three sharp bursts.",
    classKey: "micro_tiny",
    guide: [
      { text: "SHIVER", time: 1, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "SHIVER", time: 1, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "SHIVER", time: 1, type: "push" }
    ]
  },
  {
    label: "The Scissor Squeeze",
    flow: "You cross your legs tight to hold it, but the pressure actually squeezes a leak out.",
    classKey: "micro_big",
    guide: [
      { text: "CROSS LEGS", time: 3, type: "stop" },
      { text: "SQUEEZE & LEAK", time: 3, type: "push" },
      { text: "UNCROSS", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Stutter-Stop",
    flow: "Your fatigued muscle flutters. You stop, leak, stop, leak.",
    classKey: "micro_small",
    guide: [
      { text: "STOP", time: 1, type: "stop" },
      { text: "LEAK", time: 1, type: "relax" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "LEAK", time: 2, type: "relax" }
    ]
  },
  {
    label: "The Overhead Reach",
    flow: "You stretch your arms high above your head. Lifting your ribcage relaxes your core too much.",
    classKey: "micro_small",
    guide: [
      { text: "REACH HIGH", time: 3, type: "stop" },
      { text: "CORE RELAX", time: 3, type: "relax" },
      { text: "ARMS DOWN", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Slump & Seep",
    flow: "You slump forward, resting your elbows on your knees/desk. The abdominal compression pushes a seep out.",
    classKey: "micro_big",
    guide: [
      { text: "ELBOWS ON KNEES", time: 3, type: "stop" },
      { text: "COMPRESSION", time: 4, type: "push" },
      { text: "SIT UP", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Nervous Bounce",
    flow: "You bounce your leg nervously. The rhythmic motion shakes a few drops loose.",
    classKey: "micro_tiny",
    guide: [
      { text: "BOUNCE LEG", time: 1, type: "push" },
      { text: "BOUNCE LEG", time: 1, type: "push" },
      { text: "BOUNCE LEG", time: 1, type: "push" },
      { text: "BOUNCE LEG", time: 1, type: "push" }
    ]
  },
  {
    label: "The Chair Twist",
    flow: "You twist your upper body to look behind you. The torsion wrings out your bladder.",
    classKey: "micro_small",
    guide: [
      { text: "TWIST RIGHT", time: 2, type: "stop" },
      { text: "LEAK", time: 2, type: "relax" },
      { text: "TWIST LEFT", time: 2, type: "stop" },
      { text: "LEAK", time: 2, type: "relax" }
    ]
  },
  {
    label: "The Glute Release",
    flow: "You've been clenching your butt to hold it. You finally let go, and the front follows.",
    classKey: "micro_big",
    guide: [
      { text: "CLENCH BUTT", time: 4, type: "stop" },
      { text: "RELAX BUTT", time: 1, type: "relax" },
      { text: "FRONT LEAK", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Breath Hold",
    flow: "You hold your breath to concentrate. When you finally exhale, you lose control.",
    classKey: "micro_small",
    guide: [
      { text: "HOLD BREATH", time: 4, type: "stop" },
      { text: "EXHALE HARD", time: 1, type: "relax" },
      { text: "LEAK", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Heel Prop",
    flow: "You prop your feet up on your desk/chair. The tilt changes the pressure angle.",
    classKey: "micro_small",
    guide: [
      { text: "FEET UP", time: 3, type: "stop" },
      { text: "ANGLE SHIFT", time: 3, type: "relax" },
      { text: "FEET DOWN", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Double Clutch",
    flow: "You try to verify if you are done. You push to check, but can't stop the flow immediately.",
    classKey: "micro_small",
    guide: [
      { text: "CHECK PUSH", time: 1, type: "push" },
      { text: "TRY TO STOP", time: 2, type: "stop" },
      { text: "FAILED STOP", time: 2, type: "relax" }
    ]
  },
  {
    label: "Thigh Gap Fail",
    flow: "You press your thighs together to create a seal, but the wetness warms between them.",
    classKey: "micro_big",
    guide: [
      { text: "KNEES TOGETHER", time: 3, type: "stop" },
      { text: "WARMTH SPREADS", time: 4, type: "relax" }
    ]
  },
  {
    label: "Daydream Dribble",
    flow: "You stare at your screen, lost in thought. As your mind drifts, so does your control.",
    classKey: "micro_small",
    guide: [
      { text: "ZONE OUT", time: 5, type: "stop" },
      { text: "FORGET & DRIBBLE", time: 3, type: "relax" }
    ]
  },
  {
    label: "Tummy Pressure",
    flow: "You lean forward, resting your arms on your desk. The gentle pressure is just enough to start a seep.",
    classKey: "micro_big",
    guide: [
      { text: "LEAN FORWARD", time: 3, type: "stop" },
      { text: "GENTLE SEEP", time: 5, type: "relax" }
    ]
  },
  {
    label: "The Startle",
    flow: "A sudden in-game sound or notification makes you jump, causing a sharp, surprising squirt.",
    classKey: "micro_tiny",
    guide: [
      { text: "JUMP!", time: 0.5, type: "push" },
      { text: "SURPRISE LEAK", time: 1.5, type: "relax" }
    ]
  },
  {
    label: "The Sneeze",
    flow: "A tickle in your nose becomes an explosive sneeze. You can't hold back the gush.",
    classKey: "micro_big",
    guide: [
      { text: "SNEEZE!", time: 1, type: "push" },
      { text: "GUSH", time: 2, type: "relax" }
    ]
  },
  // --- POSTURE-BASED (Standing/General Movement) ---
  {
    label: "The Slow Turn",
    flow: "You turn to look at something, but the slow twist is enough to compromise your control.",
    classKey: "micro_small",
    guide: [
        { text: "TURN SLOWLY", time: 4, type: "stop" },
        { text: "A SLOW LEAK", time: 4, type: "relax" }
    ]
  },
  {
    label: "One-Legged Balance",
    flow: "You stand on one leg to distract yourself, but you lose your focus and your clench.",
    classKey: "micro_small",
    guide: [
      { text: "STAND ON ONE LEG", time: 5, type: "stop" },
      { text: "LOSE FOCUS", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Vertical Shift",
    flow: "You stand up too quickly. The sudden gravity shift pulls a leak out before you can clamp.",
    classKey: "micro_small",
    guide: [
      { text: "SIT STILL", time: 2, type: "stop" },
      { text: "STAND FAST", time: 1, type: "push" },
      { text: "LEAKING", time: 3, type: "relax" }
    ]
  },
  {
      label: "The Gentle Bend",
      flow: "You bend slightly to pick something up from the floor beside you, and that small squeeze is enough.",
      classKey: "micro_small",
      guide: [
          { text: "BEND SIDEWAYS", time: 2, type: "stop" },
          { text: "SQUEEZE OUT", time: 2, type: "push" },
          { text: "STRAIGHTEN UP", time: 1, type: "stop" }
      ]
  },
  {
    label: "The Pacing Peril",
    flow: "You pace around to distract yourself, but each pivot puts a little squeeze on your bladder.",
    classKey: "micro_tiny",
    guide: [
      { text: "PACE", time: 3, type: "stop" },
      { text: "TURN & LEAK", time: 1, type: "relax" },
      { text: "PACE", time: 3, type: "stop" },
      { text: "TURN & LEAK", time: 1, type: "relax" }
    ]
  },
  {
      label: "The Forward Lean",
      flow: "You lean forward intently, focusing on the screen. The angle is not your friend.",
      classKey: "micro_big",
      guide: [
          { text: "LEAN FORWARD", time: 4, type: "stop" },
          { text: "OOPS, A GUSH", time: 3, type: "push" }
      ]
  },
  {
    label: "The Sudden Sit-Down",
    flow: "You were standing and decided to sit, but you sat down a little too hard. Whoops.",
    classKey: "micro_small",
    guide: [
      { text: "ABOUT TO SIT", time: 2, type: "stop" },
      { text: "SIT HARD", time: 1, type: "push" },
      { text: "SURPRISE SPURT", time: 2, type: "relax" }
    ]
  },
  {
    label: "The 'Act Natural' Freeze",
    flow: "An urge hits while you're standing. You freeze, trying to look normal, but a betraying warmth seeps out.",
    classKey: "micro_small",
    guide: [
      { text: "FREEZE", time: 4, type: "stop" },
      { text: "WARM SEEP", time: 4, type: "relax" }
    ]
  },
  {
    label: "The Desk Lean",
    flow: "You lean forward over your desk, putting all the pressure right where it shouldn't be.",
    classKey: "micro_big",
    guide: [
      { text: "LEAN ON DESK", time: 5, type: "stop" },
      { text: "PRESSURE LEAK", time: 4, type: "push" }
    ]
  },
  {
    label: "The Un-Cross",
    flow: "You had your legs crossed tightly while standing. Uncrossing them was a mistake.",
    classKey: "micro_small",
    guide: [
      { text: "LEGS CROSSED", time: 4, type: "stop" },
      { text: "UNCROSS...", time: 2, type: "relax" },
      { text: "IMMEDIATE LEAK", time: 3, type: "relax" }
    ]
  },
  {
      label: "The Yawn",
      flow: "A huge yawn stretches your entire body, and your pelvic floor relaxes with it.",
      classKey: "micro_small",
      guide: [
          { text: "BIG YAWN", time: 3, type: "stop" },
          { text: "RELAX & LEAK", time: 3, type: "relax" }
      ]
  },
  {
      label: "The Creeping Dread",
      flow: "You feel a tiny damp spot and hope it's just sweat. It isn't. It slowly grows.",
      classKey: "micro_big",
      guide: [
          { text: "IS THAT...?", time: 4, type: "stop" },
          { text: "OH NO", time: 2, type: "relax" },
          { text: "SLOW SEEP", time: 5, type: "relax" }
      ]
  }
];

/* --- NEW: Training Mode Full Failures (The "Why") --- */
const FULL_TRAINING_FAILURES = [
  // --- REVISED ORIGINALS (duration < 20s) ---
  {
    label: "The Stuttering Soak",
    flow: "<b>Control Struggle:</b> You manage to stop three times, but the fourth wave is too much.",
    guide: [
      { text: "LEAK", time: 3, type: "relax" }, { text: "STOP", time: 2, type: "stop" },
      { text: "LEAK", time: 4, type: "relax" }, { text: "STOP", time: 2, type: "stop" },
      { text: "LEAK", time: 5, type: "relax" }, { text: "STOP", time: 1, type: "stop" },
      { text: "FLOOD", time: 8, type: "push" }
    ]
  },
  {
    label: "The Chair Squirm",
    flow: "<b>Position Failure:</b> You squirm in your seat, trying to find a 'safe' position, but only make it worse.",
    guide: [
      { text: "SQUIRM & SHIFT", time: 6, type: "stop" },
      { text: "PRESSURE SPIKE", time: 5, type: "push" },
      { text: "GIVE UP", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Thousand-Yard Stare",
    flow: "<b>Exhaustion Failure:</b> You're so tired of holding it, you just freeze, staring into space as it all lets go.",
    guide: [
      { text: "ZONE OUT", time: 5, type: "stop" },
      { text: "DETACH & FLOOD", time: 18, type: "relax" }
    ]
  },
  {
    label: "The Surrender",
    flow: "<b>Mental Failure:</b> You're too tired to keep fighting. You just... give up and let it all go.",
    guide: [
      { text: "STOP FIGHTING", time: 5, type: "stop" },
      { text: "SLOW, WARM RELEASE", time: 20, type: "relax" }
    ]
  },
  {
    label: "The Trickle-Down",
    flow: "<b>Miscalculation:</b> It started as a tiny, harmless trickle... but it's not stopping. It's getting stronger.",
    guide: [
      { text: "SMALL TRICKLE", time: 5, type: "relax" },
      { text: "GETTING STRONGER", time: 7, type: "relax" },
      { text: "FULL FLOW", time: 8, type: "push" }
    ]
  },
  {
    label: "The Broken Promise",
    flow: "<b>Bargaining Failure:</b> You told yourself 'just a little bit'. You lied. The floodgates are open.",
    guide: [
      { text: "'Just a little...'", time: 2, type: "push" },
      { text: "OH NO", time: 4, type: "relax" },
      { text: "UNSTOPPABLE FLOOD", time: 14, type: "push" }
    ]
  },
  {
    label: "The Relaxation Puddle",
    flow: "<b>Relaxation Failure:</b> You get comfy in your seat, and all your tension melts away, including your bladder control.",
    guide: [
      { text: "GET COMFORTABLE", time: 5, type: "stop" },
      { text: "MUSCLES RELAX", time: 4, type: "relax" },
      { text: "FORMING A PUDDLE", time: 15, type: "relax" }
    ]
  },

  // --- NEW ADDITIONS ---
  {
      label: "The Auditory Trigger",
      flow: "<b>Mental Failure:</b> The sound of running water from a video or show is too much to handle.",
      guide: [
          { text: "HEAR WATER...", time: 4, type: "stop" },
          { text: "MIND GIVES IN", time: 3, type: "relax" },
          { text: "MATCH THE SOUND", time: 15, type: "relax" }
      ]
  },
  {
    label: "The Screen Blank",
    flow: "<b>Focus Failure:</b> You stare blankly at the screen, mind empty, and in that checked-out moment everything lets go.",
    guide: [
      { text: "STARE BLANKLY", time: 6, type: "stop" },
      { text: "MIND GOES BLANK", time: 2, type: "relax" },
      { text: "DREAMY FLOOD", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Distraction Flood",
    flow: "<b>Distraction Failure:</b> 'Just one more minute.' Famous last words. You got too focused on your task to notice the flood.",
    guide: [
      { text: "FOCUS ON TASK", time: 8, type: "stop" },
      { text: "SUBTLE LEAK", time: 5, type: "relax" },
      { text: "FULL SOAKING", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Laughing Fit",
    flow: "<b>Spasm Failure:</b> Something makes you laugh uncontrollably, and each 'HA' is a gush.",
    guide: [
      { text: "LAUGH", time: 1, type: "push" },
      { text: "GUSH", time: 3, type: "relax" },
      { text: "LAUGH HARDER", time: 1, type: "push" },
      { text: "TOTAL FLOOD", time: 12, type: "push" }
    ]
  },
  {
    label: "The Coughing Jag",
    flow: "<b>Spasm Failure:</b> A tickle in your throat turns into a coughing jag that shakes a powerful stream out of you.",
    guide: [
      { text: "COUGH", time: 2, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "DEEP COUGH", time: 3, type: "push" },
      { text: "UNSTOPPABLE STREAM", time: 14, type: "relax" }
    ]
  },
  {
    label: "The Sneeze-pocalypse",
    flow: "<b>Spasm Failure:</b> One sneeze made you leak. The second one broke the dam completely.",
    guide: [
      { text: "ACHOO #1", time: 2, type: "push" },
      { text: "TRY TO RECOVER", time: 3, type: "stop" },
      { text: "ACHOO #2", time: 1, type: "push" },
      { text: "TOTAL MELTDOWN", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Deliberate Release",
    flow: "<b>Mental Failure:</b> You're tired of holding it. You decide to just let go. A slow, deliberate, warm release.",
    guide: [
      { text: "DECIDE TO GO", time: 4, type: "stop" },
      { text: "SLOW & STEADY", time: 20, type: "relax" }
    ]
  },
  {
    label: "The Pressure Point",
    flow: "<b>Miscalculation:</b> You press a hand to your lower tummy to 'help', but it just forces everything out.",
    guide: [
      { text: "PRESS ON TUMMY", time: 3, type: "stop" },
      { text: "IT'S NOT WORKING", time: 3, type: "push" },
      { text: "IT'S MAKING IT WORSE", time: 12, type: "push" }
    ]
  },
  {
    label: "The Deadline Desperation",
    flow: "<b>Focus Failure:</b> You try to finish one last thing before you go. Your bladder finished first.",
    guide: [
      { text: "WORKING FRANTICALLY", time: 7, type: "stop" },
      { text: "THE URGE WINS", time: 18, type: "relax" }
    ]
  },
  {
    label: "The Slouch-pocalypse",
    flow: "<b>Position Failure:</b> You slouch down so far in your chair that you compress your bladder and it gives way.",
    guide: [
      { text: "SLOUCH DOWN", time: 4, type: "stop" },
      { text: "COMPRESSION", time: 5, type: "push" },
      { text: "TOTAL RELEASE", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Big Morning Stretch",
    flow: "<b>Position Failure:</b> You do a big, satisfying stretch, relaxing every muscle, including the important ones.",
    guide: [
      { text: "BIG STRETCH", time: 5, type: "stop" },
      { text: "EVERYTHING RELAXES", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Shiver Cascade",
    flow: "<b>Spasm Failure:</b> A sudden cold chill gives you goosebumps, then a shiver, then an unstoppable flow.",
    guide: [
      { text: "CHILLS...", time: 4, type: "stop" },
      { text: "BIG SHIVER", time: 2, type: "push" },
      { text: "WARM CASCADE", time: 16, type: "relax" }
    ]
  },
  {
    label: "The False Finish",
    flow: "<b>Miscalculation:</b> You had a small leak and thought it was over. You were wrong. The main event was just waiting.",
    guide: [
      { text: "SMALL LEAK...", time: 4, type: "relax" },
      { text: "...stopped?", time: 4, type: "stop" },
      { text: "NOPE. THE REAL FLOOD", time: 15, type: "push" }
    ]
  },
  {
    label: "The Deep Breath Betrayal",
    flow: "<b>Relaxation Failure:</b> You take a deep, calming breath to manage the urge. It works too well.",
    guide: [
      { text: "DEEP BREATH IN...", time: 5, type: "stop" },
      { text: "EXHALE & RELEASE", time: 18, type: "relax" }
    ]
  },
  {
    label: "The Out-of-Nowhere Spasm",
    flow: "<b>Spasm Failure:</b> With no warning, a powerful spasm hits you and your bladder just empties. No time to react.",
    guide: [
      { text: "Wait for it...", time: 3, type: "stop" },
      { text: "SUDDEN SPASM", time: 2, type: "push" },
      { text: "TOTAL FLOOD", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Leg Cramp Collapse",
    flow: "<b>Distraction Failure:</b> A sudden cramp in your leg makes you cry out, and in that moment of pain, you lose all control.",
    guide: [
      { text: "CRAMP!", time: 2, type: "stop" },
      { text: "FOCUS LOST", time: 1, type: "push" },
      { text: "PAIN & PUDDLE", time: 17, type: "relax" }
    ]
  },
  {
    label: "The Hot Drink Mistake",
    flow: "<b>Relaxation Failure:</b> That warm coffee or tea is so comforting. It's relaxed your tummy, and now, your bladder.",
    guide: [
      { text: "SIPPING DRINK", time: 5, type: "stop" },
      { text: "FEEL THE WARMTH", time: 5, type: "relax" },
      { text: "WARMTH SPREADS...", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Point of No Return",
    flow: "<b>Exhaustion Failure:</b> You've held it for so long your muscles are shaking. They finally give out completely.",
    guide: [
      { text: "TREMBLING", time: 5, type: "stop" },
      { text: "MUSCLES GIVE OUT", time: 20, type: "push" }
    ]
  },
  {
    label: "The 'Just Sit Still' Fail",
    flow: "<b>Mental Failure:</b> Your only job was to sit still and not let go. You failed. You just let it happen.",
    guide: [
      { text: "SIT PERFECTLY STILL", time: 8, type: "stop" },
      { text: "A LITTLE VOICE SAYS 'GO'", time: 3, type: "relax" },
      { text: "YOU LISTEN", time: 12, type: "relax" }
    ]
  },
  {
    label: "The Pop Song Betrayal",
    flow: "<b>Distraction Failure:</b> A catchy song comes on and you start tapping your foot. The rhythm travels upwards...",
    guide: [
      { text: "TAP... TAP... TAP...", time: 6, type: "stop" },
      { text: "RHYTHMIC SPURTS", time: 6, type: "push" },
      { text: "BEAT DROPS", time: 8, type: "relax" }
    ]
  },
  {
    label: "The 'It's Just a Drip' Lie",
    flow: "<b>Miscalculation:</b> You feel a drip and ignore it. Then another. Then you realize it's not dripping anymore, it's flowing.",
    guide: [
      { text: "DRIP...", time: 3, type: "relax" },
      { text: "IGNORE IT", time: 3, type: "stop" },
      { text: "DRIP...DRIP...", time: 4, type: "relax" },
      { text: "OH, IT'S A STREAM NOW", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Phantom Urge",
    flow: "<b>Miscalculation:</b> You pushed a little to see if the urge was real. It was. It very much was.",
    guide: [
      { text: "TEST PUSH", time: 1, type: "push" },
      { text: "CONFIRMED REAL", time: 2, type: "push" },
      { text: "CAN'T STOP", time: 15, type: "push" }
    ]
  },
  {
    label: "The Belly Rub Mistake",
    flow: "<b>Relaxation Failure:</b> You absent-mindedly rub your tummy, relaxing everything in the process.",
    guide: [
      { text: "FULL TUMMY", time: 4, type: "stop" },
      { text: "GENTLE BELLY RUBS", time: 6, type: "relax" },
      { text: "TOO RELAXED", time: 10, type: "relax" }
    ]
  },
   {
    label: "The Sudden Stop",
    flow: "<b>Mental Failure:</b> You suddenly stop what you're doing, realizing you've been ignoring the urge for too long. It's too late.",
    guide: [
      { text: "SUDDEN REALIZATION", time: 3, type: "stop" },
      { text: "PANIC SETS IN", time: 2, type: "push" },
      { text: "TOO LATE TO STOP", time: 18, type: "relax" }
    ]
  }
];


/* ---------- FULL d20 TABLES (Restored) ---------- */
/* Replaces FULL_D20 in app.js */
const FULL_D20 = [
  // LOW INTENSITY
  {
    label: "Spasm Series",
    flow: "<b>3-Step Spasm:</b> Push for 2s. Stop. Push for 2s. Stop. Push for 2s.",
    cls: "full_light",
    guide: [
      { text: "SPURT", time: 2, type: "push" },
      { text: "STOP", time: 2, type: "stop" },
      { text: "SPURT", time: 2, type: "push" },
      { text: "STOP", time: 2, type: "stop" },
      { text: "SPURT", time: 2, type: "push" }
    ]
  },
  {
    label: "Walking Leak",
    flow: "<b>Gait Release:</b> Take 5 steps. With every step, push out a small spurt.",
    cls: "full_light",
    guide: [
      { text: "STEP & SQUIRT", time: 1.5, type: "push" },
      { text: "HOLD", time: 1, type: "stop" },
      { text: "STEP & SQUIRT", time: 1.5, type: "push" },
      { text: "HOLD", time: 1, type: "stop" },
      { text: "STEP & SQUIRT", time: 1.5, type: "push" }
    ]
  },
  {
    label: "Failed Hold",
    flow: "<b>Brief Failure:</b> Release a strong stream for 5 seconds. Clamp down. Wait 2s. Release for 5s more.",
    cls: "full_light",
    guide: [
      { text: "GUSH", time: 5, type: "push" },
      { text: "CLAMP SHUT", time: 2, type: "stop" },
      { text: "GUSH", time: 5, type: "push" }
    ]
  },
  {
    label: "The Sprinkler",
    flow: "<b>Staccato:</b> Rapid fire spurts. Push-Relax-Push-Relax for 10 seconds.",
    cls: "full_light",
    guide: [
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" }
    ]
  },

  // MEDIUM INTENSITY
  {
    label: "Daydream",
    flow: "<b>Zoned Out:</b> Release a continuous stream for 8 seconds.",
    cls: "full_moderate",
    guide: [{ text: "STEADY STREAM", time: 8, type: "relax" }]
  },
  {
    label: "The Squat",
    flow: "<b>Pressure Test:</b> Squat down. Empty bladder halfway (Count to 10). Stand up.",
    cls: "full_moderate",
    guide: [
      { text: "SQUAT DOWN", time: 3, type: "stop" },
      { text: "RELEASE HALF", time: 10, type: "relax" },
      { text: "STAND UP", time: 3, type: "stop" }
    ]
  },
  { label: "Lazy Release", flow: "<b>Slow Flow:</b> Lean back. Let a slow stream flow for a count of 20.", cls: "full_moderate", guide: [{ text: "SLOW DRIBBLE", time: 20, type: "relax" }] },
  { label: "Capacity Check", flow: "<b>Measured Release:</b> Strong stream for exactly 15 seconds.", cls: "full_moderate", guide: [{ text: "STRONG STREAM", time: 15, type: "push" }] },

  // HIGH INTENSITY
  { label: "Total Failure", flow: "<b>Total Letting Go:</b> Do not push. Just relax and empty completely.", cls: "full_heavy", guide: [{ text: "FLOOD", time: 25, type: "relax" }] },
  { label: "The Gush", flow: "<b>Forced Evacuation:</b> Push hard. Empty as fast as possible.", cls: "full_total", guide: [{ text: "FORCE IT OUT", time: 15, type: "push" }] },
  { label: "Submission", flow: "<b>No Control:</b> Release until 100% empty.", cls: "full_total", guide: [{ text: "EMPTY FULLY", time: 30, type: "relax" }] }
];

function fullTable(roll) {

  const profile = profileMode;

  const appended = (appendedEventsByProfile?.[profile] || []).filter(e => (e.type || 'full') !== 'micro' && Array.isArray(e.guide));
  if (appended.length && Math.random() < 0.35) {
    const e = pick(appended);
    return {
      kind: 'full',
      desc: e.flow || e.desc || `${e.label || 'Custom Full'} event`,
      guide: e.guide,
      partial: !!e.partial,
      tmin: customProfileRuntime?.mainMin || 30,
      tmax: customProfileRuntime?.mainMax || 90
    };
  }

  if (customProfileRuntime?.customFullEvents?.length && customProfileRuntime.baseProfile === profileMode) {
    const e = pick(customProfileRuntime.customFullEvents);
    return {
      kind: 'full',
      desc: e.flow || e.desc || `${e.label || 'Custom Full'} event`,
      guide: e.guide,
      partial: !!e.partial,
      tmin: customProfileRuntime.mainMin || 30,
      tmax: customProfileRuntime.mainMax || 90
    };
  }

  // --- 1. CHAOS MODE (The Super List) ---
  if (profileMode === 'chaos_manual') {
      // Merge all existing tables
      const chaosList = [
        ...filterEnabledCatalog('chaos_manual', 'FULL_D20', FULL_D20).map(x => x.e),
        ...filterEnabledCatalog('chaos_manual', 'FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES).map(x => x.e),
        ...filterEnabledCatalog('chaos_manual', 'MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20).map(x => x.e)
      ];
      
      const s = pick(chaosList);
      
      // Normalize the data (some tables use different keys)
      return {
          kind: 'full',
          desc: s.flow || s.desc, // Handle different naming conventions
          guide: s.guide,
          partial: s.partial || false, // Preserve partial logic
          tmin: 0, tmax: 0
      };
  }

  if (profileMode === 'dependent') {
    const pickMeta = pick(filterEnabledCatalog('dependent', 'MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20));
    const e = pickMeta.e;
    return {
      kind: 'full',
      desc: e.flow,
      guide: e.guide
    };
  }
  if (profileMode === 'matron_ward') {
    // Force D20 check for Matron Ward
    const idx = randInt(0, MACRO_WARD_D20.length - 1);
    const e = MACRO_WARD_D20[idx];
    return {
      kind: 'full',
      desc: e.flow,
      guide: e.guide,
      tmin: 30, // Tighter windows for Ward mode
      tmax: 60
    };
  }
  // 3. Table Selection
  // If Training Mode, force a "Failure" event logic
  if (profileMode.startsWith('train_')) {
    const fail = pick(filterEnabledCatalog(profileMode, 'FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES)).e;
    let tmin = 45, tmax = 90; // Default values
    
    if (profileMode === 'train_rookie') {
      tmin = rookieVoidMin;
      tmax = rookieVoidMax;
    } else if (profileMode === 'train_pro') {
      tmin = proVoidMin;
      tmax = proVoidMax;
    }
    
    return {
      kind: 'full',
      desc: `<b>GAVE UP:</b> ${fail.flow}`, // Context: You forced it
      guide: fail.guide,
      tmin: tmin, tmax: tmax
    };
  }
  // 3. Standard NPT/Early Logic (and other profiles)
  const fullEnabled = filterEnabledCatalog(profileMode, 'FULL_D20', FULL_D20);
  const idx = Math.floor(((roll - 1) / 20) * fullEnabled.length);
  const b = fullEnabled[clamp(idx, 0, fullEnabled.length - 1)].e;

  let tmin, tmax;
  
  // Use profile-specific timing if available
  if (profileMode === 'npt') {
    // For NPT, use custom void window
    const nptRange = nptVoidMax - nptVoidMin;
    if (idx <= 3) { tmin = nptVoidMin; tmax = nptVoidMin + Math.ceil(nptRange * 0.2); }
    else if (idx <= 7) { tmin = nptVoidMin + Math.ceil(nptRange * 0.2); tmax = nptVoidMin + Math.ceil(nptRange * 0.6); }
    else { tmin = nptVoidMin + Math.ceil(nptRange * 0.6); tmax = nptVoidMax; }
  } else {
    // Default timing for other profiles
    if (idx <= 3) { tmin = 15; tmax = 30; }
    else if (idx <= 7) { tmin = 30; tmax = 60; }
    else { tmin = 60; tmax = 90; }
  }

  return {
    kind: 'full',
    desc: b.flow,
    guide: b.guide,
    tmin,
    tmax
  };
}

const RESTROOM_DISPATCH = [
  { text: "GO TO THE RESTROOM", time: 0, type: "stop" }
];

/* NEW: MOVEMENT CHALLENGES (15% chance to replace a full event) */
const MOVEMENT_CHALLENGES = [
  { label: "Check Challenge", desc: "Stand up immediately and stretch your arms overhead. If you leak, log it." },
  { label: "Check Challenge", desc: "Sit down forcefully (bounce) on your chair." },
  { label: "Check Challenge", desc: "Press your hand firmly against your protection. Check for pushback." },
  { label: "Check Challenge", desc: "Do 5 squats immediately." }
];

function rollMicroForMode() {
  // Now rolls against the full length of the training table
  if (profileMode.startsWith('train_')) return randInt(1, MICRO_TRAINING_D8.length);
  return (profileMode === 'npt') ? randInt(1, 8) : d(6);
}
function rollFullForMode() { return d(20); }

/* ---------- Preroll ---------- */
function prerollEvent(kind) {
  let event, i = 0;
  const maxRetries = 5; // Failsafe to prevent infinite loops

  if (kind === 'micro') {
    do {
      event = microTableForMode(rollMicroForMode());
      i++;
    } while (i < maxRetries && lastMicroEvent && event.desc === lastMicroEvent.desc);
    lastMicroEvent = event;
  } else { // 'full'
    do {
      event = fullTable(rollFullForMode());
      i++;
    } while (i < maxRetries && lastMacroEvent && event.desc === lastMacroEvent.desc);
    lastMacroEvent = event;
  }
  return event;
}

/* ---------- Scheduling (Integrated with Manual Pressure) ---------- */
function rescheduleMainEventForUrgency() {
  clearTimeout(mainTimer); clearTimeout(preChimeTimer);
  // Force event in 2-5 minutes
  scheduleMainEvent({ min: 2, max: 5 });
}

function scheduleMainEvent(windowOverride) {

  if (profileMode === 'chaos_manual') {
      clearTimeout(mainTimer);
      clearTimeout(preChimeTimer);
      
      const lbl = $('countdown');
      if (lbl) lbl.innerHTML = `<span style="color:#fab1a0">WAITING FOR MANUAL TRIGGER...</span>`;
      
      // LOG THE RULES (Only if not already visible/logged recently)
      // We log this to ensure the user knows the protocol.
      logToOutput(`<div style="border:1px solid #fab1a0; padding:10px; border-radius:8px; background:#1b2030; margin-bottom:10px;">
        <strong style="color:#fab1a0; font-size:1.1em;">🔥 CHAOS MODE PROTOCOL</strong>
        <ul style="margin:5px 0 0 15px; padding:0; color:#ccc; font-size:0.9em; list-style-type:square;">
            <li><b>Hydration:</b> Follow all drink orders strictly.</li>
            <li><b>The Trigger:</b> You must click <b style="color:#ff6b6b">"Force Release"</b> the moment you feel the <u>very first</u> physical urge to pee.</li>
            <li><b>The Gamble:</b> Triggers pull from ALL tables (Micro, Macro, Dependent). You might just leak, or you might flood.</li>
        </ul>
      </div>`);
      
      return; // Stop. No automated timer.
  }

  // 1. DEPENDENT MODE CHECK (Existing Logic - Preserved)
  if (profileMode === 'dependent') {
    scheduleDependentEvent();
    return;
  }

  const runtime = customProfileRuntime;
  //babysitter
  if (profileMode === 'babysitter') {
    let min = windowOverride?.min ?? runtime?.mainMin ?? depSpasmMin ?? 40;
    let max = windowOverride?.max ?? runtime?.mainMax ?? depSpasmMax ?? 60;
    
    // Apply streak bonus: for every 3 successful holds, reduce timer by 5%
    const streakBonus = Math.floor(babysitterDryStreak / 3) * 5; // 5% reduction per 3 streak
    if (streakBonus > 0) {
      min = Math.ceil(min * (1 - streakBonus / 100));
      max = Math.ceil(max * (1 - streakBonus / 100));
      logToOutput(`<span style="color:#2ecc71;">⭐ Streak Bonus! Timers reduced by ${streakBonus}%</span>`);
    }
    
    const minutes = randInt(min, max);
    mainEndAt = Date.now() + (minutes * 60000);

    // Base micro count comes from babysitter setup modal, then continence/symptoms modify it.
    const baseMin = Number.isFinite(depQueueMin) ? depQueueMin : 0;
    const baseMax = Number.isFinite(depQueueMax) ? depQueueMax : 2;
    const continenceMicroMod = {
      fully_continent: [0, 0],
      mostly_continent: [0, 1],
      somewhat_incontinent: [1, 1],
      mostly_incontinent: [1, 2],
      fully_incontinent: [2, 3]
    };
    const [modMin, modMax] = continenceMicroMod[currentContinenceLevel] || [0, 1];
    let microMin = baseMin + modMin;
    let microMax = baseMax + modMax;
    if (hasSymptom('overactive_bladder')) {
      microMin += 1;
      microMax += 1;
    }
    if (hasSymptom('stress_incontinence')) {
      microMax += 1;
    }
    if (hasSymptom('nocturnal_wetter')) {
      microMax += 1;
    }
    if (hasSymptom('giggle_incontinence')) {
      microMax += 1;
    }

    microMin = clamp(microMin, 0, 8);
    microMax = clamp(Math.max(microMin, microMax), 0, 10);
    const numMicros = Number.isFinite(runtime?.microsPerCycle)
      ? clamp(runtime.microsPerCycle, 0, 10)
      : randInt(microMin, microMax);
    // Cancel any leftover micro timers from previous cycles
    babysitterMicroTimerIds.forEach(id => clearTimeout(id));
    babysitterMicroTimerIds = [];
    for (let i = 0; i < numMicros; i++) {
      const microDelay = randInt(5, Math.ceil(minutes / 2)); // Early in cycle
      // Space micros at least 3 minutes apart to avoid stacking
      const spacedDelay = microDelay + (i * 3);
      const id = setTimeout(() => {
        if (sessionRunning && profileMode === 'babysitter') triggerBabysitterMicro('micro');
      }, spacedDelay * 60000);
      babysitterMicroTimerIds.push(id);
    }

    // Overactive symptom adds a mid-cycle pressure check with spasm risk even at moderate pressure.
    if (hasSymptom('overactive_bladder')) {
      const checkDelay = randInt(Math.ceil(minutes / 3), Math.ceil((2 * minutes) / 3));
      setTimeout(() => {
        if (!sessionRunning || profileMode !== 'babysitter') return;
        maybeRunOveractiveUrgencyCheck();
      }, checkDelay * 60000);
    }
    
    // 30% chance to include hydration reminder in this cycle (no auto pressure change)
    let hydrationChance = 0.3;
    if (hasCurse('hydration_debt')) hydrationChance = 0.55;
    if (Math.random() < hydrationChance) {
      const hydroDelay = randInt(Math.ceil(minutes / 3), Math.ceil(2 * minutes / 3));
      setTimeout(() => {
        if (sessionRunning && profileMode === 'babysitter') {
          const sips = randInt(depSipMin, depSipMax);
          logToOutput(`<span style="color:#81ecec;">💧 <b>Babysitter says:</b> "Time for ${sips} sip${sips > 1 ? 's' : ''} of water!" Update your pressure slider after drinking.</span>`);
        }
      }, hydroDelay * 60000);
    }

    logToOutput(`<span class="muted">⏳ <b>Babysitter Reminder:</b> Next potty check in ~${minutes}m. Stay dry!</span>`);
    mainTimer = setTimeout(() => {
      if (!sessionRunning || profileMode !== 'babysitter') return;
      triggerBabysitterMacro();
    }, minutes * 60000);
    return;
  }

  // 2. Determine Base Windows
  let min = runtime?.mainMin ?? 30;
  let max = runtime?.mainMax ?? 90;

  if (windowOverride && windowOverride.min && windowOverride.max) {
    // Manual override passed by arguments
    min = windowOverride.min;
    max = windowOverride.max;
  }
  // --- NEW BIO-ADAPTIVE LOGIC ---
  else if (profileMode === 'bio_custom' && window.playerBio && window.playerBio.active) {
    // Use the calculated "Virtual Max Time"
    const base = window.playerBio.virtualMaxTime;
    min = Math.floor(base * 0.8);
    max = Math.floor(base * 1.2);
    logToOutput(`<span class="muted">🧬 <b>Bio-Adaptive:</b> Targeting ${window.playerBio.virtualCapacity}ml (Approx ${base.toFixed(0)}m).</span>`);
  }
  // --- EXISTING PROFILE LOGIC ---
  else if (profileMode.startsWith('train_')) {
    min = 25;
    max = 50;
  }

  // 3. PRESSURE OVERRIDE (Urgency Multiplier - Preserved)
  // This ensures high manual slider values still accelerate the timer
  let urgencyMultiplier = 1.0;
  if (manualPressure >= 90) urgencyMultiplier = 0.2;      // Very fast
  else if (manualPressure >= 75) urgencyMultiplier = 0.4; // Fast
  else if (manualPressure >= 50) urgencyMultiplier = 0.7; // Moderate

  const accel = runtime?.pressureAcceleration ?? 1;
  urgencyMultiplier = clamp(urgencyMultiplier / Math.max(0.1, accel), 0.1, 2.5);

  min = Math.max(5, Math.floor(min * urgencyMultiplier));
  max = Math.max(10, Math.floor(max * urgencyMultiplier));

  // 4. Prepare Micro Cycle (Preserved)
  targetMicrosPerMain = Number.isFinite(runtime?.microsPerCycle)
    ? clamp(runtime.microsPerCycle, 0, 10)
    : 2 + Math.floor(Math.random() * 3);
  microCountThisMain = 0;

  // 5. Pre-roll the next event (Preserved)
  pendingMainEvent = prerollEvent('full');

  // 6. Set Timers (Preserved)
  const minutes = randInt(min, max);
  const ms = minutes * 60000;

  clearTimeout(mainTimer);
  clearTimeout(preChimeTimer);

  mainEndAt = Date.now() + ms;

  if (runtime?.preChime !== false) {
    preChimeTimer = setTimeout(startChime, Math.max(0, ms - 15000));
  }
  mainTimer = setTimeout(alarmMain, ms);

  // 7. Micro Logic (Preserved)
  microPauseUntilTs = Date.now() + 10 * 60000;

  scheduleNextMicro();
  setCountdownLabel();
  saveState();
}


// New trigger functions
function triggerBabysitterMicro(forceType = 'micro') {
  if (!sessionRunning || profileMode !== 'babysitter') return;
  // Don't queue a new micro if a guide is already showing — prevents stacking
  if ($('voidOverlay')?.style.display === 'flex') return;
  const table = getMicroTableForContinence();
  const enabled = filterEnabledCatalog('babysitter', 'MICRO_BABYSITTER_D20', table);
  let micro = pick(enabled).e;
  const leakType = forceType === 'spasm' ? 'spasm' : 'micro';

  // Symptom-targeted override: if you have a symptom, 40% chance to swap in a matching event
  if (Math.random() < 0.4) {
    const symptomEvents = [];
    const enabledOnly = enabled.map(x => x.e);
    if (hasSymptom('giggle_incontinence')) symptomEvents.push(...enabledOnly.filter(e => /laugh|giggle/i.test(e.label || e.desc)));
    if (hasSymptom('stress_incontinence')) symptomEvents.push(...enabledOnly.filter(e => /cough|sneeze|stand|move|wiggle/i.test(e.label || e.desc)));
    if (hasSymptom('nocturnal_wetter')) symptomEvents.push(...enabledOnly.filter(e => /relax|lullaby|soft|doze/i.test(e.label || e.desc)));
    if (symptomEvents.length > 0) {
      micro = symptomEvents[randInt(0, symptomEvents.length - 1)];
    }
  }

  const payload = createBabysitterLeakPayload(leakType, micro.label || micro.desc);

  logToOutput(`<span style="color:#fdcb6e">⚠️ <b>Babysitter Spasm:</b> ${micro.desc}</span>`);
  startVoidGuide(micro.guide, `👩‍🍼 <b>Spasm:</b> ${micro.desc}`, 'micro');
  emitBabysitterEvent('leak', { payload });
}

function getTransitionTable(oldLevel, newLevel) {
  // Downgrades (more protection needed)
  if (oldLevel === 'pad' && newLevel === 'pullups') return TRANSITION_PAD_TO_PULLUPS_D6;
  if (oldLevel === 'pullups' && newLevel === 'diapers') return TRANSITION_PULLUPS_TO_DIAPERS_D6;
  if (oldLevel === 'diapers' && newLevel === 'thick_diapers') return TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6;
  
  // Upgrades (less protection needed)
  if (oldLevel === 'thick_diapers' && newLevel === 'diapers') return TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6;
  if (oldLevel === 'diapers' && newLevel === 'pullups') return TRANSITION_DIAPERS_TO_PULLUPS_D6;
  if (oldLevel === 'pullups' && newLevel === 'pad') return TRANSITION_PULLUPS_TO_PAD_D6;
  
  return null;
}

function triggerTransitionEvent(oldLevel, newLevel) {
  const table = getTransitionTable(oldLevel, newLevel);
  if (!table) return;

  const sourceMap = {
    'pad->pullups': 'TRANSITION_PAD_TO_PULLUPS_D6',
    'pullups->diapers': 'TRANSITION_PULLUPS_TO_DIAPERS_D6',
    'diapers->thick_diapers': 'TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6',
    'thick_diapers->diapers': 'TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6',
    'diapers->pullups': 'TRANSITION_DIAPERS_TO_PULLUPS_D6',
    'pullups->pad': 'TRANSITION_PULLUPS_TO_PAD_D6'
  };
  const source = sourceMap[`${oldLevel}->${newLevel}`] || 'TRANSITION_GENERIC';
  const event = pick(filterEnabledCatalog('babysitter', source, table)).e;

  startChime(880);
  acknowledgeAlarm();

  // Encode guide for the onclick handler
  const guideStr = JSON.stringify(event.guide).replace(/"/g, '&quot;');
  const safeLabel = (event.label || 'Change').replace(/['"]/g, '');
  const safeDesc = (event.desc || '').replace(/['"]/g, '\u2019');
  const isDowngrade = ['pad', 'pullups', 'diapers', 'thick_diapers'].indexOf(newLevel) >
                      ['pad', 'pullups', 'diapers', 'thick_diapers'].indexOf(oldLevel);
  const changeColor = isDowngrade ? '#ff7675' : '#55efc4';
  const changeIcon = isDowngrade ? '👇' : '👆';

  logToOutput(`<div style="border:2px solid ${changeColor}; background:#1b2030; padding:12px; border-radius:8px; margin:10px 0;">
    <b style="color:${changeColor};">👗 PROTECTION CHANGE ${changeIcon}</b>
    <span style="color:#888; font-size:0.85em;"> — Babysitter says:</span><br>
    <span style="color:#cdd7e6; font-size:0.9em; display:block; margin:6px 0;">${event.desc}</span>
    <span style="color:#fdcb6e; font-size:0.82em; display:block; margin-bottom:8px;">
      ⚠️ Step away and get your new protection ready. Tap <b>Next</b> when you're back and ready to change.
    </span>
    <button class="pill" style="background:${changeColor}; color:#000; border:none; cursor:pointer; font-weight:bold;"
      onclick="this.disabled=true; this.textContent='Starting…'; startVoidGuide(${guideStr}, '👗 <b>${safeLabel}:</b> ${safeDesc}', 'full'); setTimeout(()=>updateBabysitterUI(), 3000);">
      🔄 Next — Start Change Guide
    </button>
  </div>`);
}

/* --- BABYSITTER POTTY CHANCE (based on continence level, modified by state) --- */
function getBabysitterPottyChance() {
  // Base chance driven by CONTINENCE level (decoupled from protection)
  const continenceChances = {
    'fully_continent': 90,          // Very high control
    'mostly_continent': 75,         // Good control, occasional issues
    'somewhat_incontinent': 55,     // Noticeable control problems
    'mostly_incontinent': 30,       // Poor control
    'fully_incontinent': 10         // Almost no control
  };
  let chance = continenceChances[currentContinenceLevel] || 60;
  
  // Protection level gives slight modifier (heavier = babysitter expects less)
  const protMod = { 'pad': 5, 'pullups': 0, 'diapers': -5, 'thick_diapers': -10 };
  chance += (protMod[currentProtectionLevel] || 0);
  
  // Pressure penalty: higher pressure = harder to make it
  if (manualPressure > 80) chance -= 20;
  else if (manualPressure > 60) chance -= 10;
  
  // Saturation penalty: if already wet, babysitter is less likely to send you
  if (manualSaturation > 50) chance -= 10;

  if (hasSymptom('urge_incontinence')) chance -= (manualPressure > 70 ? 20 : 10);
  if (hasCurse('strict_sitter')) chance -= 10;
  
  // Streak bonus: good track record helps
  if (babysitterDryStreak >= 3) chance += 5;
  if (babysitterDryStreak >= 5) chance += 5;
  
  return Math.max(5, Math.min(95, chance));
}

function getPottyPassInterventionChance() {
  const levelBase = {
    pad: 40,
    pullups: 50,
    diapers: 60,
    thick_diapers: 75
  };
  let chance = levelBase[currentProtectionLevel] || 50;
  if (currentContinenceLevel === 'fully_continent') chance -= 10;
  if (currentContinenceLevel === 'mostly_incontinent') chance += 10;
  if (currentContinenceLevel === 'fully_incontinent') chance += 15;
  if (hasCurse('strict_sitter')) chance -= 10;
  return clamp(chance, 20, 90);
}

function consumePottyPass(reason) {
  if (pottyPasses <= 0) return false;
  pottyPasses = Math.max(0, pottyPasses - 1);
  updateBabysitterUI();
  logToOutput(`<span style="color:#81ecec;">🎟️ <b>Potty Pass Used:</b> ${reason}. Passes left: ${pottyPasses}</span>`);
  return true;
}

function triggerBabysitterMacro() {
  if (!sessionRunning || profileMode !== 'babysitter') return;
  babysitterTotalCycles++;

  // --- NOT POTTY TRAINED MODE: Mostly/Fully Incontinent skip potty cycles entirely ---
  const isNPTActive = babysitterNPTMode &&
    (currentContinenceLevel === 'mostly_incontinent' || currentContinenceLevel === 'fully_incontinent');

  if (isNPTActive) {
    const nptTable = currentContinenceLevel === 'fully_incontinent'
      ? MACRO_NPT_FULLY_INCONTINENT_D10
      : MACRO_NPT_MOSTLY_INCONTINENT_D10;
    const event = pick(nptTable);

    showBanner("👩‍🍼 <b>Auto-Void:</b>", event.flow, 'heavy');
    startChime(660);

    logToOutput(`<div style="border:1px solid #a29bfe; padding:8px; border-radius:5px; margin-top:5px; background:#1b1429;">
      <span style="color:#a29bfe; font-weight:bold;">💧 AUTO-VOID</span> <span style="color:#888; font-size:0.8em;">(Not Potty Trained — ${currentContinenceLevel.replace(/_/g,' ')})</span><br>
      <span style="font-size:0.9em; color:#ccc;">${event.flow}</span>
    </div>`);

    const payload = createBabysitterLeakPayload('accident_full', event.label);
    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(event.guide, `👩‍🍼 <b>Auto-Void:</b> ${event.flow}`, 'full_heavy');
      emitBabysitterEvent('leak', { payload });
      babysitterFailureCount++;
      babysitterDryStreak = 0;
      protectionFailures++;
      protectionSuccesses = 0;
      trackDayEvent('accident');

      const checkDelay = randInt(2, 4) * 60000;
      setTimeout(() => {
        if (sessionRunning && profileMode === 'babysitter') {
          triggerBabysitterAccidentCheck(false);
        }
      }, checkDelay);
    }, 2000);

    scheduleMainEvent();
    return;
  }

  // --- NORMAL MODE: Potty permission / accident roll ---
  const pottyChance = getBabysitterPottyChance();
  const roll = Math.random() * 100;
  const passChance = getPottyPassInterventionChance();
  const canUsePass = pottyPasses > 0 && !hasCurse('no_free_passes');
  const passRoll = Math.random() * 100;

  const deniedButSavedByPass = roll >= pottyChance && canUsePass && passRoll < passChance;

  if (roll < pottyChance || deniedButSavedByPass) {
    if (deniedButSavedByPass) {
      consumePottyPass('Babysitter lets you make a controlled hold break');
    }

    // --- POTTY PERMISSION GRANTED ---
    const event = pick(filterEnabledCatalog('babysitter', 'BABYSITTER_POTTY_PERMISSION_D10', BABYSITTER_POTTY_PERMISSION_D10)).e;
    
    showBanner("👩‍🍼 <b>Babysitter says:</b>", event.flow, 'moderate');
    startChime(880);
    
    logToOutput(`<div style="border:1px solid #55efc4; padding:8px; border-radius:5px; margin-top:5px;">
      <span style="color:#55efc4; font-weight:bold;">🚽 POTTY PERMISSION</span> <span style="color:#888; font-size:0.8em;">(${pottyChance}% chance${deniedButSavedByPass ? ' + potty pass save' : ''})</span><br>
      <span style="font-size:0.9em; color:#ccc;">${event.flow}</span><br><br>
      <b style="color:#fff; background:#55efc4; color:#000; padding:2px 6px; border-radius:4px;">ACTION: Go to restroom & come back for check.</b>
    </div>`);

    if (hasSymptom('pre_void_dribble') && Math.random() < 0.4) {
      const dribblePayload = createBabysitterLeakPayload('dribble', 'Pre-Void Dribble');
      emitBabysitterEvent('leak', { payload: dribblePayload });
      logToOutput(`<span style="color:#fdcb6e;">💧 <b>Pre-void dribble:</b> A small leak started before you reached the potty. Update your sliders.</span>`);
    }

    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(event.guide, `👩‍🍼 <b>Potty Time:</b> ${event.flow}`, 'full_light');
      
      // Schedule babysitter check 2-3 min after potty trip
      const checkDelay = randInt(2, 3) * 60000;
      setTimeout(() => {
        if (sessionRunning && profileMode === 'babysitter') {
          triggerBabysitterPottyCheck();
        }
      }, checkDelay);
    }, 2000);
    
  } else {
    // --- ACCIDENT: pick continence-appropriate table ---
    const accidentTable = (() => {
      if (currentContinenceLevel === 'mostly_incontinent') return BABYSITTER_ACCIDENT_MOSTLY_D10;
      if (currentContinenceLevel === 'somewhat_incontinent') return BABYSITTER_ACCIDENT_SOMEWHAT_D10;
      return BABYSITTER_ACCIDENT_D10;
    })();
    const tableKey = currentContinenceLevel === 'mostly_incontinent' ? 'BABYSITTER_ACCIDENT_MOSTLY_D10'
      : currentContinenceLevel === 'somewhat_incontinent' ? 'BABYSITTER_ACCIDENT_SOMEWHAT_D10'
      : 'BABYSITTER_ACCIDENT_D10';
    const event = pick(filterEnabledCatalog('babysitter', tableKey, accidentTable)).e;
    const accidentType = event.partial ? 'accident_partial' : 'accident_full';
    const payload = createBabysitterLeakPayload(accidentType, event.label || event.flow);
    const accidentMeta = classifyBabysitterAccident(event, payload, pottyChance);
    lastBabysitterAccidentMeta = accidentMeta;
    
    showBanner("👩‍🍼 <b>Babysitter Accident!</b>", event.flow, 'moderate');
    startChime(880);
    
    logToOutput(`<div style="border:1px solid #ff7675; padding:8px; border-radius:5px; margin-top:5px;">
      <span style="color:#ff7675; font-weight:bold;">💦 ACCIDENT${event.partial ? ' (PARTIAL)' : ''}</span> <span style="color:#888; font-size:0.8em;">(${pottyChance}% potty chance - failed)</span><br>
      <span style="font-size:0.9em; color:#ccc;">${event.flow}</span><br><br>
      <span style="font-size:0.85em; color:#ffd3d3;">Type: <b>${accidentMeta.type}</b> | Trigger: ${accidentMeta.trigger} | Severity: ${accidentMeta.severity}</span><br>
      <span style="font-size:0.82em; color:#ffb3b3;">Urgency at trigger: <b>${accidentMeta.pressureBand}</b> (${getUrgencyLevel(manualPressure)}/10).</span>
    </div>`);

    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(event.guide, `👩‍🍼 <b>Accident:</b> ${event.flow}`, 'full_heavy');
      emitBabysitterEvent('leak', { payload });
      
      // Schedule babysitter accident check 2-3 min after
      const checkDelay = randInt(2, 3) * 60000;
      setTimeout(() => {
        if (sessionRunning && profileMode === 'babysitter') {
          triggerBabysitterAccidentCheck(event.partial);
        }
      }, checkDelay);
    }, 2000);
  }

  if (babysitterDryStreak > 0 && babysitterDryStreak % 3 === 0) {
    maybeAwardPottyPass('dry_streak');
  }

  scheduleMainEvent(); // Next cycle
}

/* --- BABYSITTER POTTY CHECK (after successful potty trip) --- */
function triggerBabysitterPottyCheck() {
  if (!sessionRunning || profileMode !== 'babysitter') return;
  // Babysitter checks your protection while you're back from potty
  // Opens bio-check modal so user reports actual state
  
  logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #a29bfe;">
    <b style="color:#a29bfe;">👩‍🍼 Babysitter Check:</b> "Welcome back! Let me check your protection before you sit down..."<br>
    <span style="color:#cdd7e6; font-size:0.9em;">Update your sliders to match your current state.</span>
  </div>`);
  
  // Open the bio-check modal with a babysitter-specific callback
  openStatusModal(function() {
    // After user confirms their state, babysitter reacts
    let sat = manualSaturation;

    // Pre-void dribble is handled on potty-permission events before dispatch.
    
    babysitterDryStreak++;
    
    if (sat < 15) {
      // Completely dry - great job!
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #2ecc71;">
        <b style="color:#2ecc71;">✅ Babysitter:</b> "Completely dry! What a good job! I'm so proud of you!"<br>
        <span style="color:#cdd7e6; font-size:0.9em;">Streak: <b>${babysitterDryStreak}</b> | Total: <b>${babysitterTotalCycles}</b></span>
      </div>`);
      
      // Track success for progression
      protectionSuccesses++;
      protectionFailures = 0;
      trackDayEvent('potty_success');
      trackDayEvent('streak_update', { streak: babysitterDryStreak });
      checkBabysitterProgression('success');
      maybeAwardPottyPass('good_check');
      
    } else if (sat < 40) {
      // Some dribbles but made it to potty - forgive but note
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #fdcb6e;">
        <b style="color:#fdcb6e;">💧 Babysitter:</b> "Hmm, a little damp but you made it to the potty—that's what counts! Good effort."<br>
        <span style="color:#cdd7e6; font-size:0.9em;">Dribbles noted but forgiven. Streak: <b>${babysitterDryStreak}</b></span>
      </div>`);
      
      // Dribbles forgiven - still counts as a success, just slower progression
      protectionSuccesses++;
      protectionFailures = 0;
      trackDayEvent('potty_success');
      trackDayEvent('streak_update', { streak: babysitterDryStreak });
      checkBabysitterProgression('success');
      maybeAwardPottyPass('good_check');
      
    } else if (sat < 65) {
      // Noticeably wet - babysitter is concerned
      babysitterDryStreak = 0;
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #fab1a0;">
        <b style="color:#fab1a0;">😟 Babysitter:</b> "Oh sweetie, you're quite wet. You did make it to the potty, but these leaks are adding up..."<br>
        <span style="color:#cdd7e6; font-size:0.9em;">No progression change—watching you more closely now.</span>
      </div>`);
      
      // Neutral - doesn't count toward success or failure progression
      
    } else {
      // Very wet - babysitter wants a change
      babysitterDryStreak = 0;
      babysitterFailureCount++;
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #ff7675;">
        <b style="color:#ff7675;">😰 Babysitter:</b> "Oh no, you're really soaked. You made it to the potty but your protection is saturated. We might need something more absorbent..."<br>
        <span style="color:#cdd7e6; font-size:0.9em;">Failures: <b>${babysitterFailureCount}</b> | Consider a protection change.</span>
      </div>`);
      
      // High saturation despite potty success - indicates need for heavier protection
      protectionFailures++;
      protectionSuccesses = 0;
      checkBabysitterProgression('high_saturation');
      maybeAwardPottyPass('heavy_protection');
    }
    
    updateBabysitterUI();
    
    // Streak milestones
    if (babysitterDryStreak > 0 && babysitterDryStreak % 5 === 0) {
      logToOutput(`<span style="color:#81ecec;">🌟 <b>${babysitterDryStreak} Dry Streak!</b> Babysitter gives you a gold star!</span>`);
    }
  });
}

/* --- BABYSITTER ACCIDENT CHECK (after an accident happens) --- */
function triggerBabysitterAccidentCheck(wasPartial) {
  if (!sessionRunning || profileMode !== 'babysitter') return;
  // Accident happened - babysitter needs to check you and react
  
  const checkMsg = wasPartial 
    ? "Babysitter noticed something: 'Come here, let me check you... Did you have a little accident?'"
    : "Babysitter heard it all: 'Oh sweetie... let me see how bad it is. Don't move.'";
  
  logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #ff7675;">
    <b style="color:#ff7675;">👩‍🍼 Babysitter Inspection:</b> ${checkMsg}<br>
    <span style="color:#cdd7e6; font-size:0.9em;">Update your sliders to match the leak instructions, then confirm status for babysitter reaction.</span>
    ${lastBabysitterAccidentMeta ? `<br><span style="color:#ffb3b3; font-size:0.85em;">Accident analysis: <b>${lastBabysitterAccidentMeta.type}</b> (${lastBabysitterAccidentMeta.severity}) from ${lastBabysitterAccidentMeta.trigger}.</span>` : ''}
  </div>`);
  
  openStatusModal(function() {
    const sat = manualSaturation;
    
    babysitterFailureCount++;
    babysitterDryStreak = 0;
    protectionFailures++;
    protectionSuccesses = 0;
    
    if (wasPartial && sat < 40) {
      // Partial accident, not too bad
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #fab1a0;">
        <b style="color:#fab1a0;">😕 Babysitter:</b> "Just a little accident—not too bad. Let's keep going, but try harder next time okay?"<br>
        <span style="color:#cdd7e6; font-size:0.9em;">Failures: <b>${babysitterFailureCount}</b> | Watching closely...</span>
      </div>`);
      
      // Partial + low sat: count failure but don't force transition yet
      trackDayEvent('partial_accident');
      checkBabysitterProgression('partial_accident');
      
    } else if (sat < 65) {
      // Moderate accident damage
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #ff7675;">
        <b style="color:#ff7675;">😟 Babysitter:</b> "That was a bigger accident than I'd hoped. Your protection is getting wet. We need to talk about whether you need more..."<br>
        <span style="color:#cdd7e6; font-size:0.9em;">Failures: <b>${babysitterFailureCount}</b> | Protection may need upgrading.</span>
      </div>`);
      
      trackDayEvent('accident');
      checkBabysitterProgression('accident');
      
    } else {
      // Heavy/full accident - almost always triggers transition
      logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #d63031;">
        <b style="color:#d63031;">😰 Babysitter:</b> "Oh no, sweetie. That's a big accident. Your ${currentProtectionLevel} can't handle much more. We definitely need to talk about heavier protection."<br>
        <span style="color:#cdd7e6; font-size:0.9em;">Failures: <b>${babysitterFailureCount}</b> | Transition likely.</span>
      </div>`);
      
      trackDayEvent('accident');
      checkBabysitterProgression('major_accident');
    }
    
    updateBabysitterUI();
    if (currentProtectionLevel === 'diapers' || currentProtectionLevel === 'thick_diapers') {
      maybeAwardPottyPass('heavy_protection');
    }

    lastBabysitterAccidentMeta = null;
  });
}

/* --- BABYSITTER PROGRESSION SYSTEM --- */
function checkBabysitterProgression(reason) {
  if (profileMode !== 'babysitter') return;
  if (customProfileRuntime?.progressionEnabled === false) return;

  let levelChanged = false;
  let oldLevel = currentProtectionLevel;
  let newLevel = currentProtectionLevel;
  let skippedLevel = null; // Track if we had to skip a level due to stash
  
  if (reason === 'success') {
    // 3 successes → upgrade to lighter protection
    if (protectionSuccesses >= progressionUpgradeThreshold) {
      const candidate = getNextAvailableProtection('up', currentProtectionLevel);
      if (candidate) {
        newLevel = candidate;
        levelChanged = true;
        // Check if we skipped a level
        const idealIdx = PROTECTION_HIERARCHY.indexOf(currentProtectionLevel) - 1;
        if (idealIdx >= 0 && PROTECTION_HIERARCHY[idealIdx] !== candidate) {
          skippedLevel = PROTECTION_HIERARCHY[idealIdx];
        }
      }
      protectionSuccesses = 0;
    }
  } else if (reason === 'partial_accident') {
    // Partial accident: need 3 partial failures to downgrade (more forgiving)
    if (protectionFailures >= Math.max(progressionDowngradeThreshold + 1, 2)) {
      const candidate = getNextAvailableProtection('down', currentProtectionLevel);
      if (candidate) {
        newLevel = candidate;
        levelChanged = true;
        const idealIdx = PROTECTION_HIERARCHY.indexOf(currentProtectionLevel) + 1;
        if (idealIdx < PROTECTION_HIERARCHY.length && PROTECTION_HIERARCHY[idealIdx] !== candidate) {
          skippedLevel = PROTECTION_HIERARCHY[idealIdx];
        }
      }
      protectionFailures = 0;
    }
  } else if (reason === 'accident' || reason === 'high_saturation') {
    // Regular accident or high saturation at potty: 2 failures to downgrade
    if (protectionFailures >= progressionDowngradeThreshold) {
      const candidate = getNextAvailableProtection('down', currentProtectionLevel);
      if (candidate) {
        newLevel = candidate;
        levelChanged = true;
        const idealIdx = PROTECTION_HIERARCHY.indexOf(currentProtectionLevel) + 1;
        if (idealIdx < PROTECTION_HIERARCHY.length && PROTECTION_HIERARCHY[idealIdx] !== candidate) {
          skippedLevel = PROTECTION_HIERARCHY[idealIdx];
        }
      }
      protectionFailures = 0;
    }
  } else if (reason === 'major_accident') {
    // Major accident (high sat, full void): immediate transition
    const candidate = getNextAvailableProtection('down', currentProtectionLevel);
    if (candidate) {
      newLevel = candidate;
      levelChanged = true;
      const idealIdx = PROTECTION_HIERARCHY.indexOf(currentProtectionLevel) + 1;
      if (idealIdx < PROTECTION_HIERARCHY.length && PROTECTION_HIERARCHY[idealIdx] !== candidate) {
        skippedLevel = PROTECTION_HIERARCHY[idealIdx];
      }
    }
    protectionFailures = 0;
  }
  
  if (levelChanged && oldLevel !== newLevel) {
    // Consume from stash when changing into new protection
    consumeFromStash(newLevel);
    currentProtectionLevel = newLevel;
    localStorage.setItem('currentProtectionLevel', currentProtectionLevel);
    renderStashUI();
    
    const isDowngrade = PROTECTION_HIERARCHY.indexOf(newLevel) > PROTECTION_HIERARCHY.indexOf(oldLevel);
    
    logToOutput(`<div style="background:#1b2030; padding:10px; border-radius:8px; margin:10px 0; border-left:3px solid #9b59b6;">
      <b style="color:#9b59b6;">🔄 PROTECTION CHANGE</b><br>
      <span style="color:#cdd7e6; font-size:0.9em;">
        ${isDowngrade ? 'More protection needed' : 'Earned lighter protection'}: <b>${formatProtectionLevel(oldLevel)}</b> → <b>${formatProtectionLevel(newLevel)}</b>
      </span>
      ${skippedLevel ? `<br><span style="color:#fdcb6e; font-size:0.85em; font-style:italic;">
        ${isDowngrade 
          ? `"Well, since you don't have ${formatProtectionLevel(skippedLevel)}, we're going straight to ${formatProtectionLevel(newLevel)}."` 
          : `"Your mommy only gave me ${formatProtectionLevel(newLevel)}, so you're stuck in those since we don't have ${formatProtectionLevel(skippedLevel)}."`}
      </span>` : ''}
    </div>`);
    
    // Track in day tracker
    trackDayEvent('protection_change', { from: oldLevel, to: newLevel });
    trackDayEvent('change');
    
    // Trigger the immersive transition event
    setTimeout(() => {
      triggerTransitionEvent(oldLevel, newLevel);
    }, 2000);
  }
}

function updateBabysitterUI() {
  if (profileMode !== 'babysitter') return;
  const streakDisplay = $('dryStreakVal');
  const cyclesDisplay = $('totalCyclesVal');
  const failureDisplay = $('failureCountVal');
  const protDisplay = $('protectionLevelVal');
  const successDisplay = $('successCountVal');
  const failProgDisplay = $('failureProgressVal');
  const contDisplay = $('continenceLevelVal');
  const passDisplay = $('pottyPassesVal');
  
  if (streakDisplay) streakDisplay.textContent = babysitterDryStreak;
  if (cyclesDisplay) cyclesDisplay.textContent = babysitterTotalCycles;
  if (failureDisplay) failureDisplay.textContent = babysitterFailureCount;
  if (protDisplay) protDisplay.textContent = formatProtectionLevel(currentProtectionLevel);
  if (successDisplay) successDisplay.textContent = protectionSuccesses;
  if (failProgDisplay) failProgDisplay.textContent = protectionFailures;
  if (contDisplay) contDisplay.textContent = currentContinenceLevel.replace(/_/g, ' ');
  if (passDisplay) passDisplay.textContent = pottyPasses;
  
  // Update stash display
  renderStashUI();
  
  // Update day tracker
  renderDayTracker();
}

function editBabysitterTracking() {
  if (profileMode !== 'babysitter') {
    toast('Only available in babysitter mode');
    return;
  }

  const newProtection = prompt('Current protection (pad, pullups, diapers, thick_diapers):', currentProtectionLevel);
  if (newProtection && PROTECTION_HIERARCHY.includes(newProtection)) {
    currentProtectionLevel = newProtection;
    localStorage.setItem('currentProtectionLevel', currentProtectionLevel);
  }

  const newDry = parseInt(prompt('Dry streak cycles:', babysitterDryStreak), 10);
  if (!Number.isNaN(newDry)) babysitterDryStreak = Math.max(0, newDry);

  const newCycles = parseInt(prompt('Total cycles:', babysitterTotalCycles), 10);
  if (!Number.isNaN(newCycles)) babysitterTotalCycles = Math.max(0, newCycles);

  const newFailures = parseInt(prompt('Failure count:', babysitterFailureCount), 10);
  if (!Number.isNaN(newFailures)) babysitterFailureCount = Math.max(0, newFailures);

  const newSuccessProgress = parseInt(prompt('Success progress toward upgrade (0-3):', protectionSuccesses), 10);
  if (!Number.isNaN(newSuccessProgress)) protectionSuccesses = clamp(newSuccessProgress, 0, 3);

  const newFailureProgress = parseInt(prompt('Failure progress toward downgrade (0-2):', protectionFailures), 10);
  if (!Number.isNaN(newFailureProgress)) protectionFailures = clamp(newFailureProgress, 0, 2);

  const newPasses = parseInt(prompt('Potty passes (0-4):', pottyPasses), 10);
  if (!Number.isNaN(newPasses)) pottyPasses = clamp(newPasses, 0, 4);

  updateBabysitterUI();
  logToOutput(`<span style="color:#a29bfe;">🛠️ <b>Babysitter tracking updated:</b> Manual values applied.</span>`);
}

function triggerBabysitterTestEvent(type) {
  if (profileMode !== 'babysitter' || !sessionRunning) {
    toast('Start a babysitter session first');
    return;
  }

  if (type === 'micro') {
    logToOutput(`<span style="color:#7cc4ff;">🧪 <b>Test Event:</b> Forced babysitter micro.</span>`);
    triggerBabysitterMicro('micro');
    return;
  }

  if (type === 'accident') {
    const event = BABYSITTER_ACCIDENT_D10[randInt(0, BABYSITTER_ACCIDENT_D10.length - 1)];
    const accidentType = event.partial ? 'accident_partial' : 'accident_full';
    const payload = createBabysitterLeakPayload(accidentType, `TEST: ${event.label || event.flow}`);
    lastBabysitterAccidentMeta = classifyBabysitterAccident(event, payload, getBabysitterPottyChance());
    logToOutput(`<span style="color:#ff7675;">🧪 <b>Test Event:</b> Forced babysitter accident.</span>`);
    startVoidGuide(event.guide, `👩‍🍼 <b>Test Accident:</b> ${event.flow}`, 'full_heavy');
    emitBabysitterEvent('leak', { payload });
    setTimeout(() => {
      if (sessionRunning && profileMode === 'babysitter') triggerBabysitterAccidentCheck(event.partial);
    }, 1000);
    return;
  }

  if (type === 'potty_check') {
    logToOutput(`<span style="color:#55efc4;">🧪 <b>Test Event:</b> Forced babysitter potty check.</span>`);
    triggerBabysitterPottyCheck();
    return;
  }

  if (type === 'cycle') {
    logToOutput(`<span style="color:#a29bfe;">🧪 <b>Test Event:</b> Forced full babysitter cycle.</span>`);
    triggerBabysitterMacro();
    return;
  }

  if (type === 'checkin') {
    logToOutput(`<span style="color:#e17055;">🧪 <b>Test Event:</b> Forced babysitter check-in.</span>`);
    triggerBabysitterCheckIn();
    return;
  }

  if (type === 'hydration') {
    const sips = randInt(depSipMin, depSipMax);
    logToOutput(`<span style="color:#81ecec;">🧪 <b>Test Event:</b> Forced hydration order.</span>`);
    logToOutput(`<span style="color:#81ecec;">💧 <b>Babysitter says:</b> "Time for ${sips} sip${sips > 1 ? 's' : ''} of water!" Update your pressure slider after drinking.</span>`);
    return;
  }

  if (type === 'overactive') {
    logToOutput(`<span style="color:#fab1a0;">🧪 <b>Test Event:</b> Forced overactive urgency check.</span>`);
    maybeRunOveractiveUrgencyCheck();
    return;
  }

  if (type === 'spasm') {
    logToOutput(`<span style="color:#dfe6e9;">🧪 <b>Test Event:</b> Forced spasm micro.</span>`);
    triggerBabysitterMicro('spasm');
    return;
  }

  if (type === 'progression') {
    logToOutput(`<span style="color:#74b9ff;">🧪 <b>Test Event:</b> Forcing progression check (as accident).</span>`);
    babysitterFailureCount++;
    protectionFailures++;
    checkBabysitterProgression('accident');
    updateBabysitterUI();
    return;
  }
}

function updateUrgencyMeter() {
  const pressureVal = parseInt($('pressureSlider').value) || 0;
  const slider = $('pressureSlider');
  
  if (!slider) return;
  
  // Update color based on pressure
  if (pressureVal < 50) {
    slider.style.background = 'linear-gradient(to right, #2ecc71 0%, #2ecc71 ' + pressureVal + '%, #444 ' + pressureVal + '%, #444 100%)';
  } else if (pressureVal < 80) {
    slider.style.background = 'linear-gradient(to right, #f1c40f 0%, #f1c40f ' + pressureVal + '%, #444 ' + pressureVal + '%, #444 100%)';
  } else {
    slider.style.background = 'linear-gradient(to right, #e74c3c 0%, #e74c3c ' + pressureVal + '%, #444 ' + pressureVal + '%, #444 100%)';
  }
}

function alarmMain() {
  if (profileMode.startsWith('train_')) {
    showTrainingChoice();
    startChime(600);
    return;
  }

  // GENERIC TEXT
  showBanner(`⚠️ <b>BLADDER SPASM</b>`, `Status uncertain...`, 'high');
  startChime(randInt(800, 1200));
}

/* Replaces existing scheduleNextMicro in app.js */
/* Replaces existing scheduleNextMicro in app.js */
function scheduleNextMicro() {
  clearTimeout(microTimer);
  
  if (!sessionRunning || !microNoiseOn || profileMode === 'dependent') return;

  // Standard Timing Logic
  const now = Date.now();
  if (profileMode !== 'dependent' && (now < microPauseUntilTs || (mainEndAt && (mainEndAt - now) <= 8 * 60000))) {
    microEndAt = null; // Clear it since we're pausing
    microTimer = setTimeout(scheduleNextMicro, 30000);
    return;
  }

  const runtime = customProfileRuntime;
  let min = runtime?.microMin ?? 5;
  let max = runtime?.microMax ?? 15;
  if (profileMode === 'train_rookie') { min = 4; max = 10; }

  const minutes = randInt(min, max);
  microEndAt = Date.now() + (minutes * 60000);

  microTimer = setTimeout(() => {
    if (!sessionRunning) return;
    if (profileMode === 'dependent') return; 

    // 1. Trigger the Event
    pendingAmbientEvent = prerollEvent('micro');
    
    showBanner("⚠️ <b>BLADDER SPASM</b>", "Status uncertain...", 'high');
    startChime(randInt(800, 1200));
    
    scheduleNextMicro();
  }, minutes * 60000);
}

/* ---------- Apply & Reveal ---------- */
function createDrinkPrompt(label, ml) {
  // If arguments are missing (called empty), generate them now
  if (!label) {
    const r = Math.random();
    if (r < 0.5) label = "Drink 250ml water.";
    else if (r < 0.8) label = "Drink 350ml soda/juice.";
    else label = "Drink a full coffee/tea.";
  }

  logToOutput(`<span style="color:#7cc4ff">💧 <b>Hydration:</b> ${label}</span>`);
}

function randomHydrationPrompt() {
  const r = Math.random();
  if (r < 0.5) return { label: `Drink 250ml water.`, ml: 250 };
  if (r < 0.8) return { label: `Drink 350ml soda/juice.`, ml: 350 };
  return { label: `Drink a full coffee/tea.`, ml: 300 };
}

function applyEvent(evt) {
  let color = "#fff";
  if (evt.kind === 'full') color = "#ff6b6b";
  else if (evt.kind === 'challenge') color = "#fdcb6e";
  else color = "#fab1a0";

  let text = `<span style="color:${color}; font-weight:bold;">${evt.desc}</span>`;

  // GUIDE BUTTONS
  if (evt.guide) {
    const guideStr = JSON.stringify(evt.guide).replace(/"/g, '&quot;');
    let safeDesc = evt.desc.replace(/"/g, '&quot;').replace(/'/g, "\\'");
    const typeStr = evt.kind || 'full';

    // FIX: Only show "False Alarm" if NOT in Dependent Mode
    let falseAlarmBtn = "";
    if (profileMode !== 'dependent') {
        falseAlarmBtn = `<button class="pill" style="background:#1b2030; border-color:#7cc4ff; color:#7cc4ff" 
        onclick="reportFalseAlarm('${typeStr}')">🚫 I'm Empty (False Alarm)</button>`;
    }

    text += `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
        <button class="pill" style="background:#333; border-color:#fff" 
        onclick="startVoidGuide(${guideStr}, '${safeDesc}', '${typeStr}')">▶ Start Visual Guide</button>
        ${falseAlarmBtn}
      </div>`;
  }

  if (evt.kind === 'full') createDrinkPrompt();
  logToOutput(text);
}
/* ---------- VISUAL GUIDE ENGINE (v10 - Start/End Gates) ---------- */
let guideInterval = null;
let currentGuideStep = 0;
let currentGuideSeq = [];

// Add global variable
let currentGuideType = 'full';

function startVoidGuide(seq, instructionText = "", type = "full") {
  if (!seq || seq.length === 0) return;

  isGuideComplete = false;
  currentGuideSeq = seq;
  currentGuideType = type; // Store the type
  currentGuideStep = -1;

  const header = $('voidInstruction');
  header.innerHTML = instructionText || "Follow the guide.";

  $('voidOverlay').style.display = 'flex';
  runGuideStep();
}

function triggerDependentMicro() {
    depMicroCount++;
    
    // Get a dependent-specific micro event
    const evt = microTableForMode(d(20)); 

    showBanner("⚠️ BLADDER SPASM", "Status uncertain...", 'high');
    startChime(randInt(800, 1200)); 
    
    setTimeout(() => {
        acknowledgeAlarm(); 
        // Launch the guide with the Queue Counter (e.g., 1/3, 2/3)
        startVoidGuide(evt.guide, `<b>QUEUE EVENT (${depMicroCount}/${depMicroTarget}):</b> ${evt.desc}`);
    }, 2000);
    

    
    scheduleDependentEvent();
}

function reportFalseAlarm(type) {
  // 1. Log the skip
  logToOutput(`<span style="color:#7cc4ff">🚫 <b>False Alarm:</b> You reported "Empty". Event skipped.</span>`);

  // 2. Penalty: Hydration Check
  triggerHydrationEvent();

  // 3. TIMER LOGIC FIX
  // Only reset the Main Timer if this was a MAIN event.
  // Micros are ambient; skipping them shouldn't reset the main clock.
  if (type === 'full') {
    if (profileMode === 'dependent') {
      scheduleDependentEvent();
    } else {
      scheduleMainEvent();
    }
  } else {
    // It was a micro. Do NOT reset the main timer.
    // Just let the background loop continue naturally.
    console.log("Micro skipped. Main timer unaffected.");
  }
}

function runGuideStep() {
  const uiWrap = $('voidOverlay');
  const uiLabel = $('voidLabel');
  const uiTimer = $('voidTimer');
  const uiRing = $('voidRing');
  const uiBtn = $('voidActionBtn');

  const prevRing = $('voidPrevRing');
  const prevLbl = $('voidPrevLabel');
  const nextRing = $('voidNextRing');
  const nextLbl = $('voidNextLabel');

  // --- CASE 1: START SCREEN (Step -1) ---
  if (currentGuideStep === -1) {
    showPushToLeakButton(false);
    // UI Setup
    uiLabel.textContent = "ARE YOU READY?";
    uiLabel.style.color = "#fff";
    uiTimer.style.display = 'none';

    uiBtn.style.display = 'inline-block';
    uiBtn.textContent = "START";
    uiBtn.onclick = () => {
      currentGuideStep = 0;
      runGuideStep(); // Launch first real step
    };

    // Rings
    uiWrap.className = ''; // Neutral BG
    uiRing.style.strokeDashoffset = '880'; // Empty ring
    uiRing.style.transition = 'none';

    // Prev: Hidden
    prevRing.style.opacity = "0";

    // Next: Show First Step
    const firstStep = currentGuideSeq[0];
    nextRing.className = `void-side-ring side-${firstStep.type}`;
    nextLbl.textContent = firstStep.text;
    nextRing.style.opacity = "0.5";

    return; // Stop here, wait for click
  }

  // --- CASE 2: END SCREEN (Step >= Length) ---
  if (currentGuideStep >= currentGuideSeq.length) {
    showPushToLeakButton(false);
    uiLabel.textContent = "SESSION COMPLETE";
    uiLabel.style.color = "#fff";
    uiTimer.style.display = 'none';

    uiBtn.style.display = 'inline-block';
    uiBtn.textContent = "FINISH";
    uiBtn.onclick = () => {
      isGuideComplete = true;
      closeVoidGuide();
    };

    // Rings
    uiWrap.className = '';
    uiRing.style.strokeDashoffset = '0'; // Full ring (Solid)
    uiRing.style.stroke = "#fff";      // White ring
    uiRing.style.transition = 'stroke-dashoffset 1s ease';

    // Prev: Show Last Step
    const lastStep = currentGuideSeq[currentGuideSeq.length - 1];
    prevRing.className = `void-side-ring side-${lastStep.type}`;
    prevLbl.textContent = lastStep.text;
    prevRing.style.opacity = "0.3";

    // Next: Hidden
    nextRing.style.opacity = "0";

    return; // Stop here, wait for click
  }

  // --- CASE 3: RUNNING (Normal Steps) ---

  const step = currentGuideSeq[currentGuideStep];
  const needsPushToLeak = isPushToLeakStep(step.type, step.time);

  // Check if this is a manual "Dispatch" step
  if (step.time === 0) {
    showPushToLeakButton(false);
    uiTimer.style.display = 'none'; // Hide the timer
    uiBtn.style.display = 'inline-block';
    uiBtn.textContent = "DONE / AT DESK"; // The button you click when you return
    uiBtn.onclick = () => {
      currentGuideStep++;
      runGuideStep(); // Move to the "Finish" screen
    };
    uiLabel.textContent = step.text;
    uiWrap.className = 'state-stop'; // Solid blue background
    return;
  }

  // Show/hide push-to-leak button for leak steps
  showPushToLeakButton(needsPushToLeak);

  // Hide Button, Show Timer
  uiBtn.style.display = 'none';
  uiTimer.style.display = 'block';

  const prevStep = currentGuideSeq[currentGuideStep - 1];
  const nextStep = currentGuideSeq[currentGuideStep + 1];

  // 1. UPDATE CENTER RING
  uiLabel.textContent = step.text;
  uiTimer.textContent = step.time.toFixed(1);

  // Set Center Color
  uiWrap.className = '';
  uiWrap.classList.add(`state-${step.type}`);

  // Reset Ring Color (remove white from End state)
  uiRing.style.stroke = "";

  // 2. UPDATE SIDE RINGS
  if (prevStep) {
    prevRing.className = `void-side-ring side-${prevStep.type}`;
    prevLbl.textContent = prevStep.text;
    prevRing.style.opacity = "0.3";
  } else {
    prevRing.style.opacity = "0";
  }

  if (nextStep) {
    nextRing.className = `void-side-ring side-${nextStep.type}`;
    nextLbl.textContent = nextStep.text;
    nextRing.style.opacity = "0.5";
  } else {
    // Approaching End
    nextRing.className = 'void-side-ring';
    nextRing.style.borderColor = "#fff";
    nextLbl.textContent = "FINISH";
    nextRing.style.opacity = "0.2";
  }

  // 3. FILL ANIMATION
  // Force Reset to Empty
  uiRing.style.transition = 'none';
  uiRing.style.strokeDashoffset = '880';

  // For push-to-leak steps, we manually drive the ring; otherwise use CSS transition
  if (!needsPushToLeak) {
    setTimeout(() => {
      uiRing.style.transition = `stroke-dashoffset ${step.time}s linear`;
      uiRing.style.strokeDashoffset = '0';
    }, 50);
  }

  // 4. COUNTDOWN
  let timeLeft = step.time;
  const totalTime = step.time;
  let wasHeld = false; // Track previous held state for ring sync
  clearInterval(guideInterval);

  guideInterval = setInterval(() => {
    // Push-to-leak: only count down while held
    if (needsPushToLeak && !pushToLeakHeld) {
      // Paused — freeze the ring at current position
      if (wasHeld) {
        uiRing.style.transition = 'none';
        const progress = 1 - (timeLeft / totalTime);
        uiRing.style.strokeDashoffset = String(880 - (880 * progress));
        wasHeld = false;
      }
      uiTimer.style.opacity = "0.4";
      return; // Skip this tick
    }

    // If we just started holding, resume ring animation
    if (needsPushToLeak && !wasHeld) {
      wasHeld = true;
      uiTimer.style.opacity = "1";
      const progress = 1 - (timeLeft / totalTime);
      uiRing.style.transition = 'none';
      uiRing.style.strokeDashoffset = String(880 - (880 * progress));
      setTimeout(() => {
        uiRing.style.transition = `stroke-dashoffset ${timeLeft}s linear`;
        uiRing.style.strokeDashoffset = '0';
      }, 20);
    }

    timeLeft -= 0.1;

    if (timeLeft <= 0) {
      clearInterval(guideInterval);
      showPushToLeakButton(false);

      // --- UPDATED: TRAINING INTERRUPTION CHECK ---
      // Interruption is only possible for "pro" trainees during a full accident.
      if (window.mercyMode !== false &&
        profileMode === 'train_pro' &&  // Only for pros, not rookies
        currentGuideType === 'full') {  // Only for full macros

        // Pro trainees have a chance to recover.
        let baseChance = 25; // Pro base chance
        let breakoutChance = baseChance + (currentGuideStep * 15);

        if (Math.random() * 100 < breakoutChance) {
          interruptForRestroom();
          return; // Exit guide step early
        }
      }

      // Buffer Phase
      uiTimer.style.opacity = "0.3";
      setTimeout(() => {
        currentGuideStep++;
        uiTimer.style.opacity = "1";
        runGuideStep();
      }, 500);

    } else {
      uiTimer.style.opacity = "1";
      uiTimer.textContent = (timeLeft < 10) ? timeLeft.toFixed(1) : Math.ceil(timeLeft);
    }
  }, 100);
}

function testGuide() {
  // Pick a random guide from existing data to test
  const guides = FULL_D20.filter(e => e.guide).map(e => e.guide);
  if (guides.length > 0) {
    const randomSeq = guides[Math.floor(Math.random() * guides.length)];
    startVoidGuide(randomSeq);
  } else {
    alert("No guides found in data.");
  }
}

/* --- Updated State Variable --- */
let isRestroomTrip = false;
let isPreviewMode = false; // Set true when event is being previewed from Event Builder

function closeVoidGuide() {
  $('voidOverlay').style.display = 'none';
  clearInterval(guideInterval);
  showPushToLeakButton(false);

  // Preview mode: close cleanly, no bio-check, no timer mutation
  if (isPreviewMode) {
    isPreviewMode = false;
    $('eventBuilderBackdrop').style.display = 'block';
    return;
  }

  // --- ABORT PENALTY CHECK ---
  // If the guide is NOT complete AND it wasn't a restroom trip...
  if (!isGuideComplete && !isRestroomTrip) {
    logToOutput(`<span style="color:#7cc4ff; font-style:italic;">⚠️ <b>Guide Aborted:</b> You stopped early. Checking hydration levels...</span>`);
    triggerHydrationEvent(); // Force Drink
  }

  // ... (Rest of the function remains the same) ...

  if (isRestroomTrip && sessionRunning) {
    logToOutput(`<span style="color:#55efc4; font-size:0.9em;">⏱️ <b>Timer Reset:</b> Potty trip complete; scheduling next urge window.</span>`);
    scheduleMainEvent();
  }

  clearInterval(statusCheckInterval);
  let delayMins = 0;

  if (isRestroomTrip) {
    delayMins = 1;
    isRestroomTrip = false;
  } else if (isGuideComplete && currentGuideType === 'full') {
    delayMins = randInt(5, 20);
    logToOutput(`<span style="color:#ff7675; font-style:italic;">⏳ Accident logged. You are being left to sit in it for a while. Status check in ~${delayMins} mins.</span>`);
  } else if (isGuideComplete && currentGuideType === 'micro') {
    // Micros are small involuntary leaks — never trigger a bio-check regardless of profile.
    // Babysitter has its own check system; all others just log and move on.
    if (profileMode === 'babysitter') {
      logToOutput(`<span style="color:#fab1a0; font-style:italic;">💧 Micro-accident logged. Babysitter will check on you later.</span>`);
    } else if (profileMode === 'dependent' || profileMode === 'npt') {
      logToOutput(`<span style="color:#fab1a0; font-style:italic;">💧 Micro-leak logged. It's just part of your condition.</span>`);
    } else {
      logToOutput(`<span style="color:#fab1a0; font-style:italic;">💧 Micro-leak logged.</span>`);
    }
    return;
  } else {
    scheduleForcedCheck();
    return;
  }

  setTimeout(() => {
    if (sessionRunning) {
      startChime(440);
      openStatusModal();
      scheduleForcedCheck();
    }
  }, delayMins * 60000);
}

/* Updated to include the toddler delay logic */
function scheduleDelayedBioCheck() {
  // Random delay between 5 and 10 minutes
  const delayMins = randInt(5, 10);
  logToOutput(`<span class="muted">⏳ <b>Note:</b> You are expected to continue working for a bit before your status is checked.</span>`);

  setTimeout(() => {
    if (sessionRunning) {
      startChime(440); // Low reminder tone
      openStatusModal();
    }
  }, delayMins * 60000);
}

function getMainTimerRemaining() {
  if (!mainEndAt) return 0;
  return Math.max(0, Math.floor((mainEndAt - Date.now()) / 1000));
}

function adjustUsage(amount) {
  dailyChangeCount += amount;
  if (dailyChangeCount < 0) dailyChangeCount = 0;

  // Update the UI
  $('changeCountDisplay').textContent = dailyChangeCount;

  // Optional: Check regression limits manually
  const limit = (profileMode === 'train_rookie') ? 5 : 8;
  if (dailyChangeCount >= limit) {
    $('changeCountDisplay').style.color = '#ff6b6b'; // Turn Red
    toast("⚠️ Daily limit reached/exceeded.");
  } else {
    $('changeCountDisplay').style.color = '#a29bfe'; // Normal Purple
  }
}

/* ========== PUSH-TO-LEAK MODE ========== */
function togglePushToLeak(enabled) {
  pushToLeakEnabled = enabled;
  localStorage.setItem('pushToLeakEnabled', JSON.stringify(enabled));
  toast(enabled ? '🫳 Push-to-Leak ON: Hold button during leaks' : '🫳 Push-to-Leak OFF');
}

function togglePushToLeakSkipLong(enabled) {
  pushToLeakSkipLong = enabled;
  localStorage.setItem('pushToLeakSkipLong', JSON.stringify(enabled));
}

function initPushToLeakUI() {
  // Restore toggle state
  const toggle = $('pushToLeakToggle');
  if (toggle) toggle.checked = pushToLeakEnabled;
  const skipToggle = $('pushToLeakSkipLongToggle');
  if (skipToggle) skipToggle.checked = pushToLeakSkipLong;
  
  // Bind hold events (mouse + touch) to the leak button
  const btn = $('pushToLeakBtn');
  if (!btn) return;
  
  const startHold = (e) => { e.preventDefault(); pushToLeakHeld = true; updatePushToLeakVisual(); };
  const stopHold = (e) => { e.preventDefault(); pushToLeakHeld = false; updatePushToLeakVisual(); };
  
  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('mouseup', stopHold);
  btn.addEventListener('mouseleave', stopHold);
  btn.addEventListener('touchstart', startHold, { passive: false });
  btn.addEventListener('touchend', stopHold, { passive: false });
  btn.addEventListener('touchcancel', stopHold, { passive: false });
}

function updatePushToLeakVisual() {
  const btn = $('pushToLeakBtn');
  const status = $('pushToLeakStatus');
  if (!btn) return;
  if (pushToLeakHeld) {
    btn.classList.add('held');
    btn.classList.remove('paused');
    if (status) status.textContent = 'LEAKING...';
  } else {
    btn.classList.remove('held');
    btn.classList.add('paused');
    if (status) status.textContent = 'PAUSED — hold button to go';
  }
}

function isPushToLeakStep(stepType, stepTime) {
  if (!pushToLeakEnabled) return false;
  if (!['push', 'relax'].includes(stepType)) return false;
  // Skip push-to-leak for long steps if the option is on
  if (pushToLeakSkipLong && (stepTime || 0) > 10) return false;
  return true;
}

function showPushToLeakButton(show) {
  const container = $('pushToLeakContainer');
  if (container) container.style.display = show ? 'block' : 'none';
  if (!show) pushToLeakHeld = false;
}

/* ========== PROTECTION STASH SYSTEM ========== */
function toggleStashTracking(enabled) {
  stashTrackingEnabled = enabled;
  localStorage.setItem('stashTrackingEnabled', JSON.stringify(enabled));
  // Show/hide +/- buttons
  document.querySelectorAll('.stash-btn').forEach(btn => {
    btn.style.display = enabled ? 'inline-block' : 'none';
  });
  // If enabling for the first time, initialize counts to 0 (track from now)
  if (enabled) {
    for (const key of PROTECTION_HIERARCHY) {
      if (protectionStash[key] === null) protectionStash[key] = 0;
    }
  } else {
    for (const key of PROTECTION_HIERARCHY) protectionStash[key] = null;
  }
  saveStash();
  renderStashUI();
  toast(enabled ? '📦 Stash tracking ON' : '📦 Stash tracking OFF');
}

function adjustStash(type, amount) {
  if (protectionStash[type] === null) protectionStash[type] = 0;
  protectionStash[type] = Math.max(0, protectionStash[type] + amount);
  saveStash();
  renderStashUI();
}

function saveStash() {
  localStorage.setItem('protectionStash', JSON.stringify(protectionStash));
}

function renderStashUI() {
  // Migrate legacy 'guards' value
  if (currentProtectionLevel === 'guards') {
    currentProtectionLevel = 'pad';
    localStorage.setItem('currentProtectionLevel', 'pad');
  }

  for (const key of PROTECTION_HIERARCHY) {
    const el = $('stashCount_' + key);
    if (!el) continue;
    const count = protectionStash[key];
    el.textContent = count === null ? '∞' : count;
    
    // Highlight current protection level
    const item = el.closest('.stash-item');
    if (item) {
      item.classList.toggle('stash-active', key === currentProtectionLevel);
      item.classList.toggle('stash-empty', count !== null && count === 0);
    }
  }

  // Update "Currently Wearing" indicator
  const wearingEl = $('currentlyWearingLabel');
  if (wearingEl) wearingEl.textContent = formatProtectionLevel(currentProtectionLevel);
  // Sync the protection chooser dropdown
  const chooser = $('protectionChooser');
  if (chooser) chooser.value = currentProtectionLevel;

  // Show/hide +/- buttons based on tracking state
  document.querySelectorAll('.stash-btn').forEach(btn => {
    btn.style.display = stashTrackingEnabled ? 'inline-block' : 'none';
  });
  // Restore tracking checkbox
  const trackToggle = $('stashTrackToggle');
  if (trackToggle) trackToggle.checked = stashTrackingEnabled;
}

function changeProtectionDirect(newLevel) {
  if (!PROTECTION_HIERARCHY.includes(newLevel)) return;
  currentProtectionLevel = newLevel;
  localStorage.setItem('currentProtectionLevel', newLevel);
  renderStashUI();
  logToOutput(`<span style="color:#a29bfe">👗 <b>Protection Changed:</b> Now wearing ${formatProtectionLevel(newLevel)}.</span>`);
}

function hasStashFor(protLevel) {
  // Returns true if the user has stock (or tracking is off / unlimited)
  if (!stashTrackingEnabled) return true;
  const count = protectionStash[protLevel];
  return count === null || count > 0;
}

function consumeFromStash(protLevel) {
  if (!stashTrackingEnabled) return;
  if (protectionStash[protLevel] !== null && protectionStash[protLevel] > 0) {
    protectionStash[protLevel]--;
    saveStash();
    renderStashUI();
  }
}

function getNextAvailableProtection(direction, fromLevel) {
  // direction: 'up' (lighter) or 'down' (heavier)
  const idx = PROTECTION_HIERARCHY.indexOf(fromLevel);
  if (direction === 'down') {
    // Look for next heavier protection that's in stash AND in protectionTypes
    for (let i = idx + 1; i < PROTECTION_HIERARCHY.length; i++) {
      const lvl = PROTECTION_HIERARCHY[i];
      if (protectionTypes.includes(lvl) && hasStashFor(lvl)) return lvl;
    }
  } else {
    // Look for next lighter protection that's in stash AND in protectionTypes
    for (let i = idx - 1; i >= 0; i--) {
      const lvl = PROTECTION_HIERARCHY[i];
      if (protectionTypes.includes(lvl) && hasStashFor(lvl)) return lvl;
    }
  }
  return null; // Nothing available
}

function nextReveal() {
  hideBanner();
  stopChime();

  let evtToRun = null;

  // 1. Determine which event is ready
  if (pendingAmbientEvent) {
    evtToRun = pendingAmbientEvent;
    pendingAmbientEvent = null;
  } else if (pendingMainEvent) {
    evtToRun = pendingMainEvent;

    // Reset timers for the NEXT main event
    const nxt = { min: pendingMainEvent.tmin || 30, max: pendingMainEvent.tmax || 90 };
    pendingMainEvent = null;
    microPauseUntilTs = Date.now() + 10 * 60000; // Pause micros for 10m

    if (sessionRunning) scheduleMainEvent(nxt);
  } else {
    // Emergency / Manual Click (No event pending)
    evtToRun = microTableForMode(rollMicroForMode());
  }

  // 2. Execute
  if (evtToRun) {
    applyEvent(evtToRun); // Log text to the console

    // AUTO-START MECHANIC
    // If the event has a guide, launch it immediately.
    if (evtToRun.guide) {
      const typeStr = evtToRun.kind || 'full'; // 'micro' or 'full'

      // Small delay to let the log appear first
      setTimeout(() => {
        startVoidGuide(evtToRun.guide, evtToRun.desc, typeStr);
      }, 500);
    }
  }
}

function applySelectedProfile() {
  const profileSelect = $('profileSelect');
  const v = profileSelect ? profileSelect.value : profileMode;
  profileMode = v;
  localStorage.setItem('profileMode', v);

  // Show/hide Omorashi setup based on profile
  const omorashiSetup = $('omorashiSetup');
  const hydrationTrigger = $('hydrationTriggerSection');
  const btnCanIGo = $('btnCanIGo');
  const btnILeaked = $('btnILeaked');
  const babysitterPanel = $('babysitterStreakPanel');
  
  if (profileMode === 'omorashi_hold') {
    if (omorashiSetup) omorashiSetup.style.display = 'block';
    if (hydrationTrigger) hydrationTrigger.style.display = 'none';
    if (btnCanIGo) btnCanIGo.style.display = 'none';
    if (btnILeaked) btnILeaked.style.display = 'block';
    if (babysitterPanel) babysitterPanel.style.display = 'none';
  } else if (profileMode === 'babysitter') {
    if (omorashiSetup) omorashiSetup.style.display = 'none';
    if (hydrationTrigger) hydrationTrigger.style.display = 'block';
    if (btnCanIGo) btnCanIGo.style.display = 'block';
    if (btnILeaked) btnILeaked.style.display = 'none';
    if (babysitterPanel) babysitterPanel.style.display = 'block';
  } else {
    if (omorashiSetup) omorashiSetup.style.display = 'none';
    if (hydrationTrigger) hydrationTrigger.style.display = 'block';
    if (btnCanIGo) btnCanIGo.style.display = 'none';
    if (btnILeaked) btnILeaked.style.display = 'none';
    if (babysitterPanel) babysitterPanel.style.display = 'none';
  }

  // FIX: Clear ghosts immediately upon switching
  pendingAmbientEvent = null; 
  pendingMainEvent = null;
  hideBanner(); 

  // Clear all profile-specific timers to prevent cross-contamination
  clearTimeout(microTimer); microTimer = null;
  if (babysitterCheckTimer) { clearTimeout(babysitterCheckTimer); babysitterCheckTimer = null; }
  babysitterMicroTimerIds.forEach(id => clearTimeout(id));
  babysitterMicroTimerIds = [];

  // FIX: Clear custom profile runtime so stale events don't leak across profiles
  customProfileRuntime = null;
  activeCustomProfile = null;
  localStorage.removeItem('activeCustomProfile');

  toast(`Profile set: ${v}`);
  initGuideSelector(); 
}
/* ---------- Independent Hydration Loop ---------- */
function scheduleNextHydration() {
  clearTimeout(hydrationTimer);
  if (!sessionRunning) return;

  const runtime = customProfileRuntime;
  const minHydration = runtime?.hydrationMin ?? 6;
  const maxHydration = runtime?.hydrationMax ?? 12;
  const minutes = randInt(minHydration, maxHydration);
  const ms = minutes * 60000;

  // SAVE THE TIME so the UI can see it
  hydrationEndAt = Date.now() + ms;

  hydrationTimer = setTimeout(() => {
    if (!sessionRunning) return;
    triggerHydrationEvent();
    scheduleNextHydration();
  }, ms);
}

function confirmStatus() {
  toast("Status Confirmed");
  // Log it so you have a record of the check
  logToOutput(`<span style="color:#a29bfe">📝 <b>Status Check:</b> Confirmed no changes. Urgency ${getUrgencyLevel(manualPressure)}/10, Sat ${manualSaturation}%.</span>`);
  saveState(); // Save that we are still active
}

function initGuideSelector() {
  const sel = $('debugGuideSelect');
  if (!sel) return;

  // Clear existing
  sel.innerHTML = '<option value="">Select Guide...</option>';

  let macroList = [];
  let microList = [];

  // 1. Determine which tables are active
  if (profileMode === 'dependent') {
      macroList = MACRO_DEPENDENT_D20;
      microList = MICRO_DEPENDENT_D20;
  } 
  else if (profileMode === 'babysitter') {
      // Babysitter uses realistic micros
      macroList = [];
      microList = MICRO_BABYSITTER_D20;
  }
  else if (profileMode.startsWith('train_')) {
      macroList = FULL_TRAINING_FAILURES;
      microList = MICRO_TRAINING_D8;
  }
  else if (profileMode === 'omorashi_hold') {
      // Omorashi only has stress tests, no macros
      microList = OMORASHI_HOLDING_GUIDES;
      macroList = [];
  }
  else if (profileMode === 'npt') {
      macroList = FULL_D20;
      microList = MICRO_DIAPER_D8;
  }
  else if (profileMode === 'chaos_manual') {
      // Chaos Mode gets EVERYTHING
      const grpChaos = document.createElement('optgroup'); 
      grpChaos.label = "🔥 CHAOS (All Tables)";
      
      // Merge unique guides for testing
      const allMacros = [...FULL_TRAINING_FAILURES, ...MACRO_DEPENDENT_D20, ...FULL_D20];
      
      allMacros.forEach((item, index) => {
          if (item.guide) {
              const opt = document.createElement('option');
              opt.value = `chaos_${index}`; 
              opt.textContent = item.label || item.flow.substring(0, 30);
              grpChaos.appendChild(opt);
          }
      });
      sel.appendChild(grpChaos);
      
      // Store reference for the test function
      window.currentDebugMacros = allMacros;
      return; 
  }
  else {
      // Standard / Early
      macroList = FULL_D20;
      microList = MICRO_DIAPER_D8; // Using Diaper D8 as fallback for tests
  }

  // 2. Store references globally so testSelectedGuide knows what to look at
  window.currentDebugMacros = macroList;
  window.currentDebugMicros = microList;

  // 3. Render Macros
  if (macroList.length > 0) {
      const grpFull = document.createElement('optgroup'); 
      grpFull.label = "Macro Events";
      macroList.forEach((item, index) => {
          if (item.guide) { // Only list items with guides
              const opt = document.createElement('option');
              opt.value = `full_${index}`;
              opt.textContent = item.label || item.flow.substring(0, 25) + "...";
              grpFull.appendChild(opt);
          }
      });
      sel.appendChild(grpFull);
  }

  // 4. Render Micros
  if (microList.length > 0) {
      const grpMicro = document.createElement('optgroup'); 
      grpMicro.label = "Micro Events";
      microList.forEach((item, index) => {
          if (item.guide) {
              const opt = document.createElement('option');
              opt.value = `micro_${index}`;
              opt.textContent = item.label || "[Micro] " + index;
              grpMicro.appendChild(opt);
          }
      });
      sel.appendChild(grpMicro);
  }
}

function testSelectedGuide() {
  const sel = $('debugGuideSelect');
  const val = sel.value;
  if (val === "") return;

  const [type, idxStr] = val.split('_');
  const idx = parseInt(idxStr);
  
  let targetItem = null;

  // Fetch from the lists we stored in initGuideSelector
  if (type === 'full' && window.currentDebugMacros) {
      targetItem = window.currentDebugMacros[idx];
  } 
  else if (type === 'micro' && window.currentDebugMicros) {
      targetItem = window.currentDebugMicros[idx];
  }
  else if (type === 'chaos' && window.currentDebugMacros) {
      targetItem = window.currentDebugMacros[idx];
  }

  if (targetItem && targetItem.guide) {
      // Determine type for color coding
      let typeStr = 'full';
      if (type === 'micro') typeStr = 'micro';
      
      // Close any existing overlays first
      closeVoidGuide(); 
      
      // Start the guide immediately
      setTimeout(() => {
          startVoidGuide(targetItem.guide, `<b>[TEST MODE]</b> ${targetItem.label || "Debug Scenario"}`, typeStr);
      }, 100);
      
      console.log("Testing Guide:", targetItem);
  } else {
      alert("Invalid guide selected or no guide data found.");
  }
}

function triggerHydrationEvent() {
  // 1. Define Intensity
  let min = 2, max = 5;
  if (profileMode === 'dependent') { min = 4; max = 8; }
  else if (profileMode === 'train_rookie' || profileMode === 'chaos_manual') { min = 2; max = 6; }
  else if (profileMode === 'train_pro') { min = 1; max = 5; }

  // 2. Roll Content
  const count = randInt(min, max);
  const unit = (count >= 6) ? "large gulps" : "sips";
  const drinkType = pick(["Water", "Coffee/Soda"]);
  const msg = `<b>Hydration Order:</b> Take <b>${count} ${unit}</b> of your <b>${drinkType}</b> immediately.`;

  // 3. UI Setup
  isHydrationPending = true;
  showBanner("💧 Hydration Order", "Acknowledge consumption.", 'low');
  startChime(600);

  // 4. Update Buttons
  const ackBtn = $('alarmBanner').querySelector('.btn.ack');
  const skipBtn = $('alarmBanner').querySelector('.btn.silence');

  if (ackBtn) {
      ackBtn.style.display = 'inline-block';
      ackBtn.textContent = "Consumed"; 
  }
  if (skipBtn) {
      skipBtn.textContent = "Refuse"; 
  }

  logToOutput(`<span style="color:#7cc4ff">💧 <b>Drink Alarm:</b> ${msg}</span>`);
}
function startSession(isResume = false) {
  if (sessionRunning && !isResume) return;

  sessionRunning = true;
  $('output').textContent = isResume ? "Session Resumed." : "Session Started. Bio-Logger Active.";

  // Hide the getting started guide once session is active
  if ($('instructionsPanel')) $('instructionsPanel').style.display = 'none';

  if (!isResume) {
    // FRESH START: CLEAR ALL GHOSTS
    sessionStartTime = Date.now(); 
    depMicroCount = 0;
    hydrationEndAt = null;
    microEndAt = null;
    
    // FIX: Wipe pending events so old profile data doesn't leak in
    pendingMainEvent = null;
    pendingAmbientEvent = null;

    // Clear all babysitter-specific timers so they don't leak into other profiles
    if (babysitterCheckTimer) { clearTimeout(babysitterCheckTimer); babysitterCheckTimer = null; }
    babysitterMicroTimerIds.forEach(id => clearTimeout(id));
    babysitterMicroTimerIds = [];
  }

  if (isResume && mainEndAt) {
    // ... (Resume Logic Remains the Same) ...
     const remainingMS = Math.max(0, mainEndAt - Date.now());
    logToOutput(`<b>🔄 Resuming:</b> Event in ~${Math.ceil(remainingMS / 60000)} mins.`);

    clearTimeout(mainTimer);
    clearTimeout(preChimeTimer);

    const drinkLeft = (hydrationEndAt && hydrationEndAt > Date.now())
      ? hydrationEndAt - Date.now()
      : 0;

    clearTimeout(hydrationTimer);
    if (drinkLeft > 0) {
      hydrationTimer = setTimeout(() => {
        triggerHydrationEvent();
        scheduleNextHydration();
      }, drinkLeft);
    } else {
      scheduleNextHydration(); 
    }

    if (profileMode === 'dependent') {
      let nextType = (depMicroCount >= depMicroTarget) ? 'full' : 'micro';
      mainTimer = setTimeout(() => {
        if (!sessionRunning) return;
        (nextType === 'micro') ? triggerDependentMicro() : triggerDependentMacro();
      }, remainingMS);
      clearTimeout(microTimer);
    } else {
      preChimeTimer = setTimeout(startChime, Math.max(0, remainingMS - 15000));
      mainTimer = setTimeout(alarmMain, remainingMS);
      microPauseUntilTs = Date.now();
      scheduleNextMicro();
    }
    
  } else {
    // --- NEW START LOGIC ---
    if (profileMode === 'omorashi_hold') {
      // Omorashi mode doesn't auto-start. User clicks "Begin Hold Session" in setup panel
      logToOutput(`<span style="color:#81ecec"><b>💧 Omorashi Mode Selected</b><br>Configure your session in the setup panel above.</span>`);
      sessionRunning = false; // Don't keep it running until they click Begin
    } else if (profileMode === 'dependent') {
      clearTimeout(microTimer);
      // Explicitly nullify pending again just to be safe
      pendingAmbientEvent = null;
      
      // Load setup data if available
      const setupStr = localStorage.getItem('dependent_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        depQueueMin = setup.queueMin || 1;
        depQueueMax = setup.queueMax || 6;
        depSpasmMin = setup.spasmsMin || 8;
        depSpasmMax = setup.spasmsMax || 15;
        depSipMin = setup.sipMin || 2;
        depSipMax = setup.sipMax || 5;
        depUseDiuretics = setup.useDiuretics !== false;
        
        depMicroCount = 0;
        depMicroTarget = randInt(depQueueMin, depQueueMax);
        logToOutput(`<span style="color:#fab1a0"><b>👶 Dependent Mode Started</b><br>Queue target: <b>${depMicroTarget}</b> spasms before void<br>Spasm interval: ${depSpasmMin}-${depSpasmMax} mins</span>`);
      } else {
        // Fallback to default
        depMicroCount = 0;
        depMicroTarget = randInt(depQueueMin, depQueueMax);
      }
      
      scheduleDependentEvent();
      scheduleNextHydration();
    } else if (profileMode === 'babysitter') {
      // Babysitter-specific setup - always uses auto-progression
      babysitterDryStreak = 0;
      babysitterTotalCycles = 0;
      babysitterFailureCount = 0;
      protectionSuccesses = 0;
      protectionFailures = 0;
      
      // Load diapering preferences from localStorage
      const protTypesStr = localStorage.getItem('protectionTypes');
      const protLevelStr = localStorage.getItem('currentProtectionLevel');
      const autoDiffStr = localStorage.getItem('autoDifficulty');
      const contLevelStr = localStorage.getItem('currentContinenceLevel');
      const symptomStr = localStorage.getItem('activeSymptoms');
      const curseStr = localStorage.getItem('activeCurses');
      
      if (protTypesStr) protectionTypes = JSON.parse(protTypesStr).map(t => t === 'guards' ? 'pad' : t);
      if (protLevelStr) currentProtectionLevel = protLevelStr === 'guards' ? 'pad' : protLevelStr;
      if (autoDiffStr) autoDifficulty = autoDiffStr;
      if (contLevelStr) currentContinenceLevel = contLevelStr;
      if (symptomStr) activeSymptoms = JSON.parse(symptomStr);
      if (curseStr) activeCurses = JSON.parse(curseStr);

      pottyPasses = getStartingPottyPasses();
      
      updateBabysitterUI();
      
      const setupStr = localStorage.getItem('babysitter_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        depSpasmMin = setup.spasmsMin || 40;
        depSpasmMax = setup.spasmsMax || 60;
        depQueueMin = setup.queueMin || 0;
        depQueueMax = setup.queueMax || 2;
        depSipMin = setup.sipMin || 1;
        depSipMax = setup.sipMax || 2;
      } else {
        // Fallback to defaults
        depSpasmMin = 40;
        depSpasmMax = 60;
        depQueueMin = 0;
        depQueueMax = 2;
        depSipMin = 1;
        depSipMax = 2;
      }
      
      // Apply difficulty adjustments (always active)
      if (autoDifficulty === 'easy') {
        depSpasmMin = Math.ceil(depSpasmMin * 0.7);
        depSpasmMax = Math.ceil(depSpasmMax * 0.7);
        depQueueMax = Math.max(0, depQueueMax - 1);
      } else if (autoDifficulty === 'hard') {
        depSpasmMin = Math.ceil(depSpasmMin * 1.2);
        depSpasmMax = Math.ceil(depSpasmMax * 1.2);
        depQueueMax = Math.min(5, depQueueMax + 1);
      }
      
      logToOutput(`<span style="color:#a29bfe">🔄 <b>Difficulty:</b> ${(autoDifficulty || 'medium').toUpperCase()} | Starting at: ${currentProtectionLevel}</span>`);
      
      depUseDiuretics = false;
      depMicroCount = 0;
      depMicroTarget = randInt(depQueueMin, depQueueMax);
      const contMeta = getContinenceMeta();
      logToOutput(`<span style="color:#a29bfe">👩‍🍼 <b>Babysitter Mode Started</b><br>Protection: ${currentProtectionLevel} | Continence: ${currentContinenceLevel.replace(/_/g, ' ')} | Hold time: ${depSpasmMin}-${depSpasmMax} mins<br>Expected spasms: ${depMicroTarget} | Potty passes: ${pottyPasses}</span>`);
      logToOutput(`<span class="muted">🧠 <b>Continence Briefing:</b> ${contMeta.inCharacter}<br>🛡️ <b>Recommended Setup:</b> ${contMeta.recommendedProtection}</span>`);
      if (activeSymptoms.length > 0) {
        const symptomNames = activeSymptoms.map((k) => BABYSITTER_SYMPTOMS[k]?.name || k).join(', ');
        logToOutput(`<span style="color:#7cc4ff;">🧪 <b>Active Symptoms:</b> ${symptomNames}</span>`);
      }
      if (activeCurses.length > 0) {
        const curseNames = activeCurses.map((k) => BABYSITTER_CURSES[k]?.name || k).join(', ');
        logToOutput(`<span style="color:#fdcb6e;">🕯️ <b>Active Curses:</b> ${curseNames}</span>`);
      }
      const impactLines = buildSymptomImpactSummary();
      if (impactLines.length > 0) {
        logToOutput(`<div style="border:1px solid #2b3348; border-radius:8px; padding:8px; margin-top:6px; background:#111826;">
          <span style="color:#7cc4ff;"><b>🧪 Symptom Analysis:</b></span><br>
          <span style="color:#b8c3d6; font-size:0.88em;">${impactLines.join('<br>')}</span>
        </div>`);
      }
      
      // Show day tracker and log session start
      const dayTrackerPanel = $('dayTrackerPanel');
      if (dayTrackerPanel) dayTrackerPanel.style.display = 'block';
      trackDayEvent('session_start');
      renderDayTracker();
      
      scheduleMainEvent({ min: depSpasmMin, max: depSpasmMax });
      scheduleBabysitterCheckIn();
      scheduleNextHydration();
    } else if (profileMode === 'train_rookie') {
      // Load Rookie setup data
      const setupStr = localStorage.getItem('train_rookie_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        rookieVoidMin = setup.voidMin || 25;
        rookieVoidMax = setup.voidMax || 50;
        rookieSuccessRate = setup.successRate || 60;
        rookieMercy = setup.mercy !== false;
        logToOutput(`<span style="color:#74b9ff"><b>💪 Rookie Mode Started</b><br>Void window: ${rookieVoidMin}-${rookieVoidMax} mins<br>Success rate: ${rookieSuccessRate}%</span>`);
      } else {
        rookieVoidMin = 25;
        rookieVoidMax = 50;
        rookieSuccessRate = 60;
        rookieMercy = true;
      }
      
      let firstMin = 15, firstMax = 30;
      if (manualPressure > 70) { firstMin = 5; firstMax = 15; }
      scheduleMainEvent({ min: firstMin, max: firstMax });
      schedulePreSoak();
      scheduleNextHydration();
    } else if (profileMode === 'train_pro') {
      // Load Pro setup data
      const setupStr = localStorage.getItem('train_pro_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        proVoidMin = setup.voidMin || 50;
        proVoidMax = setup.voidMax || 90;
        proSuccessRate = setup.successRate || 35;
        proMercy = setup.mercy !== false;
        logToOutput(`<span style="color:#ffeaa7"><b>💪 Pro Mode Started</b><br>Void window: ${proVoidMin}-${proVoidMax} mins<br>Success rate: ${proSuccessRate}%</span>`);
      } else {
        proVoidMin = 50;
        proVoidMax = 90;
        proSuccessRate = 35;
        proMercy = true;
      }
      
      let firstMin = 30, firstMax = 50;
      if (manualPressure > 70) { firstMin = 15; firstMax = 30; }
      scheduleMainEvent({ min: firstMin, max: firstMax });
      schedulePreSoak();
      scheduleNextHydration();
    } else if (profileMode === 'npt') {
      // Load NPT setup data
      const setupStr = localStorage.getItem('npt_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        nptVoidMin = setup.voidMin || 45;
        nptVoidMax = setup.voidMax || 90;
        nptSatThreshold = setup.satThreshold || 85;
        nptMercy = setup.mercy !== false;
        nptSipMin = setup.sipMin || 2;
        nptSipMax = setup.sipMax || 5;
        logToOutput(`<span style="color:#a29bfe"><b>🌙 Not Potty Trained Mode Started</b><br>Void window: ${nptVoidMin}-${nptVoidMax} mins<br>Saturation threshold: ${nptSatThreshold}%</span>`);
      } else {
        nptVoidMin = 45;
        nptVoidMax = 90;
        nptSatThreshold = 85;
        nptMercy = true;
        nptSipMin = 2;
        nptSipMax = 5;
      }
      
      let firstMin = 15, firstMax = 40;
      if (manualPressure > 70) { firstMin = 5; firstMax = 15; }
      scheduleMainEvent({ min: firstMin, max: firstMax });
      scheduleNextHydration();
    } else if (profileMode === 'chaos_manual') {
      // Load Chaos setup data
      const setupStr = localStorage.getItem('chaos_manual_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        chaosSipMin = setup.sipMin || 2;
        chaosSipMax = setup.sipMax || 6;
        logToOutput(`<span style="color:#fab1a0"><b>🔥 Chaos Mode Activated</b><br>Sip range: ${chaosSipMin}-${chaosSipMax}</span>`);
      } else {
        chaosSipMin = 2;
        chaosSipMax = 6;
      }
      // Chaos doesn't auto-start
    } else if (profileMode === 'babysitter') {
      // Babysitter-specific setup (realistic omorashi with small failure chance)
      depQueueMin = 0;  // 0-2 micros per main
      depQueueMax = 2;
      depSpasmMin = 40; // Main timer 40-60 min
      depSpasmMax = 60;
      depSipMin = 1;    // Occasional sips
      depSipMax = 2;
      depUseDiuretics = false; // No heavy diuretics for realism
      logToOutput(`<span style="color:#a29bfe">👩‍🍼 <b>Babysitter Mode:</b> Potty training time! Try to stay dry, but I'll help if you can't. Timers: 40-60min with 0-2 spasms.</span>`);
    } else {
      let firstMin = 15, firstMax = 40;
      if (manualPressure > 70) { firstMin = 5; firstMax = 15; }
      else if (manualPressure > 40) { firstMin = 10; firstMax = 25; }

      scheduleMainEvent({ min: firstMin, max: firstMax });
      if (profileMode.startsWith('train_')) schedulePreSoak();
      scheduleNextHydration();
    }

    if (profileMode !== 'omorashi_hold') {
      scheduleForcedCheck();
    }
  }

  clearInterval(tickInterval);
  tickInterval = setInterval(setCountdownLabel, 1000);
  saveState();
}

function stopAll() {
  if (!sessionRunning) return;
  if (profileMode === 'babysitter') trackDayEvent('session_end');
  sessionRunning = false;
  clearTimeout(mainTimer);
  clearTimeout(preChimeTimer);
  clearTimeout(microTimer);
  clearTimeout(hydrationTimer);
  clearTimeout(omorashiStressTestTimer);
  if (babysitterCheckTimer) clearTimeout(babysitterCheckTimer);
  babysitterMicroTimerIds.forEach(id => clearTimeout(id));
  babysitterMicroTimerIds = [];

  clearInterval(tickInterval);
  stopChime();
  meetingActive = false;
  omorashiSessionActive = false;
  omorashiGuideActive = false;

  // --- Session Summary ---
  const elapsed = Date.now() - sessionStartTime;
  const mins = Math.floor(elapsed / 60000);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`;

  let summary = `<div style="background:#1b2030; padding:12px; border-radius:8px; border:1px solid #a29bfe; margin:8px 0;">
    <div style="color:#a29bfe; font-weight:bold; font-size:1.1em; margin-bottom:8px;">📊 Session Summary</div>
    <div style="color:#cdd7e6;">⏱️ Duration: <b>${timeStr}</b></div>
    <div style="color:#cdd7e6;">📈 Peak Urgency: <b>${getUrgencyLevel(manualPressure)}/10</b></div>`;

  if (profileMode === 'babysitter') {
    const tracker = getDayTracker();
    summary += `
    <div style="color:#cdd7e6;">🔄 Cycles: <b>${babysitterTotalCycles}</b></div>
    <div style="color:#55efc4;">🚽 Potty Successes: <b>${tracker.pottySuccesses}</b></div>
    <div style="color:#ff7675;">💦 Accidents: <b>${tracker.accidents + tracker.partialAccidents}</b> (${tracker.partialAccidents} partial)</div>
    <div style="color:#7cc4ff;">🔥 Dry Streak: <b>${babysitterDryStreak}</b> cycles</div>
    <div style="color:#9b59b6;">🛡️ Protection: <b>${formatProtectionLevel(currentProtectionLevel)}</b></div>
    <div style="color:#e17055;">🧠 Continence: <b>${formatProtectionLevel(currentContinenceLevel)}</b></div>`;
    if (tracker.protectionChanges?.length > 0) {
      summary += `<div style="color:#fdcb6e; margin-top:4px;">🔄 Protection Changes: <b>${tracker.protectionChanges.length}</b></div>`;
    }
  }

  summary += `</div>`;
  $('output').innerHTML = summary;

  // Restore the getting started guide
  if ($('instructionsPanel')) $('instructionsPanel').style.display = '';
}

function showSessionSetupModal() {
  const savedCont = localStorage.getItem('currentContinenceLevel');
  if ($('continenceSelect') && savedCont) $('continenceSelect').value = savedCont;

  const savedSymptoms = JSON.parse(localStorage.getItem('activeSymptoms') || '[]');
  const savedCurses = JSON.parse(localStorage.getItem('activeCurses') || '[]');
  if ($('symOveractive')) $('symOveractive').checked = savedSymptoms.includes('overactive_bladder');
  if ($('symStress')) $('symStress').checked = savedSymptoms.includes('stress_incontinence');
  if ($('symUrge')) $('symUrge').checked = savedSymptoms.includes('urge_incontinence');
  if ($('symNocturnal')) $('symNocturnal').checked = savedSymptoms.includes('nocturnal_wetter');
  if ($('symGiggle')) $('symGiggle').checked = savedSymptoms.includes('giggle_incontinence');
  if ($('symDribble')) $('symDribble').checked = savedSymptoms.includes('pre_void_dribble') || savedSymptoms.includes('post_void_dribble');

  if ($('curseStrict')) $('curseStrict').checked = savedCurses.includes('strict_sitter');
  if ($('curseNoPass')) $('curseNoPass').checked = savedCurses.includes('no_free_passes');
  if ($('curseSlippery')) $('curseSlippery').checked = savedCurses.includes('slippery_focus');
  if ($('curseHydration')) $('curseHydration').checked = savedCurses.includes('hydration_debt');

  const currentWear = localStorage.getItem('startupWear') || currentProtectionLevel || 'none';

  if ($('sessionSetupProfileStep')) $('sessionSetupProfileStep').style.display = 'block';
  if ($('profileDetailsPanel')) $('profileDetailsPanel').style.display = 'none';
  if ($('diaperingSetup')) $('diaperingSetup').style.display = 'none';

  updateContinencePreview();
  $('sessionSetupBackdrop').style.display = 'block';
}

function closeSessionSetupModal() {
  $('sessionSetupBackdrop').style.display = 'none';
}

function selectProfileFromModal(profile) {
  const profileSelect = $('profileSelect');
  if (profileSelect) {
    profileSelect.value = profile;
  }

  profileMode = profile;
  localStorage.setItem('profileMode', profile);

  if (typeof applySelectedProfile === 'function') {
    applySelectedProfile();
  }
  
  // For babysitter, show diapering setup instead of closing the modal
  if (profile === 'babysitter') {
    const diaperingDiv = $('diaperingSetup');
    if (diaperingDiv) {
      diaperingDiv.style.display = 'block';
    }
  } else {
    closeSessionSetupModal();
    // Show profile-specific setup modal for other profiles
    setTimeout(() => showProfileSetupModal(profile), 300);
  }
}

function saveDiaperingSetup() {
  // Collect selected protection types
  const types = [];
  if ($('protPad')?.checked) types.push('pad');
  if ($('protPullups')?.checked) types.push('pullups');
  if ($('protDiapers')?.checked) types.push('diapers');
  if ($('protThick')?.checked) types.push('thick_diapers');
  
  if (types.length === 0) {
    toast('Please select at least one protection type');
    return;
  }
  
  protectionTypes = types;
  
  // Difficulty and continence are selected here.
  autoDifficulty = $('autoDifficulty')?.value || 'medium';
  currentContinenceLevel = $('continenceSelect')?.value || 'mostly_continent';

  // Read stash counts from setup inputs
  let anyStashEntered = false;
  for (const key of PROTECTION_HIERARCHY) {
    const input = $('setupStash_' + key);
    if (input && input.value !== '') {
      protectionStash[key] = Math.max(0, parseInt(input.value, 10) || 0);
      anyStashEntered = true;
    } else {
      protectionStash[key] = null; // unlimited
    }
  }
  stashTrackingEnabled = anyStashEntered;
  localStorage.setItem('stashTrackingEnabled', JSON.stringify(stashTrackingEnabled));
  saveStash();

  activeSymptoms = [];
  if ($('symOveractive')?.checked) activeSymptoms.push('overactive_bladder');
  if ($('symStress')?.checked) activeSymptoms.push('stress_incontinence');
  if ($('symUrge')?.checked) activeSymptoms.push('urge_incontinence');
  if ($('symNocturnal')?.checked) activeSymptoms.push('nocturnal_wetter');
  if ($('symGiggle')?.checked) activeSymptoms.push('giggle_incontinence');
  if ($('symDribble')?.checked) activeSymptoms.push('pre_void_dribble');

  activeCurses = [];
  if ($('curseStrict')?.checked) activeCurses.push('strict_sitter');
  if ($('curseNoPass')?.checked) activeCurses.push('no_free_passes');
  if ($('curseSlippery')?.checked) activeCurses.push('slippery_focus');
  if ($('curseHydration')?.checked) activeCurses.push('hydration_debt');

  // NPT mode toggle
  babysitterNPTMode = !!$('babysitterNPTToggle')?.checked;
  localStorage.setItem('babysitterNPTMode', JSON.stringify(babysitterNPTMode));
  
  // Start level is now inferred from selected protection options (lightest selected).
  const ordered = PROTECTION_HIERARCHY.filter((lvl) => types.includes(lvl));
  currentProtectionLevel = ordered[0] || types[0];
  
  // Store in localStorage
  localStorage.setItem('protectionTypes', JSON.stringify(protectionTypes));
  localStorage.setItem('currentProtectionLevel', currentProtectionLevel);
  localStorage.setItem('autoDifficulty', autoDifficulty);
  localStorage.setItem('currentContinenceLevel', currentContinenceLevel);
  localStorage.setItem('activeSymptoms', JSON.stringify(activeSymptoms));
  localStorage.setItem('activeCurses', JSON.stringify(activeCurses));
  
  // Reset progression counters for new session
  protectionSuccesses = 0;
  protectionFailures = 0;
  
  console.log('🛡️ Diapering Setup Saved:', {
    protectionTypes,
    currentProtectionLevel,
    autoDifficulty,
    currentContinenceLevel,
    activeSymptoms,
    activeCurses
  });
  
  // Close diapering setup AND the session backdrop, then show babysitter profile setup modal
  const diaperingDiv = $('diaperingSetup');
  if (diaperingDiv) diaperingDiv.style.display = 'none';
  $('sessionSetupBackdrop').style.display = 'none';
  
  renderStashUI();
  setTimeout(() => showProfileSetupModal('babysitter'), 300);
}

function toggleBioLogger() {
  const bioLogger = $('bioLoggerSection');
  if (bioLogger.style.display === 'none') {
    bioLogger.style.display = 'block';
  } else {
    bioLogger.style.display = 'none';
  }
}

function toggleSidebarSection(id) {
  const el = $(id);
  if (!el) return;
  const arrow = $(id + 'Arrow');
  if (el.style.display === 'none') {
    el.style.display = '';
    if (arrow) arrow.classList.remove('collapsed');
  } else {
    el.style.display = 'none';
    if (arrow) arrow.classList.add('collapsed');
  }
}

/* --- PROFILE SETUP MODAL --- */
function showProfileSetupModal(profile) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);';
  modal.id = 'profileSetupModal';
  
  let content = '';
  
  if (profile === 'dependent') {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #fab1a0; text-align:center;">
        <h2 style="color:#fab1a0; margin:0 0 10px 0;">👶 Constant Incontinence (Always Leaking)</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> This profile queues up bladder spasms before each major void. Your bladder learns to release frequently, training you for constant incontinence.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#fab1a0; font-weight:bold;">Queue Range (spasms before void)</span>
            <span style="color:#999; font-size:12px;">Min spasms: (1-3)</span>
            <input type="number" id="depQueueMin" min="1" max="3" value="2" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max spasms: (3-6)</span>
            <input type="number" id="depQueueMax" min="3" max="6" value="5" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#fab1a0; font-weight:bold;">Time Between Spasms</span>
            <span style="color:#999; font-size:12px;">Min minutes: (4-10)</span>
            <input type="number" id="depSpasmMin" min="4" max="10" value="8" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max minutes: (10-20)</span>
            <input type="number" id="depSpasmMax" min="10" max="20" value="15" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px;">
            <span style="color:#fab1a0; font-weight:bold;">Hydration Sips Per Event (2-8)</span>
            <span style="color:#999; font-size:12px;">Min sips: (1-4)</span>
            <input type="number" id="depSipMin" min="1" max="4" value="2" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max sips: (4-8)</span>
            <input type="number" id="depSipMax" min="4" max="8" value="5" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>

          <label style="display:flex; align-items:center; gap:8px; margin-top:15px; color:#cdd7e6;">
            <input type="checkbox" id="depDiuretics" checked>
            <span style="font-size:12px;">Include diuretics (coffee/soda/tea) in hydration?</span>
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('dependent')" style="width:100%; padding:12px; background:#fab1a0; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
  } else if (profile === 'npt') {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #fdcb6e; text-align:center;">
        <h2 style="color:#fdcb6e; margin:0 0 10px 0;">🌙 Not Potty Trained</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> A background simulator. Events trigger at your configured interval while your computer runs in the background. Perfect for extended play.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#fdcb6e; font-weight:bold;">Time Between Voids (minutes)</span>
            <span style="color:#999; font-size:12px;">Min: (30-60)</span>
            <input type="number" id="nptVoidMin" min="30" max="60" value="45" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (60-120)</span>
            <input type="number" id="nptVoidMax" min="60" max="120" value="90" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#fdcb6e; font-weight:bold;">Saturation Check Threshold (%)</span>
            <span style="color:#999; font-size:12px;">At what wetness % should you be prompted? (50-100)</span>
            <input type="number" id="nptSatThreshold" min="50" max="100" value="85" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:15px; color:#cdd7e6;">
            <input type="checkbox" id="nptMercy">
            <span style="font-size:12px;">Enable Mercy Mode (can escape accidents)?</span>
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px;">
            <span style="color:#fdcb6e; font-weight:bold;">Hydration Sips Per Event (2-8)</span>
            <span style="color:#999; font-size:12px;">Min: (1-4)</span>
            <input type="number" id="nptSipMin" min="1" max="4" value="2" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (4-8)</span>
            <input type="number" id="nptSipMax" min="4" max="8" value="5" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('npt')" style="width:100%; padding:12px; background:#fdcb6e; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
  } else if (profile === 'train_rookie') {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #7cc4ff; text-align:center;">
        <h2 style="color:#7cc4ff; margin:0 0 10px 0;">🧒 Struggle to Control (Beginner)</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> Training mode where you attempt to reach the bathroom before losing control. More forgiving success rates.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#7cc4ff; font-weight:bold;">Time Between Void Attempts (minutes)</span>
            <span style="color:#999; font-size:12px;">Min: (30-60)</span>
            <input type="number" id="rookieVoidMin" min="30" max="60" value="45" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (60-90)</span>
            <input type="number" id="rookieVoidMax" min="60" max="90" value="75" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#7cc4ff; font-weight:bold;">Likelihood of Making It (%)</span>
            <span style="color:#999; font-size:12px;">Success rate at bathroom: (40-70%)</span>
            <input type="number" id="rookieSuccessRate" min="40" max="70" value="60" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; align-items:center; gap:8px; color:#cdd7e6;">
            <input type="checkbox" id="rookieMercy" checked>
            <span style="font-size:12px;">Enable Mercy Mode?</span>
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('train_rookie')" style="width:100%; padding:12px; background:#7cc4ff; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
  } else if (profile === 'train_pro') {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #55efc4; text-align:center;">
        <h2 style="color:#55efc4; margin:0 0 10px 0;">💪 Retaining Control (Advanced)</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> Advanced training. Longer intervals, lower success rates. For experienced players only.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#55efc4; font-weight:bold;">Time Between Void Attempts (minutes)</span>
            <span style="color:#999; font-size:12px;">Min: (60-90)</span>
            <input type="number" id="proVoidMin" min="60" max="90" value="75" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (90-150)</span>
            <input type="number" id="proVoidMax" min="90" max="150" value="120" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#55efc4; font-weight:bold;">Likelihood of Making It (%)</span>
            <span style="color:#999; font-size:12px;">Success rate at bathroom: (20-50%)</span>
            <input type="number" id="proSuccessRate" min="20" max="50" value="35" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; align-items:center; gap:8px; color:#cdd7e6;">
            <input type="checkbox" id="proMercy">
            <span style="font-size:12px;">Enable Mercy Mode?</span>
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('train_pro')" style="width:100%; padding:12px; background:#55efc4; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
  } else if (profile === 'chaos_manual') {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #ff7675; text-align:center;">
        <h2 style="color:#ff7675; margin:0 0 10px 0;">🔥 Free-Form Challenges (Manual)</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> YOU are in control. Trigger events manually whenever you want. Create your own chaos.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px;">
            <span style="color:#ff7675; font-weight:bold;">Hydration Sips Per Event (2-8)</span>
            <span style="color:#999; font-size:12px;">Min: (1-4)</span>
            <input type="number" id="chaosSipMin" min="1" max="4" value="2" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (4-8)</span>
            <input type="number" id="chaosSipMax" min="4" max="8" value="6" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('chaos_manual')" style="width:100%; padding:12px; background:#ff7675; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
  } else if (profile === 'babysitter') {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #a29bfe; text-align:center;">
        <h2 style="color:#a29bfe; margin:0 0 10px 0;">👩‍🍼 Babysitter (Realistic Omorashi)</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> Timed hold cycles with babysitter checks, leak events, and manual slider updates. Your first setup choices and these timings now drive every cycle.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#a29bfe; font-weight:bold;">Main Hold Period Per Cycle (minutes)</span>
            <span style="color:#999; font-size:12px;">Min: (30-50)</span>
            <input type="number" id="babysitterSpasmsMin" min="30" max="50" value="40" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (50-90)</span>
            <input type="number" id="babysitterSpasmsMax" min="50" max="90" value="60" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#a29bfe; font-weight:bold;">Base Micro Events Per Cycle</span>
            <span style="color:#999; font-size:12px;">Continence and symptoms can add more on top of this base.</span>
            <input type="number" id="babysitterQueueMin" min="0" max="1" value="0" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (1-3)</span>
            <input type="number" id="babysitterQueueMax" min="1" max="3" value="2" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px;">
            <span style="color:#a29bfe; font-weight:bold;">Hydration Sips Per Reminder</span>
            <span style="color:#999; font-size:12px;">Min: (0-2)</span>
            <input type="number" id="babysitterSipMin" min="0" max="2" value="1" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (1-3)</span>
            <input type="number" id="babysitterSipMax" min="1" max="3" value="2" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('babysitter')" style="width:100%; padding:12px; background:#a29bfe; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
  } else if (profile === 'omorashi_hold') {
    // Omorashi already has its own detailed setup, just call that
    setTimeout(() => showOmorashiSetupModal(), 100);
    modal.remove();
    return;
  }
  
  modal.innerHTML = content;
  document.body.appendChild(modal);
}

function confirmProfileSetup(profile) {
  // Read values from setup modal
  const setupData = {};
  
  if (profile === 'dependent') {
    setupData.queueMin = parseInt($('depQueueMin').value) || 2;
    setupData.queueMax = parseInt($('depQueueMax').value) || 5;
    setupData.spasmsMin = parseInt($('depSpasmMin').value) || 8;
    setupData.spasmsMax = parseInt($('depSpasmMax').value) || 15;
    setupData.sipMin = parseInt($('depSipMin').value) || 2;
    setupData.sipMax = parseInt($('depSipMax').value) || 5;
    setupData.useDiuretics = $('depDiuretics').checked;
  } else if (profile === 'npt') {
    setupData.voidMin = parseInt($('nptVoidMin').value) || 45;
    setupData.voidMax = parseInt($('nptVoidMax').value) || 90;
    setupData.satThreshold = parseInt($('nptSatThreshold').value) || 85;
    setupData.mercy = $('nptMercy').checked;
    setupData.sipMin = parseInt($('nptSipMin').value) || 2;
    setupData.sipMax = parseInt($('nptSipMax').value) || 5;
  } else if (profile === 'train_rookie') {
    setupData.voidMin = parseInt($('rookieVoidMin').value) || 45;
    setupData.voidMax = parseInt($('rookieVoidMax').value) || 75;
    setupData.successRate = parseInt($('rookieSuccessRate').value) || 60;
    setupData.mercy = $('rookieMercy').checked;
  } else if (profile === 'train_pro') {
    setupData.voidMin = parseInt($('proVoidMin').value) || 75;
    setupData.voidMax = parseInt($('proVoidMax').value) || 120;
    setupData.successRate = parseInt($('proSuccessRate').value) || 35;
    setupData.mercy = $('proMercy').checked;
  } else if (profile === 'chaos_manual') {
    setupData.sipMin = parseInt($('chaosSipMin').value) || 2;
    setupData.sipMax = parseInt($('chaosSipMax').value) || 6;
  } else if (profile === 'babysitter') {
    setupData.spasmsMin = parseInt($('babysitterSpasmsMin').value) || 40;
    setupData.spasmsMax = parseInt($('babysitterSpasmsMax').value) || 60;
    setupData.queueMin = parseInt($('babysitterQueueMin').value) || 0;
    setupData.queueMax = parseInt($('babysitterQueueMax').value) || 2;
    setupData.sipMin = parseInt($('babysitterSipMin').value) || 1;
    setupData.sipMax = parseInt($('babysitterSipMax').value) || 2;
  }
  
  // Store setup data in localStorage
  localStorage.setItem(`${profile}_setup`, JSON.stringify(setupData));
  
  // Close modal and start session
  const modal = $('profileSetupModal');
  if (modal) document.body.removeChild(modal);
  
  startSession();

  // Fire startup bio-check so user sets their baseline right after session starts
  setTimeout(() => openStatusModal(null, true), 400);
}

// Debug function: Trigger a random micro based on current profile
function debugMicro() {
  if (!sessionRunning) {
    console.log('❌ Session not running. Start a session first.');
    return;
  }

  console.log(`🔄 Triggering random micro for profile: ${profileMode}`);

  if (profileMode === 'dependent') {
    console.log('👶 Dependent profile - triggering micro');
    triggerDependentMicro();
  } else if (profileMode === 'babysitter') {
    console.log('👩‍🍼 Babysitter profile - triggering micro');
    const evt = pick(MICRO_BABYSITTER_D20);
    const payload = createBabysitterLeakPayload('micro', evt.label || evt.desc);
    showBanner("⚠️ <b>SPASM</b>", "Oh no...", 'high');
    startChime(randInt(800, 1200));
    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(evt.guide, `<b>BABYSITTER MICRO:</b> ${evt.desc}`);
      emitBabysitterEvent('leak', { payload });
    }, 2000);
  } else if (profileMode === 'npt') {
    console.log('🌙 NPT profile - triggering random micro');
    const evt = pick(MICRO_DIAPER_D8);
    showBanner("⚠️ <b>BLADDER SPASM</b>", "Status uncertain...", 'high');
    startChime(randInt(800, 1200));
    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(evt.guide, `<b>MICRO EVENT:</b> ${evt.desc}`);
    }, 2000);
  } else if (profileMode.startsWith('train_')) {
    console.log(`💪 Training profile - triggering random micro`);
    const evt = pick(MICRO_TRAINING_D8);
    showBanner("⚠️ <b>BLADDER SPASM</b>", "Status uncertain...", 'high');
    startChime(randInt(800, 1200));
    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(evt.guide, `<b>MICRO EVENT:</b> ${evt.desc}`);
    }, 2000);
  } else if (profileMode === 'chaos_manual') {
    console.log('🔥 Chaos profile - triggering random micro');
    const evt = pick(MICRO_TRAINING_D8);
    showBanner("⚠️ <b>BLADDER SPASM</b>", "Status uncertain...", 'high');
    startChime(randInt(800, 1200));
    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(evt.guide, `<b>CHAOS MICRO:</b> ${evt.desc}`);
    }, 2000);
  } else if (profileMode === 'omorashi_hold') {
    console.log('💧 Omorashi profile - triggering stress test');
    scheduleNextOmorashiStressTest();
  } else {
    console.log('⚠️ Unknown profile:', profileMode);
  }
}

// Debug function: Show all active timers
function debugTimers() {
  const now = Date.now();
  console.log('=== ACTIVE TIMERS ===');
  console.log(`Current Profile: ${profileMode}`);
  console.log(`Session Running: ${sessionRunning}`);
  console.log('');
  
  // Main Timer (Macro Event)
  if (mainEndAt && mainEndAt > now) {
    const remaining = Math.ceil((mainEndAt - now) / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    console.log(`⏳ MAIN (Macro) Timer: ${mins}m ${secs}s`);
  } else if (mainEndAt) {
    console.log(`⏳ MAIN (Macro) Timer: EXPIRED`);
  } else {
    console.log(`⏳ MAIN (Macro) Timer: NOT SET`);
  }
  
  // Micro Timer
  if (microEndAt && microEndAt > now) {
    const remaining = Math.ceil((microEndAt - now) / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    console.log(`💦 MICRO Timer: ${mins}m ${secs}s`);
  } else if (microEndAt) {
    console.log(`💦 MICRO Timer: EXPIRED`);
  } else {
    console.log(`💦 MICRO Timer: NOT SET`);
  }
  
  // Hydration Timer
  if (hydrationEndAt && hydrationEndAt > now) {
    const remaining = Math.ceil((hydrationEndAt - now) / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    console.log(`💧 HYDRATION Timer: ${mins}m ${secs}s`);
  } else if (hydrationEndAt) {
    console.log(`💧 HYDRATION Timer: EXPIRED`);
  } else {
    console.log(`💧 HYDRATION Timer: NOT SET`);
  }
  
  // Dependent Queue (if applicable)
  if (profileMode === 'dependent') {
    console.log(`\n📊 Dependent Queue: ${depMicroCount}/${depMicroTarget}`);
  }
  
  console.log('===================');
}

/* --- OMORASHI MODE FUNCTIONS --- */
function showOmorashiSetupModal() {
  // Create modal for Omorashi setup
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);';
  modal.id = 'omorashiSetupModal';
  
  modal.innerHTML = `
    <div style="width:450px; background:#151923; padding:30px; border-radius:15px; border:2px solid #81ecec; text-align:center;">
      <h2 style="color:#81ecec; margin:0 0 20px 0;">⏱️ Omorashi Session Setup</h2>
      
      <div style="text-align:left; background:#1b2030; padding:15px; border-radius:8px; margin-bottom:15px;">
        <label style="display:block; color:#7cc4ff; font-weight:bold; margin-bottom:8px;">Hold Timer Range (minutes):</label>
        <div style="display:flex; gap:10px; margin-bottom:8px;">
          <input type="number" id="omorashiMinMin" min="5" max="120" value="45" style="flex:1; padding:8px; border-radius:8px; border:1px solid #2b3348; background:#0f141f; color:#fff;">
          <span style="align-self:center; color:#cdd7e6;">to</span>
          <input type="number" id="omorashiMinMax" min="5" max="120" value="90" style="flex:1; padding:8px; border-radius:8px; border:1px solid #2b3348; background:#0f141f; color:#fff;">
        </div>
        <span style="font-size:11px; color:#8ea0b6;">Random hold between min-max each session</span>
      </div>

      <div style="text-align:left; background:#1b2030; padding:15px; border-radius:8px; margin-bottom:15px;">
        <label style="display:block; color:#7cc4ff; font-weight:bold; margin-bottom:8px;">Sips Per Stress Test (range):</label>
        <div style="display:flex; gap:10px; margin-bottom:8px;">
          <input type="number" id="omorashiSipMin" min="1" max="4" value="1" style="flex:1; padding:8px; border-radius:8px; border:1px solid #2b3348; background:#0f141f; color:#fff;">
          <span style="align-self:center; color:#cdd7e6;">to</span>
          <input type="number" id="omorashiSipMax" min="1" max="4" value="3" style="flex:1; padding:8px; border-radius:8px; border:1px solid #2b3348; background:#0f141f; color:#fff;">
        </div>
        <span style="font-size:11px; color:#8ea0b6;">Random sips (50ml each) per stress test trigger</span>
      </div>

      <div style="text-align:left; background:#1b2030; padding:15px; border-radius:8px; margin-bottom:15px;">
        <label style="display:block; color:#7cc4ff; font-weight:bold; margin-bottom:8px;">Stress Test Frequency (minutes between):</label>
        <div style="display:flex; gap:10px; margin-bottom:8px;">
          <input type="number" id="omorashiStressTestMin" min="1" max="60" value="8" style="flex:1; padding:8px; border-radius:8px; border:1px solid #2b3348; background:#0f141f; color:#fff;">
          <span style="align-self:center; color:#cdd7e6;">to</span>
          <input type="number" id="omorashiStressTestMax" min="1" max="60" value="20" style="flex:1; padding:8px; border-radius:8px; border:1px solid #2b3348; background:#0f141f; color:#fff;">
        </div>
        <span style="font-size:11px; color:#8ea0b6;">Random interval (in minutes) between stress test triggers</span>
      </div>

      <div style="text-align:left; background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px;">
        <label style="display:block; color:#7cc4ff; font-weight:bold; margin-bottom:8px;">Permission Rate on Release:</label>
        <div style="display:flex; gap:10px; align-items:center;">
          <input type="range" id="omorashiPermRate" min="0" max="100" value="50" style="flex:1;">
          <span id="omorashiPermDisplay" style="color:#81ecec; font-weight:bold; width:50px;">50%</span>
        </div>
        <span style="font-size:11px; color:#8ea0b6;">Chance to get permission to release vs facing gauntlet</span>
      </div>

      <div style="display:flex; gap:10px;">
        <button onclick="cancelOmorashiSetup()" style="flex:1; padding:12px; border-radius:8px; background:#333; border:1px solid #2b3348; color:#fff; cursor:pointer;">Cancel</button>
        <button onclick="confirmOmorashiSetup()" style="flex:1; padding:12px; border-radius:8px; background:#81ecec; border:none; color:#000; font-weight:bold; cursor:pointer;">Start Session</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Update permission display on slider change
  $('omorashiPermRate').oninput = function() {
    $('omorashiPermDisplay').textContent = this.value + '%';
  };
}

function cancelOmorashiSetup() {
  const modal = $('omorashiSetupModal');
  if (modal) modal.remove();
}

function confirmOmorashiSetup() {
  const minVal = parseInt($('omorashiMinMin').value);
  const maxVal = parseInt($('omorashiMinMax').value);
  const sipMin = parseInt($('omorashiSipMin').value);
  const sipMax = parseInt($('omorashiSipMax').value);
  const stressMin = parseInt($('omorashiStressTestMin').value);
  const stressMax = parseInt($('omorashiStressTestMax').value);
  const permRate = parseInt($('omorashiPermRate').value);

  // Validate
  if (minVal >= maxVal) {
    alert('Hold timer min must be less than max');
    return;
  }
  if (sipMin >= sipMax) {
    alert('Sip min must be less than max');
    return;
  }
  if (stressMin >= stressMax) {
    alert('Stress test frequency min must be less than max');
    return;
  }

  // Store ranges
  omorashiHoldMinMins = minVal;
  omorashiHoldMaxMins = maxVal;
  omorashiSipMin = sipMin;
  omorashiSipMax = sipMax;
  omorashiStressTestMinMins = stressMin;
  omorashiStressTestMaxMins = stressMax;
  omorashiPermissionRate = permRate;

  // Close modal
  const modal = $('omorashiSetupModal');
  if (modal) modal.remove();

  // Start session
  startOmorashiSession();
}

function startOmorashiSession() {
  // Pick random hold duration and sips for this session
  const randomMinutes = randInt(omorashiHoldMinMins, omorashiHoldMaxMins);
  const randomSips = randInt(omorashiSipMin, omorashiSipMax);

  omorashiDurationMs = randomMinutes * 60000;
  currentOmorashiSipAmount = randomSips;

  // Show the "Can I go pee?" button
  $('btnCanIGo').style.display = 'block';

  // Start the session
  omorashiSessionActive = true;
  omorashiStartTime = Date.now();
  sessionRunning = true;

  logToOutput(`<span style="color:#81ecec"><b>💧 Omorashi Session Started</b><br>Hold duration: <b>${randomMinutes} minutes</b><br>Sips per stress test: <b>${randomSips}</b> (${randomSips * 50}ml)<br>Permission chance: <b>${omorashiPermissionRate}%</b></span>`);

  // Schedule first stress test using user-configured frequency
  scheduleNextOmorashiStressTest();

  // Schedule normal hydration timer (visible in countdown)
  scheduleNextHydration();

  // Update pressure over time
  tickInterval = setInterval(updateOmorashiPressure, 1000);
}

function updateOmorashiPressure() {
  if (!omorashiSessionActive || !omorashiStartTime) return;

  const elapsed = Date.now() - omorashiStartTime;
  const percentComplete = Math.min(100, (elapsed / omorashiDurationMs) * 100);
  
  // Pressure increases gradually over time
  manualPressure = Math.floor(percentComplete);
  updatePressureUI(manualPressure);

  // Check if time is up
  if (elapsed >= omorashiDurationMs) {
    omorashiSessionActive = false;
    clearInterval(tickInterval);
    clearTimeout(omorashiStressTestTimer);
    manualPressure = 100;
    updatePressureUI(100);
    logToOutput(`<span style="color:#ff6b6b"><b>⏰ Time's up! Maximum pressure reached (100%)</b></span>`);
    startChime(440); // Lower alarm frequency
  }
}

function scheduleNextOmorashiStressTest() {
  if (!omorashiSessionActive || omorashiGuideActive) return;

  // Use micro-frequency timing like other profiles (variable, ~20-40 sec range)
  // Extended to give guides time to complete before next test
  // User-configured stress test frequency (in minutes, converted to ms)
  const delayMs = randInt(omorashiStressTestMinMins * 60000, omorashiStressTestMaxMins * 60000);
  omorashiStressTestTimer = setTimeout(() => {
    if (!omorashiSessionActive) return;
    
    const test = pick(OMORASHI_HOLDING_GUIDES);
    
    logToOutput(`<span style="color:#81ecec"><b>🏋️ Stress Test:</b> ${test.label}<br>Focus on your control. Hold steady.</span>`);
    
    // Mark guide as active to prevent stacking
    omorashiGuideActive = true;
    
    // Show the guide
    startVoidGuide(test.guide, `<b>${test.label}</b><br>HOLD. Do not leak.`);
    
    // Wait for guide to complete before scheduling next test
    // Calculate guide duration (sum of all step times + buffers)
    const guideDurationMs = test.guide.reduce((sum, step) => sum + (step.time || 10), 0) * 1000 + 2000;
    
    setTimeout(() => {
      omorashiGuideActive = false;
      // Schedule next test only after this one completes
      scheduleNextOmorashiStressTest();
    }, guideDurationMs);
  }, delayMs);
}

function requestRestroomPermission() {
  if (profileMode === 'babysitter') {
    if (!sessionRunning) {
      toast("Session not active");
      return;
    }

    // Force bio-check first so babysitter has accurate data before deciding
    logToOutput(`<span style="color:#a29bfe;">👩‍🍼 Babysitter: "You want to go? Hold on, let me check you first."</span>`);
    openStatusModal(function() {
      stopChime();
      const baseChance = getBabysitterPottyChance();
      const urgencyBonus = manualPressure > 85 ? 10 : 0;
      const roll = Math.random() * 100;
      const allowed = roll < Math.min(95, baseChance + urgencyBonus);

      if (allowed) {
        logToOutput(`<span style="color:#55efc4;"><b>✅ Babysitter:</b> "Okay, potty break approved. Move now, no stalling." (${Math.round(baseChance + urgencyBonus)}% request chance)</span>`);
        trackDayEvent('potty_success');
        maybeAwardPottyPass('good_check');
        startVoidGuide(RESTROOM_DISPATCH, '👩‍🍼 <b>Potty Pass:</b> Go now and report back.');
        return;
      }

      if (pottyPasses > 0 && !hasCurse('no_free_passes')) {
        consumePottyPass('Emergency request override');
        logToOutput(`<span style="color:#81ecec;"><b>🎟️ Babysitter:</b> "Not yet... fine, use your emergency pass and go now."</span>`);
        startVoidGuide(RESTROOM_DISPATCH, '👩‍🍼 <b>Emergency Pass:</b> Go now and report back.');
        return;
      }

      const denyLeakRisk = hasSymptom('urge_incontinence') ? 0.55 : 0.35;
      logToOutput(`<span style="color:#ff7675;"><b>❌ Babysitter:</b> "Not yet. Hold it a little longer."</span>`);
      if (Math.random() < denyLeakRisk && manualPressure >= 40) {
        const payload = createBabysitterLeakPayload('spasm', 'Denied Request Spasm');
        emitBabysitterEvent('leak', { payload });
        logToOutput(`<span style="color:#fdcb6e;">💢 <b>Controlled Hold Fail:</b> Denial triggered a spasm while trying to hold.</span>`);
      }
    });
    return;
  }

  if (!omorashiSessionActive) {
    toast("Session not active");
    return;
  }

  const roll = Math.random() * 100;
  const hasPermission = roll < omorashiPermissionRate;

  if (hasPermission) {
    logToOutput(`<span style="color:#55efc4"><b>✅ Permission Granted!</b><br>You may go to the restroom and empty completely.</span>`);
    omorashiSessionActive = false;
    clearInterval(tickInterval);
    clearTimeout(omorashiStressTestTimer);
    startChime(880); // High frequency for success
    $('btnCanIGo').style.display = 'none';
  } else {
    logToOutput(`<span style="color:#ff6b6b"><b>❌ Permission Denied - Final Gauntlet!</b><br>You must complete a final challenge before release.</span>`);
    // Start the gauntlet
    startFinalGauntlet();
  }
}

function startFinalGauntlet() {
  const gauntlet = pick(OMORASHI_GAUNTLETS);
  
  startVoidGuide(gauntlet.guide, `<b>${gauntlet.name}</b><br>Complete this challenge. Then you may release.`);
  
  // After guide completes, allow release
  setTimeout(() => {
    logToOutput(`<span style="color:#55efc4"><b>✅ Gauntlet Complete!</b><br>Permission to void granted. Go pee.</span>`);
    omorashiSessionActive = false;
    $('btnCanIGo').style.display = 'none';
  }, 60000); // 60 second buffer for guide completion
}

function reportEmergencyOmorashiLeak() {
  if (!omorashiSessionActive) {
    toast("Omorashi session not active");
    return;
  }

  manualSaturation = 100;
  updateSaturationUI(100);
  logToOutput(`<span style="color:#ff6b6b"><b>💦 ACCIDENT!</b><br>You could not hold any longer. Saturation reset to 100%. Full release into protection.</span>`);
  
  // Stop the session
  omorashiSessionActive = false;
  clearInterval(tickInterval);
  clearTimeout(omorashiStressTestTimer);
  $('btnCanIGo').style.display = 'none';
  
  startChime(440); // Alarm sound
  toast("Accident recorded!");
}

let dailyChangeCount = 0;

function changeDiaper() {
  if (!changeAllowed && manualSaturation < 100) {
    alert("You haven't been granted a change yet.");
    return;
  }

  // Show change modal to let user pick what to change into
  showChangeModal();
}

function showChangeModal() {
  // Build a quick inline modal for choosing what to change into
  const opts = PROTECTION_HIERARCHY.map(p => {
    const label = formatProtectionLevel(p);
    const count = protectionStash[p];
    const countStr = !stashTrackingEnabled ? '' : count === null ? ' (∞)' : ` (${count} left)`;
    const disabled = stashTrackingEnabled && count !== null && count === 0;
    const selected = p === currentProtectionLevel ? ' selected' : '';
    return `<option value="${p}"${disabled ? ' disabled' : ''}${selected}>${label}${countStr}</option>`;
  }).join('');

  const html = `
    <div style="background:#1b2030; padding:20px; border-radius:12px; border:2px solid #a29bfe; max-width:400px; margin:auto;">
      <h3 style="color:#a29bfe; margin:0 0 12px 0;">🧷 Change Into...</h3>
      <select id="changeIntoSelect" style="width:100%; padding:10px; border-radius:8px; background:#151923; color:#fff; border:1px solid #2b3348; font-size:14px; margin-bottom:12px;">
        ${opts}
      </select>
      <div style="display:flex; gap:8px;">
        <button onclick="executeChange()" style="flex:1; padding:10px; background:#a29bfe; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">✨ Change</button>
        <button onclick="document.getElementById('changeModalBackdrop').style.display='none'" style="flex:1; padding:10px; background:#2b3348; color:#cdd7e6; border:none; border-radius:8px; cursor:pointer;">Cancel</button>
      </div>
    </div>`;

  let backdrop = $('changeModalBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'changeModalBackdrop';
    backdrop.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9500; display:flex; align-items:center; justify-content:center;';
    document.body.appendChild(backdrop);
  }
  backdrop.innerHTML = html;
  backdrop.style.display = 'flex';
}

function executeChange() {
  const sel = $('changeIntoSelect');
  const newProt = sel ? sel.value : currentProtectionLevel;

  // Hide modal
  const backdrop = $('changeModalBackdrop');
  if (backdrop) backdrop.style.display = 'none';

  // Check stash for the chosen protection
  if (stashTrackingEnabled && !hasStashFor(newProt)) {
    logToOutput(`<span style="color:#ff6b6b">❌ <b>Out of ${formatProtectionLevel(newProt)}!</b> No stock left.</span>`);
    toast("⚠️ Out of stock!");
    return;
  }

  // Update protection level
  currentProtectionLevel = newProt;
  localStorage.setItem('currentProtectionLevel', currentProtectionLevel);

  // Consume from stash
  consumeFromStash(currentProtectionLevel);

  // Increment the "Changes Used" counter
  dailyChangeCount++;
  $('changeCountDisplay').textContent = dailyChangeCount;

  // Reset all states
  manualSaturation = 0;
  manualPressure = 0;
  changeAllowed = false;
  updateSaturationUI(0);
  updatePressureUI(0);

  logToOutput(`<span style="color:#7cc4ff">✨ <b>Fresh Start:</b> Changed into a fresh ${formatProtectionLevel(currentProtectionLevel)}. Change #${dailyChangeCount} today. Try to make this one last!</span>`);

  renderStashUI();
  if (profileMode === 'babysitter') trackDayEvent('change');
  checkRegression();
  scheduleMainEvent();
}

function checkRegression() {
  // If already regressed or in Total Dependence, do nothing
  if (profileMode === 'npt' || profileMode === 'dependent') return;

  // Set limits based on the specific training tier
  let limit = 0;
  if (profileMode === 'train_rookie') {
    limit = 5; // Less slack for rookies
  } else if (profileMode === 'train_pro') {
    limit = 8; // Pros get more chances
  } else {
    return; // Exit for standard/early modes
  }

  if (dailyChangeCount >= limit) {
    alert("PULL-UP LIMIT REACHED: Supply room is locked.");

    profileMode = 'npt';
    $('profileSelect').value = 'npt';
    applySelectedProfile();

    logToOutput(`<span style="color:#d63031; font-size:1.2em; font-weight:bold;">🚫 REGRESSION: ${dailyChangeCount} pull-ups wasted today. You clearly aren't ready for big-kid underwear. Diapers only from now on.</span>`);

    dailyChangeCount = 0;
    saveState();
  }
}
let changeAllowed = false; // Global permission state

function checkChangeNecessity(currentSat) {
  let allowedChance = 0;

  // Weighted Odds based on Trainee needs
  if (currentSat < 40) {
    allowedChance = 0.15; // 5%
  } else if (currentSat < 50) {
    allowedChance = 0.30; // 20%
  } else if (currentSat < 75) {
    allowedChance = 0.60; // 50% (Average)
  } else {
    allowedChance = 0.95; // 95% (Almost guaranteed)
  }

  const changeBtn = $('btnChange');
  if (Math.random() < allowedChance) {
    changeAllowed = true;
    changeBtn.classList.remove('locked'); // Unlock the button
    logToOutput(`<span style="color:#55efc4">✅ <b>Change Allowed:</b> You've been given permission to get dry.</span>`);
  } else {
    changeAllowed = false;
    changeBtn.classList.add('locked'); // Keep it locked
    logToOutput(`<span style="color:#ff7675">🚫 <b>Change Denied:</b> You're told you can still use your padding. Stay in it.</span>`);
  }
}
function logDrink(ml) {
  toast(`Logged ${ml}ml`);
  logToOutput(`<span style="color:#7cc4ff">💧 Drink Logged: ${ml}ml. Update pressure slider if needed.</span>`);
}

function logToOutput(html) {
  const out = $('output');
  const div = document.createElement('div');
  div.style.borderTop = "1px solid #333";
  div.style.marginTop = "8px";
  div.style.paddingTop = "4px";
  div.innerHTML = html;
  out.prepend(div);
}

function setCountdownLabel() {
  const lbl = $('countdown');
  if (!lbl) return;

  // 1. Check if user wants to hide the timer
  // If the checkbox is missing, default to showing it (false)
  const hideBox = $('hideCountdown');
  const hidden = hideBox ? hideBox.checked : false;

  if (hidden) {
    lbl.textContent = sessionRunning ? "Running..." : "Stopped";
    return;
  }

  // 2. DEBUG DASHBOARD MODE
  const now = Date.now();
  let text = [];

  // --- A. Main Event Timer ---
  if (mainEndAt && mainEndAt > now) {
    const r = Math.ceil((mainEndAt - now) / 1000);
    const m = Math.floor(r / 60);
    const s = r % 60;
    text.push(`Event: ${m}m ${s}s`);
  } else if (sessionRunning) {
    text.push(`Event: NOW`);
  } else {
    text.push(`Event: --`);
  }

  // --- B. Queue Status (Dependent Mode Only) ---
  if (profileMode === 'dependent') {
    text.push(`Queue: ${depMicroCount}/${depMicroTarget}`);
  }

  // --- C. Hydration Timer ---
  if (hydrationEndAt && hydrationEndAt > now) {
    const r = Math.ceil((hydrationEndAt - now) / 1000);
    const m = Math.floor(r / 60);
    const s = r % 60;
    // Blue text for water to make it distinct
    text.push(`<span style="color:#7cc4ff">💧 ${m}m ${s}s</span>`);
  }

  // Join them with a visible separator
  lbl.innerHTML = text.join(' <span style="opacity:0.4; margin:0 5px;">|</span> ');
}

function showBanner(msg, hint, priority = 'low') {
  const b = $('alarmBanner');
  if (!b) return;

  // TRAFFIC CONTROL:
  // If banner is already showing...
  if (b.style.display === 'block') {
    // If the incoming message is just a Micro or Drink (low priority), 
    // discard it to prevent stacking/confusion.
    if (priority === 'low') {
      console.log("Skipped low priority event due to active banner.");
      return;
    }
    // If it's High Priority (Main Event), we let it overwrite.
  }

  $('alarmText').innerHTML = msg; // Use innerHTML to allow bolding
  b.style.display = 'block';

  // RESET: Always ensure the "Reveal" button is visible by default
  const btn = b.querySelector('.btn.ack');
  if (btn) btn.style.display = 'inline-block';
}
function hideBanner() { const b = $('alarmBanner'); if (b) b.style.display = 'none'; }
function acknowledgeAlarm() {
  // NEW: Handle Hydration logic first
  if (isHydrationPending) {
      hideBanner();
      stopChime();
      toast("Hydration Logged.");
      
      resetBannerUI(); // Restore button text
      isHydrationPending = false;
      return; 
  }

  // Standard Event Logic
  nextReveal();
}

function resetBannerUI() {
  const ackBtn = $('alarmBanner').querySelector('.btn.ack');
  const skipBtn = $('alarmBanner').querySelector('.btn.silence');
  
  if (ackBtn) ackBtn.textContent = "Reveal Now";
  if (skipBtn) skipBtn.textContent = "Skip";
}

function skipAlarm() {
  hideBanner();
  stopChime();

  // 1. Handle Hydration Refusal
  if (isHydrationPending) {
      logToOutput(`<span style="color:#ff6b6b">🚫 <b>Hydration Refused:</b> Order ignored. Compliance failure logged.</span>`);
      
      resetBannerUI();
      isHydrationPending = false;
      return;
  }

  // 2. Handle Event Skipping
  let eventSkipped = false;
  if (pendingMainEvent) {
    pendingMainEvent = null; 
    // If you skip a main event, we just schedule the next one.
    if (sessionRunning) scheduleMainEvent(); 
    eventSkipped = true;
  } else if (pendingAmbientEvent) {
    pendingAmbientEvent = null; 
    eventSkipped = true;
  }

  if (eventSkipped) {
    // Just a log note. No automatic penalty.
    logToOutput(`<span style="color:#fab1a0">🚫 <b>Event Skipped:</b> Urge suppressed manually.</span>`);
  }
}
function toggleMicroNoise() { microNoiseOn = !microNoiseOn; toast(`Micros: ${microNoiseOn ? 'ON' : 'OFF'}`); }
/* Replace the existing haveAccident line with this: */
function haveAccident() {
  // 1. Kill the current timer immediately
  clearTimeout(mainTimer);
  clearTimeout(preChimeTimer);
  clearTimeout(microTimer);

  // 2. Clear timer endpoints and reset micro state
  mainEndAt = null;
  microEndAt = null;
  microCountThisMain = 0;

  // 3. Force a Full Event
  pendingMainEvent = fullTable(d(20));
  pendingAmbientEvent = null;

  // 4. Trigger it
  nextReveal();

  // 5. Log the manual override
  logToOutput(`<span style="color:#ff6b6b; font-style:italic;">("I Cant hold it" Manual Accident Triggered)</span>`);
}

/* Init */
(function init() {
  bindBabysitterEventBus();

  if (activeCustomProfile?.runtime) {
    customProfileRuntime = activeCustomProfile.runtime;
    progressionUpgradeThreshold = customProfileRuntime.successThreshold || 3;
    progressionDowngradeThreshold = customProfileRuntime.failureThreshold || 2;
    profileMode = customProfileRuntime.baseProfile || profileMode;
  }

  // 1. Load Profile
  const sel = $('profileSelect');
  if (sel) { sel.value = profileMode; applySelectedProfile(); }

  updateContinencePreview();

  // 2. Load State & Resume if needed
  const shouldResume = loadState();
  if (shouldResume) {
    startSession(true);
  }

  // 3. Auto-save on slider changes
  $('pressureSlider').addEventListener('change', saveState);
  $('saturationSlider').addEventListener('change', saveState);

  // 4. FIX: Instant update for Timer Toggle
  const hideBox = $('hideCountdown');
  if (hideBox) {
    hideBox.addEventListener('change', setCountdownLabel);
  }

  // 5. Build Guide Selector
  initGuideSelector();

  // 6. Initialize Push-to-Leak and Stash UI
  initPushToLeakUI();
  renderStashUI();
})();

Object.assign(window, {
  nextReveal, acknowledgeAlarm, skipAlarm, startSession, stopAll,
  toggleMicroNoise, changeDiaper, haveAccident, applySelectedProfile,
  getUrgencyDesc, getUrgencyLevel, buildUrgencyTableHTML, showUrgencyRefTable, toggleUrgencyNeutral,
  updatePressureUI, updateSaturationUI, logDrink, toggleMeetingMode,
  showInfoModal, openCustomProfileEditor, saveCustomProfile, exportCustomProfile,
  importCustomProfile, applyCustomProfile, loadCustomProfileIntoEditor, deleteCustomProfile,
  openEventBuilder, refreshEventBuilder, eventBuilderPrev, eventBuilderNext,
  appendEventsFromBuilderJson, clearAppendedEventsForProfile, resetDisabledEventsForProfile,
  toggleCurrentEventDisabled, cloneCurrentEventToJson,
  openEventBuilderForProfile, exportEventBuilderState, importEventBuilderState,
  toggleSidebarSection,
  checkStatus: () => toast("Status Logged")
});


/* ---------- POTTY TRAINING ENGINE (v11) ---------- */

// 1. The Pre-Soak System (Random leaks while working)
function schedulePreSoak() {
  clearTimeout(preSoakTimer);
  if (!sessionRunning || !profileMode.startsWith('train_')) return;

  // Check every 15-25 mins
  const freq = randInt(15, 25);
  preSoakTimer = setTimeout(() => {
    if (!sessionRunning) return;
    triggerPreSoak();
    schedulePreSoak();
  }, freq * 60000);
}

function triggerPreSoak() {
  if (manualPressure < 30) return;

  const chance = (profileMode === 'train_rookie') ? 0.4 : 0.15;

  if (Math.random() < chance) {
    const amt = randInt(5, 10);
    
    // REMOVED: manualSaturation += amt;
    // REMOVED: updateSaturationUI...

    logToOutput(`<span style="color:#fab1a0">💧 <b>Oops:</b> You leaked a little. <b style="color:#fff; background:#fab1a0; color:#000; padding:1px 4px; border-radius:3px;">Action: Saturation +${amt}%</b></span>`);
    
    regressionLeaks++; 
    checkRegression();
  }
}

// 2. The Choice UI
function showTrainingChoice() {
  const b = $('alarmBanner');
  $('alarmText').innerHTML = "🚽 <b>URGE CRITICAL!</b> Do you try to run?";
  b.style.display = 'block';

  // Hide standard buttons, show Custom
  const oldBtns = b.querySelectorAll('button');
  oldBtns.forEach(btn => btn.style.display = 'none');

  let customDiv = $('trainingBtns');
  if (!customDiv) {
    customDiv = document.createElement('div');
    customDiv.id = 'trainingBtns';
    customDiv.style.marginTop = "5px";
    b.appendChild(customDiv);
  }

  // Calculate Risk for display
  let riskLabel = (manualPressure > 80) ? "(High Risk)" : "(Normal Risk)";
  if (holdPenaltyCount > 0) riskLabel = "(EXTREME RISK)";

  customDiv.innerHTML = `
        <button class="pill" onclick="resolvePottyCheck()" style="background:#fff; color:#000">🏃 Run to Potty ${riskLabel}</button>
        <button class="pill" onclick="extendHold()" style="background:#333; color:#fff; border:1px solid #777">✋ Hold (+5m)</button>
    `;
  customDiv.style.display = 'block';
}


function interruptForRestroom() {
  clearInterval(guideInterval);
  $('voidOverlay').style.display = 'none';

  isRestroomTrip = true; // Set the flag here
  manualPressure = 0;
  updatePressureUI(0);
  holdPenaltyCount = 0;

  logToOutput(`<span style="color:#55efc4">🏃 <b>RECOVERY:</b> You stopped the leak! Go finish in the potty.</span>`);
  startVoidGuide(RESTROOM_DISPATCH, "🏃 <b>FINISH IN POTTY:</b> You've recovered. Go now.");
}

function extendHold() {
  resetBanner();
  holdPenaltyCount++; // Increase difficulty for next time

  logToOutput(`<span style="color:#fab1a0">✋ <b>Holding It:</b> You struggle to focus. (Risk Level Up)</span>`);

  // Short Timer Extension (2-5 mins)
  scheduleMainEvent({ min: 2, max: 5 });
}

function resetBanner() {
  const b = $('alarmBanner');
  b.style.display = 'none';
  const custom = $('trainingBtns');
  if (custom) custom.style.display = 'none';

  // Restore standard buttons
  const oldBtns = b.querySelectorAll('button:not(#trainingBtns button)');
  oldBtns.forEach(btn => btn.style.display = 'inline-block');
  stopChime();
}

function checkRegression() {
  const limit = (profileMode === 'train_rookie') ? 5 : 8; // Rookies allowed 5 leaks, Pros 8

  if (regressionLeaks >= limit) {
    alert("TOO MANY ACCIDENTS: Regression Protocol Active.");

    // Force Profile Change
    profileMode = 'npt';
    $('profileSelect').value = 'npt';
    applySelectedProfile();

    logToOutput(`<span style="color:#d63031; font-size:1.2em; font-weight:bold;">🚫 REGRESSION: Diapers Required. Training Mode Disabled.</span>`);
    regressionLeaks = 0; // Reset
  }
}

let statusCheckInterval = null;

function scheduleForcedCheck() {
  clearInterval(statusCheckInterval);
  // Trigger every 15 minutes
  statusCheckInterval = setInterval(() => {
    if (sessionRunning && !$('voidOverlay').style.display === 'flex') {
      openStatusModal();
    }
  }, 15 * 60000);
}

function openStatusModal(callback, isStartup) {
  // Startup mode: show wear dropdown and different title
  const titleEl = $('bioCheckTitle');
  const descEl2 = $('bioCheckDesc');
  const wearRow = $('bioCheckWearRow');
  if (isStartup) {
    if (titleEl) titleEl.textContent = '🩹 Before You Start';
    if (descEl2) descEl2.textContent = 'Set your current baseline so the first events feel right.';
    if (wearRow) {
      wearRow.style.display = 'block';
      const wearSel = $('bioCheckWearSelect');
      if (wearSel) wearSel.value = currentProtectionLevel || 'none';
    }
  } else {
    if (titleEl) titleEl.textContent = '📝 Bio-Check';
    if (descEl2) descEl2.textContent = 'Confirm your current physical state to continue.';
    if (wearRow) wearRow.style.display = 'none';
  }

  // Sync current values
  $('modalPressureSlider').value = manualPressure;
  const lv = getUrgencyLevel(manualPressure);
  $('modalPressureVal').textContent = lv + '/10';
  const descEl = $('modalPressureDesc');
  if (descEl) descEl.textContent = getUrgencyDesc(lv, profileMode);
  $('modalSaturationSlider').value = manualSaturation;
  $('modalSaturationVal').textContent = manualSaturation + "%";

  // Populate urgency reference table for current profile (collapsed by default)
  const tableBody = $('modalUrgencyTableBody');
  if (tableBody) tableBody.innerHTML = buildUrgencyTableHTML(profileMode);
  const urgRef = $('modalUrgencyRef');
  if (urgRef) urgRef.style.display = 'none';

  $('statusModalBackdrop').style.display = 'block';

  // Store what function to run after the check is done
  window.postCheckCallback = callback;
  window._bioCheckIsStartup = !!isStartup;
}

function submitForcedCheck() {
  const newP = parseInt($('modalPressureSlider').value);
  const newS = parseInt($('modalSaturationSlider').value);

  // Handle wear selection from startup bio-check
  if (window._bioCheckIsStartup) {
    const wearSel = $('bioCheckWearSelect');
    if (wearSel) {
      const wear = wearSel.value;
      if (wear !== 'none') {
        currentProtectionLevel = wear;
        localStorage.setItem('currentProtectionLevel', currentProtectionLevel);
      }
      localStorage.setItem('startupWear', wear);
      renderStashUI();
    }
    window._bioCheckIsStartup = false;
  }

  updatePressureUI(newP);
  updateSaturationUI(newS);
  $('pressureSlider').value = newP;
  $('saturationSlider').value = newS;

  $('statusModalBackdrop').style.display = 'none';

  // Explicitly kill the looping alarm
  stopChime();

  logToOutput(`<span style="color:#a29bfe">📝 <b>Bio-Check Confirmed:</b> Urge ${getUrgencyLevel(newP)}/10 | Wetness ${newS}%</span>`);
  saveState();

  // Execute babysitter or other callback if present
  if (typeof window.postCheckCallback === 'function') {
    window.postCheckCallback();
    window.postCheckCallback = null;
    return; // Babysitter handles its own change logic
  }

  // Default change logic (non-babysitter)
  if (newS >= 30) {
    checkChangeNecessity(newS);
  } else {
    changeAllowed = false;
  }
}


/* --- UPDATED: Show Choice with Countdown --- */
function showTrainingChoice() {
  const b = $('alarmBanner');
  b.style.display = 'block';

  // 1. Calculate "Stamina" based on Pressure
  // If Pressure is 0, you get 45s. If Pressure is 100, you get 10s.
  reactionTimeLeft = Math.max(10, 45 - Math.floor(manualPressure / 3));

  // 2. Setup the Tick Loop
  clearInterval(reactionInterval);
  updateReactionBanner(); // Initial render

  reactionInterval = setInterval(() => {
    reactionTimeLeft--;
    updateReactionBanner();

    if (reactionTimeLeft <= 0) {
      // TIME'S UP -> FORCE ACCIDENT
      clearInterval(reactionInterval);

      // Log the specific failure cause
      logToOutput(`<span style="color:#ff6b6b">💥 <b>TOO SLOW:</b> You hesitated too long and lost it right there.</span>`);

      // Force the accident logic
      haveAccident();
    }
  }, 1000);

  // 3. Render Buttons (Custom UI)
  let customDiv = $('trainingBtns');
  if (!customDiv) {
    customDiv = document.createElement('div');
    customDiv.id = 'trainingBtns';
    customDiv.style.marginTop = "5px";
    b.appendChild(customDiv);
  }

  // Calculate Risk Label
  let riskLabel = "(Normal)";
  if (manualPressure > 80) riskLabel = "(High Risk)";
  if (holdPenaltyCount > 0) riskLabel = `(RISK +${holdPenaltyCount * 30}%)`;

  customDiv.innerHTML = `
        <button class="pill" onclick="resolvePottyCheck()" style="background:#fff; color:#000; font-weight:bold;">🏃 Run to Potty ${riskLabel}</button>
        <button class="pill" onclick="extendHold()" style="background:#333; color:#fff; border:1px solid #777">✋ Hold (+5m)</button>
    `;
  customDiv.style.display = 'block';

  // Hide standard buttons
  const oldBtns = b.querySelectorAll('button:not(#trainingBtns button)');
  oldBtns.forEach(btn => btn.style.display = 'none');
}

function updateReactionBanner() {
  // Updates the text dynamically
  const color = (reactionTimeLeft < 10) ? "#ff6b6b" : "#fff";
  $('alarmText').innerHTML = `🚽 <b>URGE CRITICAL!</b> <span style="color:${color}">Failure in ${reactionTimeLeft}s...</span>`;
}

/* Replaces existing resolvePottyCheck in app.js */
function resolvePottyCheck() {
  clearInterval(reactionInterval); 
  resetBanner();

  let successChance = (profileMode === 'train_pro') ? 70 : 35;
  if (manualPressure > 80) successChance -= 20;
  successChance -= (holdPenaltyCount * 15); 

  const roll = Math.random() * 100;

  // --- OUTCOME 1: SUCCESS (Dry) ---
  if (roll < successChance) {
    isRestroomTrip = true;
    
    // Just the dispatch. No specific instructions.
    const successGuide = [
       { text: "GO TO TOILET", time: 0, type: "stop" }
    ];

    logToOutput(`<div style="border:1px solid #55efc4; padding:8px; border-radius:5px; margin-top:5px;">
        <span style="color:#55efc4; font-weight:bold;">🌟 POTTY SUCCESS</span><br>
        <span style="font-size:0.9em; color:#ccc;">You caught the urge in time.</span>
        <br><br>
        <b style="color:#fff; background:#55efc4; color:#000; padding:2px 6px; border-radius:4px;">ACTION: Go to restroom & Update Bio-Logger.</b>
        
        <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="pill" onclick="startVoidGuide(${JSON.stringify(successGuide).replace(/"/g, '&quot;')}, '🚽 <b>The Try:</b> Go use the potty.', 'full')">
               🏃 Run to Potty
            </button>
            <button class="pill" onclick="triggerPottyTrainingRule()" style="border-color:#fab1a0; color:#fab1a0;">
               🤔 I don't have to go...
            </button>
        </div>
    </div>`);

    holdPenaltyCount = 0;
    return;
  }

  // --- FAILURE LOGIC ---
  let majorThreshold = (manualPressure > 75) ? 60 : 25; 
  majorThreshold += (holdPenaltyCount * 50); 

  const failRoll = Math.random() * 100;
  let guideSeq = [];
  let failDesc = "";
  let typeStr = "full";

  if (failRoll < majorThreshold) {
    /* --- OUTCOME 2: MACRO FAILURE (Partial or Total) --- */
    const scenario = pick(FULL_TRAINING_FAILURES);
    
    failDesc = scenario.flow;
    guideSeq = scenario.guide;
    const isPartial = scenario.partial === true;

    // LOGGING ONLY - NO AUTOMATIC UPDATES
    if (isPartial) {
        logToOutput(`<span style="color:#fdcb6e">💦 <b>PARTIAL FAILURE:</b> ${scenario.flow}</span>`);
        logToOutput(`<span style="color:#fdcb6e; border:1px solid #fdcb6e; padding:4px; display:block; margin-top:4px; text-align:center;">
          ⚠️ <b>PARTIAL LEAK</b><br>Update Pressure & Saturation sliders to match.
        </span>`);
        // Reschedule sooner because you aren't empty
        scheduleMainEvent({ min: 15, max: 25 });
    } else {
        logToOutput(`<span style="color:#ff6b6b">💦 <b>TOTAL FAILURE:</b> ${scenario.flow}</span>`);
        logToOutput(`<span style="color:#ff6b6b; border:1px solid #ff6b6b; padding:4px; display:block; margin-top:4px; text-align:center;">
          🚨 <b>TOTAL LOSS</b><br>Update Pressure & Saturation sliders to match.
        </span>`);
        scheduleMainEvent();
    }

    regressionLeaks += 2;
    checkRegression();
    
  } else {
    /* --- OUTCOME 3: MICRO-FAIL (Walk of Shame) --- */
    const micro = microTableForMode(rollMicroForMode());
    failDesc = micro.desc;
    typeStr = "micro";

    // Guide: Micro -> Recover(Hold) -> DISPATCH TO TOILET
    const recoverTime = randInt(20, 40);
    
    guideSeq = [
        ...micro.guide, // The leak happening
        { text: "RECOVER & HOLD", time: recoverTime, type: "stop" }, // The struggle
        { text: "GO TO TOILET", time: 0, type: "stop" } // Dispatch
    ];

    logToOutput(`<span style="color:#fdcb6e">⚠️ <b>CLOSE CALL:</b> You leaked slightly during the urge.</span>`);
    logToOutput(`<span style="color:#fdcb6e; font-size:0.9em; font-style:italic;">"${micro.desc}"</span>`);

    logToOutput(`<span style="color:#fdcb6e; border:1px solid #fdcb6e; padding:4px; display:block; margin-top:4px; text-align:center;">
      ⚠️ <b>ACCIDENT & RECOVERY</b><br>Update sliders manually -> Go to Restroom.
    </span>`);

    isRestroomTrip = true;
    regressionLeaks++;
    checkRegression();
  }

  // Launch the Guide
  if (guideSeq) {
      startVoidGuide(guideSeq, `⚠️ <b>Loss of Control:</b> ${failDesc}`, typeStr);
  }

  holdPenaltyCount = 0; 
}


function extendHold() {
  clearInterval(reactionInterval); // STOP THE COUNTDOWN
  resetBanner();

  holdPenaltyCount++;

  // Calculate total time delayed for the log
  const totalDelay = holdPenaltyCount * 5;

  logToOutput(`<span style="color:#fab1a0">✋ <b>Holding It (+5m):</b> Total delay: ${totalDelay} mins. (Macro Risk: High)</span>`);

  // Short Timer Extension (2-5 mins)
  scheduleMainEvent({ min: 2, max: 5 });
}

let emergencyLeakCount = 0;

function reportEmergencyLeak() {
  if (profileMode === 'babysitter') {
    logToOutput(`<span style="color:#ff7675;">⚠️ <b>You to Babysitter:</b> "I had an accident..." Babysitter checks you immediately.</span>`);
    openStatusModal(function() {
      stopChime();
      const capacity = getMainProtectionCapacity();
      const leakThrough = manualSaturation > capacity;
      babysitterFailureCount++;
      protectionFailures++;
      protectionSuccesses = 0;
      babysitterDryStreak = 0;

      if (leakThrough) {
        logToOutput(`<span style="color:#ff7675;">😨 Babysitter: "Oh no, you've leaked through completely. This ${formatProtectionLevel(currentProtectionLevel)} can't handle any more."</span>`);
        checkBabysitterProgression('major_accident');
      } else {
        logToOutput(`<span style="color:#fdcb6e;">😟 Babysitter: "I can feel it, you definitely had an accident in there. We'll keep an eye on it."</span>`);
        checkBabysitterProgression('accident');
      }
      updateBabysitterUI();
    });
    return;
  }

  // Manually pushing saturation to an "overflow" state
  manualSaturation = 110;
  updateSaturationUI(110);

  logToOutput(`<span style="color:#ff7675">⚠️ <b>ADMISSION:</b> You admitted to a leak. Reporting for Bio-Check immediately.</span>`);

  // Force the Bio-Check modal to confirm the wetness
  openStatusModal();
}

function checkOverflowSaturation(val) {
  let s = parseInt(val);
  if (s >= 110) {
    logToOutput(`<span style="color:#d63031">🚨 <b>OVERFLOW:</b> Your protection has failed. You are leaking now!</span>`);
    regressionLeaks += 2; // Heavy penalty for allowing an overflow
    checkRegression(); // Check if this forces a move back to diapers

    // Grant immediate permission to change because of the mess
    changeAllowed = true;
    const changeBtn = $('btnChange');
    if (changeBtn) changeBtn.classList.remove('locked');
  }
}

function scheduleDependentEvent() {
  clearTimeout(mainTimer);
  clearTimeout(preChimeTimer); // Ensure NO warning sound exists

  // 1. Fatigue Logic
  const hoursActive = (Date.now() - sessionStartTime) / (1000 * 60 * 60);
  const isFatigued = hoursActive >= 2.0;

  // 2. Timer Window - Use custom settings from setup modal
  const min = isFatigued ? Math.max(depSpasmMin / 2, 4) : depSpasmMin;
  const max = isFatigued ? Math.max(depSpasmMax / 2, 10) : depSpasmMax;

  let nextType = (depMicroCount >= depMicroTarget) ? 'full' : 'micro';
  const minutes = randInt(min, max);

  // 3. UI Update
  mainEndAt = Date.now() + (minutes * 60000);

  const statusText = nextType === 'micro' ? "Bladder Spasm" : "Bladder Spasm";
  //logToOutput(`<span class="muted">⏳ <b>Dependent Cycle:</b> ${statusText} in ~${minutes}m. (No Warning)</span>`);

  // 4. Arm the Timer (NO PRE-CHIME)
  mainTimer = setTimeout(() => {
    if (!sessionRunning) return;
    (nextType === 'micro') ? triggerDependentMicro() : triggerDependentMacro();
  }, minutes * 60000);

  saveState();
}

function triggerDependentMacro() {
  // Reset Queue
  depMicroCount = 0;
  depMicroTarget = randInt(3, 6);

  const evt = fullTable(d(20));

  showBanner("🌊 <b>BLADDER FAILURE</b>", "Total release incoming...", 'high');
  startChime(880);

  setTimeout(() => {
    acknowledgeAlarm();
    startVoidGuide(evt.guide, `<b>TOTAL RELEASE:</b> ${evt.desc}`);
    
    logToOutput(`<span style="color:#ff6b6b; border:1px solid #ff6b6b; padding:4px; display:block; margin-top:4px; text-align:center;">
      🌊 <b>FLOOD LOG</b><br>Update Bio-Logger to reflect total loss.
    </span>`);
  }, 2000);

  // Heavy Saturation Add
  manualSaturation += randInt(20, 35);
  updateSaturationUI(manualSaturation);

  scheduleDependentEvent();
}




/* ===========================
   BIO-ADAPTIVE ENGINE (Non-Destructive)
   =========================== */

let assessmentStartTime = null;
let assessmentInterval = null;

// NEW: Global Bio State
window.playerBio = {
  active: false,
  realCapacity: 500,
  processingSpeed: 10,
  virtualCapacity: 300,
  virtualMaxTime: 30,
  label: "Child"
};

function startAssessment() {
  $('assessmentIntro').style.display = 'none';
  $('assessmentRunning').style.display = 'block';
  assessmentStartTime = Date.now();
  assessmentInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - assessmentStartTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    $('assessmentTimer').textContent = `${m}:${s}`;
  }, 1000);
}

function stopAssessment() {
  clearInterval(assessmentInterval);
  window.tempHoldTime = (Date.now() - assessmentStartTime) / 60000;
  $('assessmentRunning').style.display = 'none';
  $('assessmentInput').style.display = 'block';
}

function calculateBaseline() {
  const ml = parseInt($('measuredCapacity').value);
  if (!ml || ml < 0) { alert("Invalid volume."); return; }
  const minutes = window.tempHoldTime || 30;
  const speed = ml / minutes;

  window.tempBioData = { ml, minutes, speed };

  $('assessmentInput').style.display = 'none';
  $('assessmentTarget').style.display = 'block';
  $('baselineReport').innerHTML = `Real Capacity: <b>${ml}ml</b> | Speed: <b>${speed.toFixed(1)} ml/min</b>`;
}

function finalizeProfile(targetCap, label) {
  const data = window.tempBioData;
  const newMaxTime = targetCap / data.speed;

  window.playerBio = {
    active: true,
    realCapacity: data.ml,
    processingSpeed: data.speed,
    virtualCapacity: targetCap,
    virtualMaxTime: newMaxTime,
    label: label
  };

  $('assessmentTarget').style.display = 'none';
  $('assessmentResult').style.display = 'block';
  $('resultAge').textContent = `Target: ${label} (${targetCap}ml)`;
  $('resultText').innerHTML = `Based on your speed, filling a ${targetCap}ml bladder takes <b>${newMaxTime.toFixed(0)} mins</b>.`;
}

function activateBioProfile() {
  // 1. Add the option to the dropdown if it doesn't exist
  const sel = $('profileSelect');
  let opt = sel.querySelector('option[value="bio_custom"]');
  if (!opt) {
    opt = document.createElement('option');
    opt.value = "bio_custom";
    opt.textContent = `Bio-Adaptive (${window.playerBio.label})`;
    sel.appendChild(opt);
  } else {
    opt.textContent = `Bio-Adaptive (${window.playerBio.label})`;
  }

  // 2. Select it
  sel.value = "bio_custom";
  applySelectedProfile(); // This sets profileMode = 'bio_custom'

  // 3. Close panel
  $('assessmentResult').parentElement.style.display = 'none';
  scheduleMainEvent(); // Kickstart the new logic
}

/* ---------- Info / Nerd Stats System ---------- */
function showInfoModal(sectionKey) {
  const body = $('infoModalBody');
  const backdrop = $('infoModalBackdrop');
  if (!body || !backdrop) return;

  const sections = {
    intro: {
      title: 'Welcome - Quick Intro',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>This sim is a timed <b>ABDL / omorashi routine helper</b>. You choose a profile, follow prompts, and keep your sliders honest so the pacing matches your real urgency.</p>

          <h3 style="color:#74b9ff; margin:14px 0 6px;">How to use (2-minute version)</h3>
          <ol style="margin:0; padding-left:18px;">
            <li>Press <b>Start Session</b> and pick a profile.</li>
            <li>When a banner appears, press <b>Reveal</b> and follow the guide steps.</li>
            <li>Update <b>Pressure</b> and <b>Saturation</b> whenever your body/protection changes.</li>
            <li>Use <b>Change</b> when permitted (or at 100% saturation).</li>
            <li>Repeat the loop and let progression adjust your protection over time.</li>
          </ol>

          <h3 style="color:#74b9ff; margin:14px 0 6px;">Best first run</h3>
          <p>Try <b>Rookie</b> or <b>Babysitter</b>, keep mercy on, and run 20-30 minutes. Focus on learning how guides feel before increasing difficulty.</p>

          <div style="margin-top:12px; padding:10px 12px; background:#1b2030; border-radius:8px; border-left:3px solid #a29bfe;">
            <div style="color:#a29bfe; font-weight:bold; margin-bottom:4px; font-size:12px;">GOOD PRACTICE</div>
            <div style="font-size:13px;">Treat the sliders as your "truth feed." The better your inputs, the better the pacing feels.</div>
          </div>
        </div>
      `
    },
    howtoplay: {
      title: 'How To Play',
      html: `
        <div style="line-height:1.7; color:#cdd7e6; font-size:14px;">
          <p><b style="color:#a29bfe;">ABDL Bladder Sim</b> runs timed prompts in the background while you do your normal activities. You respond to guides, update your state, and let your profile shape the intensity.</p>

          <h3 style="color:#74b9ff; margin:16px 0 6px;">How to use</h3>
          <ol style="margin:0; padding-left:18px;">
            <li>Start a session and pick your profile.</li>
            <li>When an alarm appears, reveal and follow the on-screen step guide.</li>
            <li>After guides, update pressure/saturation to match your current state.</li>
            <li>Handle changes, hydration, and permissions as prompted.</li>
          </ol>

          <h3 style="color:#74b9ff; margin:16px 0 6px;">What each event means</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:10px;">
            <tr><th style="text-align:left; padding:5px 8px; color:#8ea0b6; border-bottom:1px solid #2b3348;">Type</th><th style="text-align:left; padding:5px 8px; color:#8ea0b6; border-bottom:1px solid #2b3348;">What you do</th></tr>
            <tr><td style="padding:5px 8px; color:#55efc4;">Micro Event</td><td style="padding:5px 8px;">Short leak/twinge. Follow steps and continue.</td></tr>
            <tr><td style="padding:5px 8px; color:#ff7675;">Full Event</td><td style="padding:5px 8px;">Longer accident/release guide. Usually followed by status updates.</td></tr>
            <tr><td style="padding:5px 8px; color:#81ecec;">Hydration</td><td style="padding:5px 8px;">Log sips as prompted so pacing stays accurate.</td></tr>
            <tr><td style="padding:5px 8px; color:#a29bfe;">Bio-Check</td><td style="padding:5px 8px;">Report pressure and saturation honestly.</td></tr>
          </table>

          <h3 style="color:#74b9ff; margin:16px 0 6px;">Profile quick picks</h3>
          <p><b style="color:#fab1a0;">Dependent</b> — No control. A queue of spasms fires before every full release. Pure regression loop.<br>
          <b style="color:#fdcb6e;">NPT</b> — Background sim. Voids happen automatically when your saturation threshold is reached. Hands-off.<br>
          <b style="color:#7cc4ff;">Rookie</b> — easiest training start, balanced challenge.<br>
          <b style="color:#55efc4;">Pro</b> — harder holds and lower success.<br>
          <b style="color:#ff7675;">Chaos</b> — You manually trigger events. Full creative control.<br>
          <b style="color:#a29bfe;">Babysitter</b> — full caregiver loop with progression.</p>

          <h3 style="color:#74b9ff; margin:16px 0 6px;">💡 Tips</h3>
          <ul style="margin:0; padding-left:18px;">
            <li>Adjust sliders whenever your real feeling changes, not only when prompted.</li>
            <li>Use Event Browser to preview guides before running a long session.</li>
            <li>If step timing feels too strict, keep Push-to-Leak off at first.</li>
          </ul>
        </div>
        <div style="margin-top:18px;">
          <button onclick="tryTutorialEvent()" style="padding:10px 20px; background:#a29bfe; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer; font-size:14px;">▶ Try the Tutorial Event</button>
        </div>
      `
    },
    session: {
      title: 'Session Control - How To Use',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>This is where you start, stop, and manage your active routine.</p>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">How to use</h3>
          <ul style="margin:0; padding-left:18px;">
            <li><b>Start Session</b>: choose profile and settings, then begin timed events.</li>
            <li><b>Stop</b>: end current run and clear active loops.</li>
            <li><b>Pause Alarm (30m)</b>: quiets interactions and temporarily locks change actions.</li>
            <li><b>Resume Alarm</b>: return to normal prompts before 30 minutes if needed.</li>
          </ul>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">When to use Pause Alarm</h3>
          <p>Use it during meetings, calls, or errands when you need a predictable quiet window.</p>
          <div style="margin-top:10px; padding:10px 12px; background:#1b2030; border-radius:8px; border-left:3px solid #fab1a0;">
            <div style="font-size:13px;"><b>Tip:</b> Start sessions only when you can respond to alarms and guides within a few minutes.</div>
          </div>
        </div>
      `
    },
    bio: {
      title: 'Bio-Logger - How To Use',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>Think of this panel as your <b>truth meter</b>. Use it to tell the sim what your body and protection currently feel like.</p>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">How to use</h3>
          <ul style="margin:0; padding-left:18px;">
            <li><b>Pressure</b> = urge intensity.</li>
            <li><b>Saturation</b> = how wet your current protection feels.</li>
            <li>Update both after events, leaks, and major body changes.</li>
            <li>If you feel a sudden spike, move pressure up right away.</li>
          </ul>

          <h3 style="color:#74b9ff; margin:12px 0 6px;">Pressure guide (1-10 scale)</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr><th style="text-align:left; padding:5px 8px; border-bottom:1px solid #2b3348; color:#8ea0b6;">Level</th><th style="text-align:left; padding:5px 8px; border-bottom:1px solid #2b3348; color:#8ea0b6;">Approx %</th><th style="text-align:left; padding:5px 8px; border-bottom:1px solid #2b3348; color:#8ea0b6;">How it feels</th></tr>
            <tr><td style="padding:5px 8px;">1-2</td><td style="padding:5px 8px;">0-20%</td><td style="padding:5px 8px;">Comfortable, no urgency.</td></tr>
            <tr><td style="padding:5px 8px;">3-4</td><td style="padding:5px 8px;">25-40%</td><td style="padding:5px 8px;">Aware, but easy to ignore.</td></tr>
            <tr><td style="padding:5px 8px;">5</td><td style="padding:5px 8px;">50%</td><td style="padding:5px 8px;">Clear urge, events begin accelerating.</td></tr>
            <tr><td style="padding:5px 8px;">6-7</td><td style="padding:5px 8px;">60-75%</td><td style="padding:5px 8px;">Holding effort needed, occasional dribbles possible.</td></tr>
            <tr><td style="padding:5px 8px;">8</td><td style="padding:5px 8px;">80%</td><td style="padding:5px 8px;">Strong urgency, small leaks likely.</td></tr>
            <tr><td style="padding:5px 8px;">9</td><td style="padding:5px 8px;">90%</td><td style="padding:5px 8px;">Emergency zone, accident risk is high.</td></tr>
            <tr><td style="padding:5px 8px;">10</td><td style="padding:5px 8px;">95-100%</td><td style="padding:5px 8px;">On the edge / actively losing control.</td></tr>
          </table>

          <h3 style="color:#74b9ff; margin:12px 0 6px;">Saturation quick guide</h3>
          <p>0-30% lightly used, 40-70% noticeably wet, 80%+ heavy and squishy, 100% = change now.</p>
        </div>
      `
    },
    protection: {
      title: 'Protection - How To Use',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>This panel tracks what you are wearing and, if enabled, how much stock you have left.</p>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">How to use</h3>
          <ul style="margin:0; padding-left:18px;">
            <li>Pick your current protection in the dropdown.</li>
            <li>Enable <b>Track</b> if you want finite inventory gameplay.</li>
            <li>Use stash +/- when you restock or consume outside the app.</li>
          </ul>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">Protection levels</h3>
          <p><b>Pad</b> -> <b>Pullups</b> -> <b>Diapers</b> -> <b>Thick Diapers</b> (lightest to heaviest).</p>
          <p>Good cycles can move you lighter, repeated failures can move you heavier in progression modes.</p>
        </div>
      `
    },
    maintenance: {
      title: 'Maintenance - How To Use',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>Maintenance is your direct control area for changes and emergency actions.</p>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">How to use</h3>
          <ul style="margin:0; padding-left:18px;">
            <li><b>Change Diaper</b>: use when granted, or when saturation reaches 100%.</li>
            <li><b>Force Release</b>: manual full event. Use for roleplay choice or if you choose not to hold.</li>
            <li><b>Mercy</b>: easier recovery path in some profiles. Toggle to match your desired intensity.</li>
          </ul>
          <div style="margin-top:10px; padding:10px 12px; background:#1b2030; border-radius:8px; border-left:3px solid #ff7675;">
            <div style="font-size:13px;"><b>Note:</b> Force Release is intentionally powerful and can spike saturation quickly.</div>
          </div>
        </div>
      `
    },
    pushtoleak: {
      title: 'Push-to-Leak - How To Use',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>Push-to-Leak makes release steps interactive instead of fully automatic.</p>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">How to use</h3>
          <ul style="margin:0; padding-left:18px;">
            <li>Turn it on to require press/hold during release-focused guide steps.</li>
            <li>Keep it off for passive timed guides.</li>
            <li>Use <b>Skip long leaks (&gt;10s)</b> if long steps feel too hand-heavy.</li>
          </ul>
          <p>Best for players who want stronger step-by-step involvement.</p>
        </div>
      `
    },
    profiles: {
      title: 'Profiles - What To Pick',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
        <p>Pick your profile based on intensity and control style.</p>

        <h4>Dependent (Constant Incontinence)</h4>
        <p>Passive regression loop with repeated leaks and unavoidable full releases.</p>
        <button onclick="openEventBuilderForProfile('dependent')" style="margin:4px 0 10px 0; padding:6px 10px; background:#fab1a0; color:#000; border:none; border-radius:8px; cursor:pointer;">View Dependent Event Tables</button>

        <h4>NPT (Background Simulator)</h4>
        <p>Hands-off passive profile. Good for longer background sessions.</p>
        <button onclick="openEventBuilderForProfile('npt')" style="margin:4px 0 10px 0; padding:6px 10px; background:#fdcb6e; color:#000; border:none; border-radius:8px; cursor:pointer;">View NPT Event Tables</button>

        <h4>Rookie (Struggle to Control)</h4>
        <p>Beginner-friendly hold profile with room to learn.</p>
        <button onclick="openEventBuilderForProfile('train_rookie')" style="margin:4px 0 10px 0; padding:6px 10px; background:#7cc4ff; color:#000; border:none; border-radius:8px; cursor:pointer;">View Rookie Event Tables</button>

        <h4>Pro (Retaining Control)</h4>
        <p>Harder hold profile with less forgiveness and stronger failures.</p>
        <button onclick="openEventBuilderForProfile('train_pro')" style="margin:4px 0 10px 0; padding:6px 10px; background:#55efc4; color:#000; border:none; border-radius:8px; cursor:pointer;">View Pro Event Tables</button>

        <h4>Chaos (Manual Trigger)</h4>
        <p>You trigger events manually. Great for custom pacing and scene control.</p>
        <button onclick="openEventBuilderForProfile('chaos_manual')" style="margin:4px 0 10px 0; padding:6px 10px; background:#ff7675; color:#000; border:none; border-radius:8px; cursor:pointer;">View Chaos Event Tables</button>

        <h4>Omorashi Hold</h4>
        <p>Classic hold challenge with stress tests and release outcomes.</p>
        <button onclick="openEventBuilderForProfile('omorashi_hold')" style="margin:4px 0 10px 0; padding:6px 10px; background:#81ecec; color:#000; border:none; border-radius:8px; cursor:pointer;">View Omorashi Event Tables</button>

        <h4>Babysitter (Realistic Omorashi)</h4>
        <p>Most complete mode: permissions, accidents, progression, and caregiver flavor.</p>
        <button onclick="openEventBuilderForProfile('babysitter')" style="margin:4px 0 10px 0; padding:6px 10px; background:#a29bfe; color:#000; border:none; border-radius:8px; cursor:pointer;">View Babysitter Event Tables</button>
        <div style="margin-top:10px; padding:10px 12px; background:#1b2030; border-radius:8px; border-left:3px solid #74b9ff;">
          <div style="font-size:13px;"><b>Not sure what to pick?</b> Start with Rookie, then move to Babysitter once you're comfortable with slider updates and guide timing.</div>
        </div>
        <button onclick="openEventBuilder(); $('infoModalBackdrop').style.display='none';" style="margin-top:8px; padding:8px 12px; background:#74b9ff; color:#000; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Open Event Browser (All)</button>
        </div>
      `
    },
    saturation: {
      title: 'Saturation - What Is This?',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p><b>Saturation</b> is your best estimate of how wet your protection is right now, from 0% (bone dry) to 100% (fully soaked / leaking through).</p>
          <h3 style="color:#7cc4ff; margin:14px 0 6px;">How to use it</h3>
          <ul style="margin:0; padding-left:18px;">
            <li><b>0-20%</b> — Dry or barely damp. Just put on fresh protection.</li>
            <li><b>30-50%</b> — Noticeably wet. Had a small accident or a few dribbles.</li>
            <li><b>60-80%</b> — Quite wet. Protection is heavy and warm. A change would be nice.</li>
            <li><b>90-100%</b> — Soaked through or about to leak. Needs a change now.</li>
          </ul>
          <p style="margin-top:12px;">You don't need to be exact — just move the slider when something changes. The sim uses your saturation to decide when changes are offered and when overflow events trigger.</p>
          <div style="margin-top:12px; padding:10px 12px; background:#1b2030; border-radius:8px; border-left:3px solid #7cc4ff;">
            <div style="color:#7cc4ff; font-weight:bold; margin-bottom:4px; font-size:12px;">TIP</div>
            <div style="font-size:13px;">If you're not wearing protection, treat saturation as "how wet your clothes/underwear feel."</div>
          </div>
        </div>
      `
    }
  };

  const section = sections[sectionKey] || sections.session;
  body.innerHTML = `<h2>${section.title}</h2>${section.html}`;
  backdrop.style.display = 'block';
}

/* ---------- Event Builder / Browser ---------- */
function saveDisabledEvents() {
  localStorage.setItem('disabledEventsByProfile', JSON.stringify(disabledEventsByProfile));
}

function saveAppendedEvents() {
  localStorage.setItem('appendedEventsByProfile', JSON.stringify(appendedEventsByProfile));
}

function eventId(source, idx) {
  return `${source}:${idx}`;
}

function isEventDisabled(profile, id) {
  return !!(disabledEventsByProfile?.[profile]?.[id]);
}

function collectTableEvents(profile, source, table, type, out) {
  if (!Array.isArray(table)) return;
  table.forEach((e, idx) => {
    out.push({
      id: eventId(source, idx),
      profile,
      type,
      source,
      idx,
      label: e.label || `${source} #${idx + 1}`,
      flow: e.flow || e.desc || '',
      guide: Array.isArray(e.guide) ? e.guide : [],
      classKey: e.classKey || e.cls || '',
      partial: !!e.partial
    });
  });
}

function getEventCatalogForProfile(profile) {
  const events = [];

  if (profile === 'dependent') {
    collectTableEvents(profile, 'MICRO_DEPENDENT_D20', MICRO_DEPENDENT_D20, 'micro', events);
    collectTableEvents(profile, 'MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20, 'full', events);
  } else if (profile === 'npt') {
    collectTableEvents(profile, 'MICRO_DIAPER_D8', MICRO_DIAPER_D8, 'micro', events);
    collectTableEvents(profile, 'FULL_D20', FULL_D20, 'full', events);
  } else if (profile === 'train_rookie' || profile === 'train_pro') {
    collectTableEvents(profile, 'MICRO_TRAINING_D8', MICRO_TRAINING_D8, 'micro', events);
    collectTableEvents(profile, 'FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES, 'full', events);
  } else if (profile === 'chaos_manual') {
    collectTableEvents(profile, 'MICRO_STD_D6', MICRO_STD_D6, 'micro', events);
    collectTableEvents(profile, 'FULL_D20', FULL_D20, 'full', events);
    collectTableEvents(profile, 'FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES, 'full', events);
    collectTableEvents(profile, 'MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20, 'full', events);
  } else if (profile === 'omorashi_hold') {
    collectTableEvents(profile, 'OMORASHI_HOLDING_GUIDES', OMORASHI_HOLDING_GUIDES, 'micro', events);
    collectTableEvents(profile, 'OMORASHI_GAUNTLETS', OMORASHI_GAUNTLETS, 'full', events);
  } else if (profile === 'babysitter') {
    collectTableEvents(profile, 'MICRO_BABYSITTER_D20', MICRO_BABYSITTER_D20, 'micro', events);
    collectTableEvents(profile, 'BABYSITTER_POTTY_PERMISSION_D10', BABYSITTER_POTTY_PERMISSION_D10, 'permission', events);
    collectTableEvents(profile, 'BABYSITTER_ACCIDENT_D10', BABYSITTER_ACCIDENT_D10, 'full', events);
    collectTableEvents(profile, 'TRANSITION_PAD_TO_PULLUPS_D6', TRANSITION_PAD_TO_PULLUPS_D6, 'transition', events);
    collectTableEvents(profile, 'TRANSITION_PULLUPS_TO_DIAPERS_D6', TRANSITION_PULLUPS_TO_DIAPERS_D6, 'transition', events);
    collectTableEvents(profile, 'TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6', TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6, 'transition', events);
    collectTableEvents(profile, 'TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6', TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6, 'transition', events);
    collectTableEvents(profile, 'TRANSITION_DIAPERS_TO_PULLUPS_D6', TRANSITION_DIAPERS_TO_PULLUPS_D6, 'transition', events);
    collectTableEvents(profile, 'TRANSITION_PULLUPS_TO_PAD_D6', TRANSITION_PULLUPS_TO_PAD_D6, 'transition', events);
  }

  // Append user-injected events for this profile
  const extra = appendedEventsByProfile?.[profile] || [];
  extra.forEach((e, idx) => {
    events.push({
      id: eventId('APPENDED_JSON', idx),
      profile,
      type: e.type || 'micro',
      source: 'APPENDED_JSON',
      idx,
      label: e.label || `Custom Event ${idx + 1}`,
      flow: e.flow || e.desc || '',
      guide: Array.isArray(e.guide) ? e.guide : [],
      classKey: e.classKey || '',
      partial: !!e.partial
    });
  });

  return events;
}

function openEventBuilder(profileOverride = null, typeOverride = 'all') {
  const modal = $('eventBuilderBackdrop');
  if (!modal) return;
  if ($('ebProfile')) $('ebProfile').value = profileOverride || profileMode || 'babysitter';
  if ($('ebType')) $('ebType').value = typeOverride || 'all';
  // Populate the Build tab's profile selector to match
  if ($('ebBuildProfile')) $('ebBuildProfile').value = profileOverride || profileMode || 'babysitter';
  eventBuilderState.index = 0;
  refreshEventBuilder();
  modal.style.display = 'block';
  // Initialize tab state — always start on Browse
  switchEbTab('browse');
  // Initialize step list and preview in case user switches to Build tab
  renderEbSteps();
  updateEbPreview();
}

function openEventBuilderForProfile(profile, type = 'all') {
  openEventBuilder(profile, type);
}

/* ---------- Profile Details Panel (More Details on chooser) ---------- */
const PROFILE_DETAILS = {
  dependent: {
    color: '#fab1a0',
    title: '👶 Dependent — Always Leaking',
    rows: [
      ['Mode type', 'Queue-based spasm chain → forced void'],
      ['Potty success', '0% — you never make it to the potty'],
      ['Spasm frequency', '2–6 spasms queued before each void'],
      ['Time between spasms', '8–15 min (customizable in setup)'],
      ['Leak size', 'Escalating micro spurts building to a full void'],
      ['Protection', 'Diapers recommended — you\'re always leaking']
    ],
    loop: 'Your bladder queues up a set number of spasms before each full void. Each spasm fires a micro leak guide. After all spasms are done, you do a full release void. Then the cycle resets. There\'s no potty permission — it\'s all about the draining process. Perfect for dependency and diaper training immersion.'
  },
  npt: {
    color: '#fdcb6e',
    title: '🌙 Not Potty Trained — Background Simulator',
    loop: 'A background simulation where voids happen passively based on saturation threshold. When your saturation hits the limit (~85%), an auto-void event fires. In between you receive hydration reminders. No holds, no permission — just passive wetting detection. Best as a light overlay while doing other things.',
    rows: [
      ['Mode type', 'Passive saturation-threshold auto-void'],
      ['Potty success', '0% — no potty in this mode'],
      ['Auto-void trigger', 'When urgency reaches ~85%'],
      ['Micro events', 'Periodic small drip checks'],
      ['Leak size', 'Full passive voids with no control'],
      ['Protection', 'Diapers or Thick Diapers']
    ]
  },
  train_rookie: {
    color: '#7cc4ff',
    title: '🧒 Rookie — Struggle to Control',
    loop: 'You receive a timed hold challenge every 25–50 minutes. At the moment of truth, a random roll determines if you make it. Rookie has a 60% success rate — you fail often. Failed holds trigger full void guides. Success gives you brief relief but the cycle continues. Great for beginners who want challenge without total loss of control.',
    rows: [
      ['Mode type', 'Timed hold with random success roll'],
      ['Potty success', '~60% with Mercy mode on'],
      ['Hold interval', '25–50 min between events'],
      ['Micro events', 'Pressure spasms between holds'],
      ['Leak size', 'Full void on failure; partial hold on success'],
      ['Protection', 'Pullups or Diapers']
    ]
  },
  train_pro: {
    color: '#55efc4',
    title: '💪 Pro — Retaining Control',
    loop: 'Like Rookie but harder. Events fire every 50–90 minutes and success rate drops to ~35%. You will fail more than you succeed, but gaps between events are long. Pro creates a realistic \"I think I can hold it\" tension that usually ends in a controlled accident. For experienced players who want meaningful stakes.',
    rows: [
      ['Mode type', 'Timed hold with harder random roll'],
      ['Potty success', '~35% base (drops with high pressure)'],
      ['Hold interval', '50–90 min between events'],
      ['Micro events', 'Harder pressure spasms'],
      ['Leak size', 'Full void on failure with longer guide],'],
      ['Protection', 'Diapers recommended']
    ]
  },
  chaos_manual: {
    color: '#ff7675',
    title: '🔥 Chaos — Manual Trigger',
    loop: 'You hold until the very first real physical urgency signal, then click Force Release. The game then rolls a random event from the combined micro+macro+dependent tables — it could be anything from a tiny spurt to a total flood. Unpredictable, high-stakes, and entirely your choice when to trigger. Best for highly immersive solo sessions.',
    rows: [
      ['Mode type', 'Real urgency → manual trigger → random event'],
      ['Potty success', '0% — manual trigger always fires an event'],
      ['Trigger window', 'You decide (must trigger at first real urge)'],
      ['Event pool', 'All tables combined (micro + macro + dependent)'],
      ['Leak size', 'Random — could be tiny or catastrophic'],
      ['Protection', 'Diapers or Thick Diapers']
    ]
  },
  omorashi_hold: {
    color: '#81ecec',
    title: '💧 Omorashi — Hold & Release',
    loop: 'A structured hold challenge with a set session timer (30–90 min). You receive hydration orders and periodic stress tests (hold guides). At the end of the session, or if you fail a stress test, you either get permission or are forced to release. Optional: hold until you physically can\'t, then trigger the release guide yourself. Pure omorashi experience.',
    rows: [
      ['Mode type', 'Timed hold session with stress tests'],
      ['Potty success', '~50% at session end (configurable)'],
      ['Session length', '30–90 min hold timer'],
      ['Stress test frequency', 'Every 8–20 min (configurable)'],
      ['Leak size', 'Full controlled release at end or failure'],
      ['Protection', 'Depends on preference — part of the ritual']
    ]
  },
  babysitter: {
    color: '#a29bfe',
    title: '👩‍🍼 Babysitter — Realistic Holds',
    loop: 'The most complex mode. A babysitter character controls your potty access. Events fire every 30–90 min — each one is either potty permission (with a guide) or an accident (with a void guide). In between, micro events (spasms, leaks) fire 1–5 times per cycle. Your continence level controls how often you succeed. Turn on \"Not Potty Trained\" for higher incontinence levels to skip permission entirely and just auto-void + change.',
    rows: [
      ['Mode type', 'Permission/accident rolls with babysitter narratives'],
      ['Continence controls', 'Fully Continent (90%) → Fully Incontinent (10%)'],
      ['Micro events', '1–6 per cycle depending on continence'],
      ['Not Potty Trained', 'Available for Mostly/Fully Incontinent — auto-voids only'],
      ['Protection changes', 'Automatic based on performance (3 success = upgrade)'],
      ['Extras', 'Symptoms, Curses, Potty Passes, Progression']
    ]
  },
  custom: {
    color: '#e17055',
    title: '🧪 Custom — Create Your Own Profile',
    loop: 'Build a completely custom profile using the editor. Choose between Queue Mode (like Dependent — spasm chain before each void) or Timer Mode (interval-based events). Set your own timings, potty success rate, micro frequency, leak severity, hydration, and protection progression. Export as JSON to share, or import someone else\'s build.',
    rows: [
      ['Mode type', 'Queue-based OR Timer-based (your choice)'],
      ['Potty success', 'You set it (0–100%)'],
      ['Timer windows', 'Fully configurable min/max intervals'],
      ['Leak severity', 'Scalar multiplier (0.5 = light, 2.0 = extreme)'],
      ['Custom events', 'Write your own micro/macro events via GUI builder'],
      ['Import/Export', 'JSON share with others']
    ]
  }
};

function toggleProfileDetails(key) {
  const panel = $('profileDetailsPanel');
  if (!panel) return;
  // Toggle off if same key clicked again
  if (_profileDetailsCurrent === key && panel.style.display !== 'none') {
    panel.style.display = 'none';
    _profileDetailsCurrent = null;
    return;
  }
  _profileDetailsCurrent = key;
  const info = PROFILE_DETAILS[key];
  if (!info) { panel.style.display = 'none'; _profileDetailsCurrent = null; return; }

  const rowHtml = (info.rows || []).map(([k, v]) =>
    `<tr><td style="color:#8ea0b6; font-size:0.8em; padding:4px 8px 4px 0; white-space:nowrap; vertical-align:top;">${k}</td><td style="color:#e7edf5; font-size:0.82em; padding:4px 0 4px 12px; line-height:1.4;">${v}</td></tr>`
  ).join('');

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div style="color:${info.color}; font-weight:bold; font-size:1em;">${info.title}</div>
      <button onclick="toggleProfileDetails('__close__')" style="background:transparent; border:1px solid #2b3348; color:#888; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:12px;">✕</button>
    </div>
    ${rowHtml ? `<table style="width:100%; margin-bottom:12px; border-collapse:collapse;">${rowHtml}</table>` : ''}
    <div style="background:#1b2030; padding:10px 12px; border-radius:8px; border-left:3px solid ${info.color};">
      <div style="color:${info.color}; font-size:0.72em; font-weight:bold; margin-bottom:5px; letter-spacing:0.5px;">GAMEPLAY LOOP</div>
      <div style="color:#cdd7e6; font-size:0.82em; line-height:1.55;">${info.loop}</div>
    </div>
  `;
  panel.style.display = 'block';
  // Scroll panel into view within the modal's scrollable container
  const scrollParent = panel.closest('[style*="overflow-y"]') || panel.parentElement;
  if (scrollParent) {
    const top = panel.offsetTop - scrollParent.offsetTop;
    scrollParent.scrollTo({ top: Math.max(0, top - 12), behavior: 'smooth' });
  }
}

function refreshEventBuilder() {
  const profile = $('ebProfile')?.value || 'babysitter';
  const type = $('ebType')?.value || 'all';
  const search = (($('ebSearch')?.value || '').trim()).toLowerCase();
  let events = getEventCatalogForProfile(profile);

  if (type !== 'all') events = events.filter(e => e.type === type);
  if (search) {
    events = events.filter(e => (`${e.label} ${e.flow} ${e.source}`.toLowerCase().includes(search)));
  }

  eventBuilderState.events = events;
  if (!events.length) {
    eventBuilderState.index = 0;
  } else {
    eventBuilderState.index = clamp(eventBuilderState.index, 0, events.length - 1);
  }
  renderEventBuilderCard();
}

function eventBuilderPrev() {
  const n = eventBuilderState.events.length;
  if (!n) return;
  eventBuilderState.index = (eventBuilderState.index - 1 + n) % n;
  renderEventBuilderCard();
}

function eventBuilderNext() {
  const n = eventBuilderState.events.length;
  if (!n) return;
  eventBuilderState.index = (eventBuilderState.index + 1) % n;
  renderEventBuilderCard();
}

function renderEventBuilderCard() {
  const card = $('ebCard');
  if (!card) return;
  const profile = $('ebProfile')?.value || 'babysitter';
  const events = eventBuilderState.events;
  if (!events.length) {
    card.innerHTML = `<div style="color:#8ea0b6; font-size:13px;">No events matched this filter.</div>`;
    return;
  }

  const e = events[eventBuilderState.index];
  const disabled = isEventDisabled(profile, e.id);
  const stepRows = (e.guide || []).map((s, i) =>
    `<div class="eb-step">${i + 1}. <b>${s.text || 'STEP'}</b> <span style="color:#999">(${s.time || 0}s, ${(s.type || 'stop')})</span></div>`
  ).join('') || '<div class="eb-step" style="color:#777;">No guide steps attached.</div>';

  card.classList.toggle('event-disabled', disabled);
  card.innerHTML = `
    <h3>${e.label}</h3>
    <div class="eb-badges">
      <span class="eb-badge">${eventBuilderState.index + 1} / ${events.length}</span>
      <span class="eb-badge">Type: ${e.type}</span>
      <span class="eb-badge">Source: ${e.source}</span>
      <span class="eb-badge">ID: ${e.id}</span>
      ${disabled ? '<span class="eb-badge" style="color:#ff7675; border-color:#ff7675;">Disabled</span>' : ''}
    </div>
    <div style="font-size:13px; color:#cdd7e6; margin-bottom:10px; min-height:40px;">${e.flow || '<i>No description text</i>'}</div>
    <div class="eb-steps">${stepRows}</div>
    <div class="eb-actions">
      <button onclick="tryCurrentEvent()" style="background:#a29bfe; color:#000; font-weight:bold;">▶ Try Event</button>
      <button onclick="toggleCurrentEventDisabled()" style="background:${disabled ? '#55efc4' : '#ff7675'}; color:#000;">${disabled ? 'Enable Event' : 'Disable Event'}</button>
      <button onclick="cloneCurrentEventToJson()" style="background:#7cc4ff; color:#000;">Copy Event JSON</button>
    </div>
  `;
}

function tryCurrentEvent() {
  const events = eventBuilderState.events;
  if (!events.length) return;
  const e = events[eventBuilderState.index];
  const guide = e.guide || [];
  if (!guide.length) { toast('This event has no guide steps to preview'); return; }
  // Close the event builder modal, run the guide in preview mode, then return
  $('eventBuilderBackdrop').style.display = 'none';
  isPreviewMode = true;
  isGuideComplete = false;
  startVoidGuide(
    guide,
    `<b style="color:#a29bfe;">PREVIEW:</b> ${e.label}`,
    e.type || 'micro'
  );
}

const TUTORIAL_EVENT = {
  label: 'Tutorial: Your First Leak',
  flow: 'A quick tutorial event so you can see exactly how a guide works. Follow the colored steps — each ring shows what to do and for how long. There\'s no wrong answer here.',
  type: 'micro',
  guide: [
    { text: 'BREATHE IN', time: 3, type: 'stop' },
    { text: 'HOLD TIGHT', time: 5, type: 'stop' },
    { text: 'SMALL PUSH', time: 4, type: 'push' },
    { text: 'RELAX...', time: 5, type: 'relax' },
    { text: 'CLENCH', time: 3, type: 'stop' }
  ]
};

function tryTutorialEvent() {
  // Close info modal first
  const infoBackdrop = $('infoModalBackdrop');
  if (infoBackdrop) infoBackdrop.style.display = 'none';
  isPreviewMode = true;
  isGuideComplete = false;
  startVoidGuide(
    TUTORIAL_EVENT.guide,
    `<b style="color:#a29bfe;">📖 TUTORIAL:</b> ${TUTORIAL_EVENT.label}`,
    TUTORIAL_EVENT.type
  );
}



function toggleCurrentEventDisabled() {
  const profile = $('ebProfile')?.value || 'babysitter';
  const events = eventBuilderState.events;
  if (!events.length) return;
  const current = events[eventBuilderState.index];
  disabledEventsByProfile[profile] = disabledEventsByProfile[profile] || {};
  if (disabledEventsByProfile[profile][current.id]) {
    delete disabledEventsByProfile[profile][current.id];
  } else {
    disabledEventsByProfile[profile][current.id] = true;
  }
  saveDisabledEvents();
  renderEventBuilderCard();
  toast('Event toggle saved');
}

function cloneCurrentEventToJson() {
  const events = eventBuilderState.events;
  if (!events.length) return;
  const current = events[eventBuilderState.index];
  const payload = {
    type: current.type,
    label: current.label,
    flow: current.flow,
    guide: current.guide || []
  };
  if ($('ebJsonInput')) {
    $('ebJsonInput').value = JSON.stringify([payload], null, 2);
  }
  toast('Event copied into JSON box');
}

function appendEventsFromBuilderJson() {
  const profile = $('ebProfile')?.value || 'babysitter';
  const raw = ($('ebJsonInput')?.value || '').trim();
  if (!raw) {
    toast('Paste JSON first');
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
    const valid = parsed.filter(e => e && Array.isArray(e.guide));
    if (!valid.length) {
      toast('No valid events found in JSON');
      return;
    }
    appendedEventsByProfile[profile] = appendedEventsByProfile[profile] || [];
    appendedEventsByProfile[profile].push(...valid);
    saveAppendedEvents();
    toast(`Added ${valid.length} events to ${profile}`);
    refreshEventBuilder();
  } catch (err) {
    console.error(err);
    toast('Invalid JSON payload');
  }
}

function clearAppendedEventsForProfile() {
  const profile = $('ebProfile')?.value || 'babysitter';
  delete appendedEventsByProfile[profile];
  saveAppendedEvents();
  toast('Cleared appended JSON events');
  refreshEventBuilder();
}

function resetDisabledEventsForProfile() {
  const profile = $('ebProfile')?.value || 'babysitter';
  delete disabledEventsByProfile[profile];
  saveDisabledEvents();
  toast('Disabled-event list reset');
  refreshEventBuilder();
}

/* ---------- Event Builder Tab Switching + Visual GUI Builder ---------- */
function switchEbTab(tab) {
  ['browse', 'build', 'json'].forEach(t => {
    const pane = $(`ebPane${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn = $(`ebTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const isActive = t === tab;
    if (pane) pane.style.display = isActive ? 'block' : 'none';
    if (btn) {
      btn.style.background = isActive ? '#0f1420' : '#1b2030';
      btn.style.color = isActive ? '#74b9ff' : '#8ea0b6';
      btn.style.borderBottom = isActive ? '2px solid #74b9ff' : '1px solid #2b3348';
      btn.style.fontWeight = isActive ? 'bold' : 'normal';
    }
  });
}

// Visual Event Builder state
let ebGuideSteps = [];

function addEbStep() {
  ebGuideSteps.push({ text: '', time: 3, type: 'stop' });
  renderEbSteps();
  updateEbPreview();
}

function removeEbStep(idx) {
  ebGuideSteps.splice(idx, 1);
  renderEbSteps();
  updateEbPreview();
}

function updateEbStepField(idx, field, value) {
  if (!ebGuideSteps[idx]) return;
  if (field === 'time') {
    ebGuideSteps[idx].time = Math.max(1, parseInt(value, 10) || 1);
  } else {
    ebGuideSteps[idx][field] = value;
  }
  updateEbPreview();
}

const EB_STEP_COLORS = { stop: '#55efc4', push: '#ff7675', relax: '#a29bfe' };
const EB_STEP_LABELS = { stop: '🟢 HOLD/STOP', push: '🔴 PUSH/FORCE', relax: '🟣 RELAX/FLOW' };

function renderEbSteps() {
  const container = $('ebStepsList');
  if (!container) return;
  if (!ebGuideSteps.length) {
    container.innerHTML = '<div style="color:#666; font-size:12px; padding:6px;">No steps yet — click Add Step to begin.</div>';
    return;
  }
  container.innerHTML = ebGuideSteps.map((step, idx) => {
    const col = EB_STEP_COLORS[step.type] || '#888';
    return `<div style="display:grid; grid-template-columns:auto 1fr 80px auto auto; gap:6px; align-items:center; padding:7px 10px; background:#0f1420; border-radius:8px; border-left:3px solid ${col};">
      <span style="color:${col}; font-size:1.1em;">⬛</span>
      <input type="text" value="${(step.text || '').replace(/"/g,'&quot;')}" placeholder="Step label (e.g. HOLD TIGHT)" oninput="updateEbStepField(${idx},'text',this.value)" style="padding:6px 8px; background:#1b2030; border:1px solid #2b3348; color:#fff; border-radius:6px; font-size:13px;">
      <div style="display:flex; align-items:center; gap:4px;">
        <input type="number" value="${step.time}" min="1" max="60" oninput="updateEbStepField(${idx},'time',this.value)" style="width:52px; padding:6px; background:#1b2030; border:1px solid #2b3348; color:#fff; border-radius:6px; font-size:13px;">
        <span style="color:#8ea0b6; font-size:11px;">s</span>
      </div>
      <select onchange="updateEbStepField(${idx},'type',this.value)" style="padding:6px 4px; background:#1b2030; border:1px solid #2b3348; color:${col}; border-radius:6px; font-size:12px;">
        ${['stop','push','relax'].map(t => `<option value="${t}" ${step.type===t?'selected':''}>${EB_STEP_LABELS[t]}</option>`).join('')}
      </select>
      <button onclick="removeEbStep(${idx})" style="background:transparent; border:1px solid #2b3348; color:#ff7675; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:13px;">✕</button>
    </div>`;
  }).join('');
}

function updateEbPreview() {
  const container = $('ebLivePreview');
  if (!container) return;
  const label = $('ebBuildLabel')?.value || 'Untitled Event';
  const flow = $('ebBuildFlow')?.value || '(no description)';
  const colorKey = $('ebBuildColor')?.value || 'micro_small';
  const colorMap = {
    micro_tiny: '#74b9ff', micro_small: '#fdcb6e', micro_big: '#e17055',
    full_heavy: '#ff7675', full_light: '#55efc4'
  };
  const col = colorMap[colorKey] || '#fdcb6e';

  const stepsHtml = ebGuideSteps.length
    ? ebGuideSteps.map((s, i) => {
        const c = EB_STEP_COLORS[s.type] || '#888';
        const isCenter = i === Math.floor(ebGuideSteps.length / 2);
        return `<div style="display:flex; align-items:center; gap:10px; padding:${isCenter ? '12px 16px' : '8px 16px'}; background:${isCenter ? '#1b2030' : '#101622'}; border-radius:8px; border:1px solid ${isCenter ? c : '#2b3348'}; margin-bottom:6px;">
          <div style="width:36px; height:36px; border-radius:50%; background:${c}22; border:2px solid ${c}; display:flex; align-items:center; justify-content:center; color:${c}; font-size:1.1em;">◉</div>
          <div>
            <div style="color:${c}; font-weight:bold; font-size:${isCenter ? '1em' : '0.85em'};">${s.text || 'STEP '+(i+1)}</div>
            <div style="color:#8ea0b6; font-size:0.75em;">${s.time}s · ${(s.type||'stop').toUpperCase()}</div>
          </div>
        </div>`;
      }).join('')
    : `<div style="color:#555; font-size:12px; font-style:italic;">Add guide steps above to preview them here.</div>`;

  container.innerHTML = `
    <div style="border:1px solid ${col}; border-radius:10px; overflow:hidden;">
      <div style="padding:12px 16px; background:${col}22; border-bottom:1px solid ${col}44;">
        <div style="color:${col}; font-weight:bold; font-size:0.95em;">${label}</div>
        <div style="color:#cdd7e6; font-size:0.82em; margin-top:4px; line-height:1.4;">${flow}</div>
      </div>
      <div style="padding:12px 16px; background:#0f1115;">
        <div style="color:#8ea0b6; font-size:0.72em; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">GUIDE STEPS</div>
        ${stepsHtml}
      </div>
    </div>
  `;
}

function clearEbBuilder() {
  ebGuideSteps = [];
  if ($('ebBuildLabel')) $('ebBuildLabel').value = '';
  if ($('ebBuildFlow')) $('ebBuildFlow').value = '';
  renderEbSteps();
  updateEbPreview();
}

function addEbEventToProfile() {
  const label = ($('ebBuildLabel')?.value || '').trim();
  const flow = ($('ebBuildFlow')?.value || '').trim();
  const type = $('ebBuildType')?.value || 'micro';
  const classKey = $('ebBuildColor')?.value || 'micro_small';
  const profile = $('ebBuildProfile')?.value || 'babysitter';

  if (!label) { toast('Add an event label first'); return; }
  if (!ebGuideSteps.length) { toast('Add at least one guide step'); return; }

  const event = { type, label, flow, classKey, guide: ebGuideSteps.map(s => ({ ...s })) };
  appendedEventsByProfile[profile] = appendedEventsByProfile[profile] || [];
  appendedEventsByProfile[profile].push(event);
  saveAppendedEvents();
  toast(`✅ "${label}" added to ${profile}`);
  clearEbBuilder();
  // Switch to browse tab to show the result
  if ($('ebProfile')) $('ebProfile').value = profile;
  if ($('ebType')) $('ebType').value = type;
  switchEbTab('browse');
  refreshEventBuilder();
}

function exportEventBuilderState() {
  const payload = {
    schema: 'abdl-event-builder-state-v1',
    exportedAt: new Date().toISOString(),
    disabledEventsByProfile,
    appendedEventsByProfile
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `event_builder_state_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  toast('Event Builder state exported');
}

function importEventBuilderState() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !data.disabledEventsByProfile || !data.appendedEventsByProfile) {
          throw new Error('Invalid builder state payload');
        }
        disabledEventsByProfile = data.disabledEventsByProfile || {};
        appendedEventsByProfile = data.appendedEventsByProfile || {};
        saveDisabledEvents();
        saveAppendedEvents();
        toast('Event Builder state imported');
        refreshEventBuilder();
      } catch (err) {
        console.error(err);
        toast('Invalid Event Builder state file');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function filterEnabledCatalog(profile, source, table, fallback = null) {
  const mapped = (table || []).map((e, idx) => ({ e, idx, id: eventId(source, idx) }));
  const enabled = mapped.filter(x => !isEventDisabled(profile, x.id));
  if (enabled.length) return enabled;
  return fallback || mapped;
}

/* ---------- Custom Profile System ---------- */
function getSavedCustomProfiles() {
  return JSON.parse(localStorage.getItem('customProfiles') || '[]');
}

function saveCustomProfiles(list) {
  localStorage.setItem('customProfiles', JSON.stringify(list));
}

function openCustomProfileEditor() {
  const panel = $('customProfileBackdrop');
  if (!panel) return;
  panel.style.display = 'block';
  renderSavedProfilesList();
}

function parseEventPack(text, label) {
  const raw = (text || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Must be an array');
    return parsed.filter(e => e && Array.isArray(e.guide));
  } catch (err) {
    toast(`${label} JSON invalid - ignored`);
    console.warn(label, err);
    return [];
  }
}

function buildCustomProfileFromForm() {
  const profile = {
    id: Date.now().toString(36),
    name: ($('cpName')?.value || '').trim() || 'Untitled Custom Profile',
    description: ($('cpDesc')?.value || '').trim() || 'No description',
    createdAt: new Date().toISOString(),
    runtime: {
      baseProfile: $('cpBaseProfile')?.value || 'babysitter',
      mainMin: parseInt($('cpMainMin')?.value, 10) || 30,
      mainMax: parseInt($('cpMainMax')?.value, 10) || 90,
      microMin: parseInt($('cpMicroMin')?.value, 10) || 5,
      microMax: parseInt($('cpMicroMax')?.value, 10) || 15,
      pottySuccessRate: parseInt($('cpPottyRate')?.value, 10) || 50,
      microsPerCycle: parseInt($('cpMicrosPerCycle')?.value, 10) || 3,
      leakScalar: parseFloat($('cpLeakScalar')?.value) || 1,
      pressureAcceleration: parseFloat($('cpPressureAccel')?.value) || 1,
      sipMin: parseInt($('cpSipMin')?.value, 10) || 2,
      sipMax: parseInt($('cpSipMax')?.value, 10) || 5,
      hydrationMin: parseInt($('cpHydrationMin')?.value, 10) || 15,
      hydrationMax: parseInt($('cpHydrationMax')?.value, 10) || 45,
      startProtection: $('cpStartProtection')?.value || 'diapers',
      progressionEnabled: ($('cpProgression')?.value || 'yes') === 'yes',
      successThreshold: parseInt($('cpSuccessThresh')?.value, 10) || 3,
      failureThreshold: parseInt($('cpFailThresh')?.value, 10) || 2,
      pushToLeak: $('cpPushToLeak')?.value || 'optional',
      mercyMode: $('cpMercy')?.value || 'optional',
      preChime: ($('cpPreChime')?.value || 'yes') === 'yes',
      customMicroEvents: parseEventPack($('cpCustomMicroEvents')?.value || '', 'Custom micro events'),
      customFullEvents: parseEventPack($('cpCustomFullEvents')?.value || '', 'Custom full events')
    }
  };

  profile.runtime.mainMin = Math.max(1, profile.runtime.mainMin);
  profile.runtime.mainMax = Math.max(profile.runtime.mainMin, profile.runtime.mainMax);
  profile.runtime.microMin = Math.max(1, profile.runtime.microMin);
  profile.runtime.microMax = Math.max(profile.runtime.microMin, profile.runtime.microMax);
  profile.runtime.hydrationMin = Math.max(5, profile.runtime.hydrationMin);
  profile.runtime.hydrationMax = Math.max(profile.runtime.hydrationMin, profile.runtime.hydrationMax);
  profile.runtime.successThreshold = Math.max(1, profile.runtime.successThreshold);
  profile.runtime.failureThreshold = Math.max(1, profile.runtime.failureThreshold);
  return profile;
}

function saveCustomProfile() {
  const profile = buildCustomProfileFromForm();
  const profiles = getSavedCustomProfiles();
  profiles.push(profile);
  saveCustomProfiles(profiles);
  toast(`Saved custom profile: ${profile.name}`);
  renderSavedProfilesList();
}

function renderSavedProfilesList() {
  const box = $('savedProfilesList');
  if (!box) return;
  const profiles = getSavedCustomProfiles();
  if (!profiles.length) {
    box.innerHTML = '<div style="color:#666; font-size:12px;">No saved custom profiles yet.</div>';
    return;
  }
  box.innerHTML = `
    <div style="color:#e17055; font-weight:bold; margin-bottom:8px;">Saved Profiles</div>
    ${profiles.map((p, idx) => `
      <div style="background:#1b2030; border:1px solid #2b3348; border-radius:8px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
          <div>
            <div style="color:#fff; font-weight:bold; font-size:13px;">${p.name}</div>
            <div style="color:#8ea0b6; font-size:11px;">${p.description}</div>
            <div style="color:#666; font-size:11px; margin-top:4px;">Base: ${p.runtime?.baseProfile || 'babysitter'} | Main: ${p.runtime?.mainMin}-${p.runtime?.mainMax}m</div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
            <button onclick="applyCustomProfile('${p.id}')" style="padding:6px 10px; background:#55efc4; color:#000; border:none; border-radius:6px; cursor:pointer; font-size:11px;">Apply</button>
            <button onclick="loadCustomProfileIntoEditor('${p.id}')" style="padding:6px 10px; background:#7cc4ff; color:#000; border:none; border-radius:6px; cursor:pointer; font-size:11px;">Load</button>
            <button onclick="deleteCustomProfile('${p.id}')" style="padding:6px 10px; background:#ff7675; color:#000; border:none; border-radius:6px; cursor:pointer; font-size:11px;">Delete</button>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

function loadCustomProfileIntoEditor(profileId) {
  const p = getSavedCustomProfiles().find(x => x.id === profileId);
  if (!p) return;
  const r = p.runtime || {};
  if ($('cpName')) $('cpName').value = p.name || '';
  if ($('cpDesc')) $('cpDesc').value = p.description || '';
  if ($('cpBaseProfile')) $('cpBaseProfile').value = r.baseProfile || 'babysitter';
  if ($('cpMainMin')) $('cpMainMin').value = r.mainMin ?? 30;
  if ($('cpMainMax')) $('cpMainMax').value = r.mainMax ?? 90;
  if ($('cpMicroMin')) $('cpMicroMin').value = r.microMin ?? 5;
  if ($('cpMicroMax')) $('cpMicroMax').value = r.microMax ?? 15;
  if ($('cpPottyRate')) $('cpPottyRate').value = r.pottySuccessRate ?? 50;
  if ($('cpMicrosPerCycle')) $('cpMicrosPerCycle').value = r.microsPerCycle ?? 3;
  if ($('cpLeakScalar')) $('cpLeakScalar').value = r.leakScalar ?? 1;
  if ($('cpPressureAccel')) $('cpPressureAccel').value = r.pressureAcceleration ?? 1;
  if ($('cpSipMin')) $('cpSipMin').value = r.sipMin ?? 2;
  if ($('cpSipMax')) $('cpSipMax').value = r.sipMax ?? 5;
  if ($('cpHydrationMin')) $('cpHydrationMin').value = r.hydrationMin ?? 15;
  if ($('cpHydrationMax')) $('cpHydrationMax').value = r.hydrationMax ?? 45;
  if ($('cpStartProtection')) $('cpStartProtection').value = r.startProtection || 'diapers';
  if ($('cpProgression')) $('cpProgression').value = r.progressionEnabled === false ? 'no' : 'yes';
  if ($('cpSuccessThresh')) $('cpSuccessThresh').value = r.successThreshold ?? 3;
  if ($('cpFailThresh')) $('cpFailThresh').value = r.failureThreshold ?? 2;
  if ($('cpPushToLeak')) $('cpPushToLeak').value = r.pushToLeak || 'optional';
  if ($('cpMercy')) $('cpMercy').value = r.mercyMode || 'optional';
  if ($('cpPreChime')) $('cpPreChime').value = r.preChime === false ? 'no' : 'yes';
  if ($('cpCustomMicroEvents')) $('cpCustomMicroEvents').value = (r.customMicroEvents?.length ? JSON.stringify(r.customMicroEvents, null, 2) : '');
  if ($('cpCustomFullEvents')) $('cpCustomFullEvents').value = (r.customFullEvents?.length ? JSON.stringify(r.customFullEvents, null, 2) : '');
}

function deleteCustomProfile(profileId) {
  const list = getSavedCustomProfiles().filter(p => p.id !== profileId);
  saveCustomProfiles(list);
  renderSavedProfilesList();
}

function exportCustomProfile() {
  const profile = buildCustomProfileFromForm();
  profile.schema = 'abdl-custom-profile-v1';
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const safeName = (profile.name || 'custom-profile').replace(/[^a-z0-9_-]+/gi, '_');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  toast('Custom profile exported as JSON');
}

function importCustomProfileData(rawText, sourceLabel) {
  try {
    const data = JSON.parse(rawText);
    if (!data || !data.runtime) throw new Error('Invalid profile shape');
    if (!data.id) data.id = Date.now().toString(36);
    const profiles = getSavedCustomProfiles();
    profiles.push(data);
    saveCustomProfiles(profiles);
    loadCustomProfileIntoEditor(data.id);
    renderSavedProfilesList();
    toast(`Imported custom profile from ${sourceLabel}: ${data.name || 'Unnamed'}`);
    return true;
  } catch (err) {
    console.error(err);
    toast(`Invalid JSON from ${sourceLabel}`);
    return false;
  }
}

function importCustomProfile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importCustomProfileData(reader.result, 'file');
    };
    reader.readAsText(file);
  };
  input.click();
}

async function importCustomProfileFromClipboard() {
  if (!navigator.clipboard?.readText) {
    toast('Clipboard import is not available in this browser');
    return;
  }

  try {
    const rawText = await navigator.clipboard.readText();
    if (!rawText || !rawText.trim()) {
      toast('Clipboard is empty');
      return;
    }
    importCustomProfileData(rawText, 'clipboard');
  } catch (err) {
    console.error(err);
    toast('Clipboard access was denied');
  }
}

function applyCustomProfile(profileId) {
  const p = getSavedCustomProfiles().find(x => x.id === profileId);
  if (!p) return;

  activeCustomProfile = p;
  customProfileRuntime = p.runtime || null;
  localStorage.setItem('activeCustomProfile', JSON.stringify(activeCustomProfile));

  const runtime = customProfileRuntime || {};
  profileMode = runtime.baseProfile || 'babysitter';
  localStorage.setItem('profileMode', profileMode);

  if (profileMode === 'dependent') {
    depSpasmMin = runtime.mainMin || depSpasmMin;
    depSpasmMax = runtime.mainMax || depSpasmMax;
    depQueueMin = Math.max(0, (runtime.microsPerCycle || depQueueMin) - 1);
    depQueueMax = Math.max(depQueueMin, runtime.microsPerCycle || depQueueMax);
  } else if (profileMode === 'npt') {
    nptVoidMin = runtime.mainMin || nptVoidMin;
    nptVoidMax = runtime.mainMax || nptVoidMax;
    nptMercy = runtime.mercyMode === 'disabled' ? false : nptMercy;
  } else if (profileMode === 'train_rookie') {
    rookieVoidMin = runtime.mainMin || rookieVoidMin;
    rookieVoidMax = runtime.mainMax || rookieVoidMax;
    rookieSuccessRate = runtime.pottySuccessRate || rookieSuccessRate;
    rookieMercy = runtime.mercyMode === 'disabled' ? false : rookieMercy;
  } else if (profileMode === 'train_pro') {
    proVoidMin = runtime.mainMin || proVoidMin;
    proVoidMax = runtime.mainMax || proVoidMax;
    proSuccessRate = runtime.pottySuccessRate || proSuccessRate;
    proMercy = runtime.mercyMode === 'disabled' ? false : proMercy;
  } else if (profileMode === 'chaos_manual') {
    chaosSipMin = runtime.sipMin || chaosSipMin;
    chaosSipMax = runtime.sipMax || chaosSipMax;
  } else if (profileMode === 'babysitter') {
    depSpasmMin = runtime.mainMin || depSpasmMin;
    depSpasmMax = runtime.mainMax || depSpasmMax;
    depQueueMin = Math.max(0, (runtime.microsPerCycle || depQueueMin) - 1);
    depQueueMax = Math.max(depQueueMin, runtime.microsPerCycle || depQueueMax);
  }

  if ($('profileSelect')) {
    $('profileSelect').value = profileMode;
    applySelectedProfile();
  }

  progressionUpgradeThreshold = runtime.successThreshold || 3;
  progressionDowngradeThreshold = runtime.failureThreshold || 2;

  if (runtime.startProtection && PROTECTION_HIERARCHY.includes(runtime.startProtection)) {
    currentProtectionLevel = runtime.startProtection;
    localStorage.setItem('currentProtectionLevel', currentProtectionLevel);
  }

  if (runtime.sipMin) {
    depSipMin = runtime.sipMin;
    nptSipMin = runtime.sipMin;
    chaosSipMin = runtime.sipMin;
  }
  if (runtime.sipMax) {
    depSipMax = runtime.sipMax;
    nptSipMax = runtime.sipMax;
    chaosSipMax = runtime.sipMax;
  }

  if (runtime.mercyMode === 'forced') {
    window.mercyMode = true;
    const btn = $('btnMercy');
    if (btn) btn.textContent = 'Mercy: ON';
  } else if (runtime.mercyMode === 'disabled') {
    window.mercyMode = false;
    const btn = $('btnMercy');
    if (btn) btn.textContent = 'Mercy: OFF';
  }

  if (runtime.pushToLeak === 'forced') {
    togglePushToLeak(true);
  } else if (runtime.pushToLeak === 'disabled') {
    togglePushToLeak(false);
  }

  renderStashUI();
  $('customProfileBackdrop').style.display = 'none';
  toast(`Applied custom profile: ${p.name}`);
  logToOutput(`<span style="color:#e17055;"><b>🧪 Custom Profile Active:</b> ${p.name} (${runtime.baseProfile || 'babysitter'} base)</span>`);
}