/* ===========================
   custom-profiles.js — Custom profile system
   =========================== */

function getSavedCustomProfiles() {
  return JSON.parse(localStorage.getItem('customProfiles') || '[]');
}

function saveCustomProfiles(list) {
  localStorage.setItem('customProfiles', JSON.stringify(list));
}

function openCustomProfileEditor() {
  const panel = $('customProfileBackdrop');
  if (!panel) return;
  panel.style.display = 'block';
  renderSavedProfilesList();
}

function parseEventPack(text, label) {
  const raw = (text || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Must be an array');
    return parsed.filter(e => e && Array.isArray(e.guide));
  } catch (err) {
    toast(`${label} JSON invalid - ignored`);
    console.warn(label, err);
    return [];
  }
}

function buildCustomProfileFromForm() {
  const profile = {
    id: Date.now().toString(36),
    name: ($('cpName')?.value || '').trim() || 'Untitled Custom Profile',
    description: ($('cpDesc')?.value || '').trim() || 'No description',
    createdAt: new Date().toISOString(),
    runtime: {
      baseProfile: $('cpBaseProfile')?.value || 'babysitter',
      mainMin: parseInt($('cpMainMin')?.value, 10) || 30,
      mainMax: parseInt($('cpMainMax')?.value, 10) || 90,
      microMin: parseInt($('cpMicroMin')?.value, 10) || 5,
      microMax: parseInt($('cpMicroMax')?.value, 10) || 15,
      pottySuccessRate: parseInt($('cpPottyRate')?.value, 10) || 50,
      microsPerCycle: parseInt($('cpMicrosPerCycle')?.value, 10) || 3,
      leakScalar: parseFloat($('cpLeakScalar')?.value) || 1,
      pressureAcceleration: parseFloat($('cpPressureAccel')?.value) || 1,
      sipMin: parseInt($('cpSipMin')?.value, 10) || 2,
      sipMax: parseInt($('cpSipMax')?.value, 10) || 5,
      hydrationMin: parseInt($('cpHydrationMin')?.value, 10) || 15,
      hydrationMax: parseInt($('cpHydrationMax')?.value, 10) || 45,
      startProtection: $('cpStartProtection')?.value || 'diapers',
      progressionEnabled: ($('cpProgression')?.value || 'yes') === 'yes',
      successThreshold: parseInt($('cpSuccessThresh')?.value, 10) || 3,
      failureThreshold: parseInt($('cpFailThresh')?.value, 10) || 2,
      pushToLeak: $('cpPushToLeak')?.value || 'optional',
      mercyMode: $('cpMercy')?.value || 'optional',
      preChime: ($('cpPreChime')?.value || 'yes') === 'yes',
      customMicroEvents: parseEventPack($('cpCustomMicroEvents')?.value || '', 'Custom micro events'),
      customFullEvents: parseEventPack($('cpCustomFullEvents')?.value || '', 'Custom full events')
    }
  };

  profile.runtime.mainMin = Math.max(1, profile.runtime.mainMin);
  profile.runtime.mainMax = Math.max(profile.runtime.mainMin, profile.runtime.mainMax);
  profile.runtime.microMin = Math.max(1, profile.runtime.microMin);
  profile.runtime.microMax = Math.max(profile.runtime.microMin, profile.runtime.microMax);
  profile.runtime.hydrationMin = Math.max(5, profile.runtime.hydrationMin);
  profile.runtime.hydrationMax = Math.max(profile.runtime.hydrationMin, profile.runtime.hydrationMax);
  profile.runtime.successThreshold = Math.max(1, profile.runtime.successThreshold);
  profile.runtime.failureThreshold = Math.max(1, profile.runtime.failureThreshold);
  return profile;
}

function saveCustomProfile() {
  const profile = buildCustomProfileFromForm();
  const profiles = getSavedCustomProfiles();
  profiles.push(profile);
  saveCustomProfiles(profiles);
  toast(`Saved custom profile: ${profile.name}`);
  renderSavedProfilesList();
}

function renderSavedProfilesList() {
  const box = $('savedProfilesList');
  if (!box) return;
  const profiles = getSavedCustomProfiles();
  if (!profiles.length) {
    box.innerHTML = '<div style="color:#666; font-size:12px;">No saved custom profiles yet.</div>';
    return;
  }
  box.innerHTML = `
    <div style="color:#e17055; font-weight:bold; margin-bottom:8px;">Saved Profiles</div>
    ${profiles.map((p, idx) => `
      <div style="background:#1b2030; border:1px solid #2b3348; border-radius:8px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
          <div>
            <div style="color:#fff; font-weight:bold; font-size:13px;">${p.name}</div>
            <div style="color:#8ea0b6; font-size:11px;">${p.description}</div>
            <div style="color:#666; font-size:11px; margin-top:4px;">Base: ${p.runtime?.baseProfile || 'babysitter'} | Main: ${p.runtime?.mainMin}-${p.runtime?.mainMax}m</div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
            <button onclick="applyCustomProfile('${p.id}')" style="padding:6px 10px; background:#55efc4; color:#000; border:none; border-radius:6px; cursor:pointer; font-size:11px;">Apply</button>
            <button onclick="loadCustomProfileIntoEditor('${p.id}')" style="padding:6px 10px; background:#7cc4ff; color:#000; border:none; border-radius:6px; cursor:pointer; font-size:11px;">Load</button>
            <button onclick="deleteCustomProfile('${p.id}')" style="padding:6px 10px; background:#ff7675; color:#000; border:none; border-radius:6px; cursor:pointer; font-size:11px;">Delete</button>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

function loadCustomProfileIntoEditor(profileId) {
  const p = getSavedCustomProfiles().find(x => x.id === profileId);
  if (!p) return;
  const r = p.runtime || {};
  if ($('cpName')) $('cpName').value = p.name || '';
  if ($('cpDesc')) $('cpDesc').value = p.description || '';
  if ($('cpBaseProfile')) $('cpBaseProfile').value = r.baseProfile || 'babysitter';
  if ($('cpMainMin')) $('cpMainMin').value = r.mainMin ?? 30;
  if ($('cpMainMax')) $('cpMainMax').value = r.mainMax ?? 90;
  if ($('cpMicroMin')) $('cpMicroMin').value = r.microMin ?? 5;
  if ($('cpMicroMax')) $('cpMicroMax').value = r.microMax ?? 15;
  if ($('cpPottyRate')) $('cpPottyRate').value = r.pottySuccessRate ?? 50;
  if ($('cpMicrosPerCycle')) $('cpMicrosPerCycle').value = r.microsPerCycle ?? 3;
  if ($('cpLeakScalar')) $('cpLeakScalar').value = r.leakScalar ?? 1;
  if ($('cpPressureAccel')) $('cpPressureAccel').value = r.pressureAcceleration ?? 1;
  if ($('cpSipMin')) $('cpSipMin').value = r.sipMin ?? 2;
  if ($('cpSipMax')) $('cpSipMax').value = r.sipMax ?? 5;
  if ($('cpHydrationMin')) $('cpHydrationMin').value = r.hydrationMin ?? 15;
  if ($('cpHydrationMax')) $('cpHydrationMax').value = r.hydrationMax ?? 45;
  if ($('cpStartProtection')) $('cpStartProtection').value = r.startProtection || 'diapers';
  if ($('cpProgression')) $('cpProgression').value = r.progressionEnabled === false ? 'no' : 'yes';
  if ($('cpSuccessThresh')) $('cpSuccessThresh').value = r.successThreshold ?? 3;
  if ($('cpFailThresh')) $('cpFailThresh').value = r.failureThreshold ?? 2;
  if ($('cpPushToLeak')) $('cpPushToLeak').value = r.pushToLeak || 'optional';
  if ($('cpMercy')) $('cpMercy').value = r.mercyMode || 'optional';
  if ($('cpPreChime')) $('cpPreChime').value = r.preChime === false ? 'no' : 'yes';
  if ($('cpCustomMicroEvents')) $('cpCustomMicroEvents').value = (r.customMicroEvents?.length ? JSON.stringify(r.customMicroEvents, null, 2) : '');
  if ($('cpCustomFullEvents')) $('cpCustomFullEvents').value = (r.customFullEvents?.length ? JSON.stringify(r.customFullEvents, null, 2) : '');
}

function deleteCustomProfile(profileId) {
  const list = getSavedCustomProfiles().filter(p => p.id !== profileId);
  saveCustomProfiles(list);
  renderSavedProfilesList();
}

function exportCustomProfile() {
  const profile = buildCustomProfileFromForm();
  profile.schema = 'abdl-custom-profile-v1';
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const safeName = (profile.name || 'custom-profile').replace(/[^a-z0-9_-]+/gi, '_');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  toast('Custom profile exported as JSON');
}

function importCustomProfileData(rawText, sourceLabel) {
  try {
    const data = JSON.parse(rawText);
    if (!data || !data.runtime) throw new Error('Invalid profile shape');
    if (!data.id) data.id = Date.now().toString(36);
    const profiles = getSavedCustomProfiles();
    profiles.push(data);
    saveCustomProfiles(profiles);
    loadCustomProfileIntoEditor(data.id);
    renderSavedProfilesList();
    toast(`Imported custom profile from ${sourceLabel}: ${data.name || 'Unnamed'}`);
    return true;
  } catch (err) {
    console.error(err);
    toast(`Invalid JSON from ${sourceLabel}`);
    return false;
  }
}

function importCustomProfile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importCustomProfileData(reader.result, 'file');
    };
    reader.readAsText(file);
  };
  input.click();
}

async function importCustomProfileFromClipboard() {
  if (!navigator.clipboard?.readText) {
    toast('Clipboard import is not available in this browser');
    return;
  }

  try {
    const rawText = await navigator.clipboard.readText();
    if (!rawText || !rawText.trim()) {
      toast('Clipboard is empty');
      return;
    }
    importCustomProfileData(rawText, 'clipboard');
  } catch (err) {
    console.error(err);
    toast('Clipboard access was denied');
  }
}

function applyCustomProfile(profileId) {
  const p = getSavedCustomProfiles().find(x => x.id === profileId);
  if (!p) return;

  activeCustomProfile = p;
  customProfileRuntime = p.runtime || null;
  localStorage.setItem('activeCustomProfile', JSON.stringify(activeCustomProfile));

  const runtime = customProfileRuntime || {};
  profileMode = runtime.baseProfile || 'babysitter';
  localStorage.setItem('profileMode', profileMode);

  switch (profileMode) {
    case 'dependent':
      depSpasmMin = runtime.mainMin || depSpasmMin;
      depSpasmMax = runtime.mainMax || depSpasmMax;
      depQueueMin = Math.max(0, (runtime.microsPerCycle || depQueueMin) - 1);
      depQueueMax = Math.max(depQueueMin, runtime.microsPerCycle || depQueueMax);
      break;
    case 'npt':
      nptVoidMin = runtime.mainMin || nptVoidMin;
      nptVoidMax = runtime.mainMax || nptVoidMax;
      nptMercy = runtime.mercyMode === 'disabled' ? false : nptMercy;
      break;
    case 'train_rookie':
      rookieVoidMin = runtime.mainMin || rookieVoidMin;
      rookieVoidMax = runtime.mainMax || rookieVoidMax;
      rookieSuccessRate = runtime.pottySuccessRate || rookieSuccessRate;
      rookieMercy = runtime.mercyMode === 'disabled' ? false : rookieMercy;
      break;
    case 'train_pro':
      proVoidMin = runtime.mainMin || proVoidMin;
      proVoidMax = runtime.mainMax || proVoidMax;
      proSuccessRate = runtime.pottySuccessRate || proSuccessRate;
      proMercy = runtime.mercyMode === 'disabled' ? false : proMercy;
      break;
    case 'chaos_manual':
      chaosSipMin = runtime.sipMin || chaosSipMin;
      chaosSipMax = runtime.sipMax || chaosSipMax;
      break;
    case 'babysitter':
      depSpasmMin = runtime.mainMin || depSpasmMin;
      depSpasmMax = runtime.mainMax || depSpasmMax;
      depQueueMin = Math.max(0, (runtime.microsPerCycle || depQueueMin) - 1);
      depQueueMax = Math.max(depQueueMin, runtime.microsPerCycle || depQueueMax);
      break;
  }

  if ($('profileSelect')) {
    $('profileSelect').value = profileMode;
    applySelectedProfile();
  }

  progressionUpgradeThreshold = runtime.successThreshold || 3;
  progressionDowngradeThreshold = runtime.failureThreshold || 2;

  if (runtime.startProtection && PROTECTION_HIERARCHY.includes(runtime.startProtection)) {
    currentProtectionLevel = runtime.startProtection;
    localStorage.setItem('currentProtectionLevel', currentProtectionLevel);
  }

  if (runtime.sipMin) {
    depSipMin = runtime.sipMin;
    nptSipMin = runtime.sipMin;
    chaosSipMin = runtime.sipMin;
  }
  if (runtime.sipMax) {
    depSipMax = runtime.sipMax;
    nptSipMax = runtime.sipMax;
    chaosSipMax = runtime.sipMax;
  }

  if (runtime.mercyMode === 'forced') {
    window.mercyMode = true;
    const btn = $('btnMercy');
    if (btn) btn.textContent = 'Mercy: ON';
  } else if (runtime.mercyMode === 'disabled') {
    window.mercyMode = false;
    const btn = $('btnMercy');
    if (btn) btn.textContent = 'Mercy: OFF';
  }

  if (runtime.pushToLeak === 'forced') {
    togglePushToLeak(true);
  } else if (runtime.pushToLeak === 'disabled') {
    togglePushToLeak(false);
  }

  renderStashUI();
  $('customProfileBackdrop').style.display = 'none';
  toast(`Applied custom profile: ${p.name}`);
  logToOutput(`<span style="color:#e17055;"><b>🧪 Custom Profile Active:</b> ${p.name} (${runtime.baseProfile || 'babysitter'} base)</span>`);
}
Object.assign(window, {
  nextReveal, acknowledgeAlarm, skipAlarm, startSession, stopAll,
  toggleMicroNoise, changeDiaper, haveAccident, applySelectedProfile,
  getUrgencyDesc, getUrgencyLevel, buildUrgencyTableHTML, showUrgencyRefTable, toggleUrgencyNeutral,
  updatePressureUI, updateSaturationUI, logDrink, toggleMeetingMode,
  showInfoModal, openCustomProfileEditor, saveCustomProfile, exportCustomProfile,
  importCustomProfile, applyCustomProfile, loadCustomProfileIntoEditor, deleteCustomProfile,
  openEventBuilder, refreshEventBuilder, eventBuilderPrev, eventBuilderNext,
  appendEventsFromBuilderJson, clearAppendedEventsForProfile, resetDisabledEventsForProfile,
  toggleCurrentEventDisabled, cloneCurrentEventToJson,
  openEventBuilderForProfile, exportEventBuilderState, importEventBuilderState,
  toggleSidebarSection,
  checkStatus: () => toast("Status Logged")
});
