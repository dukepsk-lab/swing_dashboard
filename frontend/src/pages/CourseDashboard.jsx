import { useState, useEffect } from 'react';
import HoleMap from '../components/HoleMap';
import Scorecard from '../components/Scorecard';
import RoundStats from '../components/RoundStats';
import ScoreTrend from '../components/ScoreTrend';
import RoundSummary from '../components/RoundSummary';
import { motion } from 'framer-motion';

// Empty default = same-origin (dev: Vite proxies /api; prod: FastAPI serves it).
const API = import.meta.env.VITE_API_URL || '';

export default function CourseDashboard() {
  const [roundData, setRoundData] = useState(null);
  const [activeHole, setActiveHole] = useState(1);
  const [holeMapData, setHoleMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wind, setWind] = useState({ speed: 8.5, direction: 'SW' });

  useEffect(() => {
    fetch(`${API}/api/course/demo`)
      .then(r => r.json())
      .then(d => {
        setRoundData(d);
        const firstHolePath = d.hole_paths?.find(hp => hp.hole === 1);
        if (firstHolePath) {
          setHoleMapData({
            ...firstHolePath,
            distance: d.scores?.[0]?.distance,
            par: d.scores?.[0]?.par,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!roundData) return;
    const idx = activeHole - 1;
    const holePath = roundData.hole_paths?.find(hp => hp.hole === activeHole);
    const scoreEntry = roundData.scores?.[idx];
    if (holePath && scoreEntry) {
      setHoleMapData({
        ...holePath,
        distance: scoreEntry.distance,
        par: scoreEntry.par,
      });
    }
  }, [activeHole, roundData]);

  const currentScore = roundData?.scores?.find(h => h.hole === activeHole);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in">
      {/* Course Header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-dark-700/50 border border-neon-green/10 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse_slow" />
          <span className="text-neon-green font-bold text-sm tracking-wider">COURSE PLAY</span>
        </div>
        <div className="h-4 w-px bg-slate-600" />
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Course</span>
          <span className="text-white font-bold text-sm">{roundData?.course_name ?? '---'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Hole</span>
          <span className="text-neon-green font-bold text-lg">{activeHole}</span>
        </div>
        {currentScore && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Par</span>
              <span className="text-white font-bold">{currentScore.par}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Distance</span>
              <span className="text-neon-teal font-bold">{currentScore.distance}y</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-slate-400 text-xs">Wind</span>
          <span className="text-white text-xs">{wind.speed} mph {wind.direction}</span>
          <span className="text-lg">🌬️</span>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetch(`${API}/api/course/demo`)
              .then(r => r.json())
              .then(d => { setRoundData(d); setActiveHole(1); setLoading(false); })
              .catch(() => setLoading(false));
          }}
          className="px-3 py-1 text-xs font-bold bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green rounded-lg transition-all"
        >
          🔄 New Round
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-neon-green text-sm animate-pulse_slow">
          Loading round data...
        </div>
      ) : (
        <>
          {/* Hole selector */}
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 18 }, (_, i) => i + 1).map(h => {
              const score = roundData?.scores?.find(s => s.hole === h);
              const delta = score ? score.score - score.par : null;
              let holeColor = 'border-slate-700/50 text-slate-400 hover:border-neon-green/30 hover:text-white';
              if (h === activeHole) holeColor = 'border-neon-green/60 text-neon-green bg-neon-green/10';
              else if (delta != null) {
                if (delta <= -2) holeColor = 'border-yellow-400/40 text-yellow-400';
                else if (delta === -1) holeColor = 'border-neon-green/40 text-neon-green';
                else if (delta === 0) holeColor = 'border-slate-500/40 text-slate-300';
                else if (delta === 1) holeColor = 'border-orange-400/40 text-orange-400';
                else holeColor = 'border-red-500/40 text-red-400';
              }
              return (
                <button
                  key={h}
                  onClick={() => setActiveHole(h)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all duration-150 ${holeColor}`}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Hole Map */}
            <div className="lg:col-span-1">
              <HoleMap holeData={holeMapData} />
            </div>

            {/* Scorecard + Stats */}
            <div className="lg:col-span-3 space-y-4">
              <RoundStats scores={roundData?.scores ?? []} />
              <Scorecard scores={roundData?.scores ?? []} activHole={activeHole} />
            </div>
          </div>

          {/* Bottom panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ScoreTrend scores={roundData?.scores ?? []} />
            <RoundSummary scores={roundData?.scores ?? []} courseName={roundData?.course_name} />
          </div>

          {/* Per-hole shot analysis */}
          {currentScore && (
            <motion.div
              key={activeHole}
              className="glass-panel glow-green p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="section-title">Hole {activeHole} Analysis</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-dark-600/60 rounded-lg p-3 text-center">
                  <p className="text-slate-400 mb-1">Score</p>
                  <p className={`text-2xl font-bold ${currentScore.score - currentScore.par < 0 ? 'text-neon-green' : currentScore.score === currentScore.par ? 'text-white' : 'text-orange-400'}`}>
                    {currentScore.score}
                  </p>
                  <p className="text-slate-500 mt-0.5">Par {currentScore.par}</p>
                </div>
                <div className="bg-dark-600/60 rounded-lg p-3 text-center">
                  <p className="text-slate-400 mb-1">Fairway</p>
                  <p className={`text-2xl ${currentScore.fairway_hit ? 'text-neon-green' : 'text-red-400'}`}>
                    {currentScore.fairway_hit ? '✓' : '✗'}
                  </p>
                  <p className="text-slate-500 mt-0.5">{currentScore.fairway_hit ? 'Hit' : 'Missed'}</p>
                </div>
                <div className="bg-dark-600/60 rounded-lg p-3 text-center">
                  <p className="text-slate-400 mb-1">GIR</p>
                  <p className={`text-2xl ${currentScore.gir ? 'text-neon-green' : 'text-red-400'}`}>
                    {currentScore.gir ? '✓' : '✗'}
                  </p>
                  <p className="text-slate-500 mt-0.5">{currentScore.gir ? 'Regulation' : 'Missed'}</p>
                </div>
                <div className="bg-dark-600/60 rounded-lg p-3 text-center">
                  <p className="text-slate-400 mb-1">Putts</p>
                  <p className="text-2xl font-bold text-white">{currentScore.putts}</p>
                  <p className="text-slate-500 mt-0.5">{currentScore.putts === 1 ? 'One putt!' : currentScore.putts === 2 ? 'Two putt' : 'Three putt'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
