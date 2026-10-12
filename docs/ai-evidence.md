# Driftline - AI-use evidence receipts

**Compiled:** 12 October 2026 (Asia/Kolkata)  
**Scope:** Direct user instructions, repository artifacts, Git history, and commands run against this working tree.

These receipts show where AI affected the work and where a human check changed the result. They are not a claim that every chat message was preserved. When exact prompt text was not retained, the prompt is labeled **reconstructed summary - not verbatim**. The reviewer instruction in Receipt 4 is quoted directly from the instruction supplied on 12 October 2026.

## Receipt 1 - constrain the product before generating it

**When and provenance:** Calendar Day 1, 12 October 2026. The decision is recorded in `docs/intent.md`, `docs/five-day-log.md`, and `docs/Final directive.md`; the first Site-source commit in the repository is `5dd3858` at 15:13:04 +05:30.

**Prompt:** **Reconstructed summary - not verbatim:** "Turn option C into a falsifiable product contract. Challenge the definition of stalled, make priority explainable, and identify decisions the tool must not make."

**AI proposal:** Use stage-aware inactivity limits, deterministic priority arithmetic, a local browser workflow, and adversarial CSV tests. AI also widened the design space to possible generated recommendations.

**Human verification:** Every ranking input was checked against a CSV field or a visible derived value. Candidate identity and role were checked for relevance to operational priority. The assignment only required a follow-up queue, not a prediction about candidate quality or a system that contacts people.

**Decision:** Accept stage-aware deterministic ranking and human-reviewed next actions. Reject runtime free-form generation, candidate-quality inference, automated outreach, and ATS mutation. AI was used to attack the specification; it was not placed inside the runtime decision path.

**Inspectable artifacts:**

- `docs/intent.md` - user, decision boundary, non-goals, acceptance tests
- `docs/Final directive.md` - schema, thresholds, scoring, language and human-review constraints
- `src/core.js` - deterministic validation, ranking, explanations, actions, and export
- `tests/core.test.mjs` - prohibited-field invariance and deterministic-result checks

## Receipt 2 - challenge the test oracle, not just the implementation

**When and provenance:** Calendar Day 1, 12 October 2026. The failed assertion and resolution are recorded in `docs/five-day-log.md` under the third build pass and summarized in `docs/unlearning.md`.

**Prompt:** **Reconstructed summary - not verbatim:** "Create a fixed-sample reconciliation and score oracle, then try to disprove the expected total and ordering."

**AI proposal:** Add component-sum checks, deterministic tie tests, identity-field invariance, and a fixed expected summary for the fictional board.

**Human verification:** The first run failed 16/17 because the expected summary said there were seven distinct queue owners while the engine returned six. The nine flagged rows were inspected directly. Several rows shared Eli and Tara, so six distinct owners was correct.

**Decision:** Correct the expected value rather than changing correct implementation behavior. Preserve the failure in the work log. A red test establishes disagreement; it does not identify which side is wrong.

**Inspectable artifacts:**

- `docs/five-day-log.md` - the failed owner-count assertion and resolution
- `docs/unlearning.md` - the same decision in the unlearning narrative
- `tests/core.test.mjs` - fixed-sample reconciliation and component-sum tests
- `sample-data/hiring_board.csv` - the rows used for manual reconciliation

## Receipt 3 - reject an apparently successful browser check

**When and provenance:** Calendar Day 1, 12 October 2026. The defect and correction are recorded in `docs/five-day-log.md`; the shipped start command is inspectable in `package.json` and `README.md`.

**Prompt:** **Reconstructed summary - not verbatim:** "Verify the built site in a real browser, exercise the queue workflow, and compare what is visible with the function-level evidence."

**AI or automation result under review:** A local request succeeded on the common development port, which initially looked like evidence that Driftline was being served correctly.

**Human verification:** Visual inspection showed that an old service worker from another app had captured port 4173. The page response alone did not prove that the intended app was visible. The same browser pass exposed the grammatically wrong sentence "against a 11-day limit," even though its arithmetic was correct.

**Decision:** Move the local server to port 8765, verify the visible title and workflow rather than HTTP status alone, and change the sentence to "against the N-day limit." This added a browser-level evidence requirement on top of engine tests.

**Inspectable artifacts:**

- `docs/five-day-log.md` - service-worker collision and wording defect
- `package.json` - `npm start` serves `dist` on port 8765
- `README.md` - clean-start browser instructions and manual workflow checks
- `src/core.js` - corrected explanation template

## Receipt 4 - accept the review, repair the evidence, and refuse to backdate

**When and provenance:** Direct reviewer instruction supplied by the user on 12 October 2026, followed by repository inspection and a test run in the current working tree.

**Direct instruction excerpts:**

> "Your numbers contradict each other."

> "Run the final test suite and benchmark from the same code version."

> "Do not manufacture earlier work or backdate entries."

The review also requested exact boundary checks, adversarial CSV cases, privacy and export checks, a real browser workflow, narrow-viewport verification, and plain-language definitions for process debt and sensitivity analysis.

**Verification:** Git history showed four Site-source commits, all dated 12 October 2026 (`5dd3858`, `3287786`, `0412127`, and `d5c4018`). A repository search found release narratives that still used older test and timing figures. The post-review working tree added tests for fast, standard, and slow-stage boundaries; empty input; duplicate headers; invalid stages and waiting values; invalid optional dates; contradictory commitment dates; and complete ordered export. The current suite was then run with zero failures.

**Decision:** Use one final release evidence record for the final suite and benchmark instead of copying numbers by memory. Treat earlier counts as dated intermediate evidence, not release claims. Most importantly, do not rename five same-day build passes as five elapsed days.

**Inspectable artifacts:**

- `git log --date=iso-strict --pretty=format:'%h %ad %s'` - same-day commit history
- `src/core.js` - contradictory-date validation
- `tests/core.test.mjs` - the added boundary, invalid-input, and export checks
- `docs/five-day-log.md` - the calendar-day disclosure; it must keep future days pending until they actually occur

## Timeline integrity statement

As of 12 October 2026, Driftline has evidence for **one completed calendar day**, with multiple build passes inside that day. This document will not fabricate work on 13-16 October, alter Git timestamps, or present planned checks as completed checks. Days 2-5 may only become evidence after genuine work is performed on those dates (or later) and the prompt, failure or observation, verification, and resulting change are recorded.

That means the five-day process requirement is not yet fully satisfied. The honest remedy is elapsed time plus real iteration, not narrative relabeling.

## Evidence rule for the final submission

For each final claim, preserve this chain:

1. instruction or clearly labeled prompt summary;
2. proposal or assumption under review;
3. human or automated verification;
4. accepted, rejected, or revised decision;
5. an inspectable artifact.

If a later final test or benchmark run changes a number, the dated release evidence should supersede copied summary values. Historical receipts can retain their context, but they must not be presented as the current release result.
