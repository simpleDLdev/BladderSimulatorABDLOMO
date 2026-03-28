/* ===========================
   profiles/omorashi.js — Omorashi hold profile
   =========================== */

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
    
    const test = pick(filterByTags(OMORASHI_HOLDING_GUIDES));
    
    logToOutput(`<span style="color:#81ecec"><b>🏋️ Stress Test:</b> ${test.label}<br>Focus on your control. Hold steady.</span>`);
    
    // Mark guide as active to prevent stacking
    omorashiGuideActive = true;
    
    // Show the guide
    startVoidGuide(test.guide, `<b>${test.label}</b><br>HOLD. Do not leak.`, 'gauntlet');
    
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

      // PATH 1: Has a potty pass → consume it and go directly
      if (pottyPasses > 0 && !hasCurse('no_free_passes')) {
        consumePottyPass('Manual potty request');
        logToOutput(`<div style="border:1px solid #81ecec; padding:8px; border-radius:5px; margin-top:5px;">
          <span style="color:#81ecec; font-weight:bold;">🎟️ POTTY PASS USED</span> <span style="color:#888; font-size:0.8em;">(${pottyPasses} left)</span><br>
          <span style="font-size:0.9em; color:#ccc;">Babysitter: "Fine, use your pass. Go now, no stalling."</span><br>
          <b style="color:#fff; background:#55efc4; color:#000; padding:2px 6px; border-radius:4px;">ACTION: Go to restroom now.</b>
        </div>`);
        trackDayEvent('potty_success');
        babysitterDryStreak++;

        const pottyGuide = [
          { text: "GO TO POTTY", time: 0, type: "stop" },
          ...generateRandomGuideSteps('moderate')
        ];
        startVoidGuide(pottyGuide, '👩‍🍼 <b>Potty Pass:</b> Go now and empty.', 'full_light');

        const checkDelay = randInt(2, 3) * 60000;
        setTimeout(() => {
          if (sessionRunning && profileMode === 'babysitter') triggerBabysitterPottyCheck();
        }, checkDelay);
        return;
      }

      // PATH 2: No pass → decision based on how much time is left until next scheduled event
      const secsLeft = getMainTimerRemaining();
      const totalWindowSecs = mainEndAt ? Math.max(1, (mainEndAt - Date.now() + secsLeft * 1000) / 1000) : secsLeft;
      // Calculate rough fraction of cycle remaining
      const fractionLeft = mainEndAt ? Math.max(0, (mainEndAt - Date.now()) / Math.max(1, mainEndAt - (Date.now() - secsLeft * 1000))) : 1;
      const minsLeft = Math.ceil(secsLeft / 60);

      // Vague time descriptions
      const timeDesc = minsLeft > 30 ? 'a really long time'
        : minsLeft > 15 ? 'quite a while'
        : minsLeft > 8 ? 'a little while'
        : 'not too much longer';

      // HIGH time remaining (>40% of cycle) → flat denial
      if (secsLeft > 480) {
        const denyMessages = [
          `"There's still ${timeDesc} until your next potty check. Hold it."`,
          `"I just checked you not long ago. You've got ${timeDesc} to go — hold it or use your protection."`,
          `"No way. You've got ${timeDesc} left. That's what your padding is for."`,
          `"Not happening. There's ${timeDesc} before I'll even think about it. Deal with it."`,
          `"You can wait. It's only been a little bit — there's still ${timeDesc}."`
        ];
        const msg = denyMessages[Math.floor(Math.random() * denyMessages.length)];

        logToOutput(`<div style="border:1px solid #ff7675; padding:8px; border-radius:5px; margin-top:5px;">
          <span style="color:#ff7675; font-weight:bold;">❌ DENIED</span><br>
          <span style="font-size:0.9em; color:#ccc;">Babysitter: ${msg}</span>
        </div>`);

        // Possible spasm from the stress of being denied
        const denyLeakRisk = hasSymptom('urge_incontinence') ? 0.5 : 0.3;
        if (Math.random() < denyLeakRisk && manualPressure >= 50) {
          const payload = createBabysitterLeakPayload('spasm', 'Denied Request Spasm');
          emitBabysitterEvent('leak', { payload });
          logToOutput(`<span style="color:#fdcb6e;">💢 <b>Denial Spasm:</b> The stress of being told no triggered a leak.</span>`);
        }
        return;
      }

      // MEDIUM time remaining (4-8 min) → denied with sympathy
      if (secsLeft > 240) {
        const sympathyMessages = [
          `"I know it's getting tough, but there's still ${timeDesc}. Just hold on a bit more."`,
          `"You're doing okay. There's ${timeDesc} — try to make it. That's what your padding is there for, just in case."`,
          `"Almost there... well, not quite. ${timeDesc} to go. Squeeze tight."`,
          `"Hang in there. ${timeDesc} more. If you really can't, that's what you're wearing protection for."`
        ];
        const msg = sympathyMessages[Math.floor(Math.random() * sympathyMessages.length)];

        logToOutput(`<div style="border:1px solid #fdcb6e; padding:8px; border-radius:5px; margin-top:5px;">
          <span style="color:#fdcb6e; font-weight:bold;">⏳ NOT YET</span><br>
          <span style="font-size:0.9em; color:#ccc;">Babysitter: ${msg}</span>
        </div>`);

        const denyLeakRisk = hasSymptom('urge_incontinence') ? 0.4 : 0.2;
        if (Math.random() < denyLeakRisk && manualPressure >= 60) {
          const payload = createBabysitterLeakPayload('spasm', 'Denied Request Spasm');
          emitBabysitterEvent('leak', { payload });
          logToOutput(`<span style="color:#fdcb6e;">💢 <b>Hold Spasm:</b> Trying to hold triggered a small leak.</span>`);
        }
        return;
      }

      // LOW time remaining (<4 min) → gauntlet exception granted
      const gauntlet = generateBabysitterGauntlet();
      const gauntletDuration = gauntlet.reduce((sum, s) => sum + s.time, 0);

      logToOutput(`<div style="border:1px solid #fdcb6e; padding:8px; border-radius:5px; margin-top:5px;">
        <span style="color:#fdcb6e; font-weight:bold;">⚡ HOLD GAUNTLET</span> <span style="color:#888; font-size:0.8em;">(Exception — ${gauntlet.length} steps, ~${gauntletDuration}s)</span><br>
        <span style="font-size:0.9em; color:#ccc;">Babysitter: "Okay, there's ${timeDesc}. Since you're close, prove you can hold through this and I'll let you go."</span>
      </div>`);

      const pottyGuide = [
        ...gauntlet,
        { text: "GO TO POTTY", time: 0, type: "stop" },
        ...generateRandomGuideSteps('light')
      ];
      startVoidGuide(pottyGuide, '👩‍🍼 <b>Hold Gauntlet:</b> Prove you need it, then you can go.', 'full_light');

      const checkDelay = randInt(2, 3) * 60000;
      setTimeout(() => {
        if (sessionRunning && profileMode === 'babysitter') triggerBabysitterPottyCheck();
      }, checkDelay);
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
    if (typeof trackSessionStat === 'function') {
      trackSessionStat('potty_success');
    }
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
  const gauntlet = pick(filterByTags(OMORASHI_GAUNTLETS));
  
  startVoidGuide(gauntlet.guide, `<b>${gauntlet.name}</b><br>Complete this challenge. Then you may release.`, 'gauntlet');
  
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
  logToOutput(`<span style="color:#ff6b6b"><b>💦 ACCIDENT!</b><br>You could not hold any longer. Full release into ${formatProtectionLevel(currentProtectionLevel)}.</span>`);
  
  // Stop the session
  omorashiSessionActive = false;
  clearInterval(tickInterval);
  clearTimeout(omorashiStressTestTimer);
  $('btnCanIGo').style.display = 'none';
  
  startChime(440); // Alarm sound
  toast("Accident recorded!");
}


