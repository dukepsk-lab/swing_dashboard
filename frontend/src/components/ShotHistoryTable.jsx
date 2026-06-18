import { motion, AnimatePresence } from 'framer-motion';

const shapeColor = { straight: '#39FF14', draw: '#00FFD1', fade: '#ADFF2F', hook: '#FF6B6B', slice: '#FF4444' };

export default function ShotHistoryTable({ shots }) {
  const recent = shots.slice(0, 20);

  return (
    <div className="glass-panel glow-green p-4 overflow-y-auto max-h-[215px]">
      <p className="section-title">Shot History</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              {['#', 'Club', 'Ball Spd', 'Smash', 'Launch', 'Spin', 'Carry', 'Total', 'Shape'].map(h => (
                <th key={h} className="text-left pb-2 pr-3 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {recent.map((s, i) => (
                <motion.tr
                  key={s.id ?? s.timestamp ?? i}
                  initial={{ opacity: 0, x: -10, backgroundColor: 'rgba(57,255,20,0.08)' }}
                  animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                  transition={{ duration: 0.4 }}
                  className="table-row-hover border-b border-slate-800/40"
                >
                  <td className="py-1.5 pr-3 text-slate-500">{s.shot_number ?? (recent.length - i)}</td>
                  <td className="py-1.5 pr-3 text-neon-green font-semibold whitespace-nowrap">{s.club}</td>
                  <td className="py-1.5 pr-3 text-white">{s.ball_speed?.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 text-white">{s.smash_factor?.toFixed(2)}</td>
                  <td className="py-1.5 pr-3 text-white">{s.launch_angle?.toFixed(1)}°</td>
                  <td className="py-1.5 pr-3 text-white">{s.spin_rate?.toLocaleString()}</td>
                  <td className="py-1.5 pr-3 text-neon-teal font-semibold">{s.carry_distance?.toFixed(0)}</td>
                  <td className="py-1.5 pr-3 text-white">{s.total_distance?.toFixed(0)}</td>
                  <td className="py-1.5" style={{ color: shapeColor[s.shot_shape] || '#94a3b8' }}>
                    {s.shot_shape}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {recent.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-600">Waiting for shots...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
