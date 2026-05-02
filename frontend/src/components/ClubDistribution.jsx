import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#39FF14', '#00FFD1', '#ADFF2F', '#00BFFF', '#FF6B6B', '#FFD700', '#FF8C00', '#C084FC', '#F472B6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-dark-700 border border-neon-green/20 rounded-lg p-2 text-xs">
      <p style={{ color: d.payload.fill }} className="font-bold">{d.name}</p>
      <p className="text-slate-300">{d.value} shots</p>
    </div>
  );
};

export default function ClubDistribution({ shots }) {
  const counts = shots.reduce((acc, s) => {
    acc[s.club] = (acc[s.club] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="glass-panel glow-green p-4">
      <p className="section-title">Club Distribution</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
