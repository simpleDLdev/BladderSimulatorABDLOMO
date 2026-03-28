// whats-new-data.js
// List of recent updates for the What's New modal. Update this file with each release/commit.

window.WHATS_NEW_COMMITS = [
  {
    hash: 'f5002d0',
    date: '2026-03-28',
    title: 'Centralized/refactored profile/session logic',
    bullets: [
      'All session/queue/tracking logic moved to profile-logic.js',
      'UI and guide modules now use shared helpers',
      'Hydration/timer logic improved',
      'UI/UX tweaks and bug fixes',
    ]
  },
  {
    hash: '778dc18',
    date: '2026-03-27',
    title: 'Major fixes for custom profiles and hydration',
    bullets: [
      'Custom profile support fixed and improved',
      'Hydration event logic more robust',
      'Timer and event handling fixes',
    ]
  },
  {
    hash: '4a62dba',
    date: '2026-03-27',
    title: 'Custom profile bugfixes',
    bullets: [
      'Fixed bugs in custom profile loading',
      'Improved error handling for custom data',
    ]
  },
  {
    hash: 'ee8a3bc',
    date: '2026-03-27',
    title: 'Support up to 10x scaling',
    bullets: [
      'Scaling timer for larger bladders',
      'UI reflects new scaling options',
    ]
  },
  {
    hash: '9e9ec62',
    date: '2026-03-27',
    title: 'Scaling timer for bigger bladders',
    bullets: [
      'Timer logic now supports larger bladder profiles',
      'Guide and state modules updated',
    ]
  }
];
