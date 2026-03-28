/* ===========================
   profile-logic.js -- shared profile runtime + tracking helpers
   =========================== */

let pendingGuideTrackingOutcome = null;

function isCustomTrackingSession() {
  return !!(activeCustomProfile && customProfileRuntime);
}

function isQueueProfile(mode = profileMode) {
  return mode === 'dependent';
}

function isRegularTimedProfile(mode = profileMode) {
  return mode !== 'dependent' && mode !== 'babysitter' && mode !== 'gauntlet_only' && mode !== 'chaos_manual' && mode !== 'omorashi_hold';
}

function shouldTrackSessionStats() {
  if (profileMode === 'gauntlet_only') return false;
  if (profileMode === 'omorashi_hold' && !sessionRunning) return false;
  return true;
}

function trackSessionStat(eventType, details) {
  if (!shouldTrackSessionStats()) return;
  if (typeof trackDayEvent === 'function') {
    trackDayEvent(eventType, details);
  }
}

function syncDayTrackerPanelVisibility() {
  const panel = $('dayTrackerPanel');
  if (!panel) return;
  const visible = sessionRunning && shouldTrackSessionStats();
  panel.style.display = visible ? 'block' : 'none';
  if (visible && typeof renderDayTracker === 'function') {
    renderDayTracker();
  }
}

function normalizeGuideOutcomeType(type) {
  if (type === 'full_light' || type === 'full_heavy') return 'full';
  return type;
}

function trackGuideCompletionOutcome(currentType, restroomTrip) {
  if (profileMode === 'babysitter') return;

  if (pendingGuideTrackingOutcome) {
    trackSessionStat(pendingGuideTrackingOutcome);
    return;
  }

  if (restroomTrip) {
    trackSessionStat('potty_success');
    return;
  }

  const outcomeType = normalizeGuideOutcomeType(currentType);
  if (outcomeType === 'micro') {
    trackSessionStat('partial_accident');
  } else if (outcomeType === 'full') {
    trackSessionStat('accident');
  }
}

function initializeQueueProfileSession() {
  clearTimeout(microTimer);
  pendingAmbientEvent = null;

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
    depMicroCount = 0;
    depMicroTarget = randInt(depQueueMin, depQueueMax);
  }

  scheduleDependentEvent();
  scheduleNextHydration();
}

function initializeRegularTimedProfileSession() {
  if (profileMode === 'train_rookie') {
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

    let firstMin = 15;
    let firstMax = 30;
    if (manualPressure > 70) {
      firstMin = 5;
      firstMax = 15;
    }
    scheduleMainEvent({ min: firstMin, max: firstMax });
    schedulePreSoak();
    scheduleNextHydration();
    return;
  }

  if (profileMode === 'train_pro') {
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

    let firstMin = 30;
    let firstMax = 50;
    if (manualPressure > 70) {
      firstMin = 15;
      firstMax = 30;
    }
    scheduleMainEvent({ min: firstMin, max: firstMax });
    schedulePreSoak();
    scheduleNextHydration();
    return;
  }

  if (profileMode === 'npt') {
    const isCustomNpt = !!(customProfileRuntime && customProfileRuntime.baseProfile === 'npt');
    const setupStr = localStorage.getItem('npt_setup');
    const setup = setupStr ? JSON.parse(setupStr) : null;

    nptVoidMin = isCustomNpt
      ? (customProfileRuntime.mainMin || 45)
      : (setup?.voidMin || 45);
    nptVoidMax = isCustomNpt
      ? (customProfileRuntime.mainMax || nptVoidMin)
      : (setup?.voidMax || 90);
    nptSatThreshold = setup?.satThreshold || 85;

    if (isCustomNpt) {
      if (customProfileRuntime.mercyMode === 'disabled') nptMercy = false;
      else if (customProfileRuntime.mercyMode === 'forced') nptMercy = true;
      else nptMercy = setup ? setup.mercy !== false : true;
    } else {
      nptMercy = setup ? setup.mercy !== false : true;
    }

    nptSipMin = isCustomNpt
      ? (customProfileRuntime.sipMin || 2)
      : (setup?.sipMin || 2);
    nptSipMax = isCustomNpt
      ? (customProfileRuntime.sipMax || nptSipMin)
      : (setup?.sipMax || 5);

    nptVoidMin = Math.max(1, nptVoidMin);
    nptVoidMax = Math.max(nptVoidMin, nptVoidMax);
    nptSipMin = Math.max(1, nptSipMin);
    nptSipMax = Math.max(nptSipMin, nptSipMax);

    const modeLabel = isCustomNpt
      ? `🧪 ${activeCustomProfile?.name || 'Custom Profile'} Started`
      : '🌙 Not Potty Trained Mode Started';
    logToOutput(`<span style="color:#a29bfe"><b>${modeLabel}</b><br>Void window: ${nptVoidMin}-${nptVoidMax} mins<br>Saturation threshold: ${nptSatThreshold}%</span>`);

    let firstMin = 15;
    let firstMax = 40;
    if (manualPressure > 70) {
      firstMin = 5;
      firstMax = 15;
    }
    scheduleMainEvent({ min: firstMin, max: firstMax });
    scheduleNextHydration();
    return;
  }

  let firstMin = 15;
  let firstMax = 40;
  if (manualPressure > 70) {
    firstMin = 5;
    firstMax = 15;
  } else if (manualPressure > 40) {
    firstMin = 10;
    firstMax = 25;
  }

  scheduleMainEvent({ min: firstMin, max: firstMax });
  if (profileMode.startsWith('train_')) schedulePreSoak();
  scheduleNextHydration();
}

Object.assign(window, {
  isCustomTrackingSession,
  isQueueProfile,
  isRegularTimedProfile,
  shouldTrackSessionStats,
  trackSessionStat,
  syncDayTrackerPanelVisibility,
  normalizeGuideOutcomeType,
  trackGuideCompletionOutcome,
  initializeQueueProfileSession,
  initializeRegularTimedProfileSession
});
