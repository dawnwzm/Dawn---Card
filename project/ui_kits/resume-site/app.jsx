// app.jsx — main page composition
function StatusLine() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const session = (() => {
    const total = 3 * 3600 + 42 * 60 + t;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `1d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();
  return (
    <div className="statusline top">
      <span className="seg"><span className="k">▮</span> dawn@aigc-explorer</span>
      <span className="sep">│</span>
      <span className="seg">session <span className="k">{session}</span></span>
      <span className="sep">│</span>
      <span className="seg">fps <span className="k">60</span></span>
      <span className="sep">│</span>
      <span className="seg">cats <span className="k">3</span></span>
      <span style={{ flex: 1 }}></span>
      <span className="seg">~/experience<span className="cursor-block"></span></span>
    </div>
  );
}

function CommandBar() {
  return (
    <div className="statusline bottom">
      <span className="seg"><span className="key">hover</span> inspect</span>
      <span className="sep">·</span>
      <span className="seg"><span className="key">scroll</span> load next</span>
      <span className="sep">·</span>
      <span className="seg"><span className="key">esc</span> back to /</span>
      <span style={{ flex: 1 }}></span>
      <span className="seg dim">dawn // aigc explorer · v1.0.0 · build 2026.05</span>
    </div>
  );
}

function App() {
  const data = window.RESUME_DATA;
  const [focused, setFocused] = React.useState(null);
  const [heroDone, setHeroDone] = React.useState(false);

  // Once hovered, the row stays locked. Clearing happens only when:
  //   - hovering another row (replaces focus)
  //   - clicking outside any experience row (Esc-style dismiss)
  const handleFocus = React.useCallback((id) => {
    setFocused(id);
  }, []);
  const handleClearOutside = React.useCallback((e) => {
    if (!e.target.closest(".exp-row")) {
      setFocused(null);
    }
  }, []);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setFocused(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const focusedItem = data.experiences.find((e) => e.id === focused);
  const activeBuildingId = focusedItem?.buildingId || null;

  return (
    <>
      {/* z=0: background fixed */}
      <div className="bg-scanline" aria-hidden="true"></div>
      <div className="bg-grid" aria-hidden="true"></div>

      {/* z=1: unified particle field (astronaut + building) */}
      <ParticleField activeBuildingId={activeBuildingId} terminalActive={!heroDone} />

      {/* z=2: pixel cats — horizontal traverse */}
      <PixelCat color="mint"   startDelay={2000} />
      <PixelCat
        color="yellow"
        startDelay={4500}
        downloadHref="../../assets/resume.pdf"
        downloadFilename="王子墨-AIGC产品运营-简历.pdf"
        tooltip="click → 下载我的简历"
      />

      {/* z=100: top/bottom status */}
      <StatusLine />
      <CommandBar />

      {/* z=20: content */}
      <main className="content" onClick={handleClearOutside}>
        <header className="brand">
          <div className="brand-handle">
            <span style={{ color: "var(--phosphor)" }}>dawn</span>
            <span style={{ color: "var(--fg-4)" }}> // </span>
            <span style={{ color: "var(--fg-2)" }}>aigc explorer</span>
            <span className="cursor-block"></span>
          </div>
          <div className="brand-meta">
            <span className="section-marker">[ explorer log v1 ]</span>
            <span style={{ color: "var(--fg-4)" }}>· {data.identity.location}</span>
          </div>
        </header>

        <section className="hero">
          <Terminal data={data} onComplete={() => setHeroDone(true)} />
        </section>

        <section className="exp-section">
          <div className="exp-grid">
            <ExperienceList
              items={data.experiences}
              focused={focused}
              onFocus={handleFocus}
              onBlur={() => {}}
            />
            <div className="exp-card-slot">
              <ExperienceCard item={focusedItem} visible={!!focusedItem} />
              {!focusedItem && (
                <div className="exp-card-empty">
                  <div className="empty-frame">
                    <div className="empty-label">// awaiting hover</div>
                    <div className="empty-ascii">
                      {`┌─────────────────────────────┐
│  ▮                          │
│  no entry focused.          │
│                             │
│  hover any row on the left  │
│  to load its log.           │
│                          ▮  │
└─────────────────────────────┘`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="footer">
          <span className="section-marker">[ end of log ]</span>
          <span style={{ color: "var(--fg-4)", marginLeft: 12 }}>
            press <span className="key">esc</span> to return · or just look at the cats
          </span>
        </footer>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
