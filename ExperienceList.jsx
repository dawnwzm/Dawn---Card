// ExperienceList.jsx — the hover-locks list (left column)
// Once you hover a row, focus locks. Hovering another row swaps it.
// Clicking outside any row (handled in App) clears.
function ExperienceList({ items, focused, onFocus }) {
  return (
    <div className="exp-list">
      <div className="exp-header">
        <span className="section-marker">[ experience ]</span>
        <span style={{ color: "var(--fg-5)", marginLeft: 12 }}>// hover to lock</span>
      </div>
      <div className={`exp-rows ${focused ? "has-focus" : ""}`}>
        {items.map((it, idx) => {
          const isFocused = focused === it.id;
          const isDim = focused && focused !== it.id;
          return (
            <div
              key={it.id}
              className={`exp-row ${isFocused ? "focused" : ""} ${isDim ? "dim" : ""}`}
              onMouseEnter={() => onFocus(it.id)}
              onClick={(e) => { e.stopPropagation(); onFocus(it.id); }}
            >
              <span className="exp-no">{String(idx + 1).padStart(2, "0")}</span>
              <span className="exp-year">{it.year}</span>
              <span className="exp-company">{it.company}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.ExperienceList = ExperienceList;
