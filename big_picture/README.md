# GreenFab · Big Picture (3D scroll story)

Interactive 3D presentation of the Green Factory Model (WP2 Activity 2.1). The story plays as you scroll:

| # | Chapter | 3D scene |
|---|---------|----------|
| 0 | Greater Region | Map of FR/BE/LU/DE rises; partner cities and cross-border links |
| 1 | The challenge | 2,710 particles (one per raw WP1 KPI) + framework acronyms as noise |
| 2 | Five pillars | Particles sort into pillar columns (real counts) |
| 3 | One SME | Particles land in a pilot factory near Metz |
| 4 | Vision | Layer 1 halo: diagnostic, ambition, commitment, SDGs |
| 5 | Pillars | Factory explodes into 5 pillar buildings + digital network (clickable) |
| 6 | Action | Layer 3 as a conveyor: 5 customisation steps |
| 7 | Performance | Performance Wheel (illustrative scores) |
| 8 | Roadmap | Back to the region; link to the platform |

## Run locally

No build step. From `deploy_pages/`:

```bash
python -m http.server 8765
# open http://localhost:8765/big_picture/
```

Deep link to any point of the story: `?at=5.3` opens chapter 5, 30% in (useful for presentations).

## Structure

```
big_picture/
├── index.html          chapter text (one <section class="chapter"> per scene)
├── css/style.css       visual language (tokens at the top)
└── js/
    ├── data.js         ALL content: pillars, KPIs, scores, map outlines, cities
    ├── main.js         renderer, scroll → story time, camera path, UI
    ├── util.js         easing, ramps, labels, geo projection
    └── scenes/         map · kpiCloud · factory · conveyor · wheel
```

- Change content (pillars, KPIs, scores, texts) in `data.js` and `index.html`; the 3D and the legend follow.
- Scene timing uses the story time `t` (chapter index + progress). Each scene uses `ramp()`/`band()` windows on `t`.
- Camera shots are the `KEYS` array in `main.js`, one per chapter.

## Stack

Three.js 0.169 (ES modules from jsDelivr), CSS2D labels, Inter (Google Fonts). Static files, served by GitHub Pages.

## Next steps

- Replace the procedural factory with a Blender model (`.glb`); reuse it for AR (`<model-viewer>`) and the platform's digital twin.
- FR / DE translations.
- Official Interreg / EU co-funding logos (programme publicity rules).
- Settle the pillar taxonomy (see project context: open inconsistency).
