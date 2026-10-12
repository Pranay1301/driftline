import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import test from "node:test";
import {
  makeBenchmarkCsv,
  makeBenchmarkRows,
  percentile,
  runBenchmarkSuite,
  summarizeDurations,
} from "../src/benchmark.js";
import { analyzeBoard, parseCsv, parseIsoDate } from "../src/core.js";

test("adversarial demo keeps attacks inert and reconciles to fixed counts", async () => {
  const text = await readFile(new URL("../sample-data/adversarial.csv", import.meta.url), "utf8");
  const parsed = parseCsv(text);
  const analysis = analyzeBoard(parsed.rows, {
    asOf: parseIsoDate("2026-10-12"),
    baseThreshold: 7,
  });
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 9);
  assert.equal(analysis.summary.flagged, 5);
  assert.equal(analysis.summary.invalid, 4);
  assert.ok(parsed.warnings.some((warning) => warning.includes("Sensitive column(s) were ignored")));
  assert.ok(analysis.flagged.some((record) => record.candidateName.includes("<script>")));
});

test("benchmark corpus is deterministic, valid, and parser-safe", () => {
  assert.deepEqual(makeBenchmarkRows(3), makeBenchmarkRows(3));
  const parsed = parseCsv(makeBenchmarkCsv(1_000));
  const analysis = analyzeBoard(parsed.rows, {
    asOf: parseIsoDate("2026-10-12"),
    baseThreshold: 7,
  });
  assert.deepEqual(parsed.errors, []);
  assert.equal(analysis.summary.inputRows, 1_000);
  assert.equal(analysis.summary.flagged, 1_000);
  assert.equal(analysis.summary.invalid, 0);
});

test("benchmark summaries report interpolated percentiles and throughput", () => {
  assert.equal(percentile([4, 1, 3, 2], 0.5), 2.5);
  assert.equal(percentile([10, 20, 30], 0.95), 29);
  assert.equal(percentile([], 0.5), null);
  const summary = summarizeDurations([8, 10, 12], 1_000);
  assert.equal(summary.medianMs, 10);
  assert.equal(summary.p95Ms, 11.8);
  assert.equal(summary.rowsPerSecond, 100_000);
});

test("benchmark runner checks the real parse-to-rank pipeline", async () => {
  const suite = await runBenchmarkSuite({
    sizes: [10, 100],
    warmups: 1,
    runs: 3,
    now: () => performance.now(),
  });
  assert.equal(suite.scope, "CSV parse + validation + ranking");
  assert.equal(suite.results.length, 2);
  assert.ok(suite.results.every((result) => result.correct));
  assert.ok(suite.results.every((result) => result.deterministic));
  assert.ok(suite.results.every((result) => result.medianMs >= 0));
  assert.ok(suite.results.every((result) => result.p95Ms >= result.medianMs));
});
