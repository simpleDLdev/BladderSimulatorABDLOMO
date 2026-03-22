/* ===========================
   ui.js — All UI/DOM functions, modals, info system
   =========================== */


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


function togglePushToLeak(enabled) {
  pushToLeakEnabled = enabled;
  localStorage.setItem('pushToLeakEnabled', JSON.stringify(enabled));
  toast(enabled ? '🫳 Push-to-Leak ON: Hold button during leaks' : '🫳 Push-to-Leak OFF');
}

function togglePushToLeakSkipLong(enabled) {
  pushToLeakSkipLong = enabled;
  localStorage.setItem('pushToLeakSkipLong', JSON.stringify(enabled));
}

function toggleDeskMode(enabled) {
  deskModeEnabled = enabled;
  localStorage.setItem('deskModeEnabled', JSON.stringify(enabled));
  toast(enabled ? '🪑 Desk Mode ON: Movement events filtered' : '🪑 Desk Mode OFF');
}

function toggleInvoluntaryFilter(enabled) {
  involuntaryFilterEnabled = enabled;
  localStorage.setItem('involuntaryFilterEnabled', JSON.stringify(enabled));
  toast(enabled ? '🚫 Involuntary actions filtered' : '🚫 Involuntary filter OFF');
}

function initPushToLeakUI() {
  // Restore toggle state
  const toggle = $('pushToLeakToggle');
  if (toggle) toggle.checked = pushToLeakEnabled;
  const skipToggle = $('pushToLeakSkipLongToggle');
  if (skipToggle) skipToggle.checked = pushToLeakSkipLong;

  // Restore desk mode & involuntary filter toggles
  const deskToggle = $('deskModeToggle');
  if (deskToggle) deskToggle.checked = deskModeEnabled;
  const invToggle = $('involuntaryFilterToggle');
  if (invToggle) invToggle.checked = involuntaryFilterEnabled;
  
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
  // Chime keeps ringing until user presses START in guide or Stop Event button

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
  } else if (profileMode === 'gauntlet_only' || profileMode === 'chaos_manual') {
    if (omorashiSetup) omorashiSetup.style.display = 'none';
    if (hydrationTrigger) hydrationTrigger.style.display = 'none';
    if (btnCanIGo) btnCanIGo.style.display = 'none';
    if (btnILeaked) btnILeaked.style.display = 'none';
    if (babysitterPanel) babysitterPanel.style.display = 'none';
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
  if (window.hydrationEnabled === false) return;

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

  const cfg = getProfileConfig();

  // Chaos mode merges all tables into one group
  if (cfg.scheduler === 'chaos') {
      const grpChaos = document.createElement('optgroup'); 
      grpChaos.label = "🔥 CHAOS (All Tables)";
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
      window.currentDebugMacros = allMacros;
      return; 
  }

  // All other profiles: read tables from config
  const macroList = cfg.macroSource ? cfg.macroTable() : [];
  const microList = cfg.microTable();

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
  if (window.hydrationEnabled === false) return;
  // 1. Define Intensity from config
  const cfg = getProfileConfig();
  const [min, max] = cfg.hydrationSips;

  // 2. Roll Content
  const count = randInt(min, max);
  const unitType = (count >= 6) ? "large gulps" : "sips";
  const drinkType = pick(["Water", "Coffee/Soda"]);

  const templates = [
    `<b>Hydration Order:</b> Take <b>${count} ${unitType}</b> of your <b>${drinkType}</b> immediately.`,
    `<b>Drink Check:</b> Time for <b>${count} ${unitType}</b> of your <b>${drinkType}</b>. No excuses.`,
    `<b>Refill Request:</b> Pour yourself <b>${drinkType}</b> and take <b>${count} ${unitType}</b> now.`,
    `<b>Forced Hydration:</b> You're looking thirsty. <b>${count} ${unitType}</b> of <b>${drinkType}</b>, please.`,
    `<b>Bladder Maintenance:</b> Feed the cycle with <b>${count} ${unitType}</b> of <b>${drinkType}</b>.`,
    `<b>Top Up:</b> Ensure the flow continues. <b>${count} ${unitType}</b> of <b>${drinkType}</b>.`,
    `<b>Liquid Intake:</b> <b>${count} ${unitType}</b> of <b>${drinkType}</b>. Keep the pressure rising.`
  ];

  const msg = pick(templates);

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
  if (window.hydrationEnabled === undefined) window.hydrationEnabled = true;
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
    } else if (profileMode === 'gauntlet_only') {
      // Load gauntlet setup
      const setupStr = localStorage.getItem('gauntlet_only_setup');
      if (setupStr) {
        const setup = JSON.parse(setupStr);
        window.gauntletDifficulty = setup.difficulty || 'medium';
        window.gauntletIntervalMin = setup.intervalMin || 5;
        window.gauntletIntervalMax = setup.intervalMax || 20;
      } else {
        window.gauntletDifficulty = 'medium';
        window.gauntletIntervalMin = 5;
        window.gauntletIntervalMax = 20;
      }
      const diff = window.gauntletDifficulty;
      logToOutput(`<span style="color:#00cec9"><b>🎯 Gauntlet Mode Started</b><br>Difficulty: ${diff.toUpperCase()} | Interval: ${window.gauntletIntervalMin}-${window.gauntletIntervalMax} min</span>`);
      scheduleMainEvent({ min: window.gauntletIntervalMin, max: window.gauntletIntervalMax });
    } else if (profileMode === 'chaos_manual') {
      // Quick Session — load saved table selections, show Quick Go button
      const savedTables = JSON.parse(localStorage.getItem('quickModeTables') || '["FULL_D20"]');
      window.quickModeTables = savedTables;
      const btn = $('btnQuickGo');
      if (btn) btn.style.display = 'block';
      scheduleMainEvent(); // Sets the countdown label
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

    if (profileMode !== 'omorashi_hold' && profileMode !== 'gauntlet_only') {
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

  // Hide Quick Mode button
  const btnQ = $('btnQuickGo');
  if (btnQ) {
    btnQ.style.display = 'none';
    btnQ.textContent = '🚽 I Need to Go!';
    btnQ.onclick = quickModeRoll;
  }
  const btnMorning = $('btnBedMorning');
  if (btnMorning) btnMorning.style.display = 'none';

  // Remove quick prefs panel
  const qpp = $('quickPrefsPanel');
  if (qpp) qpp.remove();

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
  const isFirstVisit = !localStorage.getItem('abdlSimState') && !localStorage.getItem('profileMode');

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

  if ($('sessionSetupProfileStep')) $('sessionSetupProfileStep').style.display = 'none';
  if ($('profileDetailsPanel')) $('profileDetailsPanel').style.display = 'none';
  if ($('diaperingSetup')) $('diaperingSetup').style.display = 'none';
  const qm = $('quickModeSetup');
  if (qm) qm.remove();

  // First visit: show welcome step, hide session type chooser and info buttons
  if (isFirstVisit) {
    if ($('welcomeStep')) $('welcomeStep').style.display = 'block';
    if ($('sessionTypeStep')) $('sessionTypeStep').style.display = 'none';
    if ($('sessionSetupInfoBtns')) $('sessionSetupInfoBtns').style.display = 'none';
    if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = '';
  } else {
    if ($('welcomeStep')) $('welcomeStep').style.display = 'none';
    if ($('sessionTypeStep')) $('sessionTypeStep').style.display = '';
    if ($('sessionSetupInfoBtns')) $('sessionSetupInfoBtns').style.display = 'flex';
    if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = 'What kind of session?';
  }

  updateContinencePreview();
  $('sessionSetupBackdrop').style.display = 'block';
}

function dismissWelcome() {
  if ($('welcomeStep')) $('welcomeStep').style.display = 'none';
  if ($('sessionTypeStep')) $('sessionTypeStep').style.display = '';
  if ($('sessionSetupInfoBtns')) $('sessionSetupInfoBtns').style.display = 'flex';
  if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = 'What kind of session?';
}

function closeSessionSetupModal() {
  $('sessionSetupBackdrop').style.display = 'none';
}

/* ===== SESSION TYPE CHOOSER (Quick vs Full vs Bedwetting) ===== */

function chooseQuickSession() {
  if ($('sessionTypeStep')) $('sessionTypeStep').style.display = 'none';
  if ($('sessionSetupProfileStep')) $('sessionSetupProfileStep').style.display = 'none';
  if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = '';
  showQuickModeSetup();
}

function chooseFullSession() {
  if ($('sessionTypeStep')) $('sessionTypeStep').style.display = 'none';
  if ($('sessionSetupProfileStep')) $('sessionSetupProfileStep').style.display = 'block';
  if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = 'Choose your profile to begin';
}

function chooseBedwettingSession() {
  if ($('sessionTypeStep')) $('sessionTypeStep').style.display = 'none';
  if ($('sessionSetupProfileStep')) $('sessionSetupProfileStep').style.display = 'none';
  if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = '';
  showBedwettingSetup();
}

/* --- Quick Mode Table Descriptions (ABDL/Omorashi themed) --- */
/* ===== QUICK SESSION: GUIDED SETUP ===== */

// Single-step setup: pick continence level → auto-selects event tables & hold chance
// Messing events are always manual (never auto-included)

const QUICK_CONTINENCE_MAP = {
  fully_continent: {
    holdChance: 78,
    tables: ['OMORASHI_GAUNTLETS', 'MESSY_HOLDING_GAUNTLETS_D10'],
    summary: 'Holding challenges & endurance. Accidents are very rare.',
  },
  mostly_continent: {
    holdChance: 55,
    tables: ['FULL_D20', 'OMORASHI_GAUNTLETS'],
    summary: 'Mostly holding, occasional close calls and small leaks.',
  },
  somewhat_incontinent: {
    holdChance: 35,
    tables: ['FULL_D20', 'FULL_TRAINING_FAILURES'],
    summary: 'Frequent leaks and training failures. Unreliable control.',
  },
  mostly_incontinent: {
    holdChance: 18,
    tables: ['FULL_D20', 'FULL_TRAINING_FAILURES', 'MACRO_DEPENDENT_D20'],
    summary: 'Poor control — most urges end in an accident or flood.',
  },
  fully_incontinent: {
    holdChance: 8,
    tables: ['MACRO_DEPENDENT_D20', 'FULL_D20'],
    summary: 'No real control. Every urge is basically an accident.',
  },
};

// Quick session event preference definitions (no messy — that's always manual)
const QUICK_EVENT_PREFS = [
  { key: 'holding',    emoji: '💧', label: 'Holding Challenges', tables: ['OMORASHI_GAUNTLETS', 'MESSY_HOLDING_GAUNTLETS_D10'], color: '#81ecec' },
  { key: 'accidents',  emoji: '🚽', label: 'Potty Accidents',   tables: ['FULL_TRAINING_FAILURES', 'FULL_D20'],                color: '#ff7675' },
  { key: 'diapers',    emoji: '👶', label: 'Diaper Events',     tables: ['MACRO_DEPENDENT_D20', 'FULL_D20'],                   color: '#fab1a0' },
];

function showQuickModeSetup() {
  const saved = localStorage.getItem('quickContinence') || 'mostly_continent';
  const savedProt = localStorage.getItem('quickProtection') || currentProtectionLevel || 'pad';
  const savedHydration = localStorage.getItem('quickHydration') !== 'false';
  const savedPrefs = JSON.parse(localStorage.getItem('quickEventPrefs') || 'null');
  const savedCustom = localStorage.getItem('quickCustomMode') === 'true';
  const savedHold = parseInt(localStorage.getItem('quickCustomHold') || '45', 10);
  const savedCloseCall = parseInt(localStorage.getItem('quickCustomCloseCall') || '10', 10);

  // Default prefs based on continence if none saved
  const defaultPrefs = savedPrefs || getDefaultPrefsForLevel(saved);

  let prefChecks = '';
  for (const p of QUICK_EVENT_PREFS) {
    const checked = defaultPrefs.includes(p.key) ? 'checked' : '';
    prefChecks += `
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px 0;">
        <input type="checkbox" class="quickEvtPref" value="${p.key}" ${checked}
          style="width:18px; height:18px; accent-color:${p.color}; flex-shrink:0; cursor:pointer;">
        <span style="color:${p.color}; font-size:0.9em;">${p.emoji} ${p.label}</span>
      </label>`;
  }

  let html = `
    <div id="quickModeSetup" style="text-align:left;">
      <button onclick="backToSessionType()" style="background:none; border:none; color:#7cc4ff; cursor:pointer; font-size:13px; margin-bottom:12px; padding:0;">&larr; Back</button>
      <h2 style="color:#ff7675; margin:0 0 6px 0; text-align:center;">🚽 Quick Session</h2>
      <p style="color:#cdd7e6; font-size:0.88em; margin:0 0 14px 0; text-align:center; line-height:1.5;">
        Pick your setup and go.<br>
        <span style="color:#888; font-size:0.9em;">Press "I Need to Go!" whenever you feel the urge.</span>
      </p>

      <!-- What are you wearing? -->
      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #a29bfe44; margin-bottom:8px;">
        <div style="color:#a29bfe; font-weight:bold; margin-bottom:6px; font-size:0.92em;">🩳 What are you wearing?</div>
        <select id="quickProtectionSelect"
          style="width:100%; padding:8px 10px; background:#151923; color:#fff; border:1px solid #2b3348; border-radius:8px; font-size:13px; cursor:pointer;">
          <option value="none" ${savedProt === 'none' ? 'selected' : ''}>Nothing / Underwear</option>
          <option value="pad" ${savedProt === 'pad' ? 'selected' : ''}>Pad</option>
          <option value="pullups" ${savedProt === 'pullups' ? 'selected' : ''}>Pullups</option>
          <option value="diapers" ${savedProt === 'diapers' ? 'selected' : ''}>Diapers</option>
          <option value="thick_diapers" ${savedProt === 'thick_diapers' ? 'selected' : ''}>Thick Diapers</option>
        </select>
      </div>

      <!-- Continence Level -->
      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #a29bfe44; margin-bottom:8px;">
        <div style="color:#a29bfe; font-weight:bold; margin-bottom:6px; font-size:0.92em;">🧠 Continence Level</div>
        <select id="quickContinenceSelect" onchange="updateQuickContinencePreview(); updateQuickPrefsFromLevel();"
          style="width:100%; padding:8px 10px; background:#151923; color:#fff; border:1px solid #2b3348; border-radius:8px; font-size:13px; cursor:pointer;">
          <option value="fully_continent" ${saved === 'fully_continent' ? 'selected' : ''}>Fully Continent — strong control, rare leaks</option>
          <option value="mostly_continent" ${saved === 'mostly_continent' ? 'selected' : ''}>Mostly Continent — occasional close calls</option>
          <option value="somewhat_incontinent" ${saved === 'somewhat_incontinent' ? 'selected' : ''}>Somewhat Incontinent — frequent leaks</option>
          <option value="mostly_incontinent" ${saved === 'mostly_incontinent' ? 'selected' : ''}>Mostly Incontinent — poor control</option>
          <option value="fully_incontinent" ${saved === 'fully_incontinent' ? 'selected' : ''}>Fully Incontinent — no real control</option>
          <option value="custom" ${saved === 'custom' ? 'selected' : ''}>✏️ Custom</option>
        </select>
        <div id="quickContinencePreview" style="margin-top:8px; padding:8px; background:#0d1017; border-radius:8px; border:1px solid #2b334844; font-size:0.85em;"></div>
      </div>

      <!-- Event Types -->
      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #a29bfe44; margin-bottom:8px;">
        <div style="color:#a29bfe; font-weight:bold; margin-bottom:6px; font-size:0.92em;">🎯 Event Types</div>
        <div id="quickEventPrefs">${prefChecks}</div>
      </div>

      <!-- Hydration toggle -->
      <div style="background:#1b2030; padding:8px 14px; border-radius:12px; border:1px solid #a29bfe44; margin-bottom:8px; display:flex; align-items:center; gap:10px;">
        <input type="checkbox" id="quickHydrationToggle" ${savedHydration ? 'checked' : ''}
          style="width:18px; height:18px; accent-color:#81ecec; flex-shrink:0; cursor:pointer;">
        <label for="quickHydrationToggle" style="color:#81ecec; font-size:0.88em; cursor:pointer;">
          💧 Drink reminders <span style="color:#888; font-size:0.82em;">(off if already hydrated)</span>
        </label>
      </div>

      <!-- Custom / Advanced (hidden by default, shown when "Custom" selected) -->
      <div id="quickCustomPanel" style="display:${saved === 'custom' || savedCustom ? 'block' : 'none'}; background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #fdcb6e44; margin-bottom:10px;">
        <div style="color:#fdcb6e; font-weight:bold; margin-bottom:8px; font-size:0.92em;">⚙️ Custom Settings</div>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:8px;">
          Hold chance: <b id="quickCustomHoldLabel">${savedHold}%</b>
          <input type="range" id="quickCustomHoldSlider" min="0" max="95" value="${savedHold}"
            oninput="$('quickCustomHoldLabel').textContent=this.value+'%'"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
          <span style="display:flex; justify-content:space-between; color:#888; font-size:0.75em;">
            <span>0% (no control)</span><span>95% (iron bladder)</span>
          </span>
        </label>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:4px;">
          Close-call window: <b id="quickCustomCCLabel">${savedCloseCall}%</b>
          <input type="range" id="quickCustomCCSlider" min="0" max="30" value="${savedCloseCall}"
            oninput="$('quickCustomCCLabel').textContent=this.value+'%'"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
          <span style="display:flex; justify-content:space-between; color:#888; font-size:0.75em;">
            <span>0% (no close calls)</span><span>30% (frequent dribbles)</span>
          </span>
        </label>
      </div>

      <button onclick="quickStartSession()" style="width:100%; padding:14px; background:#ff7675; color:#000; font-weight:bold; font-size:1.1em; border:none; border-radius:10px; cursor:pointer;">🚽 Start Quick Session</button>
    </div>`;

  let container = $('quickModeSetup');
  if (container) {
    container.outerHTML = html;
  } else {
    $('sessionSetupProfileStep').insertAdjacentHTML('afterend', html);
  }

  updateQuickContinencePreview();
}

function getDefaultPrefsForLevel(level) {
  switch (level) {
    case 'fully_continent':       return ['holding'];
    case 'mostly_continent':      return ['holding', 'accidents'];
    case 'somewhat_incontinent':  return ['accidents'];
    case 'mostly_incontinent':    return ['accidents', 'diapers'];
    case 'fully_incontinent':     return ['diapers'];
    default:                      return ['accidents'];
  }
}

function updateQuickPrefsFromLevel() {
  const sel = $('quickContinenceSelect');
  if (!sel) return;
  const level = sel.value;
  const customPanel = $('quickCustomPanel');

  if (level === 'custom') {
    if (customPanel) customPanel.style.display = 'block';
    return;
  }

  if (customPanel) customPanel.style.display = 'none';

  // Auto-select event prefs for this level
  const defaults = getDefaultPrefsForLevel(level);
  document.querySelectorAll('.quickEvtPref').forEach(cb => {
    cb.checked = defaults.includes(cb.value);
  });
}

function updateQuickContinencePreview() {
  const sel = $('quickContinenceSelect');
  const preview = $('quickContinencePreview');
  if (!sel || !preview) return;

  const level = sel.value;

  if (level === 'custom') {
    preview.innerHTML = `
      <div style="color:#fdcb6e; font-weight:bold; font-size:0.95em; margin-bottom:4px;">✏️ Custom</div>
      <div style="color:#cdd7e6; font-size:0.82em; line-height:1.5;">Use the sliders below to set your own hold chance and close-call window.</div>
    `;
    return;
  }

  const qm = QUICK_CONTINENCE_MAP[level];
  const meta = (typeof CONTINENCE_PROFILE_META !== 'undefined') ? CONTINENCE_PROFILE_META[level] : null;

  let holdPct = qm ? qm.holdChance : 45;
  let summary = qm ? qm.summary : '';
  let rec = meta ? meta.recommendedProtection : '';
  let stats = meta?.stats || {};

  preview.innerHTML = `
    <div style="color:#a29bfe; font-weight:bold; font-size:0.95em; margin-bottom:4px;">${meta?.title || level}</div>
    <div style="color:#cdd7e6; font-size:0.82em; line-height:1.5; margin-bottom:6px;">${summary}</div>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:6px;">
      <span style="color:#55efc4; font-size:0.82em;">Hold chance: ~${holdPct}%</span>
      <span style="color:#fdcb6e; font-size:0.82em;">Accident risk: ${stats.accidentRisk || '—'}</span>
    </div>
    <div style="color:#888; font-size:0.78em;">Recommended: ${rec || 'Any'}</div>
  `;
}

function quickStartSession() {
  const sel = $('quickContinenceSelect');
  const level = sel ? sel.value : 'mostly_continent';
  const isCustom = level === 'custom';
  const qm = isCustom ? null : QUICK_CONTINENCE_MAP[level];
  const meta = (!isCustom && typeof CONTINENCE_PROFILE_META !== 'undefined') ? CONTINENCE_PROFILE_META[level] : null;

  // --- Event prefs: build table list from checked boxes ---
  const checkedPrefs = [];
  const selectedTables = [];
  document.querySelectorAll('.quickEvtPref:checked').forEach(cb => {
    checkedPrefs.push(cb.value);
    const pref = QUICK_EVENT_PREFS.find(p => p.key === cb.value);
    if (pref) {
      for (const t of pref.tables) {
        if (!selectedTables.includes(t)) selectedTables.push(t);
      }
    }
  });
  if (selectedTables.length === 0) selectedTables.push('FULL_D20'); // fallback

  localStorage.setItem('quickEventPrefs', JSON.stringify(checkedPrefs));

  // --- Custom mode hold/close-call ---
  let holdPct;
  let closeCallWindow = 10;
  if (isCustom) {
    const slider = $('quickCustomHoldSlider');
    holdPct = slider ? parseInt(slider.value, 10) : 45;
    const ccSlider = $('quickCustomCCSlider');
    closeCallWindow = ccSlider ? parseInt(ccSlider.value, 10) : 10;
    localStorage.setItem('quickCustomMode', 'true');
    localStorage.setItem('quickCustomHold', String(holdPct));
    localStorage.setItem('quickCustomCloseCall', String(closeCallWindow));
  } else {
    holdPct = qm ? qm.holdChance : 45;
    localStorage.setItem('quickCustomMode', 'false');
  }

  // Store custom overrides on window for quickModeRoll
  window._quickCustomHoldChance = isCustom ? holdPct : null;
  window._quickCloseCallWindow = closeCallWindow;

  // Set protection from chooser
  const protSel = $('quickProtectionSelect');
  const chosenProt = protSel ? protSel.value : 'pad';
  currentProtectionLevel = chosenProt;
  localStorage.setItem('quickProtection', chosenProt);
  if (typeof updateProtectionUI === 'function') updateProtectionUI();
  const protChooser = $('protectionChooser');
  if (protChooser) protChooser.value = chosenProt;

  // Hydration toggle
  const hydToggle = $('quickHydrationToggle');
  window.hydrationEnabled = hydToggle ? hydToggle.checked : true;
  localStorage.setItem('quickHydration', String(window.hydrationEnabled));

  // Mercy mode: OFF for mostly/fully incontinent, ON otherwise (custom = ON)
  const noMercyLevels = ['mostly_incontinent', 'fully_incontinent'];
  window.mercyMode = isCustom ? true : !noMercyLevels.includes(level);
  const mercyBtn = $('btnMercy');
  if (mercyBtn) {
    mercyBtn.textContent = window.mercyMode ? 'Mercy: ON' : 'Mercy: OFF';
    mercyBtn.style.color = window.mercyMode ? '#55efc4' : '#ff6b6b';
    mercyBtn.style.borderColor = window.mercyMode ? '#55efc4' : '#ff6b6b';
  }

  // Persist
  localStorage.setItem('quickContinence', level);
  localStorage.setItem('quickControlLevel', level);
  localStorage.setItem('quickModeTables', JSON.stringify(selectedTables));
  window.quickModeTables = selectedTables;
  window._quickControlLevel = level;

  // Set profile mode to chaos_manual
  profileMode = 'chaos_manual';
  localStorage.setItem('profileMode', 'chaos_manual');
  if (typeof applySelectedProfile === 'function') applySelectedProfile();

  // Close setup
  closeSessionSetupModal();
  const qmEl = $('quickModeSetup');
  if (qmEl) qmEl.remove();

  // Clear log & start session
  $('output').textContent = '';
  sessionRunning = true;
  sessionStartedAt = Date.now();
  manualPressure = 0;
  manualSaturation = 0;
  if (typeof updatePressureUI === 'function') updatePressureUI(0);
  if (typeof updateSaturationUI === 'function') updateSaturationUI(0);

  const title = isCustom ? `Custom (~${holdPct}%)` : (meta?.title || level);
  const protLabel = formatProtectionLevel ? formatProtectionLevel(chosenProt) : chosenProt;
  const prefLabels = checkedPrefs.map(k => { const p = QUICK_EVENT_PREFS.find(x => x.key === k); return p ? p.emoji + ' ' + p.label : k; }).join(', ');

  logToOutput(`<span style="color:#ff7675; font-size:1.1em;"><b>🚽 Quick Session Started</b></span>`);
  logToOutput(`<span style="color:#cdd7e6;">Continence: <b>${title}</b> | Wearing: <b>${protLabel}</b>${!window.mercyMode ? ' | Mercy: OFF' : ''}</span>`);
  logToOutput(`<span style="color:#888; font-size:0.85em;">Events: ${prefLabels || 'Default'}</span>`);
  logToOutput(`<div style="border:1px solid #ff7675; padding:12px; border-radius:10px; background:#1b2030; margin:8px 0;">
    <span style="color:#ff7675; font-size:1em;"><b>How it works:</b></span><br>
    <span style="color:#cdd7e6; font-size:0.9em;">When you feel the urge, hit the <b style="color:#ff7675;">"I Need to Go!"</b> button.<br>
    We'll roll the dice — sometimes you'll hold it, sometimes you won't! 🎲<br>
    Higher pressure &amp; saturation make accidents more likely.</span>
  </div>`);

  // Show sidebar summary
  showQuickSessionPrefsPanel(title, holdPct);

  const btn = $('btnQuickGo');
  if (btn) btn.style.display = 'block';

  const lbl = $('countdown');
  if (lbl) lbl.innerHTML = `<span style="color:#ff7675; font-size:1.1em;">Press the button when you need to go!</span>`;

  clearInterval(tickInterval);
  tickInterval = setInterval(setCountdownLabel, 1000);

  // Start hydration loop if enabled
  if (window.hydrationEnabled !== false) {
    scheduleNextHydration();
  }

  saveState();
}

function showQuickSessionPrefsPanel(continenceLabel, holdPct) {
  const existing = $('quickPrefsPanel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'quickPrefsPanel';
  panel.style.cssText = 'margin-top:12px;';
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; cursor:pointer;" onclick="toggleSidebarSection('quickPrefsContent')">
      <h2 style="margin:0; font-size:14px; color:#ff7675;"><span id="quickPrefsContentArrow" class="collapse-arrow collapsed">▼</span> 🚽 Quick Session</h2>
    </div>
    <div id="quickPrefsContent" style="display:none; background:#1b2030; padding:10px 12px; border-radius:10px; border:1px solid #ff767544; margin-top:4px;">
      <div style="margin-bottom:8px;">
        <span style="color:#888; font-size:12px;">Continence:</span>
        <span style="color:#ff7675; font-weight:bold; font-size:13px;"> ${continenceLabel} (~${holdPct}%)</span>
      </div>
      <button onclick="showSessionSetupModal()" style="width:100%; padding:8px; background:#0f1115; border:1px solid #ff767544; color:#ff7675; border-radius:6px; cursor:pointer; font-size:12px;">⚙️ Change Settings</button>
    </div>
  `;

  const sessionPanel = document.querySelector('.panel.stack');
  const firstHr = sessionPanel?.querySelector('.hr');
  if (firstHr) {
    firstHr.insertAdjacentElement('afterend', panel);
  } else if (sessionPanel) {
    sessionPanel.appendChild(panel);
  }
}

function backToSessionType() {
  const qm = $('quickModeSetup');
  if (qm) qm.remove();
  const bw = $('bedwettingSetup');
  if (bw) bw.remove();
  if ($('sessionTypeStep')) $('sessionTypeStep').style.display = '';
  if ($('sessionSetupSubtitle')) $('sessionSetupSubtitle').textContent = 'What kind of session?';
}

/* ---------- Quick-mode success messages ---------- */
const QUICK_SUCCESS_MESSAGES = [
  { msg: "You clench hard and the urge fades. Crisis averted!", emoji: "💪" },
  { msg: "A close call — you squirm in your seat but manage to hold on.", emoji: "😰" },
  { msg: "You cross your legs just in time. The wave passes.", emoji: "🌊" },
  { msg: "Deep breath... squeeze... the pressure drops. You made it.", emoji: "🧘" },
  { msg: "You grab yourself and hold tight. The spasm stops.", emoji: "✊" },
  { msg: "You freeze, barely breathing — and the urge slowly fades.", emoji: "😮‍💨" },
  { msg: "A desperate wiggle saves you. Not this time!", emoji: "🪑" },
  { msg: "You feel it coming but squeeze with everything you've got. Safe... for now.", emoji: "⏳" },
];

const QUICK_CLOSE_CALL_MESSAGES = [
  { msg: "You barely hold it — a tiny dribble escapes before you clamp down.", emoji: "😳", sat: 3 },
  { msg: "A small spurt leaks out before you regain control. That was close.", emoji: "💧", sat: 5 },
  { msg: "You almost lost it. A warm spot spreads before you manage to stop.", emoji: "😬", sat: 4 },
  { msg: "Your body betrays you for a split second — a quick leak before you hold.", emoji: "😣", sat: 3 },
];

function quickModeRoll() {
  if (!sessionRunning) {
    toast('Start a Quick Session first!');
    return;
  }

  const tables = window.quickModeTables || JSON.parse(localStorage.getItem('quickModeTables') || '["FULL_D20"]');

  // Build merged event pool from selected tables, tagging source
  const pool = [];
  const tableMap = {
    'FULL_D20': typeof FULL_D20 !== 'undefined' ? FULL_D20 : [],
    'FULL_TRAINING_FAILURES': typeof FULL_TRAINING_FAILURES !== 'undefined' ? FULL_TRAINING_FAILURES : [],
    'MACRO_DEPENDENT_D20': typeof MACRO_DEPENDENT_D20 !== 'undefined' ? MACRO_DEPENDENT_D20 : [],
    'MESSY_HOLDING_GAUNTLETS_D10': typeof MESSY_HOLDING_GAUNTLETS_D10 !== 'undefined' ? MESSY_HOLDING_GAUNTLETS_D10 : [],
    'OMORASHI_GAUNTLETS': typeof OMORASHI_GAUNTLETS !== 'undefined' ? OMORASHI_GAUNTLETS : [],
  };

  // Tables where events are always accidents (no hold chance)
  const alwaysFailTables = new Set(['MACRO_DEPENDENT_D20']);

  for (const key of tables) {
    const tbl = tableMap[key];
    if (tbl && tbl.length > 0) {
      for (const evt of tbl) pool.push({ ...evt, _sourceTable: key });
    }
  }

  if (pool.length === 0) {
    toast('No events in selected tables!');
    return;
  }

  // Pick a random event
  const evt = pool[Math.floor(Math.random() * pool.length)];

  // --- CHANCE TO MAKE IT ---
  const controlKey = window._quickControlLevel || localStorage.getItem('quickControlLevel') || 'mostly_continent';
  const qcm = (controlKey !== 'custom') ? QUICK_CONTINENCE_MAP[controlKey] : null;

  // Custom hold chance override takes priority
  let successChance = (window._quickCustomHoldChance != null) ? window._quickCustomHoldChance
                     : (qcm ? qcm.holdChance : 45);

  const closeCallWindow = window._quickCloseCallWindow || 10;

  // Dependent-type events are involuntary — no hold possible
  const isAutoFail = alwaysFailTables.has(evt._sourceTable);

  // Omorashi gauntlets are endurance challenges, not accidents — always run
  const isGauntlet = evt._sourceTable === 'OMORASHI_GAUNTLETS' || evt._sourceTable === 'MESSY_HOLDING_GAUNTLETS_D10';

  if (!isAutoFail && !isGauntlet) {
    // Apply pressure/saturation modifiers (inspired by babysitter)
    if (manualPressure > 80)      successChance -= 20;
    else if (manualPressure > 60) successChance -= 10;

    const capacity = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() : 100;
    const fillPct = capacity > 0 ? (manualSaturation / capacity) * 100 : 0;
    if (fillPct > 75)       successChance -= 15;
    else if (fillPct > 50)  successChance -= 8;

    // Clamp between 5% and 90%
    successChance = Math.max(5, Math.min(90, successChance));

    const roll = Math.random() * 100;

    if (roll < successChance) {
      // --- SUCCESS: You held it! ---
      // Close call (small leak) if roll was within closeCallWindow% of failing
      const closeCall = roll > (successChance - closeCallWindow);

      if (closeCall) {
        const cc = QUICK_CLOSE_CALL_MESSAGES[Math.floor(Math.random() * QUICK_CLOSE_CALL_MESSAGES.length)];
        logToOutput(`<span style="color:#fdcb6e; font-size:1.05em;"><b>${cc.emoji} Close Call!</b></span>`);
        logToOutput(`<span style="color:#ffeaa7;">${cc.msg}</span>`);
        manualSaturation = Math.min(manualSaturation + cc.sat, capacity);
        updateSaturationUI(manualSaturation);
      } else {
        const sm = QUICK_SUCCESS_MESSAGES[Math.floor(Math.random() * QUICK_SUCCESS_MESSAGES.length)];
        logToOutput(`<span style="color:#55efc4; font-size:1.05em;"><b>${sm.emoji} You Made It!</b></span>`);
        logToOutput(`<span style="color:#a8e6cf;">${sm.msg}</span>`);
      }

      // Slight pressure relief on success
      if (manualPressure > 10) {
        manualPressure = Math.max(0, manualPressure - 5);
        updatePressureUI(manualPressure);
      }
      saveState();
      return;
    }

    // --- FAILURE: You didn't make it ---
    logToOutput(`<span style="color:#ff7675; font-size:1.05em;"><b>💦 You couldn't hold it...</b></span>`);
  }

  // Gauntlets: just announce and run
  if (isGauntlet) {
    const gName = evt.name || evt.label || 'Challenge';
    logToOutput(`<span style="color:#ff7675;">🎲 <b>You felt the urge...</b></span>`);
    logToOutput(`<span style="color:#81ecec;"><b>Gauntlet: ${gName}</b></span>`);
    startVoidGuide(evt.guide, `<b>🚽 Quick Roll:</b> ${gName}`, 'full');
    return;
  }

  // Auto-fail events: just announce
  if (isAutoFail) {
    logToOutput(`<span style="color:#ff7675;">🎲 <b>You felt the urge... but it's already too late.</b></span>`);
  }

  // Standard event with description + guide
  const desc = evt.flow || evt.desc || evt.label || 'Something happened...';
  logToOutput(`<span style="color:#cdd7e6;">${desc}</span>`);

  // Saturation penalty on failure
  const capacity = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() : 100;
  const satGain = Math.floor(Math.random() * 11) + 10; // 10-20
  manualSaturation = Math.min(manualSaturation + satGain, capacity + 10);
  updateSaturationUI(manualSaturation);
  checkOverflowSaturation(manualSaturation);

  if (evt.guide) {
    startVoidGuide(evt.guide, `<b>🚽 Quick Roll:</b> ${desc}`, 'full');
  } else {
    logToOutput(`<span style="color:#fab1a0; font-style:italic;">(No guide steps — narrative event only)</span>`);
  }

  saveState();
}

/* ===== BEDWETTING MODE ===== */

const BEDWETTING_TIER_MAP = {
  dry_nights: {
    wakeChance: 88,
    microChance: 88,
    macroChance: 12,
    hydrationMl: 200,
    bedtimeRule: 'Use the potty right before bed. Pullups or underwear are fine.',
    summary: 'Usually wakes in time. Accidents are rare and mostly just dribbles.',
  },
  light_bedwetter: {
    wakeChance: 74,
    microChance: 72,
    macroChance: 28,
    hydrationMl: 225,
    bedtimeRule: 'Drink 250ml before bed and potty right before lying down.',
    summary: 'Sometimes wakes to pee, sometimes only notices when already dribbling.',
  },
  moderate_bedwetter: {
    wakeChance: 50,
    microChance: 48,
    macroChance: 52,
    hydrationMl: 350,
    bedtimeRule: 'Drink 350ml before bed. If in pullups, potty right before sleep.',
    summary: 'Waking in time is unreliable. Small and medium accidents are common.',
  },
  heavy_bedwetter: {
    wakeChance: 24,
    microChance: 26,
    macroChance: 74,
    hydrationMl: 350,
    bedtimeRule: 'Drink 350ml before bed. If in diapers, put one on 30 minutes before bedtime and do not change unless leaking.',
    summary: 'Usually sleeps through the urge. Full wettings are common.',
  },
  full_bedwetter: {
    wakeChance: 8,
    microChance: 14,
    macroChance: 86,
    hydrationMl: 400,
    bedtimeRule: 'Drink 400ml before bed. Diaper up early and treat the night as fully dependent.',
    summary: 'Almost never wakes in time. Nights are mostly decided by protection and leaks.',
  },
};

const BEDWETTING_PROFILE_META = {
  dry_nights: {
    title: 'Dry Sleeper',
    description: 'You are expected to stay dry most nights. Accidents are usually just dribbles or sleepy close calls.',
    expectedWetNightsWeek: '0-1',
    expectedPattern: 'Mostly dry, very occasional micro leak',
    recommendedProtection: 'Pad or Pullups',
    recommendedProtectionOptions: ['pad', 'pullups'],
  },
  light_bedwetter: {
    title: 'Light Bedwetter',
    description: 'You still wake in time a lot, but a few nights each week end with dampness or a small accident.',
    expectedWetNightsWeek: '1-3',
    expectedPattern: 'Micros are common, full accidents are rare',
    recommendedProtection: 'Pad or Pullups',
    recommendedProtectionOptions: ['pad', 'pullups'],
  },
  moderate_bedwetter: {
    title: 'Moderate Bedwetter',
    description: 'Mixed nights. Sometimes you make it, sometimes you leak, sometimes you wake up properly wet.',
    expectedWetNightsWeek: '3-5',
    expectedPattern: 'Balanced micros and full accidents',
    recommendedProtection: 'Pullups or Diapers',
    recommendedProtectionOptions: ['pullups', 'diapers'],
  },
  heavy_bedwetter: {
    title: 'Heavy Bedwetter',
    description: 'You usually sleep through the urge and need dependable protection every night.',
    expectedWetNightsWeek: '5-7',
    expectedPattern: 'Frequent full accidents and occasional repeat voids',
    recommendedProtection: 'Diapers or Thick Diapers',
    recommendedProtectionOptions: ['diapers', 'thick_diapers'],
  },
  full_bedwetter: {
    title: 'Permanent Bedwetter / Baby',
    description: 'You are not expected to be dry. You wake up wet every night and often void multiple times a night.',
    expectedWetNightsWeek: '7',
    expectedPattern: 'Multiple wettings a night are normal',
    recommendedProtection: 'Thick Diapers',
    recommendedProtectionOptions: ['thick_diapers'],
  },
};

const BEDWETTING_SUGGESTED_PROFILES = {
  dry_sleeper: {
    key: 'dry_sleeper',
    name: 'Dry Sleeper',
    tier: 'dry_nights',
    protection: 'pad',
    ruleFollowed: true,
    wakeChanceMod: 2,
    wakeDuringAccidentChance: 75,
    wakeAfterAccidentChance: 85,
    nightOutputPct: 70,
    afterAccidentHydrationMl: 0,
  },
  pad_dribbler: {
    key: 'pad_dribbler',
    name: 'Pad Dribbler',
    tier: 'light_bedwetter',
    protection: 'pad',
    ruleFollowed: true,
    wakeChanceMod: 10,
    wakeDuringAccidentChance: 82,
    wakeAfterAccidentChance: 92,
    nightOutputPct: 60,
    afterAccidentHydrationMl: 0,
  },
  pullup_tosser: {
    key: 'pullup_tosser',
    name: 'Pullup Tosser',
    tier: 'moderate_bedwetter',
    protection: 'pullups',
    ruleFollowed: true,
    wakeChanceMod: 0,
    wakeDuringAccidentChance: 52,
    wakeAfterAccidentChance: 68,
    nightOutputPct: 92,
    afterAccidentHydrationMl: 75,
  },
  nightly_diaper: {
    key: 'nightly_diaper',
    name: 'Nightly Diaper User',
    tier: 'heavy_bedwetter',
    protection: 'diapers',
    ruleFollowed: true,
    wakeChanceMod: -6,
    wakeDuringAccidentChance: 28,
    wakeAfterAccidentChance: 45,
    nightOutputPct: 115,
    afterAccidentHydrationMl: 125,
  },
  permanent_bedwetter: {
    key: 'permanent_bedwetter',
    name: 'Permanent Bedwetter / Baby',
    tier: 'full_bedwetter',
    protection: 'thick_diapers',
    ruleFollowed: true,
    wakeChanceMod: -12,
    wakeDuringAccidentChance: 10,
    wakeAfterAccidentChance: 24,
    nightOutputPct: 130,
    afterAccidentHydrationMl: 200,
  },
};

const BEDWETTING_EVENT_MODULES = {
  positions: [
    'on your back',
    'curled on your side',
    'half on your stomach',
    'flat on your tummy',
    'twisted in the sheets',
    'with your knees tucked up',
    'spread out under the blankets',
    'with one leg hooked around the blanket',
    'hugging a pillow',
    'on the edge of the mattress',
    'bundled up tight',
    'mushed down into the bed',
  ],
  wakeCues: [
    'you feel a heavy warmth low in your tummy',
    'your bladder nags hard enough to drag you half-awake',
    'you wake with your thighs pressing together instinctively',
    'the need to pee finally cuts through the sleepiness',
    'your body squirms before your brain catches up',
    'you blink awake, tense and needy',
    'the pressure gets sharp enough to notice',
    'you become aware of a sleepy, urgent ache',
    'your lower belly feels tight and demanding',
    'you wake with a helpless little squirm',
  ],
  microStarts: [
    'a few warm dribbles slip out',
    'a weak sleepy squeeze leaks into your protection',
    'a tiny spurt escapes before you can react',
    'your body lets out a brief dribble',
    'a quick little leak wets you',
    'you lose a small spurt into the padding',
    'a short dribble sneaks out',
    'a warm trickle slips free',
    'a few spurts patter into your protection',
    'your bladder gives up just a little',
  ],
  macroStarts: [
    'your bladder gives up in a heavy rush',
    'a full wetting surges out before you can stop it',
    'you start soaking hard into your protection',
    'a strong, helpless flood pours out',
    'your body commits to a full accident',
    'a thick, steady wetting takes over',
    'a heavy nighttime accident spreads through the padding',
    'you release hard before you can do anything useful',
    'the bedwetting comes in a strong gush',
    'you void heavily, deep in the mattress and blankets',
  ],
  midWake: [
    'You wake halfway through it and tense up hard.',
    'That finally jars you awake enough to notice what is happening.',
    'You come to in the middle of the accident and can react a little.',
    'You wake with a start and catch part of it in progress.',
    'That warmth snaps you awake halfway through.',
    'You notice in time to stop some of it, but not all.',
  ],
  afterWake: [
    'You only really wake once the warmth settles.',
    'You wake after the accident is already done.',
    'By the time you understand it, the wetting is over.',
    'You come to slowly, already damp and aware of what happened.',
    'You wake once the pressure is gone and the wetness remains.',
    'It is only afterward that you realize how wet you are.',
  ],
  sleepThrough: [
    'You stay deeply asleep and do not really deal with it until morning.',
    'You drift right through it without reacting.',
    'You never fully wake and just settle deeper into sleep.',
    'Your body handles it without waking you properly at all.',
    'You remain half-lost in sleep and do nothing about it.',
    'You do not wake enough to respond before sleep takes over again.',
  ],
};

const BEDWETTING_EVENT_VARIANT_COUNT =
  BEDWETTING_EVENT_MODULES.positions.length *
  BEDWETTING_EVENT_MODULES.wakeCues.length *
  (BEDWETTING_EVENT_MODULES.microStarts.length + BEDWETTING_EVENT_MODULES.macroStarts.length) *
  (BEDWETTING_EVENT_MODULES.midWake.length + BEDWETTING_EVENT_MODULES.afterWake.length + BEDWETTING_EVENT_MODULES.sleepThrough.length);

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const BEDWETTING_CUSTOM_DEFAULTS = {
  schema: 'abdl-bedwetting-profile-v1',
  name: 'Night Profile',
  tier: 'moderate_bedwetter',
  protection: 'pullups',
  ruleFollowed: false,
  wakeChanceMod: 0,
  wakeDuringAccidentChance: 35,
  wakeAfterAccidentChance: 55,
  nightOutputPct: 100,
  afterAccidentHydrationMl: 0,
};

function clampNum(value, min, max, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function getStoredBedwettingProfile() {
  try {
    const raw = localStorage.getItem('bedwettingProfileConfig');
    if (!raw) return { ...BEDWETTING_CUSTOM_DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...BEDWETTING_CUSTOM_DEFAULTS, ...(parsed || {}) };
  } catch (err) {
    console.error(err);
    return { ...BEDWETTING_CUSTOM_DEFAULTS };
  }
}

function buildBedwettingProfileFromSetup() {
  return {
    schema: 'abdl-bedwetting-profile-v1',
    name: ($('bedwettingProfileName')?.value || '').trim() || 'Night Profile',
    tier: $('bedwettingTierSelect')?.value || 'moderate_bedwetter',
    protection: $('bedwettingProtectionSelect')?.value || 'pullups',
    ruleFollowed: !!$('bedwettingHydrationDone')?.checked,
    wakeChanceMod: clampNum($('bedwettingWakeMod')?.value, -30, 30, 0),
    wakeDuringAccidentChance: clampNum($('bedwettingWakeDuring')?.value, 0, 100, 35),
    wakeAfterAccidentChance: clampNum($('bedwettingWakeAfter')?.value, 0, 100, 55),
    nightOutputPct: clampNum($('bedwettingNightOutput')?.value, 50, 180, 100),
    afterAccidentHydrationMl: clampNum($('bedwettingAfterHydration')?.value, 0, 500, 0),
  };
}

function setBedwettingSliderLabels(profile) {
  const wakeModLabel = $('bedwettingWakeModLabel');
  if (wakeModLabel) {
    const v = profile.wakeChanceMod;
    wakeModLabel.textContent = v <= -20 ? 'Very deep sleeper' : v <= -8 ? 'Hard to wake' : v <= 8 ? 'Normal' : v <= 18 ? 'Light sleeper' : 'Very light sleeper';
  }
  const wakeDuringLabel = $('bedwettingWakeDuringLabel');
  if (wakeDuringLabel) {
    const v = profile.wakeDuringAccidentChance;
    wakeDuringLabel.textContent = v <= 15 ? 'Rarely' : v <= 35 ? 'Sometimes' : v <= 60 ? 'Often' : v <= 80 ? 'Usually' : 'Almost always';
  }
  const wakeAfterLabel = $('bedwettingWakeAfterLabel');
  if (wakeAfterLabel) {
    const v = profile.wakeAfterAccidentChance;
    wakeAfterLabel.textContent = v <= 15 ? 'Rarely' : v <= 35 ? 'Sometimes' : v <= 60 ? 'Often' : v <= 80 ? 'Usually' : 'Almost always';
  }
  const outputLabel = $('bedwettingNightOutputLabel');
  if (outputLabel) {
    const v = profile.nightOutputPct;
    outputLabel.textContent = v <= 70 ? 'Light' : v <= 90 ? 'Normal' : v <= 110 ? 'Full' : v <= 140 ? 'Heavy' : 'Very heavy';
  }
  const hydrationLabel = $('bedwettingAfterHydrationLabel');
  if (hydrationLabel) {
    const v = profile.afterAccidentHydrationMl;
    hydrationLabel.textContent = v === 0 ? 'Off' : v <= 100 ? 'Small sip' : v <= 200 ? 'Quarter glass' : v <= 350 ? 'Half glass' : 'Full glass';
  }
}

function fillBedwettingExportBox(profile) {
  const box = $('bedwettingProfileJson');
  if (box) box.value = JSON.stringify(profile, null, 2);
}

function getSuggestedBedwettingProfileButtons(activeName) {
  return Object.values(BEDWETTING_SUGGESTED_PROFILES).map(profile => {
    const isActive = activeName === profile.name;
    return `<button onclick="applySuggestedBedwettingProfile('${profile.key}')" style="padding:8px 10px; background:${isActive ? '#81ecec' : '#0f1420'}; color:${isActive ? '#000' : '#81ecec'}; border:1px solid #81ecec44; border-radius:8px; cursor:pointer; font-size:12px;">${profile.name}</button>`;
  }).join('');
}

function applySuggestedBedwettingProfile(profileKey) {
  const preset = BEDWETTING_SUGGESTED_PROFILES[profileKey];
  if (!preset) return;
  const merged = { ...BEDWETTING_CUSTOM_DEFAULTS, ...preset };
  localStorage.setItem('bedwettingProfileConfig', JSON.stringify(merged));
  applyBedwettingProfileToSetup(merged);
  showBedwettingSetup();
}

function applyBedwettingProfileToSetup(profile) {
  const merged = { ...BEDWETTING_CUSTOM_DEFAULTS, ...(profile || {}) };

  if ($('bedwettingProfileName')) $('bedwettingProfileName').value = merged.name || 'Night Profile';
  if ($('bedwettingTierSelect')) $('bedwettingTierSelect').value = merged.tier || 'moderate_bedwetter';
  if ($('bedwettingProtectionSelect')) $('bedwettingProtectionSelect').value = merged.protection || 'pullups';
  if ($('bedwettingHydrationDone')) $('bedwettingHydrationDone').checked = !!merged.ruleFollowed;
  if ($('bedwettingWakeMod')) $('bedwettingWakeMod').value = clampNum(merged.wakeChanceMod, -30, 30, 0);
  if ($('bedwettingWakeDuring')) $('bedwettingWakeDuring').value = clampNum(merged.wakeDuringAccidentChance, 0, 100, 35);
  if ($('bedwettingWakeAfter')) $('bedwettingWakeAfter').value = clampNum(merged.wakeAfterAccidentChance, 0, 100, 55);
  if ($('bedwettingNightOutput')) $('bedwettingNightOutput').value = clampNum(merged.nightOutputPct, 50, 180, 100);
  if ($('bedwettingAfterHydration')) $('bedwettingAfterHydration').value = clampNum(merged.afterAccidentHydrationMl, 0, 500, 0);

  setBedwettingSliderLabels(merged);
  updateBedwettingPreview();
}

function exportBedwettingProfile() {
  const profile = buildBedwettingProfileFromSetup();
  fillBedwettingExportBox(profile);
  localStorage.setItem('bedwettingProfileConfig', JSON.stringify(profile));
  const box = $('bedwettingProfileJson');
  if (box) {
    box.focus();
    box.select();
  }
  toast('Bedwetting profile JSON ready to copy');
}

async function copyBedwettingProfileJson() {
  const profile = buildBedwettingProfileFromSetup();
  const raw = JSON.stringify(profile, null, 2);
  fillBedwettingExportBox(profile);
  localStorage.setItem('bedwettingProfileConfig', raw);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(raw);
      toast('Bedwetting profile copied to clipboard');
      return;
    } catch (err) {
      console.error(err);
    }
  }

  const box = $('bedwettingProfileJson');
  if (box) {
    box.focus();
    box.select();
  }
  toast('Clipboard unavailable — copy from the box below');
}

function importBedwettingProfile() {
  const box = $('bedwettingProfileJson');
  const raw = (box?.value || '').trim();
  if (!raw) {
    toast('Paste a bedwetting profile JSON first');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.schema && parsed.schema !== 'abdl-bedwetting-profile-v1')) {
      throw new Error('Invalid bedwetting profile schema');
    }
    const merged = { ...BEDWETTING_CUSTOM_DEFAULTS, ...parsed };
    localStorage.setItem('bedwettingProfileConfig', JSON.stringify(merged));
    applyBedwettingProfileToSetup(merged);
    toast(`Imported bedwetting profile: ${merged.name || 'Night Profile'}`);
  } catch (err) {
    console.error(err);
    toast('Invalid bedwetting profile JSON');
  }
}

function showBedwettingSetup() {
  const saved = getStoredBedwettingProfile();

  let html = `
    <div id="bedwettingSetup" style="text-align:left;">
      <button onclick="backToSessionType()" style="background:none; border:none; color:#7cc4ff; cursor:pointer; font-size:13px; margin-bottom:12px; padding:0;">&larr; Back</button>
      <h2 style="color:#81ecec; margin:0 0 6px 0; text-align:center;">🌙 Bedwetting Session</h2>
      <p style="color:#cdd7e6; font-size:0.88em; margin:0 0 14px 0; text-align:center; line-height:1.5;">
        Set up for the night, then only roll if you wake up.<br>
        <span style="color:#888; font-size:0.9em;">No timers. No random daytime prompts. Just nighttime checks.</span>
      </p>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #81ecec44; margin-bottom:8px;">
        <div style="color:#81ecec; font-weight:bold; margin-bottom:6px; font-size:0.92em;">📝 Profile Name</div>
        <input id="bedwettingProfileName" value="${saved.name || 'Night Profile'}"
          style="width:100%; padding:8px 10px; background:#151923; color:#fff; border:1px solid #2b3348; border-radius:8px; font-size:13px; box-sizing:border-box;"
          placeholder="Night Profile">
      </div>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #81ecec44; margin-bottom:8px;">
        <div style="color:#81ecec; font-weight:bold; margin-bottom:8px; font-size:0.92em;">🛏️ Suggested Profiles</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">${getSuggestedBedwettingProfileButtons(saved.name)}</div>
      </div>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #81ecec44; margin-bottom:8px;">
        <div style="color:#81ecec; font-weight:bold; margin-bottom:6px; font-size:0.92em;">🌙 Bedwetting Tier</div>
        <select id="bedwettingTierSelect" onchange="updateBedwettingPreview()"
          style="width:100%; padding:8px 10px; background:#151923; color:#fff; border:1px solid #2b3348; border-radius:8px; font-size:13px; cursor:pointer;">
          <option value="dry_nights" ${saved.tier === 'dry_nights' ? 'selected' : ''}>Dry Nights — usually wakes in time</option>
          <option value="light_bedwetter" ${saved.tier === 'light_bedwetter' ? 'selected' : ''}>Light Bedwetter — occasional nighttime slips</option>
          <option value="moderate_bedwetter" ${saved.tier === 'moderate_bedwetter' ? 'selected' : ''}>Moderate Bedwetter — mixed nights</option>
          <option value="heavy_bedwetter" ${saved.tier === 'heavy_bedwetter' ? 'selected' : ''}>Heavy Bedwetter — often sleeps through it</option>
          <option value="full_bedwetter" ${saved.tier === 'full_bedwetter' ? 'selected' : ''}>Full Bedwetter — almost never wakes in time</option>
        </select>
        <div id="bedwettingPreview" style="margin-top:8px; padding:8px; background:#0d1017; border-radius:8px; border:1px solid #2b334844; font-size:0.85em;"></div>
      </div>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #81ecec44; margin-bottom:8px;">
        <div style="color:#81ecec; font-weight:bold; margin-bottom:6px; font-size:0.92em;">🩲 Night Protection</div>
        <select id="bedwettingProtectionSelect"
          style="width:100%; padding:8px 10px; background:#151923; color:#fff; border:1px solid #2b3348; border-radius:8px; font-size:13px; cursor:pointer;">
          <option value="none" ${saved.protection === 'none' ? 'selected' : ''}>Underwear / Nothing</option>
          <option value="pad" ${saved.protection === 'pad' ? 'selected' : ''}>Pad</option>
          <option value="pullups" ${saved.protection === 'pullups' ? 'selected' : ''}>Pullups</option>
          <option value="diapers" ${saved.protection === 'diapers' ? 'selected' : ''}>Diapers</option>
          <option value="thick_diapers" ${saved.protection === 'thick_diapers' ? 'selected' : ''}>Thick Diapers</option>
        </select>
      </div>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #81ecec44; margin-bottom:8px;">
        <div style="color:#81ecec; font-weight:bold; margin-bottom:6px; font-size:0.92em;">📋 Bedtime Rule Check</div>
        <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer;">
          <input type="checkbox" id="bedwettingHydrationDone" ${saved.ruleFollowed ? 'checked' : ''}
            style="width:18px; height:18px; accent-color:#81ecec; flex-shrink:0; margin-top:2px; cursor:pointer;">
          <span style="color:#cdd7e6; font-size:0.85em; line-height:1.45;">I followed tonight's bedtime rule and hydration instruction.</span>
        </label>
        <div id="bedwettingRuleText" style="margin-top:8px; color:#888; font-size:0.8em;"></div>
      </div>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #fdcb6e44; margin-bottom:8px;">
        <div style="color:#fdcb6e; font-weight:bold; margin-bottom:8px; font-size:0.92em;">⚙️ Customize Night Behavior</div>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:8px;">
          How deep a sleeper are you? <b id="bedwettingWakeModLabel">Normal</b>
          <input type="range" id="bedwettingWakeMod" min="-30" max="30" value="${saved.wakeChanceMod}"
            oninput="setBedwettingSliderLabels(buildBedwettingProfileFromSetup()); updateBedwettingPreview()"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
          <span style="display:flex; justify-content:space-between; color:#888; font-size:0.75em;"><span>very deep sleeper</span><span>very light sleeper</span></span>
        </label>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:8px;">
          Notice while an accident is happening? <b id="bedwettingWakeDuringLabel">Sometimes</b>
          <input type="range" id="bedwettingWakeDuring" min="0" max="100" value="${saved.wakeDuringAccidentChance}"
            oninput="setBedwettingSliderLabels(buildBedwettingProfileFromSetup()); updateBedwettingPreview()"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
        </label>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:8px;">
          Wake up after getting wet? <b id="bedwettingWakeAfterLabel">Sometimes</b>
          <input type="range" id="bedwettingWakeAfter" min="0" max="100" value="${saved.wakeAfterAccidentChance}"
            oninput="setBedwettingSliderLabels(buildBedwettingProfileFromSetup()); updateBedwettingPreview()"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
        </label>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:8px;">
          How much do you produce overnight? <b id="bedwettingNightOutputLabel">Normal</b>
          <input type="range" id="bedwettingNightOutput" min="50" max="180" value="${saved.nightOutputPct}"
            oninput="setBedwettingSliderLabels(buildBedwettingProfileFromSetup()); updateBedwettingPreview()"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
        </label>

        <label style="color:#cdd7e6; font-size:0.82em; display:block; margin-bottom:0;">
          Drink something after waking up wet? <b id="bedwettingAfterHydrationLabel">Off</b>
          <input type="range" id="bedwettingAfterHydration" min="0" max="500" step="25" value="${saved.afterAccidentHydrationMl}"
            oninput="setBedwettingSliderLabels(buildBedwettingProfileFromSetup()); updateBedwettingPreview()"
            style="width:100%; margin-top:4px; accent-color:#fdcb6e;">
          <span style="display:flex; justify-content:space-between; color:#888; font-size:0.75em;"><span>no</span><span>yes, drink first</span></span>
        </label>
      </div>

      <div style="background:#1b2030; padding:12px 14px; border-radius:12px; border:1px solid #55efc444; margin-bottom:10px;">
        <div style="color:#55efc4; font-weight:bold; margin-bottom:8px; font-size:0.92em;">📋 Copy / Paste Profile</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
          <button onclick="exportBedwettingProfile()" style="flex:1; min-width:130px; padding:8px; background:#55efc4; color:#000; border:none; border-radius:8px; cursor:pointer; font-size:12px;">Prepare JSON</button>
          <button onclick="copyBedwettingProfileJson()" style="flex:1; min-width:130px; padding:8px; background:#81ecec; color:#000; border:none; border-radius:8px; cursor:pointer; font-size:12px;">Copy JSON</button>
          <button onclick="importBedwettingProfile()" style="flex:1; min-width:130px; padding:8px; background:#7cc4ff; color:#000; border:none; border-radius:8px; cursor:pointer; font-size:12px;">Import Pasted JSON</button>
        </div>
        <textarea id="bedwettingProfileJson" placeholder="Use Prepare JSON to export this profile, or paste a saved profile here to import it."
          style="width:100%; min-height:110px; padding:10px; box-sizing:border-box; background:#0f1420; border:1px solid #2b3348; color:#fff; border-radius:8px; resize:vertical; font-size:12px;"></textarea>
      </div>

      <button onclick="startBedwettingSession()" style="width:100%; padding:14px; background:#81ecec; color:#000; font-weight:bold; font-size:1.05em; border:none; border-radius:10px; cursor:pointer;">🌙 Go To Bed</button>
    </div>`;

  let container = $('bedwettingSetup');
  if (container) {
    container.outerHTML = html;
  } else {
    $('sessionSetupProfileStep').insertAdjacentHTML('afterend', html);
  }

  applyBedwettingProfileToSetup(saved);
}

function updateBedwettingPreview() {
  const sel = $('bedwettingTierSelect');
  const preview = $('bedwettingPreview');
  const ruleText = $('bedwettingRuleText');
  if (!sel || !preview) return;

  const tier = BEDWETTING_TIER_MAP[sel.value] || BEDWETTING_TIER_MAP.moderate_bedwetter;
  const meta = BEDWETTING_PROFILE_META[sel.value] || BEDWETTING_PROFILE_META.moderate_bedwetter;
  const profile = buildBedwettingProfileFromSetup();
  const recommendedMismatch = !(meta.recommendedProtectionOptions || []).includes(profile.protection || '');

  const accidentDesc = tier.microChance >= 75 ? 'mostly small dribbles, rarely a full wetting'
    : tier.microChance >= 55 ? 'often small, but full wettings do happen'
    : tier.microChance >= 35 ? 'a mix of small and full wettings'
    : tier.microChance >= 18 ? 'usually full wettings'
    : 'full, heavy accidents most of the time';

  const combinedAwareness = Math.max(profile.wakeDuringAccidentChance, profile.wakeAfterAccidentChance);
  const awarenessDesc = combinedAwareness >= 88 ? 'Almost always notices'
    : combinedAwareness >= 70 ? 'Usually notices'
    : combinedAwareness >= 45 ? 'Often notices'
    : combinedAwareness >= 25 ? 'Sometimes notices'
    : 'Tends to sleep right through it';

  const protectionDisplay = (profile.protection || 'none').replace(/_/g, ' ');
  const wetNightsDesc = meta.expectedWetNightsWeek === '7' ? 'Every night'
    : meta.expectedWetNightsWeek === '5-7' ? 'Almost every night'
    : meta.expectedWetNightsWeek === '0-1' ? 'Most nights dry'
    : `About ${meta.expectedWetNightsWeek} nights a week`;

  preview.innerHTML = `
    <div style="color:#81ecec; font-weight:bold; font-size:0.95em; margin-bottom:4px;">${meta.title}</div>
    <div style="color:#cdd7e6; font-size:0.82em; line-height:1.5; margin-bottom:8px;">${meta.description}</div>
    <div style="display:flex; flex-direction:column; gap:5px; font-size:0.83em;">
      <div style="color:#aab5c8;">🌙 Wet nights: <span style="color:#e0e8f5;">${wetNightsDesc}</span></div>
      <div style="color:#aab5c8;">💧 When wet: <span style="color:#e0e8f5;">${accidentDesc}</span></div>
      <div style="color:#aab5c8;">🔔 Awareness: <span style="color:#e0e8f5;">${awarenessDesc}</span></div>
      ${recommendedMismatch
        ? `<div style="color:#fdcb6e;">⚠ Consider ${meta.recommendedProtection} for this level</div>`
        : `<div style="color:#55efc4;">✓ ${protectionDisplay} is a good fit for this level</div>`}
    </div>
  `;

  if (ruleText) {
    const refillText = profile.afterAccidentHydrationMl > 0
      ? ` If you wake after an accident, drink ${profile.afterAccidentHydrationMl}ml before going back to sleep.`
      : '';
    ruleText.innerHTML = `<b>Tonight's rule:</b> ${tier.bedtimeRule}${refillText}`;
  }

  setBedwettingSliderLabels(profile);
}

function getActiveBedwettingProfile() {
  const stored = window._bedwettingProfileConfig || getStoredBedwettingProfile();
  return { ...BEDWETTING_CUSTOM_DEFAULTS, ...(stored || {}) };
}

function getBedwettingAdjustedSatGain(baseMin, baseMax, outputPct) {
  const base = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
  return Math.max(1, Math.round(base * (outputPct / 100)));
}

function getBedwettingWakeNarrative() {
  const position = randomFrom(BEDWETTING_EVENT_MODULES.positions);
  const cue = randomFrom(BEDWETTING_EVENT_MODULES.wakeCues);
  return `While ${position}, ${cue}.`;
}

function getBedwettingAccidentNarrative(kind, wakeState) {
  const position = randomFrom(BEDWETTING_EVENT_MODULES.positions);
  const start = randomFrom(kind === 'micro' ? BEDWETTING_EVENT_MODULES.microStarts : BEDWETTING_EVENT_MODULES.macroStarts);
  const endingPool = wakeState === 'during'
    ? BEDWETTING_EVENT_MODULES.midWake
    : wakeState === 'after'
      ? BEDWETTING_EVENT_MODULES.afterWake
      : BEDWETTING_EVENT_MODULES.sleepThrough;
  const ending = randomFrom(endingPool);
  return `While ${position}, ${start}. ${ending}`;
}

function applyBedwettingAftercare(profile, messageColor) {
  if (!profile.afterAccidentHydrationMl) return;
  window._bedwettingNightLoad = (window._bedwettingNightLoad || 0) + profile.afterAccidentHydrationMl;
  logToOutput(`<span style="color:${messageColor};">Before going back to sleep, drink ${profile.afterAccidentHydrationMl}ml of water.</span>`);
}

function startBedwettingSession() {
  const profile = buildBedwettingProfileFromSetup();
  const tier = BEDWETTING_TIER_MAP[profile.tier] || BEDWETTING_TIER_MAP.moderate_bedwetter;

  localStorage.setItem('bedwettingTier', profile.tier);
  localStorage.setItem('bedwettingProtection', profile.protection);
  localStorage.setItem('bedwettingHydrationDone', String(profile.ruleFollowed));
  localStorage.setItem('bedwettingProfileConfig', JSON.stringify(profile));

  currentProtectionLevel = profile.protection;
  if (typeof updateProtectionUI === 'function') updateProtectionUI();
  const protChooser = $('protectionChooser');
  if (protChooser) protChooser.value = profile.protection;

  clearTimeout(mainTimer);
  clearTimeout(preChimeTimer);
  clearTimeout(microTimer);
  clearTimeout(hydrationTimer);
  clearTimeout(omorashiStressTestTimer);
  if (babysitterCheckTimer) clearTimeout(babysitterCheckTimer);
  babysitterMicroTimerIds.forEach(id => clearTimeout(id));
  babysitterMicroTimerIds = [];
  stopChime();
  meetingActive = false;
  omorashiSessionActive = false;
  omorashiGuideActive = false;

  profileMode = 'bedwetting';
  localStorage.setItem('profileMode', 'bedwetting');
  window._bedwettingTier = profile.tier;
  window._bedwettingRuleFollowed = profile.ruleFollowed;
  window._bedwettingProfileConfig = profile;
  window._bedwettingAwakeRolls = 0;
  window._bedwettingHadNightAccident = false;
  window._bedwettingNightLoad = Math.round(tier.hydrationMl * (profile.nightOutputPct / 100));

  closeSessionSetupModal();
  const bwEl = $('bedwettingSetup');
  if (bwEl) bwEl.remove();

  $('output').textContent = '';
  sessionRunning = true;
  sessionStartedAt = Date.now();
  sessionStartTime = Date.now();
  manualPressure = 0;
  manualSaturation = 0;
  if (typeof updatePressureUI === 'function') updatePressureUI(0);
  if (typeof updateSaturationUI === 'function') updateSaturationUI(0);

  clearInterval(tickInterval);

  const tierLabel = $('bedwettingTierSelect')?.options[$('bedwettingTierSelect').selectedIndex]?.text.split(' — ')[0] || profile.tier;
  const protLabel = formatProtectionLevel ? formatProtectionLevel(profile.protection) : profile.protection;
  logToOutput(`<span style="color:#81ecec; font-size:1.1em;"><b>🌙 Bedwetting Session Started</b></span>`);
  logToOutput(`<span style="color:#cdd7e6;">Profile: <b>${profile.name}</b> | Tier: <b>${tierLabel}</b> | Night protection: <b>${protLabel}</b></span>`);
  logToOutput(`<span style="color:#888; font-size:0.84em;">Rule: ${tier.bedtimeRule}</span>`);
  logToOutput(`<span style="color:#888; font-size:0.84em;">Forgiveness: ${profile.wakeChanceMod > 0 ? '+' : ''}${profile.wakeChanceMod}% | Wake midway: ${profile.wakeDuringAccidentChance}% | Wake after: ${profile.wakeAfterAccidentChance}% | Output: ${profile.nightOutputPct}%</span>`);
  logToOutput(`<div style="border:1px solid #81ecec44; padding:12px; border-radius:10px; background:#1b2030; margin:8px 0;">
    <span style="color:#81ecec; font-size:1em;"><b>How it works:</b></span><br>
    <span style="color:#cdd7e6; font-size:0.9em;">No timers will run tonight. If you wake up needing to pee, press <b style="color:#81ecec;">"I Woke Up To Pee"</b> and we'll roll for whether you make it.<br>
    In the morning, press <b style="color:#81ecec;">"Morning Check"</b> to see whether you stayed dry, leaked, or slept through an accident.</span>
  </div>`);

  showBedwettingPrefsPanel(profile.name, tierLabel, tier, profile);

  const btn = $('btnQuickGo');
  if (btn) {
    btn.style.display = 'block';
    btn.textContent = '🌙 I Woke Up To Pee';
    btn.onclick = bedwettingWakeRoll;
  }

  const lbl = $('countdown');
  if (lbl) lbl.innerHTML = `<span style="color:#81ecec; font-size:1.1em;">Sleeping... roll only if you wake up.</span>`;

  const wakeBtn = $('btnBedMorning');
  if (wakeBtn) {
    wakeBtn.style.display = 'inline-block';
    wakeBtn.textContent = '☀️ Morning Check';
    wakeBtn.onclick = bedwettingMorningCheck;
  }

  saveState();
}

function showBedwettingPrefsPanel(profileName, tierLabel, tier, profile) {
  const existing = $('quickPrefsPanel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'quickPrefsPanel';
  panel.style.cssText = 'margin-top:12px;';
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; cursor:pointer;" onclick="toggleSidebarSection('quickPrefsContent')">
      <h2 style="margin:0; font-size:14px; color:#81ecec;"><span id="quickPrefsContentArrow" class="collapse-arrow collapsed">▼</span> 🌙 Bedwetting</h2>
    </div>
    <div id="quickPrefsContent" style="display:none; background:#1b2030; padding:10px 12px; border-radius:10px; border:1px solid #81ecec44; margin-top:4px;">
      <div style="margin-bottom:6px;"><span style="color:#888; font-size:12px;">Profile:</span> <span style="color:#81ecec; font-weight:bold; font-size:13px;">${profileName}</span></div>
      <div style="margin-bottom:6px;"><span style="color:#888; font-size:12px;">Tier:</span> <span style="color:#cdd7e6; font-size:13px;">${tierLabel}</span></div>
      <div style="margin-bottom:6px;"><span style="color:#888; font-size:12px;">Wake chance:</span> <span style="color:#cdd7e6; font-size:13px;">~${Math.max(1, Math.min(99, tier.wakeChance + profile.wakeChanceMod + (profile.ruleFollowed ? 8 : -10)))}%</span></div>
      <div style="margin-bottom:6px;"><span style="color:#888; font-size:12px;">Mid/after wake:</span> <span style="color:#cdd7e6; font-size:13px;">${profile.wakeDuringAccidentChance}% / ${profile.wakeAfterAccidentChance}%</span></div>
      <div style="margin-bottom:8px;"><span style="color:#888; font-size:12px;">Output / refill:</span> <span style="color:#cdd7e6; font-size:13px;">${profile.nightOutputPct}% / ${profile.afterAccidentHydrationMl}ml</span></div>
      <button onclick="showSessionSetupModal()" style="width:100%; padding:8px; background:#0f1115; border:1px solid #81ecec44; color:#81ecec; border-radius:6px; cursor:pointer; font-size:12px;">⚙️ Change Settings</button>
    </div>
  `;

  const sessionPanel = document.querySelector('.panel.stack');
  const firstHr = sessionPanel?.querySelector('.hr');
  if (firstHr) {
    firstHr.insertAdjacentElement('afterend', panel);
  } else if (sessionPanel) {
    sessionPanel.appendChild(panel);
  }
}

function bedwettingWakeRoll() {
  if (!sessionRunning || profileMode !== 'bedwetting') {
    toast('Start a Bedwetting Session first!');
    return;
  }

  const profile = getActiveBedwettingProfile();
  const tier = BEDWETTING_TIER_MAP[window._bedwettingTier || profile.tier] || BEDWETTING_TIER_MAP.moderate_bedwetter;
  const ruleFollowed = window._bedwettingRuleFollowed === true || profile.ruleFollowed === true;
  const nightLoad = window._bedwettingNightLoad || 0;
  const loadPenalty = Math.floor(nightLoad / 150) * 3;

  let wakeChance = tier.wakeChance + profile.wakeChanceMod;
  if (ruleFollowed) wakeChance += 8;
  else wakeChance -= 10;
  if ((window._bedwettingAwakeRolls || 0) > 0) wakeChance -= 8;
  wakeChance -= loadPenalty;
  wakeChance = Math.max(3, Math.min(95, wakeChance));

  const wakeNarrative = getBedwettingWakeNarrative();
  logToOutput(`<span style="color:#81ecec;"><b>🌙 You wake in the night...</b></span>`);
  logToOutput(`<span style="color:#cdd7e6;">${wakeNarrative}</span>`);

  const roll = Math.random() * 100;
  window._bedwettingAwakeRolls = (window._bedwettingAwakeRolls || 0) + 1;

  if (roll < wakeChance) {
    logToOutput(`<span style="color:#55efc4;"><b>🚽 You make it to the potty in time.</b></span>`);
    logToOutput(`<span style="color:#a8e6cf;">You are allowed to get up, use the potty, then go back to sleep.</span>`);
    window._bedwettingNightLoad = Math.max(0, nightLoad - 180);
    if (manualSaturation > 0) {
      manualSaturation = Math.max(0, manualSaturation - 4);
      updateSaturationUI(manualSaturation);
    }
    saveState();
    return;
  }

  const capacity = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() : 100;
  const accidentRoll = Math.random() * 100;
  const isMicro = accidentRoll < tier.microChance;
  const wokeDuring = Math.random() * 100 < profile.wakeDuringAccidentChance;

  if (isMicro) {
    let satGain = getBedwettingAdjustedSatGain(4, 11, profile.nightOutputPct);
    if (wokeDuring) satGain = Math.max(2, Math.round(satGain * 0.75));
    manualSaturation = Math.min(manualSaturation + satGain, capacity + 10);
    updateSaturationUI(manualSaturation);
    checkOverflowSaturation(manualSaturation);
    window._bedwettingHadNightAccident = true;
    window._bedwettingNightLoad = Math.max(0, nightLoad - Math.round(80 * (profile.nightOutputPct / 100)));

    if (wokeDuring) {
      const desc = getBedwettingAccidentNarrative('micro', 'during');
      logToOutput(`<span style="color:#fdcb6e;"><b>💧 You wake during a small accident.</b></span>`);
      logToOutput(`<span style="color:#ffeaa7;">${desc}</span>`);
      logToOutput(`<span style="color:#cdd7e6;">You can stop there, use the potty if needed, then settle back down.</span>`);
      applyBedwettingAftercare(profile, '#ffeaa7');
    } else {
      const wokeAfter = Math.random() * 100 < profile.wakeAfterAccidentChance;
      const desc = getBedwettingAccidentNarrative('micro', wokeAfter ? 'after' : 'sleep');
      logToOutput(`<span style="color:#fdcb6e;"><b>💧 Small nighttime accident.</b></span>`);
      logToOutput(`<span style="color:#ffeaa7;">${desc}</span>`);
      if (wokeAfter) {
        logToOutput(`<span style="color:#cdd7e6;">You wake after the dribbles and can check yourself before going back to sleep.</span>`);
        applyBedwettingAftercare(profile, '#cdd7e6');
      } else {
        logToOutput(`<span style="color:#cdd7e6;">You stay sleepy and drift back off without really dealing with it.</span>`);
      }
    }
  } else {
    let satGain = getBedwettingAdjustedSatGain(18, 34, profile.nightOutputPct);
    if (wokeDuring) satGain = Math.max(10, Math.round(satGain * 0.7));
    manualSaturation = Math.min(manualSaturation + satGain, capacity + 15);
    updateSaturationUI(manualSaturation);
    checkOverflowSaturation(manualSaturation);
    window._bedwettingHadNightAccident = true;
    window._bedwettingNightLoad = Math.max(0, nightLoad - Math.round(175 * (profile.nightOutputPct / 100)));

    if (wokeDuring) {
      const desc = getBedwettingAccidentNarrative('macro', 'during');
      logToOutput(`<span style="color:#ff7675;"><b>💦 You wake halfway through a full accident.</b></span>`);
      logToOutput(`<span style="color:#fab1a0;">${desc}</span>`);
      logToOutput(`<span style="color:#cdd7e6;">You wake enough to change if needed, especially if you're leaking.</span>`);
      applyBedwettingAftercare(profile, '#fab1a0');
    } else {
      const wokeAfter = Math.random() * 100 < profile.wakeAfterAccidentChance;
      const desc = getBedwettingAccidentNarrative('macro', wokeAfter ? 'after' : 'sleep');
      logToOutput(`<span style="color:#ff7675;"><b>💦 Full bedwetting accident.</b></span>`);
      logToOutput(`<span style="color:#fab1a0;">${desc}</span>`);
      if (wokeAfter) {
        logToOutput(`<span style="color:#cdd7e6;">You wake after it's over and can decide whether to change or just settle back down.</span>`);
        applyBedwettingAftercare(profile, '#fab1a0');
      } else {
        logToOutput(`<span style="color:#cdd7e6;">You sleep through it completely and do not really deal with it until morning.</span>`);
      }
    }
  }

  saveState();
}

function bedwettingMorningCheck() {
  if (!sessionRunning || profileMode !== 'bedwetting') {
    toast('Start a Bedwetting Session first!');
    return;
  }

  const profile = getActiveBedwettingProfile();
  const tier = BEDWETTING_TIER_MAP[window._bedwettingTier || profile.tier] || BEDWETTING_TIER_MAP.moderate_bedwetter;
  const capacity = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() : 100;
  const fillPct = capacity > 0 ? (manualSaturation / capacity) * 100 : 0;
  const alreadyHadAccident = window._bedwettingHadNightAccident === true;
  const nightLoad = window._bedwettingNightLoad || 0;

  logToOutput(`<span style="color:#81ecec;"><b>☀️ Morning Check</b></span>`);

  if (!alreadyHadAccident) {
    const overnightRoll = Math.random() * 100;
    const overnightAccidentChance = Math.max(
      4,
      100 - (tier.wakeChance + profile.wakeChanceMod) + (profile.ruleFollowed ? -5 : 10) + Math.floor(nightLoad / 120) * 4
    );

    if (overnightRoll < overnightAccidentChance * 0.45) {
      const satGain = getBedwettingAdjustedSatGain(5, 12, profile.nightOutputPct);
      manualSaturation = Math.min(manualSaturation + satGain, capacity + 10);
      updateSaturationUI(manualSaturation);
      checkOverflowSaturation(manualSaturation);
      logToOutput(`<span style="color:#fdcb6e;">You slept through a small leak without ever really waking up.</span>`);
    } else if (overnightRoll < overnightAccidentChance) {
      const satGain = getBedwettingAdjustedSatGain(16, 30, profile.nightOutputPct);
      manualSaturation = Math.min(manualSaturation + satGain, capacity + 15);
      updateSaturationUI(manualSaturation);
      checkOverflowSaturation(manualSaturation);
      logToOutput(`<span style="color:#ff7675;">You never woke up enough to react. There was a full nighttime accident.</span>`);
    } else {
      logToOutput(`<span style="color:#55efc4;">You made it through the night dry.</span>`);
    }
  } else {
    if (fillPct < 20) {
      logToOutput(`<span style="color:#ffeaa7;">You wake up with just a light dampness from the night's accident.</span>`);
    } else if (fillPct < 65) {
      logToOutput(`<span style="color:#fab1a0;">You wake up noticeably wet and need to check your protection.</span>`);
    } else {
      logToOutput(`<span style="color:#ff7675;">You wake up heavily wet and should clean up right away.</span>`);
    }
  }

  sessionRunning = false;
  const btn = $('btnQuickGo');
  if (btn) {
    btn.textContent = '🚽 I Need to Go!';
    btn.onclick = quickModeRoll;
    btn.style.display = 'none';
  }

  const wakeBtn = $('btnBedMorning');
  if (wakeBtn) {
    wakeBtn.textContent = '☀️ Morning Check';
    wakeBtn.onclick = bedwettingMorningCheck;
    wakeBtn.style.display = 'none';
  }

  const lbl = $('countdown');
  if (lbl) lbl.innerHTML = `<span style="color:#81ecec; font-size:1.1em;">Night complete.</span>`;

  saveState();
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
  if ($('protNone')?.checked) types.push('none');
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
  
  switch (profile) {
  case 'dependent': {
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
    break;
  }
  case 'npt': {
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
    break;
  }
  case 'train_rookie': {
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
    break;
  }
  case 'train_pro': {
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
    break;
  }
  case 'chaos_manual': {
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
    break;
  }
  case 'babysitter': {
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
    break;
  }
  case 'gauntlet_only': {
    content = `
      <div style="width:500px; background:#151923; padding:30px; border-radius:15px; border:2px solid #00cec9; text-align:center;">
        <h2 style="color:#00cec9; margin:0 0 10px 0;">🎯 Gauntlet Only (Exercise Holds)</h2>
        <p style="color:#cdd7e6; font-size:13px; margin:0 0 20px 0; line-height:1.6;">
          <b>How it works:</b> No bladder simulation. Random exercise-style hold challenges fire on a timer — squats, planks, kegels, position holds. Every gauntlet is unique.
        </p>
        
        <div style="background:#1b2030; padding:15px; border-radius:8px; margin-bottom:20px; text-align:left; border:1px solid #2b3348;">
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#00cec9; font-weight:bold;">Difficulty</span>
            <select id="gauntletDifficulty" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
              <option value="easy">Easy (3 blocks, shorter holds)</option>
              <option value="medium" selected>Medium (5 blocks, standard)</option>
              <option value="hard">Hard (7 blocks, longer holds)</option>
            </select>
          </label>
          
          <label style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
            <span style="color:#00cec9; font-weight:bold;">Time Between Gauntlets (minutes)</span>
            <span style="color:#999; font-size:12px;">Min: (2-10)</span>
            <input type="number" id="gauntletIntervalMin" min="2" max="10" value="5" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
            <span style="color:#999; font-size:12px;">Max: (10-30)</span>
            <input type="number" id="gauntletIntervalMax" min="10" max="30" value="20" style="padding:8px; background:#0f1115; border:1px solid #2b3348; color:#fff; border-radius:6px;">
          </label>
        </div>
        
        <button onclick="confirmProfileSetup('gauntlet_only')" style="width:100%; padding:12px; background:#00cec9; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">▶ Begin Session</button>
      </div>
    `;
    break;
  }
  case 'omorashi_hold':
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
  
  switch (profile) {
    case 'dependent':
      setupData.queueMin = parseInt($('depQueueMin').value) || 2;
      setupData.queueMax = parseInt($('depQueueMax').value) || 5;
      setupData.spasmsMin = parseInt($('depSpasmMin').value) || 8;
      setupData.spasmsMax = parseInt($('depSpasmMax').value) || 15;
      setupData.sipMin = parseInt($('depSipMin').value) || 2;
      setupData.sipMax = parseInt($('depSipMax').value) || 5;
      setupData.useDiuretics = $('depDiuretics').checked;
      break;
    case 'npt':
      setupData.voidMin = parseInt($('nptVoidMin').value) || 45;
      setupData.voidMax = parseInt($('nptVoidMax').value) || 90;
      setupData.satThreshold = parseInt($('nptSatThreshold').value) || 85;
      setupData.mercy = $('nptMercy').checked;
      setupData.sipMin = parseInt($('nptSipMin').value) || 2;
      setupData.sipMax = parseInt($('nptSipMax').value) || 5;
      break;
    case 'train_rookie':
      setupData.voidMin = parseInt($('rookieVoidMin').value) || 45;
      setupData.voidMax = parseInt($('rookieVoidMax').value) || 75;
      setupData.successRate = parseInt($('rookieSuccessRate').value) || 60;
      setupData.mercy = $('rookieMercy').checked;
      break;
    case 'train_pro':
      setupData.voidMin = parseInt($('proVoidMin').value) || 75;
      setupData.voidMax = parseInt($('proVoidMax').value) || 120;
      setupData.successRate = parseInt($('proSuccessRate').value) || 35;
      setupData.mercy = $('proMercy').checked;
      break;
    case 'chaos_manual':
      setupData.sipMin = parseInt($('chaosSipMin').value) || 2;
      setupData.sipMax = parseInt($('chaosSipMax').value) || 6;
      break;
    case 'babysitter':
      setupData.spasmsMin = parseInt($('babysitterSpasmsMin').value) || 40;
      setupData.spasmsMax = parseInt($('babysitterSpasmsMax').value) || 60;
      setupData.queueMin = parseInt($('babysitterQueueMin').value) || 0;
      setupData.queueMax = parseInt($('babysitterQueueMax').value) || 2;
      setupData.sipMin = parseInt($('babysitterSipMin').value) || 1;
      setupData.sipMax = parseInt($('babysitterSipMax').value) || 2;
      break;
    case 'gauntlet_only':
      setupData.difficulty = $('gauntletDifficulty').value || 'medium';
      setupData.intervalMin = parseInt($('gauntletIntervalMin').value) || 5;
      setupData.intervalMax = parseInt($('gauntletIntervalMax').value) || 20;
      break;
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

  const cfg = getProfileConfig();
  console.log(`🔄 Triggering random micro for profile: ${profileMode}`);

  // Dependent has its own queue-based dispatch
  if (cfg.scheduler === 'dependent') {
    triggerDependentMicro();
    return;
  }

  // Babysitter has custom payload + event emission
  if (cfg.scheduler === 'babysitter') {
    const evt = pick(cfg.microTable());
    const payload = createBabysitterLeakPayload('micro', evt.label || evt.desc);
    showBanner("⚠️ <b>SPASM</b>", "Oh no...", 'high');
    startChime(randInt(800, 1200));
    setTimeout(() => {
      acknowledgeAlarm();
      startVoidGuide(evt.guide, `<b>BABYSITTER MICRO:</b> ${evt.desc}`);
      emitBabysitterEvent('leak', { payload });
    }, 2000);
    return;
  }

  // Omorashi has its own stress test
  if (cfg.scheduler === 'omorashi') {
    scheduleNextOmorashiStressTest();
    return;
  }

  // All other profiles: generic micro from config table
  const evt = pick(cfg.microTable());
  const [title, sub] = cfg.alarmText || ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'];
  showBanner(title, sub, 'high');
  startChime(randInt(800, 1200));
  setTimeout(() => {
    acknowledgeAlarm();
    startVoidGuide(evt.guide, `<b>MICRO EVENT:</b> ${evt.desc}`);
  }, 2000);
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


function changeDiaper() {
  const cap = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() : 100;
  if (!changeAllowed && manualSaturation < cap) {
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

  const regressionLimits = { train_rookie: 5, train_pro: 8 };
  const limit = regressionLimits[profileMode];
  if (!limit) return;

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
  const changeThresholds = [
    { max: 40, chance: 0.15 },
    { max: 50, chance: 0.30 },
    { max: 75, chance: 0.60 }
  ];
  const allowedChance = changeThresholds.find(t => currentSat < t.max)?.chance ?? 0.95;

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

  // 2. Quick mode — static label, just show elapsed time
  if (profileMode === 'chaos_manual' && sessionRunning) {
    const elapsed = Math.floor((Date.now() - (sessionStartedAt || Date.now())) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    lbl.innerHTML = `<span style="color:#ff7675; font-size:1.1em;">Press the button when you need to go!</span> <span style="opacity:0.5; font-size:0.85em;">${m}m ${s}s</span>`;
    return;
  }

  // 3. DEBUG DASHBOARD MODE
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
  if (b.style.display === 'flex') {
    // If the incoming message is just a Micro or Drink (low priority), 
    // discard it to prevent stacking/confusion.
    if (priority === 'low') {
      console.log("Skipped low priority event due to active banner.");
      return;
    }
    // If it's High Priority (Main Event), we let it overwrite.
  }

  $('alarmText').innerHTML = msg; // Use innerHTML to allow bolding
  b.style.display = 'flex';

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
  } else if (!localStorage.getItem('abdlSimState') && !localStorage.getItem('profileMode')) {
    // First visit — no cached session or profile. Auto-show the setup modal.
    setTimeout(() => showSessionSetupModal(), 300);
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
  initMessyMode();
  renderStashUI();
})();



// 1. The Pre-Soak System (Random leaks while working)

let emergencyLeakCount = 0;
let lastEmergencyReportTime = 0;

function reportEmergencyLeak() {
  if (profileMode === 'babysitter') {
    // Cooldown: prevent spamming the emergency button
    const now = Date.now();
    const cooldownMs = 60000; // 1 minute cooldown
    if (now - lastEmergencyReportTime < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - lastEmergencyReportTime)) / 1000);
      logToOutput(`<span style="color:#636e72;">⏳ Babysitter already knows. Wait ${remaining}s before reporting again.</span>`);
      return;
    }
    lastEmergencyReportTime = now;

    logToOutput(`<span style="color:#ff7675;">⚠️ <b>You to Babysitter:</b> "I had an accident..." Babysitter checks you immediately.</span>`);
    openStatusModal(function() {
      stopChime();
      const capacity = getMainProtectionCapacity();
      const sat = manualSaturation;
      const leakThrough = sat >= capacity;
      const fillPct = (sat / capacity) * 100; // Fill percentage relative to protection
      babysitterFailureCount++;
      protectionFailures++;
      protectionSuccesses = 0;
      babysitterDryStreak = 0;

      if (leakThrough) {
        // At or above capacity — immediate change
        logToOutput(`<span style="color:#ff7675;">😨 Babysitter: "Oh no, you've leaked through completely. This ${formatProtectionLevel(currentProtectionLevel)} can't handle any more. We're changing you right now."</span>`);
        trackDayEvent('accident');
        checkBabysitterProgression('major_accident');
      } else if (fillPct >= 65) {
        // Heavy accident — very likely triggers protection change
        logToOutput(`<span style="color:#d63031;">😰 Babysitter: "Oh sweetie, that's a big one. Your ${formatProtectionLevel(currentProtectionLevel)} is really struggling. We need to deal with this."</span>`);
        logToOutput(`<span style="color:#fdcb6e;">⏳ Accident logged. You are being left to sit in it for a while. Status check in ~15 mins.</span>`);
        trackDayEvent('accident');
        checkBabysitterProgression('major_accident');
      } else if (fillPct >= 35) {
        // Moderate accident
        logToOutput(`<span style="color:#ff7675;">😟 Babysitter: "I can feel it, you definitely had an accident in there. We'll monitor this closely."</span>`);
        logToOutput(`<span style="color:#fdcb6e;">⏳ Accident logged. Babysitter will check again soon.</span>`);
        trackDayEvent('accident');
        checkBabysitterProgression('accident');
      } else {
        // Minor dampness
        logToOutput(`<span style="color:#fab1a0;">😕 Babysitter: "A little damp, huh? Not the end of the world. Try harder next time."</span>`);
        trackDayEvent('partial_accident');
        checkBabysitterProgression('partial_accident');
      }
      updateBabysitterUI();
    });
    return;
  }

  // Manually pushing saturation to an "overflow" state
  const overflowVal = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() + 10 : 110;
  manualSaturation = overflowVal;
  updateSaturationUI(overflowVal);

  logToOutput(`<span style="color:#ff7675">⚠️ <b>ADMISSION:</b> You admitted to a leak. Reporting for Bio-Check immediately.</span>`);

  // Force the Bio-Check modal to confirm the wetness
  openStatusModal();
}

function checkOverflowSaturation(val) {
  let s = parseInt(val);
  const capacity = (typeof getMainProtectionCapacity === 'function') ? getMainProtectionCapacity() : 100;
  if (s >= capacity && !window._overflowFired) {
    window._overflowFired = true;
    const isNone = currentProtectionLevel === 'none';
    const msg = isNone
      ? `<span style="color:#d63031">🚨 <b>LEAK:</b> You have no protection — it's running down your legs!</span>`
      : `<span style="color:#d63031">🚨 <b>OVERFLOW:</b> Your ${formatProtectionLevel(currentProtectionLevel)} has failed. You are leaking now!</span>`;
    logToOutput(msg);
    regressionLeaks += 2;
    checkRegression();

    // Grant immediate permission to change because of the mess
    changeAllowed = true;
    const changeBtn = $('btnChange');
    if (changeBtn) changeBtn.classList.remove('locked');
  } else if (s < capacity) {
    // Reset flag when saturation drops below capacity (e.g. after a change)
    window._overflowFired = false;
  }
}

// === Messy Mode (#2 Accidents) ===

function toggleMessyMode(enabled) {
  localStorage.setItem('messyModeEnabled', JSON.stringify(enabled));
  const btn = $('btnMessy');
  if (btn) btn.style.display = enabled ? '' : 'none';
  toast(enabled ? '💩 Uh-Oh button enabled' : '💩 Uh-Oh button hidden');
}

function initMessyMode() {
  const saved = JSON.parse(localStorage.getItem('messyModeEnabled') || 'false');
  const toggle = $('messyModeToggle');
  if (toggle) toggle.checked = saved;
  const btn = $('btnMessy');
  if (btn) btn.style.display = saved ? '' : 'none';
}

function triggerMessyEvent() {
  // Show a choice overlay: Hold It or Push It
  const backdrop = $('infoModalBackdrop');
  const body = $('infoModalBody');
  if (!backdrop || !body) return;

  body.innerHTML = `
    <h2 style="margin-bottom:12px;">💩 Uh Oh...</h2>
    <p style="color:#cdd7e6; margin-bottom:16px;">What's happening?</p>
    <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
      <button onclick="startMessyHolding(); $('infoModalBackdrop').style.display='none';"
        style="flex:1; min-width:120px; padding:14px 18px; background:#8B4513; color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:15px; font-weight:bold;">
        🤞 Hold It!
      </button>
      <button onclick="startMessyPushing(); $('infoModalBackdrop').style.display='none';"
        style="flex:1; min-width:120px; padding:14px 18px; background:#5D3A1A; color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:15px; font-weight:bold;">
        😣 Push It!
      </button>
    </div>
    <button onclick="$('infoModalBackdrop').style.display='none';"
      style="margin-top:14px; padding:8px 16px; background:#2b3348; color:#8ea0b6; border:none; border-radius:8px; cursor:pointer; font-size:13px; width:100%;">
      Cancel
    </button>
  `;
  backdrop.style.display = 'block';
}

function startMessyHolding() {
  const gauntlet = pick(filterByTags(MESSY_HOLDING_GAUNTLETS_D10));
  logToOutput(`<span style="color:#c97b3a">💩 <b>Holding Gauntlet:</b> ${gauntlet.name}</span>`);
  startVoidGuide(gauntlet.guide, `<b>💩 ${gauntlet.name}</b><br>Hold it! Follow the steps.`, 'full');
}

function startMessyPushing() {
  const accident = pick(filterByTags(MESSY_PUSHING_ACCIDENTS_D10));
  logToOutput(`<span style="color:#8B4513">💩 <b>${accident.name}</b> — ${accident.desc}</span>`);
  startVoidGuide(accident.guide, `<b>💩 ${accident.name}</b><br>${accident.desc}`, 'full');
}


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
    messymode: {
      title: '💩 Uh-Oh Mode',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>Enables the <b>💩 Uh Oh...</b> button for manual #2 accidents.</p>
          <h3 style="color:#c97b3a; margin:12px 0 6px;">How it works</h3>
          <ul style="margin:0; padding-left:18px;">
            <li>Press the button when you feel the urge.</li>
            <li>Choose <b>Hold It</b> for a timed holding gauntlet (2-3 min) — clench, shift positions, and survive.</li>
            <li>Choose <b>Push It</b> for a guided pushing accident — varied positions and instructions.</li>
          </ul>
          <h3 style="color:#c97b3a; margin:12px 0 6px;">Important</h3>
          <ul style="margin:0; padding-left:18px;">
            <li>This is <b>manual only</b> — the sim will never trigger it automatically.</li>
            <li>Toggle it on in Options to reveal the button on the main screen.</li>
          </ul>
        </div>
      `
    },
    deskmode: {
      title: '🪑 Desk Mode',
      html: `
        <div style="line-height:1.65; color:#cdd7e6; font-size:14px;">
          <p>Filters out events that require <b>physical movement</b> you can't do while seated at a desk.</p>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">What gets filtered</h3>
          <ul style="margin:0; padding-left:18px;">
            <li><b>Standing</b> — events requiring you to stand up</li>
            <li><b>Walking</b> — events requiring walking, jogging, stairs</li>
            <li><b>Floor</b> — events requiring lying down, planking, hands-and-knees</li>
            <li><b>Squatting</b> — events requiring deep squats or squat holds</li>
          </ul>
          <h3 style="color:#74b9ff; margin:12px 0 6px;">Involuntary filter</h3>
          <p>Separately, the <b>involuntary filter</b> removes events you can't physically make happen (laugh, sneeze, hiccup, shiver, tickle). Enable it below the desk mode toggle.</p>
          <p style="margin-top:8px; color:#8ea0b6; font-size:12px;">Filtered events won't appear in rolls. If all events in a table are filtered, the full table is used as fallback.</p>
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


