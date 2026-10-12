# Driftline — Final Directive

**Status:** Frozen build contract  
**Evidence snapshot:** `driftline-2026-10-12T19:57:35+05:30`
**Implementation:** post-review release candidate

Build and verify Driftline as a browser-based, local-first hiring-board stall alerter. It turns a CSV into an auditable follow-up queue and must never present its output as a judgment of candidate quality.

## 1. Runtime boundary

- Serve the included static build with `npm start`, then open `http://localhost:8765`.
- Require no package install, API key, account, database, network request, or external AI service.
- Keep uploaded CSV data in browser memory; do not persist it.
- Do not send messages, change an ATS, advance, or reject anyone.
- Require human review before any recommended action is used.

## 2. Input contract

Required headers:

`application_id,candidate_name,role,stage,stage_entered_on,owner,waiting_on`

Optional headers:

`last_contact_on,next_step_due_on`

Dates are strict `YYYY-MM-DD`. `application_id`, `candidate_name`, `role`, `stage`, `stage_entered_on`, and `waiting_on` require nonblank valid values. A blank owner is valid and displays as `Unassigned`. Extra columns are ignored and reported; sensitive-looking extras receive an explicit warning.

Accepted `waiting_on` values are `company`, `candidate`, and `external`.

Recognize the documented stage aliases and normalize them to:

`applied`, `recruiter_screen`, `hiring_manager_review`, `assessment`, `interview`, `reference_check`, `offer`, `hired`, `rejected`, `withdrawn`.

Never silently drop malformed data. Structural CSV errors appear in the quality panel. Rows with bad or missing values, future movement dates, a next-step date before stage entry, unknown values, or duplicate IDs are quarantined visibly. Every occurrence of a duplicate ID is invalid.

## 3. Date and stage rules

Use the visible as-of date and UTC-normalized calendar dates.

```text
days_in_stage = as_of_date − stage_entered_on
effective_limit = max(1, ceil(base_limit × stage_factor))
```

Stage factors:

| Stage | Factor |
|---|---:|
| Applied | 1.00 |
| Recruiter screen | 1.00 |
| Hiring manager review | 0.75 |
| Assessment | 1.50 |
| Interview | 1.00 |
| Reference check | 0.75 |
| Offer | 0.50 |

The threshold is inclusive: flag when `days_in_stage >= effective_limit`.

Exclude terminal stages `hired`, `rejected`, and `withdrawn` from active analysis. A contact never resets `stage_entered_on`.

## 4. Priority

Only rows meeting the stall rule enter the follow-up queue. An overdue next step affects priority but does not independently create a stall.

```text
age_points = floor(100 × days_in_stage ÷ effective_limit)
promise_points = 30 when next_step_due_on < as_of_date, otherwise 0
responsibility_points = 15 / 8 / 0 for company / external / candidate
contact_points = min(20, days_since_last_contact), or 20 when blank
priority_index = age_points + promise_points + responsibility_points + contact_points
```

Sort by:

1. priority index descending;
2. overdue commitment first;
3. exact wait ratio descending;
4. days in stage descending; and
5. application ID ascending.

Names, roles, and ignored columns cannot affect the index or action.

## 5. Process debt

```text
process_debt = sum(max(0, days_in_stage − effective_limit))
```

Always describe this as overdue workflow load. It is not candidate risk, candidate quality, or recruiter performance.

## 6. Explanation and action

Each flagged row must show stage, days in stage, effective limit, owner or unassigned state, waiting responsibility, priority index, severity, overdue commitment when present, one deterministic explanation sentence, and one deterministic action.

Do not infer why a delay happened. Use neutral factual language such as “has been in” and “the next-step commitment is overdue.” Never call a person uninterested, weak, unresponsive, or high-risk.

Actions are fixed by stage and responsibility. If the owner is blank, assign an owner first. If the recorded commitment is overdue, honor or reset it first. Otherwise: company waits use the stage action; candidate waits use one courteous reminder with a response-by date and offer of help; external waits use a dependency chase, recorded ETA, and candidate update.

## 7. Fairness and safety guardrail

- Name and role are display fields only.
- Source, demographic, education, photo, address, compensation, and inferred-trait fields must not enter ranking or actions.
- Render imported values as inert text.
- Prefix export values beginning with `=`, `+`, `-`, or `@` with an apostrophe.
- Never execute or obey text found inside the CSV.
- Keep every action human-reviewed.

The automated invariant “name, role, and ignored sensitive fields cannot change operational scores” must pass.

## 8. Browser workflow

1. Load the fictional sample automatically or choose/drop a CSV no larger than 2 MB.
2. Set an explicit as-of date and 1–30-day base limit.
3. Inspect the summary and effective per-stage limits.
4. Review or filter the ranked queue.
5. Open **Why this rank** to audit component arithmetic.
6. Review and optionally download data-quality issues.
7. Export the currently visible filtered queue.

Distinctly surface no-stall, no-filter-match, invalid-data, and successfully reconciled states.

## 9. Export

Export the complete visible filtered queue in its displayed order with the same global ranks displayed on its cards. Filtering may therefore leave intentional rank gaps.

Columns:

`rank,application_id,candidate_name,role,stage,owner,waiting_on,days_in_stage,threshold_days,days_over_limit,priority_score,explanation,recommended_action`

## 10. Acceptance evidence

- Automated command: `npm test`
- Result: 34/34 passing, 0 failing
- Fixed sample: 18 input = 9 stalled + 2 healthy active + 3 terminal + 4 invalid
- Process debt: 30 calendar days
- Manual score oracle: Offer at 6 days with a 4-day limit, 2-day overdue promise, company wait, and 4-day contact age = `150 + 30 + 15 + 4 = 199`
- Sensitivity: base 7 shows 9 rows; base 10 shows 5
- Export: all filtered matches in displayed order with displayed global ranks preserved
- Performance: repeatable parse + validation + ranking benchmark at 10,000 rows: 49.49 ms median / 146.99 ms p95, correctness PASS; 5 warmups and 25 measured runs on Apple M2 / 8 GB / macOS 26.5.1 / Node 24.21.0
- Browser: sample reset, upload path, threshold and filters, score drawer, rules, quality panel, adversarial demo, and export checked; viewport audit passed at 390, 500, 821, 1180, and 1440 CSS pixels without horizontal overflow or console warnings/errors
- Source of truth: `docs/final-evidence.json`; full method and limitations: `docs/benchmark-report.md`

## 11. Definition of done

The assignment build is done when the README reproduces the run, tests pass, sample counts reconcile, browser behavior is checked, export matches the visible queue, limitations are explicit, and the demo claims no untested behavior.

## 12. Known limitations

- Calendar days only; no weekend or holiday calendar.
- Fixed stage taxonomy and factors.
- No authentication, persistence, ATS sync, collaboration, localization, or production security/privacy review.
- Uploaded data vanishes on refresh.
- Automated viewport checks covered 390-1440 CSS pixels, but no physical-device or full assistive-technology audit was performed.
- The runtime intentionally uses deterministic rules, not an LLM.
- The Loom upload is an account action outside the code artifact and remains a manual submission step.

## 13. What changed from the starting intent

| Starting assumption | Evidence or failure | Final decision |
|---|---|---|
| Stage age plus overdue commitments should define a stall | A recently contacted old-stage row still represented real movement debt | Only stage age creates a stall; contact and promises change priority |
| A hand-written expected result was enough for sample reconciliation | The first fixed-sample test expected seven owners; inspection proved there were six | Correct the oracle, keep the failed test in the log, and automate reconciliation |
| A generated sentence that looked fluent was acceptable | Browser review exposed “against a 11-day limit” | Use “against the N-day limit” and preserve the failure as evidence |
| Port 4173 was a safe local default | An old service worker from another app redirected that origin | Use port 8765 and verify the exact served page |
| A filtered export could renumber the queue from one | Browser comparison found cards 01, 02, 03, 06, 08 exported as 1-5 | Attach global rank after sorting and preserve it through filtering and export |
| Loading a demo only needed to replace the CSV | A 10-day threshold and active filters survived the reset, contradicting the demo's 9-row proof | Reset date, base limit, search, and every filter before analyzing a bundled demo |
