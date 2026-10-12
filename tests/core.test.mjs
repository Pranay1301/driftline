import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import test from "node:test";
import {
  CSV_LIMITS,
  analyzeBoard,
  exportQueueCsv,
  parseCsv,
  parseIsoDate,
  sanitizeSpreadsheetCell,
  thresholdForStage,
} from "../src/core.js";

const AS_OF = parseIsoDate("2026-10-12");

function row(overrides = {}) {
  return {
    __line: 2,
    application_id: "APP-001",
    candidate_name: "Asha Nair",
    role: "Engineer",
    stage: "Interview",
    stage_entered_on: "2026-10-05",
    last_contact_on: "2026-10-10",
    next_step_due_on: "2026-10-14",
    owner: "Priya",
    waiting_on: "company",
    ...overrides,
  };
}

test("CSV parser handles a BOM, CRLF, quoted commas, escaped quotes, and Unicode", () => {
  const csv =
    '\uFEFFapplication_id,candidate_name,role,stage,stage_entered_on,owner,waiting_on\r\n' +
    'APP-1,"Ana María, López","Engineer, ""Platform""",Interview,2026-10-01,Tara,company\r\n';
  const parsed = parseCsv(csv);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].candidate_name, "Ana María, López");
  assert.equal(parsed.rows[0].role, 'Engineer, "Platform"');
});

test("missing required headers and malformed field counts are visible", () => {
  const missing = parseCsv("application_id,candidate_name\nA-1,Asha\n");
  assert.ok(missing.errors.some((error) => error.startsWith("Missing required column")));
  assert.equal(missing.rows.length, 0);

  const malformed = parseCsv(
    "application_id,candidate_name,role,stage,stage_entered_on,owner,waiting_on\n" +
      "A-1,Asha,Engineer,Interview,2026-10-01,Priya,company,extra\n",
  );
  assert.ok(malformed.errors.some((error) => error.includes("expected 7 fields but found 8")));
});

test("stage-aware limits use documented factors and round up", () => {
  assert.equal(thresholdForStage("offer", 7), 4);
  assert.equal(thresholdForStage("assessment", 7), 11);
  assert.equal(thresholdForStage("hiring_manager_review", 7), 6);
  assert.equal(thresholdForStage("interview", 7), 7);
});

test("the stall boundary is inclusive", () => {
  const exact = analyzeBoard([row()], { asOf: AS_OF, baseThreshold: 7 });
  const below = analyzeBoard([row({ stage_entered_on: "2026-10-06" })], {
    asOf: AS_OF,
    baseThreshold: 7,
  });
  assert.equal(exact.flagged.length, 1);
  assert.equal(exact.flagged[0].daysInStage, 7);
  assert.equal(below.flagged.length, 0);
});

test("inclusive boundaries hold for fast, standard, and slow stages", () => {
  const cases = [
    { stage: "Offer", below: "2026-10-09", exact: "2026-10-08", above: "2026-10-07" },
    { stage: "Interview", below: "2026-10-06", exact: "2026-10-05", above: "2026-10-04" },
    { stage: "Assessment", below: "2026-10-02", exact: "2026-10-01", above: "2026-09-30" },
  ];
  const rows = cases.flatMap(({ stage, below, exact, above }, caseIndex) =>
    [
      ["BELOW", below],
      ["EXACT", exact],
      ["ABOVE", above],
    ].map(([position, stageEnteredOn], positionIndex) =>
      row({
        __line: 2 + caseIndex * 3 + positionIndex,
        application_id: `${stage}-${position}`,
        stage,
        stage_entered_on: stageEnteredOn,
      }),
    ),
  );
  const analysis = analyzeBoard(rows, { asOf: AS_OF, baseThreshold: 7 });
  assert.deepEqual(
    analysis.healthy.map((record) => record.applicationId).sort(),
    ["Assessment-BELOW", "Interview-BELOW", "Offer-BELOW"],
  );
  assert.deepEqual(
    analysis.flagged.map((record) => record.applicationId).sort(),
    [
      "Assessment-ABOVE",
      "Assessment-EXACT",
      "Interview-ABOVE",
      "Interview-EXACT",
      "Offer-ABOVE",
      "Offer-EXACT",
    ],
  );
});

test("empty files and duplicate headers fail visibly", () => {
  assert.deepEqual(parseCsv(""), {
    headers: [],
    rows: [],
    errors: ["The CSV is empty."],
    warnings: [],
  });
  const duplicate = parseCsv(
    "application_id,candidate_name,role,stage,stage_entered_on,owner,waiting_on,owner\n" +
      "A-1,Asha,Engineer,Interview,2026-10-05,Priya,company,Priya\n",
  );
  assert.ok(duplicate.errors.includes("Duplicate column name(s): owner."));
  assert.equal(duplicate.rows.length, 0);
});

test("structurally unsafe headers fail closed before ranking", () => {
  const missing = parseCsv("application_id,candidate_name\nA-1,Asha\n");
  assert.ok(missing.errors.some((error) => error.startsWith("Missing required column")));
  assert.equal(missing.rows.length, 0);

  const required = [
    "application_id",
    "candidate_name",
    "role",
    "stage",
    "stage_entered_on",
    "owner",
    "waiting_on",
  ];
  const extras = Array.from(
    { length: CSV_LIMITS.maxColumns - required.length + 1 },
    (_, index) => `extra_${index}`,
  );
  const headers = [...required, ...extras];
  const tooWide = parseCsv(`${headers.join(",")}\n${headers.map(() => "x").join(",")}\n`);
  assert.ok(tooWide.errors.some((error) => error.includes("columns; the maximum is")));
  assert.equal(tooWide.rows.length, 0);
});

test("CSV workload limits reject oversized text and excessive rows", () => {
  const tooLarge = parseCsv("x".repeat(CSV_LIMITS.maxCharacters + 1));
  assert.deepEqual(tooLarge.rows, []);
  assert.ok(tooLarge.errors.includes("The CSV exceeds the 2 MB processing limit."));

  const header = "application_id,candidate_name,role,stage,stage_entered_on,owner,waiting_on";
  const rows = Array.from(
    { length: CSV_LIMITS.maxDataRows + 1 },
    (_, index) => `LIMIT-${index},Asha,Engineer,Interview,2026-10-01,Priya,company`,
  );
  const tooMany = parseCsv(`${header}\n${rows.join("\n")}`);
  assert.deepEqual(tooMany.rows, []);
  assert.ok(tooMany.errors.some((error) => error.includes("25,000-row processing limit")));
});

test("unknown operational values are quarantined with explicit reasons", () => {
  const analysis = analyzeBoard(
    [row({ stage: "Sourcing", waiting_on: "blocked" })],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.invalid.length, 1);
  assert.ok(analysis.invalid[0].errors.some((message) => message.includes("not recognized")));
  assert.ok(analysis.invalid[0].errors.includes("waiting_on must be company, candidate, or external."));
});

test("invalid optional dates and contradictory commitments stay visible", () => {
  const analysis = analyzeBoard(
    [
      row({ application_id: "BAD-CONTACT", last_contact_on: "2026-02-30" }),
      row({ application_id: "BAD-DUE", next_step_due_on: "2026-10-04" }),
    ],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.invalid.length, 2);
  assert.ok(
    analysis.invalid.find((item) => item.applicationId === "BAD-CONTACT").errors.includes(
      "last_contact_on must use YYYY-MM-DD.",
    ),
  );
  assert.ok(
    analysis.invalid.find((item) => item.applicationId === "BAD-DUE").errors.includes(
      "next_step_due_on is before stage_entered_on.",
    ),
  );
});

test("recent contact does not reset the stage clock", () => {
  const analysis = analyzeBoard(
    [row({ stage_entered_on: "2026-09-30", last_contact_on: "2026-10-12" })],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.flagged[0].daysInStage, 12);
  assert.equal(analysis.flagged[0].contactPoints, 0);
});

test("terminal stages are excluded even when old", () => {
  const analysis = analyzeBoard(
    [row({ stage: "Rejected", stage_entered_on: "2025-01-01" })],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.flagged.length, 0);
  assert.equal(analysis.terminal.length, 1);
});

test("missing, malformed, and future movement dates become row errors", () => {
  const analysis = analyzeBoard(
    [
      row({ application_id: "A", stage_entered_on: "" }),
      row({ application_id: "B", stage_entered_on: "2026-02-30" }),
      row({ application_id: "C", stage_entered_on: "2026-10-13" }),
    ],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.invalid.length, 3);
  assert.ok(analysis.invalid[0].errors.includes("stage_entered_on is required."));
  assert.ok(analysis.invalid[1].errors.includes("stage_entered_on must use YYYY-MM-DD."));
  assert.ok(analysis.invalid[2].errors.includes("stage_entered_on is after the as-of date."));
});

test("every row sharing a duplicate application ID is quarantined", () => {
  const analysis = analyzeBoard(
    [row(), row({ __line: 3, candidate_name: "Different person", stage: "Offer" })],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.active.length, 0);
  assert.equal(analysis.invalid.length, 2);
  assert.ok(analysis.invalid.every((item) => item.errors.some((error) => error.includes("duplicated 2 times"))));
});

test("priority index equals its visible components", () => {
  const analysis = analyzeBoard(
    [
      row({
        stage: "Offer",
        stage_entered_on: "2026-10-06",
        last_contact_on: "2026-10-08",
        next_step_due_on: "2026-10-10",
      }),
    ],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  const record = analysis.flagged[0];
  assert.equal(record.thresholdDays, 4);
  assert.equal(record.agePoints, 150);
  assert.equal(record.promisePoints, 30);
  assert.equal(record.responsibilityPoints, 15);
  assert.equal(record.contactPoints, 4);
  assert.equal(record.priorityScore, 199);
  assert.equal(
    record.priorityScore,
    record.agePoints + record.promisePoints + record.responsibilityPoints + record.contactPoints,
  );
});

test("a due date today is not overdue", () => {
  const analysis = analyzeBoard(
    [row({ next_step_due_on: "2026-10-12" })],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  assert.equal(analysis.flagged[0].promiseOverdue, false);
  assert.equal(analysis.flagged[0].promisePoints, 0);
});

test("ranking is independent of input order and breaks final ties by application ID", () => {
  const rows = [
    row({ application_id: "APP-C" }),
    row({ application_id: "APP-A" }),
    row({ application_id: "APP-B" }),
  ];
  const forward = analyzeBoard(rows, { asOf: AS_OF, baseThreshold: 7 });
  const reverse = analyzeBoard([...rows].reverse(), { asOf: AS_OF, baseThreshold: 7 });
  assert.deepEqual(
    forward.flagged.map((record) => record.applicationId),
    ["APP-A", "APP-B", "APP-C"],
  );
  assert.deepEqual(
    reverse.flagged.map((record) => record.applicationId),
    forward.flagged.map((record) => record.applicationId),
  );
});

test("name, role, and ignored sensitive fields cannot change operational scores", () => {
  const first = analyzeBoard(
    [row({ candidate_name: "Person One", role: "Role A", gender: "x" })],
    { asOf: AS_OF, baseThreshold: 7 },
  ).flagged[0];
  const second = analyzeBoard(
    [row({ candidate_name: "Completely Different", role: "Role B", gender: "y" })],
    { asOf: AS_OF, baseThreshold: 7 },
  ).flagged[0];
  assert.equal(first.priorityScore, second.priorityScore);
  assert.equal(first.daysInStage, second.daysInStage);
  assert.equal(first.action, second.action);
});

test("every flagged row gets one deterministic explanation and action", () => {
  const record = analyzeBoard([row()], { asOf: AS_OF, baseThreshold: 7 }).flagged[0];
  assert.ok(record.explanation.startsWith("Asha Nair has been in Interview for 7 calendar days"));
  assert.ok(record.explanation.endsWith("."));
  assert.ok(record.action.length > 20);
});

test("spreadsheet formula prefixes are neutralized in exports", () => {
  const dangerousPrefixes = ["=2+2", "+SUM(A1)", "-1+2", "@SUM(A1)", "\t=2+2", "\r=2+2"];
  for (const value of dangerousPrefixes) {
    assert.equal(sanitizeSpreadsheetCell(value), `'${value}`);
  }
  const record = analyzeBoard([row({ candidate_name: "=2+2" })], {
    asOf: AS_OF,
    baseThreshold: 7,
  }).flagged[0];
  const csv = exportQueueCsv([record]);
  assert.ok(csv.includes("'=2+2"));
});

test("filtered queue export preserves supplied order, row set, and global displayed ranks", () => {
  const analysis = analyzeBoard(
    [
      row({ application_id: "APP-A", candidate_name: "First" }),
      row({ application_id: "APP-B", candidate_name: "Second" }),
    ],
    { asOf: AS_OF, baseThreshold: 7 },
  );
  const supplied = [...analysis.flagged].reverse();
  const lines = exportQueueCsv(supplied).split("\n");
  assert.equal(lines.length, supplied.length + 1);
  assert.ok(lines[1].startsWith("2,APP-B,"));
  assert.ok(lines[2].startsWith("1,APP-A,"));
});

test("queue exports preserve the human-review and decision-scope boundary", () => {
  const record = analyzeBoard([row()], { asOf: AS_OF, baseThreshold: 7 }).flagged[0];
  const csv = exportQueueCsv([record]);
  assert.match(csv.split("\n")[0], /review_status,decision_scope,as_of_date$/);
  assert.match(csv, /NEEDS_HUMAN_REVIEW,WORKFLOW_DELAY_ONLY,2026-10-12/);
});

test("suggested outreach uses an approved channel and professional dependency language", () => {
  const offer = analyzeBoard(
    [row({ stage: "Offer", owner: "", stage_entered_on: "2026-10-01" })],
    { asOf: AS_OF, baseThreshold: 7 },
  ).flagged[0];
  const external = analyzeBoard(
    [row({ application_id: "EXT", waiting_on: "external" })],
    { asOf: AS_OF, baseThreshold: 7 },
  ).flagged[0];
  assert.match(offer.action, /approved channel/);
  assert.doesNotMatch(offer.action, /call the candidate/);
  assert.match(external.action, /follow up with the outside dependency/);
  assert.doesNotMatch(external.action, /chase the outside dependency/);
});

test("raising the base limit cannot increase the flagged set", () => {
  const rows = [
    row({ application_id: "A", stage_entered_on: "2026-10-10" }),
    row({ application_id: "B", stage_entered_on: "2026-10-05" }),
    row({ application_id: "C", stage_entered_on: "2026-09-20" }),
  ];
  const strict = analyzeBoard(rows, { asOf: AS_OF, baseThreshold: 3 });
  const forgiving = analyzeBoard(rows, { asOf: AS_OF, baseThreshold: 10 });
  assert.ok(forgiving.flagged.length <= strict.flagged.length);
  assert.ok(
    forgiving.flagged.every((record) =>
      strict.flagged.some((strictRecord) => strictRecord.applicationId === record.applicationId),
    ),
  );
});

test("the fictional board reconciles to known counts and ordering", async () => {
  const text = await readFile(new URL("../sample-data/hiring_board.csv", import.meta.url), "utf8");
  const parsed = parseCsv(text);
  const analysis = analyzeBoard(parsed.rows, { asOf: AS_OF, baseThreshold: 7 });
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(analysis.summary, {
    inputRows: 18,
    flagged: 9,
    healthy: 2,
    terminal: 3,
    invalid: 4,
    processDebt: 30,
    overdueCommitments: 4,
    waitingOnCompany: 5,
    owners: 6,
  });
  assert.equal(analysis.flagged[0].applicationId, "DL-104");
  assert.equal(analysis.flagged.at(-1).applicationId, "DL-114");
});

test("10,000 valid rows analyze within the prototype performance budget", () => {
  const rows = Array.from({ length: 10_000 }, (_, index) =>
    row({ application_id: `LOAD-${String(index).padStart(5, "0")}` }),
  );
  const started = performance.now();
  const analysis = analyzeBoard(rows, { asOf: AS_OF, baseThreshold: 7 });
  const elapsed = performance.now() - started;
  assert.equal(analysis.flagged.length, 10_000);
  assert.ok(elapsed < 2_000, `Expected <2,000 ms; received ${elapsed.toFixed(1)} ms`);
});
