import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-neon-green/20 rounded-lg p-2 text-xs">
      <p className="text-slate-400 mb-1">Shot #{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}</p>
      ))}
    </div>
  );
};

export default function PerformanceTrend({ shots }) {
  const data = [...shots].reverse().map((s, i) => ({
    shot: i + 1,
    ball_speed: s.ball_speed,
    carry: s.carry_distance,
    smash: s.smash_factor ? +(s.smash_factor * 10).toFixed(1) : null,
  }));

  return (
    <div className="glass-panel glow-green p-4">
      <p className="section-title">Performance Trend</p>
      {data.length < 2 ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Need 2+ shots for trend</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.07)" />
            <XAxis
              dataKey="shot"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} iconType="circle" iconSize={7} />
            <Line
              type="monotone"
              dataKey="carry"
              name="Carry (yds)"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#22d3ee' }}
            />
            <Line
              type="monotone"
              dataKey="ball_speed"
              name="Ball Speed"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
            <Line
              type="monotone"
              dataKey="smash"
              name="Smash×10"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
