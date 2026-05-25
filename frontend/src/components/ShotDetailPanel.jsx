import { motion, AnimatePresence } from 'framer-motion';
import ClubFaceView from './ClubFaceView';
import BallSpinView from './BallSpinView';
import ClubHeadView from './ClubHeadView';
import { FlightSideView, FlightTopView } from './FlightViews';

const RANK_STYLE = {
  'S+': { bg: 'bg-sky-400/20',    border: 'border-sky-400/60',    text: 'text-sky-300',    glow: 'shadow-[0_0_16px_rgba(56,189,248,0.5)]' },
  'S':  { bg: 'bg-sky-500/15',    border: 'border-sky-500/40',    text: 'text-sky-400',    glow: '' },
  'A':  { bg: 'bg-neon-green/15', border: 'border-neon-green/40', text: 'text-neon-green', glow: '' },
  'B':  { bg: 'bg-lime-400/15',   border: 'border-lime-400/40',   text: 'text-lime-300',   glow: '' },
  'C':  { bg: 'bg-yellow-400/15', border: 'border-yellow-400/40', text: 'text-yellow-300', glow: '' },
  'D':  { bg: 'bg-orange-500/15', border: 'border-orange-400/40', text: 'text-orange-300', glow: '' },
  'E':  { bg: 'bg-red-500/15',    border: 'border-red-500/40',    text: 'text-red-400',    glow: '' },
};

function RankBadge({ rank }) {
  const s = RANK_STYLE[rank] ?? RANK_STYLE['C'];
  return (
    <div className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 font-black text-2xl ${s.bg} ${s.border} ${s.text} ${s.glow}`}>
      {rank}
    </div>
  );
}

function ClubIcon({ club }) {
  const icons = {
    'Driver': (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="16" cy="15" rx="7" ry="5" />
        <line x1="9" y1="12" x2="4" y2="4" />
        <circle cx="4" cy="4" r="1.5" fill="currentColor" />
      </svg>
    ),
    '3 Wood': (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="15" cy="15" rx="6" ry="4" />
        <line x1="9" y1="12" x2="4" y2="4" />
        <circle cx="4" cy="4" r="1.5" fill="currentColor" />
      </svg>
    ),
  };

  if (icons[club]) return <span className="text-neon-green">{icons[club]}</span>;

  // Generic iron/wedge
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-neon-green" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="14" width="10" height="7" rx="1" />
      <line x1="10" y1="14" x2="6" y2="3" />
      <circle cx="6" cy="3" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function ShotDetailPanel({ shot }) {
  return (
    <motion.div
      className="glass-panel glow-green p-4 space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ClubIcon club={shot?.club} />
          <div>
            <div className="text-white font-bold text-xl tracking-wide">{shot?.club ?? '—'}</div>
            <div className="text-xs text-slate-400">Shot #{shot?.shot_number ?? '—'}</div>
          </div>
        </div>

        {shot && <RankBadge rank={shot.shot_rank ?? 'C'} />}

        <div className="flex gap-3 ml-auto text-center">
          <div>
            <div className="text-3xl font-black text-neon-green tracking-tight leading-none">
              {shot?.smash_factor?.toFixed(2) ?? '—'}
            </div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">Smash Factor</div>
          </div>
          <div className="w-px bg-neon-green/10" />
          <div>
            <div className="text-2xl font-bold text-white leading-none">
              {shot?.ball_speed?.toFixed(0) ?? '—'}<span className="text-xs text-slate-400 ml-1">mph</span>
            </div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">Ball Speed</div>
          </div>
          <div className="w-px bg-neon-green/10" />
          <div>
            <div className="text-2xl font-bold text-white leading-none">
              {shot?.club_speed?.toFixed(0) ?? '—'}<span className="text-xs text-slate-400 ml-1">mph</span>
            </div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">Club Speed</div>
          </div>
          <div className="w-px bg-neon-green/10" />
          <div>
            <div className="text-2xl font-bold text-neon-green leading-none">
              {shot?.carry_distance?.toFixed(0) ?? '—'}<span className="text-xs text-slate-400 ml-1">yds</span>
            </div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">Carry</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neon-green/10" />

      {/* Flight views — full width */}
      <div>
        <p className="section-title">Ball Flight</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Side view takes 2/3 */}
          <div className="lg:col-span-2">
            <FlightSideView shot={shot} />
          </div>
          {/* Top view takes 1/3 */}
          <div>
            <FlightTopView shot={shot} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neon-green/10" />

      {/* Bottom row: club face | ball spin | club head */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClubFaceView shot={shot} />
        <BallSpinView shot={shot} />
        <ClubHeadView shot={shot} />
      </div>

      {/* Waiting state */}
      <AnimatePresence>
        {!shot && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-dark-900/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-neon-green/40 border-t-neon-green rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Waiting for shot data…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
