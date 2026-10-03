export default function PlayerControls({ player, playLabel = "Play", children }) {
  return (
    <>
      <div className="progress-line">
        <span>Step {player.total ? player.idx + 1 : 0} / {player.total}</span>
        {children}
      </div>
      <div className="narration">{player.step?.note || "Press play or step forward to begin."}</div>
      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="btn" onClick={player.prev}>◀ Step</button>
        <button className="btn primary" onClick={player.toggle}>{player.playing ? "⏸ Pause" : `▶ ${playLabel}`}</button>
        <button className="btn" onClick={player.next}>Step ▶</button>
        <button className="btn ghost" onClick={player.reset}>Reset</button>
      </div>
    </>
  );
}
