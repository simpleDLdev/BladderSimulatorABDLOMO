# ABDL Bladder Sim

ABDL Bladder Sim is a browser-based routine and pacing tool for timed wetting, holding, diaper use, training, regression-style loops, and nighttime play.

At its core, the app does one thing: it gives you prompts, events, and structure, and you keep the sim honest by updating your current state. If your body says one thing and the app says another, your body wins and you update the sliders to match reality.

There is no install step, no backend, and no account system. Open `index.html` in a browser and use it locally.

## What This App Is Good At

- Giving you timed prompts and event pacing for full sessions.
- Letting you track urgency and wetness in a simple, consistent way.
- Supporting several very different play styles without needing separate tools.
- Handling protection choice, optional stash tracking, changes, and emergency reporting.
- Letting you create or import custom profile packs.

## Quick Start

1. Open `index.html` in your browser.
2. Click `Start Session`.
3. Choose a session type:
	- `Quick Session` for button-driven rolls.
	- `Full Session` for timed prompts and structured events.
	- `Bedwetting` for nighttime wake and morning checks.
4. Pick a profile or open the custom profile editor.
5. Follow the alarm, log, and guide prompts.
6. Keep `Urgency` and `Saturation` updated to reflect what is actually happening.

## The Main Panels

### Session Control

This is where you start and stop runs.

- `Start Session` opens the setup flow.
- `Pause Alarm (30m)` temporarily suspends alarms.
- `Custom Profiles (Create / Import / Export)` opens the custom pack editor.
- `I Need to Go!` appears in Quick Session.
- `Morning Check` appears in Bedwetting mode.

### Bio-Logger

This is the part that matters most. It is your reality tracker.

- `Urgency` is how badly you need to pee right now.
- `Saturation` is how wet your current protection is right now.
- `Confirm Status` is the clean way to tell the app, "this is where I am now."
- `Emergency` is for reporting that you leaked through, had an accident, or need the sim to react immediately.

### Protection

This tracks what you are wearing and, optionally, how much you have left.

- Switch between `None`, `Pad`, `Pullups`, `Diapers`, and `Thick Diapers`.
- Optional stash tracking lets you count actual supplies.
- The stash is shared across modes.

### Maintenance

This is where you handle care and recovery actions.

- `Change Diaper` becomes available when the profile grants a change or when saturation reaches 100%.
- `I cant hold it !` forces an accident flow.
- `Mercy` helps in modes that allow partial recovery after smaller accidents.

### Log

The log is the running story of your session.

- Event reveals
- Guide prompts
- Alarm outcomes
- Babysitter reactions
- Progression changes
- Check-ins and emergency results

## Understanding The Sliders

The app works best when the sliders are treated as honest state, not as goals.

### Urgency

Urgency is shown as a 0 to 10 feeling scale.

- `0-2`: calm, little or no urge.
- `3-4`: noticeable but manageable.
- `5`: clear urge, harder to ignore.
- `6-7`: active holding, leaks become more plausible.
- `8`: strong urgency, close calls are likely.
- `9`: emergency zone.
- `10`: you are on the edge or actively losing control.

### Saturation

Saturation is percentage-based. It is not protection-specific math and it is not supposed to overflow early just because you are wearing something lighter.

- `0-30%`: light use.
- `35-70%`: clearly wet.
- `80-95%`: heavy, risky, close to failure.
- `100%`: full. Change or leak-through territory.
- `100%+`: overflow state used by some accident and emergency flows.

## Important Behavior Change

The saturation system was corrected.

Older behavior could treat lighter protection like it should leak at values such as 25% or 50%, because the app was mistakenly comparing saturation against raw protection capacity numbers. That is no longer how it works.

Current behavior:

- Saturation is tracked as a straight percentage.
- Overflow now happens at `100%`, not at the raw pad or diaper capacity number.
- A value like `35%` means `35% full`, not `leaking already`.
- Change access tied to overflow now uses the same `100%` rule.
- Babysitter and emergency logic were updated to use percentage thresholds consistently.

## Session Types

### Quick Session

For fast play. You press `I Need to Go!` when you feel the urge and the app rolls an outcome.

Good for:

- Short sessions
- Dice-style play
- Less passive waiting

### Full Session

The main mode. Timed events, alarms, hold prompts, progression systems, and profile-specific behavior live here.

Good for:

- Longer sessions
- Structured pacing
- Caregiver or regression loops
- Training and challenge runs

### Bedwetting

Night-focused mode with wake checks, accident chance, and morning review.

Good for:

- Nighttime scenes
- Sleep or half-asleep pacing
- Dry-vs-wet morning outcomes

## Included Profiles

### Rookie

Training mode with weaker control and more slip-ups. Good first stop if you want structure but not full chaos.

### Pro

A stronger training profile with better odds and more deliberate control pressure.

### Dependent

High-intensity passive leaking. The profile assumes reduced control and frequent involuntary wetting.

### Not Potty Trained

A background-style profile with more passive wetting flow and less active potty structure.

### Omorashi

Focused hold-and-release play with dedicated hold checks and an emergency leak report button.

### Babysitter

The most involved profile.

It includes:

- Protection progression
- Continence level setup
- Optional symptoms and curses
- Potty permission requests
- Check-ins and reactions
- Accident tracking
- Progress toward lighter or heavier protection
- Optional NPT behavior inside the babysitter flow

### Gauntlet Only

Challenge-style holds and exercise prompts without the usual bladder sim pacing.

### Custom

Build your own profile pack or import one from JSON.

## Extra Options And Tools

- `Desk Mode` filters out events that require movement or awkward actions and is meant for work or seated use.
- `Involuntary Filter` can further cut events you may not want in desk situations.
- `Messy Mode` enables the `Uh Oh...` button for messier accident handling.
- `Hydration` tools appear in modes that support them.
- The inline event browser lets you preview, search, try, or disable events.
- The full event builder is available from the guide overlay.

## Custom Profiles

Use `Custom Profiles (Create / Import / Export)` to create your own packs.

Supported workflow:

- Create a profile in the editor.
- Import from JSON file.
- Import from clipboard.
- Export and share your pack.
- Save packs in browser storage for reuse on the same machine.

Runtime custom events are merged into the active profile, so custom packs can change both micro events and full events.

## Sample Test Packs

The repository includes sample JSON packs in `testProfiles/`:

- `easy-starter.json`
- `medium-challenge.json`
- `hard-no-mercy.json`
- `dependent-deep.json`

These are useful for testing import flow, checking balance, or giving yourself a quick preset to start from.

## Protection And Stash Tracking

Protection levels currently used by the app:

- `None`
- `Pad`
- `Pullups`
- `Diapers`
- `Thick Diapers`

If stash tracking is enabled, the app will count your available supplies and keep a shared total across modes. If stash tracking is off, counts are treated as unlimited.

## A Few Practical Tips

- If prompts feel too aggressive, lower urgency so the sim matches where you actually are.
- If the session feels too slow, raise urgency to match your real state instead of waiting for the app to catch up.
- Use `Pause Alarm (30m)` when real life interrupts you.
- Use `Emergency` when something significant happened and you want the app to react immediately rather than waiting for the next cycle.
- If you are using Babysitter, treat `continence` and `protection` as separate things. They are not the same system.

## Known Rough Edges

Some parts of the app are still experimental.

- Babysitter symptoms and curses are marked in the UI as likely buggy.
- Custom profile combinations can be much harsher or stranger than built-in modes.
- The app is feature-rich enough that some interactions are still being tuned.

## File Layout

- `index.html` contains the main UI.
- `styles.css` contains the styling.
- `js/` contains the engine, UI logic, guide logic, state, tables, and profile-specific behavior.
- `js/profiles/` contains focused profile modules.
- `testProfiles/` contains example import packs.

## Bottom Line

This app works best when you use it as a pacing partner, not as an authority. Keep the sliders truthful, pick the mode that matches the kind of session you want, and let the structure do the rest.
