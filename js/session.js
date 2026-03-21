/* ===========================
   session.js — Save/Load persistence
   =========================== */

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

