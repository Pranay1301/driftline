# Driftline - Five-Day Calendar Log

## Timeline disclosure

Work began on **12 October 2026**. The implementation and same-day rehearsal happened on Day 1. No task work was performed on 13-15 October; those dates are recorded plainly instead of being filled with reconstructed activity. Work resumed on 16 October for the final verification and submission audit. This is an honest five-date log with two activity days, not a claim of five full workdays.

| Calendar day | Date | Honest status |
|---|---|---|
| Day 1 | 2026-10-12 | COMPLETE - five build passes |
| Day 2 | 2026-10-13 | DOCUMENTED - NO WORK PERFORMED |
| Day 3 | 2026-10-14 | DOCUMENTED - NO WORK PERFORMED |
| Day 4 | 2026-10-15 | DOCUMENTED - NO WORK PERFORMED |
| Day 5 | 2026-10-16 | COMPLETE - FINAL VERIFICATION |

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
- Preserved explicit limits: calendar days, fixed stage taxonomy, browser memory, 2 MB / 25,000-row / 64-column workload ceilings, no ATS sync, authentication, automatic messaging, or production-readiness claim.
- Kept all Day-1 work on its actual date rather than distributing it across later calendar entries.

**Final Day-1 evidence:** `npm test` and `npm run benchmark` results are copied from `docs/final-evidence.json`; that manifest is the only numeric source of truth.

**Manual dependency:** record/upload the final five-minute demo to Loom and paste the authenticated share link.

## Same-day evaluation rehearsal - 2026-10-12 - COMPLETE, NOT ADDITIONAL CALENDAR DAYS

The user asked to run the recommended Day 2-5 checks immediately and improve guardrails. I ran those tasks as additional Day-1 work. This increases verification coverage but does **not** convert 12 October into four later calendar days.

- Re-ran fast, standard, and slow-stage below/exact/above boundaries.
- Re-ran malformed, contradictory, duplicate, inert-HTML, formula-prefix, sensitive-field, and export checks.
- Added parser-level ceilings of 2 MB, 25,000 data rows, and 64 columns.
- Made missing or duplicate required headers fail closed before ranking.
- Added `NEEDS_HUMAN_REVIEW`, `WORKFLOW_DELAY_ONLY`, and the as-of date to every queue export.
- Replaced “call” and “chase” language with approved-channel and professional follow-up wording.
- Separated the canonical CLI snapshot from the live, device-specific browser benchmark in the interface.
- Rehearsed the browser path with the synthetic CSV: upload, 7-to-10-day sensitivity change, search, stage and owner filters, visible rank arithmetic, adversarial demo, and filtered export. The export retained global ranks 6-8 and all three review-boundary fields.
- Tabbed from the skip link through navigation, primary actions, the drop zone, and CSV button; no browser console warnings or errors appeared.

**What broke:** the first expanded suite passed 38 of 39 tests. The old combined test expected malformed-row-width inspection to continue after missing headers. That expectation contradicted the new fail-closed rule. I split the two cases: missing headers now stop parsing, while malformed widths remain visible when the header structure is safe. The corrected suite passed 39/39.

**Evidence:** `tests/core.test.mjs`, `tests/frontend.test.mjs`, `src/core.js`, `src/index.html`, and `docs/final-evidence.json`.

## Day 2 - 2026-10-13 - DOCUMENTED, NO WORK PERFORMED

No prompts, code changes, tests, benchmarks, or browser checks were performed on this date. The planned boundary rerun did not happen. Recording the gap is more accurate than converting the Day-1 rehearsal into Day-2 evidence.

## Day 3 - 2026-10-14 - DOCUMENTED, NO WORK PERFORMED

No prompts, code changes, tests, benchmarks, or export inspection were performed on this date. The adversarial corpus remained covered by the Day-1 automated suite, but it was not rerun as a new Day-3 experiment.

## Day 4 - 2026-10-15 - DOCUMENTED, NO WORK PERFORMED

No prompts, code changes, tests, or fresh browser session were performed on this date. The browser evidence remains the dated Day-1 rehearsal; it is not relabeled as Day-4 work.

## Day 5 - 2026-10-16 - COMPLETE, FINAL VERIFICATION

**Load:** Decide whether the submission is actually ready without rewriting the inactive days.

- Re-ran `npm test`: 39/39 passed, 0 failed.
- Re-ran `npm run build`: the static build completed successfully.
- Ran a fresh canonical benchmark with 5 warmups and 25 measured runs. At 10,000 rows the engine measured 44.34 ms median / 57.80 ms p95 with correctness PASS.
- Validated the code ZIP with `unzip -t` and confirmed the five-minute MP4 is 302.84 seconds.
- Verified anonymous public access: HTTP 200, zero redirects, active public Site version 6 before the documentation refresh.
- Audited Git history and file timestamps. They showed implementation commits only on 12 October, which confirmed that 13-15 October must remain no-work entries.
- Synchronized the manifest, README, directive, benchmark report, unlearning note, demo evidence, and Site proof surface to this Day-5 snapshot.

**What changed:** The five-date log is now complete without inventing three days of activity. The release narrative distinguishes elapsed dates, activity days, and no-work days.

**Evidence:** `docs/final-evidence.json`, the Day-5 command output, the rebuilt submission ZIP, refreshed media, and the public Site deployment.

**Manual dependency:** the final Loom recording/upload remains intentionally separate and will be completed by the applicant before submission.

## Inspectable AI-use receipts

See `docs/ai-evidence.md`. It separates retained instructions from reconstructed prompt summaries and records what AI proposed, how the proposal was checked, and what changed.
