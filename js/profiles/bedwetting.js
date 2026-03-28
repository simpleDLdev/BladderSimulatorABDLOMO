/* ===========================
   bedwetting.js — Bedwetting mode setup, session flow, and outcomes
   =========================== */

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

function bedwettingPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clampBedwettingValue(value, min, max, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function cloneGuideSteps(steps) {
  return steps.map(step => ({ ...step }));
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
    wakeChanceMod: clampBedwettingValue($('bedwettingWakeMod')?.value, -30, 30, 0),
    wakeDuringAccidentChance: clampBedwettingValue($('bedwettingWakeDuring')?.value, 0, 100, 35),
    wakeAfterAccidentChance: clampBedwettingValue($('bedwettingWakeAfter')?.value, 0, 100, 55),
    nightOutputPct: clampBedwettingValue($('bedwettingNightOutput')?.value, 50, 180, 100),
    afterAccidentHydrationMl: clampBedwettingValue($('bedwettingAfterHydration')?.value, 0, 500, 0),
  };
}

function setBedwettingSliderLabels(profile) {
  const wakeModLabel = $('bedwettingWakeModLabel');
  if (wakeModLabel) {
    const value = profile.wakeChanceMod;
    wakeModLabel.textContent = value <= -20 ? 'Very deep sleeper' : value <= -8 ? 'Hard to wake' : value <= 8 ? 'Normal' : value <= 18 ? 'Light sleeper' : 'Very light sleeper';
  }

  const wakeDuringLabel = $('bedwettingWakeDuringLabel');
  if (wakeDuringLabel) {
    const value = profile.wakeDuringAccidentChance;
    wakeDuringLabel.textContent = value <= 15 ? 'Rarely' : value <= 35 ? 'Sometimes' : value <= 60 ? 'Often' : value <= 80 ? 'Usually' : 'Almost always';
  }

  const wakeAfterLabel = $('bedwettingWakeAfterLabel');
  if (wakeAfterLabel) {
    const value = profile.wakeAfterAccidentChance;
    wakeAfterLabel.textContent = value <= 15 ? 'Rarely' : value <= 35 ? 'Sometimes' : value <= 60 ? 'Often' : value <= 80 ? 'Usually' : 'Almost always';
  }

  const outputLabel = $('bedwettingNightOutputLabel');
  if (outputLabel) {
    const value = profile.nightOutputPct;
    outputLabel.textContent = value <= 70 ? 'Light' : value <= 90 ? 'Normal' : value <= 110 ? 'Full' : value <= 140 ? 'Heavy' : 'Very heavy';
  }

  const hydrationLabel = $('bedwettingAfterHydrationLabel');
  if (hydrationLabel) {
    const value = profile.afterAccidentHydrationMl;
    hydrationLabel.textContent = value === 0 ? 'Off' : value <= 100 ? 'Small sip' : value <= 200 ? 'Quarter glass' : value <= 350 ? 'Half glass' : 'Full glass';
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
  if ($('bedwettingWakeMod')) $('bedwettingWakeMod').value = clampBedwettingValue(merged.wakeChanceMod, -30, 30, 0);
  if ($('bedwettingWakeDuring')) $('bedwettingWakeDuring').value = clampBedwettingValue(merged.wakeDuringAccidentChance, 0, 100, 35);
  if ($('bedwettingWakeAfter')) $('bedwettingWakeAfter').value = clampBedwettingValue(merged.wakeAfterAccidentChance, 0, 100, 55);
  if ($('bedwettingNightOutput')) $('bedwettingNightOutput').value = clampBedwettingValue(merged.nightOutputPct, 50, 180, 100);
  if ($('bedwettingAfterHydration')) $('bedwettingAfterHydration').value = clampBedwettingValue(merged.afterAccidentHydrationMl, 0, 500, 0);

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

  const html = `
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

  const container = $('bedwettingSetup');
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
  const position = bedwettingPick(BEDWETTING_EVENT_MODULES.positions);
  const cue = bedwettingPick(BEDWETTING_EVENT_MODULES.wakeCues);
  return `While ${position}, ${cue}.`;
}

function getBedwettingAccidentNarrative(kind, wakeState) {
  const position = bedwettingPick(BEDWETTING_EVENT_MODULES.positions);
  const start = bedwettingPick(kind === 'micro' ? BEDWETTING_EVENT_MODULES.microStarts : BEDWETTING_EVENT_MODULES.macroStarts);
  const endingPool = wakeState === 'during'
    ? BEDWETTING_EVENT_MODULES.midWake
    : wakeState === 'after'
      ? BEDWETTING_EVENT_MODULES.afterWake
      : BEDWETTING_EVENT_MODULES.sleepThrough;
  const ending = bedwettingPick(endingPool);
  return `While ${position}, ${start}. ${ending}`;
}

function getBedwettingGuideSteps(kind, wakeState, tierKey) {
  if (wakeState === 'potty') {
    return [{ text: 'GET UP AND GO', time: 0, type: 'stop' }];
  }

  const positionStep = {
    text: bedwettingPick(BEDWETTING_EVENT_MODULES.positions).toUpperCase(),
    time: 2,
    type: 'relax'
  };
  const hasMercy = ['dry_nights', 'light_bedwetter', 'moderate_bedwetter'].includes(tierKey);

  let pool;
  if (kind === 'micro') {
    if (wakeState === 'during') pool = hasMercy ? BEDWETTING_MICRO_DURING_MERCY_D6 : BEDWETTING_MICRO_DURING_D6;
    else if (wakeState === 'after') pool = BEDWETTING_MICRO_AFTER_D4;
    else pool = BEDWETTING_MICRO_SLEEP_D4;
  } else {
    if (wakeState === 'during') pool = hasMercy ? BEDWETTING_MACRO_DURING_MERCY_D6 : BEDWETTING_MACRO_DURING_D6;
    else if (wakeState === 'after') pool = BEDWETTING_MACRO_AFTER_D4;
    else pool = BEDWETTING_MACRO_SLEEP_D4;
  }

  const event = bedwettingPick(pool);
  return [positionStep, ...cloneGuideSteps(event.guide)];
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
  clearAllBabysitterTimers();
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
  const bedwettingSetup = $('bedwettingSetup');
  if (bedwettingSetup) bedwettingSetup.remove();

  $('output').textContent = '';
  sessionRunning = true;
  sessionElapsedStartedAt = Date.now();
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
  const tierKey = window._bedwettingTier || profile.tier;
  const tier = BEDWETTING_TIER_MAP[tierKey] || BEDWETTING_TIER_MAP.moderate_bedwetter;
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
    window._bedwettingNightLoad = Math.max(0, nightLoad - 180);
    if (manualSaturation > 0) {
      manualSaturation = Math.max(0, manualSaturation - 4);
      updateSaturationUI(manualSaturation);
    }
    saveState();
    const pottySteps = getBedwettingGuideSteps(null, 'potty', tierKey);
    setTimeout(() => startVoidGuide(pottySteps, '🚽 You made it — get up and release fully, then head back to bed.', 'micro', 'potty_success'), 400);
    return;
  }

  const isMicro = Math.random() * 100 < tier.microChance;

  if (isMicro) {
    let satGain = getBedwettingAdjustedSatGain(4, 11, profile.nightOutputPct);
    const wokeDuring = Math.random() * 100 < profile.wakeDuringAccidentChance;
    if (wokeDuring) satGain = Math.max(2, Math.round(satGain * 0.75));
    manualSaturation = Math.min(manualSaturation + satGain, 110);
    updateSaturationUI(manualSaturation);
    checkOverflowSaturation(manualSaturation);
    window._bedwettingHadNightAccident = true;
    window._bedwettingNightLoad = Math.max(0, nightLoad - Math.round(80 * (profile.nightOutputPct / 100)));

    if (wokeDuring) {
      const desc = getBedwettingAccidentNarrative('micro', 'during');
      logToOutput(`<span style="color:#fdcb6e;"><b>💧 Small accident — you catch it happening.</b></span>`);
      logToOutput(`<span style="color:#ffeaa7;">${desc}</span>`);
      applyBedwettingAftercare(profile, '#ffeaa7');
      const steps = getBedwettingGuideSteps('micro', 'during', tierKey);
      const guideDesc = ['dry_nights', 'light_bedwetter', 'moderate_bedwetter'].includes(tierKey)
        ? '💧 You catch a small accident starting — try to clench and cut it short.'
        : '💧 A small accident is happening — feel it and let the dribble out.';
      setTimeout(() => startVoidGuide(steps, guideDesc, 'micro'), 400);
    } else {
      const wokeAfter = Math.random() * 100 < profile.wakeAfterAccidentChance;
      const wakeState = wokeAfter ? 'after' : 'sleep';
      const desc = getBedwettingAccidentNarrative('micro', wakeState);
      logToOutput(`<span style="color:#fdcb6e;"><b>💧 Small nighttime accident.</b></span>`);
      logToOutput(`<span style="color:#ffeaa7;">${desc}</span>`);
      if (wokeAfter) applyBedwettingAftercare(profile, '#cdd7e6');
      const steps = getBedwettingGuideSteps('micro', wakeState, tierKey);
      const guideDesc = wokeAfter
        ? '💧 You wake up after a small accident — check yourself and settle back down.'
        : '💧 You find yourself already a little wet — breathe and settle back.';
      setTimeout(() => startVoidGuide(steps, guideDesc, 'micro'), 400);
    }
  } else {
    let satGain = getBedwettingAdjustedSatGain(18, 34, profile.nightOutputPct);
    const wokeDuring = Math.random() * 100 < profile.wakeDuringAccidentChance;
    if (wokeDuring) satGain = Math.max(10, Math.round(satGain * 0.7));
    manualSaturation = Math.min(manualSaturation + satGain, 115);
    updateSaturationUI(manualSaturation);
    checkOverflowSaturation(manualSaturation);
    window._bedwettingHadNightAccident = true;
    window._bedwettingNightLoad = Math.max(0, nightLoad - Math.round(175 * (profile.nightOutputPct / 100)));

    if (wokeDuring) {
      const desc = getBedwettingAccidentNarrative('macro', 'during');
      logToOutput(`<span style="color:#ff7675;"><b>💦 Full accident — you wake while it's happening.</b></span>`);
      logToOutput(`<span style="color:#fab1a0;">${desc}</span>`);
      applyBedwettingAftercare(profile, '#fab1a0');
      const steps = getBedwettingGuideSteps('macro', 'during', tierKey);
      const guideDesc = ['dry_nights', 'light_bedwetter', 'moderate_bedwetter'].includes(tierKey)
        ? '💦 A full accident is starting — try to clench, but let it happen if you cannot hold on.'
        : '💦 A full accident — let it all happen in one heavy wetting.';
      setTimeout(() => startVoidGuide(steps, guideDesc, 'full'), 400);
    } else {
      const wokeAfter = Math.random() * 100 < profile.wakeAfterAccidentChance;
      const wakeState = wokeAfter ? 'after' : 'sleep';
      const desc = getBedwettingAccidentNarrative('macro', wakeState);
      logToOutput(`<span style="color:#ff7675;"><b>💦 Full bedwetting accident.</b></span>`);
      logToOutput(`<span style="color:#fab1a0;">${desc}</span>`);
      if (wokeAfter) applyBedwettingAftercare(profile, '#fab1a0');
      const steps = getBedwettingGuideSteps('macro', wakeState, tierKey);
      const guideDesc = wokeAfter
        ? '💦 You wake up already wet — take stock and decide whether to change.'
        : '💦 You slept through a full wetting and wake up heavily wet.';
      setTimeout(() => startVoidGuide(steps, guideDesc, 'full'), 400);
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
  const fillPct = manualSaturation;
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
      manualSaturation = Math.min(manualSaturation + satGain, 110);
      updateSaturationUI(manualSaturation);
      checkOverflowSaturation(manualSaturation);
      logToOutput(`<span style="color:#fdcb6e;">You slept through a small leak without ever really waking up.</span>`);
    } else if (overnightRoll < overnightAccidentChance) {
      const satGain = getBedwettingAdjustedSatGain(16, 30, profile.nightOutputPct);
      manualSaturation = Math.min(manualSaturation + satGain, 115);
      updateSaturationUI(manualSaturation);
      checkOverflowSaturation(manualSaturation);
      logToOutput(`<span style="color:#ff7675;">You never woke up enough to react. There was a full nighttime accident.</span>`);
    } else {
      logToOutput(`<span style="color:#55efc4;">You made it through the night dry.</span>`);
    }
  } else if (fillPct < 20) {
    logToOutput(`<span style="color:#ffeaa7;">You wake up with just a light dampness from the night's accident.</span>`);
  } else if (fillPct < 65) {
    logToOutput(`<span style="color:#fab1a0;">You wake up noticeably wet and need to check your protection.</span>`);
  } else {
    logToOutput(`<span style="color:#ff7675;">You wake up heavily wet and should clean up right away.</span>`);
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