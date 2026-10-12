import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("release narratives consume one canonical evidence snapshot", async () => {
  const [rawEvidence, readme, directive, unlearning, demo, report, html, log] = await Promise.all([
    read("docs/final-evidence.json"),
    read("README.md"),
    read("docs/Final directive.md"),
    read("docs/unlearning.md"),
    read("docs/demo-script.md"),
    read("docs/benchmark-report.md"),
    read("src/index.html"),
    read("docs/five-day-log.md"),
  ]);
  const evidence = JSON.parse(rawEvidence);
  assert.equal(evidence.test_suite.passing, 39);
  assert.equal(evidence.test_suite.failing, 0);
  const tenThousand = evidence.cli_benchmark.results.find((result) => result.rows === 10000);
  assert.deepEqual(
    { median: tenThousand.median_ms, p95: tenThousand.p95_ms, check: tenThousand.correctness },
    { median: 40.38, p95: 49.26, check: "PASS" },
  );
  for (const [name, document] of Object.entries({ readme, directive, unlearning, demo, report })) {
    assert.match(document, /39\/39/, `${name} must use the canonical test count`);
    assert.match(document, /40\.38 ms/, `${name} must use the canonical 10k median`);
    assert.match(document, /49\.26 ms/, `${name} must use the canonical 10k p95`);
    assert.doesNotMatch(document, /21\/21|25\/25|34\/34|roughly 28 ms|about 28 ms|34\.92 ms|35\.52 ms/);
  }
  assert.match(html, /<strong>39<\/strong><span>\/ 39<br \/>PASSING<\/span>/);
  assert.match(html, /39\/39 tests · 10,000 rows: 40\.38 ms median \/ 49\.26 ms p95/);
  assert.equal(evidence.safety_guardrails.structural_failures_stop_ranking, true);
  assert.equal(evidence.safety_guardrails.export_review_status, "NEEDS_HUMAN_REVIEW");
  assert.equal(evidence.calendar_days_completed, 1);
  assert.equal(evidence.timeline.days_2_to_5, "planned_not_yet_evidence");
  assert.match(log, /Day 2 - 2026-10-13 - PLANNED, NOT YET EVIDENCE/);
  assert.match(log, /not\*{0,2} five elapsed days/i);
});
