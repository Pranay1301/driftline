# Driftline Final Evidence and Benchmark Report

**Evidence ID:** `driftline-2026-10-12T20:42:00+05:30`
**Captured:** 2026-10-12 20:42:00 IST
**Canonical machine record:** `docs/final-evidence.json`

## Release gate

`npm test`: **39/39 passing, 0 failing**.

This count includes engine, adversarial-corpus, benchmark, frontend-safety, demo-reset, global-export-rank, safety-boundary, and evidence-consistency checks. Historical counts of 17, 21, 25, 32, 33, or 34 describe intermediate source states and are not release claims.

## Repeatable CLI benchmark

Command: `npm run benchmark`

Scope: deterministic CSV generation happens once outside the timer. Each measured run includes CSV parsing, required-header and row validation, stage normalization, stage-aware thresholding, score calculation, explanation/action construction, and deterministic sorting. File I/O, network time, DOM rendering, and queue-card creation are excluded. Five warmups precede 25 measured runs; no outlier is removed. P95 uses linear interpolation.

Environment: Apple M2, 8 GB memory, arm64, macOS 26.5.1 (25F80), Node v24.21.0.

| Rows | Median | P95 | Rows/second at median | Correctness |
|---:|---:|---:|---:|---:|
| 100 | 0.39 ms | 0.66 ms | 255,320 | PASS |
| 1,000 | 3.84 ms | 4.51 ms | 260,086 | PASS |
| 10,000 | 40.38 ms | 49.26 ms | 247,628 | PASS |

Every measured result was accepted only because its fixed output signature was correct and deterministic. The 10,000-row result is **40.38 ms median / 49.26 ms p95**, correctness PASS. The p95 is reported as observed; it is not removed to make the result look smoother.

These measurements establish only how this prototype's engine behaved on one machine. They do not establish server capacity, concurrent-user behavior, DOM performance for 10,000 rendered cards, or production readiness.

## Correctness and adversarial matrix

| Load raised | Reproducible check | Result |
|---|---|---|
| Inclusive boundary | One day below, exactly at, and one day above fast Offer, standard Interview, and slow Assessment limits | PASS |
| Empty/structural input | Empty file, missing headers, duplicate headers, malformed field widths | PASS |
| Workload limits | More than 2 MB, 25,000 rows, or 64 columns is rejected before ranking | PASS |
| Fail-closed structure | Missing or duplicate required headers produce no ranked rows | PASS |
| Operational values | Unknown stage and invalid `waiting_on` values remain visible as invalid | PASS |
| Dates | Invalid, future, and next-step-before-stage-entry dates are quarantined | PASS |
| Duplicates | Every occurrence of a duplicate application ID is quarantined | PASS |
| Identity invariance | Name, role, and ignored sensitive fields do not change score/action | PASS |
| Rendering safety | Imported HTML is rendered as text; executable HTML sinks are forbidden | PASS |
| Export safety | `=`, `+`, `-`, `@`, tab, and carriage-return formula prefixes are neutralized | PASS |
| Review boundary | Every queue export carries `NEEDS_HUMAN_REVIEW`, `WORKFLOW_DELAY_ONLY`, and its as-of date | PASS |
| Filtered export | Complete filtered order is retained and displayed global ranks are preserved | PASS |
| Demo truthfulness | Every bundled demo restores as-of date, base 7, blank search, and all filters before analysis | PASS |
| Sensitivity | Base 7 produces 9 sample flags; base 10 produces 5 | PASS |
| Sample reconciliation | 18 input = 9 stalled + 2 healthy + 3 terminal + 4 invalid | PASS |

## Browser and public-access verification

- Anonymous public request: HTTP 200, zero redirects, correct Driftline title.
- Public URL: <https://driftline-pranay-2026-x20.blondpearl1024.chatgpt.site/>
- Viewports exercised: 390, 500, 821, 1180, and 1440 CSS pixels.
- At every width, document `scrollWidth` equaled `innerWidth`; no horizontal overflow was observed.
- No current-page console warning or error was present.
- Workflow checks covered baseline reset, 7-to-10 sensitivity, search and all filters, rank explanation, validation, adversarial data, browser benchmark, and full filtered-queue export.

This verifies responsive browser behavior at the stated widths. It is not a claim of physical-device coverage or a full assistive-technology audit.

## Evidence integrity

The engine files used for the benchmark are identified in `docs/final-evidence.json` by SHA-256. This report, README, final directive, unlearning note source, demo script, and site proof counter are checked against the same manifest by `tests/evidence.test.mjs`.

Only one calendar day is complete. Days 2-5 in `docs/five-day-log.md` remain plans, not evidence.
