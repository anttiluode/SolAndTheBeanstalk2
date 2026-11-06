# Sol & the Beanstalk 2 — The Pin Beneath the Sky

**[Play the browser build](https://anttiluode.github.io/SolAndTheBeanstalk2/)** · [Original PsychedelicGarden](https://github.com/anttiluode/PsychedelicGarden) · [First Sol and the Beanstalk](https://github.com/anttiluode/SolAndTheBeanStalk)

A short experimental **3D vine-shooting game** in which every route helps you reach higher and places pressure on a shared support that may snap. This version is derived from the **PsychedelicGarden WebGL2 raymarch engine**, not the first game's triangle-mesh renderer. It retains psychedelic crystal chambers, hanging chains, animated moons and vine helices, but replaces passive waiting with immediate seed shots and an audible, visible support economy.

There are four small chapters:
1. **The First Thread:** shoot one vine, see the growth instantly, and follow it to the next chamber.
2. **The Borrowed Chain:** vines put load on a distant pin. The chain sags, glows red and hums lower as you overburden it. Grow a root to share its burden; reckless planting can tear a vine loose.
3. **The Crystal Lung:** repair a stressed support inside the organic glass.
4. **The Giant's Pin:** meet the keeper and decide whether to root the world or release the old chain. Two different story endings.

Designed for a few minutes of exploratory play, with no deliberate waiting periods. Experienced players may finish faster. Breaking a vine is recoverable and never removes the ability to finish the run.

## Controls

| Action | Input |
| --- | --- |
| Shoot vine | **Space** or click the world / FIRE A VINE |
| Stabilize support | **R** / ROOT THE PIN |
| Travel to next room | **F** / FOLLOW THE VINE |
| Fly around / up / down | WASD / E / Q |
| Look, fast flight | Drag / hold Shift |
| Screenshot | **P** / PHOTO |
| New randomized map | NEW WORLD |
| Share today's seed | DAILY SEED |
| Touch | On-screen action buttons, directional pad, and drag-to-look |

The world seed is in the URL fragment (#seed=NUMBER); each seed has a separate localStorage save. DAILY SEED is computed from the current UTC date.

## The technology

- **index.html:** Keeps the original PsychedelicGarden crystal engine (available with `?legacy=1`) and the game camera/geometry logic. Normal startup now uses `fast-shader.js`, a far cheaper raymarcher with organic cave walls, crystals, chains, instant vine helixes, stress glow, atmospheric fog and colour palettes. Shader errors automatically fall back to a minimal compatibility renderer and are shown visibly rather than leaving the start button frozen.
- **fast-shader.js:** Default renderer; compiled and linked successfully with OpenGL ES 3.2 Mesa. It reduces the heavy multipass reflections for reliability.
- **core.js:** Pure, deterministic gameplay. Shoot/root/cross, four-room graph, warning/overload thresholds, recoverable snaps, root inventory, endings and save validation.
- **play.js:** Story UI, keyboard and touch input, drone whose frequency decreases as the pin loads, original pentatonic chimes, screenshot and sharing controls.
- **play.css:** Responsive HUD showing a load that matters.
- **tests:** Deterministic Node rule tests run on every push. An optional Chromium integration test (manual workflow dispatch) exercises gameplay with an explicitly simplified CI-only shader. It does **not** establish the performance or appearance of the normal raymarched renderer.

This is a separate game whose engine descends directly from the original [PsychedelicGarden](https://github.com/anttiluode/PsychedelicGarden). Visual rules borrow the look of CrystalMoon without incorporating its full Clockfield simulation. No claim is made that the pin tension is a physical engineering model.

## Local run

From the repository directory, run a Python static server:

    python -m http.server 8000

Visit http://localhost:8000 on a WebGL2 browser. No runtime dependencies, artwork, webcam, service, user account or external audio files are required.

**Automated tests:**

    node --check play.js
    node --test tests/core.test.cjs

The full raymarcher is computationally demanding; frame rate varies by GPU. This release is a finite four-room prototype, not a large procedurally generated open world, an independent level graph, a structural physics simulator or a commercial game.

**Find what carries the load.**

**Validation status (Nov 5):** All six gameplay rules and the embedded JavaScript syntax pass local checks. The full PsychedelicGarden-derived shader could not be fully playtested here: the local browser blocks URL loading, and software-rendered CI runs were excessively slow. Normal GPU visual performance remains unverified until a real browser/hardware playtest.

## Startup fix (November 6, 2026)

The first published version could remain on **PREPARING CRYSTAL WORLD…** because the original multi-bounce shader took excessively long to compile on some drivers. The ordinary page now loads a smaller WebGL2 raymarcher by default, with a 7-second asynchronous compile watchdog and automatic compatibility fallback. The original complex shader is retained at `?legacy=1` for experimental use. If your browser cached the old version, force a fresh reload (Ctrl+F5), or add `?quality=low` before the `#seed=` fragment. A full Edge / RTX 3060 playtest is still needed; local shader validation does not prove performance on every driver.
