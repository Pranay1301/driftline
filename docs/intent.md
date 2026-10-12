# Driftline — Intent

> Captured from the initial design brief before implementation and converted to this file at packaging time. Later discoveries belong in the build log and `Final directive.md`.

## The problem

A hiring board can contain all the facts and still hide the operational question that matters each morning:

**Who needs a follow-up first, why, and what should the recruiter do next?**

“Stalled” is easy to define badly. Three days after an application is not the same operational situation as three days after an offer. A promised next step that is overdue can matter more than raw age. Driftline should turn those distinctions into an explainable queue without judging candidate quality.

## Intended user and decision

The primary user is a recruiter or recruiting coordinator reviewing an exported hiring-board CSV.

Driftline will help that person decide where to spend follow-up attention. It will not decide who should advance, reject candidates, send messages, or update an ATS. Every action remains subject to human review.

## Product intent

Build a browser-based, local-first tool that:

1. accepts a hiring-board CSV;
2. validates the data visibly;
3. identifies stalled applications using deterministic, stage-aware service limits;
4. notices overdue next-step commitments;
5. orders the follow-up queue using documented operational signals;
6. explains each flag in one sentence;
7. recommends a concrete next action;
8. summarizes aggregate process debt;
9. lets the user test a stricter or more forgiving threshold; and
10. exports the visible queue as CSV.

The file should remain in the browser. The runtime should not require an AI service, API key, login, or external upload.

## Fairness boundary

A name may identify a row, but it must not affect priority. Candidate source, demographic fields, and demographic proxies must also be excluded from scoring.

Priority may use only operational evidence: stage, time in stage, the applicable stage limit, contact age, waiting responsibility, and an overdue recorded commitment. Driftline measures workflow debt—not candidate value, interest, quality, or likelihood of success.

## Starting assumptions to test

- Different hiring stages need different default limits.
- A check-in should not reset the stage-movement clock.
- An overdue explicit commitment should affect priority but should not invent blame.
- An explicit as-of date will make results reproducible.
- A deterministic explanation is safer and easier to audit than generated prose.
- Invalid rows must remain visible instead of disappearing silently.
- Raising the load should mean increasing the burden of proof, not merely adding features.

## Success criteria

The prototype succeeds when:

- a new user can run it from only the README;
- supplied sample data demonstrates ordinary and adversarial cases;
- the same input and settings always produce the same order;
- the exact threshold boundary is tested;
- terminal candidates never appear as active stalls;
- invalid, missing, duplicate, and future data are handled visibly;
- every flag shows the facts behind its explanation and score;
- changing the base limit causes a predictable queue change;
- the exported CSV matches the visible filtered queue;
- prohibited identity fields do not affect score or action; and
- automated tests and hand calculations agree on reference rows.

## Raising the load

The planned load ladder is:

1. clean happy-path CSV;
2. stage-aware rather than universal limits;
3. overdue commitments and contact age;
4. boundary cases, terminal stages, missing values, duplicate IDs, and future dates;
5. stable ranking and one-sentence explanations;
6. threshold sensitivity;
7. fairness and input-order invariants;
8. export safety, browser checks, and README-only reproducibility.

An unfinished layer must remain visible as unfinished.

## AI-first working loop

For each meaningful iteration:

**Direct → Generate → Falsify → Decide → Record**

- Give AI a bounded problem and acceptance criteria.
- Let it propose alternatives, code, counterexamples, tests, or a critique.
- Check the result with tests, manual calculations, invariants, and browser behavior.
- Accept, edit, or reject it with a reason.
- Record the prompt summary, check, failure, and decision.

AI may widen the search. It does not get to declare its own output correct.

## Non-goals

This prototype will not predict performance or hire probability; infer intent, sentiment, or protected characteristics; send messages; mutate an ATS; explain why a delay happened; or claim production readiness.

## Initial unlearning experiment

My default temptation is to start coding once the happy path sounds plausible and test edge cases later. For Driftline, I will reverse that sequence: make the decision rules falsifiable first, invite AI to attack them, and keep the shipped runtime inspectable.
