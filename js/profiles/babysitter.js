/* ===========================
   profiles/babysitter.js — Babysitter profile logic
   =========================== */


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
  const defaultType = event?.partial ? 'Partial Overflow' : 'Full Overflow';
  const accidentPatterns = [
    { re: /laugh|giggle|funny/,                           type: 'Giggle Cascade',    trigger: 'Laughter reflex release' },
    { re: /sneeze|cough|stand|shiver|movement|spurt/,     type: 'Stress Burst',      trigger: 'Physical trigger pressure spike' },
    { re: /hesitat|denied|desperate|dam breaks|wait/,      type: 'Urgency Collapse',  trigger: 'Denied or delayed potty release' },
    { re: /relax|distract|doze|sleep/,                     type: 'Relaxation Slip',   trigger: 'Guard dropped during relaxed phase' }
  ];
  const match = accidentPatterns.find(p => p.re.test(text));
  const type = match?.type ?? defaultType;
  const trigger = match?.trigger ?? 'Hold failure under delay';

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

    const spasmThresholds = [
      { min: 85, chance: 0.55 },
      { min: 70, chance: 0.35 },
      { min: 55, chance: 0.22 }
    ];
    const spasmChance = spasmThresholds.find(t => manualPressure >= t.min)?.chance ?? 0.15;

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
  const contMod = { fully_continent: 1.3, mostly_continent: 1.1, somewhat_incontinent: 1.0, mostly_incontinent: 1.0, fully_incontinent: 1.2 };
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

    const checkThresholds = [
      { min: capacity * 0.9, color: '#ff7675', emoji: '😟', msg: 'Oh dear, you\'re completely soaked. We need to deal with this right now.', action: () => checkBabysitterProgression('accident') },
      { min: capacity * 0.5, color: '#fdcb6e', emoji: '🤔', msg: 'Getting pretty wet in there. I\'ll keep an eye on you.', action: null },
      { min: 10,             color: '#81ecec', emoji: '😊', msg: 'A little damp but nothing to worry about yet.', action: null },
      { min: -Infinity,      color: '#55efc4', emoji: '😄', msg: 'Still dry! Good job, keep it up.', action: () => { if (pressure < 30) maybeAwardPottyPass('good_check'); } }
    ];
    const check = checkThresholds.find(t => sat > t.min) || checkThresholds[checkThresholds.length - 1];
    let response = `<span style="color:${check.color};">${check.emoji} Babysitter: "${check.msg}"</span>`;
    if (check.action) check.action();

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
      ? MACRO_NPT_FULLY_INCONTINENT_D20
      : MACRO_NPT_MOSTLY_INCONTINENT_D20;
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

      const checkDelay = randInt(8, 15) * 60000;
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
      // Append random void guide steps after dispatch so potty behaves like a regular event
      const pottyGuide = [...event.guide, ...generateRandomGuideSteps('moderate')];
      startVoidGuide(pottyGuide, `👩‍🍼 <b>Potty Time:</b> ${event.flow}`, 'full_light');
      
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
      if (currentContinenceLevel === 'mostly_incontinent') return BABYSITTER_ACCIDENT_MOSTLY_D20;
      if (currentContinenceLevel === 'somewhat_incontinent') return BABYSITTER_ACCIDENT_SOMEWHAT_D20;
      return BABYSITTER_ACCIDENT_D20;
    })();
    const tableKey = currentContinenceLevel === 'mostly_incontinent' ? 'BABYSITTER_ACCIDENT_MOSTLY_D20'
      : currentContinenceLevel === 'somewhat_incontinent' ? 'BABYSITTER_ACCIDENT_SOMEWHAT_D20'
      : 'BABYSITTER_ACCIDENT_D20';
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
  
  switch (reason) {
    case 'success': {
      if (protectionSuccesses >= progressionUpgradeThreshold) {
        const candidate = getNextAvailableProtection('up', currentProtectionLevel);
        if (candidate) {
          newLevel = candidate;
          levelChanged = true;
          const idealIdx = PROTECTION_HIERARCHY.indexOf(currentProtectionLevel) - 1;
          if (idealIdx >= 0 && PROTECTION_HIERARCHY[idealIdx] !== candidate) {
            skippedLevel = PROTECTION_HIERARCHY[idealIdx];
          }
        }
        protectionSuccesses = 0;
      }
      break;
    }
    case 'partial_accident': {
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
      break;
    }
    case 'accident':
    case 'high_saturation': {
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
      break;
    }
    case 'major_accident': {
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
      break;
    }
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
    const event = BABYSITTER_ACCIDENT_D20[randInt(0, BABYSITTER_ACCIDENT_D20.length - 1)];
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
  const meterColors = [
    { max: 50, color: '#2ecc71' },
    { max: 80, color: '#f1c40f' },
    { max: Infinity, color: '#e74c3c' }
  ];
  const mc = meterColors.find(c => pressureVal < c.max);
  slider.style.background = `linear-gradient(to right, ${mc.color} 0%, ${mc.color} ${pressureVal}%, #444 ${pressureVal}%, #444 100%)`;
}


