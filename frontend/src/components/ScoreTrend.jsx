import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-neon-green/20 rounded-lg p-2 text-xs">
      <p className="text-neon-green font-bold">Hole {label}</p>
      <p className="text-slate-300">Par: {d.par}</p>
      <p className="text-white">Score: {d.score}</p>
      <p className={d.score - d.par <= 0 ? 'text-neon-green' : 'text-orange-400'}>
        {d.score - d.par >= 0 ? '+' : ''}{d.score - d.par}
      </p>
    </div>
  );
};

export default function ScoreTrend({ scores = [] }) {
  const data = scores.map(h => ({
    hole: h.hole,
    score: h.score,
    par: h.par,
    delta: h.score - h.par,
    cumulative: 0,
  }));

  let cum = 0;
  data.forEach(d => { cum += d.delta; d.cumulative = cum; });

  return (
    <div className="glass-panel glow-green p-4">
      <p className="section-title">Score vs Par (Cumulative)</p>
      {data.length < 2 ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Play holes to see trend</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(57,255,20,0.07)" />
            <XAxis dataKey="hole" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} label={{ value: 'Hole', position: 'insideBottom', fill: '#475569', fontSize: 10, offset: -2 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(57,255,20,0.4)" strokeDasharray="4 2" label={{ value: 'E', fill: '#39FF14', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="cumulative"
              name="vs Par"
              stroke="#00FFD1"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const color = payload.cumulative <= 0 ? '#39FF14' : '#FF6B6B';
                return <circle key={props.key} cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
