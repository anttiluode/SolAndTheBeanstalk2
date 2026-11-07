# Endless Storm Climb Implementation Plan

> Implement inline, using executing-plans. Check each task with real tests before committing.

**Goal:** Replace the finite default experience with a responsive endless survival platformer.
**Architecture:** Pure simulation in climb-core.js; bounded native WebGL meshes in climb-render.js; input, audio and HUD in climb.js. Preserve old entry as story.html.
**Tech Stack:** JavaScript, WebGL2, HTML/CSS, Node test runner, Chromium/Playwright.
**Spec:** ../specs/2026-11-06-endless-climb-design.md

## Global Constraints
No runtime dependencies. Static/file URL compatible. No persistent stat advantage. Preserve story and license. Use production shaders in new browser tests.

## Review Focus
Held inputs and focus loss must not cause surprise movement. Storm and pickups must freeze in overlays. Distant chunks must not leak CPU/GPU resources. Spawn/upgrade interactions must not trap runs. Invalid local saves and unavailable WebGL must not freeze startup.

### Task 1: Deterministic world and simulation
- [ ] Write failing tests in tests/climb.test.cjs for deterministic generation, reachable route, jump/dash/grapple, storm death, one-time rewards, upgrade pause, bounded active state and invalid persisted records.
- [ ] Implement climb-core.js: platform(seed,index), create(seed), step(state,input,dt), chooseUpgrade(state,id), target(state), score(state), validateRecord(value).
- [ ] Run node --test tests/core.test.cjs tests/startup.test.cjs tests/climb.test.cjs; inspect failures and fix causes.

### Task 2: Playable presentation
- [ ] Preserve index.html as story.html and update legacy tests to use that entry.
- [ ] Build small native WebGL renderer with streamed geometry, storm, anchor, rope, avatar and regional scenery. Pair with responsive start/run/pause/death/upgrade UI and synthesized audio.
- [ ] Add browser smoke tests for actual gameplay input, pause, restart, touch controls and WebGL failure. Exercise production shaders, capture and inspect screenshots.

### Task 3: Delivery
- [ ] Run full rules, syntax and browser checks; review diff for game-state and rendering leaks.
- [ ] Update README and CI for survival and retained story. Commit and publish changes to the requested repository, verify remote state and deployment where available.

## Progress
Baseline: 8 existing rules/startup tests pass. Fresh dedicated clone on codex/endless-storm-climb.
