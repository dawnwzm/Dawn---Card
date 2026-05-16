// ExperienceCard.jsx — right-side hover tooltip dialog
function useRollingNumber(value, active, duration = 700) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    if (!active) { setDisplay(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, active, duration]);
  return display;
}

function StatRow({ label, value, suffix, active }) {
  const n = useRollingNumber(value, active);
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {n.toLocaleString()}{suffix || ""}
      </span>
    </div>
  );
}

function ExperienceCard({ item, visible }) {
  if (!item) return null;
  return (
    <div className={`exp-card ${visible ? "in" : "out"}`}>
      <div className="card-arrow"></div>
      <div className="card-header">
        <span className="card-eyebrow">// inspecting</span>
        <span className="card-id">~/experience/{item.id}.log</span>
      </div>
      <div className="card-meta">
        <span>{item.role}</span>
        <span className="card-dot">·</span>
        <span>{item.year}</span>
        <span className="card-dot">·</span>
        <span>{item.location}</span>
      </div>
      <ul className="card-bullets">
        {item.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      {item.images && item.images.length > 0 && (
        <div className="card-images">
          {item.images.map((src, i) => (
            <div className="card-image-slot" key={i}>
              <img src={src} alt="" className="card-image" loading="lazy" />
            </div>
          ))}
        </div>
      )}
      {item.stats && (
        <div className="card-stats">
          {Object.entries(item.stats).map(([k, v]) => (
            <StatRow key={k} label={k} value={v} active={visible} />
          ))}
        </div>
      )}
      <div className="card-tags">
        {item.tags.map((t) => (
          <span className="card-tag" key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
window.ExperienceCard = ExperienceCard;
