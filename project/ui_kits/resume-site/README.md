# Resume Site · UI Kit

The actual product preview — Dawn's personal AIGC explorer site.

## Files
- `index.html` — shell + fonts + statusline + command bar + scanline/grid
- `app.jsx` — main page composition, hover state w/ 120ms debounce
- `Terminal.jsx` — hero terminal panel with typewriter intro
- `ExperienceList.jsx` — hover-focus experience list (left column)
- `ExperienceCard.jsx` — right-side hover tooltip dialog
- `ParticleField.jsx` — single canvas hosting BOTH particle layers (astronaut + buildings). Mounts once on page load; particles persist across focus changes so there's no re-load flicker.
- `PixelCat.jsx` — CSS box-shadow pixel cat that walks across screen
- `data.js` — placeholder experience data (REPLACE with real resume)

## Interaction map
- **Page load** → typewriter prints `$ whoami` → `dawn — aigc explorer …` → `$ cat ~/experience.log` → list appears row-by-row
- **Hover an experience row** → row enlarges + phosphor glow; other rows shrink + blur(3px) + opacity(0.32); right-side dialog flies in from the right with bullets; the 3D particle building for that company materializes behind everything
- **Move mouse away** → everything settles back to baseline; building disperses
- **Idle** → astronaut continues lissajous orbit; pixel cat walks across every ~25s; numbers occasionally re-roll

## Open items (need user input)
- Real resume content — see `data.js` placeholders
- Building images for non-360 companies (DAMO Academy etc.)
