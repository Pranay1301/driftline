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
