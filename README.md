# Faculty Portal: Attendance Practice

A browser-only training simulation that walks faculty through posting class
attendance in a look-alike of EAC's Anthology Self-Service Faculty Portal. It
runs entirely in the browser: no login, no server, no network, and nothing is
saved or sent.

## Run it

Open `index.html` in any modern browser. That is it.

A single-file version, `Attendance-Training.html`, is also provided. It has the
styles, scripts, and images baked in, so you can email it or drop it on a shared
drive and people can just open the one file.

## Two ways to learn

When the simulation opens, the learner picks a mode:

- **Guided walkthrough.** The page dims with a spotlight on the next control, a
  short callout explains what to do and why, and a leader line connects the two.
  Advance by clicking the highlighted control. A "Step n of 10" counter tracks
  progress. Best for someone doing this for the first time.
- **Practice run.** No prompts. A short task and a checklist sit in the corner
  and the learner drives themselves. Wrong clicks get a gentle nudge, then a
  specific hint if they are stuck. Good for returning faculty refreshing the
  steps.

The first screen (the mode chooser) is always one click away: "Start over" in
the corner of the guided callout, the "Start over" link in the practice panel,
and the buttons on the finish screen all return to it.

## The task

Post attendance for the **06/03/2026** meeting of **Beginning Ceramics I
(U2045)** in **Summer 2026**: everyone is Present except **Susan Wood-Belate
(Absent)** and **Kevin Peckmark (Excused)**. The flow covers entering the
Faculty Portal, signing in, opening the Gradebook, setting the term, opening the
class, choosing the meeting date, editing the roster, and posting with Update.

## Files

- `index.html`: page shell, left nav, header, the coach panel, and the intro overlay.
- `styles.css`: all styling (the original EAC look, plus the tour and intro additions).
- `steps.js`: the scenario config and the step-by-step copy.
- `app.js`: the controller, including portal data, rendering, validation, and both modes.
- `assets/`: logos and icons used by the portal screens.
- `Attendance-Training.html`: the standalone single-file build.
- `build_standalone.py`: rebuilds the single-file version from the sources.

## Reusing this for a different attendance entry

Everything about the scenario lives in one place: `attendanceSimulationConfig`
at the top of `steps.js` (term, course, meeting date, and who to mark). The
"who to mark" targets are keyed by **student id**, so you can rename students in
`portalData` (in `app.js`) without breaking the check that decides when the
roster is ready to post. Update both the config and the student list to match
your scenario, and freshen the step copy in `steps.js` (the placeholders
`{TERM}`, `{COURSE}`, `{DATE}`, and `{TARGETS}` fill themselves from the config).
If you edit the source files, rebuild the single-file version with
`build_standalone.py`.

## Accessibility

Keyboard focus moves to the relevant control as each step renders, the coach
panel announces guidance politely, calendar dates that need posting carry their
state in their label, and the highlight pulse and smooth scrolling are turned
off under "reduce motion."
