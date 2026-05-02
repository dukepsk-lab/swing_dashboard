export default function RoundSummary({ scores = [], courseName = '' }) {
  const played = scores.filter(h => h.score > 0);

  const eagles = played.filter(h => h.score <= h.par - 2).length;
  const birdies = played.filter(h => h.score === h.par - 1).length;
  const pars = played.filter(h => h.score === h.par).length;
  const bogeys = played.filter(h => h.score === h.par + 1).length;
  const doubles = played.filter(h => h.score >= h.par + 2).length;

  const bars = [
    { label: 'Eagle-', count: eagles, color: '#FFD700' },
    { label: 'Birdie', count: birdies, color: '#39FF14' },
    { label: 'Par', count: pars, color: '#94a3b8' },
    { label: 'Bogey', count: bogeys, color: '#FB923C' },
    { label: 'Double+', count: doubles, color: '#EF4444' },
  ];

  const maxCount = Math.max(...bars.map(b => b.count), 1);

  const bestHole = played.reduce((best, h) => (!best || h.score - h.par < best.score - best.par ? h : best), null);
  const worstHole = played.reduce((worst, h) => (!worst || h.score - h.par > worst.score - worst.par ? h : worst), null);

  return (
    <div className="glass-panel glow-green p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">Round Summary</p>
        {courseName && <span className="text-xs text-neon-green">{courseName}</span>}
      </div>

      {played.length === 0 ? (
        <div className="text-slate-600 text-sm py-4 text-center">No completed holes</div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {bars.map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-xs w-14 text-slate-400 text-right shrink-0">{b.label}</span>
                <div className="flex-1 h-4 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(b.count / maxCount) * 100}%`, backgroundColor: b.color, opacity: 0.8 }}
                  />
                </div>
                <span className="text-xs w-4 text-white">{b.count}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            {bestHole && (
              <div className="bg-neon-green/5 border border-neon-green/15 rounded-lg p-2">
                <p className="text-slate-500">Best Hole</p>
                <p className="text-neon-green font-bold">#{bestHole.hole} ({bestHole.score - bestHole.par <= 0 ? '' : '+'}{bestHole.score - bestHole.par})</p>
              </div>
            )}
            {worstHole && (
              <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-2">
                <p className="text-slate-500">Worst Hole</p>
                <p className="text-red-400 font-bold">#{worstHole.hole} (+{worstHole.score - worstHole.par})</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
