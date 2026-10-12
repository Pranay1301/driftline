import { analyzeBoard, parseCsv, parseIsoDate, serializeCsv } from "./core.js";

export const BENCHMARK_AS_OF = "2026-10-12";
export const BENCHMARK_SIZES = Object.freeze([100, 1_000, 10_000]);

const BENCHMARK_HEADERS = Object.freeze([
  "application_id",
  "candidate_name",
  "role",
  "stage",
  "stage_entered_on",
  "last_contact_on",
  "next_step_due_on",
  "owner",
  "waiting_on",
]);

const STAGES = Object.freeze([
  "Applied",
  "Recruiter Screen",
  "Hiring Manager Review",
  "Assessment",
  "Interview",
  "Reference Check",
  "Offer",
]);

const ROLES = Object.freeze([
  "Platform Engineer",
  "Product Designer",
  "Data Analyst",
  "Security Engineer",
  "Operations Lead",
]);

const WAITING_ON = Object.freeze(["company", "candidate", "external"]);

export function makeBenchmarkRows(size) {
  const count = Math.max(0, Math.floor(Number(size) || 0));
  return Array.from({ length: count }, (_, index) => ({
    application_id: `BENCH-${String(index + 1).padStart(6, "0")}`,
    candidate_name: `Synthetic Candidate ${index + 1}`,
    role: ROLES[index % ROLES.length],
    stage: STAGES[index % STAGES.length],
    stage_entered_on: "2026-09-01",
    last_contact_on: index % 4 === 0 ? "" : "2026-09-20",
    next_step_due_on: index % 3 === 0 ? "2026-10-01" : "",
    owner: `Owner ${String((index % 12) + 1).padStart(2, "0")}`,
    waiting_on: WAITING_ON[index % WAITING_ON.length],
  }));
}

export function makeBenchmarkCsv(size) {
  return serializeCsv(makeBenchmarkRows(size), BENCHMARK_HEADERS);
}

export function percentile(values, quantile) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const bounded = Math.max(0, Math.min(1, Number(quantile)));
  const position = (sorted.length - 1) * bounded;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function summarizeDurations(samples, rowCount) {
  const medianMs = percentile(samples, 0.5);
  const p95Ms = percentile(samples, 0.95);
  return {
    medianMs,
    p95Ms,
    rowsPerSecond: medianMs > 0 ? Math.round((Number(rowCount) * 1_000) / medianMs) : null,
  };
}

function runPipeline(csvText) {
  const parsed = parseCsv(csvText);
  const analysis = analyzeBoard(parsed.rows, {
    asOf: parseIsoDate(BENCHMARK_AS_OF),
    baseThreshold: 7,
  });
  return { parsed, analysis };
}

function resultSignature(analysis) {
  return [
    analysis.summary.inputRows,
    analysis.summary.flagged,
    analysis.summary.invalid,
    analysis.flagged[0]?.applicationId ?? "none",
    analysis.flagged.at(-1)?.applicationId ?? "none",
  ].join(":");
}

export async function runBenchmarkSuite({
  sizes = BENCHMARK_SIZES,
  warmups = 3,
  runs = 15,
  now = () => performance.now(),
  yieldControl = async () => {},
  onProgress = () => {},
} = {}) {
  const results = [];
  const safeWarmups = Math.max(0, Math.floor(Number(warmups) || 0));
  const safeRuns = Math.max(1, Math.floor(Number(runs) || 1));

  for (const rawSize of sizes) {
    const size = Math.max(1, Math.floor(Number(rawSize) || 1));
    const csvText = makeBenchmarkCsv(size);
    onProgress({ phase: "warming", size });
    for (let index = 0; index < safeWarmups; index += 1) runPipeline(csvText);

    const samples = [];
    let expectedSignature = null;
    let deterministic = true;
    let correct = true;
    onProgress({ phase: "measuring", size });

    for (let index = 0; index < safeRuns; index += 1) {
      const started = now();
      const output = runPipeline(csvText);
      samples.push(Math.max(0, now() - started));
      const signature = resultSignature(output.analysis);

      expectedSignature ??= signature;
      deterministic &&= signature === expectedSignature;
      correct &&=
        output.parsed.errors.length === 0 &&
        output.analysis.summary.inputRows === size &&
        output.analysis.summary.flagged === size &&
        output.analysis.summary.invalid === 0;
    }

    results.push({
      rows: size,
      runs: safeRuns,
      ...summarizeDurations(samples, size),
      deterministic,
      correct,
      signature: expectedSignature,
    });
    onProgress({ phase: "complete", size });
    await yieldControl();
  }

  return {
    asOf: BENCHMARK_AS_OF,
    warmups: safeWarmups,
    runs: safeRuns,
    scope: "CSV parse + validation + ranking",
    results,
  };
}
