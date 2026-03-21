/* ===========================
   profiles/dependent.js — Dependent profile logic
   =========================== */

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


