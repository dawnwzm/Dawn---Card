// Terminal.jsx — hero terminal with typewriter
function useTypewriter(lines, opts = {}) {
  const speed = opts.speed ?? 36;
  const linePause = opts.linePause ?? 400;
  const [state, setState] = React.useState({ rendered: [], lineIdx: 0, charIdx: 0, done: false });

  React.useEffect(() => {
    if (state.done) return;
    if (state.lineIdx >= lines.length) {
      setState((s) => ({ ...s, done: true }));
      return;
    }
    const current = lines[state.lineIdx];
    const fullText = `$ ${current.cmd}\n› ${current.out}`;
    if (state.charIdx < fullText.length) {
      const jitter = speed + (Math.random() - 0.5) * 14;
      const t = setTimeout(() => {
        setState((s) => {
          const newRendered = [...s.rendered];
          newRendered[s.lineIdx] = fullText.slice(0, s.charIdx + 1);
          return { ...s, rendered: newRendered, charIdx: s.charIdx + 1 };
        });
      }, jitter);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setState((s) => ({ ...s, lineIdx: s.lineIdx + 1, charIdx: 0 }));
      }, linePause);
      return () => clearTimeout(t);
    }
  }, [state, lines, speed, linePause]);

  return state;
}

function Terminal({ data, onComplete }) {
  const ty = useTypewriter(data.hero_lines, { speed: 32, linePause: 380 });
  React.useEffect(() => {
    if (ty.done && onComplete) onComplete();
  }, [ty.done, onComplete]);

  return (
    <div className="terminal">
      <div className="term-chrome">
        <span className="dot" style={{ background: "#f87171" }}></span>
        <span className="dot" style={{ background: "#fbbf24" }}></span>
        <span className="dot" style={{ background: "#4ade80" }}></span>
        <span className="term-title">~/dawn — zsh — 80×24</span>
      </div>
      <div className="term-body">
        {ty.rendered.map((text, i) => {
          const [cmd, out] = text.split("\n");
          return (
            <div className="term-block" key={i}>
              <div className="term-cmd">
                <span className="prompt-sym">$</span>
                <span>{cmd?.replace(/^\$ /, "")}</span>
              </div>
              {out && (
                <div className="term-out">
                  <span className="arrow">›</span>
                  <span>{out.replace(/^› /, "")}</span>
                </div>
              )}
            </div>
          );
        })}
        {!ty.done && (
          <div className="term-block">
            <span className="prompt-sym">$</span>
            <span className="cursor-block"></span>
          </div>
        )}
        {ty.done && (
          <div className="term-block">
            <span className="prompt-sym">$</span>
            <span style={{ color: "var(--fg-3)" }}>hover an experience below to inspect_</span>
            <span className="cursor-block"></span>
          </div>
        )}
      </div>
    </div>
  );
}
window.Terminal = Terminal;
