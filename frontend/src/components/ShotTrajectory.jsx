import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ShotTrajectory({ shot }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(57,255,20,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (!shot) return;

    const carry = shot.carry_distance || 150;
    const apex = shot.apex_height || 30;
    const lateral = shot.lateral_offset || 0;

    // Scale: horizontal = carry distance, vertical = apex height
    const scaleX = (W - 60) / Math.max(carry * 1.1, 50);
    const scaleY = (H - 40) / Math.max(apex * 2.2, 30);
    const baseY = H - 20;
    const startX = 30;

    // Draw ground line
    ctx.strokeStyle = 'rgba(57,255,20,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(W, baseY);
    ctx.stroke();

    // Compute trajectory points (parabola)
    const pts = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + t * carry * scaleX;
      const y = baseY - (4 * apex * t * (1 - t)) * scaleY;
      pts.push({ x, y });
    }

    // Landing zone
    const landX = startX + carry * scaleX;
    const landLateral = (lateral / carry) * 20;

    // Faint trail
    ctx.strokeStyle = 'rgba(57,255,20,0.12)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();

    // Main trajectory gradient
    const grad = ctx.createLinearGradient(startX, baseY, landX, baseY);
    grad.addColorStop(0, 'rgba(57,255,20,0.9)');
    grad.addColorStop(0.5, 'rgba(0,255,209,0.9)');
    grad.addColorStop(1, 'rgba(57,255,20,0.4)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Apex dot
    const apexPt = pts[Math.floor(steps / 2)];
    ctx.fillStyle = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(apexPt.x, apexPt.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0,255,209,0.8)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${apex.toFixed(0)}y`, apexPt.x + 6, apexPt.y - 4);

    // Start dot
    ctx.fillStyle = '#39FF14';
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(startX, baseY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Landing dot
    ctx.fillStyle = '#39FF14';
    ctx.beginPath();
    ctx.arc(landX, baseY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = 'rgba(57,255,20,0.7)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${carry.toFixed(0)}y`, landX - 14, baseY + 14);
    ctx.fillText(shot.club || '', startX, baseY + 14);

    // Lateral offset indicator
    if (Math.abs(lateral) > 1) {
      const dir = lateral > 0 ? 'R' : 'L';
      ctx.fillStyle = lateral > 15 ? '#FF6B6B' : 'rgba(57,255,20,0.6)';
      ctx.fillText(`${Math.abs(lateral).toFixed(0)}y ${dir}`, landX - 14, baseY + 26);
    }
  }, [shot]);

  return (
    <motion.div
      className="glass-panel glow-green p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="section-title">Shot Trajectory</p>
      {!shot && (
        <div className="flex items-center justify-center h-36 text-slate-600 text-sm">
          Waiting for shot data...
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={480}
        height={180}
        className="w-full"
        style={{ display: shot ? 'block' : 'none' }}
      />
      {shot && (
        <div className="flex gap-4 mt-2 text-xs text-slate-400 flex-wrap">
          <span>Shape: <span className="text-white capitalize">{shot.shot_shape}</span></span>
          <span>Apex: <span className="text-neon-teal">{shot.apex_height?.toFixed(0)}y</span></span>
          <span>Lateral: <span className={Math.abs(shot.lateral_offset) > 15 ? 'text-red-400' : 'text-neon-green'}>
            {shot.lateral_offset > 0 ? '+' : ''}{shot.lateral_offset?.toFixed(1)}y
          </span></span>
        </div>
      )}
    </motion.div>
  );
}
