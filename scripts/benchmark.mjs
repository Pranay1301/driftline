import { performance } from "node:perf_hooks";
import { runBenchmarkSuite } from "../src/benchmark.js";

const suite = await runBenchmarkSuite({
  warmups: 5,
  runs: 25,
  now: () => performance.now(),
});

console.log(`Driftline benchmark — ${suite.scope}`);
console.log(`As-of ${suite.asOf} · ${suite.warmups} warmups · ${suite.runs} measured runs`);
console.table(
  suite.results.map((result) => ({
    rows: result.rows,
    "median ms": Number(result.medianMs.toFixed(2)),
    "p95 ms": Number(result.p95Ms.toFixed(2)),
    "rows/sec": result.rowsPerSecond,
    correctness: result.correct && result.deterministic ? "PASS" : "FAIL",
  })),
);

if (suite.results.some((result) => !result.correct || !result.deterministic)) {
  process.exitCode = 1;
}
