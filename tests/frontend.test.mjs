import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, css, app] = await Promise.all([
  readFile(new URL("../src/index.html", import.meta.url), "utf8"),
  readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
]);

test("hero calls to action remain native links with valid page targets", () => {
  assert.match(html, /<a class="glass-cta"[^>]+href="#input-deck"/);
  assert.match(html, /<a class="vector-cta"[^>]+href="#evidence-lab"/);
  assert.match(html, /id="input-deck"/);
  assert.match(html, /id="evidence-lab"/);
  assert.match(css, /#top,\s*#input-deck,\s*#priority-queue,\s*#evidence-lab\s*\{\s*scroll-margin-top:/);
});

test("all new visual layers are decorative and the visible hero keeps a heading", () => {
  assert.match(html, /class="hero__aurora" aria-hidden="true"/);
  assert.match(html, /class="hero__grain" aria-hidden="true" focusable="false"/);
  assert.match(html, /<h1 id="hero-title">/);
  assert.match(html, /aria-labelledby="hero-title"/);
});

test("pointer enhancements are gated and motion fallbacks are present", () => {
  assert.match(app, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)/);
});

test("markup contains no inline event handlers", () => {
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
});

test("CSV-backed UI rendering avoids executable HTML sinks", () => {
  assert.doesNotMatch(
    app,
    /\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|createContextualFragment\s*\(/,
  );
  assert.match(app, /node\.textContent = text;/);
});

test("bundled demos restore the documented baseline before analysis", () => {
  const resetStart = app.indexOf("function resetDemoScenario() {");
  const loaderStart = app.indexOf("async function loadBundledDemo(");
  const loaderEnd = app.indexOf("async function loadSample()", loaderStart);
  assert.ok(resetStart >= 0);
  assert.ok(loaderStart > resetStart);
  assert.ok(loaderEnd > loaderStart);

  const reset = app.slice(resetStart, loaderStart);
  assert.match(reset, /state\.baseThreshold = 7;/);
  assert.match(reset, /state\.asOf = DEMO_AS_OF;/);
  assert.match(reset, /state\.search = "";/);
  assert.match(reset, /state\.stage = "all";/);
  assert.match(reset, /state\.owner = "all";/);
  assert.match(reset, /state\.waiting = "all";/);
  assert.match(reset, /dom\.thresholdInput\.value = "7";/);
  assert.match(reset, /dom\.searchInput\.value = "";/);

  const loader = app.slice(loaderStart, loaderEnd);
  assert.ok(loader.indexOf("resetDemoScenario();") < loader.indexOf("loadCsvText(text, fileName)"));
});

test("evidence jargon is defined in plain language at the point of use", () => {
  assert.match(html, /aria-label="Evidence terms in plain language"/);
  assert.match(html, />PROCESS DEBT</);
  assert.match(html, /workflow delay, not candidate risk/);
  assert.match(html, />SENSITIVITY CHECK</);
  assert.match(html, /from 7 to 10 days changes the sample from 9 flags to 5/);
});

test("visible safety guardrails preserve privacy, fail-closed, and human-review boundaries", () => {
  assert.match(html, /aria-label="CSV safety boundary"/);
  assert.match(html, /2 MB · 25,000 rows · 64 columns maximum/);
  assert.match(html, /Structural failures stop ranking/);
  assert.match(html, /Human review required/);
  assert.match(html, /NEEDS_HUMAN_REVIEW/);
  assert.match(html, /WORKFLOW_DELAY_ONLY/);
  assert.match(html, /CSV data stays in this browser · no upload endpoint/);
  assert.match(html, /LIVE BROWSER CHECK · NON-CANONICAL/);
  assert.match(html, /expected to differ/);
});
