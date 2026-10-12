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

“Jordan is first. The application has been in Offer for nine days against a four-day limit, the next-step commitment is five days overdue, and no owner is assigned. Driftline explains all of that in one sentence and recommends assigning an owner before resolving the approval or open question and calling the candidate.”

## 2:50–3:25 — Audit the rank

“Why does Jordan have an index of 278? The audit drawer shows 225 points from the stage-age ratio, 30 from the overdue commitment, 15 because the company owns the wait, and 8 from contact age. The arithmetic is visible. Names and roles are never scoring inputs, and the stage-age term is uncapped so old cases cannot be hidden forever.”

## 3:25–3:55 — Raise the load with sensitivity

“The threshold control is a small counterfactual. At a seven-day base, the queue has nine rows. At ten days, it drops to five. I can filter by stage, owner, or waiting responsibility and search by role or ID. Export always uses the currently visible order.”

## 3:55–4:25 — Data quality and safety

“Nothing disappears silently. The sample surfaces a missing date, a future movement date, and both rows sharing a duplicate ID. Extra sensitive-looking columns are ignored and reported. Imported HTML remains inert, and spreadsheet-formula prefixes are neutralized in the CSV export.”

## 4:25–4:50 — Evidence

“Seventeen automated tests pass. They cover parsing, exact threshold boundaries, terminal stages, bad dates, duplicate quarantine, deterministic ties, fairness invariance, export safety, sample reconciliation, and ten thousand rows. Browser checks covered filters, a nine-to-five sensitivity change, score disclosure, validation, and export.”

## 4:50–5:05 — Honest close

“The limits are deliberate and documented: calendar days only, fixed stage factors, no ATS sync, no automatic messages, and no production security claim. What I unlearned is that AI-first does not remove judgment. It makes the generate-and-challenge loop faster, while evidence earns every important claim.”
