# PyCat — Remaining Tasks

> **Audience:** This document is written for an AI assistant that will continue development of the PyCat project. Read it in full before starting any task. Each task is self-contained and can be done independently.

---

## Context

PyCat is a browser-based interactive Python course in Catalan, built with vanilla HTML/CSS/JS and Pyodide (CPython via WebAssembly). It is the sequel to KarelCat. The codebase has no build step, no framework, no bundler.

**What has already been done (this round):**
- Fixed the `_onDone` double-invocation bug in `pyrunner.js`
- Implemented a progress system with checkmarks in the sidebar (`capitols.js`, `curs.css`)
- Fixed multi-line triple-quote syntax highlighting in `editor.js`
- Extracted the glossary into its own file (`curs/glossari-data.js`)
- Added interactive `input()` support via SharedArrayBuffer, with a fallback stdin textarea panel for environments without COOP/COEP headers
- Added mobile keyboard accessory (`js/kbd-accessory.js`) — a fixed bottom bar with Python-specific keys that appears on touch devices when the editor has focus. Scrollable, respects embed mode, hidden on desktop. Styles in `style.css`, loaded from `index.html`.
- Created all 14 missing reptes (`curs/repte-2.html` through `curs/repte-15.html`) — 5 easy, 5 intermediate, 5 hard. Updated `REPTES_DATA` in `capitols.js` with all 15 entries. Updated `repte-1.html` navigation. Each repte uses Mode C validation with 4–6 test cases covering edge cases.
- **[Task 1]** Implemented Shift+Tab unindent and block indent/unindent in `editor.js`. Tab with multi-line selection indents all selected lines by 4 spaces; Shift+Tab (with or without selection) removes up to 4 leading spaces per line. Selection is preserved after the operation.
- **[Task 2]** Added CDN fallback and friendly error on Pyodide load failure. `pyworker.js` emits a specific `load_error` message type (with the failed CDN URL). `pyrunner.js` automatically retries with `P.PYODIDE_CDN_FALLBACK` (`pyodide-cdn2.iodide.io`); if that also fails, shows a Catalan error and a "Torna a provar" button. New CDN constant and 3 new i18n keys added.
- **[Task 3]** Extracted the i18n system into `js/i18n.js`. Removed `UI_LANGS` and `P.t` from `constants.js`. Added Spanish (`es`) and English (`en`) translations for all 22 UI keys. Added a language selector (`<select id="lang-select">`) in the topbar, with persistence via `localStorage` (`pycat_lang`). `P.setLang(code)` refreshes visible UI elements (run button, reset button, state badge). Hidden in embed mode. Loaded in `index.html` between `constants.js` and `state.js`. Course pages (`curs/*.html`) are unaffected — they don't load these scripts and remain Catalan-only.
- **[Task 4]** Created `tests/test-exercises.html` — a browser-based test runner that loads Pyodide, extracts all exercises from `curs/*.html` via `fetch` + `DOMParser`, and runs the reference solution for each `goalId` against its test cases. Solutions live in `tests/solutions.js` (23 solutions covering all chapter exercises and reptes 1–15). The runner shows PASS/FAIL per exercise with per-test diff. Verified locally with CPython: **81/81 tests pass**. Includes `tests/README.md` with usage instructions. Not linked from the course UI (development tool).
- **[Task 5]** ~~Added offline support via Service Worker.~~ **REVERTED in production** — the SW was causing `ERR_FAILED` in production at pycat.step-quiz.net (Cloudflare Pages) on repeat visits. Both `sw.js` and `js/sw-register.js` have been replaced with kill-switch variants that actively unregister any previously-installed SW and clear all `pycat-*` caches. The files remain in place so that any user browser that had cached the old SW receives the self-destruct update. They can be kept as-is indefinitely with no side effects. If offline support is needed in the future, rewrite from scratch with extensive production testing — don't restore the old files.
- **[Task 6]** Created `tools/generate-pages.js` — a zero-dependency Node.js generator that produces `curs/{capitol,repte}-N.html` from JSON descriptions in `tools/pages/*.json`. The CLI supports `--only`, `--dry-run`, `--input`, `--out`. The JSON format allows grouping multiple `h2`+body into a single `<section>` via `parts[]` to preserve the `.chapter-section { margin-bottom: 2rem }` layout. Two example inputs are included (`repte-1.json`, `repte-6.json`) — verified end-to-end: generated pages extract identically to originals via DOMParser, and Task 4's reference solutions still pass 6/6 tests against them. `tools/README.md` documents the format and workflow.

---

## Task 7 — Migrate to ES Modules

**Priority: LOW — Only do if the project grows significantly.**

**What:** Convert the global namespace `P.*` pattern to ES modules (`import`/`export`).

**How:**
1. Change all `<script>` tags to `<script type="module">`.
2. Convert each JS file to use `export` for its public API and `import` for dependencies.
3. Remove the global `P` object.
4. The Web Worker (`pyworker.js`) already runs in its own scope and doesn't need module conversion.
5. Test that everything still works in all target browsers (Chrome 89+, Firefox 89+, Safari 15.2+).

**Risk:** This is a large refactor. Only worthwhile if the JS codebase grows beyond ~15 modules.

---

## Task 8 — Progress Tracking for Capítol 11

**Priority: LOW**

**What:** Capítol 11 (Posant-ho tot junt) currently has no `data-goal-id` (`goalId: null` in `capitols.js`) and therefore no progress tracking.

> **Note:** Capítol 2 already has `data-goal-id="cap-2-ex"` in the HTML and `goalId: 'cap-2-ex'` in `capitols.js` — that part is resolved.

**For Capítol 11:** This is a project chapter. It could have a `data-goal-id` tied to a specific exercise within it, or a \"mark as done\" button.

---

## General Guidelines for All Tasks

1. **No build step.** All output must be vanilla HTML/CSS/JS files that work when served by `python3 -m http.server`.
2. **All user-facing text in Catalan.** Code comments can be in Catalan or English.
3. **Verify syntax** with `node --check` for every modified JS file.
4. **Test manually** in a browser after making changes.
5. **Respect the existing architecture** — read `docs/ARCHITECTURE.md` and `README.md` before starting.
6. **Match the existing code style** — look at the files you're modifying and follow the same patterns (commenting style, naming conventions, indentation).
