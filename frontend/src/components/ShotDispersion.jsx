import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = payload.in_target ? '#22d3ee' : '#FF6B6B';
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.1} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-neon-green/20 rounded-lg p-2 text-xs">
      <p className="text-neon-green font-bold">{d.club}</p>
      <p className="text-slate-300">Carry: {d.carry_distance}y</p>
      <p className="text-slate-300">Lateral: {d.lateral_offset > 0 ? '+' : ''}{d.lateral_offset}y</p>
      <p className={d.in_target ? 'text-neon-green' : 'text-red-400'}>{d.in_target ? '✓ On Target' : '✗ Off Target'}</p>
    </div>
  );
};

export default function ShotDispersion({ shots }) {
  const data = shots.map(s => ({
    x: s.lateral_offset ?? 0,
    y: s.carry_distance ?? 0,
    ...s,
  }));

  return (
    <div className="glass-panel glow-green p-4">
      <p className="section-title">Shot Dispersion</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No shots yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.08)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[-50, 50]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              label={{ value: 'Lateral (yds)', position: 'insideBottom', fill: '#475569', fontSize: 10, offset: -2 }}
            />
            <YAxis
              dataKey="y"
              type="number"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              label={{ value: 'Carry', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(34,211,238,0.2)' }} />
            <ReferenceLine x={0} stroke="rgba(34,211,238,0.3)" strokeDasharray="4 2" />
            <ReferenceLine x={-18} stroke="rgba(255,107,107,0.3)" strokeDasharray="2 2" />
            <ReferenceLine x={18} stroke="rgba(255,107,107,0.3)" strokeDasharray="2 2" />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
