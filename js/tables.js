/* ===========================
   tables.js — All event/data tables & constants
   =========================== */

const URGENCY_SCALE = {
  neutral: [
    'No urge whatsoever — bladder feels empty, not thinking about it at all.',
    'Slightest hint of an urge, not enough to distract you from anything.',
    'First clear feeling of an urge. Still comfortable.',
    'A clear urge that lingers whenever you\'re not busy with something interesting.',
    'The urge is starting to become uncomfortable.',
    'Aware of the urge almost constantly. Shifting, squeezing thighs together.',
    'Very aware of the urge. Squirming, fidgeting, maybe crossing legs.',
    'Constant urge to squirm and fidget. Tightly crossed legs. "Gotta pee gotta pee!"',
    'Bursting. You know you can\'t hold much longer. Can\'t sit still, maybe using a hand.',
    'Not wetting yet, but right on the edge. Maybe leaking. Doing everything to hold.',
    'You\'re peeing.'
  ],
  dependent: [
    'Nothing right now. Bladder feels empty. Enjoy the calm while it lasts.',
    'The faintest twinge — barely there, easily ignored.',
    'A gentle nudge. Your bladder is starting to fill but you\'re fine.',
    'A steady, low hum of need. Easy to forget if you\'re distracted.',
    'Getting harder to ignore. The spasm queue is starting to build.',
    'Uncomfortable now. Shifting around, squeezing thighs together instinctively.',
    'Squirming constantly. Your body is reminding you that control is slipping.',
    'Can\'t sit still. Rocking, pressing, desperate little movements. Spasms coming fast.',
    'Spasms building fast. Another void is coming whether you want it or not.',
    'Bladder releasing on its own. Nothing you can do — it\'s happening.',
    'Uh-oh — wetting again. That\'s just how it goes now.'
  ],
  npt: [
    'Nothing happening. Completely empty and relaxed.',
    'The tiniest hint of warmth or fullness — barely registers.',
    'A soft, distant signal. Your body is filling but you\'re not concerned.',
    'Mild background awareness. You notice it if you think about it.',
    'Pressure building. Harder to tune out now.',
    'Constant low-level need. You\'re shifting without thinking about it.',
    'Your body is getting louder. Fidgeting, squeezing, trying to delay the inevitable.',
    'Desperate. Clenching hard, rocking, pressing thighs together. Losing ground fast.',
    'Body is giving up control. A flood is very close.',
    'Barely holding — probably already dribbling. This is the last moment.',
    'Uh-oh… you\'re wetting.'
  ],
  train_rookie: [
    'Totally empty. Ready for your training session.',
    'A tiny signal — so faint it could be nothing.',
    'First real sensation. You can feel the fill starting.',
    'Noticeable now. Your bladder is getting your attention.',
    'The hold is getting real. You\'re starting to feel tested.',
    'Squirming starts here. The urge is constant and annoying.',
    'Very uncomfortable. You\'re second-guessing how long you can last.',
    'Desperate territory. Everything is tight, pressed, and precarious.',
    'On the verge. You\'re gripping hard and praying for the timer.',
    'Leaking! Clench hard — you might save some.',
    'Having an accident! Try to stop the flow if you can.'
  ],
  train_pro: [
    'Bone dry. Nothing to report.',
    'Whisper of an urge. Barely worth noting.',
    'A clear sensation — your training begins now.',
    'Steady pressure. Manageable, but present.',
    'The challenge is setting in. Your focus narrows.',
    'Uncomfortable. Staying still takes effort.',
    'Squirming despite yourself. Each minute feels longer.',
    'Rock solid hold, but the cracks are showing. Every second is work.',
    'Breaking point territory. Muscles trembling with effort.',
    'Right on the edge — one slip and it\'s over.',
    'Lost control entirely.'
  ],
  babysitter_continent: [
    'Nothing at all. Bladder feels empty. Babysitter doesn\'t need to worry.',
    'Tiniest hint. Not even worth mentioning to your sitter.',
    'First gentle nudge. You know it\'s starting but you\'re comfortable.',
    'A clear hum of need. You could ask for potty, but no rush.',
    'Getting noticeable. Starting to think about when babysitter will offer.',
    'Squirming a little. Babysitter might notice if she\'s watching.',
    'Really need to go. Fidgeting, shifting. "Can I go potty?"',
    'Desperate. Babysitter better say yes soon or there\'ll be trouble.',
    'Bursting. Better hope you have permission soon.',
    'Desperately holding. One more minute might be too many.',
    'Having an accident. Babysitter will notice soon.'
  ],
  babysitter_incontinent: [
    'Nothing right now. Padding is still fresh.',
    'The faintest tingle. Probably nothing — probably.',
    'A soft warmth building. You know the pattern by now.',
    'Steady pressure. It won\'t be long before something happens.',
    'Getting uncomfortable. Your body isn\'t great at waiting.',
    'Shifting and leaking a little already. Babysitter gives you a look.',
    'Can\'t stop squirming. Small leaks keep escaping. It\'s only a matter of time.',
    'Desperate but your body isn\'t listening. Leaks are getting bigger.',
    'Flooding is close. Your muscles are giving up the fight.',
    'Basically already wetting. Every clench lets a little more through.',
    'Wetting. Babysitter is already reaching for the changing supplies.'
  ],
  omorashi_hold: [
    'Totally empty. The hold hasn\'t really started yet.',
    'The faintest whisper. You barely notice it.',
    'First real twinge of need. The timer starts now.',
    'Steady pressure that keeps your attention. The hold is real.',
    'Growing uncomfortable. Every sip makes it worse.',
    'Constant, nagging desperation. Crossing legs, pressing thighs.',
    'Very desperate. Squirming non-stop. This is the sweet spot.',
    'Agony. Rocking, bouncing, pressed into yourself. Pure desperation.',
    'Bursting — every second counts now.',
    'At the absolute limit. Leaking between clenches.',
    'It\'s coming out. The hold is over.'
  ],
  chaos_manual: [
    'Empty. Waiting for chaos to begin.',
    'Barely there. A faint trickle of awareness.',
    'Something is building. You can feel the setup.',
    'Present and growing. The chaos factor is kicking in.',
    'Uncomfortable. Random spikes keeping you on edge.',
    'Can\'t predict what\'s next. Shifting, clenching, guessing.',
    'Chaos is in control. You\'re just along for the ride.',
    'Total unpredictability. Every moment could be the tipping point.',
    'Hanging on by a thread. The next spike could finish you.',
    'About to lose it. One more trigger and it\'s over.',
    'Full release.'
  ]
};

const CONTINENCE_PROFILE_META = {
  fully_continent: {
    title: 'Fully Continent',
    inCharacter: 'You have strong bladder control. Holding for long stretches is easy and accidents are rare — even when babysitter teases or delays you.',
    gameplay: 'The most relaxed setting. Leaks only happen at very high pressure or with certain symptoms enabled.',
    recommendedProtection: 'Pads for most sessions.',
    tone: 'calm',
    stats: {
      pottyChancePct: '85–95%',
      microFreq: 'Rare (0–1 per cycle)',
      leakSize: 'Tiny twinges — almost never a real leak',
      accidentRisk: 'Very low',
      loopDesc: 'Long gaps between events. Potty permission is almost always granted. Protection changes are extremely rare. A relaxed, low-intensity experience.'
    }
  },
  mostly_continent: {
    title: 'Mostly Continent',
    inCharacter: 'You can usually hold, but once the urge builds you sometimes have small leaks before making it to the potty.',
    gameplay: 'Balanced pacing with occasional dribbles and close calls. Good for a realistic experience with some tension.',
    recommendedProtection: 'Pads or Pullups.',
    tone: 'watchful',
    stats: {
      pottyChancePct: '70–80%',
      microFreq: 'Occasional (1–2 per cycle)',
      leakSize: 'Small dribbles and spurts',
      accidentRisk: 'Low to Moderate',
      loopDesc: 'Events spaced comfortably. Small dribbles happen between main events. Most potty requests are granted. Accidents are partial and forgiving.'
    }
  },
  somewhat_incontinent: {
    title: 'Somewhat Incontinent',
    inCharacter: 'You leak in spurts when urgency spikes, especially if babysitter makes you wait. Holding is possible but unreliable.',
    gameplay: 'Frequent leak prompts and more babysitter checks. You\'ll be actively managing wetness instead of coasting.',
    recommendedProtection: 'Pullups or Diapers.',
    tone: 'nurturing',
    stats: {
      pottyChancePct: '50–60%',
      microFreq: 'Frequent (2–3 per cycle)',
      leakSize: 'Moderate spurts and streams',
      accidentRisk: 'Moderate to High',
      loopDesc: 'Leaks happen often and produce real saturation. Potty permission is a coin-flip. Protection changes happen semi-regularly.'
    }
  },
  mostly_incontinent: {
    title: 'Mostly Incontinent',
    inCharacter: 'Holding is really difficult. Leaks come often, especially during movement or when babysitter denies you. Potty trips rarely succeed.',
    gameplay: 'High-intensity with frequent leaks and accidents. Protection management becomes a big part of the experience.',
    recommendedProtection: 'Diapers (or Thick Diapers for longer sessions).',
    tone: 'matter-of-fact',
    stats: {
      pottyChancePct: '25–35%',
      microFreq: 'Very frequent (3–5 per cycle)',
      leakSize: 'Heavy spurts, streams, and floods',
      accidentRisk: 'Very high — most cycles end in an accident',
      loopDesc: 'Permission is the exception. Accidents use a harder table with total floods. Turn on "Not Potty Trained" mode for a fully automatic experience — no potty trips, just wetting and changes.'
    }
  },
  fully_incontinent: {
    title: 'Fully Incontinent',
    inCharacter: 'Control is minimal. Wetting happens without warning and your babysitter focuses on keeping you comfortable and changed.',
    gameplay: 'Constant wetting and frequent changes. Best for an intense dependency experience.',
    recommendedProtection: 'Thick Diapers.',
    tone: 'gentle',
    stats: {
      pottyChancePct: '5–10% (effectively 0 with Not Potty Trained on)',
      microFreq: 'Constant (4–6+ per cycle)',
      leakSize: 'Full voids and overflow events',
      accidentRisk: 'Guaranteed every cycle',
      loopDesc: 'No real control exists. With "Not Potty Trained" on, every event is an automatic void — babysitter just changes you. Without it, potty permission is almost always denied. Use Thick Diapers.'
    }
  }
};

const BABYSITTER_CURSES = {
  strict_sitter: { key: 'strict_sitter', name: 'Strict Sitter', pottyChancePenalty: 10 },
  no_free_passes: { key: 'no_free_passes', name: 'No Free Passes', blockPassGain: true },
  slippery_focus: { key: 'slippery_focus', name: 'Slippery Focus', leakScalar: 1.2 },
  hydration_debt: { key: 'hydration_debt', name: 'Hydration Debt', extraSipOrders: true }
};

const BABYSITTER_SYMPTOMS = {
  overactive_bladder: {
    key: 'overactive_bladder',
    name: '💢 Overactive Bladder',
    icon: '💢',
    desc: "Your bladder sends urgent signals even when it's not very full. Spasms can hit at any pressure level, and when they do, it feels like an emergency even if you only drank a sip.",
    effect: "Extra pressure checks mid-cycle. Spasms can trigger accidents even at low pressure (40%+). Micro events hit harder.",
    modifiers: { extraPressureChecks: true, lowPressureSpasms: true, microSeverity: 1.3 }
  },
  stress_incontinence: {
    key: 'stress_incontinence',
    name: '🤧 Stress Incontinence',
    icon: '🤧',
    desc: "Physical actions betray you. Laughing, coughing, sneezing, standing up too fast—any sudden abdominal pressure can squeeze out a leak before you even realize it's happening.",
    effect: "Physical action micros are more frequent and cause bigger leaks. Coughing/laughing/standing events have longer relax phases.",
    modifiers: { physicalTriggerBoost: true, microFrequency: 1.4 }
  },
  urge_incontinence: {
    key: 'urge_incontinence',
    name: '⚡ Urge Incontinence',
    icon: '⚡',
    desc: "When the urge hits, it hits like a wall. You go from 'fine' to 'desperate' in seconds. Once the urge starts, you have very little time to reach the potty before things get messy.",
    effect: "Shorter hold windows after urge onset. Potty chance drops faster with pressure. Failed holds escalate to bigger accidents.",
    modifiers: { urgencyEscalation: true, pottyChancePenalty: 15, accidentSeverity: 1.3 }
  },
  nocturnal_wetter: {
    key: 'nocturnal_wetter',
    name: '🌙 Relaxation Wetter',
    icon: '🌙',
    desc: "The moment you zone out, relax, or get comfortable, your body lets go. Watching a show, reading, or just sitting still can lead to slow, quiet wetting you don't notice until it's too late.",
    effect: "Relaxation-based micros are more common. 'Stealth' leaks happen without obvious triggers. More relax-phase guide steps.",
    modifiers: { relaxationLeaks: true, stealthMicros: true, microFrequency: 1.2 }
  },
  giggle_incontinence: {
    key: 'giggle_incontinence',
    name: '😂 Giggle Incontinence',
    icon: '😂',
    desc: "Babysitter knows exactly how to make you laugh—and every time you do, your bladder empties a little (or a lot). The harder you laugh, the worse the flood.",
    effect: "Laugh-triggered events cause significantly larger leaks. Babysitter tells more jokes/funny things. Giggle events can cascade.",
    modifiers: { giggleSeverity: 2.0, extraGiggleMicros: true }
  },
  pre_void_dribble: {
    key: 'pre_void_dribble',
    name: '💧 Pre-Void Dribbler',
    icon: '💧',
    desc: "When the babysitter finally says you can go, your bladder starts leaking before you reach the potty.",
    effect: "On potty-permission events, there is a chance of a small pre-void dribble prompt before the trip.",
    modifiers: { preVoidDribble: true, pottyDribbleChance: 0.4 }
  }
};

const PROTECTION_CAPACITY = {
  'pad': 25,         // Very light — overflows easily
  'pullups': 50,        // Medium — handles moderate leaks
  'diapers': 80,        // Heavy — handles most accidents
  'thick_diapers': 100  // Maximum — rarely overflows
};

/* --- DAY TRACKER SYSTEM --- */

const MICRO_BABYSITTER_D20 = [
  { label: "Twinge Reminder", desc: "Babysitter says: 'Feel that little twinge? Try to hold it, but relax if it's too much.' Dribble a tiny bit.", classKey: "micro_tiny", guide: [{ text: "FEEL TWINGE", time: 2, type: "relax" }] },
  { label: "Posture Nudge", desc: "Shift your weight like Babysitter asked. The movement causes a small leak.", classKey: "micro_small", guide: [{ text: "SHIFT POSTURE", time: 3, type: "push" }] },
  { label: "Sip Check", desc: "Babysitter reminds you to sip water. The added fluid makes your bladder twitch.", classKey: "micro_tiny", guide: [{ text: "SIP WATER", time: 5, type: "stop" }, { text: "TWITCH HOLD", time: 2, type: "stop" }] },
  { label: "Relax Moment", desc: "Babysitter says: 'Breathe deep and relax your tummy.' A small dribble escapes.", classKey: "micro_small", guide: [{ text: "DEEP BREATH", time: 3, type: "relax" }] },
  { label: "Gravity Pull", desc: "Stand up for a quick stretch. Gravity pulls a tiny spurt out.", classKey: "micro_tiny", tags: ['requires_standing'], guide: [{ text: "STAND STRETCH", time: 2, type: "push" }] },
  { label: "Hold Practice", desc: "Babysitter tests: 'Try to hold tight for 5 seconds.' A spasm makes you leak.", classKey: "micro_small", guide: [{ text: "HOLD TIGHT", time: 5, type: "stop" }, { text: "SPASM LEAK", time: 1, type: "push" }] },
  { label: "Warm Reminder", desc: "Babysitter pats your padding: 'Is it warm yet?' The touch triggers release.", classKey: "micro_tiny", guide: [{ text: "PAT CHECK", time: 2, type: "relax" }] },
  { label: "Laugh Test", desc: "Babysitter tells a joke. Laugh and feel the spasm.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "LAUGH", time: 3, type: "push" }] },
  { label: "Soft Drop", desc: "Babysitter says: 'Soften your muscles.' A tiny chain of dribbles starts.", classKey: "micro_tiny", guide: [{ text: "SOFTEN", time: 4, type: "relax" }] },
  { label: "Urge Whisper", desc: "Babysitter whispers: 'Do you need to go yet?' Your bladder responds with a leak.", classKey: "micro_small", guide: [{ text: "WHISPER URGE", time: 2, type: "push" }] },
  { label: "Message Pause", desc: "Babysitter gets distracted texting. The pause makes you suddenly clench hard.", classKey: "micro_tiny", guide: [{ text: "CLENCH", time: 4, type: "stop" }, { text: "UNWANTED RELEASE", time: 2, type: "relax" }] },
  { label: "Cuddle Sneak", desc: "Babysitter sits close for a hug. The pressure and warmth trigger a spasm.", classKey: "micro_small", tags: ['requires_person'], guide: [{ text: "CUDDLE", time: 3, type: "push" }, { text: "LEAK", time: 2, type: "relax" }] },
  { label: "Toy Tempt", desc: "Babysitter offers a distraction toy. Focusing makes you lose control slightly.", classKey: "micro_small", guide: [{ text: "PLAY DISTRACTED", time: 5, type: "push" }] },
  { label: "Focus Slip", desc: "Babysitter notices you're really focused. 'Don't forget to relax down there.' You relax too much.", classKey: "micro_tiny", guide: [{ text: "RELAX MUSCLES", time: 3, type: "relax" }, { text: "SMALL LEAK", time: 2, type: "relax" }] },
  { label: "Praise Flush", desc: "Babysitter praises you: 'You're doing SO good!' The excitement triggers a spasm.", classKey: "micro_small", guide: [{ text: "FLUSH WITH JOY", time: 3, type: "push" }] },
  { label: "Couch Sink", desc: "You sink deeper into the cushions. The comfort and compression together squeeze out a small leak.", classKey: "micro_tiny", guide: [{ text: "SINK DOWN", time: 4, type: "relax" }] },
  { label: "Wiggle Trigger", desc: "Babysitter says: 'Can you wiggle without leaking?' Of course you can't.", classKey: "micro_small", guide: [{ text: "WIGGLE", time: 3, type: "push" }] },
  { label: "Hum Relax", desc: "Babysitter softly hums something calming. You relax your whole body—including what you shouldn't.", classKey: "micro_tiny", guide: [{ text: "CLOSE EYES", time: 4, type: "relax" }] },
  { label: "Praise Flush", desc: "Babysitter praises you: 'You're doing SO good!' The excitement triggers a spasm.", classKey: "micro_small", guide: [{ text: "FLUSH WITH JOY", time: 3, type: "push" }] },
  { label: "Silent Spasm", desc: "A random internal spasm hits with no warning. Small involuntary release.", classKey: "micro_tiny", guide: [{ text: "BREATHE THROUGH", time: 4, type: "relax" }] }
];

/* --- CONTINENCE-SPECIFIC MICRO TABLES (D10 each) --- */

// Fully Continent: Rare twinges, almost always hold successfully
const MICRO_CONTINENT_D20 = [
  { label: "Tiny Twinge", desc: "A very small urge passes through. You hold easily—barely noticeable.", classKey: "micro_tiny", guide: [{ text: "BRIEF TWINGE", time: 2, type: "stop" }] },
  { label: "Sudden Awareness", desc: "You suddenly become aware of your bladder. The feeling passes quickly.", classKey: "micro_tiny", guide: [{ text: "NOTICE BLADDER", time: 3, type: "stop" }] },
  { label: "Stretch Twinge", desc: "Stretching causes a brief urge. You clench and it's fine.", classKey: "micro_tiny", guide: [{ text: "STRETCH & CLENCH", time: 2, type: "stop" }] },
  { label: "Cough Hold", desc: "A cough puts brief pressure on your bladder. You hold without issue.", classKey: "micro_tiny", guide: [{ text: "COUGH HOLD", time: 2, type: "stop" }] },
  { label: "Deep Breath", desc: "Taking a deep breath reminds you of the pressure. Easy to ignore.", classKey: "micro_tiny", guide: [{ text: "BREATHE & HOLD", time: 3, type: "stop" }] },
  { label: "Position Shift", desc: "Changing positions sends a brief signal. Your muscles respond automatically.", classKey: "micro_tiny", guide: [{ text: "SHIFT & HOLD", time: 2, type: "stop" }] },
  { label: "Mild Wave", desc: "A mild wave of urgency comes and goes. No leaking at all.", classKey: "micro_tiny", guide: [{ text: "WAVE PASSES", time: 3, type: "stop" }] },
  { label: "Water Sound", desc: "You hear running water. A brief urge, but you control it easily.", classKey: "micro_tiny", guide: [{ text: "IGNORE SOUND", time: 3, type: "stop" }] },
  { label: "Cold Shiver", desc: "A shiver makes you clench. No leak—just a brief reminder.", classKey: "micro_tiny", guide: [{ text: "SHIVER & HOLD", time: 2, type: "stop" }] },
  { label: "Laugh Clench", desc: "Something funny makes you laugh. You clench reflexively—all good.", classKey: "micro_tiny", guide: [{ text: "LAUGH & CLENCH", time: 3, type: "stop" }] },
  { label: "Morning Stretch", desc: "A full-body stretch sends a tiny signal from your bladder. Easily dismissed.", classKey: "micro_tiny", guide: [{ text: "STRETCH IT OUT", time: 2, type: "stop" }] },
  { label: "Yawn Reflex", desc: "A big yawn tenses your core for a moment. Your bladder notices but you barely do.", classKey: "micro_tiny", guide: [{ text: "YAWN & HOLD", time: 2, type: "stop" }] },
  { label: "Staircase Bounce", desc: "Walking down stairs jostles your bladder slightly. Not even close to an issue.", classKey: "micro_tiny", guide: [{ text: "STEP DOWN", time: 3, type: "stop" }] },
  { label: "Belt Pressure", desc: "Your waistband presses against your lower abdomen. A faint reminder, nothing more.", classKey: "micro_tiny", guide: [{ text: "ADJUST & IGNORE", time: 2, type: "stop" }] },
  { label: "Drink Sip Awareness", desc: "Taking a sip of your drink makes you briefly think about your bladder. You're fine.", classKey: "micro_tiny", guide: [{ text: "SIP & FORGET", time: 3, type: "stop" }] },
  { label: "Sitting Down Nudge", desc: "Sitting down compresses your abdomen slightly. A tiny ping from your bladder—gone instantly.", classKey: "micro_tiny", guide: [{ text: "SIT & DISMISS", time: 2, type: "stop" }] },
  { label: "Phone Vibration Startle", desc: "Your phone buzzing startles you. A reflexive clench—your bladder is perfectly fine.", classKey: "micro_tiny", guide: [{ text: "STARTLE & HOLD", time: 2, type: "stop" }] },
  { label: "Leaning Forward", desc: "Leaning forward puts mild pressure on your bladder. You sit back and it's gone.", classKey: "micro_tiny", guide: [{ text: "LEAN & ADJUST", time: 2, type: "stop" }] },
  { label: "Temperature Change", desc: "Walking into a cooler room makes your body tense briefly. No bladder issues at all.", classKey: "micro_tiny", guide: [{ text: "ADJUST TO TEMP", time: 3, type: "stop" }] },
  { label: "Background Thought", desc: "A passing thought reminds you that you haven't gone in a while. You're still fully in control.", classKey: "micro_tiny", guide: [{ text: "MENTAL NOTE", time: 2, type: "stop" }] }
];

// Somewhat Incontinent: Frequent twinges, occasional small leaks
const MICRO_SOMEWHAT_INCONTINENT_D20 = [
  { label: "Stress Dribble", desc: "A cough or sneeze presses your bladder. A small dribble escapes before you can stop it.", classKey: "micro_small", guide: [{ text: "COUGH", time: 1, type: "push" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Urgency Spike", desc: "A sudden urgency spike hits. You cross your legs but a tiny leak happens.", classKey: "micro_small", guide: [{ text: "URGENCY", time: 2, type: "push" }, { text: "CROSS LEGS", time: 3, type: "stop" }] },
  { label: "Relaxation Leak", desc: "You relaxed too much watching something. A small warm dribble spreads.", classKey: "micro_small", guide: [{ text: "RELAX TOO MUCH", time: 3, type: "relax" }, { text: "CATCH YOURSELF", time: 2, type: "stop" }] },
  { label: "Standing Spurt", desc: "Standing up quickly sends a spurt into your protection. You quickly clench.", classKey: "micro_small", tags: ['requires_standing'], guide: [{ text: "STAND UP", time: 2, type: "push" }, { text: "CLENCH", time: 2, type: "stop" }] },
  { label: "Focus Slip", desc: "Concentrating on something else, your muscles slip and a little escapes.", classKey: "micro_small", guide: [{ text: "LOSE FOCUS", time: 3, type: "relax" }, { text: "REGAIN CONTROL", time: 2, type: "stop" }] },
  { label: "Giggle Leak", desc: "Something makes you giggle and a spurt comes out. Babysitter notices.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "GIGGLE", time: 2, type: "push" }, { text: "SPURT", time: 2, type: "relax" }] },
  { label: "Cold Trigger", desc: "A cold sensation triggers a leak reflex. Small but noticeable.", classKey: "micro_small", guide: [{ text: "COLD TRIGGER", time: 2, type: "push" }, { text: "LEAK", time: 2, type: "relax" }] },
  { label: "Drink Pressure", desc: "Your recent drinks are catching up. Pressure builds and a dribble slips out.", classKey: "micro_small", guide: [{ text: "PRESSURE BUILD", time: 3, type: "push" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Yawn Release", desc: "A big yawn relaxes everything—including your bladder. Small warm spot.", classKey: "micro_tiny", guide: [{ text: "YAWN", time: 3, type: "relax" }] },
  { label: "Walking Leak", desc: "Each step puts a little pressure on your bladder. Tiny spurts escape with movement.", classKey: "micro_small", tags: ['requires_walking'], guide: [{ text: "WALK", time: 4, type: "push" }] },
  { label: "Bending Over Spurt", desc: "Bending down to pick something up compresses your bladder. A spurt escapes before you straighten.", classKey: "micro_small", tags: ['requires_standing'], guide: [{ text: "BEND DOWN", time: 2, type: "push" }, { text: "SPURT", time: 2, type: "relax" }] },
  { label: "Heavy Bag Dribble", desc: "Lifting something heavy strains your core. A small dribble leaks out from the effort.", classKey: "micro_small", guide: [{ text: "LIFT", time: 2, type: "push" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Sneeze Chain", desc: "Two sneezes in a row—the second one pushes a noticeable dribble into your protection.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "SNEEZE 1", time: 1, type: "push" }, { text: "SNEEZE 2 LEAK", time: 2, type: "relax" }] },
  { label: "Key-in-Lock Urge", desc: "You're almost at the bathroom and the anticipation makes you leak a little early.", classKey: "micro_small", guide: [{ text: "ANTICIPATION", time: 2, type: "push" }, { text: "SMALL LEAK", time: 2, type: "relax" }] },
  { label: "Nervous Spurt", desc: "A sudden anxious moment makes your muscles tighten then release. A tiny wet patch forms.", classKey: "micro_tiny", guide: [{ text: "ANXIETY SPIKE", time: 2, type: "push" }, { text: "SPURT", time: 2, type: "relax" }] },
  { label: "Post-Sip Leak", desc: "Right after swallowing a big gulp of water, your bladder spasms. A dribble slips out.", classKey: "micro_small", guide: [{ text: "GULP", time: 2, type: "push" }, { text: "BLADDER SPASM", time: 2, type: "relax" }] },
  { label: "Running Spurts", desc: "Jogging to catch something makes your bladder bounce. Several tiny spurts escape.", classKey: "micro_small", tags: ['requires_walking'], guide: [{ text: "JOG", time: 3, type: "push" }, { text: "SPURTS", time: 2, type: "relax" }] },
  { label: "Doorbell Startle", desc: "A sudden loud noise makes you jump—and a small leak escapes with the flinch.", classKey: "micro_small", guide: [{ text: "STARTLE", time: 1, type: "push" }, { text: "FLINCH LEAK", time: 2, type: "relax" }] },
  { label: "Full Belly Push", desc: "After eating, your full stomach presses on your bladder. A slow dribble seeps out.", classKey: "micro_small", guide: [{ text: "STOMACH PRESSES", time: 3, type: "push" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Ticklish Leak", desc: "Something brushes against you unexpectedly—a ticklish reflex and a small leak at the same time.", classKey: "micro_tiny", tags: ['involuntary'], guide: [{ text: "TICKLE REFLEX", time: 2, type: "push" }, { text: "TINY LEAK", time: 2, type: "relax" }] }
];

// Mostly Incontinent: Frequent, harder-to-control leaks
const MICRO_MOSTLY_INCONTINENT_D20 = [
  { label: "Constant Dribble", desc: "A steady dribble starts without warning. You can't seem to stop it.", classKey: "micro_small", guide: [{ text: "DRIBBLING", time: 4, type: "relax" }, { text: "TRY TO STOP", time: 3, type: "stop" }] },
  { label: "Spasm Flood", desc: "A spasm hits hard and a significant stream escapes. Babysitter definitely notices.", classKey: "micro_small", guide: [{ text: "SPASM", time: 2, type: "push" }, { text: "STREAM", time: 4, type: "relax" }] },
  { label: "Position Failure", desc: "Any change in position releases a stream. Your muscles just can't hold.", classKey: "micro_small", guide: [{ text: "MOVE", time: 2, type: "push" }, { text: "RELEASE", time: 4, type: "relax" }] },
  { label: "Laugh Flood", desc: "Laughing opens the floodgates. A big warm gush fills your protection.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "LAUGH HARD", time: 2, type: "push" }, { text: "GUSH", time: 4, type: "relax" }] },
  { label: "Relax Failure", desc: "The moment you stop actively holding, everything starts leaking again.", classKey: "micro_small", guide: [{ text: "STOP HOLDING", time: 3, type: "relax" }, { text: "LEAK RESUMES", time: 3, type: "relax" }] },
  { label: "Sneeze Release", desc: "A sneeze completely overwhelms your control. Big spurt fills your padding.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "SNEEZE", time: 1, type: "push" }, { text: "BIG SPURT", time: 4, type: "relax" }] },
  { label: "Warmth Spreading", desc: "You suddenly feel warmth spreading. You didn't even realize you were leaking.", classKey: "micro_small", guide: [{ text: "NOTICE WARMTH", time: 3, type: "relax" }, { text: "STILL GOING", time: 3, type: "relax" }] },
  { label: "Gravity Stream", desc: "Standing releases a stream. Your protection is working overtime.", classKey: "micro_small", tags: ['requires_standing'], guide: [{ text: "STAND", time: 2, type: "push" }, { text: "STREAM DOWN", time: 4, type: "relax" }] },
  { label: "Squeeze Futile", desc: "Babysitter asks you to hold. You squeeze hard but it leaks through anyway.", classKey: "micro_small", guide: [{ text: "SQUEEZE TIGHT", time: 3, type: "stop" }, { text: "LEAKS THROUGH", time: 3, type: "relax" }] },
  { label: "Trickling Away", desc: "A constant trickle you can't control. It just keeps going slowly.", classKey: "micro_small", guide: [{ text: "TRICKLE", time: 5, type: "relax" }] },
  { label: "Cough Cascade", desc: "A coughing fit sends wave after wave out. By the time it stops, your padding is noticeably heavier.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "COUGH FIT", time: 3, type: "push" }, { text: "WAVES", time: 4, type: "relax" }] },
  { label: "Sitting Leak", desc: "Just sitting still, a slow leak starts on its own. Your muscles give up without being prompted.", classKey: "micro_small", guide: [{ text: "JUST SITTING", time: 3, type: "relax" }, { text: "LEAKING", time: 4, type: "relax" }] },
  { label: "Hiccup Burst", desc: "A sudden hiccup catches you off guard. Each one pushes out a little more.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "HICCUP", time: 1, type: "push" }, { text: "BURST OUT", time: 3, type: "relax" }] },
  { label: "Stretch Stream", desc: "Reaching up to stretch compresses your bladder. A stream runs freely for several seconds.", classKey: "micro_small", guide: [{ text: "REACH UP", time: 2, type: "push" }, { text: "STREAM RUNS", time: 4, type: "relax" }] },
  { label: "Walking Gush", desc: "Every few steps send a gush into your protection. Walking is basically leaking now.", classKey: "micro_small", tags: ['requires_walking'], guide: [{ text: "STEP STEP", time: 3, type: "push" }, { text: "GUSH", time: 3, type: "relax" }] },
  { label: "Deep Breath Leak", desc: "Taking a deep breath pushes your diaphragm down on your bladder. A steady leak follows.", classKey: "micro_small", guide: [{ text: "INHALE DEEP", time: 2, type: "push" }, { text: "STEADY LEAK", time: 4, type: "relax" }] },
  { label: "Surprise Spasm", desc: "A random spasm hits with no trigger. Your body just releases on its own schedule now.", classKey: "micro_small", guide: [{ text: "SPASM HITS", time: 2, type: "push" }, { text: "NO STOPPING", time: 4, type: "relax" }] },
  { label: "Bending Flood", desc: "Bending over to grab something floods your protection. The pressure is just too much.", classKey: "micro_small", tags: ['requires_standing'], guide: [{ text: "BEND OVER", time: 2, type: "push" }, { text: "FLOOD", time: 4, type: "relax" }] },
  { label: "Yawn Chain Leak", desc: "A long yawn relaxes your entire pelvic floor. A warm stream follows immediately.", classKey: "micro_small", guide: [{ text: "LONG YAWN", time: 3, type: "relax" }, { text: "WARM STREAM", time: 3, type: "relax" }] },
  { label: "Double Spasm", desc: "Two spasms in quick succession. The first one weakens your hold, the second breaks through entirely.", classKey: "micro_small", guide: [{ text: "SPASM 1", time: 2, type: "push" }, { text: "SPASM 2", time: 2, type: "push" }, { text: "BREAKTHROUGH", time: 3, type: "relax" }] }
];

// Fully Incontinent: No real control, constant wetting
const MICRO_FULLY_INCONTINENT_D20 = [
  { label: "Unaware Wetting", desc: "You didn't even notice it happening. Babysitter checks and finds you soaking.", classKey: "micro_small", guide: [{ text: "WETTING", time: 5, type: "relax" }] },
  { label: "Steady Stream", desc: "A steady stream flows with no effort to stop. This is just how it works now.", classKey: "micro_small", guide: [{ text: "FLOWING", time: 6, type: "relax" }] },
  { label: "Movement Flood", desc: "Every movement pushes more out. Walking, sitting, shifting—all wet.", classKey: "micro_small", guide: [{ text: "MOVE & FLOOD", time: 4, type: "push" }, { text: "KEEP GOING", time: 3, type: "relax" }] },
  { label: "Complete Relax", desc: "Your body doesn't even try to hold anymore. It flows freely.", classKey: "micro_small", guide: [{ text: "FLOWING FREELY", time: 6, type: "relax" }] },
  { label: "Babysitter Finds Out", desc: "Babysitter pats your padding and feels the warmth. 'Already? You literally just got changed.'", classKey: "micro_small", guide: [{ text: "PAT CHECK", time: 2, type: "relax" }, { text: "STILL GOING", time: 4, type: "relax" }] },
  { label: "Passive Release", desc: "Without even trying, your bladder empties a bit more. It's automatic now.", classKey: "micro_small", guide: [{ text: "PASSIVE FLOW", time: 5, type: "relax" }] },
  { label: "Laugh Gush", desc: "A laugh triggers a major gush. Your padding swells noticeably.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "LAUGH", time: 2, type: "push" }, { text: "MAJOR GUSH", time: 5, type: "relax" }] },
  { label: "Sitting Puddle", desc: "After sitting for a while, you realize you've been slowly flooding your protection.", classKey: "micro_small", guide: [{ text: "REALIZE", time: 2, type: "relax" }, { text: "STILL FLOWING", time: 4, type: "relax" }] },
  { label: "Screen Drift", desc: "You zone out staring at the screen. A slow leak happens while your mind wanders—you only notice when the warmth spreads.", classKey: "micro_small", guide: [{ text: "ZONE OUT", time: 4, type: "relax" }, { text: "PASSIVE FLOW", time: 4, type: "relax" }] },
  { label: "Ghost Leak", desc: "No urge. No warning. Your body just goes ahead without you. Nothing to do but feel the warmth spread into your padding.", classKey: "micro_small", guide: [{ text: "RELAX COMPLETELY", time: 5, type: "relax" }] },
  { label: "Breathing Leak", desc: "Every deep breath pushes a little more out. You're wetting just by existing at this point.", classKey: "micro_small", guide: [{ text: "JUST BREATHING", time: 5, type: "relax" }, { text: "MORE FLOWING", time: 3, type: "relax" }] },
  { label: "Sleeping Drip", desc: "You dozed off for a moment. When you wake, warmth has spread everywhere. You were wetting in your sleep.", classKey: "micro_small", guide: [{ text: "DOZE OFF", time: 4, type: "relax" }, { text: "WAKE WET", time: 3, type: "relax" }] },
  { label: "Sneeze Torrent", desc: "A sneeze turns into a torrent. Your bladder treats any abdominal pressure as permission to empty.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "SNEEZE", time: 1, type: "push" }, { text: "TORRENT", time: 5, type: "relax" }] },
  { label: "Comfort Flood", desc: "Babysitter wraps a blanket around you. The cozy warmth relaxes everything—including your bladder.", classKey: "micro_small", guide: [{ text: "FEEL COZY", time: 3, type: "relax" }, { text: "FLOODING", time: 5, type: "relax" }] },
  { label: "Fidget Flow", desc: "Shifting in your seat to get comfortable sends another stream flowing. Babysitter just sighs softly.", classKey: "micro_small", guide: [{ text: "FIDGET", time: 2, type: "push" }, { text: "STREAM", time: 4, type: "relax" }] },
  { label: "Delayed Awareness", desc: "You've been wetting for the last two minutes without knowing. The spreading warmth finally reaches your awareness.", classKey: "micro_small", guide: [{ text: "OBLIVIOUS", time: 5, type: "relax" }, { text: "OH... WARM", time: 3, type: "relax" }] },
  { label: "Eating Release", desc: "Chewing triggers some reflex. You feel warmth spreading with every bite. Babysitter notices your expression.", classKey: "micro_small", guide: [{ text: "CHEW", time: 3, type: "relax" }, { text: "RELEASE", time: 4, type: "relax" }] },
  { label: "Yawn Flood", desc: "Mid-yawn, a full stream starts. Your jaw is still open when you feel the padding swell.", classKey: "micro_small", tags: ['involuntary'], guide: [{ text: "YAWN", time: 2, type: "relax" }, { text: "FULL STREAM", time: 5, type: "relax" }] },
  { label: "Phone Distraction", desc: "Looking at your phone, completely unaware your body is emptying itself. The padding grows heavy underneath you.", classKey: "micro_small", guide: [{ text: "DISTRACTED", time: 5, type: "relax" }, { text: "HEAVY PADDING", time: 3, type: "relax" }] },
  { label: "Background Emptying", desc: "Your bladder is on autopilot. Small, constant releases happen throughout the minute. No single event—just continuous.", classKey: "micro_small", guide: [{ text: "CONTINUOUS FLOW", time: 7, type: "relax" }] }
];

// Map continence levels to their micro tables
function getMicroTableForContinence() {
  switch (currentContinenceLevel) {
    case 'fully_continent': return MICRO_CONTINENT_D20;
    case 'mostly_continent': return MICRO_BABYSITTER_D20; // Original table works well for this
    case 'somewhat_incontinent': return MICRO_SOMEWHAT_INCONTINENT_D20;
    case 'mostly_incontinent': return MICRO_MOSTLY_INCONTINENT_D20;
    case 'fully_incontinent': return MICRO_FULLY_INCONTINENT_D20;
    default: return MICRO_BABYSITTER_D20;
  }
}


/* --- BABYSITTER POTTY PERMISSION TABLE (D10 - When granted potty) --- */
const BABYSITTER_POTTY_PERMISSION_D10 = [
  { label: "Good Permission", flow: "Babysitter says: 'You've been good—go potty now before it's too late.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Quick Check Go", flow: "Babysitter checks your padding: 'Hmm... Okay, go potty—hurry!'", guide: [{ text: "HURRY TO POTTY", time: 0, type: "stop" }] },
  { label: "Sip & Go", flow: "Babysitter reminds: 'Sip some water first, then you can go potty.'", guide: [{ text: "SIP WATER", time: 5, type: "stop" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Stand & Release", flow: "Babysitter instructs: 'Stand up carefully and go to the potty. No accidents!'", guide: [{ text: "STAND SLOW", time: 3, type: "stop" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Hold Reward", flow: "Babysitter praises: 'You held well—permission granted. Empty at the potty.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Gentle Reminder Go", flow: "Babysitter says: 'Time to try the potty like a big kid. Go now.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Breathe Permission", flow: "Babysitter guides: 'Take a deep breath, then head to the potty.'", guide: [{ text: "DEEP BREATH", time: 3, type: "relax" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Earned Break", flow: "Babysitter: 'You've earned it—permission to potty. Don't dawdle.'", guide: [{ text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Sip Challenge Go", flow: "Babysitter: 'One more sip, then potty time.'", guide: [{ text: "SIP WATER", time: 5, type: "stop" }, { text: "GO TO POTTY", time: 0, type: "stop" }] },
  { label: "Quick Go", flow: "Babysitter urges: 'Hurry to the potty—you can make it!'", guide: [{ text: "HURRY TO POTTY", time: 0, type: "stop" }] }
];

/* --- BABYSITTER ACCIDENT TABLE (D20 - When potty denied / accident happens) --- */
const BABYSITTER_ACCIDENT_D20 = [
  { label: "Partial Slip", flow: "Babysitter says: 'Try to hold while running to potty.' But you leak on the way.", partial: true, guide: [{ text: "RUN TO POTTY", time: 5, type: "push" }, { text: "PARTIAL LEAK", time: 3, type: "relax" }, { text: "FINISH IN POTTY", time: 0, type: "stop" }] },
  { label: "Hesitation Leak", flow: "Babysitter: 'Go potty now!' But hesitation causes an accident before you make it.", partial: false, guide: [{ text: "HESITATE", time: 3, type: "stop" }, { text: "ACCIDENT", time: 5, type: "push" }] },
  { label: "Gravity Failure", flow: "Babysitter instructs: 'Stand and go.' But standing pops the cork—a flood happens.", partial: false, guide: [{ text: "STAND UP", time: 2, type: "stop" }, { text: "FLOOD", time: 8, type: "push" }] },
  { label: "Full Oops", flow: "Babysitter sighs: 'You waited too long—accident time.' Let it all go in your protection.", partial: false, guide: [{ text: "OOPS MOMENT", time: 10, type: "relax" }] },
  { label: "Sneeze Flood", flow: "You sneeze suddenly—Babysitter gasps as your protection fills up instantly.", partial: false, tags: ['involuntary'], guide: [{ text: "SNEEZE", time: 1, type: "push" }, { text: "LOSING IT", time: 6, type: "relax" }] },
  { label: "Laugh Accident", flow: "Babysitter told a funny story—and you lost it laughing. Everything is flooding.", partial: false, tags: ['involuntary'], guide: [{ text: "LAUGH HARD", time: 3, type: "push" }, { text: "TOTAL LOSS", time: 7, type: "relax" }] },
  { label: "Cold Shiver", flow: "A shiver runs down your spine—and everything lets go. Babysitter notices immediately.", partial: true, guide: [{ text: "SHIVER", time: 2, type: "push" }, { text: "PARTIAL RELEASE", time: 4, type: "relax" }, { text: "TRY TO STOP", time: 3, type: "stop" }] },
  { label: "Standing Spurt", flow: "You stood up too fast—a big spurt escapes before you can clench.", partial: true, guide: [{ text: "STAND FAST", time: 2, type: "push" }, { text: "SPURT", time: 3, type: "relax" }, { text: "CLENCH HARD", time: 3, type: "stop" }] },
  { label: "Distracted Release", flow: "Babysitter was doing something else—you relaxed too much and let go completely.", partial: false, guide: [{ text: "RELAX TOO MUCH", time: 4, type: "relax" }, { text: "FULL RELEASE", time: 8, type: "relax" }] },
  { label: "Desperate Attempt", flow: "Babysitter denied potty: 'You can hold it.' But you couldn't. The dam breaks.", partial: false, guide: [{ text: "TRY TO HOLD", time: 5, type: "stop" }, { text: "DAM BREAKS", time: 8, type: "relax" }] },
  { label: "Doorway Dribble", flow: "You made it to the bathroom door, but the anticipation triggered a big leak right there.", partial: true, guide: [{ text: "ALMOST THERE", time: 3, type: "push" }, { text: "ANTICIPATION LEAK", time: 4, type: "relax" }, { text: "TRY TO FINISH", time: 3, type: "stop" }] },
  { label: "Tickle Torrent", flow: "Babysitter playfully poked your side. The ticklish reflex made you lose it completely.", partial: false, tags: ['requires_person'], guide: [{ text: "TICKLED", time: 2, type: "push" }, { text: "REFLEX RELEASE", time: 7, type: "relax" }] },
  { label: "Hiccup Cascade", flow: "A sudden bout of hiccups pushes pulses out with each one. Three hiccups and you're soaked.", partial: false, tags: ['involuntary'], guide: [{ text: "HIC", time: 1, type: "push" }, { text: "HIC", time: 1, type: "push" }, { text: "HIC—FLOOD", time: 5, type: "relax" }] },
  { label: "Forgotten Hold", flow: "You got so caught up in a show that you forgot to squeeze. By the time you remembered, it was too late.", partial: false, guide: [{ text: "FORGOT", time: 4, type: "relax" }, { text: "TOO LATE", time: 6, type: "relax" }] },
  { label: "Morning Pressure", flow: "Babysitter was slow getting you to potty after waking. The overnight pressure won.", partial: false, tags: ['requires_context'], guide: [{ text: "WAKING UP", time: 3, type: "push" }, { text: "PRESSURE WINS", time: 7, type: "relax" }] },
  { label: "Sip Too Many", flow: "Babysitter made you drink extra water. Your bladder hit the limit and overflowed.", partial: false, guide: [{ text: "OVER HYDRATED", time: 3, type: "push" }, { text: "OVERFLOW", time: 7, type: "relax" }] },
  { label: "Stretch Disaster", flow: "Babysitter told you to stretch. Reaching up compressed your bladder and it all came out.", partial: false, guide: [{ text: "STRETCH UP", time: 2, type: "push" }, { text: "EVERYTHING OUT", time: 8, type: "relax" }] },
  { label: "Stumble Spill", flow: "You tripped slightly. The jolt was enough to release everything into your protection.", partial: false, tags: ['requires_walking'], guide: [{ text: "STUMBLE", time: 1, type: "push" }, { text: "JOLT RELEASE", time: 6, type: "relax" }] },
  { label: "Waiting Game Lost", flow: "Babysitter said 'just five more minutes.' You didn't make it to minute three.", partial: false, guide: [{ text: "WAIT...", time: 4, type: "stop" }, { text: "CAN'T WAIT", time: 2, type: "push" }, { text: "FLOODING", time: 6, type: "relax" }] },
  { label: "Warm Bath Reflex", flow: "Babysitter ran warm water nearby. The sound and warmth triggered an immediate, complete release.", partial: false, tags: ['requires_context'], guide: [{ text: "HEAR WATER", time: 2, type: "push" }, { text: "REFLEX VOID", time: 8, type: "relax" }] }
];

/* --- CONTINENCE-SPECIFIC ACCIDENT TABLES (used when Not Potty Trained mode is off) --- */
// Somewhat Incontinent: More urgency-based, harder holds
const BABYSITTER_ACCIDENT_SOMEWHAT_D20 = [
  { label: "Urgency Wall", flow: "The urge hits like a wall out of nowhere. You sprint but don't make it—a significant stream goes before you stop it.", partial: true, guide: [{ text: "URGENCY SPIKE", time: 2, type: "push" }, { text: "STREAM OUT", time: 4, type: "relax" }, { text: "CLENCH HARD", time: 4, type: "stop" }] },
  { label: "Focus Break", flow: "You were so focused you forgot to hold. Babysitter looks up and raises an eyebrow.", partial: false, guide: [{ text: "LOSE FOCUS", time: 3, type: "relax" }, { text: "WARM FLOOD", time: 6, type: "push" }] },
  { label: "Laugh Spill", flow: "Babysitter made you laugh hard. A big gush spills before you can stop.", partial: false, tags: ['involuntary'], guide: [{ text: "LAUGH OUT LOUD", time: 3, type: "push" }, { text: "GUSH", time: 5, type: "relax" }] },
  { label: "Cold Floor", flow: "Cold air hits you and your muscles just let go. An involuntary stream runs.", partial: false, guide: [{ text: "COLD HITS", time: 2, type: "push" }, { text: "STREAM", time: 5, type: "relax" }] },
  { label: "Position Spasm", flow: "Changing positions triggered a spasm-release. Warm and immediate.", partial: true, guide: [{ text: "SPASM", time: 2, type: "push" }, { text: "PARTIAL RELEASE", time: 4, type: "relax" }, { text: "CLAMP", time: 3, type: "stop" }] },
  { label: "Too Long Wait", flow: "Babysitter made you wait 30 seconds too long. The urge escalated into a full accident.", partial: false, guide: [{ text: "HOLD IT", time: 5, type: "stop" }, { text: "LOSE IT", time: 7, type: "push" }] },
  { label: "Sneeze Cascade", flow: "Three sneezes in a row—each one pushed more out. Nothing you could do.", partial: false, tags: ['involuntary'], guide: [{ text: "SNEEZE x3", time: 3, type: "push" }, { text: "CASCADE RELEASE", time: 5, type: "relax" }] },
  { label: "Distraction Leak", flow: "You got completely distracted and stopped holding without realizing it.", partial: true, guide: [{ text: "DISTRACTED", time: 4, type: "relax" }, { text: "NOTICE & CLENCH", time: 3, type: "stop" }] },
  { label: "Babysitter Tease", flow: "Babysitter playfully pressed on your tummy: 'Stop squirming!' It triggered an immediate release.", partial: false, tags: ['requires_person'], guide: [{ text: "PRESSED", time: 2, type: "push" }, { text: "IMMEDIATE FLOOD", time: 6, type: "relax" }] },
  { label: "Standing Cascades", flow: "Every time you stood, another wave escaped. Three times in a row. Babysitter sighs.", partial: true, tags: ['requires_standing'], guide: [{ text: "STAND", time: 2, type: "push" }, { text: "WAVE 1", time: 2, type: "relax" }, { text: "WAVE 2", time: 2, type: "relax" }, { text: "CLENCH", time: 3, type: "stop" }] },
  { label: "Staircase Stumble", flow: "Going up stairs, each step jolted your bladder. By the fourth step a warm spurt escaped—you froze mid-climb.", partial: true, tags: ['requires_walking'], guide: [{ text: "STEP JOLT", time: 2, type: "push" }, { text: "SPURT OUT", time: 3, type: "relax" }, { text: "FREEZE & CLENCH", time: 4, type: "stop" }] },
  { label: "Phone Scare", flow: "Babysitter's phone rang suddenly and you jumped. The startle reflex pushed a stream out before you could react.", partial: false, guide: [{ text: "STARTLE", time: 1, type: "push" }, { text: "REFLEX STREAM", time: 5, type: "relax" }, { text: "TOO LATE", time: 3, type: "relax" }] },
  { label: "Yawn Release", flow: "A deep yawn relaxed every muscle—including the ones you needed. A slow leak turned into a full spill.", partial: false, guide: [{ text: "DEEP YAWN", time: 3, type: "relax" }, { text: "SLOW LEAK", time: 4, type: "relax" }, { text: "FULL SPILL", time: 4, type: "push" }] },
  { label: "Cramp Override", flow: "A sudden stomach cramp doubled you over and your bladder released simultaneously. Babysitter rushes over.", partial: false, guide: [{ text: "CRAMP HITS", time: 2, type: "push" }, { text: "DOUBLE OVER", time: 3, type: "relax" }, { text: "BLADDER GIVES", time: 5, type: "relax" }] },
  { label: "Running Water", flow: "Babysitter turned on the faucet nearby. The sound cut through your concentration and you lost it within seconds.", partial: false, guide: [{ text: "HEAR WATER", time: 2, type: "relax" }, { text: "CONCENTRATION BREAKS", time: 3, type: "push" }, { text: "FLOOD", time: 5, type: "relax" }] },
  { label: "Tickle Betrayal", flow: "Babysitter tickled your side playfully. Your abs contracted and everything you were holding back came rushing out.", partial: false, tags: ['requires_person'], guide: [{ text: "TICKLE", time: 2, type: "push" }, { text: "ABS CONTRACT", time: 2, type: "push" }, { text: "RUSH OUT", time: 5, type: "relax" }] },
  { label: "False Alarm Fail", flow: "You thought you only needed to shift positions. Turned out your bladder was counting on those muscles. A gush escaped mid-shift.", partial: true, guide: [{ text: "SHIFT", time: 2, type: "relax" }, { text: "GUSH", time: 4, type: "push" }, { text: "EMERGENCY CLENCH", time: 3, type: "stop" }] },
  { label: "Bending Burst", flow: "You bent down to pick something up and the pressure on your abdomen squeezed out a warm stream. Babysitter noticed the face you made.", partial: true, tags: ['requires_standing'], guide: [{ text: "BEND DOWN", time: 2, type: "push" }, { text: "PRESSURE BURST", time: 4, type: "relax" }, { text: "STRAIGHTEN & HOLD", time: 3, type: "stop" }] },
  { label: "Cough Chain", flow: "One cough turned into three. Each one sprayed more out. By the last cough your padding was noticeably warm.", partial: false, tags: ['involuntary'], guide: [{ text: "COUGH 1", time: 1, type: "push" }, { text: "COUGH 2", time: 1, type: "push" }, { text: "COUGH 3—FLOOD", time: 2, type: "push" }, { text: "WARM PADDING", time: 4, type: "relax" }] },
  { label: "Doorway Urgency", flow: "Walking through the doorway to ask Babysitter for permission—the urgency spiked just from standing. You didn't make it to the words.", partial: false, tags: ['requires_walking'], guide: [{ text: "STAND TO ASK", time: 2, type: "push" }, { text: "URGENCY SPIKES", time: 3, type: "push" }, { text: "LOSE BEFORE ASKING", time: 5, type: "relax" }] }
];

// Mostly Incontinent: Bad control, nearly always floods
const BABYSITTER_ACCIDENT_MOSTLY_D20 = [
  { label: "Total Flood", flow: "Your bladder had enough. With no real ability to hold, a complete release fills your padding in seconds.", partial: false, guide: [{ text: "CAN'T HOLD", time: 2, type: "relax" }, { text: "FLOODING", time: 8, type: "relax" }, { text: "STILL GOING", time: 4, type: "relax" }] },
  { label: "Movement Trigger", flow: "Any movement triggers it. You barely shifted and a full stream ran. Babysitter reaches for the changing supplies.", partial: false, guide: [{ text: "SHIFT", time: 1, type: "push" }, { text: "INSTANT STREAM", time: 6, type: "relax" }, { text: "OVERFLOW", time: 4, type: "relax" }] },
  { label: "Squeeze Failure", flow: "Babysitter asked you to hold. You squeezed as hard as you could. It didn't matter.", partial: false, guide: [{ text: "MAX SQUEEZE", time: 4, type: "stop" }, { text: "LEAKS THROUGH", time: 5, type: "relax" }, { text: "FULL RELEASE", time: 5, type: "relax" }] },
  { label: "Relax Override", flow: "The moment you relaxed even slightly, your bladder overrode your muscles entirely. It just goes.", partial: false, guide: [{ text: "RELAX ATTEMPT", time: 2, type: "relax" }, { text: "OVERRIDE", time: 7, type: "push" }, { text: "FLOW THROUGH", time: 5, type: "relax" }] },
  { label: "Babysitter Gives Up", flow: "Babysitter looks at you, looks at your padding, then just shakes her head. 'Don't even bother trying to hold it.'", partial: false, guide: [{ text: "HEAR THE WORDS", time: 3, type: "relax" }, { text: "STOP TRYING", time: 3, type: "relax" }, { text: "LET IT FLOW", time: 8, type: "relax" }] },
  { label: "Laugh Geyser", flow: "You laughed and essentially became a fountain. Total flooding—Babysitter already has the changing mat out.", partial: false, tags: ['involuntary'], guide: [{ text: "LAUGH HARD", time: 2, type: "push" }, { text: "GEYSER RELEASE", time: 8, type: "relax" }] },
  { label: "Spasm Chain", flow: "Three separate spasms in 10 seconds. By the third, you're completely soaked.", partial: false, guide: [{ text: "SPASM 1", time: 2, type: "push" }, { text: "SPASM 2", time: 2, type: "push" }, { text: "SPASM 3—DONE", time: 3, type: "push" }, { text: "FULLY SOAKED", time: 4, type: "relax" }] },
  { label: "Pressure Blowout", flow: "The pressure had been building so long your muscles just gave out all at once. No warning, no chance.", partial: false, guide: [{ text: "PRESSURE MAXED", time: 2, type: "push" }, { text: "BLOWOUT", time: 10, type: "push" }] },
  { label: "Passive Overflow", flow: "You weren't even doing anything. Your bladder reached capacity and just... overflowed. Babysitter noticed the silence.", partial: false, guide: [{ text: "JUST SITTING", time: 4, type: "relax" }, { text: "OVERFLOW BEGINS", time: 7, type: "relax" }] },
  { label: "Denied & Drenched", flow: "Babysitter denied your request with a smile: 'Not yet.' Three seconds later you proved her wrong.", partial: false, guide: [{ text: "DENIED", time: 3, type: "stop" }, { text: "COULDN'T WAIT", time: 2, type: "push" }, { text: "COMPLETE FLOOD", time: 8, type: "relax" }] },
  { label: "Gravity Dump", flow: "You leaned forward and gravity did the rest. Everything poured out in one heavy rush. Babysitter didn't even look surprised.", partial: false, guide: [{ text: "LEAN FORWARD", time: 2, type: "push" }, { text: "GRAVITY TAKES OVER", time: 6, type: "relax" }, { text: "HEAVY RUSH", time: 5, type: "relax" }] },
  { label: "Hiccup Cascade", flow: "A single hiccup broke what little hold you had. Then another. Then everything let go at once.", partial: false, tags: ['involuntary'], guide: [{ text: "HICCUP", time: 1, type: "push" }, { text: "SECOND HICCUP", time: 1, type: "push" }, { text: "TOTAL RELEASE", time: 8, type: "relax" }] },
  { label: "Warm Surrender", flow: "You felt the warmth start and knew there was no point fighting it. You just sat there as it ran. Babysitter: 'That's okay, sweetie.'", partial: false, guide: [{ text: "WARMTH STARTS", time: 3, type: "relax" }, { text: "GIVE IN", time: 4, type: "relax" }, { text: "FULL FLOOD", time: 7, type: "relax" }] },
  { label: "Stretch Release", flow: "A simple stretch—arms above your head—was all it took. Your core relaxed and everything emptied instantly.", partial: false, guide: [{ text: "STRETCH UP", time: 2, type: "relax" }, { text: "CORE RELEASES", time: 3, type: "push" }, { text: "EMPTYING", time: 8, type: "relax" }] },
  { label: "Sleepy Flood", flow: "You were drowsy and your muscles just stopped working. A slow, heavy flood soaked through without you even realizing until Babysitter tapped your shoulder.", partial: false, guide: [{ text: "EYES DROOP", time: 4, type: "relax" }, { text: "MUSCLES QUIT", time: 3, type: "relax" }, { text: "HEAVY SOAK", time: 7, type: "relax" }] },
  { label: "Sneeze Explosion", flow: "One massive sneeze and your whole body convulsed. The flood was instant and total. Babysitter was already unfolding the mat.", partial: false, tags: ['involuntary'], guide: [{ text: "MASSIVE SNEEZE", time: 1, type: "push" }, { text: "BODY CONVULSE", time: 2, type: "push" }, { text: "INSTANT FLOOD", time: 8, type: "relax" }] },
  { label: "Temperature Shock", flow: "Cold drink hit your hands and your body shivered once. That shiver opened the floodgates completely.", partial: false, guide: [{ text: "COLD SHOCK", time: 1, type: "push" }, { text: "SHIVER", time: 2, type: "push" }, { text: "FLOODGATES OPEN", time: 8, type: "relax" }] },
  { label: "Sitter's Countdown", flow: "Babysitter counted down from five—supposedly to help you relax. By three, you'd already flooded. She just kept counting.", partial: false, guide: [{ text: "FIVE...", time: 2, type: "stop" }, { text: "THREE—GONE", time: 2, type: "push" }, { text: "FLOODING", time: 7, type: "relax" }] },
  { label: "Whisper Trigger", flow: "Babysitter leaned in and whispered: 'Just let go.' Your body obeyed before your brain could object.", partial: false, guide: [{ text: "HEAR WHISPER", time: 3, type: "relax" }, { text: "BODY OBEYS", time: 3, type: "push" }, { text: "COMPLETE FLOOD", time: 7, type: "relax" }] },
  { label: "Double Failure", flow: "You tried to hold, failed, clenched again, and failed again. Two distinct floods one after the other. Babysitter just watched patiently.", partial: false, guide: [{ text: "HOLD ATTEMPT 1", time: 3, type: "stop" }, { text: "FLOOD 1", time: 4, type: "relax" }, { text: "RECLENCH", time: 2, type: "stop" }, { text: "FLOOD 2", time: 5, type: "relax" }] }
];

/* --- NOT POTTY TRAINING (NPT) MODE MACRO TABLES --- */
// Used when Not Potty Trained mode is active for mostly/fully incontinent. No potty trips—just auto-void and change cycles.

const MACRO_NPT_MOSTLY_INCONTINENT_D20 = [
  { label: "Quiet Overflow", flow: "You didn't even try. The warmth spreads slowly—you've completely filled your protection. Babysitter sets down her phone.", autoVoid: true, guide: [{ text: "RELAX EVERYTHING", time: 5, type: "relax" }, { text: "LET IT FLOW", time: 7, type: "relax" }, { text: "STILL GOING", time: 4, type: "relax" }] },
  { label: "Sitter's Check", flow: "Babysitter comes over: 'Let me check you, sweetie.' She pats your padding and nods. 'Yeah, we're doing a change.'", autoVoid: true, guide: [{ text: "PAT CHECK", time: 3, type: "relax" }, { text: "CONFIRMED WET", time: 3, type: "relax" }, { text: "PASSIVE FLOW", time: 6, type: "relax" }] },
  { label: "Movement Flood", flow: "You stood up and everything shifted—a torrent ran out with the movement. Babysitter catches it immediately.", autoVoid: true, tags: ['requires_standing'], guide: [{ text: "STAND UP", time: 2, type: "push" }, { text: "FLOOD RUNS", time: 7, type: "relax" }, { text: "STILL DRAINING", time: 4, type: "relax" }] },
  { label: "Laugh & Let Go", flow: "Babysitter said something funny. You started laughing and that was that—everything came out. She's already reaching for the changing mat.", autoVoid: true, tags: ['involuntary'], guide: [{ text: "LAUGH FREELY", time: 3, type: "push" }, { text: "COMPLETE RELEASE", time: 8, type: "relax" }] },
  { label: "Tummy Pressure", flow: "Babysitter leaned over to check something and accidentally pressed your tummy. That was all it needed.", autoVoid: true, guide: [{ text: "PRESSURE APPLIED", time: 2, type: "push" }, { text: "INSTANT FLOOD", time: 7, type: "relax" }, { text: "OVERFLOW", time: 3, type: "relax" }] },
  { label: "Deep Relax Void", flow: "You were relaxing watching something, and your body just slowly emptied without any signal. You only notice when the warmth reaches the edge.", autoVoid: true, guide: [{ text: "ZONE OUT", time: 5, type: "relax" }, { text: "SLOW EMPTYING", time: 8, type: "relax" }] },
  { label: "Sneeze Cascade", flow: "Two sneezes and it's over. Completely flooded before the second sneeze finished.", autoVoid: true, tags: ['involuntary'], guide: [{ text: "SNEEZE 1", time: 1, type: "push" }, { text: "SNEEZE 2—GONE", time: 1, type: "push" }, { text: "TOTAL FLOOD", time: 8, type: "relax" }] },
  { label: "No Signal Void", flow: "No urge. No warning. You're sitting there and then suddenly realize—you're already soaked. Babysitter is matter-of-fact: 'Time for a change.'", autoVoid: true, guide: [{ text: "REALIZE WETTING", time: 3, type: "relax" }, { text: "STILL FLOWING", time: 6, type: "relax" }] },
  { label: "Squeeze and Stream", flow: "You tried to hold it. You squeezed as hard as you could. A full stream ran anyway. Babysitter gives an understanding look.", autoVoid: true, guide: [{ text: "SQUEEZE TIGHT", time: 4, type: "stop" }, { text: "STREAM THROUGH", time: 6, type: "relax" }, { text: "KEEP FLOWING", time: 4, type: "relax" }] },
  { label: "Held-Then-Gone", flow: "You held for about 20 seconds before your muscles just gave out completely. The flood was total.", autoVoid: true, guide: [{ text: "HOLD", time: 5, type: "stop" }, { text: "MUSCLES GIVE", time: 2, type: "push" }, { text: "COMPLETE FLOOD", time: 8, type: "relax" }] },
  { label: "Yawn Release", flow: "A deep yawn loosened everything. You felt it start mid-yawn and couldn't stop it. Babysitter noticed your expression change.", autoVoid: true, guide: [{ text: "DEEP YAWN", time: 3, type: "relax" }, { text: "MUSCLES LOOSEN", time: 3, type: "relax" }, { text: "STEADY FLOW", time: 7, type: "relax" }] },
  { label: "Cramp Cascade", flow: "A stomach cramp doubled you over and your bladder emptied simultaneously. Babysitter rubbed your back while you finished.", autoVoid: true, guide: [{ text: "CRAMP HITS", time: 2, type: "push" }, { text: "DOUBLE OVER", time: 3, type: "relax" }, { text: "EMPTYING", time: 8, type: "relax" }] },
  { label: "Faucet Sound", flow: "Someone turned on a faucet nearby. The sound bypassed every ounce of control you had. Warm and immediate.", autoVoid: true, guide: [{ text: "HEAR WATER", time: 2, type: "relax" }, { text: "CONTROL BREAKS", time: 2, type: "push" }, { text: "WARM FLOOD", time: 8, type: "relax" }] },
  { label: "Sitting Too Long", flow: "You'd been sitting still for ages. When you finally shifted, weeks of tension released all at once. Babysitter sighed knowingly.", autoVoid: true, guide: [{ text: "FINALLY SHIFT", time: 2, type: "push" }, { text: "TENSION BREAKS", time: 4, type: "relax" }, { text: "FULL VOID", time: 7, type: "relax" }] },
  { label: "Cold Drink Trigger", flow: "A sip of cold water was all it took. The chill hit your body and your bladder responded instantly.", autoVoid: true, guide: [{ text: "SIP", time: 1, type: "relax" }, { text: "CHILL RESPONSE", time: 3, type: "push" }, { text: "INSTANT VOID", time: 8, type: "relax" }] },
  { label: "Gentle Pat Flood", flow: "Babysitter patted your back reassuringly. The gentle rhythm somehow loosened everything. You flooded without a sound.", autoVoid: true, guide: [{ text: "PAT PAT", time: 3, type: "relax" }, { text: "MUSCLES LOOSEN", time: 3, type: "relax" }, { text: "SILENT FLOOD", time: 7, type: "relax" }] },
  { label: "Dream State Void", flow: "You were daydreaming—halfway between awake and asleep. Your body took the opportunity to empty completely. Babysitter: 'Wakey wakey, wet one.'", autoVoid: true, guide: [{ text: "DRIFT OFF", time: 5, type: "relax" }, { text: "BODY EMPTIES", time: 8, type: "relax" }] },
  { label: "Cough Burst", flow: "A sudden cough caught you off guard. The force pushed everything out in one heavy burst. Babysitter already had the mat unfolded.", autoVoid: true, tags: ['involuntary'], guide: [{ text: "COUGH", time: 1, type: "push" }, { text: "BURST OUT", time: 4, type: "push" }, { text: "HEAVY FLOW", time: 7, type: "relax" }] },
  { label: "Slow Surrender", flow: "You felt it starting—a slow trickle you couldn't stop. You gave up and let the trickle become a flood. Babysitter nodded approvingly.", autoVoid: true, guide: [{ text: "TRICKLE STARTS", time: 4, type: "relax" }, { text: "GIVE UP", time: 3, type: "relax" }, { text: "FLOOD", time: 7, type: "relax" }] },
  { label: "Bounce Trigger", flow: "You bounced your leg nervously. Each bounce pushed a little more out until you were completely soaked. Babysitter: 'Settle down—oh, too late.'", autoVoid: true, guide: [{ text: "BOUNCE", time: 2, type: "push" }, { text: "LEAK GROWING", time: 4, type: "relax" }, { text: "SOAKED", time: 6, type: "relax" }] }
];

const MACRO_NPT_FULLY_INCONTINENT_D20 = [
  { label: "Automatic Release", flow: "No conscious effort involved. Your body simply empties itself while you're sitting here. Babysitter's already getting the changing supplies—this is just how it goes now.", autoVoid: true, guide: [{ text: "BODY TAKES OVER", time: 3, type: "relax" }, { text: "FULL VOID", time: 8, type: "relax" }, { text: "STILL GOING", time: 5, type: "relax" }] },
  { label: "Sitting Flood", flow: "The padding swells steadily under you. You've been flooding for the last minute without noticing. Babysitter pats your side: 'There we go—change time.'", autoVoid: true, guide: [{ text: "FLOWING", time: 10, type: "relax" }, { text: "PADDING SWELLS", time: 4, type: "relax" }] },
  { label: "Movement Trigger", flow: "Every movement triggers a new wave. Standing, sitting, rolling—it doesn't matter. Your body treats any position change as permission.", autoVoid: true, guide: [{ text: "MOVE", time: 2, type: "push" }, { text: "WAVE POURS", time: 5, type: "relax" }, { text: "ANOTHER WAVE", time: 5, type: "relax" }] },
  { label: "Zero Warning Void", flow: "Completely without warning or sensation. Babysitter noticed the sounds before you did. 'Okay, let's get you changed sweetie—you went again.'", autoVoid: true, guide: [{ text: "NO SIGNAL", time: 2, type: "relax" }, { text: "JUST POURING", time: 10, type: "relax" }] },
  { label: "Laugh Geyser", flow: "Babysitter made you laugh—and you turned into a fountain. This is actually funny. She's laughing too while getting the mat.", autoVoid: true, guide: [{ text: "LAUGH HARD", time: 3, type: "push" }, { text: "GEYSER", time: 9, type: "relax" }] },
  { label: "Relaxation Void", flow: "You were completely calm—and that calmness meant your bladder just went whenever it felt ready. No resistance, no attempt. Babysitter whispers: 'Good job relaxing.'", autoVoid: true, guide: [{ text: "COMPLETELY CALM", time: 6, type: "relax" }, { text: "FLOWING FREELY", time: 8, type: "relax" }] },
  { label: "Overflow Flood", flow: "Unaware that you were even close to capacity. Now you're overflowing. The padding is absolutely saturated. Babysitter already has everything laid out.", autoVoid: true, guide: [{ text: "OVERFLOW STARTS", time: 3, type: "relax" }, { text: "HEAVY FLOOD", time: 10, type: "relax" }] },
  { label: "Passive Stream", flow: "A steady, passive stream that runs without any muscle input at all. It just flows until it doesn't. Babysitter watches with a gentle look: 'All done?'", autoVoid: true, guide: [{ text: "PASSIVE FLOW", time: 12, type: "relax" }] },
  { label: "Body Decides", flow: "Your body decided it was time. Not you—your body. You're just a passenger. Babysitter: 'See? This is why we use thick ones.'", autoVoid: true, guide: [{ text: "BODY TAKES CONTROL", time: 3, type: "relax" }, { text: "TOTAL RELEASE", time: 10, type: "relax" }] },
  { label: "Complete Soaking", flow: "Head to toe warmth spreads as you completely flood your padding in one long, unstoppable release. Babysitter is already beside you, changing mat in hand.", autoVoid: true, guide: [{ text: "WARMTH SPREADS", time: 3, type: "relax" }, { text: "FULL RELEASE", time: 10, type: "relax" }, { text: "SOAKED THROUGH", time: 2, type: "relax" }] },
  { label: "Breathing Release", flow: "Each breath out lets a little more go. You're not even trying to hold—your body treats exhaling as permission to empty.", autoVoid: true, guide: [{ text: "BREATHE OUT", time: 3, type: "relax" }, { text: "STEADY RELEASE", time: 8, type: "relax" }, { text: "BREATH BY BREATH", time: 4, type: "relax" }] },
  { label: "Conversation Void", flow: "Babysitter was talking to you about something normal. Mid-sentence you realized you'd been flooding the entire time. Neither of you paused.", autoVoid: true, guide: [{ text: "CHATTING", time: 5, type: "relax" }, { text: "REALIZE FLOODING", time: 3, type: "relax" }, { text: "KEEP GOING", time: 6, type: "relax" }] },
  { label: "Snack Time Flood", flow: "Eating a snack—your body was so relaxed and content that it emptied itself without a thought. Babysitter noticed when you shifted.", autoVoid: true, guide: [{ text: "MUNCHING", time: 4, type: "relax" }, { text: "BODY RELAXES", time: 3, type: "relax" }, { text: "EMPTYING", time: 7, type: "relax" }] },
  { label: "Waking Void", flow: "You dozed off for just a moment. When you opened your eyes, you were mid-flood. Babysitter smiled: 'Good nap?'", autoVoid: true, guide: [{ text: "DOZE", time: 5, type: "relax" }, { text: "WAKE MID-FLOOD", time: 4, type: "relax" }, { text: "STILL FLOWING", time: 5, type: "relax" }] },
  { label: "Ambient Release", flow: "Background noise, room temperature, comfort—everything conspired to keep you relaxed. Your bladder took full advantage.", autoVoid: true, guide: [{ text: "AMBIENT COMFORT", time: 6, type: "relax" }, { text: "SLOW POUR", time: 8, type: "relax" }] },
  { label: "Stretch & Soak", flow: "A gentle stretch opened every muscle. The void was immediate and total—you didn't even feel the urge, just the warmth.", autoVoid: true, guide: [{ text: "STRETCH", time: 3, type: "relax" }, { text: "IMMEDIATE VOID", time: 8, type: "relax" }, { text: "WARM SOAK", time: 3, type: "relax" }] },
  { label: "Blanket Comfort", flow: "Wrapped in a cozy blanket, your body decided it was safe enough to let everything go. Total comfort, total void.", autoVoid: true, guide: [{ text: "COZY UP", time: 4, type: "relax" }, { text: "SAFETY SIGNAL", time: 3, type: "relax" }, { text: "FULL EMPTY", time: 8, type: "relax" }] },
  { label: "Hiccup Void", flow: "A tiny hiccup—barely noticeable. But it was enough. Your body opened up and everything poured out effortlessly.", autoVoid: true, guide: [{ text: "HICCUP", time: 1, type: "push" }, { text: "OPEN UP", time: 3, type: "relax" }, { text: "POUR", time: 9, type: "relax" }] },
  { label: "Song Trigger", flow: "Babysitter hummed a lullaby. The soothing sound relaxed you so deeply that your body voided on its own. She kept humming through the change.", autoVoid: true, guide: [{ text: "LULLABY", time: 5, type: "relax" }, { text: "DEEP RELAX", time: 4, type: "relax" }, { text: "AUTO VOID", time: 6, type: "relax" }] },
  { label: "Gravity Void", flow: "Just sitting normally. Gravity did the work—a slow, steady drain that you were completely unaware of until Babysitter checked.", autoVoid: true, guide: [{ text: "JUST SITTING", time: 4, type: "relax" }, { text: "GRAVITY DRAINS", time: 8, type: "relax" }, { text: "CHECK FINDS WET", time: 2, type: "relax" }] }
];

/* --- PROTECTION TRANSITION EVENTS (D6 Tables) --- */
// DOWNGRADE: Pad → Pullups
const TRANSITION_PAD_TO_PULLUPS_D6 = [
  { label: "Gentle Change", desc: "Babysitter pulls off your wet pad. 'Oh sweetie, this is soaked. Let's get you in pullups—they'll keep you safer.'", guide: [{ text: "PEEL OFF WET PAD", time: 4, type: "relax" }, { text: "FEEL THE AIR", time: 3, type: "relax" }, { text: "STEP INTO PULLUPS", time: 5, type: "push" }, { text: "SECURE & COMFORTABLE", time: 2, type: "relax" }] },
  { label: "Scolding Change", desc: "Babysitter frowns at your padding. 'A pad isn't cutting it anymore, little one. Into pullups where you belong.'", guide: [{ text: "ACCEPT SCOLDING", time: 3, type: "relax" }, { text: "REMOVE OLD PAD", time: 3, type: "push" }, { text: "PULL ON PULLUPS", time: 4, type: "stop" }, { text: "BABYSITTER FASTENS", time: 3, type: "relax" }] },
  { label: "Practicality Change", desc: "Babysitter says: 'That pad is done for. Let's use pullups—much more practical for you at this point.'", guide: [{ text: "ACKNOWLEDGE", time: 2, type: "relax" }, { text: "STRIP OFF PAD", time: 4, type: "push" }, { text: "STEP INTO PULLUPS", time: 5, type: "stop" }, { text: "ADJUST WAISTBAND", time: 2, type: "relax" }] },
  { label: "Caring Change", desc: "Babysitter pats your leg kindly. 'Don't worry, sweetie—pullups are just the next step. You're still my good boy/girl.'", guide: [{ text: "GET PAT OF COMFORT", time: 3, type: "relax" }, { text: "REMOVE PAD", time: 3, type: "push" }, { text: "PUT ON PULLUPS", time: 4, type: "relax" }, { text: "BABYSITTER CHECKS FIT", time: 3, type: "relax" }] },
  { label: "Efficient Change", desc: "Babysitter works quickly. 'Right, let's swap these out. Pullups will be much better at this point.'", guide: [{ text: "STAY STILL", time: 2, type: "stop" }, { text: "PEEL OFF", time: 3, type: "push" }, { text: "SLIDE INTO PULLUPS", time: 5, type: "stop" }, { text: "TIDY UP", time: 2, type: "relax" }] },
  { label: "Disappointed Change", desc: "Babysitter sighs. 'I hoped the pad would work, but you need more protection now. Let's try pullups.'", guide: [{ text: "LISTEN TO SIGH", time: 2, type: "relax" }, { text: "REMOVE WET PAD", time: 4, type: "push" }, { text: "ACCEPT PULLUPS", time: 4, type: "relax" }, { text: "FEEL SNUG FIT", time: 3, type: "relax" }] }
];

// DOWNGRADE: Pullups → Diapers
const TRANSITION_PULLUPS_TO_DIAPERS_D6 = [
  { label: "Concerned Change", desc: "Babysitter gently removes your pullups. 'Sweetie, even these aren't enough. Let's get you into diapers for safety.'", guide: [{ text: "UNDERSTAND CONCERN", time: 3, type: "relax" }, { text: "PULL DOWN PULLUPS", time: 4, type: "push" }, { text: "LIE DOWN FOR DIAPER", time: 5, type: "relax" }, { text: "BABYSITTER SECURES TAPES", time: 4, type: "relax" }] },
  { label: "No Choice Change", desc: "Babysitter says firmly: 'Pullups didn't work out. Into diapers now. This is what's best for you.'", guide: [{ text: "ACCEPT REALITY", time: 3, type: "relax" }, { text: "REMOVE PULLUPS", time: 3, type: "push" }, { text: "LAY ON CHANGING PAD", time: 4, type: "relax" }, { text: "DIAPER GOES ON", time: 5, type: "relax" }] },
  { label: "Mothering Change", desc: "Babysitter coos softly: 'It's okay, honey. Diapers are right for you—let Babysitter take care of you properly.'", guide: [{ text: "HEAR GENTLENESS", time: 3, type: "relax" }, { text: "LET GO OF PULLUPS", time: 3, type: "push" }, { text: "GET ON CHANGING TABLE", time: 4, type: "relax" }, { text: "FULL DIAPER SECURED", time: 5, type: "relax" }] },
  { label: "Practical Switch", desc: "Babysitter matter-of-factly changes you. 'You need the absorbency. Diapers it is from now on.'", guide: [{ text: "STAY CALM", time: 2, type: "relax" }, { text: "REMOVE PULLUPS", time: 3, type: "push" }, { text: "POSITION FOR CHANGE", time: 4, type: "relax" }, { text: "HEAVY DIAPER APPLIED", time: 5, type: "relax" }] },
  { label: "Proud Change", desc: "Babysitter smiles: 'You're doing great accepting your needs. Into diapers—the responsible choice.'", guide: [{ text: "ACCEPT PRAISE", time: 3, type: "relax" }, { text: "SLIP OFF PULLUPS", time: 3, type: "push" }, { text: "READY YOURSELF", time: 4, type: "relax" }, { text: "DIAPER FULLY ON", time: 5, type: "relax" }] },
  { label: "Resigned Change", desc: "Babysitter with understanding: 'Don't be sad, sweetie. Diapers mean Babysitter will take extra good care of you.'", guide: [{ text: "FEEL UNDERSTOOD", time: 3, type: "relax" }, { text: "OUT WITH PULLUPS", time: 3, type: "push" }, { text: "SURRENDER TO CHANGE", time: 4, type: "relax" }, { text: "SECURED IN DIAPER", time: 5, type: "relax" }] }
];

// DOWNGRADE: Diapers → Thick Diapers
const TRANSITION_DIAPERS_TO_THICK_DIAPERS_D6 = [
  { label: "Final Step", desc: "Babysitter removes your diaper decisively. 'Regular diapers aren't working anymore. It's time for nighttime thick ones—the most protection for you.'", guide: [{ text: "ACCEPT FINALITY", time: 3, type: "relax" }, { text: "DIAPER COMES OFF", time: 3, type: "push" }, { text: "FEEL EXPOSED", time: 2, type: "relax" }, { text: "THICK DIAPER APPLIED", time: 6, type: "relax" }, { text: "BULKY BUT SAFE", time: 3, type: "relax" }] },
  { label: "Tender Care", desc: "Babysitter gently changes you with care. 'Oh sweetie, you need the thickest ones now. Let me make sure you're completely protected.'", guide: [{ text: "TRUST BABYSITTER", time: 3, type: "relax" }, { text: "REGULAR DIAPER OFF", time: 3, type: "push" }, { text: "POWDER APPLIED", time: 3, type: "relax" }, { text: "THICK DIAPER READY", time: 5, type: "relax" }, { text: "EVERYTHING SECURED", time: 3, type: "relax" }] },
  { label: "No More Accidents", desc: "Babysitter says seriously: 'These thicker ones will keep you safely padded all day. No more leaks, no more worry.'", guide: [{ text: "UNDERSTAND NECESSITY", time: 2, type: "relax" }, { text: "DIAPER PULLED DOWN", time: 3, type: "push" }, { text: "CLEAN UP", time: 3, type: "relax" }, { text: "THICK DIAPER FITTED", time: 6, type: "relax" }, { text: "COMPLETELY PROTECTED", time: 2, type: "relax" }] },
  { label: "Proud Sitter", desc: "Babysitter beams: 'You're being so brave accepting the thick ones. Babysitter is so proud of you.'", guide: [{ text: "BLUSH AT PRAISE", time: 3, type: "relax" }, { text: "REMOVE OLD DIAPER", time: 3, type: "push" }, { text: "READY FOR UPGRADE", time: 3, type: "relax" }, { text: "THICK DIAPER GOES ON", time: 6, type: "relax" }, { text: "FEEL CARED FOR", time: 3, type: "relax" }] },
  { label: "Knowing Best", desc: "Babysitter matter-of-factly works: 'These thicks are what you need now. Trust Babysitter to know what's right.'", guide: [{ text: "SURRENDER CONTROL", time: 2, type: "relax" }, { text: "DIAPER REMOVAL", time: 3, type: "push" }, { text: "MOMENT OF CARE", time: 3, type: "relax" }, { text: "THICK PROTECTION APPLIED", time: 6, type: "relax" }, { text: "FULLY SECURE", time: 2, type: "relax" }] },
  { label: "Forever Care", desc: "Babysitter whispers: 'These will be your new normal, sweetie. Babysitter will always keep you safe and clean.'", guide: [{ text: "HEAR PROMISE", time: 3, type: "relax" }, { text: "OFF WITH OLD", time: 3, type: "push" }, { text: "BABYSITTER WORKS", time: 4, type: "relax" }, { text: "THICK DIAPER SECURE", time: 6, type: "relax" }, { text: "HELD SAFELY", time: 3, type: "relax" }] }
];

// UPGRADE: Thick Diapers → Diapers
const TRANSITION_THICK_DIAPERS_TO_DIAPERS_D6 = [
  { label: "Progress Milestone", desc: "Babysitter celebrates: 'Look at you! You've been doing so good—let's try regular diapers again. I'm so proud!'", guide: [{ text: "ACCEPT PRAISE", time: 3, type: "relax" }, { text: "THICK DIAPER OFF", time: 3, type: "push" }, { text: "FEEL LIGHTER", time: 3, type: "relax" }, { text: "REGULAR DIAPER APPLIED", time: 5, type: "relax" }, { text: "MORE FREEDOM", time: 2, type: "relax" }] },
  { label: "Earned Achievement", desc: "Babysitter smiles warmly: 'You've earned this! Switching you back to regular diapers—you're doing such a good job.'", guide: [{ text: "FEEL ACHIEVEMENT", time: 3, type: "relax" }, { text: "THICKS COME OFF", time: 3, type: "push" }, { text: "CLEAN AND FRESH", time: 3, type: "relax" }, { text: "REGULAR DIAPER ON", time: 5, type: "relax" }, { text: "PROUD MOMENT", time: 2, type: "relax" }] },
  { label: "Happy Change", desc: "Babysitter gently removes the thick ones: 'You're ready for a step up, sweetie. Back to regular diapers you go!'", guide: [{ text: "SMILE AT NEWS", time: 3, type: "relax" }, { text: "THICK DIAPER REMOVED", time: 3, type: "push" }, { text: "GENTLE CLEANUP", time: 3, type: "relax" }, { text: "REGULAR DIAPER FITTED", time: 5, type: "relax" }, { text: "PROGRESS FELT", time: 2, type: "relax" }] },
  { label: "Confident Step", desc: "Babysitter says reassuringly: 'Regular diapers again—but Babysitter's still here if you need the thick ones.'", guide: [{ text: "FEEL SECURE", time: 3, type: "relax" }, { text: "THICKS OFF", time: 3, type: "push" }, { text: "REASSURANCE GIVEN", time: 3, type: "relax" }, { text: "REGULAR DIAPER SECURED", time: 5, type: "relax" }, { text: "READY TO TRY", time: 2, type: "relax" }] },
  { label: "Quick Reward", desc: "Babysitter swiftly changes you with a wink: 'Look at you progressing! Back to regular diapers, champ!'", guide: [{ text: "FEEL CELEBRATED", time: 2, type: "relax" }, { text: "THICK DIAPER SWAP", time: 3, type: "push" }, { text: "QUICK CHANGE", time: 3, type: "relax" }, { text: "REGULAR DIAPER READY", time: 4, type: "relax" }, { text: "ALL SET", time: 2, type: "relax" }] },
  { label: "Tender Pride", desc: "Babysitter whispers proudly while changing you: 'You're growing up so well. Regular diapers now—but Babysitter's always watching.'", guide: [{ text: "HEAR PRIDE", time: 3, type: "relax" }, { text: "REMOVE THICKS", time: 3, type: "push" }, { text: "CARE AND ATTENTION", time: 3, type: "relax" }, { text: "REGULAR DIAPER APPLIED", time: 5, type: "relax" }, { text: "GENTLY MONITORED", time: 2, type: "relax" }] }
];

// UPGRADE: Diapers → Pullups
const TRANSITION_DIAPERS_TO_PULLUPS_D6 = [
  { label: "Trust Test", desc: "Babysitter smiles encouragingly: 'I think you're ready to try pullups again. Show me you can handle it, okay?'", guide: [{ text: "FEEL ENCOURAGED", time: 3, type: "relax" }, { text: "DIAPER COMES OFF", time: 3, type: "push" }, { text: "FRESH START", time: 2, type: "relax" }, { text: "PULLUPS ON", time: 4, type: "relax" }, { text: "READY TO PROVE IT", time: 2, type: "relax" }] },
  { label: "Earned Upgrade", desc: "Babysitter claps her hands: 'You've been doing so well! Pull-ups again—I believe in you, sweetie!'", guide: [{ text: "FEEL PROUD", time: 3, type: "relax" }, { text: "DIAPER OFF CAREFULLY", time: 3, type: "push" }, { text: "FINAL CHECK", time: 2, type: "relax" }, { text: "PULLUPS FITTED", time: 4, type: "relax" }, { text: "CONFIDENCE BOOST", time: 2, type: "relax" }] },
  { label: "Hopeful Change", desc: "Babysitter removes your diaper hopefully: 'Let's see if pullups work better for you now. You've got this!'", guide: [{ text: "FEEL HOPE", time: 3, type: "relax" }, { text: "DIAPER PEELED OFF", time: 3, type: "push" }, { text: "LIGHTER FEELINGS", time: 2, type: "relax" }, { text: "PULLUPS READY", time: 4, type: "relax" }, { text: "NEW CHANCE", time: 2, type: "relax" }] },
  { label: "Cautious Upgrade", desc: "Babysitter carefully changes you: 'Back to pull-ups, but if you slip up, that's okay—diapers are always here for you.'", guide: [{ text: "HEAR REASSURANCE", time: 3, type: "relax" }, { text: "DIAPER REMOVAL", time: 3, type: "push" }, { text: "SAFETY NET REMINDER", time: 2, type: "relax" }, { text: "PULLUPS APPLIED", time: 4, type: "relax" }, { text: "SUPPORTED ATTEMPT", time: 2, type: "relax" }] },
  { label: "Big Step", desc: "Babysitter declares: 'You've earned this step back. Pullups again—make Babysitter proud!'", guide: [{ text: "ACCEPT RESPONSIBILITY", time: 3, type: "relax" }, { text: "DIAPER SWITCHED OUT", time: 3, type: "push" }, { text: "MOMENT OF TRUTH", time: 2, type: "relax" }, { text: "PULLUPS SECURED", time: 4, type: "relax" }, { text: "DETERMINED FEELING", time: 2, type: "relax" }] },
  { label: "Joyful Change", desc: "Babysitter beams while changing you: 'I'm so happy! Back to pullups—you're such a good boy/girl for trying so hard!'", guide: [{ text: "FEEL JOY", time: 3, type: "relax" }, { text: "DIAPER REMOVED LOVINGLY", time: 3, type: "push" }, { text: "PRAISED FOR EFFORT", time: 2, type: "relax" }, { text: "PULLUPS PUT ON", time: 4, type: "relax" }, { text: "LOVED AND SUPPORTED", time: 2, type: "relax" }] }
];

// UPGRADE: Pullups → Pad
const TRANSITION_PULLUPS_TO_PAD_D6 = [
  { label: "Big Boy/Girl", desc: "Babysitter beams with pride: 'You did it! Back to just a pad—you've become such a big boy/girl. I'm so proud!'", guide: [{ text: "FEEL PRIDE", time: 3, type: "relax" }, { text: "PULLUPS REMOVED", time: 3, type: "push" }, { text: "FREEDOM MOMENT", time: 2, type: "relax" }, { text: "PAD APPLIED", time: 3, type: "relax" }, { text: "CELEBRATED", time: 2, type: "relax" }] },
  { label: "Victory Moment", desc: "Babysitter removes the pullups excitedly: 'Look at you! Back to a pad—what a champion you are!'", guide: [{ text: "HEAR CELEBRATION", time: 3, type: "relax" }, { text: "PULLUPS COME OFF", time: 3, type: "push" }, { text: "ALMOST GROWN UP", time: 2, type: "relax" }, { text: "PAD READY", time: 3, type: "relax" }, { text: "CHAMPION FEELING", time: 2, type: "relax" }] },
  { label: "Excited Change", desc: "Babysitter quickly swaps you into a pad: 'You've earned light protection again! You're doing so amazing!'", guide: [{ text: "FEEL EXCITEMENT", time: 3, type: "relax" }, { text: "PULLUPS OFF", time: 3, type: "push" }, { text: "FREEDOM RETURNS", time: 2, type: "relax" }, { text: "PAD FITTED", time: 3, type: "relax" }, { text: "AMAZING FEELING", time: 2, type: "relax" }] },
  { label: "Trust Reward", desc: "Babysitter says warmly: 'You've shown such great control. Back to a pad—you've earned it!'", guide: [{ text: "FEEL TRUSTED", time: 3, type: "relax" }, { text: "PULLUPS REMOVED", time: 3, type: "push" }, { text: "EARN LIGHTER LOAD", time: 2, type: "relax" }, { text: "PAD ON", time: 3, type: "relax" }, { text: "RESPONSIBILITY FELT", time: 2, type: "relax" }] },
  { label: "Bright Future", desc: "Babysitter smiles hopefully while changing you: 'Look how far you've come! Just a pad again—the sky's the limit!'", guide: [{ text: "SEE POTENTIAL", time: 3, type: "relax" }, { text: "PULLUPS SWAPPED OUT", time: 3, type: "push" }, { text: "PROGRESS ACKNOWLEDGED", time: 2, type: "relax" }, { text: "PAD SECURED", time: 3, type: "relax" }, { text: "HOPEFUL", time: 2, type: "relax" }] },
  { label: "Tender Victory", desc: "Babysitter gently changes you with genuine delight: 'You're my special one. Just a pad again—Babysitter's so happy for you!'", guide: [{ text: "FEEL SPECIAL", time: 3, type: "relax" }, { text: "PULLUPS OFF", time: 3, type: "push" }, { text: "BABYSITTER HAPPY", time: 2, type: "relax" }, { text: "PAD APPLIED WITH LOVE", time: 3, type: "relax" }, { text: "LOVED & CELEBRATED", time: 2, type: "relax" }] }
];


/* ---------- Audio Engine (v12.5 Looping) ---------- */

const MICRO_WARD_D10 = [
  { label: "Uniform Inspection", flow: "Stand up. Check for sagging. If dry, release a 2-second 'marking' spurt.", classKey: "micro_small", tags: ['requires_standing'], guide: [{ text: "STAND", time: 2, type: "stop" }, { text: "MARK", time: 2, type: "push" }] },
  { label: "The Cold Snap", flow: "Simulate a draft or cold air. Shiver and release tension.", classKey: "micro_tiny", guide: [{ text: "SHIVER", time: 2, type: "push" }, { text: "DRIP", time: 2, type: "relax" }] },
  { label: "Cough Test", flow: "Force a hard cough. Do not hold back the stress leak.", classKey: "micro_big", guide: [{ text: "COUGH HARD", time: 1, type: "push" }, { text: "STRESS LEAK", time: 3, type: "relax" }] },
  { label: "The Squat", flow: "Assume the 'Cat Feeding' squat position. Push for 3 seconds.", classKey: "micro_big", tags: ['requires_squat'], guide: [{ text: "SQUAT DOWN", time: 3, type: "stop" }, { text: "PUSH", time: 3, type: "push" }] },
  { label: "Hydration Penalty", flow: "You look thirsty. Drink, then leak to make room.", classKey: "micro_small", guide: [{ text: "DRINK", time: 5, type: "stop" }, { text: "DISPLACE", time: 5, type: "push" }] },
  { label: "Posture Check", flow: "Sit up straight. Shoulders back. The shift releases a dribble.", classKey: "micro_tiny", guide: [{ text: "POSTURE UP", time: 3, type: "stop" }, { text: "DRIBBLE", time: 2, type: "relax" }] },
  { label: "Diaper Pat", flow: "Check the bulk. Is it mushy? Add to it.", classKey: "micro_small", guide: [{ text: "PAT FRONT", time: 3, type: "stop" }, { text: "ADD WARMTH", time: 3, type: "push" }] },
  { label: "The Ghost Urge", flow: "You feel the urge. Verify it by pushing.", classKey: "micro_small", guide: [{ text: "VERIFY", time: 2, type: "push" }, { text: "CONFIRMED", time: 4, type: "relax" }] },
  { label: "Relaxation Order", flow: "Matron command: Relax your sphincter for 5 seconds.", classKey: "micro_big", guide: [{ text: "OBEY", time: 5, type: "relax" }] },
  { label: "Status Report", flow: "Touch your protection. If warm, pulse twice. If cold, pulse once.", classKey: "micro_tiny", guide: [{ text: "CHECK TEMP", time: 3, type: "stop" }, { text: "PULSE", time: 2, type: "push" }] }
];

/* --- MATRON WARD MACROS (Permission & Punishment) --- */
const MACRO_WARD_D20 = [
  // --- PERMISSION GRANTED (The Reward) ---
  { 
    label: "Permission Granted", 
    flow: "<b>Authorized:</b> The Matron is pleased. You have 3 minutes to use the toilet. Go now.", 
    cls: "full_light", 
    guide: [{ text: "GO TO TOILET", time: 0, type: "stop" }] 
  },
  { 
    label: "Hygiene Check", 
    flow: "<b>Inspection:</b> Go to the bathroom. Check your Guard. If it is dry/damp, you may use the toilet. If it is soaked, you must use the Guard.", 
    cls: "full_light", 
    guide: [{ text: "CHECK STATUS", time: 0, type: "stop" }] 
  },
  { 
    label: "The Mercy Rule", 
    flow: "<b>Relief:</b> You look desperate. Permission granted to empty fully in the toilet.", 
    cls: "full_light", 
    guide: [{ text: "RUN", time: 0, type: "stop" }] 
  },
  { 
    label: "Pad Change", 
    flow: "<b>Maintenance:</b> Go to the bathroom. Dispose of the current Guard. Try to pee in the toilet before putting a new one in.", 
    cls: "full_light", 
    guide: [{ text: "CHANGE & VOID", time: 0, type: "stop" }] 
  },
  { 
    label: "The Coin Flip", 
    flow: "<b>Chance:</b> Flip a coin. Heads = Toilet. Tails = Diaper. Do not cheat.", 
    cls: "full_moderate", 
    guide: [{ text: "FLIP COIN", time: 5, type: "stop" }, { text: "EXECUTE", time: 0, type: "stop" }] 
  },

  // --- CONTROLLED GUARD USE (The Training) ---
  { 
    label: "Capacity Test", 
    flow: "<b>Target Practice:</b> Release exactly 50% into the Tena Guard. Stop before it leaks onto the Goodnite.", 
    cls: "full_moderate", 
    guide: [
      { text: "START SLOW", time: 5, type: "push" }, 
      { text: "HOLD 50%", time: 5, type: "stop" },
      { text: "STOP", time: 2, type: "stop" }
    ] 
  },
  { 
    label: "The Pulse", 
    flow: "<b>Valve Control:</b> 5 short bursts into the Guard. Do not flood it.", 
    cls: "full_moderate", 
    guide: [
      { text: "BURST 1", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 2", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 3", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 4", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "BURST 5", time: 1, type: "push" }
    ] 
  },
  { 
    label: "The Soak", 
    flow: "<b>Saturation:</b> Fill the Guard until it is heavy. Do not let it overflow.", 
    cls: "full_moderate", 
    guide: [{ text: "FILL GUARD", time: 10, type: "relax" }] 
  },
  { 
    label: "The Squeeze", 
    flow: "<b>Pressure:</b> Cross your legs. Squeeze your thighs. Let the Guard catch the squeeze-leak.", 
    cls: "full_moderate", 
    guide: [{ text: "SQUEEZE", time: 5, type: "stop" }, { text: "LEAK", time: 5, type: "push" }] 
  },
  { 
    label: "Stand & Deliver", 
    flow: "<b>Gravity:</b> Stand up. Release a steady stream into the Guard for 5 seconds.", 
    cls: "full_moderate", 
    tags: ['requires_standing'],
    guide: [{ text: "STAND", time: 2, type: "stop" }, { text: "STREAM", time: 5, type: "push" }] 
  },

  // --- FORCED FAILURE (The Punishment) ---
  { 
    label: "Total Denial", 
    flow: "<b>Access Denied:</b> The toilet is locked. You must empty fully into your protection right now.", 
    cls: "full_heavy", 
    guide: [{ text: "EMPTY FULLY", time: 20, type: "relax" }] 
  },
  { 
    label: "The Flood", 
    flow: "<b>Overflow:</b> Do not aim for the Guard. Aim for the Goodnite. Flood everything.", 
    cls: "full_total", 
    guide: [{ text: "FLOOD IT ALL", time: 15, type: "push" }] 
  },
  { 
    label: "Freeze Protocol", 
    flow: "<b>Don't Move:</b> You are not allowed to move from your chair. If you have to go, you go right there.", 
    cls: "full_heavy", 
    guide: [{ text: "STAY SEATED", time: 5, type: "stop" }, { text: "RELEASE", time: 15, type: "relax" }] 
  },
  { 
    label: "The Shiver", 
    flow: "<b>Spasm:</b> Matron induces a cold shiver. You lose control.", 
    cls: "full_heavy", 
    guide: [{ text: "SHIVER", time: 2, type: "push" }, { text: "LOSS OF CONTROL", time: 10, type: "relax" }] 
  },
  { 
    label: "Ignored Plea", 
    flow: "<b>Silence:</b> You asked to leave. Matron didn't answer. You wet yourself waiting.", 
    cls: "full_heavy", 
    guide: [{ text: "WAIT...", time: 5, type: "stop" }, { text: "GIVE UP", time: 10, type: "relax" }] 
  },
  // --- REPEATS to balance probability ---
  { label: "Permission Granted", flow: "<b>Authorized:</b> Go use the toilet.", cls: "full_light", guide: [{ text: "GO TO TOILET", time: 0, type: "stop" }] },
  { label: "Capacity Test", flow: "<b>Target Practice:</b> Fill the Guard, keep the Pull-up dry.", cls: "full_moderate", guide: [{ text: "FILL GUARD", time: 8, type: "relax" }] },
  { label: "Total Denial", flow: "<b>No:</b> Use your diaper.", cls: "full_heavy", guide: [{ text: "USE DIAPER", time: 15, type: "push" }] },
  { label: "The Coin Flip", flow: "<b>Chance:</b> Heads = Potty, Tails = Pad.", cls: "full_moderate", guide: [{ text: "FLIP COIN", time: 5, type: "stop" }] },
  { label: "Permission Granted", flow: "<b>Authorized:</b> Go use the toilet.", cls: "full_light", guide: [{ text: "GO TO TOILET", time: 0, type: "stop" }] }
];
/* --- DEPENDENT MODE MICROS (The "Leak" Queue) --- */
const MICRO_DEPENDENT_D20 = [
  { label: "The Crotch Press", flow: "Press your hand flat against your padding. Feel the warmth spread against your palm.", guide: [{ text: "PRESS HAND", time: 3, type: "stop" }, { text: "LEAK INTO HAND", time: 3, type: "relax" }] },
  { label: "Leg Cross Squeeze", flow: "Cross your legs tight. The pressure forces a leak right into the middle.", guide: [{ text: "CROSS LEGS", time: 2, type: "stop" }, { text: "SQUEEZE & LEAK", time: 3, type: "push" }] },
  { label: "The Diaper Pat", flow: "Pat the front of your diaper to check bulk. Release a spurt while patting.", guide: [{ text: "PAT FRONT", time: 2, type: "stop" }, { text: "SPURT", time: 1, type: "push" }, { text: "PAT FRONT", time: 2, type: "stop" }] },
  { label: "Wide Stance", flow: "Stand up and spread legs wide. Gravity pulls the wetness down.", tags: ['requires_standing'], guide: [{ text: "STAND WIDE", time: 2, type: "stop" }, { text: "GRAVITY FLOW", time: 4, type: "relax" }] },
  { label: "Knee Bounce", flow: "Bounce your leg nervously under the desk. Each bounce pumps out a leak.", guide: [{ text: "BOUNCE LEG", time: 1, type: "push" }, { text: "BOUNCE LEG", time: 1, type: "push" }, { text: "BOUNCE LEG", time: 1, type: "push" }] },
  { label: "The Glute Clench", flow: "Squeeze your butt cheeks together, but let your front relax.", guide: [{ text: "CLENCH GLUTES", time: 3, type: "stop" }, { text: "FRONT LEAK", time: 3, type: "relax" }] },
  { label: "Forward Fold", flow: "Lean forward in your chair until your chest nearly touches your knees. The compression forces a seep.", guide: [{ text: "LEAN FORWARD", time: 3, type: "stop" }, { text: "COMPRESSION LEAK", time: 4, type: "relax" }] },
  { label: "The Waddle Shift", flow: "Shift weight left, then right, grinding the wetness into the pad.", guide: [{ text: "LEAN LEFT", time: 2, type: "relax" }, { text: "LEAN RIGHT", time: 2, type: "relax" }] },
  { label: "Thigh Rub", flow: "Rub your thighs together. The friction triggers a release.", guide: [{ text: "RUB THIGHS", time: 4, type: "push" }] },
  { label: "Check the Back", flow: "Reach back to check for bulk. Leak while distracted.", guide: [{ text: "CHECK BACK", time: 3, type: "stop" }, { text: "UNNOTICED DRIP", time: 3, type: "relax" }] },
  { label: "Toes Curl", flow: "Curl your toes tight in your shoes. Your bladder mirrors the spasm.", guide: [{ text: "CURL TOES", time: 2, type: "stop" }, { text: "SPASM", time: 2, type: "push" }] },
  { label: "Deep Breath In", flow: "Take a massive inhale. Leak as your diaphragm presses down.", guide: [{ text: "DEEP INHALE", time: 2, type: "stop" }, { text: "PRESSURE LEAK", time: 2, type: "push" }] },
  { label: "The Shrug", flow: "Shrug your shoulders up to your ears. Lose control below.", guide: [{ text: "SHRUG HIGH", time: 3, type: "stop" }, { text: "DROP & LEAK", time: 2, type: "relax" }] },
  { label: "Waistband Tug", flow: "Pull your waistband out to look. Leak while checking.", guide: [{ text: "PULL WAISTBAND", time: 2, type: "stop" }, { text: "LOOK & LEAK", time: 3, type: "relax" }] },
  { label: "Lazy Slouch", flow: "Slouch down until you are sitting on your lower back.", guide: [{ text: "SLOUCH LOW", time: 3, type: "stop" }, { text: "PASSIVE SEEP", time: 5, type: "relax" }] },
  { label: "Double Tap", flow: "Tap your crotch twice. Two quick spurts follow.", guide: [{ text: "TAP", time: 0.5, type: "stop" }, { text: "SPURT", time: 1, type: "push" }, { text: "TAP", time: 0.5, type: "stop" }, { text: "SPURT", time: 1, type: "push" }] },
  { label: "Stretch Up", flow: "Reach hands to the ceiling. Release tension in your pelvic floor.", guide: [{ text: "REACH UP", time: 3, type: "stop" }, { text: "RELEASE", time: 3, type: "relax" }] },
  { label: "Fetal Curl", flow: "Pull both knees up toward your chest while seated. Squeeze it out.", guide: [{ text: "KNEES UP", time: 3, type: "stop" }, { text: "SQUEEZE OUT", time: 3, type: "push" }] },
  { label: "The Hump", flow: "Rock your hips forward against the chair edge.", guide: [{ text: "ROCK FORWARD", time: 2, type: "stop" }, { text: "GRIND LEAK", time: 3, type: "relax" }] },
  { label: "Just Go", flow: "No trigger. Just a simple command to use your padding.", guide: [{ text: "USE DIAPER", time: 4, type: "push" }] }
];

/* --- DEPENDENT MODE MACROS (The "Full Voids") --- */
const MACRO_DEPENDENT_D20 = [
  { label: "The Floodgate", flow: "Don't push. Just relax every muscle and let it pour.", guide: [{ text: "TOTAL RELAX", time: 5, type: "relax" }, { text: "HEAVY FLOOD", time: 15, type: "relax" }] },
  { label: "Squat & Fill", flow: "Stand up, Squat down, and fill the back of the diaper.", tags: ['requires_squat'], guide: [{ text: "SQUAT DOWN", time: 3, type: "stop" }, { text: "FILL BACK", time: 10, type: "push" }, { text: "STAND UP", time: 3, type: "stop" }] },
  { label: "The Pulse-Check", flow: "Hand on crotch. Feel the diaper swell with each pulse.", guide: [{ text: "HAND ON", time: 2, type: "stop" }, { text: "SWELL", time: 3, type: "push" }, { text: "SWELL", time: 3, type: "push" }, { text: "SWELL", time: 3, type: "push" }] },
  { label: "The Rocking Chair", flow: "Rock back and forth. Leak on forward, stop on back.", guide: [{ text: "ROCK FWD (WET)", time: 2, type: "push" }, { text: "ROCK BACK", time: 1, type: "stop" }, { text: "ROCK FWD (WET)", time: 2, type: "push" }, { text: "ROCK BACK", time: 1, type: "stop" }, { text: "FINISH", time: 5, type: "relax" }] },
  { label: "Thigh Gap Fill", flow: "Stand with legs touching. Feel the warm trickle down your inner thighs.", tags: ['requires_standing'], guide: [{ text: "LEGS TOGETHER", time: 3, type: "stop" }, { text: "TRICKLE DOWN", time: 12, type: "relax" }] },
  { label: "The Stutter-Soak", flow: "Your control is broken. It starts and stops on its own.", guide: [{ text: "START", time: 2, type: "push" }, { text: "STOP?", time: 1, type: "stop" }, { text: "START", time: 4, type: "push" }, { text: "STOP?", time: 1, type: "stop" }, { text: "GUSH", time: 8, type: "relax" }] },
  { label: "Front to Back", flow: "Lean forward to wet the front, then lean back to soak the rear.", guide: [{ text: "LEAN FWD", time: 3, type: "stop" }, { text: "WET FRONT", time: 6, type: "push" }, { text: "LEAN BACK", time: 3, type: "stop" }, { text: "SOAK REAR", time: 8, type: "relax" }] },
  { label: "The Mush", flow: "Sit heavy. Mush your bottom into the chair and just go.", guide: [{ text: "MUSH DOWN", time: 4, type: "stop" }, { text: "SLOW RELEASE", time: 20, type: "relax" }] },
  { label: "Push Challenge", flow: "See how hard you can push for 10 seconds straight.", guide: [{ text: "PUSH HARD", time: 10, type: "push" }, { text: "RECOVER", time: 5, type: "relax" }] },
  { label: "The Lazy River", flow: "A slow, low-pressure release that takes forever to finish.", guide: [{ text: "SLOW STREAM", time: 30, type: "relax" }] },
  { label: "Crotch Grab Flood", flow: "Hold your crotch tight with both hands. Flood against the pressure.", guide: [{ text: "GRAB TIGHT", time: 5, type: "stop" }, { text: "FLOOD HANDS", time: 10, type: "push" }] },
  { label: "The Shiver-Flood", flow: "Induce a shiver. Let the shiver turn into a full void.", guide: [{ text: "SHIVER", time: 2, type: "stop" }, { text: "RELEASE", time: 12, type: "relax" }] },
  { label: "Wide Leg Waddle", flow: "Waddle to the door and back, leaking heavy the whole way.", tags: ['requires_walking'], guide: [{ text: "WADDLE FWD", time: 5, type: "relax" }, { text: "TURN", time: 2, type: "stop" }, { text: "WADDLE BACK", time: 5, type: "relax" }] },
  { label: "Chair Seat Rock", flow: "Rock your hips back in your chair, feet lifted slightly off the floor. Hold the angle and let gravity do the rest.", guide: [{ text: "ROCK BACK", time: 3, type: "stop" }, { text: "OPEN HIPS", time: 5, type: "relax" }, { text: "OPEN BLADDER", time: 12, type: "relax" }] },
  { label: "The Double Clutch", flow: "Empty half. Stop. Wait. Empty the rest.", guide: [{ text: "EMPTY HALF", time: 8, type: "push" }, { text: "WAIT", time: 3, type: "stop" }, { text: "EMPTY REST", time: 10, type: "push" }] },
  { label: "Chair Slump Flood", flow: "Slump way down into your seat until you're sitting on your tailbone. Let gravity and compression do the work.", guide: [{ text: "SLUMP LOW", time: 4, type: "stop" }, { text: "BELLY COMPRESS", time: 5, type: "push" }, { text: "FLOOD OUT", time: 10, type: "relax" }] },
  { label: "Sneeze Chain", flow: "Fake 3 sneezes. Each one forces a large spurt.", guide: [{ text: "AH-CHOO", time: 1, type: "push" }, { text: "AH-CHOO", time: 1, type: "push" }, { text: "AH-CHOO", time: 1, type: "push" }, { text: "DRAIN OUT", time: 8, type: "relax" }] },
  { label: "Safety Check", flow: "Check leak pad with finger. Flood to test it.", guide: [{ text: "CHECK PAD", time: 3, type: "stop" }, { text: "TEST LIMITS", time: 12, type: "push" }] },
  { label: "The Aftershock", flow: "Finish voiding. Wait. Then force out the hidden reserve.", guide: [{ text: "VOID", time: 10, type: "relax" }, { text: "WAIT", time: 3, type: "stop" }, { text: "AFTERSHOCK", time: 5, type: "push" }] },
  { label: "Diaper Squeeze", flow: "Use your thighs to squeeze the diaper. Wet into the squeeze.", guide: [{ text: "SQUEEZE THIGHS", time: 5, type: "stop" }, { text: "WET MIDDLE", time: 10, type: "push" }] }
];



/* ---------- MICRO TABLES (Restored) ---------- */
/* Replaces MICRO_DIAPER_D8 in app.js */
const MICRO_DIAPER_D8 = [
  {
    label: "Pressure Check",
    flow: "Quick squeeze. Just a single pulse to check capacity.",
    classKey: "micro_tiny",
    tmin: 5, tmax: 12,
    guide: [{ text: "PULSE", time: 0.5, type: "push" }]
  },
  {
    label: "The Shiver",
    flow: "A shiver runs down your spine. Release a short dribble (2s).",
    classKey: "micro_small",
    tmin: 8, tmax: 15,
    guide: [{ text: "DRIBBLE", time: 2, type: "relax" }]
  },
  {
    label: "Double Tap",
    flow: "Two quick spurts. Push-Stop-Push.",
    classKey: "micro_small",
    tmin: 6, tmax: 14,
    guide: [
      { text: "SPURT", time: 0.5, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "SPURT", time: 0.5, type: "push" }
    ]
  },
  {
    label: "Laugh/Cough",
    flow: "Force a cough. Allow a single squirt to escape.",
    classKey: "micro_tiny",
    tmin: 5, tmax: 10,
    guide: [{ text: "COUGH & PUSH", time: 0.5, type: "push" }]
  },
  {
    label: "Position Leak",
    flow: "Shift your weight. Let a small amount escape while moving (1.5s).",
    classKey: "micro_big",
    tmin: 10, tmax: 20,
    guide: [{ text: "SHIFT & LEAK", time: 1.5, type: "relax" }]
  },
  {
    label: "Focus Drip",
    flow: "Do not stop working. Just relax your sphincter for 3 seconds.",
    classKey: "micro_big",
    tmin: 8, tmax: 18,
    guide: [{ text: "RELAX", time: 3, type: "relax" }]
  },
  {
    label: "Seepage",
    flow: "Continuous very low-pressure release for 4 seconds.",
    classKey: "micro_big",
    tmin: 12, tmax: 22,
    guide: [{ text: "SEEP", time: 4, type: "relax" }]
  },
  { label: "Stand-Up Squirt",
    flow: "Stand up. Immediately release a 1-second spurt.",
    classKey: "micro_big",
    tags: ['requires_standing'],
    tmin: 10, tmax: 15,
    guide: [{ text: "STAND & SPURT", time: 1, type: "push" }]
  }
];

const MICRO_STD_D6 = [
  {
    label: "Pinprick Blink",
    flow: "A tiny involuntary spurt catches you off guard—barely a blink, but it's there. Update your saturation.",
    classKey: "micro_tiny",
    guide: [{ text: "QUICK SPURT", time: 1, type: "push" }]
  },
  {
    label: "Double Blink",
    flow: "Two quick spurts escape as you shift—each one a sharp, uncontrolled pulse. Feel them and breathe.",
    classKey: "micro_small",
    guide: [{ text: "FIRST SPURT", time: 1, type: "push" }, { text: "HOLD", time: 2, type: "stop" }, { text: "SECOND SPURT", time: 1, type: "push" }]
  },
  {
    label: "Thin Dribble",
    flow: "A warm dribble trickles slowly. You feel it spreading before you can clench tight enough to stop it.",
    classKey: "micro_small",
    guide: [{ text: "DRIBBLE STARTS", time: 3, type: "relax" }, { text: "CLENCH TIGHT", time: 3, type: "stop" }]
  },
  {
    label: "Peppery Patter",
    flow: "Three or four sharp spurts fire in quick succession—each one a little bigger than the last. Breathe through it.",
    classKey: "micro_big",
    guide: [{ text: "SPURT", time: 1, type: "push" }, { text: "SPURT", time: 1, type: "push" }, { text: "SPURT", time: 1, type: "push" }, { text: "CLENCH HARD", time: 3, type: "stop" }]
  },
  {
    label: "Mini Stream",
    flow: "A steady little stream runs out before you clamp down. Warm and unmistakable. Update your saturation.",
    classKey: "micro_big",
    guide: [{ text: "STREAM STARTS", time: 2, type: "push" }, { text: "FLOWING", time: 4, type: "relax" }, { text: "CLAMP DOWN", time: 3, type: "stop" }]
  },
  {
    label: "Sticky Linger",
    flow: "A slow, extended release you can't seem to cut off all the way. It just keeps seeping while you squeeze.",
    classKey: "micro_big",
    guide: [{ text: "SEEPING", time: 4, type: "relax" }, { text: "SQUEEZE", time: 3, type: "stop" }, { text: "STILL SEEPING", time: 3, type: "relax" }]
  }
];

/* --- OMORASHI MODE STRESS TESTS (Holding Guides - Micro Frequency) --- */
const OMORASHI_HOLDING_GUIDES = [
  {
    label: "Stand & Spread",
    tags: ['requires_standing'],
    guide: [
      { text: "STAND UP", time: 3, type: "stop" },
      { text: "LEGS WIDE", time: 8, type: "stop" },
      { text: "HOLD STEADY", time: 7, type: "stop" }
    ]
  },
  {
    label: "The Fold",
    guide: [
      { text: "SIT ON EDGE", time: 2, type: "stop" },
      { text: "CHEST TO KNEES", time: 10, type: "stop" },
      { text: "STAY FOLDED", time: 8, type: "stop" }
    ]
  },
  {
    label: "Knee Hug",
    guide: [
      { text: "LIFT LEFT KNEE", time: 2, type: "stop" },
      { text: "HUG TO CHEST", time: 8, type: "stop" },
      { text: "HOLD IT", time: 2, type: "stop" }
    ]
  },
  {
    label: "Hip Rotation",
    tags: ['requires_standing'],
    guide: [
      { text: "ROTATE LEFT", time: 5, type: "stop" },
      { text: "CENTER", time: 2, type: "stop" },
      { text: "ROTATE RIGHT", time: 5, type: "stop" }
    ]
  },
  {
    label: "Deep Breath Hold",
    guide: [
      { text: "DEEP INHALE", time: 3, type: "stop" },
      { text: "HOLD BREATH", time: 10, type: "stop" },
      { text: "TIGHTEN CORE", time: 5, type: "stop" },
      { text: "EXHALE", time: 3, type: "stop" }
    ]
  },
  {
    label: "Cross Leg Squeeze",
    guide: [
      { text: "CROSS LEGS TIGHT", time: 5, type: "stop" },
      { text: "SQUEEZE THIGHS", time: 8, type: "stop" },
      { text: "UNCROSS", time: 3, type: "stop" }
    ]
  },
  {
    label: "Wall Sit Test",
    tags: ['requires_standing'],
    guide: [
      { text: "BACK TO WALL", time: 2, type: "stop" },
      { text: "SLIDE DOWN", time: 3, type: "stop" },
      { text: "HOLD SQUAT", time: 15, type: "stop" },
      { text: "STAND UP", time: 3, type: "stop" }
    ]
  },
  {
    label: "Calf Raises",
    tags: ['requires_standing'],
    guide: [
      { text: "STAND TALL", time: 2, type: "stop" },
      { text: "RAISE ON TOES (8 reps)", time: 12, type: "stop" },
      { text: "HOLD TOP", time: 5, type: "stop" },
      { text: "DOWN", time: 2, type: "stop" }
    ]
  },
  {
    label: "Plank Hold",
    tags: ['requires_floor'],
    guide: [
      { text: "ASSUME PLANK", time: 3, type: "stop" },
      { text: "HOLD POSITION", time: 15, type: "stop" },
      { text: "REST", time: 2, type: "stop" }
    ]
  },
  {
    label: "Leg Raise",
    tags: ['requires_floor'],
    guide: [
      { text: "LIE BACK", time: 2, type: "stop" },
      { text: "RAISE LEGS 90°", time: 15, type: "stop" },
      { text: "LOWER", time: 3, type: "stop" }
    ]
  },
  {
    label: "Glute Clench",
    guide: [
      { text: "CLENCH BUTTOCKS", time: 5, type: "stop" },
      { text: "HOLD EVERYTHING", time: 8, type: "stop" },
      { text: "DON'T LET GO", time: 3, type: "stop" }
    ]
  },
  {
    label: "Sitting Rock",
    guide: [
      { text: "SIT FORWARD", time: 3, type: "stop" },
      { text: "SIT BACK", time: 3, type: "stop" },
      { text: "ROCK (5 times)", time: 10, type: "stop" }
    ]
  },
  {
    label: "Kegel Strength",
    guide: [
      { text: "CONTRACT PELVIC FLOOR", time: 5, type: "stop" },
      { text: "HOLD MAXIMUM", time: 8, type: "stop" },
      { text: "REST", time: 4, type: "stop" }
    ]
  },
  {
    label: "Stretcher",
    guide: [
      { text: "REACH TO TOES", time: 8, type: "stop" },
      { text: "FEEL THE STRETCH", time: 5, type: "stop" }
    ]
  },
  {
    label: "Chair Grind",
    guide: [
      { text: "LEAN FORWARD", time: 5, type: "stop" },
      { text: "HOLD", time: 5, type: "stop" },
      { text: "LEAN BACK", time: 5, type: "stop" }
    ]
  },
  {
    label: "The Stair Step",
    tags: ['requires_standing'],
    guide: [
      { text: "STEP UP (chair/step)", time: 3, type: "stop" },
      { text: "STEP DOWN", time: 3, type: "stop" },
      { text: "REPEAT (4 times)", time: 12, type: "stop" }
    ]
  },
  {
    label: "Belly Compression",
    guide: [
      { text: "HANDS ON BELLY", time: 2, type: "stop" },
      { text: "PRESS DOWN", time: 10, type: "stop" },
      { text: "HOLD", time: 3, type: "stop" }
    ]
  },
  {
    label: "Jumping Jacks",
    tags: ['requires_standing'],
    guide: [
      { text: "DO 15 JUMPING JACKS", time: 15, type: "stop" },
      { text: "FEEL THE PRESSURE", time: 5, type: "stop" }
    ]
  },
  {
    label: "Stair Climb",
    tags: ['requires_walking'],
    guide: [
      { text: "CLIMB STAIRS (20 steps)", time: 15, type: "stop" },
      { text: "HOLD AT TOP", time: 8, type: "stop" }
    ]
  },
  {
    label: "The Hold",
    guide: [
      { text: "SIT STILL", time: 5, type: "stop" },
      { text: "JUST... HOLD", time: 15, type: "stop" },
      { text: "DON'T MOVE", time: 10, type: "stop" }
    ]
  }
];

/* --- OMORASHI GAUNTLET OPTIONS (Intensive Final Challenges) --- */
const OMORASHI_GAUNTLETS = [
  {
    name: "Silent Squeeze Protocol",
    guide: [
      { text: "SIT ON EDGE OF CHAIR", time: 5, type: "stop" },
      { text: "LEGS WIDE", time: 3, type: "stop" },
      { text: "FOLD CHEST TO KNEES", time: 5, type: "stop" },
      { text: "HOLD BELLY TIGHT", time: 10, type: "stop" },
      { text: "STAY FOLDED", time: 10, type: "stop" },
      { text: "SIT UP SLOWLY", time: 5, type: "stop" },
      { text: "ROTATE HIPS LEFT", time: 5, type: "stop" },
      { text: "ROTATE HIPS RIGHT", time: 5, type: "stop" },
      { text: "HOLD IN PLACE", time: 10, type: "stop" },
      { text: "LIFT LEFT KNEE", time: 3, type: "stop" },
      { text: "HUG KNEE TO CHEST", time: 5, type: "stop" },
      { text: "SQUEEZE HARD", time: 5, type: "stop" },
      { text: "DROP LEG", time: 2, type: "stop" },
      { text: "LIFT RIGHT KNEE", time: 3, type: "stop" },
      { text: "HUG KNEE TO CHEST", time: 5, type: "stop" },
      { text: "DROP LEG", time: 2, type: "stop" },
      { text: "HANDS ON STOMACH", time: 3, type: "stop" },
      { text: "DEEP INHALE (MAX)", time: 5, type: "stop" },
      { text: "HOLD BREATH", time: 10, type: "stop" },
      { text: "TIGHTEN CORE", time: 5, type: "stop" },
      { text: "EXHALE & HOLD", time: 5, type: "stop" }
    ]
  },
  {
    name: "The Endurance Trial",
    tags: ['requires_squat'],
    guide: [
      { text: "STAND UP", time: 2, type: "stop" },
      { text: "LEGS WIDE", time: 5, type: "stop" },
      { text: "SQUAT DOWN (hold)", time: 20, type: "stop" },
      { text: "STAND", time: 2, type: "stop" },
      { text: "REPEAT SQUAT", time: 20, type: "stop" },
      { text: "STAND", time: 2, type: "stop" },
      { text: "FINAL SQUAT", time: 20, type: "stop" },
      { text: "REST", time: 3, type: "stop" }
    ]
  },
  {
    name: "The Compression",
    guide: [
      { text: "SIT FRONT OF CHAIR", time: 3, type: "stop" },
      { text: "CROSS LEGS TIGHT", time: 5, type: "stop" },
      { text: "SQUEEZE WITH ALL STRENGTH", time: 15, type: "stop" },
      { text: "LEAN FORWARD", time: 5, type: "stop" },
      { text: "HUG KNEES", time: 10, type: "stop" },
      { text: "BREATHE (barely)", time: 10, type: "stop" },
      { text: "UNFOLD", time: 3, type: "stop" }
    ]
  },
  {
    name: "The Burn",
    tags: ['requires_floor'],
    guide: [
      { text: "PLANK POSITION", time: 3, type: "stop" },
      { text: "HOLD 30 SECONDS", time: 30, type: "stop" },
      { text: "CALF RAISES (15 reps)", time: 15, type: "stop" },
      { text: "HOLD TOP POSITION", time: 10, type: "stop" },
      { text: "REST", time: 2, type: "stop" }
    ]
  },
  {
    name: "The Grinder",
    guide: [
      { text: "SIT HEAVILY IN CHAIR", time: 3, type: "stop" },
      { text: "HIPS FORWARD", time: 5, type: "stop" },
      { text: "HIPS BACK", time: 5, type: "stop" },
      { text: "CIRCULAR MOTION (10 circles)", time: 15, type: "stop" },
      { text: "GRINDING MOTION (10 more)", time: 15, type: "stop" },
      { text: "STOP & HOLD", time: 10, type: "stop" }
    ]
  },
  {
    name: "The Breath Torture",
    tags: ['requires_floor'],
    guide: [
      { text: "LIE ON BACK", time: 2, type: "stop" },
      { text: "LEGS STRAIGHT UP (90°)", time: 5, type: "stop" },
      { text: "DEEP BREATH IN", time: 5, type: "stop" },
      { text: "HOLD BREATH", time: 15, type: "stop" },
      { text: "EXHALE (slowly)", time: 5, type: "stop" },
      { text: "REPEAT (2 more times)", time: 30, type: "stop" },
      { text: "LOWER LEGS SLOWLY", time: 5, type: "stop" }
    ]
  },
  {
    name: "The Staircase",
    tags: ['requires_walking'],
    guide: [
      { text: "STAND AT BASE", time: 1, type: "stop" },
      { text: "CLIMB 2 FLIGHTS FAST", time: 20, type: "stop" },
      { text: "STAND AT TOP", time: 10, type: "stop" },
      { text: "DESCEND SLOWLY", time: 15, type: "stop" }
    ]
  },
  {
    name: "The Kegel Crusher",
    guide: [
      { text: "PELVIC CONTRACT (MAX)", time: 10, type: "stop" },
      { text: "HOLD IT (no relaxing)", time: 15, type: "stop" },
      { text: "PULSES (10 rapid)", time: 8, type: "stop" },
      { text: "FINAL HOLD", time: 10, type: "stop" },
      { text: "REST", time: 5, type: "stop" }
    ]
  }
];



const MICRO_TRAINING_D8 = [
  // --- SEATED (Originals & Additions) ---
  {
    label: "Gravity Drain",
    flow: "You lean all the way back in your chair. Gravity pulls a steady trickle out.",
    classKey: "micro_small",
    guide: [
      { text: "LEAN BACK", time: 3, type: "stop" },
      { text: "GRAVITY LEAK", time: 4, type: "relax" }
    ]
  },
  {
    label: "Typing Surge",
    flow: "You try to keep working through a surge, resulting in rhythmic spurts with each keystroke.",
    classKey: "micro_small",
    guide: [
      { text: "WORK/TYPE FAST", time: 2, type: "stop" },
      { text: "SPURT", time: 1, type: "push" },
      { text: "WORK/TYPE FAST", time: 2, type: "stop" },
      { text: "SPURT", time: 1, type: "push" }
    ]
  },
  {
    label: "The Crotch-Press",
    flow: "You press your hand firmly against your crotch. It spurts around your fingers.",
    classKey: "micro_small",
    guide: [
      { text: "PRESS HARD", time: 4, type: "stop" },
      { text: "SQUIRT", time: 2, type: "push" },
      { text: "STEADY DRIP", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Shiver-Spasm",
    flow: "A cold chill makes you shiver violently, triggering three sharp bursts.",
    classKey: "micro_tiny",
    guide: [
      { text: "SHIVER", time: 1, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "SHIVER", time: 1, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "SHIVER", time: 1, type: "push" }
    ]
  },
  {
    label: "The Scissor Squeeze",
    flow: "You cross your legs tight to hold it, but the pressure actually squeezes a leak out.",
    classKey: "micro_big",
    guide: [
      { text: "CROSS LEGS", time: 3, type: "stop" },
      { text: "SQUEEZE & LEAK", time: 3, type: "push" },
      { text: "UNCROSS", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Stutter-Stop",
    flow: "Your fatigued muscle flutters. You stop, leak, stop, leak.",
    classKey: "micro_small",
    guide: [
      { text: "STOP", time: 1, type: "stop" },
      { text: "LEAK", time: 1, type: "relax" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "LEAK", time: 2, type: "relax" }
    ]
  },
  {
    label: "The Overhead Reach",
    flow: "You stretch your arms high above your head. Lifting your ribcage relaxes your core too much.",
    classKey: "micro_small",
    guide: [
      { text: "REACH HIGH", time: 3, type: "stop" },
      { text: "CORE RELAX", time: 3, type: "relax" },
      { text: "ARMS DOWN", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Slump & Seep",
    flow: "You slump forward, resting your elbows on your knees/desk. The abdominal compression pushes a seep out.",
    classKey: "micro_big",
    guide: [
      { text: "ELBOWS ON KNEES", time: 3, type: "stop" },
      { text: "COMPRESSION", time: 4, type: "push" },
      { text: "SIT UP", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Nervous Bounce",
    flow: "You bounce your leg nervously. The rhythmic motion shakes a few drops loose.",
    classKey: "micro_tiny",
    guide: [
      { text: "BOUNCE LEG", time: 1, type: "push" },
      { text: "BOUNCE LEG", time: 1, type: "push" },
      { text: "BOUNCE LEG", time: 1, type: "push" },
      { text: "BOUNCE LEG", time: 1, type: "push" }
    ]
  },
  {
    label: "The Chair Twist",
    flow: "You twist your upper body to look behind you. The torsion wrings out your bladder.",
    classKey: "micro_small",
    guide: [
      { text: "TWIST RIGHT", time: 2, type: "stop" },
      { text: "LEAK", time: 2, type: "relax" },
      { text: "TWIST LEFT", time: 2, type: "stop" },
      { text: "LEAK", time: 2, type: "relax" }
    ]
  },
  {
    label: "The Glute Release",
    flow: "You've been clenching your butt to hold it. You finally let go, and the front follows.",
    classKey: "micro_big",
    guide: [
      { text: "CLENCH BUTT", time: 4, type: "stop" },
      { text: "RELAX BUTT", time: 1, type: "relax" },
      { text: "FRONT LEAK", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Breath Hold",
    flow: "You hold your breath to concentrate. When you finally exhale, you lose control.",
    classKey: "micro_small",
    guide: [
      { text: "HOLD BREATH", time: 4, type: "stop" },
      { text: "EXHALE HARD", time: 1, type: "relax" },
      { text: "LEAK", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Heel Prop",
    flow: "You prop your feet up on your desk/chair. The tilt changes the pressure angle.",
    classKey: "micro_small",
    guide: [
      { text: "FEET UP", time: 3, type: "stop" },
      { text: "ANGLE SHIFT", time: 3, type: "relax" },
      { text: "FEET DOWN", time: 2, type: "stop" }
    ]
  },
  {
    label: "The Double Clutch",
    flow: "You try to verify if you are done. You push to check, but can't stop the flow immediately.",
    classKey: "micro_small",
    guide: [
      { text: "CHECK PUSH", time: 1, type: "push" },
      { text: "TRY TO STOP", time: 2, type: "stop" },
      { text: "FAILED STOP", time: 2, type: "relax" }
    ]
  },
  {
    label: "Thigh Gap Fail",
    flow: "You press your thighs together to create a seal, but the wetness warms between them.",
    classKey: "micro_big",
    guide: [
      { text: "KNEES TOGETHER", time: 3, type: "stop" },
      { text: "WARMTH SPREADS", time: 4, type: "relax" }
    ]
  },
  {
    label: "Daydream Dribble",
    flow: "You stare at your screen, lost in thought. As your mind drifts, so does your control.",
    classKey: "micro_small",
    guide: [
      { text: "ZONE OUT", time: 5, type: "stop" },
      { text: "FORGET & DRIBBLE", time: 3, type: "relax" }
    ]
  },
  {
    label: "Tummy Pressure",
    flow: "You lean forward, resting your arms on your desk. The gentle pressure is just enough to start a seep.",
    classKey: "micro_big",
    guide: [
      { text: "LEAN FORWARD", time: 3, type: "stop" },
      { text: "GENTLE SEEP", time: 5, type: "relax" }
    ]
  },
  {
    label: "The Startle",
    flow: "A sudden in-game sound or notification makes you jump, causing a sharp, surprising squirt.",
    classKey: "micro_tiny",
    guide: [
      { text: "JUMP!", time: 0.5, type: "push" },
      { text: "SURPRISE LEAK", time: 1.5, type: "relax" }
    ]
  },
  {
    label: "The Sneeze",
    flow: "A tickle in your nose becomes an explosive sneeze. You can't hold back the gush.",
    classKey: "micro_big",
    guide: [
      { text: "SNEEZE!", time: 1, type: "push" },
      { text: "GUSH", time: 2, type: "relax" }
    ]
  },
  // --- POSTURE-BASED (Standing/General Movement) ---
  {
    label: "The Slow Turn",
    flow: "You turn to look at something, but the slow twist is enough to compromise your control.",
    classKey: "micro_small",
    guide: [
        { text: "TURN SLOWLY", time: 4, type: "stop" },
        { text: "A SLOW LEAK", time: 4, type: "relax" }
    ]
  },
  {
    label: "One-Legged Balance",
    flow: "You stand on one leg to distract yourself, but you lose your focus and your clench.",
    classKey: "micro_small",
    guide: [
      { text: "STAND ON ONE LEG", time: 5, type: "stop" },
      { text: "LOSE FOCUS", time: 3, type: "relax" }
    ]
  },
  {
    label: "The Vertical Shift",
    flow: "You stand up too quickly. The sudden gravity shift pulls a leak out before you can clamp.",
    classKey: "micro_small",
    guide: [
      { text: "SIT STILL", time: 2, type: "stop" },
      { text: "STAND FAST", time: 1, type: "push" },
      { text: "LEAKING", time: 3, type: "relax" }
    ]
  },
  {
      label: "The Gentle Bend",
      flow: "You bend slightly to pick something up from the floor beside you, and that small squeeze is enough.",
      classKey: "micro_small",
      guide: [
          { text: "BEND SIDEWAYS", time: 2, type: "stop" },
          { text: "SQUEEZE OUT", time: 2, type: "push" },
          { text: "STRAIGHTEN UP", time: 1, type: "stop" }
      ]
  },
  {
    label: "The Pacing Peril",
    flow: "You pace around to distract yourself, but each pivot puts a little squeeze on your bladder.",
    classKey: "micro_tiny",
    guide: [
      { text: "PACE", time: 3, type: "stop" },
      { text: "TURN & LEAK", time: 1, type: "relax" },
      { text: "PACE", time: 3, type: "stop" },
      { text: "TURN & LEAK", time: 1, type: "relax" }
    ]
  },
  {
      label: "The Forward Lean",
      flow: "You lean forward intently, focusing on the screen. The angle is not your friend.",
      classKey: "micro_big",
      guide: [
          { text: "LEAN FORWARD", time: 4, type: "stop" },
          { text: "OOPS, A GUSH", time: 3, type: "push" }
      ]
  },
  {
    label: "The Sudden Sit-Down",
    flow: "You were standing and decided to sit, but you sat down a little too hard. Whoops.",
    classKey: "micro_small",
    guide: [
      { text: "ABOUT TO SIT", time: 2, type: "stop" },
      { text: "SIT HARD", time: 1, type: "push" },
      { text: "SURPRISE SPURT", time: 2, type: "relax" }
    ]
  },
  {
    label: "The 'Act Natural' Freeze",
    flow: "An urge hits while you're standing. You freeze, trying to look normal, but a betraying warmth seeps out.",
    classKey: "micro_small",
    guide: [
      { text: "FREEZE", time: 4, type: "stop" },
      { text: "WARM SEEP", time: 4, type: "relax" }
    ]
  },
  {
    label: "The Desk Lean",
    flow: "You lean forward over your desk, putting all the pressure right where it shouldn't be.",
    classKey: "micro_big",
    guide: [
      { text: "LEAN ON DESK", time: 5, type: "stop" },
      { text: "PRESSURE LEAK", time: 4, type: "push" }
    ]
  },
  {
    label: "The Un-Cross",
    flow: "You had your legs crossed tightly while standing. Uncrossing them was a mistake.",
    classKey: "micro_small",
    guide: [
      { text: "LEGS CROSSED", time: 4, type: "stop" },
      { text: "UNCROSS...", time: 2, type: "relax" },
      { text: "IMMEDIATE LEAK", time: 3, type: "relax" }
    ]
  },
  {
      label: "The Yawn",
      flow: "A huge yawn stretches your entire body, and your pelvic floor relaxes with it.",
      classKey: "micro_small",
      guide: [
          { text: "BIG YAWN", time: 3, type: "stop" },
          { text: "RELAX & LEAK", time: 3, type: "relax" }
      ]
  },
  {
      label: "The Creeping Dread",
      flow: "You feel a tiny damp spot and hope it's just sweat. It isn't. It slowly grows.",
      classKey: "micro_big",
      guide: [
          { text: "IS THAT...?", time: 4, type: "stop" },
          { text: "OH NO", time: 2, type: "relax" },
          { text: "SLOW SEEP", time: 5, type: "relax" }
      ]
  }
];

/* --- NEW: Training Mode Full Failures (The "Why") --- */

const FULL_TRAINING_FAILURES = [
  // --- REVISED ORIGINALS (duration < 20s) ---
  {
    label: "The Stuttering Soak",
    flow: "<b>Control Struggle:</b> You manage to stop three times, but the fourth wave is too much.",
    guide: [
      { text: "LEAK", time: 3, type: "relax" }, { text: "STOP", time: 2, type: "stop" },
      { text: "LEAK", time: 4, type: "relax" }, { text: "STOP", time: 2, type: "stop" },
      { text: "LEAK", time: 5, type: "relax" }, { text: "STOP", time: 1, type: "stop" },
      { text: "FLOOD", time: 8, type: "push" }
    ]
  },
  {
    label: "The Chair Squirm",
    flow: "<b>Position Failure:</b> You squirm in your seat, trying to find a 'safe' position, but only make it worse.",
    guide: [
      { text: "SQUIRM & SHIFT", time: 6, type: "stop" },
      { text: "PRESSURE SPIKE", time: 5, type: "push" },
      { text: "GIVE UP", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Thousand-Yard Stare",
    flow: "<b>Exhaustion Failure:</b> You're so tired of holding it, you just freeze, staring into space as it all lets go.",
    guide: [
      { text: "ZONE OUT", time: 5, type: "stop" },
      { text: "DETACH & FLOOD", time: 18, type: "relax" }
    ]
  },
  {
    label: "The Surrender",
    flow: "<b>Mental Failure:</b> You're too tired to keep fighting. You just... give up and let it all go.",
    guide: [
      { text: "STOP FIGHTING", time: 5, type: "stop" },
      { text: "SLOW, WARM RELEASE", time: 20, type: "relax" }
    ]
  },
  {
    label: "The Trickle-Down",
    flow: "<b>Miscalculation:</b> It started as a tiny, harmless trickle... but it's not stopping. It's getting stronger.",
    guide: [
      { text: "SMALL TRICKLE", time: 5, type: "relax" },
      { text: "GETTING STRONGER", time: 7, type: "relax" },
      { text: "FULL FLOW", time: 8, type: "push" }
    ]
  },
  {
    label: "The Broken Promise",
    flow: "<b>Bargaining Failure:</b> You told yourself 'just a little bit'. You lied. The floodgates are open.",
    guide: [
      { text: "'Just a little...'", time: 2, type: "push" },
      { text: "OH NO", time: 4, type: "relax" },
      { text: "UNSTOPPABLE FLOOD", time: 14, type: "push" }
    ]
  },
  {
    label: "The Relaxation Puddle",
    flow: "<b>Relaxation Failure:</b> You get comfy in your seat, and all your tension melts away, including your bladder control.",
    guide: [
      { text: "GET COMFORTABLE", time: 5, type: "stop" },
      { text: "MUSCLES RELAX", time: 4, type: "relax" },
      { text: "FORMING A PUDDLE", time: 15, type: "relax" }
    ]
  },

  // --- NEW ADDITIONS ---
  {
      label: "The Auditory Trigger",
      flow: "<b>Mental Failure:</b> The sound of running water from a video or show is too much to handle.",
      guide: [
          { text: "HEAR WATER...", time: 4, type: "stop" },
          { text: "MIND GIVES IN", time: 3, type: "relax" },
          { text: "MATCH THE SOUND", time: 15, type: "relax" }
      ]
  },
  {
    label: "The Screen Blank",
    flow: "<b>Focus Failure:</b> You stare blankly at the screen, mind empty, and in that checked-out moment everything lets go.",
    guide: [
      { text: "STARE BLANKLY", time: 6, type: "stop" },
      { text: "MIND GOES BLANK", time: 2, type: "relax" },
      { text: "DREAMY FLOOD", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Distraction Flood",
    flow: "<b>Distraction Failure:</b> 'Just one more minute.' Famous last words. You got too focused on your task to notice the flood.",
    guide: [
      { text: "FOCUS ON TASK", time: 8, type: "stop" },
      { text: "SUBTLE LEAK", time: 5, type: "relax" },
      { text: "FULL SOAKING", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Laughing Fit",
    flow: "<b>Spasm Failure:</b> Something makes you laugh uncontrollably, and each 'HA' is a gush.",
    guide: [
      { text: "LAUGH", time: 1, type: "push" },
      { text: "GUSH", time: 3, type: "relax" },
      { text: "LAUGH HARDER", time: 1, type: "push" },
      { text: "TOTAL FLOOD", time: 12, type: "push" }
    ]
  },
  {
    label: "The Coughing Jag",
    flow: "<b>Spasm Failure:</b> A tickle in your throat turns into a coughing jag that shakes a powerful stream out of you.",
    guide: [
      { text: "COUGH", time: 2, type: "push" },
      { text: "STOP", time: 1, type: "stop" },
      { text: "DEEP COUGH", time: 3, type: "push" },
      { text: "UNSTOPPABLE STREAM", time: 14, type: "relax" }
    ]
  },
  {
    label: "The Sneeze-pocalypse",
    flow: "<b>Spasm Failure:</b> One sneeze made you leak. The second one broke the dam completely.",
    guide: [
      { text: "ACHOO #1", time: 2, type: "push" },
      { text: "TRY TO RECOVER", time: 3, type: "stop" },
      { text: "ACHOO #2", time: 1, type: "push" },
      { text: "TOTAL MELTDOWN", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Deliberate Release",
    flow: "<b>Mental Failure:</b> You're tired of holding it. You decide to just let go. A slow, deliberate, warm release.",
    guide: [
      { text: "DECIDE TO GO", time: 4, type: "stop" },
      { text: "SLOW & STEADY", time: 20, type: "relax" }
    ]
  },
  {
    label: "The Pressure Point",
    flow: "<b>Miscalculation:</b> You press a hand to your lower tummy to 'help', but it just forces everything out.",
    guide: [
      { text: "PRESS ON TUMMY", time: 3, type: "stop" },
      { text: "IT'S NOT WORKING", time: 3, type: "push" },
      { text: "IT'S MAKING IT WORSE", time: 12, type: "push" }
    ]
  },
  {
    label: "The Deadline Desperation",
    flow: "<b>Focus Failure:</b> You try to finish one last thing before you go. Your bladder finished first.",
    guide: [
      { text: "WORKING FRANTICALLY", time: 7, type: "stop" },
      { text: "THE URGE WINS", time: 18, type: "relax" }
    ]
  },
  {
    label: "The Slouch-pocalypse",
    flow: "<b>Position Failure:</b> You slouch down so far in your chair that you compress your bladder and it gives way.",
    guide: [
      { text: "SLOUCH DOWN", time: 4, type: "stop" },
      { text: "COMPRESSION", time: 5, type: "push" },
      { text: "TOTAL RELEASE", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Big Morning Stretch",
    flow: "<b>Position Failure:</b> You do a big, satisfying stretch, relaxing every muscle, including the important ones.",
    guide: [
      { text: "BIG STRETCH", time: 5, type: "stop" },
      { text: "EVERYTHING RELAXES", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Shiver Cascade",
    flow: "<b>Spasm Failure:</b> A sudden cold chill gives you goosebumps, then a shiver, then an unstoppable flow.",
    guide: [
      { text: "CHILLS...", time: 4, type: "stop" },
      { text: "BIG SHIVER", time: 2, type: "push" },
      { text: "WARM CASCADE", time: 16, type: "relax" }
    ]
  },
  {
    label: "The False Finish",
    flow: "<b>Miscalculation:</b> You had a small leak and thought it was over. You were wrong. The main event was just waiting.",
    guide: [
      { text: "SMALL LEAK...", time: 4, type: "relax" },
      { text: "...stopped?", time: 4, type: "stop" },
      { text: "NOPE. THE REAL FLOOD", time: 15, type: "push" }
    ]
  },
  {
    label: "The Deep Breath Betrayal",
    flow: "<b>Relaxation Failure:</b> You take a deep, calming breath to manage the urge. It works too well.",
    guide: [
      { text: "DEEP BREATH IN...", time: 5, type: "stop" },
      { text: "EXHALE & RELEASE", time: 18, type: "relax" }
    ]
  },
  {
    label: "The Out-of-Nowhere Spasm",
    flow: "<b>Spasm Failure:</b> With no warning, a powerful spasm hits you and your bladder just empties. No time to react.",
    guide: [
      { text: "Wait for it...", time: 3, type: "stop" },
      { text: "SUDDEN SPASM", time: 2, type: "push" },
      { text: "TOTAL FLOOD", time: 15, type: "relax" }
    ]
  },
  {
    label: "The Leg Cramp Collapse",
    flow: "<b>Distraction Failure:</b> A sudden cramp in your leg makes you cry out, and in that moment of pain, you lose all control.",
    guide: [
      { text: "CRAMP!", time: 2, type: "stop" },
      { text: "FOCUS LOST", time: 1, type: "push" },
      { text: "PAIN & PUDDLE", time: 17, type: "relax" }
    ]
  },
  {
    label: "The Hot Drink Mistake",
    flow: "<b>Relaxation Failure:</b> That warm coffee or tea is so comforting. It's relaxed your tummy, and now, your bladder.",
    guide: [
      { text: "SIPPING DRINK", time: 5, type: "stop" },
      { text: "FEEL THE WARMTH", time: 5, type: "relax" },
      { text: "WARMTH SPREADS...", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Point of No Return",
    flow: "<b>Exhaustion Failure:</b> You've held it for so long your muscles are shaking. They finally give out completely.",
    guide: [
      { text: "TREMBLING", time: 5, type: "stop" },
      { text: "MUSCLES GIVE OUT", time: 20, type: "push" }
    ]
  },
  {
    label: "The 'Just Sit Still' Fail",
    flow: "<b>Mental Failure:</b> Your only job was to sit still and not let go. You failed. You just let it happen.",
    guide: [
      { text: "SIT PERFECTLY STILL", time: 8, type: "stop" },
      { text: "A LITTLE VOICE SAYS 'GO'", time: 3, type: "relax" },
      { text: "YOU LISTEN", time: 12, type: "relax" }
    ]
  },
  {
    label: "The Pop Song Betrayal",
    flow: "<b>Distraction Failure:</b> A catchy song comes on and you start tapping your foot. The rhythm travels upwards...",
    guide: [
      { text: "TAP... TAP... TAP...", time: 6, type: "stop" },
      { text: "RHYTHMIC SPURTS", time: 6, type: "push" },
      { text: "BEAT DROPS", time: 8, type: "relax" }
    ]
  },
  {
    label: "The 'It's Just a Drip' Lie",
    flow: "<b>Miscalculation:</b> You feel a drip and ignore it. Then another. Then you realize it's not dripping anymore, it's flowing.",
    guide: [
      { text: "DRIP...", time: 3, type: "relax" },
      { text: "IGNORE IT", time: 3, type: "stop" },
      { text: "DRIP...DRIP...", time: 4, type: "relax" },
      { text: "OH, IT'S A STREAM NOW", time: 10, type: "relax" }
    ]
  },
  {
    label: "The Phantom Urge",
    flow: "<b>Miscalculation:</b> You pushed a little to see if the urge was real. It was. It very much was.",
    guide: [
      { text: "TEST PUSH", time: 1, type: "push" },
      { text: "CONFIRMED REAL", time: 2, type: "push" },
      { text: "CAN'T STOP", time: 15, type: "push" }
    ]
  },
  {
    label: "The Belly Rub Mistake",
    flow: "<b>Relaxation Failure:</b> You absent-mindedly rub your tummy, relaxing everything in the process.",
    guide: [
      { text: "FULL TUMMY", time: 4, type: "stop" },
      { text: "GENTLE BELLY RUBS", time: 6, type: "relax" },
      { text: "TOO RELAXED", time: 10, type: "relax" }
    ]
  },
   {
    label: "The Sudden Stop",
    flow: "<b>Mental Failure:</b> You suddenly stop what you're doing, realizing you've been ignoring the urge for too long. It's too late.",
    guide: [
      { text: "SUDDEN REALIZATION", time: 3, type: "stop" },
      { text: "PANIC SETS IN", time: 2, type: "push" },
      { text: "TOO LATE TO STOP", time: 18, type: "relax" }
    ]
  }
];


/* ---------- FULL d20 TABLES (Restored) ---------- */
/* Replaces FULL_D20 in app.js */

const FULL_D20 = [
  // LOW INTENSITY
  {
    label: "Spasm Series",
    flow: "<b>3-Step Spasm:</b> Push for 2s. Stop. Push for 2s. Stop. Push for 2s.",
    cls: "full_light",
    guide: [
      { text: "SPURT", time: 2, type: "push" },
      { text: "STOP", time: 2, type: "stop" },
      { text: "SPURT", time: 2, type: "push" },
      { text: "STOP", time: 2, type: "stop" },
      { text: "SPURT", time: 2, type: "push" }
    ]
  },
  {
    label: "Walking Leak",
    flow: "<b>Gait Release:</b> Take 5 steps. With every step, push out a small spurt.",
    cls: "full_light",
    tags: ['requires_walking'],
    guide: [
      { text: "STEP & SQUIRT", time: 1.5, type: "push" },
      { text: "HOLD", time: 1, type: "stop" },
      { text: "STEP & SQUIRT", time: 1.5, type: "push" },
      { text: "HOLD", time: 1, type: "stop" },
      { text: "STEP & SQUIRT", time: 1.5, type: "push" }
    ]
  },
  {
    label: "Failed Hold",
    flow: "<b>Brief Failure:</b> Release a strong stream for 5 seconds. Clamp down. Wait 2s. Release for 5s more.",
    cls: "full_light",
    guide: [
      { text: "GUSH", time: 5, type: "push" },
      { text: "CLAMP SHUT", time: 2, type: "stop" },
      { text: "GUSH", time: 5, type: "push" }
    ]
  },
  {
    label: "The Sprinkler",
    flow: "<b>Staccato:</b> Rapid fire spurts. Push-Relax-Push-Relax for 10 seconds.",
    cls: "full_light",
    guide: [
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" },
      { text: "PULSE", time: 1, type: "push" }, { text: "STOP", time: 1, type: "stop" }
    ]
  },

  // MEDIUM INTENSITY
  {
    label: "Daydream",
    flow: "<b>Zoned Out:</b> Release a continuous stream for 8 seconds.",
    cls: "full_moderate",
    guide: [{ text: "STEADY STREAM", time: 8, type: "relax" }]
  },
  {
    label: "The Squat",
    flow: "<b>Pressure Test:</b> Squat down. Empty bladder halfway (Count to 10). Stand up.",
    cls: "full_moderate",
    tags: ['requires_squat'],
    guide: [
      { text: "SQUAT DOWN", time: 3, type: "stop" },
      { text: "RELEASE HALF", time: 10, type: "relax" },
      { text: "STAND UP", time: 3, type: "stop" }
    ]
  },
  { label: "Lazy Release", flow: "<b>Slow Flow:</b> Lean back. Let a slow stream flow for a count of 20.", cls: "full_moderate", guide: [{ text: "SLOW DRIBBLE", time: 20, type: "relax" }] },
  { label: "Capacity Check", flow: "<b>Measured Release:</b> Strong stream for exactly 15 seconds.", cls: "full_moderate", guide: [{ text: "STRONG STREAM", time: 15, type: "push" }] },

  // HIGH INTENSITY
  { label: "Total Failure", flow: "<b>Total Letting Go:</b> Do not push. Just relax and empty completely.", cls: "full_heavy", guide: [{ text: "FLOOD", time: 25, type: "relax" }] },
  { label: "The Gush", flow: "<b>Forced Evacuation:</b> Push hard. Empty as fast as possible.", cls: "full_total", guide: [{ text: "FORCE IT OUT", time: 15, type: "push" }] },
  { label: "Submission", flow: "<b>No Control:</b> Release until 100% empty.", cls: "full_total", guide: [{ text: "EMPTY FULLY", time: 30, type: "relax" }] }
];


const RESTROOM_DISPATCH = [
  { text: "GO TO THE RESTROOM", time: 0, type: "stop" }
];

/* NEW: MOVEMENT CHALLENGES (15% chance to replace a full event) */
const MOVEMENT_CHALLENGES = [
  { label: "Check Challenge", desc: "Stand up immediately and stretch your arms overhead. If you leak, log it.", tags: ['requires_standing'] },
  { label: "Check Challenge", desc: "Sit down forcefully (bounce) on your chair." },
  { label: "Check Challenge", desc: "Press your hand firmly against your protection. Check for pushback." },
  { label: "Check Challenge", desc: "Do 5 squats immediately.", tags: ['requires_squat'] }
];

/* --- #2 MANUAL TABLES (Bowel - Manual Only) --- */

// Holding Gauntlets: 2-3 minute endurance holds in various positions
const MESSY_HOLDING_GAUNTLETS_D10 = [
  {
    name: "The Seated Clench",
    guide: [
      { text: "SIT UPRIGHT — FEET FLAT", time: 5, type: "stop" },
      { text: "CLENCH TIGHT", time: 15, type: "stop" },
      { text: "LEAN FORWARD — CHEST TO KNEES", time: 10, type: "stop" },
      { text: "HOLD POSITION — DON'T RELAX", time: 20, type: "stop" },
      { text: "SIT UP SLOWLY", time: 5, type: "stop" },
      { text: "TIGHTEN CORE — HOLD", time: 15, type: "stop" },
      { text: "CROSS LEGS — SQUEEZE", time: 20, type: "stop" },
      { text: "BREATHE SLOWLY — MAINTAIN HOLD", time: 15, type: "stop" },
      { text: "UNCROSS — CLENCH HARDER", time: 15, type: "stop" },
      { text: "FINAL HOLD", time: 10, type: "stop" }
    ]
  },
  {
    name: "Standing Endurance",
    tags: ['requires_standing'],
    guide: [
      { text: "STAND UP — LEGS TOGETHER", time: 5, type: "stop" },
      { text: "CLENCH EVERYTHING", time: 20, type: "stop" },
      { text: "SHIFT WEIGHT LEFT FOOT", time: 10, type: "stop" },
      { text: "SHIFT WEIGHT RIGHT FOOT", time: 10, type: "stop" },
      { text: "SQUEEZE GLUTES TIGHT", time: 15, type: "stop" },
      { text: "MARCH IN PLACE (slow)", time: 15, type: "stop" },
      { text: "STOP — LEGS TOGETHER — HOLD", time: 20, type: "stop" },
      { text: "BEND KNEES SLIGHTLY", time: 10, type: "stop" },
      { text: "STRAIGHTEN — FINAL CLENCH", time: 15, type: "stop" }
    ]
  },
  {
    name: "The Cramp Hold",
    tags: ['requires_floor'],
    guide: [
      { text: "LIE ON LEFT SIDE", time: 5, type: "stop" },
      { text: "KNEES TO CHEST — HOLD", time: 20, type: "stop" },
      { text: "STRAIGHTEN LEGS SLOWLY", time: 10, type: "stop" },
      { text: "CLENCH — DON'T LET GO", time: 20, type: "stop" },
      { text: "ROLL ONTO BACK", time: 5, type: "stop" },
      { text: "LEGS UP — FEET IN AIR", time: 15, type: "stop" },
      { text: "HOLD POSITION — BREATHE", time: 20, type: "stop" },
      { text: "LOWER LEGS — SQUEEZE HARD", time: 15, type: "stop" },
      { text: "FINAL HOLD — EVERYTHING TIGHT", time: 15, type: "stop" }
    ]
  },
  {
    name: "Squat and Survive",
    tags: ['requires_squat'],
    guide: [
      { text: "DEEP SQUAT — FEET FLAT", time: 5, type: "stop" },
      { text: "HOLD SQUAT — CLENCH", time: 25, type: "stop" },
      { text: "STAND HALFWAY", time: 5, type: "stop" },
      { text: "HOLD HALF-SQUAT", time: 20, type: "stop" },
      { text: "FULL STAND — LEGS TIGHT", time: 10, type: "stop" },
      { text: "BACK TO DEEP SQUAT", time: 5, type: "stop" },
      { text: "HOLD — DON'T GIVE IN", time: 25, type: "stop" },
      { text: "STAND — SQUEEZE EVERYTHING", time: 15, type: "stop" },
      { text: "REST — KEEP CLENCHING", time: 10, type: "stop" }
    ]
  },
  {
    name: "Pressure Building",
    guide: [
      { text: "SIT ON HARD SURFACE", time: 5, type: "stop" },
      { text: "ROCK HIPS FORWARD", time: 10, type: "stop" },
      { text: "ROCK HIPS BACK", time: 10, type: "stop" },
      { text: "HOLD STILL — CLENCH", time: 20, type: "stop" },
      { text: "PRESS HAND ON STOMACH", time: 10, type: "stop" },
      { text: "BREATHE DEEP — RESIST", time: 15, type: "stop" },
      { text: "SHIFT SIDE TO SIDE", time: 15, type: "stop" },
      { text: "STOP — SQUEEZE HARD", time: 20, type: "stop" },
      { text: "FINAL HOLD — DON'T MOVE", time: 15, type: "stop" }
    ]
  },
  {
    name: "The Belly Press",
    tags: ['requires_floor'],
    guide: [
      { text: "LIE FACE DOWN", time: 5, type: "stop" },
      { text: "PRESS BELLY INTO FLOOR", time: 15, type: "stop" },
      { text: "CLENCH — HOLD POSITION", time: 20, type: "stop" },
      { text: "LIFT HIPS SLIGHTLY", time: 10, type: "stop" },
      { text: "HOLD — EVERYTHING TIGHT", time: 20, type: "stop" },
      { text: "LOWER BACK DOWN", time: 5, type: "stop" },
      { text: "PRESS INTO FLOOR — FINAL", time: 20, type: "stop" },
      { text: "TIGHTEN EVERYTHING", time: 15, type: "stop" },
      { text: "BREATHE — MAINTAIN", time: 10, type: "stop" }
    ]
  },
  {
    name: "Walkabout",
    tags: ['requires_walking'],
    guide: [
      { text: "STAND — CLENCH FIRST", time: 5, type: "stop" },
      { text: "WALK SLOWLY — 10 STEPS", time: 15, type: "stop" },
      { text: "STOP — SQUEEZE HARD", time: 15, type: "stop" },
      { text: "WALK BACK — 10 STEPS", time: 15, type: "stop" },
      { text: "STOP — CROSS LEGS — HOLD", time: 15, type: "stop" },
      { text: "WALK AGAIN — FASTER", time: 10, type: "stop" },
      { text: "FREEZE — DON'T MOVE", time: 20, type: "stop" },
      { text: "CLENCH EVERYTHING", time: 15, type: "stop" },
      { text: "WALK TO START — FINAL", time: 10, type: "stop" }
    ]
  },
  {
    name: "Chair Grind",
    guide: [
      { text: "SIT HEAVILY IN SEAT", time: 5, type: "stop" },
      { text: "SHIFT FORWARD — CLENCH", time: 10, type: "stop" },
      { text: "GRIND HIPS IN CIRCLES", time: 15, type: "stop" },
      { text: "STOP — HOLD STILL", time: 20, type: "stop" },
      { text: "LEAN BACK — LEGS UP", time: 10, type: "stop" },
      { text: "HOLD — EVERYTHING TIGHT", time: 20, type: "stop" },
      { text: "SIT FORWARD AGAIN", time: 5, type: "stop" },
      { text: "BOUNCE LIGHTLY IN SEAT", time: 10, type: "stop" },
      { text: "STOP —FINAL SQUEEZE", time: 20, type: "stop" }
    ]
  },
  {
    name: "The Twist",
    tags: ['requires_standing'],
    guide: [
      { text: "STAND — FEET SHOULDER WIDTH", time: 5, type: "stop" },
      { text: "TWIST TORSO LEFT — HOLD", time: 10, type: "stop" },
      { text: "CLENCH THROUGH THE TWIST", time: 15, type: "stop" },
      { text: "CENTER — SQUEEZE", time: 10, type: "stop" },
      { text: "TWIST TORSO RIGHT — HOLD", time: 10, type: "stop" },
      { text: "CLENCH THROUGH THE TWIST", time: 15, type: "stop" },
      { text: "CENTER — DEEP BREATH", time: 10, type: "stop" },
      { text: "BEND FORWARD — HOLD", time: 15, type: "stop" },
      { text: "STAND — FINAL CLENCH", time: 15, type: "stop" }
    ]
  },
  {
    name: "Last Stand",
    tags: ['requires_standing'],
    guide: [
      { text: "STAND ON TIPTOES", time: 10, type: "stop" },
      { text: "CLENCH EVERYTHING", time: 15, type: "stop" },
      { text: "LOWER HEELS — SQUAT HALFWAY", time: 10, type: "stop" },
      { text: "HOLD HALF-SQUAT", time: 20, type: "stop" },
      { text: "STAND TALL — LEGS TIGHT", time: 15, type: "stop" },
      { text: "TIPTOES AGAIN — HOLD", time: 15, type: "stop" },
      { text: "LOWER — DEEP SQUAT", time: 10, type: "stop" },
      { text: "HOLD — IT'S ALMOST OVER", time: 20, type: "stop" },
      { text: "STAND — DONE", time: 5, type: "stop" }
    ]
  }
];

// Pushing Accidents: Varied by position with different push instructions
const MESSY_PUSHING_ACCIDENTS_D10 = [
  {
    name: "Seated Push",
    position: "sitting",
    desc: "Sitting in your chair. Lean forward, hands on knees.",
    guide: [
      { text: "SIT — LEAN FORWARD", time: 5, type: "push" },
      { text: "BEAR DOWN — STEADY PUSH", time: 8, type: "push" },
      { text: "HOLD PUSH — DON'T STOP", time: 10, type: "push" },
      { text: "RELAX 3 SECONDS", time: 3, type: "relax" },
      { text: "PUSH AGAIN — HARDER", time: 10, type: "push" },
      { text: "KEEP GOING", time: 8, type: "push" },
      { text: "FINAL PUSH", time: 5, type: "push" }
    ]
  },
  {
    name: "Standing Release",
    position: "standing",
    tags: ['requires_standing'],
    desc: "Stand with feet apart. Slight bend at the knees.",
    guide: [
      { text: "STAND — FEET WIDE", time: 5, type: "push" },
      { text: "BEND KNEES SLIGHTLY", time: 5, type: "push" },
      { text: "BEAR DOWN — LET GRAVITY HELP", time: 10, type: "push" },
      { text: "PUSH STEADY", time: 12, type: "push" },
      { text: "SHORT BREAK", time: 3, type: "relax" },
      { text: "PUSH THROUGH — FINISH", time: 10, type: "push" }
    ]
  },
  {
    name: "Deep Squat Fill",
    position: "squatting",
    tags: ['requires_squat'],
    desc: "Get into a deep squat. Feet flat on the ground.",
    guide: [
      { text: "DEEP SQUAT — FEET FLAT", time: 5, type: "push" },
      { text: "RELAX EVERYTHING BELOW", time: 5, type: "relax" },
      { text: "GENTLE PUSH DOWN", time: 8, type: "push" },
      { text: "HARDER — KEEP PUSHING", time: 10, type: "push" },
      { text: "HOLD PUSH", time: 8, type: "push" },
      { text: "BREATHE — FINAL PUSH", time: 10, type: "push" },
      { text: "LET IT FINISH", time: 5, type: "relax" }
    ]
  },
  {
    name: "On All Fours",
    position: "hands and knees",
    tags: ['requires_floor'],
    desc: "Get on your hands and knees. Head down.",
    guide: [
      { text: "HANDS & KNEES — HEAD DOWN", time: 5, type: "push" },
      { text: "ARCH BACK — PUSH DOWN", time: 10, type: "push" },
      { text: "STEADY PUSH — DON'T RUSH", time: 10, type: "push" },
      { text: "REST — KEEP POSITION", time: 5, type: "relax" },
      { text: "PUSH AGAIN — HARDER", time: 10, type: "push" },
      { text: "HOLD IT — ALMOST DONE", time: 8, type: "push" },
      { text: "FINAL EFFORT", time: 5, type: "push" }
    ]
  },
  {
    name: "Lying Accident",
    position: "lying down",
    tags: ['requires_floor'],
    desc: "Lie on your back. Knees bent, feet flat on the floor.",
    guide: [
      { text: "LIE DOWN — KNEES BENT", time: 5, type: "push" },
      { text: "LIFT HIPS SLIGHTLY", time: 5, type: "push" },
      { text: "BEAR DOWN FROM THIS POSITION", time: 10, type: "push" },
      { text: "LOWER HIPS — KEEP PUSHING", time: 8, type: "push" },
      { text: "PAUSE — BREATHE", time: 3, type: "relax" },
      { text: "HIPS UP AGAIN — PUSH HARD", time: 10, type: "push" },
      { text: "FINISH", time: 5, type: "push" }
    ]
  },
  {
    name: "The Slow Fill",
    position: "sitting",
    desc: "Seated upright. This one is slow and deliberate.",
    guide: [
      { text: "SIT TALL — RELAX", time: 5, type: "relax" },
      { text: "GENTLE PUSH — BARELY ANY EFFORT", time: 10, type: "push" },
      { text: "A LITTLE MORE", time: 10, type: "push" },
      { text: "REST — FEEL IT", time: 5, type: "relax" },
      { text: "PUSH AGAIN — SLOWLY", time: 10, type: "push" },
      { text: "KEEP GOING — NO RUSHING", time: 10, type: "push" },
      { text: "LET IT FINISH NATURALLY", time: 8, type: "relax" }
    ]
  },
  {
    name: "Quick Standing Load",
    position: "standing",
    tags: ['requires_standing'],
    desc: "Stand normally. This happens fast.",
    guide: [
      { text: "STAND — FEET TOGETHER", time: 3, type: "push" },
      { text: "PUSH HARD — NOW", time: 8, type: "push" },
      { text: "DON'T STOP — KEEP GOING", time: 8, type: "push" },
      { text: "HARDER", time: 5, type: "push" },
      { text: "ALMOST THERE", time: 5, type: "push" },
      { text: "DONE", time: 3, type: "relax" }
    ]
  },
  {
    name: "Squat Waves",
    position: "squatting",
    tags: ['requires_squat'],
    desc: "Half-squat position. Push in waves with breaks between.",
    guide: [
      { text: "HALF SQUAT — READY", time: 5, type: "push" },
      { text: "WAVE 1 — PUSH", time: 8, type: "push" },
      { text: "STOP — CLENCH", time: 5, type: "stop" },
      { text: "WAVE 2 — PUSH HARDER", time: 8, type: "push" },
      { text: "STOP — CLENCH", time: 3, type: "stop" },
      { text: "WAVE 3 — FULL PUSH", time: 10, type: "push" },
      { text: "LET IT ALL GO", time: 8, type: "relax" }
    ]
  },
  {
    name: "Seated Strain",
    position: "sitting",
    desc: "Sitting on edge of chair. Lean way forward.",
    guide: [
      { text: "EDGE OF SEAT — LEAN FORWARD", time: 5, type: "push" },
      { text: "HANDS ON FLOOR — PUSH", time: 10, type: "push" },
      { text: "STRAIN — KEEP BEARING DOWN", time: 12, type: "push" },
      { text: "SIT UP — CATCH BREATH", time: 5, type: "relax" },
      { text: "LEAN FORWARD — PUSH AGAIN", time: 10, type: "push" },
      { text: "FINAL STRAIN", time: 8, type: "push" }
    ]
  },
  {
    name: "Side-Lying Load",
    position: "lying on side",
    tags: ['requires_floor'],
    desc: "Lie on your left side. Knees pulled up.",
    guide: [
      { text: "LEFT SIDE — KNEES UP", time: 5, type: "push" },
      { text: "RELAX COMPLETELY", time: 5, type: "relax" },
      { text: "GENTLE PUSH", time: 8, type: "push" },
      { text: "INCREASE EFFORT", time: 10, type: "push" },
      { text: "HOLD PUSH — STEADY", time: 10, type: "push" },
      { text: "EASE OFF — BREATHE", time: 5, type: "relax" },
      { text: "ONE MORE PUSH — DONE", time: 8, type: "push" }
    ]
  }
];


