import { useEffect, useState } from 'react';

const CLUBS = ['Driver', '3 Wood', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'PW', 'SW'];

export default function SessionBar({ connected, currentClub, sessionInfo, shotCount, onSetClub, onTrigger, novaConnected = false }) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!sessionInfo?.start_time) return;
    const start = new Date(sessionInfo.start_time + 'Z');
    const tick = () => {
      const s = Math.floor((Date.now() - start.getTime()) / 1000);
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionInfo]);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-dark-700/50 border border-neon-green/10 rounded-xl mb-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-neon-green animate-pulse_slow' : 'bg-red-500'}`} />
        <span className={`text-xs font-bold tracking-wider ${connected ? 'text-neon-green' : 'text-red-400'}`}>
          {connected ? 'LIVE SESSION' : 'RECONNECTING...'}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-600" />

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span>⏱</span>
        <span className="text-white font-mono">{elapsed}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span>🏌️</span>
        <span className="text-white">{shotCount} shots</span>
      </div>

      {/* Nova hardware badge */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${novaConnected ? 'bg-neon-green animate-pulse_slow' : 'bg-slate-600'}`} />
        <span className={`text-xs font-semibold ${novaConnected ? 'text-neon-green' : 'text-slate-500'}`}>
          {novaConnected ? 'NOVA LIVE' : 'NOVA –'}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <span className="text-xs text-slate-400">Club:</span>
        <select
          value={currentClub}
          onChange={e => onSetClub(e.target.value)}
          className="bg-dark-600 border border-neon-green/20 text-neon-green text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-neon-green/50 cursor-pointer"
        >
          {CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={onTrigger}
          className="px-3 py-1 text-xs font-bold bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green rounded-lg transition-all"
        >
          ⚡ Trigger Shot
        </button>
      </div>
    </div>
  );
}
