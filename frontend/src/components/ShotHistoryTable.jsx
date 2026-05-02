import { motion, AnimatePresence } from 'framer-motion';

const RANK_META = {
  'S+': { bg: 'rgba(255,215,0,0.15)',   border: 'rgba(255,215,0,0.5)',   text: '#FFD700' },
  'S':  { bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.4)',   text: '#FFD700' },
  'A':  { bg: 'rgba(57,255,20,0.12)',   border: 'rgba(57,255,20,0.4)',   text: '#39FF14' },
  'B':  { bg: 'rgba(124,179,66,0.12)',  border: 'rgba(124,179,66,0.4)',  text: '#7CB342' },
  'C':  { bg: 'rgba(173,255,47,0.10)',  border: 'rgba(173,255,47,0.35)', text: '#ADFF2F' },
  'D':  { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.4)', text: '#FF6B6B' },
  'E':  { bg: 'rgba(255,68,68,0.12)',   border: 'rgba(255,68,68,0.4)',   text: '#FF4444' },
};

function RankBadge({ rank }) {
  if (!rank) return null;
  const m = RANK_META[rank] || { bg: 'transparent', border: '#475569', text: '#94a3b8' };
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-bold border leading-none"
      style={{ background: m.bg, borderColor: m.border, color: m.text }}
    >
      {rank}
    </span>
  );
}

export default function ShotHistoryTable({ shots }) {
  const recent = shots.slice(0, 20);

  return (
    <div className="glass-panel glow-green p-4 overflow-hidden">
      <p className="section-title">Shot History</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              {['#', 'Club', 'Ball Spd', 'Smash', 'Launch', 'Spin', 'Carry', 'Total', 'Shot Name', 'Rank'].map(h => (
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
                  <td className="py-1.5 pr-3 font-semibold whitespace-nowrap">
                    <span className="text-neon-green">{s.club}</span>
                    {s.source === 'nova' && (
                      <span className="ml-1 text-[9px] text-neon-green/60 font-normal">NOVA</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-white">{s.ball_speed?.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 text-white">{s.smash_factor?.toFixed(2)}</td>
                  <td className="py-1.5 pr-3 text-white">{s.launch_angle?.toFixed(1)}°</td>
                  <td className="py-1.5 pr-3 text-white">{s.spin_rate?.toLocaleString()}</td>
                  <td className="py-1.5 pr-3 font-semibold" style={{ color: s.shot_color || '#00FFD1' }}>
                    {s.carry_distance?.toFixed(0)}
                  </td>
                  <td className="py-1.5 pr-3 text-white">{s.total_distance?.toFixed(0)}</td>
                  <td className="py-1.5 pr-3 text-slate-300 whitespace-nowrap">
                    {s.shot_name || <span className="capitalize">{s.shot_shape}</span>}
                  </td>
                  <td className="py-1.5">
                    <RankBadge rank={s.shot_rank} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {recent.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-600">Waiting for shots...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
