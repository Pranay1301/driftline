# Driftline — Five-Day Build Log

## Honesty note

This assignment was built in five deliberate work passes during one AI-assisted sprint on **12 October 2026**, not over five elapsed calendar days. I am keeping the required Day 1–Day 5 structure because each pass raised a distinct load. I am not inventing future dates or claiming pauses that did not happen. The compressed timeline is itself part of the AI-first experiment.

Each entry separates what AI proposed from what I checked and decided.

## Day 1 — Define before generating

**Status:** Complete work pass  
**Load attempted:** Make “stalled,” “priority,” and “done” falsifiable before implementation.

### Intended outcome

Choose one assignment format, bound the decision, define non-goals, and write an initial acceptance contract.

### AI use

- I split the brief into three bounded critiques: product architecture, submission narrative, and adversarial QA.
- AI proposed a stage-aware hiring stall alerter, a deterministic score, a local browser workflow, and a hostile-data matrix.
- I accepted the core idea that a check-in does not reset stage movement.
- I rejected runtime free-form generation and candidate-quality inference because neither was needed to answer the operational question safely.

### Checks

- Mapped every requested behavior in option C to one visible interface or test.
- Checked that every ranking input could be explained from the CSV.

### What broke or surprised me

The easiest-sounding model—“oldest candidate first”—was not neutral. It ignored stage urgency, explicit commitments, and responsibility while still looking objective.

### Decision and unlearning

I moved AI earlier, into specification attack, instead of asking it to code a vague idea. The shipped runtime would be deterministic; AI would widen and challenge the build process.

### Evidence

`docs/intent.md`, schema, stage-factor table, non-goals, acceptance list.

### Next load

Make clean-looking sample data fail in explicit ways.

## Day 2 — Attack the rules

**Status:** Complete work pass  
**Load attempted:** Boundaries, terminal stages, malformed dates, quoted commas, Unicode, sensitive extras, and duplicates.

### Intended outcome

Build the CSV/parser contract and adversarial fixtures before trusting the ranking.

### AI use

- Prompt summary: “Red-team a hiring-board stall alerter; look for silent drops, fairness errors, unstable ties, prompt injection, HTML, and spreadsheet injection.”
- AI proposed exact-threshold, future-date, duplicate-ID, terminal-stage, quoted-comma, and formula-prefix cases.
- I accepted visible quarantine of every duplicate rather than silently keeping one.
- I constrained dates to `YYYY-MM-DD` rather than pretending to handle ambiguous timestamps and time zones.

### Checks

- Parsed BOM, CRLF, quoted commas, escaped quotes, and Unicode.
- Verified below-threshold, exact-threshold, future, invalid, terminal, and duplicate rows.

### What broke or surprised me

My first fictional CSV encoded `rejected` and `withdrawn` in the `waiting_on` column while leaving active interview/applied stages. Inspection caught the schema mistake before it became a misleading “edge case.”

### Decision and unlearning

I stopped treating sample data as decoration. It became a test oracle with a reconciliation equation.

### Evidence

`sample-data/hiring_board.csv`, `sample-data/adversarial.csv`, parser and validation tests.

### Next load

Make every ranking component auditable and try to disprove the expected total.

## Day 3 — Make priority auditable

**Status:** Complete work pass  
**Load attempted:** Visible score arithmetic, deterministic ties, fairness invariants, and a fixed sample oracle.

### Intended outcome

Turn valid active rows into a stable queue where the displayed index can be recalculated by hand.

### AI use

- AI proposed an uncapped normalized stage-age term so an old early-stage case could not be starved by late-stage bonuses.
- I accepted small documented bonuses for an overdue recorded promise, waiting responsibility, and contact age.
- I kept names and roles outside the score and actions.
- I rejected any generated probability, “candidate risk,” or performance inference.

### Checks

- Hand oracle: `150 + 30 + 15 + 4 = 199` for a six-day Offer case against a four-day limit.
- Tested input-order invariance, application-ID tie-breaking, prohibited-field invariance, and component-sum equality.
- Ran the full fixed-sample reconciliation.

### What broke or surprised me

The first test run failed 16/17. The code reported six distinct queue owners; my expected value said seven. Manual inspection showed six was correct because several rows shared Eli and Tara. The test oracle—not the implementation—was wrong.

### Decision and unlearning

Expected values deserve review too. A red test is evidence of disagreement, not automatic proof that the generated code is at fault.

### Evidence

Failed owner-count assertion, corrected fixed-sample test, 17/17 final pass.

### Next load

Test whether a human can understand and challenge the queue, not merely whether functions return values.

## Day 4 — Test the human workflow

**Status:** Complete work pass  
**Load attempted:** Browser interaction, sensitivity, filtering, explanation audit, validation, and export consistency.

### Intended outcome

Make the product legible enough for a five-minute demo and difficult to misread as candidate scoring.

### AI use

- AI helped structure the interface around “who, why, next action,” then a side panel for process debt and invalid rows.
- I used AI to critique ambiguous labels and over-automation.
- I retained a bold editorial visual language but kept every control keyboard-labelled and every imported cell rendered as text.

### Checks

- Browser sample: 9 queue rows at base 7.
- Offer filter: 1 visible row.
- Search “Mei”: 1 visible row.
- Base 10: 5 visible rows; restored to 7: 9 rows.
- Score drawer for Jordan: `225 + 30 + 15 + 8 = 278`.
- Exported nine rows in visible order and inspected the first records.
- Current Driftline page produced no console warnings or errors.

### What broke or surprised me

Two human-facing defects escaped the unit tests. A stale service worker from another local app hijacked the common port 4173, so I moved Driftline to 8765. Browser reading also exposed “against a 11-day limit”; I changed the template to “against the 11-day limit” and tightened a repeated “then” in one action.

### Decision and unlearning

Correct arithmetic does not guarantee a trustworthy interface. Visual reading and a real browser found problems function tests could not.

### Evidence

Browser screenshots, sensitivity counts, rules dialog, inspected export, revised explanation template.

### Next load

Try to disprove “done” with scale, clean-start documentation, limitations, and claim-by-claim evidence.

## Day 5 — Try to disprove done

**Status:** Complete work pass with explicit submission dependency  
**Load attempted:** Scale, packaging, reproducibility, honest cuts, and demo rehearsal.

### Intended outcome

Freeze the directive only after code, tests, browser behavior, export, documentation, and narrative agree.

### AI use

- AI reviewed the final contract against the assignment rubric and helped separate shipped evidence from aspirational language.
- I used AI to draft a narrated walkthrough, then grounded every number in the test/browser results.
- I did not let the final narrative imply ATS integration, automated messaging, mobile test coverage, or production readiness.

### Checks

- `npm test`: 17 passed, 0 failed.
- 10,000 valid rows: about 28 ms on this machine, below the two-second prototype budget.
- `npm run build`: static site produced successfully.
- README commands checked against the actual package scripts.
- Default export inspected against the visible queue.

### What broke or surprised me

Automated mobile-viewport control was unavailable, so I did not claim a mobile browser pass; only responsive CSS is included. The generated MP4 uses synthetic narration, and creating the Loom share link still requires an authenticated account upload.

### Decision and unlearning

“Done” now means claims with evidence plus named limits. It does not mean hiding the last manual step.

### Evidence

`README.md`, `docs/Final directive.md`, final test output, `docs/demo-script.md`, submission package.

### Next load

Manual account step: upload the MP4 to Loom, paste the returned link into the submission form, and do a final reviewer-perspective playback before submitting.
