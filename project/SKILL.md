---
name: dawn-aigc-design
description: Use this skill to generate well-branded interfaces and assets for Dawn — a personal AIGC-explorer / resume / portfolio brand built around a terminal / operating-system aesthetic. Black bg, JetBrains Mono, single-hue phosphor mint palette varied by alpha, drifting astronaut, pixel-cat sprites, log-style content, hover-focus interactions. Use it for production code or throwaway prototypes / mocks / slides / promo art.
user-invocable: true
---

# Dawn AIGC Explorer Log — Design Skill

This skill ships everything you need to design **for the Dawn brand**: a personal resume / portfolio identity that looks like a running terminal.

## Read first
- `README.md` — full brand context, content fundamentals (tone of voice, casing, dos/don'ts), visual foundations (color / type / layout / motion / hover / shadow), iconography rules, and an open caveats list.
- `colors_and_type.css` — the only stylesheet you need to import. CSS variables for the full token system (palette, type, spacing, radius, glow, scanline). Importing this brings JetBrains Mono + VT323 + Space Grotesk from Google Fonts.

## Assets
- `assets/building-360.png` — 360 Group building, sampled as particle target on hover focus
- `assets/astronaut-wave.png` — drifting astronaut motif
- Pixel cats are drawn live via CSS `box-shadow` sprites; see `ui_kits/resume-site/PixelCat.jsx` for the recipe.

## Working examples
- `preview/*.html` — every design-system card (palette / type / spacing / components / brand motifs)
- `ui_kits/resume-site/` — the full resume site preview with all signature interactions (typewriter hero, hover focus list, IDE-style tooltip card, particle building, drifting astronaut, walking pixel cat, statusline + command bar)

## When generating visual artifacts (slides, mocks, throwaway prototypes)
1. Start from a plain HTML file, `<link rel="stylesheet" href="...colors_and_type.css">`.
2. Use ASCII characters (`$ › ▶ ◆ → ✓`) and the pixel-cat sprite for "icons" — **never** emoji. Use Lucide icons (CDN) only for genuine UI affordances (close, settings).
3. Stick to the **single-hue rule** — all foreground is mint/phosphor at varying alpha. The only off-hue accents are `--accent-blueprint` (3D wireframe) and `--accent-cat` (cat nose) — keep them under 2% of surface.
4. Square corners by default. Radius only for dialog bubbles (8px) and status dots (pill).
5. No drop shadows — glow only. Use `--glow-sm/md/lg/text` from tokens.
6. **No purple/blue/pink gradients.** No emoji. No bouncy springs. No frosted-glass cards as decoration.
7. Copy must read like a changelog: lowercase commands, verb-first, no exclamation marks, mix Chinese/English naturally, log-format timestamps `[YYYY-MM-DD HH:MM]`.
8. Animation: `cubic-bezier(0.2, 0.7, 0.2, 1)` is the default ease. Typewriter for primary intro lines. Number rolling on stats (300–700ms ease-out).

## When working on production code
- Lift CSS vars from `colors_and_type.css` rather than hardcoding hex values.
- Reuse the JSX components in `ui_kits/resume-site/` (`Astronaut`, `PixelCat`, `ParticleBuilding`, `Terminal`, `ExperienceList`, `ExperienceCard`). They're cosmetic-only — not production-tight, but the visual contract is correct.
- The hover-focus pattern (one row enlarges, others get `filter: blur(3px) opacity(0.32)`) is the SIGNATURE interaction. Reuse it for any "explore one thing while keeping context" surface.

## If invoked with no other guidance
Ask the user what they want to build, then act as an expert designer in this aesthetic. Default questions to ask:
- Is this a static page, an interactive prototype, a slide, or production code?
- What sections / experiences are we showcasing?
- Any new building / motif images they want included?
- Any preferred monospace font? (we substitute JetBrains Mono by default)
