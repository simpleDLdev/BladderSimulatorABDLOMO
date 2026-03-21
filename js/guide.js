/* ===========================
   guide.js — Void guide overlay system
   =========================== */

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
  // Show the inline event browser when the overlay opens
  if (typeof showVoidBrowser === 'function') showVoidBrowser();
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
      stopChime(); // Chime stops when user commits to the event
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

/* === RANDOM GUIDE STEP GENERATOR === */
function generateRandomGuideSteps(intensity) {
  const configs = {
    light:    { minSteps: 2, maxSteps: 3, minTime: 1, maxTime: 4 },
    moderate: { minSteps: 3, maxSteps: 5, minTime: 2, maxTime: 8 },
    heavy:    { minSteps: 4, maxSteps: 7, minTime: 3, maxTime: 12 }
  };
  const cfg = configs[intensity] || configs.moderate;

  const vocabulary = {
    push:  ["PUSH", "PUSH OUT", "EMPTY", "GUSH", "SPURT", "DRAIN", "FORCE OUT", "RELEASE"],
    relax: ["RELAX", "BREATHE", "EASE UP", "LET FLOW", "SOFTEN", "GENTLE FLOW", "SLOW STREAM"],
    stop:  ["HOLD", "CLENCH", "STOP", "SQUEEZE", "TIGHTEN", "CLAMP"]
  };

  const types = ['push', 'relax', 'stop'];
  const numSteps = randInt(cfg.minSteps, cfg.maxSteps);
  const steps = [];
  let lastType = '';

  for (let i = 0; i < numSteps; i++) {
    let type;
    if (i === 0) {
      type = Math.random() < 0.6 ? 'relax' : 'push';
    } else if (i === numSteps - 1) {
      type = Math.random() < 0.5 ? 'push' : 'relax';
    } else {
      do { type = types[Math.floor(Math.random() * types.length)]; } while (type === lastType);
    }

    const texts = vocabulary[type];
    const text = texts[Math.floor(Math.random() * texts.length)];
    const time = randInt(cfg.minTime, cfg.maxTime);

    steps.push({ text, time, type });
    lastType = type;
  }

  return steps;
}

/* === BABYSITTER GAUNTLET GENERATOR === */
function generateBabysitterGauntlet() {
  // Protection determines base difficulty — heavier protection = harder gauntlet
  const cfgs = {
    pad:           { minSteps: 2, maxSteps: 3, minTime: 3, maxTime: 6 },
    pullups:       { minSteps: 3, maxSteps: 5, minTime: 3, maxTime: 8 },
    diapers:       { minSteps: 4, maxSteps: 6, minTime: 4, maxTime: 10 },
    thick_diapers: { minSteps: 5, maxSteps: 8, minTime: 5, maxTime: 12 }
  };
  const cfg = { ...(cfgs[currentProtectionLevel] || cfgs.pullups) };

  // Continence modifiers — lower continence = shorter gauntlet (more sympathy)
  const level = currentContinenceLevel;
  if (level === 'somewhat_incontinent') {
    cfg.maxSteps = Math.max(cfg.minSteps, cfg.maxSteps - 1);
  } else if (level === 'mostly_incontinent' || level === 'fully_incontinent') {
    cfg.minSteps = Math.max(2, cfg.minSteps - 1);
    cfg.maxSteps = Math.max(2, cfg.maxSteps - 2);
    cfg.maxTime = Math.min(cfg.maxTime, 6);
  }

  // Urgency modifier — higher urgency = shorter gauntlet
  if (manualPressure > 75) {
    cfg.maxSteps = Math.max(cfg.minSteps, cfg.maxSteps - 1);
    cfg.maxTime = Math.max(cfg.minTime, cfg.maxTime - 2);
  }

  const holdTexts = ["SQUEEZE TIGHT", "HOLD IT", "CROSS LEGS", "KEGEL HARD", "CLAMP DOWN",
                     "DON'T LET GO", "PRESS HARD", "FLEX & HOLD", "LOCK DOWN", "TIGHTEN UP"];
  const leakTexts = ["LOSING GRIP", "SPASM", "PRESSURE WAVE", "SPHINCTER FLUTTER", "URGE SPIKE"];

  // Leak risk based on continence — lower continence = more leak steps
  const leakRisk = {
    fully_continent: 0.0, mostly_continent: 0.1,
    somewhat_incontinent: 0.25, mostly_incontinent: 0.4, fully_incontinent: 0.6
  }[level] || 0.15;

  const numSteps = randInt(cfg.minSteps, cfg.maxSteps);
  const steps = [];

  for (let i = 0; i < numSteps; i++) {
    const isLeak = Math.random() < leakRisk;
    const texts = isLeak ? leakTexts : holdTexts;
    const text = texts[Math.floor(Math.random() * texts.length)];
    const time = randInt(cfg.minTime, cfg.maxTime);
    const type = isLeak ? (Math.random() < 0.5 ? 'push' : 'relax') : 'stop';
    steps.push({ text, time, type });
  }

  return steps;
}

/* === GAUNTLET-ONLY MODE — Random Builder === */
function buildRandomGauntlet(difficulty) {
  // difficulty: 'easy' | 'medium' | 'hard'
  const cfg = {
    easy:   { blocks: 3, timeScale: 0.7 },
    medium: { blocks: 5, timeScale: 1.0 },
    hard:   { blocks: 7, timeScale: 1.3 }
  }[difficulty] || { blocks: 5, timeScale: 1.0 };

  const pool = [...GAUNTLET_STEP_POOL];
  const cats = [...new Set(pool.map(b => b.cat))];
  const picked = [];

  // Ensure category diversity — pick 1 from each category first (up to block count)
  const shuffledCats = cats.sort(() => Math.random() - 0.5);
  for (const cat of shuffledCats) {
    if (picked.length >= cfg.blocks) break;
    const fromCat = pool.filter(b => b.cat === cat);
    if (fromCat.length > 0) {
      const choice = fromCat[Math.floor(Math.random() * fromCat.length)];
      picked.push(choice);
      pool.splice(pool.indexOf(choice), 1);
    }
  }

  // Fill remaining slots randomly from what's left
  while (picked.length < cfg.blocks && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }

  // Shuffle pick order
  picked.sort(() => Math.random() - 0.5);

  // Flatten blocks into a single step sequence
  // Each step's time is randomized from its [min, max] range, then scaled by difficulty
  const steps = [];
  for (const block of picked) {
    for (const s of block.steps) {
      const base = randInt(s.t[0], s.t[1]);
      const scaled = Math.max(3, Math.round(base * cfg.timeScale));
      steps.push({ text: s.text, time: scaled, type: "stop" });
    }
  }

  return steps;
}

/* --- Updated State Variable --- */
let isRestroomTrip = false;
let isPreviewMode = false; // Set true when event is being previewed from Event Builder

function closeVoidGuide() {
  clearInterval(guideInterval);
  stopChime(); // Ensure chime stops when guide is dismissed
  showPushToLeakButton(false);

  // Preview mode: keep overlay open for browsing more events
  if (isPreviewMode) {
    isPreviewMode = false;
    // Reset guide visuals to idle state but keep overlay visible
    $('voidLabel').textContent = 'BROWSE MODE';
    $('voidLabel').style.color = '#74b9ff';
    $('voidTimer').style.display = 'none';
    $('voidActionBtn').style.display = 'none';
    $('voidInstruction').innerHTML = '<span style="color:#74b9ff;">Use the browser below to try another event, or close the overlay.</span>';
    if (typeof showVoidBrowser === 'function') showVoidBrowser();
    return;
  }

  $('voidOverlay').style.display = 'none';

  // --- ABORT PENALTY CHECK ---
  // If the guide is NOT complete AND it wasn't a restroom trip...
  if (!isGuideComplete && !isRestroomTrip) {
    if (currentGuideType === 'gauntlet') {
      logToOutput(`<span style="color:#00cec9; font-style:italic;">⚠️ <b>Gauntlet Aborted:</b> Skipped early. Next one still coming...</span>`);
      if (sessionRunning) {
        scheduleMainEvent({ min: window.gauntletIntervalMin || 5, max: window.gauntletIntervalMax || 20 });
      }
      return;
    }
    if (profileMode === 'chaos_manual') {
      logToOutput(`<span style="color:#ff7675; font-style:italic;">⚠️ <b>Skipped:</b> You bailed — maybe next time!</span>`);
      return;
    }
    logToOutput(`<span style="color:#7cc4ff; font-style:italic;">⚠️ <b>Guide Aborted:</b> You stopped early. Checking hydration levels...</span>`);
    triggerHydrationEvent(); // Force Drink
  }

  // ... (Rest of the function remains the same) ...

  if (isRestroomTrip && sessionRunning) {
    logToOutput(`<span style="color:#55efc4; font-size:0.9em;">⏱️ <b>Timer Reset:</b> Potty trip complete; scheduling next urge window.</span>`);
    scheduleMainEvent();
  }

  // Quick mode — no scheduled follow-ups, just log and return
  if (profileMode === 'chaos_manual') {
    if (isGuideComplete) {
      logToOutput(`<span style="color:#ff7675; font-style:italic;">🎲 Roll complete. Press the button when you're ready for another!</span>`);
    }
    return;
  }

  clearInterval(statusCheckInterval);
  let delayMins = 0;

  if (isRestroomTrip) {
    delayMins = 1;
    isRestroomTrip = false;
  } else if (isGuideComplete) {
    switch (currentGuideType) {
      case 'full':
        delayMins = randInt(5, 20);
        logToOutput(`<span style="color:#ff7675; font-style:italic;">⏳ Accident logged. You are being left to sit in it for a while. Status check in ~${delayMins} mins.</span>`);
        break;
      case 'micro': {
        const cfg = getProfileConfig();
        logToOutput(`<span style="color:#fab1a0; font-style:italic;">${cfg.microCompleteMsg}</span>`);
        return;
      }
      case 'gauntlet':
        logToOutput(`<span style="color:#00cec9; font-style:italic;">✅ <b>Gauntlet Complete!</b> Well held. Next one incoming...</span>`);
        if (sessionRunning) {
          scheduleMainEvent({ min: window.gauntletIntervalMin || 5, max: window.gauntletIntervalMax || 20 });
        }
        return;
      default:
        scheduleForcedCheck();
        return;
    }
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

