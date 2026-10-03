export default function InfoGrid({ title = "Complexity", cells = [] }) {
  return (
    <div className="card">
      <h4 className="card-title">{title}</h4>
      <div className="info-grid">
        {cells.map((c) => (
          <div className="info-cell" key={c.k}>
            <div className="k">{c.k}</div>
            <div className="v">{c.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
