// PixelCat.jsx — horizontal pixel cats with walk / run / sit actions.
// Each appearance: spawn at a random Y, traverse the screen left→right or
// right→left, dice-roll picks mode (walk / run) and whether to sit mid-way.
// Sprite has ~10% more detail than the previous version (whiskers, ear tips,
// paw shading, longer tail tip).

const CAT_GRID = (() => {
  // 13×10 grid. Pixel coords (col, row).
  // M = main body, D = shadow, T = tail tip, P = pad/nose, E = eye, W = whisker
  return {
    M: [
      // ears
      [2,0],[7,0],
      // ear inner / head
      [1,1],[2,1],[3,1],[6,1],[7,1],[8,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],
      // face row
      [1,3],[3,3],[4,3],[5,3],[7,3],[8,3],
      // nose row (gap at col 4 for nose)
      [1,4],[2,4],[3,4],[5,4],[6,4],[7,4],[8,4],
      // shoulders
      [2,5],[3,5],[4,5],[5,5],[6,5],[7,5],
      // back
      [1,6],[3,6],[4,6],[5,6],[6,6],[8,6],
      // legs
      [2,7],[3,7],[6,7],[7,7],
      // tail base
      [9,4],[10,4],[10,5],[10,3],[11,3],[11,2],
    ],
    D: [   // shadow / shading
      [2,6],[7,6],
      [3,7],[7,7],   // paw shading
    ],
    E: [[2,3],[6,3]],
    P: [[4,4]],
    W: [[0,4],[9,3]],  // whisker dots
    T: [[12,1]],       // tail tip dot
  };
})();

function buildShadow(cell, palette) {
  const out = [];
  for (const [x, y] of CAT_GRID.M) out.push(`${x * cell}px ${y * cell}px 0 ${palette.body}`);
  for (const [x, y] of CAT_GRID.D) out.push(`${x * cell}px ${y * cell}px 0 ${palette.shadow}`);
  for (const [x, y] of CAT_GRID.E) out.push(`${x * cell}px ${y * cell}px 0 ${palette.eye}`);
  for (const [x, y] of CAT_GRID.P) out.push(`${x * cell}px ${y * cell}px 0 ${palette.nose}`);
  for (const [x, y] of CAT_GRID.W) out.push(`${x * cell}px ${y * cell}px 0 ${palette.whisker}`);
  for (const [x, y] of CAT_GRID.T) out.push(`${x * cell}px ${y * cell}px 0 ${palette.tail}`);
  return out.join(", ");
}

// Speeds (px / s)
const SPEEDS = { walk: 65, run: 150, sit: 0 };
// Step bob frequency (Hz). Faster mode = quicker step.
const STEP_FREQ = { walk: 4, run: 8, sit: 0 };

function PixelCat({
  color = "mint",
  startDelay = 4000,
  downloadHref = null,
  downloadFilename = null,
  tooltip = null,
}) {
  const [appear, setAppear] = React.useState(null);
  // appear: { x, y, dir, mode, sittingAt: null | x }
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [sitting, setSitting] = React.useState(false);
  const [stepFrame, setStepFrame] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const visibleRef = React.useRef(false);

  // Plan one appearance
  const planAppearance = React.useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const dir = Math.random() < 0.5 ? 1 : -1; // 1 = left→right
    const y = 100 + Math.random() * (H - 240);
    // Roll dice for mode
    const roll = Math.random();
    let mode;
    if (roll < 0.55) mode = "walk";
    else mode = "run";
    // 30% chance to schedule a sit at random x along the path
    let sitAt = null;
    if (Math.random() < 0.35) {
      sitAt = 0.25 + Math.random() * 0.5; // fraction of path
    }
    const startX = dir === 1 ? -90 : W + 30;
    const endX   = dir === 1 ? W + 30 : -90;
    return { startX, endX, y, dir, mode, sitAt };
  }, []);

  // Animation engine — single useEffect, run per appearance
  React.useEffect(() => {
    let timeoutId;
    let rafId;
    let mounted = true;
    let baseTime = 0;
    let startX = 0;
    let endX = 0;
    let pathLen = 0;
    let curAppear = null;
    let sitStartedAt = null;

    const stepLoop = (now) => {
      if (!mounted) return;
      const elapsed = (now - baseTime) / 1000;
      const sp = SPEEDS[curAppear.mode];

      // Determine current x (with possible sit pause)
      let xTraveled = elapsed * sp;
      // If we should sit at a fraction along path
      if (curAppear.sitAt && curAppear.sitAt > 0) {
        const sitThreshold = pathLen * curAppear.sitAt;
        if (xTraveled >= sitThreshold && sitStartedAt === null) {
          sitStartedAt = now;
          setSitting(true);
        }
        if (sitStartedAt !== null) {
          const sitDur = 1500 + Math.random() * 1500;  // ~1.5–3s
          const sitElapsed = now - sitStartedAt;
          if (sitElapsed < sitDur) {
            xTraveled = sitThreshold;
          } else {
            // Finished sit: shift baseTime so motion continues smoothly
            baseTime += sitDur;
            sitStartedAt = null;
            curAppear.sitAt = 0; // consumed
            setSitting(false);
            xTraveled = elapsed * sp - sitDur / 1000 * sp;
          }
        }
      }

      const newX = startX + xTraveled * curAppear.dir;
      setPos({ x: newX, y: curAppear.y });

      // Stepping animation
      const sf = STEP_FREQ[curAppear.mode];
      if (sf > 0 && !sitting) {
        setStepFrame(Math.floor(elapsed * sf) % 2);
      }

      // Exit?
      const passed = curAppear.dir === 1 ? newX > endX : newX < endX;
      if (passed) {
        // Hide + schedule next
        visibleRef.current = false;
        setAppear(null);
        setSitting(false);
        const next = 3000 + Math.random() * 2000;   // 3–5s
        timeoutId = setTimeout(start, next);
        return;
      }
      rafId = requestAnimationFrame(stepLoop);
    };

    const start = () => {
      if (!mounted) return;
      curAppear = planAppearance();
      startX = curAppear.startX;
      endX   = curAppear.endX;
      pathLen = Math.abs(endX - startX);
      baseTime = performance.now();
      sitStartedAt = null;
      visibleRef.current = true;
      setAppear(curAppear);
      setPos({ x: startX, y: curAppear.y });
      setSitting(false);
      rafId = requestAnimationFrame(stepLoop);
    };

    timeoutId = setTimeout(start, startDelay);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line
  }, []);

  // Palette
  const palettes = {
    mint: {
      body: "#5eead4", shadow: "#0d9488", eye: "#06141a",
      nose: "#f9a8d4", whisker: "#a7f3d0", tail: "#5eead4",
      glow: "rgba(94,234,212,0.4)",
    },
    yellow: {
      body: "#fbbf24", shadow: "#b45309", eye: "#1a1208",
      nose: "#f97316", whisker: "#fde68a", tail: "#fbbf24",
      glow: "rgba(251,191,36,0.45)",
    },
  };
  const p = palettes[color] || palettes.mint;
  const cell = 6;
  const w = 13 * cell;
  const h = 10 * cell;
  const shadow = buildShadow(cell, p);

  const interactive = !!downloadHref;

  const handleClick = async (e) => {
    if (!downloadHref) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      // Robust download: fetch as blob first, then trigger save
      // (works around iframe/cross-origin link.download restrictions)
      const resp = await fetch(downloadHref, { credentials: "omit" });
      if (!resp.ok) throw new Error("fetch failed " + resp.status);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // free the blob URL shortly after
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.warn("[pixel-cat] download via blob failed, falling back:", err);
      // Fallback: open in a new tab
      window.open(downloadHref, "_blank", "noopener,noreferrer");
    }
  };

  if (!appear) return null;

  // The sprite is drawn with tail on the RIGHT side, so it natively faces
  // LEFT. When moving right (dir=1) we need to mirror it.
  const facing = -appear.dir;

  return (
    <div
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      onClick={interactive ? handleClick : undefined}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: w + 12,
        height: h + 8,
        pointerEvents: interactive ? "auto" : "none",
        cursor: interactive ? "pointer" : "default",
        zIndex: 30,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        opacity: 0.8,
        willChange: "transform",
        filter: hovered
          ? `saturate(0.9) drop-shadow(0 0 12px ${p.glow}) drop-shadow(0 0 3px ${p.glow})`
          : `saturate(0.9) drop-shadow(0 0 4px ${p.glow})`,
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          position: "relative",
          transform: `scaleX(${facing}) scale(${hovered ? 1.25 : 1})`,
          transformOrigin: "center",
          transition: "transform 200ms cubic-bezier(0.2,0.7,0.2,1)",
        }}
      >
        <div
          style={{
            width: cell,
            height: cell,
            boxShadow: shadow,
            transform: sitting
              ? "translateY(3px)"
              : stepFrame === 0
                ? "translateY(0)"
                : appear.mode === "run"
                  ? "translateY(-3px)"
                  : "translateY(-1.5px)",
            transition: sitting ? "transform 220ms ease" : "transform 60ms linear",
            imageRendering: "pixelated",
          }}
        />
      </div>
      {interactive && tooltip && (
        <div
          style={{
            position: "absolute",
            left: w + 14,
            top: -10,
            transform: facing < 0 ? `translateX(-${w * 2 + 26}px)` : "none",
            padding: "6px 10px",
            background: "rgba(15,22,26,0.95)",
            border: "1px solid rgba(251,191,36,0.55)",
            borderRadius: 6,
            color: "#fbbf24",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            boxShadow: "0 0 12px rgba(251,191,36,0.35)",
            opacity: hovered ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 180ms linear",
            textShadow: "0 0 4px rgba(251,191,36,0.6)",
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
window.PixelCat = PixelCat;
