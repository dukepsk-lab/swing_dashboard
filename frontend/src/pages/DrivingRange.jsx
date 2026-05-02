import { useWebSocket } from '../hooks/useWebSocket';
import KPICard from '../components/KPICard';
import SessionBar from '../components/SessionBar';
import ShotTrajectory from '../components/ShotTrajectory';
import ShotDispersion from '../components/ShotDispersion';
import ShotHistoryTable from '../components/ShotHistoryTable';
import ClubDistribution from '../components/ClubDistribution';
import PerformanceTrend from '../components/PerformanceTrend';
import AccuracyGauge from '../components/AccuracyGauge';

export default function DrivingRange() {
  const { connected, shots, lastShot, currentClub, sessionInfo, novaConnected, triggerShot, setClub } = useWebSocket();
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
        onTrigger={triggerShot}
        novaConnected={novaConnected}
      />

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
