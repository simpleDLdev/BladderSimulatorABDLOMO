/* ===========================
   profiles/training.js — Training profile (Rookie/Pro/Chaos)
   =========================== */

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


