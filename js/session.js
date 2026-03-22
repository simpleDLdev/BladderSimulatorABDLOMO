/* ===========================
   session.js — Save/Load persistence
   =========================== */

function saveState() {
  const state = {
    manualPressure,
    manualSaturation,
    sessionRunning,
    meetingActive,
    mainEndAt,
    microEndAt,
    hydrationEndAt, // NEW: Save the drink timer
    hydrationEnabled: window.hydrationEnabled,
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
  microEndAt = state.microEndAt || null;
  hydrationEndAt = state.hydrationEndAt || null; // Restore drink timer
  if (state.hydrationEnabled !== undefined) window.hydrationEnabled = state.hydrationEnabled;

  $('pressureSlider').value = manualPressure;
  $('saturationSlider').value = manualSaturation;
  $('profileSelect').value = profileMode;
  updatePressureUI(manualPressure);
  updateSaturationUI(manualSaturation);

  if (meetingActive) {
    const meetingBanner = $('meetingBanner') || $('pauseBannerAlarm');
    const btnChange = $('btnChange');
    const btnMeeting = $('btnMeeting');
    if (meetingBanner) meetingBanner.style.display = 'block';
    if (btnChange) btnChange.classList.add('locked');
    if (btnMeeting) btnMeeting.textContent = "▶ Resume Alarm";
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

