import {
  CSV_LIMITS,
  STAGE_FACTORS,
  STAGE_LABELS,
  analyzeBoard,
  exportQueueCsv,
  parseCsv,
  parseIsoDate,
  serializeCsv,
  thresholdForStage,
} from "./core.js";
import { runBenchmarkSuite } from "./benchmark.js";

const DEMO_AS_OF = "2026-10-12";
const SAMPLE_PATH = "./sample-data/hiring_board.csv";
const ADVERSARIAL_PATH = "./sample-data/adversarial.csv";
const MAX_RENDERED_QUEUE = 200;
const captureMode = new URLSearchParams(window.location.search).get("capture");
if (["queue", "quality"].includes(captureMode)) {
  document.body.classList.add(`capture-${captureMode}`);
}

const state = {
  fileName: "hiring_board.csv",
  parsed: null,
  analysis: null,
  baseThreshold: 7,
  asOf: DEMO_AS_OF,
  search: "",
  stage: "all",
  owner: "all",
  waiting: "all",
};

const dom = {
  hero: document.querySelector(".hero"),
  parallaxButtons: document.querySelectorAll("[data-parallax-button]"),
  fileInput: document.querySelector("#file-input"),
  uploadButton: document.querySelector("#upload-button"),
  dropZone: document.querySelector("#drop-zone"),
  sampleButton: document.querySelector("#sample-button"),
  asOfInput: document.querySelector("#as-of"),
  thresholdInput: document.querySelector("#threshold"),
  thresholdValue: document.querySelector("#threshold-value"),
  thresholdRail: document.querySelector("#threshold-rail"),
  fileName: document.querySelector("#file-name"),
  fileMeta: document.querySelector("#file-meta"),
  statusDot: document.querySelector("#status-dot"),
  metricStalled: document.querySelector("#metric-stalled"),
  metricDebt: document.querySelector("#metric-debt"),
  metricPromises: document.querySelector("#metric-promises"),
  metricQuality: document.querySelector("#metric-quality"),
  metricStalledNote: document.querySelector("#metric-stalled-note"),
  metricDebtNote: document.querySelector("#metric-debt-note"),
  metricPromisesNote: document.querySelector("#metric-promises-note"),
  metricQualityNote: document.querySelector("#metric-quality-note"),
  queue: document.querySelector("#queue"),
  queueCount: document.querySelector("#queue-count"),
  emptyState: document.querySelector("#empty-state"),
  searchInput: document.querySelector("#search"),
  stageFilter: document.querySelector("#stage-filter"),
  ownerFilter: document.querySelector("#owner-filter"),
  waitingFilter: document.querySelector("#waiting-filter"),
  clearFilters: document.querySelector("#clear-filters"),
  exportButton: document.querySelector("#export-button"),
  stageChart: document.querySelector("#stage-chart"),
  coverageCopy: document.querySelector("#coverage-copy"),
  qualityList: document.querySelector("#quality-list"),
  qualityCount: document.querySelector("#quality-count"),
  qualityPanel: document.querySelector("#quality-panel"),
  validationButton: document.querySelector("#validation-button"),
  rulesButton: document.querySelector("#rules-button"),
  rulesDialog: document.querySelector("#rules-dialog"),
  closeRules: document.querySelector("#close-rules"),
  acknowledgeRules: document.querySelector("#acknowledge-rules"),
  benchmarkGrid: document.querySelector("#benchmark-grid"),
  benchmarkCard: document.querySelector(".benchmark-card--results"),
  benchmarkButton: document.querySelector("#run-benchmark"),
  benchmarkStatus: document.querySelector("#benchmark-status"),
  benchmarkResults: document.querySelector("#benchmark-results"),
  benchmarkMethod: document.querySelector("#benchmark-method"),
  loadCleanDemo: document.querySelector("#load-clean-demo"),
  loadAdversarialDemo: document.querySelector("#load-adversarial-demo"),
  toast: document.querySelector("#toast"),
  liveRegion: document.querySelector("#live-region"),
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const span = element("span", "inline-icon");
  span.setAttribute("aria-hidden", "true");
  const icons = {
    arrow: "↗",
    clock: "◷",
    owner: "◎",
    check: "✓",
    alert: "!",
    copy: "⧉",
  };
  span.textContent = icons[name] ?? "•";
  return span;
}

function announce(message) {
  dom.liveRegion.textContent = message;
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2400);
}

function download(name, content, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function titleCase(value) {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function setSelectOptions(select, values, allLabel) {
  const current = select.value;
  select.replaceChildren();
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = allLabel;
  select.append(all);
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
  select.value = values.includes(current) ? current : "all";
}

function filteredQueue() {
  if (!state.analysis) return [];
  const query = state.search.trim().toLowerCase();
  return state.analysis.flagged.filter((record) => {
    const searchMatch =
      !query ||
      [record.candidateName, record.role, record.applicationId, record.owner]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return (
      searchMatch &&
      (state.stage === "all" || record.stage === state.stage) &&
      (state.owner === "all" || (record.owner || "Unassigned") === state.owner) &&
      (state.waiting === "all" || record.waitingOn === state.waiting)
    );
  });
}

function renderThresholds() {
  dom.thresholdValue.textContent = `${state.baseThreshold} days`;
  dom.thresholdRail.replaceChildren();
  for (const stage of Object.keys(STAGE_FACTORS)) {
    const item = element("div", "threshold-chip");
    item.append(
      element("span", "threshold-chip__label", STAGE_LABELS[stage]),
      element("strong", "threshold-chip__value", `${thresholdForStage(stage, state.baseThreshold)}d`),
    );
    dom.thresholdRail.append(item);
  }
}

function renderMetrics() {
  const summary = state.analysis.summary;
  const structuralErrors = state.parsed.errors.length;
  const issueCount = summary.invalid + structuralErrors;
  dom.metricStalled.textContent = String(summary.flagged).padStart(2, "0");
  dom.metricDebt.textContent = String(summary.processDebt).padStart(2, "0");
  dom.metricPromises.textContent = String(summary.overdueCommitments).padStart(2, "0");
  dom.metricQuality.textContent = String(issueCount).padStart(2, "0");
  dom.metricStalledNote.textContent = `${summary.healthy} active rows still within their limit`;
  dom.metricDebtNote.textContent = `${summary.processDebt === 1 ? "calendar day" : "calendar days"} beyond stage limits`;
  dom.metricPromisesNote.textContent = `${summary.overdueCommitments} recorded next ${summary.overdueCommitments === 1 ? "step is" : "steps are"} past due`;
  dom.metricQualityNote.textContent = issueCount ? "Open the data-quality panel before acting" : "Every imported row reconciled";
}

function scoreBreakdown(record) {
  const box = element("div", "score-breakdown");
  const parts = [
    ["Stage-age ratio", record.agePoints, `${record.daysInStage} ÷ ${record.thresholdDays} × 100`],
    ["Overdue commitment", record.promisePoints, record.promiseOverdue ? "Recorded due date has passed" : "Not overdue"],
    ["Waiting responsibility", record.responsibilityPoints, titleCase(record.waitingOn)],
    ["Contact age", record.contactPoints, record.contactAge === null ? "No contact recorded" : `${record.contactAge} days, capped at 20`],
  ];

  for (const [label, points, detail] of parts) {
    const row = element("div", "score-row");
    const copy = element("div", "score-row__copy");
    copy.append(element("strong", "", label), element("span", "", detail));
    row.append(copy, element("b", "", `+${points}`));
    box.append(row);
  }
  const total = element("div", "score-row score-row--total");
  total.append(element("strong", "", "Priority index"), element("b", "", String(record.priorityScore)));
  box.append(total);
  return box;
}

function queueCard(record, rank) {
  const card = element("article", `queue-card queue-card--${record.severity}`);
  const head = element("div", "queue-card__head");
  const rankNode = element("div", "rank", String(rank).padStart(2, "0"));
  rankNode.setAttribute("aria-label", `Priority ${rank}`);

  const identity = element("div", "identity");
  identity.append(
    element("h3", "", record.candidateName),
    element("p", "", `${record.role} · ${record.applicationId}`),
  );

  const score = element("div", "priority-index");
  score.append(element("span", "", "INDEX"), element("strong", "", String(record.priorityScore)));
  head.append(rankNode, identity, score);

  const facts = element("div", "fact-row");
  const factValues = [
    ["clock", `${record.daysInStage}d in stage`, record.daysOverLimit ? `+${record.daysOverLimit}d over` : "at limit"],
    ["arrow", record.stageLabel, `${record.thresholdDays}d limit`],
    ["owner", record.owner || "Unassigned", `waiting on ${record.waitingOn}`],
  ];
  for (const [iconName, primary, secondary] of factValues) {
    const fact = element("div", "fact");
    fact.append(icon(iconName));
    const text = element("span", "");
    text.append(element("strong", "", primary), element("small", "", secondary));
    fact.append(text);
    facts.append(fact);
  }

  const explanation = element("p", "explanation", record.explanation);
  const footer = element("div", "queue-card__footer");
  const badges = element("div", "badges");
  badges.append(element("span", `badge badge--${record.severity}`, record.severity));
  if (record.promiseOverdue) badges.append(element("span", "badge badge--promise", "promise overdue"));

  const actions = element("div", "card-actions");
  const copyButton = element("button", "text-button", "Copy action");
  copyButton.type = "button";
  copyButton.prepend(icon("copy"));
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(record.action);
      showToast("Action copied to clipboard");
    } catch {
      showToast("Clipboard access is unavailable");
    }
  });

  const details = element("details", "why-details");
  const summary = element("summary", "text-button", "Why this rank");
  details.append(summary, scoreBreakdown(record));
  actions.append(copyButton, details);
  footer.append(badges, actions);
  card.append(head, facts, explanation, footer);
  return card;
}

function renderQueue() {
  const records = filteredQueue();
  const visibleRecords = records.slice(0, MAX_RENDERED_QUEUE);
  const rankByApplication = new Map(
    state.analysis.flagged.map((record, index) => [record.applicationId, index + 1]),
  );
  dom.queue.replaceChildren();
  dom.queueCount.textContent = records.length > visibleRecords.length
    ? `Showing first ${visibleRecords.length} of ${records.length} matches · export includes all`
    : `Showing ${records.length} of ${state.analysis.flagged.length}`;
  dom.exportButton.disabled = records.length === 0;

  if (records.length === 0) {
    dom.emptyState.hidden = false;
    const title = dom.emptyState.querySelector("h3");
    const copy = dom.emptyState.querySelector("p");
    if (state.analysis.flagged.length === 0) {
      title.textContent = "No stalls at these settings";
      copy.textContent = "The file was processed successfully, but every valid active row is still within its stage limit.";
    } else {
      title.textContent = "No matches in the queue";
      copy.textContent = "The board has stalled candidates, but none match the current filters.";
    }
    return;
  }

  dom.emptyState.hidden = true;
  visibleRecords.forEach((record) => {
    const overallRank = rankByApplication.get(record.applicationId);
    dom.queue.append(queueCard(record, overallRank));
  });
}

function renderFilters() {
  const stageValues = [...new Set(state.analysis.flagged.map((record) => record.stage))]
    .sort()
    .map((stage) => ({ value: stage, label: STAGE_LABELS[stage] }));
  const currentStage = dom.stageFilter.value;
  dom.stageFilter.replaceChildren();
  const allStage = document.createElement("option");
  allStage.value = "all";
  allStage.textContent = "All stages";
  dom.stageFilter.append(allStage);
  for (const stage of stageValues) {
    const option = document.createElement("option");
    option.value = stage.value;
    option.textContent = stage.label;
    dom.stageFilter.append(option);
  }
  dom.stageFilter.value = stageValues.some((stage) => stage.value === currentStage) ? currentStage : "all";
  state.stage = dom.stageFilter.value;

  const owners = [...new Set(state.analysis.flagged.map((record) => record.owner || "Unassigned"))].sort();
  setSelectOptions(dom.ownerFilter, owners, "All owners");
  state.owner = dom.ownerFilter.value;

  const waits = [...new Set(state.analysis.flagged.map((record) => record.waitingOn))].sort();
  setSelectOptions(dom.waitingFilter, waits, "Waiting on anyone");
  state.waiting = dom.waitingFilter.value;
}

function renderStageChart() {
  dom.stageChart.replaceChildren();
  const stages = Object.keys(STAGE_FACTORS)
    .map((stage) => {
      const active = state.analysis.active.filter((record) => record.stage === stage);
      const stalled = active.filter((record) => record.stalled).length;
      return { stage, active: active.length, stalled };
    })
    .filter((item) => item.active > 0);
  const max = Math.max(1, ...stages.map((item) => item.active));
  for (const item of stages) {
    const row = element("div", "chart-row");
    const label = element("div", "chart-row__label");
    label.append(element("span", "", STAGE_LABELS[item.stage]), element("strong", "", `${item.stalled}/${item.active}`));
    const track = element("div", "bar-track");
    const activeBar = element("span", "bar bar--active");
    activeBar.style.width = `${(item.active / max) * 100}%`;
    const stalledBar = element("span", "bar bar--stalled");
    stalledBar.style.width = `${(item.stalled / max) * 100}%`;
    track.append(activeBar, stalledBar);
    row.append(label, track);
    dom.stageChart.append(row);
  }

  const summary = state.analysis.summary;
  dom.coverageCopy.textContent = `${summary.inputRows} parsed rows reconcile to ${summary.flagged} stalled, ${summary.healthy} within limit, ${summary.terminal} terminal, and ${summary.invalid} invalid.`;
}

function renderQuality() {
  const issues = [
    ...state.parsed.errors.map((message) => ({ id: "CSV", line: null, messages: [message] })),
    ...state.analysis.invalid.map((item) => ({
      id: item.applicationId,
      line: item.line,
      messages: item.errors,
    })),
  ];
  dom.qualityList.replaceChildren();
  dom.qualityCount.textContent = `${issues.length} ${issues.length === 1 ? "issue" : "issues"}`;
  dom.validationButton.disabled = issues.length === 0;

  if (!issues.length && !state.parsed.warnings.length) {
    const success = element("div", "quality-success");
    success.append(icon("check"), element("span", "", "No row-level or structural issues found."));
    dom.qualityList.append(success);
    return;
  }

  for (const issue of issues) {
    const item = element("div", "quality-item");
    const key = element("div", "quality-item__key", issue.id);
    if (issue.line) key.append(element("small", "", `line ${issue.line}`));
    const messages = element("ul", "");
    issue.messages.forEach((message) => messages.append(element("li", "", message)));
    item.append(key, messages);
    dom.qualityList.append(item);
  }

  for (const warning of state.parsed.warnings) {
    const item = element("div", "quality-item quality-item--warning");
    item.append(element("div", "quality-item__key", "NOTE"), element("p", "", warning));
    dom.qualityList.append(item);
  }
}

function renderFileStatus() {
  dom.fileName.textContent = state.fileName;
  const issueCount = state.analysis.summary.invalid + state.parsed.errors.length;
  dom.fileMeta.textContent = `${state.analysis.summary.inputRows} parsed rows · ${issueCount} ${issueCount === 1 ? "issue" : "issues"}`;
  dom.statusDot.className = issueCount ? "status-dot status-dot--warning" : "status-dot status-dot--ok";
}

function runAnalysis() {
  if (!state.parsed) return;
  const asOf = parseIsoDate(state.asOf);
  if (!asOf) {
    showToast("Choose a valid as-of date");
    return;
  }
  state.analysis = analyzeBoard(state.parsed.rows, {
    baseThreshold: state.baseThreshold,
    asOf,
  });
  renderThresholds();
  renderMetrics();
  renderFilters();
  renderQueue();
  renderStageChart();
  renderQuality();
  renderFileStatus();
  announce(`${state.analysis.summary.flagged} stalled candidates found.`);
}

async function loadCsvText(text, fileName, { resetDate = false } = {}) {
  state.fileName = fileName;
  state.parsed = parseCsv(text);
  if (resetDate) {
    state.asOf = DEMO_AS_OF;
    dom.asOfInput.value = DEMO_AS_OF;
  }
  runAnalysis();
}

function resetDemoScenario() {
  state.baseThreshold = 7;
  state.asOf = DEMO_AS_OF;
  state.search = "";
  state.stage = "all";
  state.owner = "all";
  state.waiting = "all";

  dom.asOfInput.value = DEMO_AS_OF;
  dom.thresholdInput.value = "7";
  dom.searchInput.value = "";
  dom.stageFilter.value = "all";
  dom.ownerFilter.value = "all";
  dom.waitingFilter.value = "all";
}

async function loadBundledDemo(path, fileName, successMessage) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Sample request failed with ${response.status}`);
    const text = await response.text();
    resetDemoScenario();
    await loadCsvText(text, fileName);
    showToast(successMessage);
    return true;
  } catch (error) {
    console.error(error);
    showToast("Could not load the bundled demo");
    return false;
  }
}

async function loadSample() {
  return loadBundledDemo(SAMPLE_PATH, "hiring_board.csv", "Fictional sample board loaded");
}

async function loadAdversarialSample() {
  return loadBundledDemo(
    ADVERSARIAL_PATH,
    "adversarial.csv",
    "Adversarial demo loaded — inspect data quality",
  );
}

function formatMilliseconds(value) {
  if (!Number.isFinite(value)) return "—";
  if (value < 0.1) return "<0.1 ms";
  if (value < 10) return `${value.toFixed(2)} ms`;
  return `${value.toFixed(1)} ms`;
}

function renderBenchmarkResults(suite) {
  dom.benchmarkResults.replaceChildren();
  const number = new Intl.NumberFormat("en-US");

  for (const result of suite.results) {
    const row = document.createElement("tr");
    const rows = element("th", "", number.format(result.rows));
    rows.scope = "row";
    const passed = result.correct && result.deterministic;
    const check = element("span", `check-chip check-chip--${passed ? "pass" : "fail"}`, passed ? "PASS" : "FAIL");
    const checkCell = document.createElement("td");
    checkCell.append(check);
    row.append(
      rows,
      element("td", "", formatMilliseconds(result.medianMs)),
      element("td", "", formatMilliseconds(result.p95Ms)),
      element("td", "", result.rows >= 1_000 ? number.format(result.rowsPerSecond) : "—"),
      checkCell,
    );
    dom.benchmarkResults.append(row);
  }

  dom.benchmarkMethod.textContent = `${suite.warmups} warmups + ${suite.runs} measured runs per scale · generated CSV is outside the timer · queue-card rendering is excluded`;
}

let benchmarkRunning = false;
async function runBenchmarks({ automatic = false } = {}) {
  if (benchmarkRunning) return;
  benchmarkRunning = true;
  dom.benchmarkCard.setAttribute("aria-busy", "true");
  dom.benchmarkButton.disabled = true;
  dom.benchmarkButton.firstChild.textContent = "Running locally ";

  try {
    const suite = await runBenchmarkSuite({
      warmups: 3,
      runs: 15,
      onProgress: ({ phase, size }) => {
        const verb = phase === "warming" ? "Warming" : phase === "measuring" ? "Measuring" : "Checked";
        dom.benchmarkStatus.textContent = `${verb} ${size.toLocaleString("en-US")} rows…`;
      },
      yieldControl: () => new Promise((resolve) => window.requestAnimationFrame(resolve)),
    });
    renderBenchmarkResults(suite);
    const passed = suite.results.every((result) => result.correct && result.deterministic);
    dom.benchmarkStatus.textContent = passed
      ? "Measured in this browser · every correctness signature passed."
      : "Benchmark completed with a correctness failure — treat timings as invalid.";
    announce(passed ? "Engine benchmarks complete. All correctness checks passed." : "Benchmark correctness check failed.");
    if (!automatic) showToast("Local engine benchmark complete");
  } catch (error) {
    console.error(error);
    dom.benchmarkStatus.textContent = "Benchmark could not complete in this browser.";
    announce("Engine benchmark could not complete.");
  } finally {
    benchmarkRunning = false;
    dom.benchmarkCard.setAttribute("aria-busy", "false");
    dom.benchmarkButton.disabled = false;
    dom.benchmarkButton.firstChild.textContent = "Run again ";
  }
}

function setupSignalSpotlights() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reducedMotion) return;

  let frame = null;
  let pending = null;
  dom.benchmarkGrid.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".signal-spotlight");
    if (!card || !dom.benchmarkGrid.contains(card)) return;
    pending = { card, clientX: event.clientX, clientY: event.clientY };
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      const rect = pending.card.getBoundingClientRect();
      pending.card.style.setProperty("--spot-x", `${pending.clientX - rect.left}px`);
      pending.card.style.setProperty("--spot-y", `${pending.clientY - rect.top}px`);
      frame = null;
    });
  });
}

function setupHeroInteractions() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!dom.hero || !finePointer || reducedMotion) return;

  let heroFrame = null;
  let heroPointer = null;
  const paintHero = () => {
    const rect = dom.hero.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (heroPointer.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (heroPointer.clientY - rect.top) / rect.height));
    dom.hero.style.setProperty("--hero-x", `${(x * 100).toFixed(2)}%`);
    dom.hero.style.setProperty("--hero-y", `${(y * 100).toFixed(2)}%`);
    dom.hero.style.setProperty("--hero-pan-x", `${((x - 0.5) * 14).toFixed(2)}px`);
    dom.hero.style.setProperty("--hero-pan-y", `${((y - 0.5) * 12).toFixed(2)}px`);
    dom.hero.style.setProperty("--hero-pan-x-neg", `${((0.5 - x) * 8).toFixed(2)}px`);
    dom.hero.style.setProperty("--hero-pan-y-neg", `${((0.5 - y) * 7).toFixed(2)}px`);
    heroFrame = null;
  };

  dom.hero.addEventListener("pointermove", (event) => {
    heroPointer = event;
    if (heroFrame !== null) return;
    heroFrame = window.requestAnimationFrame(paintHero);
  });
  dom.hero.addEventListener("pointerleave", () => {
    if (heroFrame !== null) window.cancelAnimationFrame(heroFrame);
    heroFrame = null;
    dom.hero.style.removeProperty("--hero-x");
    dom.hero.style.removeProperty("--hero-y");
    dom.hero.style.removeProperty("--hero-pan-x");
    dom.hero.style.removeProperty("--hero-pan-y");
    dom.hero.style.removeProperty("--hero-pan-x-neg");
    dom.hero.style.removeProperty("--hero-pan-y-neg");
  });

  for (const button of dom.parallaxButtons) {
    let buttonFrame = null;
    let buttonPointer = null;
    const resetButton = () => {
      if (buttonFrame !== null) window.cancelAnimationFrame(buttonFrame);
      buttonFrame = null;
      button.style.setProperty("--button-x", "0px");
      button.style.setProperty("--button-y", "0px");
    };
    const paintButton = () => {
      const rect = button.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (buttonPointer.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (buttonPointer.clientY - rect.top) / rect.height));
      button.style.setProperty("--button-x", `${((x - 0.5) * 10).toFixed(2)}px`);
      button.style.setProperty("--button-y", `${((y - 0.5) * 8).toFixed(2)}px`);
      buttonFrame = null;
    };
    button.addEventListener("pointermove", (event) => {
      buttonPointer = event;
      if (buttonFrame !== null) return;
      buttonFrame = window.requestAnimationFrame(paintButton);
    });
    button.addEventListener("pointerleave", resetButton);
    button.addEventListener("pointercancel", resetButton);
    button.addEventListener("blur", resetButton);
  }
}

function revealQueueAfterDemo() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#priority-queue").scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function scheduleBenchmarks() {
  const start = () => runBenchmarks({ automatic: true });
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 2_000 });
  } else {
    window.setTimeout(start, 600);
  }
}

async function handleFile(file) {
  if (!file) return;
  if (file.size > CSV_LIMITS.maxCharacters) {
    showToast("Choose a CSV smaller than 2 MB");
    announce("The selected file was rejected because it exceeds the 2 MB processing limit.");
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    showToast("Driftline accepts .csv files only");
    announce("The selected file was rejected because it is not a CSV file.");
    return;
  }
  try {
    const today = new Date();
    state.asOf = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    dom.asOfInput.value = state.asOf;
    await loadCsvText(await file.text(), file.name);
    showToast("CSV processed locally");
  } catch (error) {
    console.error(error);
    showToast("The CSV could not be read");
    announce("The selected CSV could not be read. No queue was created.");
  } finally {
    dom.fileInput.value = "";
  }
}

function bindEvents() {
  dom.uploadButton.addEventListener("click", () => dom.fileInput.click());
  dom.dropZone.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    dom.fileInput.click();
  });
  dom.dropZone.addEventListener("keydown", (event) => {
    if (event.target === dom.dropZone && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      dom.fileInput.click();
    }
  });
  dom.fileInput.addEventListener("change", () => handleFile(dom.fileInput.files[0]));
  for (const eventName of ["dragenter", "dragover"]) {
    dom.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.dropZone.classList.add("is-dragging");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    dom.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.dropZone.classList.remove("is-dragging");
    });
  }
  dom.dropZone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));
  dom.sampleButton.addEventListener("click", loadSample);

  dom.thresholdInput.addEventListener("input", () => {
    state.baseThreshold = Number(dom.thresholdInput.value);
    runAnalysis();
  });
  dom.asOfInput.addEventListener("change", () => {
    state.asOf = dom.asOfInput.value;
    runAnalysis();
  });

  dom.searchInput.addEventListener("input", () => {
    state.search = dom.searchInput.value;
    renderQueue();
  });
  dom.stageFilter.addEventListener("change", () => {
    state.stage = dom.stageFilter.value;
    renderQueue();
  });
  dom.ownerFilter.addEventListener("change", () => {
    state.owner = dom.ownerFilter.value;
    renderQueue();
  });
  dom.waitingFilter.addEventListener("change", () => {
    state.waiting = dom.waitingFilter.value;
    renderQueue();
  });
  dom.clearFilters.addEventListener("click", () => {
    state.search = "";
    state.stage = "all";
    state.owner = "all";
    state.waiting = "all";
    dom.searchInput.value = "";
    dom.stageFilter.value = "all";
    dom.ownerFilter.value = "all";
    dom.waitingFilter.value = "all";
    renderQueue();
  });

  dom.exportButton.addEventListener("click", () => {
    const records = filteredQueue();
    download(`driftline-follow-up-${state.analysis.asOf}.csv`, exportQueueCsv(records));
    showToast(`${records.length} queue ${records.length === 1 ? "row" : "rows"} exported`);
  });

  dom.validationButton.addEventListener("click", () => {
    const rows = [
      ...state.parsed.errors.map((message) => ({ line: "", application_id: "CSV", issue: message })),
      ...state.analysis.invalid.flatMap((item) =>
        item.errors.map((message) => ({
          line: item.line ?? "",
          application_id: item.applicationId,
          issue: message,
        })),
      ),
    ];
    download("driftline-validation-report.csv", serializeCsv(rows, ["line", "application_id", "issue"]));
  });

  dom.rulesButton.addEventListener("click", () => dom.rulesDialog.showModal());
  dom.closeRules.addEventListener("click", () => dom.rulesDialog.close());
  dom.acknowledgeRules.addEventListener("click", () => dom.rulesDialog.close());
  dom.rulesDialog.addEventListener("click", (event) => {
    if (event.target === dom.rulesDialog) dom.rulesDialog.close();
  });

  dom.benchmarkButton.addEventListener("click", () => runBenchmarks());
  dom.loadCleanDemo.addEventListener("click", async () => {
    if (await loadSample()) revealQueueAfterDemo();
  });
  dom.loadAdversarialDemo.addEventListener("click", async () => {
    if (await loadAdversarialSample()) revealQueueAfterDemo();
  });
}

dom.asOfInput.value = DEMO_AS_OF;
dom.thresholdInput.value = String(state.baseThreshold);
bindEvents();
setupSignalSpotlights();
setupHeroInteractions();
await loadSample();
scheduleBenchmarks();
