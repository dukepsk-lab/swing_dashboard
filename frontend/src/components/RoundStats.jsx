export default function RoundStats({ scores = [] }) {
  const played = scores.filter(h => h.score > 0);
  const total = played.reduce((s, h) => s + h.score, 0);
  const par = played.reduce((s, h) => s + h.par, 0);
  const diff = total - par;

  const fir = played.filter(h => h.par !== 3 && h.fairway_hit).length;
  const firOpp = played.filter(h => h.par !== 3).length;
  const gir = played.filter(h => h.gir).length;
  const putts = played.reduce((s, h) => s + (h.putts || 0), 0);

  const StatItem = ({ label, value, sub, color = 'text-white' }) => (
    <div className="glass-panel p-4 text-center">
      <p className="section-title mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? '--'}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatItem
        label="Total Score"
        value={played.length > 0 ? `${total}` : '--'}
        sub={played.length > 0 ? `${diff >= 0 ? '+' : ''}${diff} vs par` : ''}
        color={diff <= 0 ? 'text-neon-green' : 'text-orange-400'}
      />
      <StatItem
        label="Fairways Hit"
        value={firOpp > 0 ? `${fir}/${firOpp}` : '--'}
        sub={firOpp > 0 ? `${Math.round((fir / firOpp) * 100)}%` : ''}
        color="text-neon-teal"
      />
      <StatItem
        label="GIR"
        value={played.length > 0 ? `${gir}/${played.length}` : '--'}
        sub={played.length > 0 ? `${Math.round((gir / played.length) * 100)}%` : ''}
        color="text-neon-green"
      />
      <StatItem
        label="Putts"
        value={putts || '--'}
        sub={played.length > 0 ? `${(putts / played.length).toFixed(1)} avg` : ''}
        color="text-white"
      />
    </div>
  );
}
