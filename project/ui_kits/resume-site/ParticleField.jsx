// ParticleField.jsx — single canvas hosting all particle layers
// Layers:
//   - astronaut: PIXEL-ART style. Low-rez sample (~22 cols) rendered as chunky
//                squares (~7px each). Drifts as a rigid body in Lissajous orbit.
//   - buildings: high-rez sample (~180 cols), morphs between dispersed and
//                target on focus change.

const BUILDINGS = {
  "360":     { src: "../../assets/building-360.png",     sampleW: 260, density: 2 },
  "ali":     { src: "../../assets/building-ali.png",     sampleW: 260, density: 2 },
  "theater": { src: "../../assets/building-theater.png", sampleW: 260, density: 2 },
  "liweike": { src: "../../assets/building-liweike.png", sampleW: 260, density: 2 },
};
const ASTRO_SRC = "../../assets/astronaut-wave.png";
const ASTRO_COLS = 26;     // chunky pixel grid columns
const ASTRO_CELL = 8;      // px per pixel cell

function ParticleField({ activeBuildingId, terminalActive }) {
  const canvasRef = React.useRef(null);
  const stateRef  = React.useRef({
    astro: { pixels: [], loaded: false, w: 0, h: 0 },
    buildings: {}, // keyed by id → { particles, loaded, w, h }
    portrait: {
      particles: [],
      loaded: false,
      w: 0, h: 0,
      depth: 0,
      // schedule
      visible: false,
      bornAt: 0,
      hideAt: 0,
      nextAt: 0,
    },
    ambient: {
      stars: [],          // unified dense star field with glow + mouse repulsion
      twinklers: [],      // bright stars that pulse
      streaks: [],        // shooting stars
      lastStreakAt: 0,
      nebula: null,
      rotationCenter: { x: 0, y: 0 },
      mouse: { x: -9999, y: -9999, active: false },
    },
    viewport: { w: 0, h: 0, dpr: 1 },
    activeBuildingId: null,
  });
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    stateRef.current.activeBuildingId = activeBuildingId;
  }, [activeBuildingId]);

  React.useEffect(() => {
    const por = stateRef.current.portrait;
    por.pinned = !!terminalActive;
    const now = performance.now();
    if (terminalActive) {
      // Appear immediately and stay
      por.visible = true;
      por.bornAt = now;
      por.hideAt = Number.POSITIVE_INFINITY;
    } else {
      // Terminal finished: begin fade out, then 3s cadence
      if (por.visible) {
        por.hideAt = now;          // start fadeOut
      }
      por.nextAt = now + 3000 + 800;  // wait for fade + 3s
    }
  }, [terminalActive]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.viewport = { w: W, h: H, dpr };
      // (re-)seed ambient particles for new size
      seedAmbient(W, H);
    };
    const seedAmbient = (W, H) => {
      const amb = stateRef.current.ambient;
      // Galaxy rotates around an off-screen pivot below the viewport
      amb.rotationCenter = { x: W * 0.5, y: H * 1.4 };
      amb.nebula = {
        x: W * 0.78,
        y: H * 0.25,
        r: Math.max(W, H) * 0.6,
        baseA: 0.05,
      };

      // Galaxy parameters (matching reactbits Galaxy customizer values)
      const G = {
        density: 2.6,         // → ~900 stars
        glowIntensity: 0.6,   // 0..1
        saturation: 0,        // 0..1 (0 = monochrome)
        hueShift: 130,        // degrees (130 = mint-green)
        twinkleIntensity: 0.3, // 0..1
        rotationSpeed: 0.1,   // base rotation rad/s scaler
        starSpeed: 0.5,       // additional radial drift
        repulsion: true,
        repulsionStrength: 2, // 0..5
      };
      stateRef.current.galaxyParams = G;

      // Density 2.6 → 900 stars across the viewport (independent of pivot)
      const STAR_COUNT = Math.round(W * H * 0.0009 * G.density);
      const cxR = amb.rotationCenter.x;
      const cyR = amb.rotationCenter.y;
      const maxR = Math.hypot(Math.max(W, cxR), Math.max(H, cyR)) * 1.15;

      amb.stars = new Array(STAR_COUNT).fill(0).map(() => {
        // sqrt for galaxy disk density falloff
        const r0 = Math.sqrt(Math.random()) * maxR;
        const ang0 = Math.random() * Math.PI * 2;
        // size: 60% tiny, 30% medium, 10% large
        const sizeRoll = Math.random();
        const baseR = sizeRoll < 0.6 ? 0.5 + Math.random() * 0.5
                    : sizeRoll < 0.9 ? 0.9 + Math.random() * 0.7
                    : 1.4 + Math.random() * 1.0;
        // rotation speed varies slightly per-star for organic feel
        const rotSpd = 0.005 + Math.random() * 0.020;
        // radial drift (star speed)
        const radDrift = (Math.random() - 0.3) * 6;  // mostly outward
        return {
          r0, ang0,
          baseR,
          x: 0, y: 0,
          a: 0.18 + Math.random() * 0.52,
          twk: Math.random() * Math.PI * 2,
          twkSpd: 0.4 + Math.random() * 1.6,
          rotSpd,
          radDrift,
          // displacement from repulsion
          dx: 0, dy: 0,
        };
      });

      // Twinklers (6 bright pulse stars)
      amb.twinklers = new Array(6).fill(0).map(() => ({
        x: Math.random() * W,
        y: Math.random() * H,
        nextAt: performance.now() + 2000 + Math.random() * 8000,
        peakAt: 0,
      }));
      amb.streaks = [];
      amb.lastStreakAt = 0;
    };

    // Mouse tracking
    const onMouseMove = (e) => {
      stateRef.current.ambient.mouse.x = e.clientX;
      stateRef.current.ambient.mouse.y = e.clientY;
      stateRef.current.ambient.mouse.active = true;
    };
    const onMouseLeave = () => {
      stateRef.current.ambient.mouse.active = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    resize();
    window.addEventListener("resize", resize);

    // ---------- PNG sampler (alpha-thresholded, opt. luminance skip) ----------
    // fineMode=true: per-pixel scan (density=1) with luminance-driven multiplicity
    //   - bright pixels  → 2-3 particles, opacity 0.8-1.0, size 0.6-0.8
    //   - mid pixels     → 1-2 particles, opacity 0.4-0.7, size 0.5-0.6
    //   - dim pixels     → 50% skip,    1 particle,  opacity 0.15-0.4, size 0.4
    //   - very dim       → 80% skip,    1 particle,  opacity 0.05-0.2, size 0.3
    const samplePNG = (src, sampleW, density, opts = {}) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ratio = img.height / img.width;
        const sw = sampleW;
        const sh = Math.round(sampleW * ratio);
        const off = document.createElement("canvas");
        off.width = sw;
        off.height = sh;
        const octx = off.getContext("2d");
        octx.drawImage(img, 0, 0, sw, sh);
        const data = octx.getImageData(0, 0, sw, sh).data;
        const pts = [];
        const skipWhite = opts.skipWhite === true;
        const whiteThresh = opts.whiteThresh ?? 250;
        const ALPHA_T = 80;

        if (opts.fineMode) {
          const isOpaque = (x, y) => {
            if (x < 0 || y < 0 || x >= sw || y >= sh) return false;
            return data[(y * sw + x) * 4 + 3] >= ALPHA_T;
          };
          // Per-pixel scan; luminance drives multiplicity/opacity/size
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const i = (y * sw + x) * 4;
              const a = data[i + 3];
              if (a < ALPHA_T) continue;
              const r = data[i], g = data[i + 1], b = data[i + 2];
              const lum = (r + g + b) / 3;
              if (skipWhite && lum > whiteThresh) continue;

              // tier by luminance
              let count, opLo, opHi, sizeLo, sizeHi;
              if (lum < 65) {
                if (Math.random() > 0.20) continue;       // 80% skip
                count = 1; opLo = 0.05; opHi = 0.20; sizeLo = 0.30; sizeHi = 0.45;
              } else if (lum < 130) {
                if (Math.random() > 0.50) continue;       // 50% skip
                count = 1; opLo = 0.15; opHi = 0.40; sizeLo = 0.40; sizeHi = 0.55;
              } else if (lum < 200) {
                count = Math.random() < 0.35 ? 2 : 1;
                opLo = 0.40; opHi = 0.70; sizeLo = 0.50; sizeHi = 0.65;
              } else {
                count = Math.random() < 0.55 ? 3 : 2;
                opLo = 0.80; opHi = 1.00; sizeLo = 0.60; sizeHi = 0.80;
              }

              // Edge detection (silhouette / profile contour)
              let isEdge = false;
              if (opts.detectEdges) {
                isEdge =
                  !isOpaque(x - 1, y) || !isOpaque(x + 1, y) ||
                  !isOpaque(x, y - 1) || !isOpaque(x, y + 1) ||
                  !isOpaque(x - 1, y - 1) || !isOpaque(x + 1, y - 1) ||
                  !isOpaque(x - 1, y + 1) || !isOpaque(x + 1, y + 1);
                if (isEdge) {
                  // boost: +50% particles, brighter, slightly bigger
                  count = Math.max(count, 2) + 1;
                  opLo = Math.min(1, opLo * 1.4 + 0.15);
                  opHi = Math.min(1, opHi * 1.4 + 0.15);
                  sizeLo *= 1.15;
                  sizeHi *= 1.15;
                }
              }

              for (let n = 0; n < count; n++) {
                const opacity = opLo + Math.random() * (opHi - opLo);
                const size = sizeLo + Math.random() * (sizeHi - sizeLo);
                const jx = (Math.random() - 0.5) * 0.9;
                const jy = (Math.random() - 0.5) * 0.9;
                pts.push({ x: x + jx, y: y + jy, lum, opacity, size, isEdge, r, g, b });
              }
            }
          }
        } else {
          // Legacy grid stride sampling
          for (let y = 0; y < sh; y += density) {
            for (let x = 0; x < sw; x += density) {
              const i = (y * sw + x) * 4;
              const a = data[i + 3];
              if (a < ALPHA_T) continue;
              const r = data[i], g = data[i + 1], b = data[i + 2];
              const lum = (r + g + b) / 3;
              if (skipWhite && lum > whiteThresh) continue;
              pts.push({ x, y, lum, r, g, b });
            }
          }
        }

        resolve({ pts, w: sw, h: sh });
      };
      img.onerror = reject;
      img.src = src;
    });

    // ---------- load ASTRONAUT as chunky pixel art ----------
    (async () => {
      // sample at very low res for pixel-art chunkiness
      const astro = await samplePNG(ASTRO_SRC, ASTRO_COLS, 1, { skipWhite: true, whiteThresh: 240 });
      const pixels = astro.pts.map((p) => ({
        col: p.x,
        row: p.y,
        // Slight tonal variation: darker visor area vs bright suit
        tone: p.lum < 90 ? "visor" : "suit",
        twk: Math.random() * Math.PI * 2,
      }));
      stateRef.current.astro = {
        pixels,
        loaded: true,
        cols: astro.w,
        rows: astro.h,
        w: astro.w * ASTRO_CELL,
        h: astro.h * ASTRO_CELL,
      };
    })().catch(console.error);

    // ---------- load BUILDINGS ----------
    Object.entries(BUILDINGS).forEach(async ([id, def]) => {
      try {
        const W0 = window.innerWidth;
        const H0 = window.innerHeight;
        // Fine point-cloud mode: per-pixel luminance-driven sampling.
        const r = await samplePNG(def.src, def.sampleW, 1, {
          skipWhite: false,
          fineMode: true,
        });
        const targetH = Math.min(H0 * 0.7, 720);
        const scaleFromH = targetH / r.h;
        const scaleFromW = (W0 * 0.42) / r.w;
        const scale = Math.min(scaleFromH, scaleFromW, 4);
        const buildingDepth = (r.w * scale) * 0.35;

        const particles = r.pts.map((p) => ({
          ox: (p.x - r.w / 2) * scale,
          oy: (p.y - r.h / 2) * scale,
          oz: (Math.random() - 0.5) * buildingDepth,
          hx: Math.random() * W0,
          hy: Math.random() * H0,
          x:  Math.random() * W0,
          y:  Math.random() * H0,
          vx: 0, vy: 0,
          twk: Math.random() * Math.PI * 2,
          twkSpd: 0.6 + Math.random() * 1.2,
          // per-particle visual properties driven by source luminance
          baseOp:   p.opacity,    // 0.05 - 1.0
          baseSize: p.size,       // 0.3 - 0.8 px
          lum: p.lum,
        }));

        stateRef.current.buildings[id] = {
          particles,
          loaded: true,
          w: r.w * scale,
          h: r.h * scale,
          depth: buildingDepth,
        };
      } catch (e) {
        console.warn(`[particle] failed to load building "${id}":`, e);
      }
    });

    // ---------- load PORTRAIT (point-cloud apparition top-right) ----------
    (async () => {
      try {
        const r = await samplePNG(
          "../../assets/portrait-silhouette.png",
          410,
          1,
          { skipWhite: true, whiteThresh: 220, fineMode: true, detectEdges: true }
        );
        const W0 = window.innerWidth;
        const H0 = window.innerHeight;
        // size to ~30% viewport height, capped
        const targetH = Math.min(H0 * 0.42, 380);
        const scaleH = targetH / r.h;
        const scaleW = (W0 * 0.28) / r.w;
        const scale = Math.min(scaleH, scaleW, 3.5);
        const depth = (r.w * scale) * 0.30;
        stateRef.current.portrait.particles = r.pts.map((p) => ({
          ox: (p.x - r.w / 2) * scale,
          oy: (p.y - r.h / 2) * scale,
          oz: (Math.random() - 0.5) * depth,
          x:  0, y: 0,
          vx: 0, vy: 0,
          twk: Math.random() * Math.PI * 2,
          twkSpd: 0.6 + Math.random() * 1.4,
          baseOp:   p.opacity,
          baseSize: p.size,
          isEdge: !!p.isEdge,
          lum: p.lum,
          // dispersed/home position for entrance — slightly outside the cluster
          hx: (Math.random() - 0.5) * (r.w * scale) * 2.2,
          hy: (Math.random() - 0.5) * (r.h * scale) * 2.2,
        }));
        stateRef.current.portrait.loaded = true;
        stateRef.current.portrait.w = r.w * scale;
        stateRef.current.portrait.h = r.h * scale;
        stateRef.current.portrait.depth = depth;
        // First appearance: 3-12s after load
        stateRef.current.portrait.nextAt = performance.now() + 3000 + Math.random() * 9000;
      } catch (e) {
        console.warn("[particle] failed to load portrait:", e);
      }
    })();
    const ctx = canvas.getContext("2d");
    const start = performance.now();
    const loop = (now) => {
      const t = (now - start) / 1000;
      const { w: W, h: H } = stateRef.current.viewport;
      ctx.clearRect(0, 0, W, H);

      const dimmed = !!stateRef.current.activeBuildingId;

      // ============ ASTRONAUT — disabled (per user request) ============
      const astro = stateRef.current.astro;
      if (false && astro.loaded) {
        // Lissajous body drift
        const cx = W * 0.5 + W * 0.32 * Math.sin(t * 0.18);
        const cy = H * 0.42 + H * 0.22 * Math.sin(t * 0.27 + 1.4);
        const rot = Math.sin(t * 0.4) * 0.10;
        const breath = 1 + Math.sin(t * 0.5) * 0.04;
        const sc = (0.95 + Math.sin(t * 0.17) * 0.08) * breath;
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        const cellSize = ASTRO_CELL * sc;
        const cx0 = (astro.cols / 2) * ASTRO_CELL;
        const cy0 = (astro.rows / 2) * ASTRO_CELL;

        for (let i = 0; i < astro.pixels.length; i++) {
          const px = astro.pixels[i];
          // base local coord
          const lx = (px.col * ASTRO_CELL - cx0);
          const ly = (px.row * ASTRO_CELL - cy0);
          // rotate then scale
          const rx = (lx * cosR - ly * sinR) * sc;
          const ry = (lx * sinR + ly * cosR) * sc;
          const sx = cx + rx - cellSize / 2;
          const sy = cy + ry - cellSize / 2;
          // shimmer alpha
          const shimmer = 0.5 + 0.5 * Math.sin(t * 1.4 + px.twk);
          const baseA = dimmed ? 0.20 : 0.72;
          const a = baseA + shimmer * 0.18;
          // color: visor darker mint, suit phosphor mint
          if (px.tone === "visor") {
            ctx.fillStyle = `rgba(13,148,136,${a})`;       // phosphor-deep
          } else {
            ctx.fillStyle = `rgba(167,243,208,${a})`;      // mint-200
          }
          ctx.fillRect(sx, sy, cellSize - 0.5, cellSize - 0.5);
        }
      }

      // ============ AMBIENT: nebula glow (back) ============
      {
        const amb = stateRef.current.ambient;
        if (amb.nebula) {
          const n = amb.nebula;
          const breath = 0.85 + 0.15 * Math.sin(t * 0.25);
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
          const a = n.baseA * breath * (dimmed ? 0.4 : 1);
          grad.addColorStop(0,   `rgba(94,234,212,${a * 2.2})`);
          grad.addColorStop(0.3, `rgba(94,234,212,${a * 1.3})`);
          grad.addColorStop(0.7, `rgba(94,234,212,${a * 0.4})`);
          grad.addColorStop(1,   `rgba(94,234,212,0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
        }
      }

      // ============ AMBIENT: parallax star layers (galaxy swirl) ============
      {
        const amb = stateRef.current.ambient;
        const G = stateRef.current.galaxyParams;
        const dimMul = dimmed ? 0.4 : 1;
        const cxR = amb.rotationCenter.x;
        const cyR = amb.rotationCenter.y;

        // Galaxy color: hueShift 130° (mint), saturation 0 → near-white tinted
        // We blend between pure white (sat=0) and mint (sat=1)
        const sat = G.saturation;
        // Hue 130 ≈ rgb(94, 234, 212) ≈ phosphor
        const hueR = 94, hueG = 234, hueB = 212;
        const baseR = Math.round(255 * (1 - sat) + hueR * sat);
        const baseG = Math.round(255 * (1 - sat) + hueG * sat);
        const baseB = Math.round(255 * (1 - sat) + hueB * sat);

        // Mouse repulsion params
        const repulse = G.repulsion && amb.mouse.active && !dimmed;
        const mx = amb.mouse.x;
        const my = amb.mouse.y;
        const repulsionRadius = 160;
        const repulsionMaxPush = 24 * G.repulsionStrength; // px

        const twinkleAmp = G.twinkleIntensity * 0.6;   // alpha range
        const rotMultiplier = G.rotationSpeed;
        const starDriftMul  = G.starSpeed;
        const glowK = G.glowIntensity;

        for (let i = 0; i < amb.stars.length; i++) {
          const p = amb.stars[i];
          // Slow rotation around galaxy pivot
          const rotAng = t * p.rotSpd * rotMultiplier * 10;
          const ang = p.ang0 + rotAng;
          // Radial drift outward (or inward) — slow
          const rNow = p.r0 + Math.sin(t * 0.3 + p.twk) * 2 + p.radDrift * t * starDriftMul * 0.05;
          let x = cxR + Math.cos(ang) * rNow;
          let y = cyR + Math.sin(ang) * rNow;

          // Mouse repulsion (springy)
          if (repulse) {
            const dxMouse = x - mx;
            const dyMouse = y - my;
            const distSq = dxMouse * dxMouse + dyMouse * dyMouse;
            if (distSq < repulsionRadius * repulsionRadius && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const factor = 1 - dist / repulsionRadius;
              const push = repulsionMaxPush * factor * factor;
              const nx = dxMouse / dist;
              const ny = dyMouse / dist;
              // target displacement
              const targetDx = nx * push;
              const targetDy = ny * push;
              p.dx += (targetDx - p.dx) * 0.18;
              p.dy += (targetDy - p.dy) * 0.18;
            } else {
              p.dx *= 0.88;
              p.dy *= 0.88;
            }
          } else {
            p.dx *= 0.88;
            p.dy *= 0.88;
          }
          x += p.dx;
          y += p.dy;

          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;

          // Twinkle modulation
          const shimmer = 0.5 + 0.5 * Math.sin(t * p.twkSpd + p.twk);
          const a = (p.a + shimmer * twinkleAmp - twinkleAmp / 2) * dimMul;
          if (a <= 0.02) continue;

          // Star core
          ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${Math.min(1, a)})`;
          ctx.fillRect(x - p.baseR / 2, y - p.baseR / 2, p.baseR, p.baseR);

          // Glow halo (skip for the very tiniest stars to save fillrate)
          if (p.baseR > 0.9 && glowK > 0) {
            const glowR = p.baseR * (3 + glowK * 4);
            const glowA = a * glowK * 0.55;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            grad.addColorStop(0,   `rgba(${baseR},${baseG},${baseB},${glowA})`);
            grad.addColorStop(0.4, `rgba(${baseR},${baseG},${baseB},${glowA * 0.35})`);
            grad.addColorStop(1,   `rgba(${baseR},${baseG},${baseB},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - glowR, y - glowR, glowR * 2, glowR * 2);
          }
        }
      }

      // ============ AMBIENT: bright twinklers (foreground) ============
      {
        const amb = stateRef.current.ambient;
        const dimMul = dimmed ? 0.4 : 1;
        for (const tw of amb.twinklers) {
          // Schedule a pulse
          if (now >= tw.nextAt && !tw.peakAt) {
            tw.peakAt = now;
            // re-randomize position lightly so it doesn't stick
            tw.x = Math.random() * W;
            tw.y = Math.random() * H * 0.85 + 20;
          }
          if (tw.peakAt) {
            const age = (now - tw.peakAt) / 1000;
            const lifespan = 2.5;
            if (age > lifespan) {
              tw.peakAt = 0;
              tw.nextAt = now + 3000 + Math.random() * 9000;
              continue;
            }
            // bell-shaped intensity
            const v = Math.max(0, 1 - Math.abs(age / (lifespan / 2) - 1));
            const intensity = Math.pow(v, 1.2);
            const a = 0.0 + intensity * 0.75 * dimMul;
            const r = 1.0 + intensity * 2.5;
            // core + soft glow
            const grad = ctx.createRadialGradient(tw.x, tw.y, 0, tw.x, tw.y, r * 6);
            grad.addColorStop(0,    `rgba(220,252,231,${a})`);
            grad.addColorStop(0.25, `rgba(94,234,212,${a * 0.6})`);
            grad.addColorStop(1,    `rgba(94,234,212,0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(tw.x - r * 6, tw.y - r * 6, r * 12, r * 12);
            // cross spikes (very subtle)
            ctx.fillStyle = `rgba(220,252,231,${a * 0.8})`;
            ctx.fillRect(tw.x - r * 3, tw.y - 0.5, r * 6, 1);
            ctx.fillRect(tw.x - 0.5, tw.y - r * 3, 1, r * 6);
          }
        }
      }

      // ============ AMBIENT: shooting streaks (comet) ============
      {
        const amb = stateRef.current.ambient;
        if (!dimmed && now - amb.lastStreakAt > 5000 + Math.random() * 8000) {
          amb.lastStreakAt = now;
          // Slight downward angle, varied direction
          const angle = (-0.18 + Math.random() * 0.36);   // radians from horizontal
          const fromLeft = Math.random() < 0.6;
          const startX = fromLeft ? -200 : W + 200;
          const dirX = fromLeft ? 1 : -1;
          amb.streaks.push({
            x: startX,
            y: 40 + Math.random() * (H - 140),
            angle,
            dirX,
            len: 90 + Math.random() * 160,
            spd: 8 + Math.random() * 9,
            life: 1,
            born: now,
          });
        }
        for (let i = amb.streaks.length - 1; i >= 0; i--) {
          const st = amb.streaks[i];
          const sx = Math.cos(st.angle) * st.spd * st.dirX;
          const sy = Math.sin(st.angle) * st.spd;
          st.x += sx;
          st.y += sy;
          const age = (now - st.born) / 1000;
          st.life = Math.max(0, 1 - age / 3.2);
          if (st.life <= 0 ||
              (st.dirX > 0 && st.x > W + 200) ||
              (st.dirX < 0 && st.x < -200)) {
            amb.streaks.splice(i, 1);
            continue;
          }
          // Streak: bright head + fading angled tail
          const tailX = st.x - Math.cos(st.angle) * st.dirX * st.len;
          const tailY = st.y - Math.sin(st.angle) * st.len;
          const grad = ctx.createLinearGradient(tailX, tailY, st.x, st.y);
          grad.addColorStop(0,   `rgba(94,234,212,0)`);
          grad.addColorStop(0.7, `rgba(94,234,212,${0.22 * st.life})`);
          grad.addColorStop(1,   `rgba(220,252,231,${0.55 * st.life})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(st.x, st.y);
          ctx.stroke();
          // bright head dot
          ctx.fillStyle = `rgba(220,252,231,${0.8 * st.life})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ============ BUILDINGS (point cloud art) ============
      const active = stateRef.current.activeBuildingId;
      Object.entries(stateRef.current.buildings).forEach(([id, layer]) => {
        if (!layer.loaded) return;
        const goActive = active === id;
        const cx = W * 0.5;
        const cy = H * 0.55;
        const parts = layer.particles;

        // Slow yaw rotation around vertical axis — gives 3D point-cloud feel
        const yaw = goActive
          ? Math.sin(t * 0.35) * 0.55      // active: gentle ±0.55 rad sway
          : t * 0.05;                       // dispersed: ignore (won't render)
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        // Slight pitch (tilt forward/back) for organic feel
        const pitch = Math.sin(t * 0.22) * 0.08;
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        // Perspective constant: small focal length → mild depth scaling
        const FOCAL = 600;

        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];

          if (!goActive) {
            // Quickly disperse (no rendering, just position smoothing)
            const targetX = p.hx;
            const targetY = p.hy;
            p.vx = (p.vx + (targetX - p.x) * 0.018) * 0.92;
            p.vy = (p.vy + (targetY - p.y) * 0.018) * 0.92;
            p.x += p.vx;
            p.y += p.vy;
            continue;
          }

          // 1) Rotate (ox, oy, oz) around Y then X
          // Y rotation (yaw): rotate in XZ plane
          const x1 =  p.ox * cosY + p.oz * sinY;
          const z1 = -p.ox * sinY + p.oz * cosY;
          // X rotation (pitch): rotate in YZ plane
          const y1 = p.oy * cosP - z1 * sinP;
          const z2 = p.oy * sinP + z1 * cosP;

          // 2) Perspective projection
          const depthScale = FOCAL / (FOCAL + z2);
          const targetX = cx + x1 * depthScale;
          const targetY = cy + y1 * depthScale;

          // 3) Spring toward target (creates assemble animation when first activated)
          const k = 0.085;
          const damp = 0.78;
          p.vx = (p.vx + (targetX - p.x) * k) * damp;
          p.vy = (p.vy + (targetY - p.y) * k) * damp;
          p.x += p.vx;
          p.y += p.vy;

          // 4) Render — fine point cloud
          // Depth-based shading
          const depthN = z2 / (layer.depth * 0.5);
          const depthFactor = 1 - depthN * 0.40;
          const flick = 0.92 + 0.08 * Math.sin(t * p.twkSpd + p.twk);

          // Per-particle opacity & size from source luminance
          const a = Math.max(0.02, Math.min(1, p.baseOp * depthFactor * flick));
          const r = 94;
          const g = Math.round(234 - depthN * 12);
          const b = Math.round(212 + depthN * 16);
          const drawR = p.baseSize * depthFactor;

          // Glow only on the brightest particles (opacity > 0.7) — skip during
          // active morph to keep the spring fast and the hover snappy.
          const settled =
            Math.abs(p.vx) < 0.4 && Math.abs(p.vy) < 0.4;
          if (settled && p.baseOp > 0.78 && depthFactor > 0.92) {
            const glowR = drawR * 4.5;
            const glowA = a * 0.5;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
            grad.addColorStop(0,   `rgba(${r},${g},${b},${glowA})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${glowA * 0.35})`);
            grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(p.x - glowR, p.y - glowR, glowR * 2, glowR * 2);
          }

          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(p.x - drawR / 2, p.y - drawR / 2, drawR, drawR);
        }
      });

      // ============ PORTRAIT (point-cloud apparition, top-right) ============
      {
        const por = stateRef.current.portrait;
        if (por.loaded) {
          // Schedule: pinned by terminal OR interval after terminal done.
          if (!por.pinned) {
            if (!por.visible) {
              if (!dimmed && now >= por.nextAt) {
                por.visible = true;
                por.bornAt = now;
                por.hideAt = now + 4500;     // total lifetime ~4.5s
              }
            } else if (por.hideAt !== Number.POSITIVE_INFINITY && now >= por.hideAt + 800) {
              // Fully gone — schedule next (3s cadence after terminal done)
              por.visible = false;
              por.nextAt = now + 3000;
            }
          }

          if (por.visible) {
            // Lifetime alpha curve:
            //   pinned    → fade in 0.6s, stay fully on
            //   ephemeral → fade in 0.6s, hold, fade out 0.8s
            const age = (now - por.bornAt) / 1000;
            const fadeIn = Math.min(1, age / 0.6);
            let fadeOut = 1;
            if (por.hideAt !== Number.POSITIVE_INFINITY) {
              const remaining = Math.max(0, (por.hideAt + 800 - now) / 800);
              fadeOut = Math.min(1, remaining);
            }
            const lifeAlpha = Math.min(fadeIn, fadeOut) * (dimmed ? 0.3 : 1) * 1.8;

            // Position: align portrait TOP with the terminal panel top (~150px).
            // content has padding-top 80px + brand ~64px ≈ 144 → pad to 160.
            const pcx = W - por.w * 0.45;
            const pcy = 160 + por.h * 0.5;

            // Slow rotation around Y-axis, slight pitch
            const yaw = Math.sin(t * 0.30) * 0.45;
            const cosY = Math.cos(yaw);
            const sinY = Math.sin(yaw);
            const pitch = Math.sin(t * 0.18) * 0.06;
            const cosP = Math.cos(pitch);
            const sinP = Math.sin(pitch);
            const FOCAL = 600;

            // ---- Scanline state ----
            // A horizontal mint-green band sweeps top→bottom across the portrait
            // every ~4s. Brightens particles whose Y is within +/- BAND/2.
            const SCAN_PERIOD = 4.0;   // seconds per sweep
            const BAND = por.h * 0.10; // band thickness
            const scanT = (t % SCAN_PERIOD) / SCAN_PERIOD;
            const scanY = pcy - por.h / 2 + scanT * por.h;

            const parts = por.particles;
            for (let i = 0; i < parts.length; i++) {
              const p = parts[i];
              const x1 =  p.ox * cosY + p.oz * sinY;
              const z1 = -p.ox * sinY + p.oz * cosY;
              const y1 = p.oy * cosP - z1 * sinP;
              const z2 = p.oy * sinP + z1 * cosP;
              const depthScale = FOCAL / (FOCAL + z2);
              const targetX = pcx + x1 * depthScale;
              const targetY = pcy + y1 * depthScale;
              // assemble spring
              p.vx = (p.vx + (targetX - p.x) * 0.085) * 0.78;
              p.vy = (p.vy + (targetY - p.y) * 0.085) * 0.78;
              p.x += p.vx;
              p.y += p.vy;

              const depthN = z2 / (por.depth * 0.5);
              const depthFactor = 1 - depthN * 0.40;
              const flick = 0.92 + 0.08 * Math.sin(t * p.twkSpd + p.twk);

              // Scanline boost: particles near the band get brighter & larger
              const dy = Math.abs(p.y - scanY);
              let scanBoost = 0;
              if (dy < BAND) {
                // Gaussian-ish falloff
                scanBoost = 1 - (dy / BAND);
              }

              const a = Math.max(
                0.02,
                Math.min(1, (p.baseOp + scanBoost * 0.55) * depthFactor * flick * lifeAlpha)
              );
              const r = 94;
              const g = Math.round(234 - depthN * 12);
              const b = Math.round(212 + depthN * 16);
              const drawR = (p.baseSize + scanBoost * 0.35) * depthFactor;

              const settled = Math.abs(p.vx) < 0.4 && Math.abs(p.vy) < 0.4;
              if (settled && p.baseOp > 0.7 && depthFactor > 0.9 && a > 0.15) {
                const glowR = drawR * 4.5;
                const glowA = a * 0.5;
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
                grad.addColorStop(0,   `rgba(${r},${g},${b},${glowA})`);
                grad.addColorStop(0.4, `rgba(${r},${g},${b},${glowA * 0.35})`);
                grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(p.x - glowR, p.y - glowR, glowR * 2, glowR * 2);
              }

              ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
              ctx.fillRect(p.x - drawR / 2, p.y - drawR / 2, drawR, drawR);
            }

            // Render scan-line glow streak
            if (lifeAlpha > 0.1) {
              const sgrad = ctx.createLinearGradient(0, scanY - BAND, 0, scanY + BAND);
              sgrad.addColorStop(0,   "rgba(94,234,212,0)");
              sgrad.addColorStop(0.5, `rgba(167,243,208,${0.18 * lifeAlpha})`);
              sgrad.addColorStop(1,   "rgba(94,234,212,0)");
              ctx.fillStyle = sgrad;
              const px = pcx - por.w / 2;
              ctx.fillRect(px, scanY - BAND, por.w, BAND * 2);
              // bright core line
              ctx.fillStyle = `rgba(220,252,231,${0.55 * lifeAlpha})`;
              ctx.fillRect(px, scanY - 0.5, por.w, 1);
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
window.ParticleField = ParticleField;
