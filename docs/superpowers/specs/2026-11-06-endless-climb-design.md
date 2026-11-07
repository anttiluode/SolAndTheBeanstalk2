# Sol & the Beanstalk — Storm Climber

The user requested a substantially better game and an endless world, and selected **Hard survival climb**: a rising threat, demanding movement and short high-score runs.

## Direction
Build in SolAndTheBeanstalk2, using the first game's lightweight native WebGL geometry approach. Preserve the second game's finite story at story.html. The first repository remains a reference and its original game remains available.

Alternatives considered: relaxed exploration, checkpoint adventure, and survival climbing. The user chose survival. Implementation choices below are the builder's decisions.

## Play
A continuous, seeded ascending archipelago. WASD movement, Space double jump, Shift air dash, hold E or mouse to grapple a highlighted nearby anchor, release to launch. A visible storm rises after a short grace period. Contact ends the run; R retries the same seed immediately. No waiting for bridges to grow and no automatic room-follow action.

Clean new-platform landings chain a score multiplier. Optional off-route crystals provide risk/reward. Every twelve main platforms offers a paused choice of one of three run upgrades. Regions change every twenty-four platforms. Falling platforms, moving platforms and bounce flowers appear after the opening. Difficulty increases to a cap, while generation continues without a final island.

## Constraints
No runtime dependencies, external assets, account, backend or paid content. Runs from a static server or by opening index.html. Native WebGL2 with small shaders. Local records only; no persistent stat advantage. Daily seed and random seed. Keyboard and touch controls. Pause on lost focus/visibility. Visible startup error if WebGL fails. Preserve the MIT license.

## Architecture and validation
Pure JS simulation and deterministic generation separate from renderer and UI. Fixed-step simulation with bounded live platform state and GPU buffers; render relative to the camera to preserve distant-world precision. Test many seeds and very high platform indices, actual physical traversal, resource limits, storm death, upgrades, scoring and restart. Browser smoke tests use the production shader and real inputs, with desktop and mobile screenshots. Automated validation establishes correctness, not that humans will find the game addictive; final feel needs user playtesting.
