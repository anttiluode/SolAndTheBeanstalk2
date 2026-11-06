# Sol & the Beanstalk 2 — Storm Climber

**[Play Storm Climber](https://anttiluode.github.io/SolAndTheBeanstalk2/)** · **[Play the original story](https://anttiluode.github.io/SolAndTheBeanstalk2/story.html)**

An endless, third-person 3D survival climb. A storm rises beneath a floating garden. Double jump, dash and shoot a living vine to keep ahead of it. One fall ends the run. One key starts another.

No install, account, downloads from CDNs, runtime libraries or backend. The default game uses small native WebGL2 shaders and triangle meshes, inspired by the [first Sol & the Beanstalk](https://github.com/anttiluode/SolAndTheBeanStalk), so it does not wait for the old crystal raymarcher to compile.

## How to play

- **Climb:** follow the floating islands upward. The flower with a reticle is your next grapple target.
- **Catch and release:** hold **E** or left mouse to reel toward that flower. Release above an island. Land to replenish your vine, jumps and dash.
- **Keep your flow:** quick landings on new islands increase your multiplier, up to 8×. Golden side islands hold five crystals, but a detour costs time.
- **Read the garden:** orange islands crumble after landing; some islands drift sideways; mint flowers bounce you upward. Golden arches offer one of three upgrades every twelve islands.
- **Escape:** the storm wakes after four seconds and gets faster as you climb. Touch it and the run ends. **R** retries the same world immediately.

The route continues beyond the original chapters through four repeating regional palettes with fresh deterministic platform layouts. Difficulty increases to a cap. Only nearby islands and their GPU meshes stay in memory. There is no final island or victory screen.

| Action | Controls |
| --- | --- |
| Move | WASD / arrow keys, relative to the camera |
| Jump, then jump again in the air | Space |
| Directional air dash | Shift (forward if no direction is held) |
| Grapple highlighted flower | Hold E / left mouse; release to launch |
| Look / zoom | Hold right mouse and drag / wheel |
| Pause / resume | Esc / Pause button |
| Instant retry | R |
| Choose an upgrade | Click a card / 1, 2, 3 |
| Touch | Direction pad, Jump, Dash and Hold Vine; drag the world to look |

Focus loss and hidden tabs pause the run. Upgrade choices also pause the storm. Sound is synthesized locally and can be switched off. High scores and height records are saved in this browser; blocked storage does not prevent playing. Upgrades last for one run only. **Today's Challenge** uses a common UTC daily seed; **Copy Challenge** shares the current seed and your result, without an online leaderboard.

## Run locally

Open `index.html` directly, or serve the directory:

```sh
python -m http.server 8000
```

Then visit http://localhost:8000. Use a browser with WebGL2 and hardware acceleration enabled. If WebGL is unavailable, a visible error explains how to recover.

## Code and checks

- `climb-core.js`: deterministic platform generation, movement, collision, storm, scoring, upgrades and bounded live state; runs in Node and the browser.
- `climb-render.js`: streamed geometry, explicit GPU resource disposal, camera-relative coordinates, avatar, vine and storm.
- `climb.js`: fixed-step loop, keyboard/touch input, pause, records, sound and menus.
- `climb.css`, `index.html`: responsive interface.
- `story.html`, `core.js`, `play.js`, `play.css`, `fast-shader.js`: retained finite story and its original renderer. `story.html?legacy=1` retains the expensive experimental crystal shader.

```sh
node --test tests/core.test.cjs tests/startup.test.cjs tests/climb.test.cjs
npm install --no-save --no-package-lock playwright@1.56.1
CHROME_BIN=/usr/bin/google-chrome node tests/climb-browser.cjs
```

`CHROME_BIN` can point to your Chromium/Chrome executable; the test defaults to `/usr/bin/chromium`. Browser tests load **the production shader**, exercise actual keyboard/touch controls and save screenshots under `.artifacts/`. GitHub Actions runs both suites before publishing Pages. The old optional story browser test remains `tests/browser.test.cjs` and uses its original CI-only lightweight shader; it is not part of the new survival test.

Automated tests verify mechanics and rendering; difficulty and replay appeal still need human playtesting. This is a small procedural browser game, not a claim of an infinitely detailed world or guaranteed addictive gameplay.

MIT licensed. **The sky has no end. The storm does.**
