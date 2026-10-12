export const REQUIRED_COLUMNS = Object.freeze([
  "application_id",
  "candidate_name",
  "role",
  "stage",
  "stage_entered_on",
  "owner",
  "waiting_on",
]);

export const OPTIONAL_COLUMNS = Object.freeze([
  "last_contact_on",
  "next_step_due_on",
]);

export const STAGE_FACTORS = Object.freeze({
  applied: 1,
  recruiter_screen: 1,
  hiring_manager_review: 0.75,
  assessment: 1.5,
  interview: 1,
  reference_check: 0.75,
  offer: 0.5,
});

export const STAGE_LABELS = Object.freeze({
  applied: "Applied",
  recruiter_screen: "Recruiter screen",
  hiring_manager_review: "Hiring manager review",
  assessment: "Assessment",
  interview: "Interview",
  reference_check: "Reference check",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
});

export const TERMINAL_STAGES = Object.freeze(["hired", "rejected", "withdrawn"]);
export const WAITING_ON = Object.freeze(["company", "candidate", "external"]);

const ALLOWED_COLUMNS = new Set([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]);
const SENSITIVE_COLUMN_PATTERN = /(gender|sex|age|race|ethnic|relig|disab|national|photo|address|phone|salary|school|university)/i;

const STAGE_ALIASES = new Map([
  ["applied", "applied"],
  ["application", "applied"],
  ["recruiter screen", "recruiter_screen"],
  ["recruiter screening", "recruiter_screen"],
  ["phone screen", "recruiter_screen"],
  ["hiring manager review", "hiring_manager_review"],
  ["hiring manager interview", "hiring_manager_review"],
  ["manager review", "hiring_manager_review"],
  ["assessment", "assessment"],
  ["take home", "assessment"],
  ["take home assessment", "assessment"],
  ["interview", "interview"],
  ["technical interview", "interview"],
  ["onsite interview", "interview"],
  ["panel interview", "interview"],
  ["reference check", "reference_check"],
  ["references", "reference_check"],
  ["offer", "offer"],
  ["hired", "hired"],
  ["rejected", "rejected"],
  ["withdrawn", "withdrawn"],
]);

function canonicalToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\-_]+/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizeStage(value) {
  return STAGE_ALIASES.get(canonicalToken(value)) ?? null;
}

export function parseIsoDate(value) {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function calendarDaysBetween(start, end) {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function pushRecord(records, row, startLine) {
  if (row.length === 1 && row[0].trim() === "") return;
  records.push({ values: row, line: startLine });
}

export function parseCsv(input) {
  const source = String(input ?? "").replace(/^\uFEFF/, "");
  if (!source.trim()) {
    return { headers: [], rows: [], errors: ["The CSV is empty."], warnings: [] };
  }

  const records = [];
  const errors = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let rowStartLine = 1;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
        if (char === "\n") line += 1;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      pushRecord(records, row, rowStartLine);
      row = [];
      field = "";
      line += 1;
      rowStartLine = line;
    } else if (char === "\r") {
      if (source[index + 1] !== "\n") {
        row.push(field);
        pushRecord(records, row, rowStartLine);
        row = [];
        field = "";
        line += 1;
        rowStartLine = line;
      }
    } else {
      field += char;
    }
  }

  if (inQuotes) errors.push(`Line ${rowStartLine}: quoted field is not closed.`);
  if (field !== "" || row.length > 0) {
    row.push(field);
    pushRecord(records, row, rowStartLine);
  }

  if (records.length === 0) {
    return { headers: [], rows: [], errors: ["The CSV has no header row."], warnings: [] };
  }

  const headers = records[0].values.map((value) => canonicalToken(value).replace(/ /g, "_"));
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeaders.length) {
    errors.push(`Duplicate column name(s): ${[...new Set(duplicateHeaders)].join(", ")}.`);
  }

  const missingHeaders = REQUIRED_COLUMNS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    errors.push(`Missing required column(s): ${missingHeaders.join(", ")}.`);
  }

  const warnings = [];
  const ignoredColumns = headers.filter((header) => !ALLOWED_COLUMNS.has(header));
  if (ignoredColumns.length) {
    warnings.push(`Ignored column(s): ${ignoredColumns.join(", ")}. They do not affect ranking.`);
  }
  const sensitiveColumns = ignoredColumns.filter((header) => SENSITIVE_COLUMN_PATTERN.test(header));
  if (sensitiveColumns.length) {
    warnings.push(`Sensitive column(s) were ignored: ${sensitiveColumns.join(", ")}.`);
  }

  const rows = [];
  for (const record of records.slice(1)) {
    if (record.values.length !== headers.length) {
      errors.push(
        `Line ${record.line}: expected ${headers.length} fields but found ${record.values.length}.`,
      );
      continue;
    }
    const parsed = { __line: record.line };
    headers.forEach((header, index) => {
      parsed[header] = record.values[index].trim();
    });
    rows.push(parsed);
  }

  return { headers, rows, errors, warnings, ignoredColumns };
}

export function thresholdForStage(stage, baseThreshold) {
  const factor = STAGE_FACTORS[stage];
  if (!factor) return null;
  return Math.max(1, Math.ceil(Number(baseThreshold) * factor));
}

function describeWaitingOn(waitingOn) {
  if (waitingOn === "company") return "the company";
  if (waitingOn === "candidate") return "the candidate";
  return "an external dependency";
}

const STAGE_ACTIONS = Object.freeze({
  applied: "review the application and either advance it or close the loop today",
  recruiter_screen: "schedule the screen or record the decision and send a concrete update",
  hiring_manager_review: "request a same-day manager decision and update the candidate",
  assessment: "review the submission or clarify the completion plan today",
  interview: "collect the missing feedback, hold the debrief, and update the candidate",
  reference_check: "unblock the checks, record an ETA, and update the candidate",
  offer: "resolve the approval or open question and call the candidate today",
});

export function suggestedAction(record) {
  const stageAction = STAGE_ACTIONS[record.stage];
  if (!record.owner) return `assign an owner, then ${stageAction}`;
  if (record.promiseOverdue) {
    return `honor or reset the overdue commitment, then ${stageAction}`;
  }
  if (record.waitingOn === "candidate") {
    return "send one courteous reminder with a clear response-by date and offer help";
  }
  if (record.waitingOn === "external") {
    return "chase the outside dependency, record an ETA, and update the candidate";
  }
  return stageAction;
}

export function oneSentenceExplanation(record) {
  const commitment = record.promiseOverdue
    ? `, with the next-step commitment ${record.promiseDaysOverdue} day${record.promiseDaysOverdue === 1 ? "" : "s"} overdue`
    : "";
  return `${record.candidateName} has been in ${record.stageLabel} for ${record.daysInStage} calendar days against the ${record.thresholdDays}-day limit${commitment}, while waiting on ${describeWaitingOn(record.waitingOn)}; ${suggestedAction(record)}.`;
}

function validateDateField(row, field, label, asOf, { required = false, futureAllowed = false } = {}) {
  const value = String(row[field] ?? "").trim();
  if (!value) return required ? { error: `${label} is required.` } : { date: null };
  const date = parseIsoDate(value);
  if (!date) return { error: `${label} must use YYYY-MM-DD.` };
  if (!futureAllowed && date > asOf) return { error: `${label} is after the as-of date.` };
  return { date };
}

function validateRow(row, asOf) {
  const rowErrors = [];
  const applicationId = String(row.application_id ?? "").trim();
  const candidateName = String(row.candidate_name ?? "").trim();
  const role = String(row.role ?? "").trim();
  const owner = String(row.owner ?? "").trim();
  const stage = normalizeStage(row.stage);
  const waitingOn = canonicalToken(row.waiting_on).replace(/ /g, "_");

  if (!applicationId) rowErrors.push("application_id is required.");
  if (!candidateName) rowErrors.push("candidate_name is required.");
  if (!role) rowErrors.push("role is required.");
  if (!stage) rowErrors.push(`stage “${String(row.stage ?? "").trim()}” is not recognized.`);
  if (!WAITING_ON.includes(waitingOn)) {
    rowErrors.push("waiting_on must be company, candidate, or external.");
  }

  const entered = validateDateField(row, "stage_entered_on", "stage_entered_on", asOf, {
    required: true,
  });
  if (entered.error) rowErrors.push(entered.error);

  const contact = validateDateField(row, "last_contact_on", "last_contact_on", asOf);
  if (contact.error) rowErrors.push(contact.error);

  const due = validateDateField(row, "next_step_due_on", "next_step_due_on", asOf, {
    futureAllowed: true,
  });
  if (due.error) rowErrors.push(due.error);
  if (!due.error && entered.date && due.date && due.date < entered.date) {
    rowErrors.push("next_step_due_on is before stage_entered_on.");
  }

  return {
    errors: rowErrors,
    applicationId,
    candidateName,
    role,
    owner,
    stage,
    waitingOn,
    stageEnteredOn: entered.date ?? null,
    lastContactOn: contact.date ?? null,
    nextStepDueOn: due.date ?? null,
  };
}

function compareRank(a, b) {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  if (b.promiseOverdue !== a.promiseOverdue) return Number(b.promiseOverdue) - Number(a.promiseOverdue);
  if (b.waitRatio !== a.waitRatio) return b.waitRatio - a.waitRatio;
  if (b.daysInStage !== a.daysInStage) return b.daysInStage - a.daysInStage;
  return a.applicationId.localeCompare(b.applicationId);
}

export function analyzeBoard(rows, options = {}) {
  const baseThreshold = Math.max(1, Math.min(60, Number(options.baseThreshold) || 7));
  const asOf = options.asOf instanceof Date ? options.asOf : parseIsoDate(options.asOf);
  if (!asOf) throw new Error("A valid as-of date is required.");

  const idCounts = new Map();
  for (const row of rows) {
    const id = String(row.application_id ?? "").trim().toLowerCase();
    if (id) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }

  const active = [];
  const terminal = [];
  const invalid = [];

  for (const row of rows) {
    const validated = validateRow(row, asOf);
    const duplicateCount = idCounts.get(validated.applicationId.toLowerCase()) ?? 0;
    if (validated.applicationId && duplicateCount > 1) {
      validated.errors.push(`application_id is duplicated ${duplicateCount} times.`);
    }

    if (validated.errors.length) {
      invalid.push({
        line: row.__line ?? null,
        applicationId: validated.applicationId || "—",
        candidateName: validated.candidateName || "—",
        errors: validated.errors,
      });
      continue;
    }

    if (TERMINAL_STAGES.includes(validated.stage)) {
      terminal.push({ ...validated, stageLabel: STAGE_LABELS[validated.stage] });
      continue;
    }

    const thresholdDays = thresholdForStage(validated.stage, baseThreshold);
    const daysInStage = calendarDaysBetween(validated.stageEnteredOn, asOf);
    const waitRatio = daysInStage / thresholdDays;
    const promiseOverdue = Boolean(validated.nextStepDueOn && validated.nextStepDueOn < asOf);
    const promiseDaysOverdue = promiseOverdue
      ? calendarDaysBetween(validated.nextStepDueOn, asOf)
      : 0;
    const contactAge = validated.lastContactOn
      ? calendarDaysBetween(validated.lastContactOn, asOf)
      : null;
    const agePoints = Math.floor(100 * waitRatio);
    const promisePoints = promiseOverdue ? 30 : 0;
    const responsibilityPoints = { company: 15, external: 8, candidate: 0 }[validated.waitingOn];
    const contactPoints = contactAge === null ? 20 : Math.min(20, Math.max(0, contactAge));
    const priorityScore = agePoints + promisePoints + responsibilityPoints + contactPoints;
    const stalled = daysInStage >= thresholdDays;
    const daysOverLimit = stalled ? daysInStage - thresholdDays : 0;

    const record = {
      ...validated,
      stageLabel: STAGE_LABELS[validated.stage],
      stageFactor: STAGE_FACTORS[validated.stage],
      thresholdDays,
      daysInStage,
      daysOverLimit,
      waitRatio,
      promiseOverdue,
      promiseDaysOverdue,
      contactAge,
      agePoints,
      promisePoints,
      responsibilityPoints,
      contactPoints,
      priorityScore,
      stalled,
    };
    record.action = suggestedAction(record);
    record.explanation = oneSentenceExplanation(record);
    record.severity = priorityScore >= 220 ? "critical" : priorityScore >= 160 ? "high" : "due";
    active.push(record);
  }

  const flagged = active
    .filter((record) => record.stalled)
    .sort(compareRank)
    .map((record, index) => ({ ...record, rank: index + 1 }));
  const healthy = active.filter((record) => !record.stalled).sort(compareRank);
  const processDebt = flagged.reduce((sum, record) => sum + record.daysOverLimit, 0);
  const overdueCommitments = flagged.filter((record) => record.promiseOverdue).length;
  const waitingOnCompany = flagged.filter((record) => record.waitingOn === "company").length;
  const owners = new Set(flagged.map((record) => record.owner || "Unassigned"));

  return {
    asOf: formatIsoDate(asOf),
    baseThreshold,
    active,
    flagged,
    healthy,
    terminal,
    invalid,
    summary: {
      inputRows: rows.length,
      flagged: flagged.length,
      healthy: healthy.length,
      terminal: terminal.length,
      invalid: invalid.length,
      processDebt,
      overdueCommitments,
      waitingOnCompany,
      owners: owners.size,
    },
  };
}

export function sanitizeSpreadsheetCell(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function csvCell(value) {
  const safe = sanitizeSpreadsheetCell(value);
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function serializeCsv(rows, headers) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

export function exportQueueCsv(flagged) {
  const headers = [
    "rank",
    "application_id",
    "candidate_name",
    "role",
    "stage",
    "owner",
    "waiting_on",
    "days_in_stage",
    "threshold_days",
    "days_over_limit",
    "priority_score",
    "explanation",
    "recommended_action",
  ];
  const rows = flagged.map((record, index) => ({
    rank: record.rank ?? index + 1,
    application_id: record.applicationId,
    candidate_name: record.candidateName,
    role: record.role,
    stage: record.stageLabel,
    owner: record.owner || "Unassigned",
    waiting_on: record.waitingOn,
    days_in_stage: record.daysInStage,
    threshold_days: record.thresholdDays,
    days_over_limit: record.daysOverLimit,
    priority_score: record.priorityScore,
    explanation: record.explanation,
    recommended_action: record.action,
  }));
  return serializeCsv(rows, headers);
}
