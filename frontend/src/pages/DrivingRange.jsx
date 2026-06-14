import { useWebSocket } from '../hooks/useWebSocket';
import KPICard from '../components/KPICard';
import SessionBar from '../components/SessionBar';
import ShotTrajectory from '../components/ShotTrajectory';
import ShotDispersion from '../components/ShotDispersion';
import ShotHistoryTable from '../components/ShotHistoryTable';
import ClubDistribution from '../components/ClubDistribution';
import PerformanceTrend from '../components/PerformanceTrend';
import AccuracyGauge from '../components/AccuracyGauge';
import ShotDetailPanel from '../components/ShotDetailPanel';

export default function DrivingRange() {
  const { connected, shots, lastShot, currentClub, sessionInfo, launchMonitor, setClub } = useWebSocket();
  const prev = shots[1] ?? null;

  const kpis = [
    { label: 'Ball Speed',    value: lastShot?.ball_speed?.toFixed(1),    unit: 'mph', prev: prev?.ball_speed,    icon: '⚡', highlight: false },
    { label: 'Club Speed',    value: lastShot?.club_speed?.toFixed(1),    unit: 'mph', prev: prev?.club_speed,    icon: '🏌️' },
    { label: 'Smash Factor',  value: lastShot?.smash_factor?.toFixed(2),  unit: '',    prev: prev?.smash_factor,  icon: '💥', highlight: lastShot?.smash_factor >= 1.48 },
    { label: 'Launch Angle',  value: lastShot?.launch_angle?.toFixed(1),  unit: '°',   prev: prev?.launch_angle,  icon: '📐' },
    { label: 'Spin Rate',     value: lastShot?.spin_rate?.toLocaleString(),unit: 'rpm', prev: prev?.spin_rate,    icon: '🌀' },
    { label: 'Carry Distance',value: lastShot?.carry_distance?.toFixed(0),unit: 'yds', prev: prev?.carry_distance,icon: '🎯', highlight: true },
    { label: 'Total Distance',value: lastShot?.total_distance?.toFixed(0),unit: 'yds', prev: prev?.total_distance,icon: '📏' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in">
      {/* Session Status Bar */}
      <SessionBar
        connected={connected}
        currentClub={currentClub}
        sessionInfo={sessionInfo}
        shotCount={shots.length}
        onSetClub={setClub}
        launchMonitor={launchMonitor}
      />

      {/* Empty state — waiting for the first shot from the launch monitor */}
      {shots.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center bg-dark-700/40 border border-neon-green/10 rounded-xl">
          <div className="text-neon-green text-sm font-bold tracking-wider">
            {launchMonitor?.connected ? 'LAUNCH MONITOR CONNECTED — TAKE A SWING' : 'WAITING FOR LAUNCH MONITOR'}
          </div>
          <div className="text-xs text-slate-400">
            Point your launch monitor's GSPro Connect output at this machine on port <span className="text-white font-mono">921</span>.
            Club &amp; swing metrics are reverse-calculated from ball data via open-golf-coach.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {kpis.map(k => (
          <KPICard
            key={k.label}
            label={k.label}
            value={k.value}
            unit={k.unit}
            prev={k.prev}
            highlight={k.highlight}
            icon={k.icon}
          />
        ))}
      </div>

      {/* Shot Detail Panel — new visual analytics row */}
      <ShotDetailPanel shot={lastShot} />

      {/* Main panels — row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ShotTrajectory shot={lastShot} />
        </div>
        <AccuracyGauge shots={shots} />
      </div>

      {/* Main panels — row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShotDispersion shots={shots} />
        <PerformanceTrend shots={shots} />
      </div>

      {/* Main panels — row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ShotHistoryTable shots={shots} />
        </div>
        <ClubDistribution shots={shots} />
      </div>
    </div>
  );
}
