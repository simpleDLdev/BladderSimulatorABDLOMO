/* ===========================
   engine.js — Core timer/scheduling/audio/dispatch
   =========================== */

function startChime(freq = 880) {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Vibrate on mobile as backup alert
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate([200, 100, 200]);
  }

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

function microTableForMode(roll) {
  const profile = profileMode;
  const cfg = getProfileConfig();

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

  // Dependent uses random pick instead of indexed roll
  if (cfg.scheduler === 'dependent') {
    const enabled = filterEnabledCatalog(profile, cfg.microSource, cfg.microTable());
    const pickMeta = pick(enabled);
    const e = pickMeta.e;
    return { kind: 'micro', desc: e.flow, guide: e.guide };
  }

  // All other profiles: look up table + source from config
  const table = cfg.microTable();
  const source = cfg.microSource;
  const enabled = filterEnabledCatalog(profile, source, table);
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

function fullTable(roll) {

  const profile = profileMode;
  const cfg = getProfileConfig();

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

  // --- 1. CHAOS MODE (merge all tables) ---
  if (cfg.scheduler === 'chaos') {
      const chaosList = [
        ...filterEnabledCatalog(profile, 'FULL_D20', FULL_D20).map(x => x.e),
        ...filterEnabledCatalog(profile, 'FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES).map(x => x.e),
        ...filterEnabledCatalog(profile, 'MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20).map(x => x.e)
      ];
      const s = pick(chaosList);
      return {
          kind: 'full',
          desc: s.flow || s.desc,
          guide: s.guide,
          partial: s.partial || false,
          tmin: 0, tmax: 0
      };
  }

  // --- 2. DEPENDENT / random-pick profiles ---
  if (cfg.scheduler === 'dependent') {
    const pickMeta = pick(filterEnabledCatalog(profile, cfg.macroSource, cfg.macroTable()));
    const e = pickMeta.e;
    return { kind: 'full', desc: e.flow, guide: e.guide };
  }

  // --- 3. MATRON WARD (direct random index) ---
  if (profileMode === 'matron_ward') {
    const tbl = cfg.macroTable();
    const idx = randInt(0, tbl.length - 1);
    const e = tbl[idx];
    return { kind: 'full', desc: e.flow, guide: e.guide, tmin: cfg.mainMin, tmax: cfg.mainMax };
  }

  // --- 4. TRAINING profiles (failure with void window) ---
  if (cfg.alarmFn === 'training') {
    const fail = pick(filterEnabledCatalog(profile, cfg.macroSource, cfg.macroTable())).e;
    let tmin = cfg.mainMin, tmax = cfg.mainMax;
    // Use session-specific void windows if set
    if (profileMode === 'train_rookie' && typeof rookieVoidMin !== 'undefined') { tmin = rookieVoidMin; tmax = rookieVoidMax; }
    else if (profileMode === 'train_pro' && typeof proVoidMin !== 'undefined') { tmin = proVoidMin; tmax = proVoidMax; }
    return {
      kind: 'full',
      desc: `<b>GAVE UP:</b> ${fail.flow}`,
      guide: fail.guide,
      tmin, tmax
    };
  }

  // --- 5. STANDARD / NPT / EARLY / others ---
  const macroTbl = cfg.macroTable();
  const fullEnabled = filterEnabledCatalog(profile, cfg.macroSource, macroTbl);
  const idx = Math.floor(((roll - 1) / 20) * fullEnabled.length);
  const b = fullEnabled[clamp(idx, 0, fullEnabled.length - 1)].e;

  let tmin, tmax;
  if (profileMode === 'npt') {
    const nptRange = nptVoidMax - nptVoidMin;
    const nptBands = [
      { max: 3, lo: 0,   hi: 0.2 },
      { max: 7, lo: 0.2, hi: 0.6 },
      { max: Infinity, lo: 0.6, hi: 1.0 }
    ];
    const band = nptBands.find(b => idx <= b.max);
    tmin = nptVoidMin + Math.ceil(nptRange * band.lo);
    tmax = band.hi < 1.0 ? nptVoidMin + Math.ceil(nptRange * band.hi) : nptVoidMax;
  } else {
    const stdBands = [
      { max: 3, tmin: 15, tmax: 30 },
      { max: 7, tmin: 30, tmax: 60 },
      { max: Infinity, tmin: 60, tmax: 90 }
    ];
    const band = stdBands.find(b => idx <= b.max);
    tmin = band.tmin;
    tmax = band.tmax;
  }

  return { kind: 'full', desc: b.flow, guide: b.guide, tmin, tmax };
}


function rollMicroForMode() {
  return getProfileConfig().microDie();
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

  const schedulerType = getProfileConfig().scheduler;

  if (schedulerType === 'chaos') {
      clearTimeout(mainTimer);
      clearTimeout(preChimeTimer);
      
      const lbl = $('countdown');
      if (lbl) lbl.innerHTML = `<span style="color:#ff7675">Press the button when you need to go!</span>`;
      
      return; // Stop. No automated timer — user presses Quick Roll button.
  }

  // DEPENDENT MODE — queue-based scheduling
  if (schedulerType === 'dependent') {
    scheduleDependentEvent();
    return;
  }

  // GAUNTLET-ONLY MODE — timer fires random gauntlets
  if (schedulerType === 'gauntlet') {
    clearTimeout(mainTimer);
    clearTimeout(preChimeTimer);

    const cfg = getProfileConfig();
    const min = windowOverride?.min ?? cfg.mainMin;
    const max = windowOverride?.max ?? cfg.mainMax;
    const minutes = randInt(min, max);
    mainEndAt = Date.now() + (minutes * 60000);

    logToOutput(`<span style="color:#a29bfe;">🎯 Next gauntlet in ~${minutes} min.</span>`);

    // Pre-chime 30s before
    preChimeTimer = setTimeout(() => {
      startChime(randInt(600, 900));
    }, Math.max(0, (minutes * 60000) - 30000));

    mainTimer = setTimeout(() => {
      if (!sessionRunning) return;
      const diff = window.gauntletDifficulty || 'medium';
      const seq = buildRandomGauntlet(diff);
      showBanner('🎯 GAUNTLET INCOMING', 'Prepare yourself...', 'high');
      setTimeout(() => {
        acknowledgeAlarm();
        startVoidGuide(seq, `<b>GAUNTLET (${diff.toUpperCase()}):</b> ${seq.length} steps — hold everything!`, 'gauntlet');
      }, 2000);
    }, minutes * 60000);

    return;
  }

  const runtime = customProfileRuntime;
  // BABYSITTER — custom micro scheduling
  if (schedulerType === 'babysitter') {
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
      mostly_incontinent: [0, 1],
      fully_incontinent: [0, 1]
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
      const microDelay = randInt(8, Math.ceil(minutes / 2)); // Early in cycle
      // Space micros at least 6 minutes apart to avoid stacking
      const spacedDelay = microDelay + (i * 6);
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

  // 2. Determine Base Windows (from profile config)
  const cfg = getProfileConfig();
  let min = runtime?.mainMin ?? cfg.mainMin;
  let max = runtime?.mainMax ?? cfg.mainMax;

  if (windowOverride && windowOverride.min && windowOverride.max) {
    min = windowOverride.min;
    max = windowOverride.max;
  }
  // --- BIO-ADAPTIVE LOGIC ---
  else if (cfg.scheduler === 'bio' && window.playerBio && window.playerBio.active) {
    const base = window.playerBio.virtualMaxTime;
    min = Math.floor(base * 0.8);
    max = Math.floor(base * 1.2);
    logToOutput(`<span class="muted">🧬 <b>Bio-Adaptive:</b> Targeting ${window.playerBio.virtualCapacity}ml (Approx ${base.toFixed(0)}m).</span>`);
  }

  // 3. PRESSURE OVERRIDE (Urgency Multiplier - Preserved)
  // This ensures high manual slider values still accelerate the timer
  let urgencyMultiplier = 1.0;
  const pressureBands = [
    { min: 90, mult: 0.2 },
    { min: 75, mult: 0.4 },
    { min: 50, mult: 0.7 }
  ];
  const pBand = pressureBands.find(b => manualPressure >= b.min);
  if (pBand) urgencyMultiplier = pBand.mult;

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

function alarmMain() {
  const cfg = getProfileConfig();

  if (cfg.alarmFn === 'training') {
    showTrainingChoice();
    startChime(600);
    return;
  }

  // Use alarm text from config
  const [title, sub] = cfg.alarmText || ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'];
  showBanner(title, sub, 'high');
  startChime(randInt(800, 1200));
}

/* Replaces existing scheduleNextMicro in app.js */
/* Replaces existing scheduleNextMicro in app.js */
function scheduleNextMicro() {
  clearTimeout(microTimer);
  
  const cfg = getProfileConfig();
  if (!sessionRunning || !microNoiseOn || cfg.scheduler === 'dependent') return;

  // Standard Timing Logic
  const now = Date.now();
  if (cfg.scheduler !== 'dependent' && (now < microPauseUntilTs || (mainEndAt && (mainEndAt - now) <= 8 * 60000))) {
    microEndAt = null;
    microTimer = setTimeout(scheduleNextMicro, 30000);
    return;
  }

  const runtime = customProfileRuntime;
  let min = runtime?.microMin ?? cfg.microMin;
  let max = runtime?.microMax ?? cfg.microMax;

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

/* ========== MOBILE BROWSER COMPATIBILITY ========== */

// Resume AudioContext on first user interaction (required by mobile browsers)
document.addEventListener('click', function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: false });

document.addEventListener('touchstart', function resumeAudioTouch() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: false, passive: true });

// Catch up timers after mobile tab comes back from background
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !sessionRunning) return;

  const now = Date.now();

  // Resume AudioContext when returning
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  // Check if main timer should have fired while backgrounded
  if (mainEndAt && now >= mainEndAt) {
    clearTimeout(mainTimer);
    clearTimeout(preChimeTimer);
    alarmMain();
  }

  // Check if micro timer should have fired
  if (microEndAt && now >= microEndAt) {
    clearTimeout(microTimer);
    if (microNoiseOn && profileMode !== 'dependent') {
      pendingAmbientEvent = prerollEvent('micro');
      showBanner("⚠️ <b>BLADDER SPASM</b>", "Status uncertain...", 'high');
      startChime(randInt(800, 1200));
      scheduleNextMicro();
    }
  }

  // Vibrate on return if there's a pending alarm
  if (typeof navigator.vibrate === 'function') {
    const banner = $('alarmBanner');
    if (banner && banner.style.display !== 'none') {
      navigator.vibrate([200, 100, 200]);
    }
  }
});

