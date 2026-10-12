# Driftline - Five-Day Calendar Log

## Timeline disclosure

Work began on **12 October 2026**. Everything currently completed happened on that calendar day in five build passes. Those passes are recorded under Day 1 below; they are **not** five elapsed days. Days 2-5 remain planned until their dated experiments are actually performed. Planned entries are not evidence and must not be marked complete or backdated.

| Calendar day | Date | Honest status |
|---|---|---|
| Day 1 | 2026-10-12 | COMPLETE - five build passes |
| Day 2 | 2026-10-13 | PLANNED - NOT YET EVIDENCE |
| Day 3 | 2026-10-14 | PLANNED - NOT YET EVIDENCE |
| Day 4 | 2026-10-15 | PLANNED - NOT YET EVIDENCE |
| Day 5 | 2026-10-16 | PLANNED - NOT YET EVIDENCE |

## Day 1 - 2026-10-12 - COMPLETE

### Pass 1 - Define before generating

**Load:** Make stalled, priority, and done falsifiable before implementation.

- AI proposed a stage-aware hiring stall alerter, deterministic ranking, local browser workflow, and hostile-data matrix.
- I accepted the idea that a check-in does not reset stage movement.
- I rejected runtime free-form generation and candidate-quality inference because neither was needed to answer the operational question safely.
- I mapped every required option-C behavior to a visible interface behavior or test and checked that each ranking input could be explained from the CSV.

**What changed:** I moved AI into specification attack instead of asking it to implement a vague idea. The shipped runtime remained deterministic.

**Evidence:** `docs/intent.md`, the schema, stage-factor table, non-goals, and acceptance list.

### Pass 2 - Attack the rules

**Load:** Boundaries, terminal stages, malformed dates, quoted commas, Unicode, sensitive extras, duplicates, unknown values, and contradictory dates.

- Prompt summary reconstructed from the work record: ask AI to red-team silent drops, fairness errors, unstable ties, prompt injection, HTML, and spreadsheet injection.
- AI proposed exact-threshold, future-date, duplicate-ID, terminal-stage, quoted-comma, and formula-prefix cases.
- I accepted visible quarantine of every duplicate instead of silently keeping one.
- I constrained dates to `YYYY-MM-DD` rather than pretending to support ambiguous timestamps.
- Post-review tests cover one day below, exactly at, and one day above the limit for fast, standard, and slow stages. Empty input, duplicate headers, invalid stages, invalid responsibility values, malformed optional dates, and a due date before stage entry are also checked.

**What broke:** The first fictional CSV encoded terminal outcomes in `waiting_on` while leaving active stages. Inspection caught the schema error before it became a misleading edge case.

**Evidence:** `sample-data/hiring_board.csv`, `sample-data/adversarial.csv`, and `tests/core.test.mjs`.

### Pass 3 - Make priority auditable

**Load:** Visible arithmetic, deterministic ties, fairness invariants, and a fixed sample oracle.

- AI proposed an uncapped normalized stage-age term so an old early-stage case could not be starved by smaller bonuses.
- I accepted documented bonuses for an overdue commitment, responsibility, and contact age.
- I kept names and roles outside the score and action.
- I rejected probability, candidate-risk, and recruiter-performance inferences.

**What broke:** A milestone test run failed 16/17 because I expected seven distinct queue owners while the program reported six. Manual inspection showed six was correct because owners repeated. I corrected the oracle, not the implementation. The 17/17 result is a historical milestone, not the final release count.

**Evidence:** score-component assertions, input-order invariance, identity-field invariance, and fixed-sample reconciliation in `tests/core.test.mjs`.

### Pass 4 - Test the human workflow

**Load:** Browser interaction, sensitivity, filtering, explanations, validation, responsive layout, and export consistency.

- Verified the sample at base 7 produces 9 queue rows and base 10 produces 5.
- Inspected Jordan's visible arithmetic: `225 + 30 + 15 + 8 = 278`.
- Verified imported HTML stays inert and spreadsheet-formula prefixes are neutralized.
- Browser reading exposed “against a 11-day limit”; I corrected it to “against the 11-day limit.”
- A stale service worker captured a common local port, proving that HTTP success did not prove the correct app was visible. Driftline moved to port 8765.
- Post-review browser audit covered 390, 500, 821, 1180, and 1440 pixel widths with no horizontal overflow and no console warnings or errors.
- Post-review audit also found two product bugs: filtered export ranks were renumbered, and demo loaders retained stale controls. Both received regression tests and fixes.

**Evidence:** browser checks, responsive-width records in `docs/final-evidence.json`, inspected export, and frontend/core regression tests.

### Pass 5 - Try to disprove done

**Load:** Scale, packaging, public access, reproducibility, honest cuts, and evidence consistency.

- Ran the final suite and benchmark from one source state and recorded one canonical snapshot in `docs/final-evidence.json`.
- Verified anonymous access to the public URL returns Driftline with HTTP 200 and no redirect.
- Added evidence-drift checks so stale test and benchmark figures fail the suite.
- Preserved explicit limits: calendar days, fixed stage taxonomy, browser memory, 2 MB UI limit, no ATS sync, authentication, automatic messaging, or production-readiness claim.
- Corrected the submission story instead of hiding the fact that only one calendar day has elapsed.

**Final Day-1 evidence:** `npm test` and `npm run benchmark` results are copied from `docs/final-evidence.json`; that manifest is the only numeric source of truth.

**Manual dependency:** record/upload the final five-minute demo to Loom and paste the authenticated share link.

## Day 2 - 2026-10-13 - PLANNED, NOT YET EVIDENCE

From a clean copy, rerun the exact/below/above threshold matrix across multiple stages. Record the actual commands, output, any disagreement, and resulting change. Do not replace this section with a completed entry before the work happens on this date.

## Day 3 - 2026-10-14 - PLANNED, NOT YET EVIDENCE

Run the malformed, contradictory, duplicate, HTML, formula, and sensitive-field corpus again. Inspect both the validation report and queue export. Record actual failures and decisions only.

## Day 4 - 2026-10-15 - PLANNED, NOT YET EVIDENCE

Perform the browser workflow in a fresh session: upload, threshold change, each filter, search, rank explanation, full filtered export, keyboard use, reduced-motion behavior, and narrow viewport. Record the tested browser and widths.

## Day 5 - 2026-10-16 - PLANNED, NOT YET EVIDENCE

Verify anonymous public access, reproduce the README from a clean start, run the synchronized final test/benchmark snapshot, audit every submitted number, record the final video, and freeze the release. Mark complete only after these actions occur on this date.

## Inspectable AI-use receipts

See `docs/ai-evidence.md`. It separates retained instructions from reconstructed prompt summaries and records what AI proposed, how the proposal was checked, and what changed.
