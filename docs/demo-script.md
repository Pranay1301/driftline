# Driftline — Five-Minute Demo Script

The generated narrated MP4 follows these beats and expands each section slightly to land at five minutes. For a personal Loom recording, use this shorter guide and speak naturally rather than reading every word.

## 0:00–0:25 — Frame the problem

“Hiring boards contain rows, dates, and stages, but they often hide the morning decision: who needs a follow-up first, why, and what should we do next? I built Driftline, a local-first stall alerter. It measures workflow delay, not candidate quality, and keeps every action human-reviewed.”

## 0:25–0:55 — Input and reproducibility

“I can drop in a CSV or use this fictional sample. The file stays in the browser. The as-of date is explicit, so the same demo can be reproduced later, and the base stage limit is adjustable. The seven effective stage limits underneath are derived transparently from that base.”

## 0:55–1:30 — The rule

“A candidate is stalled when calendar days in the current stage are greater than or equal to the effective stage limit. Offer moves faster, assessment gets more time, and a check-in does not reset the movement clock. Terminal stages are excluded. This makes the definition inspectable instead of hiding it inside a model.”

## 1:30–2:05 — Summary and process debt

“At the verified settings, eighteen sample rows reconcile to nine stalled, two active within limit, three terminal, and four invalid. Process debt is thirty total days beyond stage limits. Four recorded next-step commitments are overdue. These are workflow measures, never candidate risk or recruiter performance scores.”

## 2:05–2:50 — First priority and one-sentence explanation

“Jordan is first. The application has been in Offer for nine days against a four-day limit, the next-step commitment is five days overdue, and no owner is assigned. Driftline explains all of that in one sentence and recommends assigning an owner before resolving the approval or open question and contacting the candidate through the approved channel.”

## 2:50–3:25 — Audit the rank

“Why does Jordan have an index of 278? The audit drawer shows 225 points from the stage-age ratio, 30 from the overdue commitment, 15 because the company owns the wait, and 8 from contact age. The arithmetic is visible. Names and roles are never scoring inputs, and the stage-age term is uncapped so old cases cannot be hidden forever.”

## 3:25–3:55 — Raise the load with sensitivity

“The threshold control is a small counterfactual. At a seven-day base, the queue has nine rows. At ten days, it drops to five. I can filter by stage, owner, or waiting responsibility and search by role or ID. Export always uses the currently visible order.”

## 3:55–4:25 — Data quality and safety

“Nothing disappears silently. The sample surfaces a missing date, a future movement date, and both rows sharing a duplicate ID. Files above two megabytes, twenty-five thousand rows, or sixty-four columns are rejected before ranking. Structural errors fail closed. Sensitive extras are ignored, imported HTML stays inert, formulas are neutralized, and every export says human review is required.”

## 4:25–4:50 — Evidence

“The Day-5 canonical release snapshot has 39/39 automated tests passing. They cover parsing, workload ceilings, fail-closed structure, multi-stage boundaries, contradictory and duplicate data, deterministic ties, identity invariance, safe rendering, review-labeled exports, reset behavior, and global export ranks. The repeatable 10,000-row engine benchmark measured 44.34 ms median and 57.80 ms p95 with correctness passing. The live table is a separate device-specific browser check. Browser checks covered 390 through 1440 CSS pixels, filters, sensitivity, score disclosure, validation, and export.”

## 4:50–5:05 — Honest close

“The limits are deliberate and documented: calendar days only, fixed stage factors, no ATS sync, no automatic messages, and no production security claim. The five-date log is honest: Day one contains the build, Days two through four record no work, and Day five contains final verification. What I unlearned is that AI-first does not remove judgment. It makes the generate-and-challenge loop faster, while evidence earns every important claim.”

Release evidence ID: `driftline-2026-10-16T19:25:08+05:30`. Final snapshot: **39/39** tests; 10,000 rows at **44.34 ms** median / **57.80 ms** p95, correctness PASS.
