/* ===========================
   event-builder.js — Event browser/builder + profile details + tutorial
   =========================== */

/* ---------- Inline Void-Overlay Event Browser ---------- */
let voidBrowserState = { events: [], index: 0 };

function toggleVoidBrowser() {
  const panel = $('voidBrowserPanel');
  const btn = $('voidBrowserToggle');
  if (!panel) return;
  const open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if (btn) btn.textContent = open ? '📚 Browse Events ▼' : '📚 Browse Events ▲';
  if (!open) refreshVoidBrowser();
}

function showVoidBrowser() {
  const wrap = $('voidEventBrowser');
  if (!wrap) return;
  wrap.style.display = 'block';
  if ($('vbProfile')) $('vbProfile').value = profileMode || 'babysitter';
  refreshVoidBrowser();
}

function hideVoidBrowser() {
  const wrap = $('voidEventBrowser');
  if (wrap) wrap.style.display = 'none';
}

function refreshVoidBrowser() {
  const profile = $('vbProfile')?.value || profileMode || 'babysitter';
  const type = $('vbType')?.value || 'all';
  const search = (($('vbSearch')?.value || '').trim()).toLowerCase();
  let events = getEventCatalogForProfile(profile);
  if (type !== 'all') events = events.filter(e => e.type === type);
  if (search) events = events.filter(e => (`${e.label} ${e.flow} ${e.source}`.toLowerCase().includes(search)));
  voidBrowserState.events = events;
  voidBrowserState.index = events.length ? clamp(voidBrowserState.index, 0, events.length - 1) : 0;
  renderVoidBrowserCard();
}

function voidBrowserPrev() {
  const n = voidBrowserState.events.length;
  if (!n) return;
  voidBrowserState.index = (voidBrowserState.index - 1 + n) % n;
  renderVoidBrowserCard();
}

function voidBrowserNext() {
  const n = voidBrowserState.events.length;
  if (!n) return;
  voidBrowserState.index = (voidBrowserState.index + 1) % n;
  renderVoidBrowserCard();
}

function renderVoidBrowserCard() {
  const card = $('vbCard');
  if (!card) return;
  const profile = $('vbProfile')?.value || 'babysitter';
  const events = voidBrowserState.events;
  if (!events.length) {
    card.innerHTML = '<span style="color:#666;">No events match filter.</span>';
    return;
  }
  const e = events[voidBrowserState.index];
  const disabled = isEventDisabled(profile, e.id);
  const stepCount = (e.guide || []).length;
  const disBtn = $('vbDisableBtn');
  if (disBtn) {
    disBtn.textContent = disabled ? 'Enable' : 'Disable';
    disBtn.style.background = disabled ? '#55efc4' : '#ff7675';
  }
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
      <span style="color:#74b9ff; font-weight:bold; font-size:13px;">${e.label}</span>
      <span style="color:#666; font-size:11px;">${voidBrowserState.index + 1}/${events.length}</span>
    </div>
    <div style="color:#999; font-size:11px; margin-bottom:4px;">${e.type} · ${e.source} ${disabled ? '· <span style="color:#ff7675;">DISABLED</span>' : ''}</div>
    <div style="color:#cdd7e6; font-size:12px; line-height:1.4; max-height:60px; overflow:hidden;">${e.flow || '<i>No description</i>'}</div>
    ${stepCount ? `<div style="color:#55efc4; font-size:11px; margin-top:4px;">📋 ${stepCount} guide step${stepCount > 1 ? 's' : ''}</div>` : ''}
  `;
}

function voidBrowserTry() {
  const events = voidBrowserState.events;
  if (!events.length) return;
  const e = events[voidBrowserState.index];
  if (!e.guide || !e.guide.length) { toast('No guide steps to preview'); return; }
  isPreviewMode = true;
  isGuideComplete = false;
  startVoidGuide(e.guide, `<b style="color:#a29bfe;">PREVIEW:</b> ${e.label}`, e.type || 'micro');
}

function voidBrowserToggleDisable() {
  const profile = $('vbProfile')?.value || 'babysitter';
  const events = voidBrowserState.events;
  if (!events.length) return;
  const current = events[voidBrowserState.index];
  disabledEventsByProfile[profile] = disabledEventsByProfile[profile] || {};
  if (disabledEventsByProfile[profile][current.id]) {
    delete disabledEventsByProfile[profile][current.id];
  } else {
    disabledEventsByProfile[profile][current.id] = true;
  }
  saveDisabledEvents();
  renderVoidBrowserCard();
  toast('Event toggle saved');
}

/* ---------- Event Builder / Browser ---------- */
function saveDisabledEvents() {
  localStorage.setItem('disabledEventsByProfile', JSON.stringify(disabledEventsByProfile));
}

function saveAppendedEvents() {
  localStorage.setItem('appendedEventsByProfile', JSON.stringify(appendedEventsByProfile));
}

function eventId(source, idx) {
  return `${source}:${idx}`;
}

function isEventDisabled(profile, id) {
  return !!(disabledEventsByProfile?.[profile]?.[id]);
}

function collectTableEvents(profile, source, table, type, out) {
  if (!Array.isArray(table)) return;
  table.forEach((e, idx) => {
    out.push({
      id: eventId(source, idx),
      profile,
      type,
      source,
      idx,
      label: e.label || `${source} #${idx + 1}`,
      flow: e.flow || e.desc || '',
      guide: Array.isArray(e.guide) ? e.guide : [],
      classKey: e.classKey || e.cls || '',
      partial: !!e.partial
    });
  });
}

function getEventCatalogForProfile(profile) {
  const events = [];

  const catalogMap = {
    dependent: [
      ['MICRO_DEPENDENT_D20', MICRO_DEPENDENT_D20, 'micro'],
      ['MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20, 'full']
    ],
    npt: [
      ['MICRO_DIAPER_D8', MICRO_DIAPER_D8, 'micro'],
      ['FULL_D20', FULL_D20, 'full']
    ],
    train_rookie: [
      ['MICRO_TRAINING_D8', MICRO_TRAINING_D8, 'micro'],
      ['FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES, 'full']
    ],
    train_pro: [
      ['MICRO_TRAINING_D8', MICRO_TRAINING_D8, 'micro'],
      ['FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES, 'full']
    ],
    chaos_manual: [
      ['MICRO_STD_D6', MICRO_STD_D6, 'micro'],
      ['FULL_D20', FULL_D20, 'full'],
      ['FULL_TRAINING_FAILURES', FULL_TRAINING_FAILURES, 'full'],
      ['MACRO_DEPENDENT_D20', MACRO_DEPENDENT_D20, 'full']
    ],
    omorashi_hold: [
      ['OMORASHI_HOLDING_GUIDES', OMORASHI_HOLDING_GUIDES, 'micro'],
      ['OMORASHI_GAUNTLETS', OMORASHI_GAUNTLETS, 'full']
    ],
    babysitter: [
      ['MICRO_BABYSITTER_D20', MICRO_BABYSITTER_D20, 'micro'],
      ['BABYSITTER_POTTY_PERMISSION_D10', BABYSITTER_POTTY_PERMISSION_D10, 'permission'],
      ['BABYSITTER_ACCIDENT_D20', BABYSITTER_ACCIDENT_D20, 'full'],
      ['TRANSITION_PAD_TO_PULLUPS_D6', TRANSITION_PAD_TO_PULLUPS_D6, 'transition'],
      ['TRANSITION_PULLUPS_TO_DIAPERS_D6', TRANSITION_PULLUPS_TO_DIAPERS_D6, 'transition'],
      ['TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6', TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6, 'transition'],
      ['TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6', TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6, 'transition'],
      ['TRANSITION_DIAPERS_TO_PULLUPS_D6', TRANSITION_DIAPERS_TO_PULLUPS_D6, 'transition'],
      ['TRANSITION_PULLUPS_TO_PAD_D6', TRANSITION_PULLUPS_TO_PAD_D6, 'transition']
    ]
  };

  const entries = catalogMap[profile] || [];
  entries.forEach(([name, table, kind]) => collectTableEvents(profile, name, table, kind, events));

  // Append user-injected events for this profile
  const extra = appendedEventsByProfile?.[profile] || [];
  extra.forEach((e, idx) => {
    events.push({
      id: eventId('APPENDED_JSON', idx),
      profile,
      type: e.type || 'micro',
      source: 'APPENDED_JSON',
      idx,
      label: e.label || `Custom Event ${idx + 1}`,
      flow: e.flow || e.desc || '',
      guide: Array.isArray(e.guide) ? e.guide : [],
      classKey: e.classKey || '',
      partial: !!e.partial
    });
  });

  return events;
}

function openEventBuilder(profileOverride = null, typeOverride = 'all') {
  const modal = $('eventBuilderBackdrop');
  if (!modal) return;
  if ($('ebProfile')) $('ebProfile').value = profileOverride || profileMode || 'babysitter';
  if ($('ebType')) $('ebType').value = typeOverride || 'all';
  // Populate the Build tab's profile selector to match
  if ($('ebBuildProfile')) $('ebBuildProfile').value = profileOverride || profileMode || 'babysitter';
  eventBuilderState.index = 0;
  refreshEventBuilder();
  modal.style.display = 'block';
  // Initialize tab state — always start on Browse
  switchEbTab('browse');
  // Initialize step list and preview in case user switches to Build tab
  renderEbSteps();
  updateEbPreview();
}

function openEventBuilderForProfile(profile, type = 'all') {
  openEventBuilder(profile, type);
}

/* ---------- Profile Details Panel (More Details on chooser) ---------- */
const PROFILE_DETAILS = {
  dependent: {
    color: '#fab1a0',
    title: '👶 Dependent — Always Leaking',
    rows: [
      ['Mode type', 'Queue-based spasm chain → forced void'],
      ['Potty success', '0% — you never make it to the potty'],
      ['Spasm frequency', '2–6 spasms queued before each void'],
      ['Time between spasms', '8–15 min (customizable in setup)'],
      ['Leak size', 'Escalating micro spurts building to a full void'],
      ['Protection', 'Diapers recommended — you\'re always leaking']
    ],
    loop: 'Your bladder queues up a set number of spasms before each full void. Each spasm fires a micro leak guide. After all spasms are done, you do a full release void. Then the cycle resets. There\'s no potty permission — it\'s all about the draining process. Perfect for dependency and diaper training immersion.'
  },
  npt: {
    color: '#fdcb6e',
    title: '🌙 Not Potty Trained — Background Simulator',
    loop: 'A background simulation where voids happen passively based on saturation threshold. When your saturation hits the limit (~85%), an auto-void event fires. In between you receive hydration reminders. No holds, no permission — just passive wetting detection. Best as a light overlay while doing other things.',
    rows: [
      ['Mode type', 'Passive saturation-threshold auto-void'],
      ['Potty success', '0% — no potty in this mode'],
      ['Auto-void trigger', 'When urgency reaches ~85%'],
      ['Micro events', 'Periodic small drip checks'],
      ['Leak size', 'Full passive voids with no control'],
      ['Protection', 'Diapers or Thick Diapers']
    ]
  },
  train_rookie: {
    color: '#7cc4ff',
    title: '🧒 Rookie — Struggle to Control',
    loop: 'You receive a timed hold challenge every 25–50 minutes. At the moment of truth, a random roll determines if you make it. Rookie has a 60% success rate — you fail often. Failed holds trigger full void guides. Success gives you brief relief but the cycle continues. Great for beginners who want challenge without total loss of control.',
    rows: [
      ['Mode type', 'Timed hold with random success roll'],
      ['Potty success', '~60% with Mercy mode on'],
      ['Hold interval', '25–50 min between events'],
      ['Micro events', 'Pressure spasms between holds'],
      ['Leak size', 'Full void on failure; partial hold on success'],
      ['Protection', 'Pullups or Diapers']
    ]
  },
  train_pro: {
    color: '#55efc4',
    title: '💪 Pro — Retaining Control',
    loop: 'Like Rookie but harder. Events fire every 50–90 minutes and success rate drops to ~35%. You will fail more than you succeed, but gaps between events are long. Pro creates a realistic \"I think I can hold it\" tension that usually ends in a controlled accident. For experienced players who want meaningful stakes.',
    rows: [
      ['Mode type', 'Timed hold with harder random roll'],
      ['Potty success', '~35% base (drops with high pressure)'],
      ['Hold interval', '50–90 min between events'],
      ['Micro events', 'Harder pressure spasms'],
      ['Leak size', 'Full void on failure with longer guide],'],
      ['Protection', 'Diapers recommended']
    ]
  },
  chaos_manual: {
    color: '#ff7675',
    title: '🔥 Chaos — Manual Trigger',
    loop: 'You hold until the very first real physical urgency signal, then click Force Release. The game then rolls a random event from the combined micro+macro+dependent tables — it could be anything from a tiny spurt to a total flood. Unpredictable, high-stakes, and entirely your choice when to trigger. Best for highly immersive solo sessions.',
    rows: [
      ['Mode type', 'Real urgency → manual trigger → random event'],
      ['Potty success', '0% — manual trigger always fires an event'],
      ['Trigger window', 'You decide (must trigger at first real urge)'],
      ['Event pool', 'All tables combined (micro + macro + dependent)'],
      ['Leak size', 'Random — could be tiny or catastrophic'],
      ['Protection', 'Diapers or Thick Diapers']
    ]
  },
  omorashi_hold: {
    color: '#81ecec',
    title: '💧 Omorashi — Hold & Release',
    loop: 'A structured hold challenge with a set session timer (30–90 min). You receive hydration orders and periodic stress tests (hold guides). At the end of the session, or if you fail a stress test, you either get permission or are forced to release. Optional: hold until you physically can\'t, then trigger the release guide yourself. Pure omorashi experience.',
    rows: [
      ['Mode type', 'Timed hold session with stress tests'],
      ['Potty success', '~50% at session end (configurable)'],
      ['Session length', '30–90 min hold timer'],
      ['Stress test frequency', 'Every 8–20 min (configurable)'],
      ['Leak size', 'Full controlled release at end or failure'],
      ['Protection', 'Depends on preference — part of the ritual']
    ]
  },
  babysitter: {
    color: '#a29bfe',
    title: '👩‍🍼 Babysitter — Realistic Holds',
    loop: 'The most complex mode. A babysitter character controls your potty access. Events fire every 30–90 min — each one is either potty permission (with a guide) or an accident (with a void guide). In between, micro events (spasms, leaks) fire 1–5 times per cycle. Your continence level controls how often you succeed. Turn on \"Not Potty Trained\" for higher incontinence levels to skip permission entirely and just auto-void + change.',
    rows: [
      ['Mode type', 'Permission/accident rolls with babysitter narratives'],
      ['Continence controls', 'Fully Continent (90%) → Fully Incontinent (10%)'],
      ['Micro events', '1–6 per cycle depending on continence'],
      ['Not Potty Trained', 'Available for Mostly/Fully Incontinent — auto-voids only'],
      ['Protection changes', 'Automatic based on performance (3 success = upgrade)'],
      ['Extras', 'Symptoms, Curses, Potty Passes, Progression']
    ]
  },
  custom: {
    color: '#e17055',
    title: '🧪 Custom — Create Your Own Profile',
    loop: 'Build a completely custom profile using the editor. Choose between Queue Mode (like Dependent — spasm chain before each void) or Timer Mode (interval-based events). Set your own timings, potty success rate, micro frequency, leak severity, hydration, and protection progression. Export as JSON to share, or import someone else\'s build.',
    rows: [
      ['Mode type', 'Queue-based OR Timer-based (your choice)'],
      ['Potty success', 'You set it (0–100%)'],
      ['Timer windows', 'Fully configurable min/max intervals'],
      ['Leak severity', 'Scalar multiplier (0.5 = light, 2.0 = extreme)'],
      ['Custom events', 'Write your own micro/macro events via GUI builder'],
      ['Import/Export', 'JSON share with others']
    ]
  }
};

function toggleProfileDetails(key) {
  const panel = $('profileDetailsPanel');
  if (!panel) return;
  // Toggle off if same key clicked again
  if (_profileDetailsCurrent === key && panel.style.display !== 'none') {
    panel.style.display = 'none';
    _profileDetailsCurrent = null;
    return;
  }
  _profileDetailsCurrent = key;
  const info = PROFILE_DETAILS[key];
  if (!info) { panel.style.display = 'none'; _profileDetailsCurrent = null; return; }

  const rowHtml = (info.rows || []).map(([k, v]) =>
    `<tr><td style="color:#8ea0b6; font-size:0.8em; padding:4px 8px 4px 0; white-space:nowrap; vertical-align:top;">${k}</td><td style="color:#e7edf5; font-size:0.82em; padding:4px 0 4px 12px; line-height:1.4;">${v}</td></tr>`
  ).join('');

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div style="color:${info.color}; font-weight:bold; font-size:1em;">${info.title}</div>
      <button onclick="toggleProfileDetails('__close__')" style="background:transparent; border:1px solid #2b3348; color:#888; border-radius:6px; padding:3px 8px; cursor:pointer; font-size:12px;">✕</button>
    </div>
    ${rowHtml ? `<table style="width:100%; margin-bottom:12px; border-collapse:collapse;">${rowHtml}</table>` : ''}
    <div style="background:#1b2030; padding:10px 12px; border-radius:8px; border-left:3px solid ${info.color};">
      <div style="color:${info.color}; font-size:0.72em; font-weight:bold; margin-bottom:5px; letter-spacing:0.5px;">GAMEPLAY LOOP</div>
      <div style="color:#cdd7e6; font-size:0.82em; line-height:1.55;">${info.loop}</div>
    </div>
  `;
  panel.style.display = 'block';
  // Scroll panel into view within the modal's scrollable container
  const scrollParent = panel.closest('[style*="overflow-y"]') || panel.parentElement;
  if (scrollParent) {
    const top = panel.offsetTop - scrollParent.offsetTop;
    scrollParent.scrollTo({ top: Math.max(0, top - 12), behavior: 'smooth' });
  }
}

function refreshEventBuilder() {
  const profile = $('ebProfile')?.value || 'babysitter';
  const type = $('ebType')?.value || 'all';
  const search = (($('ebSearch')?.value || '').trim()).toLowerCase();
  let events = getEventCatalogForProfile(profile);

  if (type !== 'all') events = events.filter(e => e.type === type);
  if (search) {
    events = events.filter(e => (`${e.label} ${e.flow} ${e.source}`.toLowerCase().includes(search)));
  }

  eventBuilderState.events = events;
  if (!events.length) {
    eventBuilderState.index = 0;
  } else {
    eventBuilderState.index = clamp(eventBuilderState.index, 0, events.length - 1);
  }
  renderEventBuilderCard();
}

function eventBuilderPrev() {
  const n = eventBuilderState.events.length;
  if (!n) return;
  eventBuilderState.index = (eventBuilderState.index - 1 + n) % n;
  renderEventBuilderCard();
}

function eventBuilderNext() {
  const n = eventBuilderState.events.length;
  if (!n) return;
  eventBuilderState.index = (eventBuilderState.index + 1) % n;
  renderEventBuilderCard();
}

function renderEventBuilderCard() {
  const card = $('ebCard');
  if (!card) return;
  const profile = $('ebProfile')?.value || 'babysitter';
  const events = eventBuilderState.events;
  if (!events.length) {
    card.innerHTML = `<div style="color:#8ea0b6; font-size:13px;">No events matched this filter.</div>`;
    return;
  }

  const e = events[eventBuilderState.index];
  const disabled = isEventDisabled(profile, e.id);
  const stepRows = (e.guide || []).map((s, i) =>
    `<div class="eb-step">${i + 1}. <b>${s.text || 'STEP'}</b> <span style="color:#999">(${s.time || 0}s, ${(s.type || 'stop')})</span></div>`
  ).join('') || '<div class="eb-step" style="color:#777;">No guide steps attached.</div>';

  card.classList.toggle('event-disabled', disabled);
  card.innerHTML = `
    <h3>${e.label}</h3>
    <div class="eb-badges">
      <span class="eb-badge">${eventBuilderState.index + 1} / ${events.length}</span>
      <span class="eb-badge">Type: ${e.type}</span>
      <span class="eb-badge">Source: ${e.source}</span>
      <span class="eb-badge">ID: ${e.id}</span>
      ${disabled ? '<span class="eb-badge" style="color:#ff7675; border-color:#ff7675;">Disabled</span>' : ''}
    </div>
    <div style="font-size:13px; color:#cdd7e6; margin-bottom:10px; min-height:40px;">${e.flow || '<i>No description text</i>'}</div>
    <div class="eb-steps">${stepRows}</div>
    <div class="eb-actions">
      <button onclick="tryCurrentEvent()" style="background:#a29bfe; color:#000; font-weight:bold;">▶ Try Event</button>
      <button onclick="toggleCurrentEventDisabled()" style="background:${disabled ? '#55efc4' : '#ff7675'}; color:#000;">${disabled ? 'Enable Event' : 'Disable Event'}</button>
      <button onclick="cloneCurrentEventToJson()" style="background:#7cc4ff; color:#000;">Copy Event JSON</button>
    </div>
  `;
}

function tryCurrentEvent() {
  const events = eventBuilderState.events;
  if (!events.length) return;
  const e = events[eventBuilderState.index];
  const guide = e.guide || [];
  if (!guide.length) { toast('This event has no guide steps to preview'); return; }
  // Close the event builder modal, run the guide in preview mode, then return
  $('eventBuilderBackdrop').style.display = 'none';
  isPreviewMode = true;
  isGuideComplete = false;
  startVoidGuide(
    guide,
    `<b style="color:#a29bfe;">PREVIEW:</b> ${e.label}`,
    e.type || 'micro'
  );
}

const TUTORIAL_EVENT = {
  label: 'Tutorial: Your First Leak',
  flow: 'A quick tutorial event so you can see exactly how a guide works. Follow the colored steps — each ring shows what to do and for how long. There\'s no wrong answer here.',
  type: 'micro',
  guide: [
    { text: 'BREATHE IN', time: 3, type: 'stop' },
    { text: 'HOLD TIGHT', time: 5, type: 'stop' },
    { text: 'SMALL PUSH', time: 4, type: 'push' },
    { text: 'RELAX...', time: 5, type: 'relax' },
    { text: 'CLENCH', time: 3, type: 'stop' }
  ]
};

function tryTutorialEvent() {
  // Close info modal first
  const infoBackdrop = $('infoModalBackdrop');
  if (infoBackdrop) infoBackdrop.style.display = 'none';
  isPreviewMode = true;
  isGuideComplete = false;
  startVoidGuide(
    TUTORIAL_EVENT.guide,
    `<b style="color:#a29bfe;">📖 TUTORIAL:</b> ${TUTORIAL_EVENT.label}`,
    TUTORIAL_EVENT.type
  );
}



function toggleCurrentEventDisabled() {
  const profile = $('ebProfile')?.value || 'babysitter';
  const events = eventBuilderState.events;
  if (!events.length) return;
  const current = events[eventBuilderState.index];
  disabledEventsByProfile[profile] = disabledEventsByProfile[profile] || {};
  if (disabledEventsByProfile[profile][current.id]) {
    delete disabledEventsByProfile[profile][current.id];
  } else {
    disabledEventsByProfile[profile][current.id] = true;
  }
  saveDisabledEvents();
  renderEventBuilderCard();
  toast('Event toggle saved');
}

function cloneCurrentEventToJson() {
  const events = eventBuilderState.events;
  if (!events.length) return;
  const current = events[eventBuilderState.index];
  const payload = {
    type: current.type,
    label: current.label,
    flow: current.flow,
    guide: current.guide || []
  };
  if ($('ebJsonInput')) {
    $('ebJsonInput').value = JSON.stringify([payload], null, 2);
  }
  toast('Event copied into JSON box');
}

function appendEventsFromBuilderJson() {
  const profile = $('ebProfile')?.value || 'babysitter';
  const raw = ($('ebJsonInput')?.value || '').trim();
  if (!raw) {
    toast('Paste JSON first');
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
    const valid = parsed.filter(e => e && Array.isArray(e.guide));
    if (!valid.length) {
      toast('No valid events found in JSON');
      return;
    }
    appendedEventsByProfile[profile] = appendedEventsByProfile[profile] || [];
    appendedEventsByProfile[profile].push(...valid);
    saveAppendedEvents();
    toast(`Added ${valid.length} events to ${profile}`);
    refreshEventBuilder();
  } catch (err) {
    console.error(err);
    toast('Invalid JSON payload');
  }
}

function clearAppendedEventsForProfile() {
  const profile = $('ebProfile')?.value || 'babysitter';
  delete appendedEventsByProfile[profile];
  saveAppendedEvents();
  toast('Cleared appended JSON events');
  refreshEventBuilder();
}

function resetDisabledEventsForProfile() {
  const profile = $('ebProfile')?.value || 'babysitter';
  delete disabledEventsByProfile[profile];
  saveDisabledEvents();
  toast('Disabled-event list reset');
  refreshEventBuilder();
}

/* ---------- Event Builder Tab Switching + Visual GUI Builder ---------- */
function switchEbTab(tab) {
  ['browse', 'build', 'json'].forEach(t => {
    const pane = $(`ebPane${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn = $(`ebTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const isActive = t === tab;
    if (pane) pane.style.display = isActive ? 'block' : 'none';
    if (btn) {
      btn.style.background = isActive ? '#0f1420' : '#1b2030';
      btn.style.color = isActive ? '#74b9ff' : '#8ea0b6';
      btn.style.borderBottom = isActive ? '2px solid #74b9ff' : '1px solid #2b3348';
      btn.style.fontWeight = isActive ? 'bold' : 'normal';
    }
  });
}

// Visual Event Builder state
let ebGuideSteps = [];

function addEbStep() {
  ebGuideSteps.push({ text: '', time: 3, type: 'stop' });
  renderEbSteps();
  updateEbPreview();
}

function removeEbStep(idx) {
  ebGuideSteps.splice(idx, 1);
  renderEbSteps();
  updateEbPreview();
}

function updateEbStepField(idx, field, value) {
  if (!ebGuideSteps[idx]) return;
  if (field === 'time') {
    ebGuideSteps[idx].time = Math.max(1, parseInt(value, 10) || 1);
  } else {
    ebGuideSteps[idx][field] = value;
  }
  updateEbPreview();
}

const EB_STEP_COLORS = { stop: '#55efc4', push: '#ff7675', relax: '#a29bfe' };
const EB_STEP_LABELS = { stop: '🟢 HOLD/STOP', push: '🔴 PUSH/FORCE', relax: '🟣 RELAX/FLOW' };

function renderEbSteps() {
  const container = $('ebStepsList');
  if (!container) return;
  if (!ebGuideSteps.length) {
    container.innerHTML = '<div style="color:#666; font-size:12px; padding:6px;">No steps yet — click Add Step to begin.</div>';
    return;
  }
  container.innerHTML = ebGuideSteps.map((step, idx) => {
    const col = EB_STEP_COLORS[step.type] || '#888';
    return `<div style="display:grid; grid-template-columns:auto 1fr 80px auto auto; gap:6px; align-items:center; padding:7px 10px; background:#0f1420; border-radius:8px; border-left:3px solid ${col};">
      <span style="color:${col}; font-size:1.1em;">⬛</span>
      <input type="text" value="${(step.text || '').replace(/"/g,'&quot;')}" placeholder="Step label (e.g. HOLD TIGHT)" oninput="updateEbStepField(${idx},'text',this.value)" style="padding:6px 8px; background:#1b2030; border:1px solid #2b3348; color:#fff; border-radius:6px; font-size:13px;">
      <div style="display:flex; align-items:center; gap:4px;">
        <input type="number" value="${step.time}" min="1" max="60" oninput="updateEbStepField(${idx},'time',this.value)" style="width:52px; padding:6px; background:#1b2030; border:1px solid #2b3348; color:#fff; border-radius:6px; font-size:13px;">
        <span style="color:#8ea0b6; font-size:11px;">s</span>
      </div>
      <select onchange="updateEbStepField(${idx},'type',this.value)" style="padding:6px 4px; background:#1b2030; border:1px solid #2b3348; color:${col}; border-radius:6px; font-size:12px;">
        ${['stop','push','relax'].map(t => `<option value="${t}" ${step.type===t?'selected':''}>${EB_STEP_LABELS[t]}</option>`).join('')}
      </select>
      <button onclick="removeEbStep(${idx})" style="background:transparent; border:1px solid #2b3348; color:#ff7675; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:13px;">✕</button>
    </div>`;
  }).join('');
}

function updateEbPreview() {
  const container = $('ebLivePreview');
  if (!container) return;
  const label = $('ebBuildLabel')?.value || 'Untitled Event';
  const flow = $('ebBuildFlow')?.value || '(no description)';
  const colorKey = $('ebBuildColor')?.value || 'micro_small';
  const colorMap = {
    micro_tiny: '#74b9ff', micro_small: '#fdcb6e', micro_big: '#e17055',
    full_heavy: '#ff7675', full_light: '#55efc4'
  };
  const col = colorMap[colorKey] || '#fdcb6e';

  const stepsHtml = ebGuideSteps.length
    ? ebGuideSteps.map((s, i) => {
        const c = EB_STEP_COLORS[s.type] || '#888';
        const isCenter = i === Math.floor(ebGuideSteps.length / 2);
        return `<div style="display:flex; align-items:center; gap:10px; padding:${isCenter ? '12px 16px' : '8px 16px'}; background:${isCenter ? '#1b2030' : '#101622'}; border-radius:8px; border:1px solid ${isCenter ? c : '#2b3348'}; margin-bottom:6px;">
          <div style="width:36px; height:36px; border-radius:50%; background:${c}22; border:2px solid ${c}; display:flex; align-items:center; justify-content:center; color:${c}; font-size:1.1em;">◉</div>
          <div>
            <div style="color:${c}; font-weight:bold; font-size:${isCenter ? '1em' : '0.85em'};">${s.text || 'STEP '+(i+1)}</div>
            <div style="color:#8ea0b6; font-size:0.75em;">${s.time}s · ${(s.type||'stop').toUpperCase()}</div>
          </div>
        </div>`;
      }).join('')
    : `<div style="color:#555; font-size:12px; font-style:italic;">Add guide steps above to preview them here.</div>`;

  container.innerHTML = `
    <div style="border:1px solid ${col}; border-radius:10px; overflow:hidden;">
      <div style="padding:12px 16px; background:${col}22; border-bottom:1px solid ${col}44;">
        <div style="color:${col}; font-weight:bold; font-size:0.95em;">${label}</div>
        <div style="color:#cdd7e6; font-size:0.82em; margin-top:4px; line-height:1.4;">${flow}</div>
      </div>
      <div style="padding:12px 16px; background:#0f1115;">
        <div style="color:#8ea0b6; font-size:0.72em; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">GUIDE STEPS</div>
        ${stepsHtml}
      </div>
    </div>
  `;
}

function clearEbBuilder() {
  ebGuideSteps = [];
  if ($('ebBuildLabel')) $('ebBuildLabel').value = '';
  if ($('ebBuildFlow')) $('ebBuildFlow').value = '';
  renderEbSteps();
  updateEbPreview();
}

function addEbEventToProfile() {
  const label = ($('ebBuildLabel')?.value || '').trim();
  const flow = ($('ebBuildFlow')?.value || '').trim();
  const type = $('ebBuildType')?.value || 'micro';
  const classKey = $('ebBuildColor')?.value || 'micro_small';
  const profile = $('ebBuildProfile')?.value || 'babysitter';

  if (!label) { toast('Add an event label first'); return; }
  if (!ebGuideSteps.length) { toast('Add at least one guide step'); return; }

  const event = { type, label, flow, classKey, guide: ebGuideSteps.map(s => ({ ...s })) };
  appendedEventsByProfile[profile] = appendedEventsByProfile[profile] || [];
  appendedEventsByProfile[profile].push(event);
  saveAppendedEvents();
  toast(`✅ "${label}" added to ${profile}`);
  clearEbBuilder();
  // Switch to browse tab to show the result
  if ($('ebProfile')) $('ebProfile').value = profile;
  if ($('ebType')) $('ebType').value = type;
  switchEbTab('browse');
  refreshEventBuilder();
}

function exportEventBuilderState() {
  const payload = {
    schema: 'abdl-event-builder-state-v1',
    exportedAt: new Date().toISOString(),
    disabledEventsByProfile,
    appendedEventsByProfile
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `event_builder_state_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  toast('Event Builder state exported');
}

function importEventBuilderState() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !data.disabledEventsByProfile || !data.appendedEventsByProfile) {
          throw new Error('Invalid builder state payload');
        }
        disabledEventsByProfile = data.disabledEventsByProfile || {};
        appendedEventsByProfile = data.appendedEventsByProfile || {};
        saveDisabledEvents();
        saveAppendedEvents();
        toast('Event Builder state imported');
        refreshEventBuilder();
      } catch (err) {
        console.error(err);
        toast('Invalid Event Builder state file');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function filterEnabledCatalog(profile, source, table, fallback = null) {
  const mapped = (table || []).map((e, idx) => ({ e, idx, id: eventId(source, idx) }));
  const enabled = mapped.filter(x => !isEventDisabled(profile, x.id));
  // Apply desk mode & involuntary tag filters
  const tagFiltered = enabled.filter(x => {
    if (!deskModeEnabled && !involuntaryFilterEnabled) return true;
    const blocked = [];
    if (deskModeEnabled) blocked.push(...DESK_MODE_BLOCKED_TAGS);
    if (involuntaryFilterEnabled) blocked.push(EVENT_TAG.INVOLUNTARY, EVENT_TAG.REQUIRES_PERSON, EVENT_TAG.REQUIRES_CONTEXT);
    const tags = x.e.tags || [];
    return !tags.some(t => blocked.includes(t));
  });
  if (tagFiltered.length) return tagFiltered;
  if (enabled.length) return enabled;
  return fallback || mapped;
}

/* ---------- Custom Profile System ---------- */

