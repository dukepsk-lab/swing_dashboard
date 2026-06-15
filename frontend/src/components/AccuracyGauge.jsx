import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function AccuracyGauge({ shots }) {
  const total = shots.length;
  const onTarget = shots.filter(s => s.in_target).length;
  const pct = total > 0 ? Math.round((onTarget / total) * 100) : 0;

  const color = pct >= 80 ? '#22d3ee' : pct >= 60 ? '#60a5fa' : '#FF6B6B';
  const data = [{ value: pct, fill: color }];

  const fairways = total > 0 ? Math.round((shots.filter(s => Math.abs(s.lateral_offset) < 12).length / total) * 100) : 0;
  const avgCarry = total > 0 ? (shots.reduce((s, x) => s + (x.carry_distance || 0), 0) / total).toFixed(0) : '--';

  return (
    <div className="glass-panel glow-green p-4">
      <p className="section-title">Accuracy</p>
      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="90%"
              data={data}
              startAngle={220}
              endAngle={-40}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: 'rgba(255,255,255,0.04)' }}
                angleAxisId={0}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
            <span className="text-xs text-slate-500">on target</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">On Target</span>
            <span className="text-sm font-bold text-neon-green">{onTarget}/{total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Fairway %</span>
            <span className="text-sm font-bold text-white">{fairways}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Avg Carry</span>
            <span className="text-sm font-bold text-neon-teal">{avgCarry}y</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Shots Hit</span>
            <span className="text-sm font-bold text-white">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
