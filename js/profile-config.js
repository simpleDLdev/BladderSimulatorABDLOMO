/* ===========================
   profile-config.js — Data-driven profile definitions
   
   Each profile is a config object the engine reads instead of
   scattering if/else chains everywhere.  Babysitter keeps its
   own heavy scheduling logic but still uses config for tables/UI.
   =========================== */

const PROFILE_CONFIG = {

  /* ---- STANDARD / DEFAULT ---- */
  early: {
    label: 'Early / Default',
    microTable: () => MICRO_STD_D6,
    microSource: 'MICRO_STD_D6',
    microDie: () => d(6),
    macroTable: () => FULL_D20,
    macroSource: 'FULL_D20',
    mainMin: 30, mainMax: 90,
    microMin: 5, microMax: 15,
    hydrationSips: [2, 5],
    scheduler: 'standard',
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: '💧 Micro-leak logged.',
    leakLimit: null,           // no regression
    setupKey: null,            // no setup modal
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- BABYSITTER ---- */
  babysitter: {
    label: 'Babysitter',
    microTable: () => getMicroTableForContinence(),  // dynamic based on continence
    microSource: 'MICRO_BABYSITTER_D20',
    microDie: () => d(20),
    macroTable: () => FULL_D20,
    macroSource: 'FULL_D20',
    mainMin: 40, mainMax: 60,
    microMin: 5, microMax: 15,
    hydrationSips: [2, 5],
    scheduler: 'babysitter',   // custom scheduling in scheduleMainEvent
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: '💧 Micro-accident logged. Babysitter will check on you later.',
    leakLimit: null,
    setupKey: 'babysitter_setup',
    showHydrationPanel: true,
    showCanIGoBtn: true,
    showBabysitterPanel: true,
  },

  /* ---- DEPENDENT ---- */
  dependent: {
    label: 'Dependent',
    microTable: () => MICRO_DEPENDENT_D20,
    microSource: 'MICRO_DEPENDENT_D20',
    microDie: () => d(20),
    macroTable: () => MACRO_DEPENDENT_D20,
    macroSource: 'MACRO_DEPENDENT_D20',
    mainMin: 8, mainMax: 15,
    microMin: 5, microMax: 15,
    hydrationSips: [4, 8],
    scheduler: 'dependent',    // queue-based micro chain
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: "💧 Micro-leak logged. It's just part of your condition.",
    leakLimit: null,           // already "regressed"
    setupKey: 'dependent_setup',
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- NOT POTTY TRAINED ---- */
  npt: {
    label: 'Not Potty Trained',
    microTable: () => MICRO_DIAPER_D8,
    microSource: 'MICRO_DIAPER_D8',
    microDie: () => randInt(1, 8),
    macroTable: () => FULL_D20,
    macroSource: 'FULL_D20',
    mainMin: 30, mainMax: 90,  // overridden by nptVoidMin/Max at setup
    microMin: 5, microMax: 15,
    hydrationSips: [2, 5],
    scheduler: 'standard',
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: "💧 Micro-leak logged. It's just part of your condition.",
    leakLimit: null,
    setupKey: 'npt_setup',
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- TODDLER (alias for NPT) ---- */
  toddler: {
    label: 'Toddler',
    microTable: () => MICRO_DIAPER_D8,
    microSource: 'MICRO_DIAPER_D8',
    microDie: () => randInt(1, 8),
    macroTable: () => FULL_D20,
    macroSource: 'FULL_D20',
    mainMin: 30, mainMax: 90,
    microMin: 5, microMax: 15,
    hydrationSips: [2, 5],
    scheduler: 'standard',
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: "💧 Micro-leak logged. It's just part of your condition.",
    leakLimit: null,
    setupKey: null,
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- TRAINING: ROOKIE ---- */
  train_rookie: {
    label: 'Training — Rookie',
    microTable: () => MICRO_TRAINING_D8,
    microSource: 'MICRO_TRAINING_D8',
    microDie: () => randInt(1, MICRO_TRAINING_D8.length),
    macroTable: () => FULL_TRAINING_FAILURES,
    macroSource: 'FULL_TRAINING_FAILURES',
    mainMin: 25, mainMax: 50,
    microMin: 4, microMax: 10,
    hydrationSips: [2, 6],
    scheduler: 'standard',
    alarmFn: 'training',       // uses showTrainingChoice instead of generic alarm
    microCompleteMsg: '💧 Micro-leak logged.',
    leakLimit: 5,
    setupKey: 'train_rookie_setup',
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
    preSoak: true,
    preSoakChance: 0.4,
  },

  /* ---- TRAINING: PRO ---- */
  train_pro: {
    label: 'Training — Pro',
    microTable: () => MICRO_TRAINING_D8,
    microSource: 'MICRO_TRAINING_D8',
    microDie: () => randInt(1, MICRO_TRAINING_D8.length),
    macroTable: () => FULL_TRAINING_FAILURES,
    macroSource: 'FULL_TRAINING_FAILURES',
    mainMin: 25, mainMax: 50,
    microMin: 5, microMax: 15,
    hydrationSips: [1, 5],
    scheduler: 'standard',
    alarmFn: 'training',
    microCompleteMsg: '💧 Micro-leak logged.',
    leakLimit: 8,
    setupKey: 'train_pro_setup',
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
    preSoak: true,
    preSoakChance: 0.15,
  },

  /* ---- MATRON WARD ---- */
  matron_ward: {
    label: 'Matron Ward',
    microTable: () => MICRO_WARD_D10,
    microSource: 'MICRO_WARD_D10',
    microDie: () => d(10),
    macroTable: () => typeof MACRO_WARD_D20 !== 'undefined' ? MACRO_WARD_D20 : FULL_D20,
    macroSource: 'MACRO_WARD_D20',
    mainMin: 30, mainMax: 60,
    microMin: 5, microMax: 15,
    hydrationSips: [2, 5],
    scheduler: 'standard',
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: '💧 Micro-leak logged.',
    leakLimit: null,
    setupKey: null,
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- OMORASHI HOLD ---- */
  omorashi_hold: {
    label: 'Omorashi Hold',
    microTable: () => OMORASHI_HOLDING_GUIDES,
    microSource: 'OMORASHI_HOLDING_GUIDES',
    microDie: () => randInt(1, OMORASHI_HOLDING_GUIDES.length),
    macroTable: () => [],
    macroSource: null,
    mainMin: 45, mainMax: 90,
    microMin: 5, microMax: 15,
    hydrationSips: [1, 3],
    scheduler: 'omorashi',     // custom — shows setup modal first
    alarmText: ['⏱️ <b>HOLD CHECK</b>', 'How are you doing?'],
    microCompleteMsg: '💧 Stress test logged.',
    leakLimit: null,
    setupKey: null,
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- CHAOS MANUAL ---- */
  chaos_manual: {
    label: 'Chaos Manual',
    microTable: () => MICRO_STD_D6,
    microSource: 'MICRO_STD_D6',
    microDie: () => d(6),
    macroTable: () => [...FULL_D20, ...FULL_TRAINING_FAILURES, ...(typeof MACRO_DEPENDENT_D20 !== 'undefined' ? MACRO_DEPENDENT_D20 : [])],
    macroSource: 'CHAOS_ALL',
    mainMin: 0, mainMax: 0,   // manual trigger only
    microMin: 5, microMax: 15,
    hydrationSips: [2, 6],
    scheduler: 'chaos',       // no auto timer
    alarmText: ['🔥 <b>CHAOS EVENT</b>', 'The gamble has spoken.'],
    microCompleteMsg: '💧 Micro-leak logged.',
    leakLimit: null,
    setupKey: 'chaos_manual_setup',
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- BIO-ADAPTIVE (experimental) ---- */
  bio_custom: {
    label: 'Bio-Adaptive',
    microTable: () => MICRO_STD_D6,
    microSource: 'MICRO_STD_D6',
    microDie: () => d(6),
    macroTable: () => FULL_D20,
    macroSource: 'FULL_D20',
    mainMin: 30, mainMax: 90,
    microMin: 5, microMax: 15,
    hydrationSips: [2, 5],
    scheduler: 'bio',
    alarmText: ['⚠️ <b>BLADDER SPASM</b>', 'Status uncertain...'],
    microCompleteMsg: '💧 Micro-leak logged.',
    leakLimit: null,
    setupKey: null,
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },

  /* ---- GAUNTLET ONLY (no bladder sim) ---- */
  gauntlet_only: {
    label: 'Gauntlet Only',
    microTable: () => [],
    microSource: null,
    microDie: () => 0,
    macroTable: () => [],
    macroSource: null,
    mainMin: 5, mainMax: 20,          // interval between gauntlets (minutes)
    microMin: 0, microMax: 0,
    hydrationSips: [0, 0],
    scheduler: 'gauntlet',
    alarmText: ['🎯 <b>GAUNTLET INCOMING</b>', 'Prepare yourself...'],
    microCompleteMsg: '',
    leakLimit: null,
    setupKey: 'gauntlet_only',
    showHydrationPanel: false,
    showCanIGoBtn: false,
    showBabysitterPanel: false,
  },
};

/* Helper: get current profile's config, with custom profile runtime overlay */
function getProfileConfig(mode) {
  mode = mode || profileMode;
  const base = PROFILE_CONFIG[mode] || PROFILE_CONFIG.early;
  // Custom profile runtime can override timing fields
  if (customProfileRuntime && customProfileRuntime.baseProfile === mode) {
    return Object.assign({}, base, {
      mainMin: customProfileRuntime.mainMin ?? base.mainMin,
      mainMax: customProfileRuntime.mainMax ?? base.mainMax,
      microMin: customProfileRuntime.microMin ?? base.microMin,
      microMax: customProfileRuntime.microMax ?? base.microMax,
    });
  }
  return base;
}
