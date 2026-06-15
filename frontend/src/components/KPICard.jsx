import { motion } from 'framer-motion';

export default function KPICard({ label, value, unit, prev, highlight = false, icon }) {
  const delta = prev != null ? value - prev : null;
  const up = delta > 0;

  return (
    <motion.div
      className={`kpi-card glow-green ${highlight ? 'border-neon-green/40' : ''}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key={value}
    >
      <div className="flex items-center justify-between">
        <span className="section-title mb-0">{label}</span>
        {icon && <span className="text-neon-green/50 text-base">{icon}</span>}
      </div>
      <div className="flex items-end gap-1 mt-1">
        <motion.span
          key={value}
          className={`text-2xl font-bold ${highlight ? 'text-neon-green' : 'text-white'}`}
          initial={{ scale: 1.15, color: '#22d3ee' }}
          animate={{ scale: 1, color: highlight ? '#22d3ee' : '#ffffff' }}
          transition={{ duration: 0.4 }}
        >
          {value ?? '--'}
        </motion.span>
        {unit && <span className="text-slate-400 text-sm mb-0.5">{unit}</span>}
      </div>
      {delta != null && (
        <span className={`text-xs ${up ? 'text-neon-green' : 'text-red-400'}`}>
          {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
        </span>
      )}
    </motion.div>
  );
}
