export default function Scorecard({ scores = [], activHole = null }) {
  const front = scores.slice(0, 9);
  const back = scores.slice(9, 18);

  const total = scores.reduce((s, h) => s + h.score, 0);
  const totalPar = scores.reduce((s, h) => s + h.par, 0);
  const diff = total - totalPar;

  const scoreColor = (score, par) => {
    const d = score - par;
    if (d <= -2) return 'text-yellow-400 font-bold';
    if (d === -1) return 'text-neon-green font-bold';
    if (d === 0) return 'text-white';
    if (d === 1) return 'text-orange-400';
    return 'text-red-500';
  };

  const ScoreRow = ({ holes, label, start }) => {
    const rowTotal = holes.reduce((s, h) => s + h.score, 0);
    const rowPar = holes.reduce((s, h) => s + h.par, 0);
    return (
      <>
        <tr className="text-xs text-slate-500 border-t border-slate-700/40">
          <td className="py-1.5 pr-3 font-semibold text-slate-400">{label}</td>
          {holes.map((h, i) => (
            <td key={i} className={`py-1.5 px-1 text-center text-xs text-slate-500 ${activHole === h.hole ? 'bg-neon-green/10 rounded' : ''}`}>
              {h.hole}
            </td>
          ))}
          <td className="py-1.5 px-2 text-center text-slate-400 font-bold">{rowPar}</td>
        </tr>
        <tr className="text-xs border-b border-slate-800/40">
          <td className="py-1.5 pr-3 text-slate-400">Score</td>
          {holes.map((h, i) => (
            <td key={i} className={`py-1.5 px-1 text-center font-bold ${scoreColor(h.score, h.par)} ${activHole === h.hole ? 'bg-neon-green/10 rounded' : ''}`}>
              {h.score}
            </td>
          ))}
          <td className={`py-1.5 px-2 text-center font-bold ${rowTotal - rowPar <= 0 ? 'text-neon-green' : 'text-orange-400'}`}>
            {rowTotal}
          </td>
        </tr>
      </>
    );
  };

  return (
    <div className="glass-panel glow-green p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">Scorecard</p>
        {scores.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total:</span>
            <span className={`text-base font-bold ${diff <= 0 ? 'text-neon-green' : 'text-orange-400'}`}>
              {total} ({diff >= 0 ? '+' : ''}{diff})
            </span>
          </div>
        )}
      </div>
      {scores.length === 0 ? (
        <div className="text-slate-600 text-sm py-4 text-center">No round data</div>
      ) : (
        <table className="w-full text-xs min-w-[480px]">
          <tbody>
            <ScoreRow holes={front} label="OUT" start={1} />
            <ScoreRow holes={back} label="IN" start={10} />
          </tbody>
        </table>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-slate-500 flex-wrap">
        <span className="text-yellow-400">■ Eagle</span>
        <span className="text-neon-green">■ Birdie</span>
        <span className="text-white">■ Par</span>
        <span className="text-orange-400">■ Bogey</span>
        <span className="text-red-500">■ Double+</span>
      </div>
    </div>
  );
}
