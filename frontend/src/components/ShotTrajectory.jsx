import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

function drawGrid(ctx, W, H) {
  ctx.strokeStyle = 'rgba(57,255,20,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawGroundLine(ctx, W, baseY) {
  ctx.strokeStyle = 'rgba(57,255,20,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(W, baseY); ctx.stroke();
}

// Build canvas-space points from OGC trajectory data (x=forward, z=height in yards)
function ogcToCanvasPoints(trajectory, startX, baseY, scaleX, scaleZ) {
  return trajectory.map(p => ({
    cx: startX + p.x * scaleX,
    cy: baseY  - p.z * scaleZ,
  }));
}

// Parabola fallback
function parabolaPoints(carry, apex, startX, baseY, scaleX, scaleZ, steps = 80) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      cx: startX + t * carry * scaleX,
      cy: baseY  - (4 * apex * t * (1 - t)) * scaleZ,
    });
  }
  return pts;
}

export default function ShotTrajectory({ shot }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const W     = canvas.width;
    const H     = canvas.height;

    ctx.clearRect(0, 0, W, H);
    drawGrid(ctx, W, H);
    if (!shot) return;

    const carry   = shot.carry_distance || 150;
    const apex    = shot.apex_height    || 30;
    const lateral = shot.lateral_offset || 0;
    const hasReal = Array.isArray(shot.trajectory) && shot.trajectory.length > 2;

    const PAD_L = 30, PAD_R = 50, PAD_T = 30, PAD_B = 30;
    const drawW = W - PAD_L - PAD_R;
    const drawH = H - PAD_T - PAD_B;
    const baseY  = H - PAD_B;
    const startX = PAD_L;

    const scaleX = drawW / Math.max(carry * 1.05, 50);
    const scaleZ = drawH / Math.max(apex  * 2.0,  20);

    drawGroundLine(ctx, W, baseY);

    // Build canvas points
    const pts = hasReal
      ? ogcToCanvasPoints(shot.trajectory, startX, baseY, scaleX, scaleZ)
      : parabolaPoints(carry, apex, startX, baseY, scaleX, scaleZ);

    const landX = pts[pts.length - 1].cx;

    // Glow trail
    ctx.strokeStyle = 'rgba(57,255,20,0.10)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.cx, p.cy) : ctx.lineTo(p.cx, p.cy));
    ctx.stroke();

    // Main line with gradient
    const shotColor = shot.shot_color || '#39FF14';
    const grad = ctx.createLinearGradient(startX, baseY, landX, baseY);
    grad.addColorStop(0,   shotColor);
    grad.addColorStop(0.5, '#00FFD1');
    grad.addColorStop(1,   shotColor + '66');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = shotColor;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.cx, p.cy) : ctx.lineTo(p.cx, p.cy));
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Apex marker — highest canvas point
    const apexPt = pts.reduce((best, p) => p.cy < best.cy ? p : best, pts[0]);
    ctx.fillStyle   = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur  = 10;
    ctx.beginPath(); ctx.arc(apexPt.cx, apexPt.cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(0,255,209,0.85)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${apex.toFixed(0)}y`, apexPt.cx + 6, apexPt.cy - 4);

    // Tee dot
    ctx.fillStyle = shotColor; ctx.shadowColor = shotColor; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(startX, baseY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Landing dot
    ctx.fillStyle = shotColor;
    ctx.beginPath(); ctx.arc(landX, baseY, 5, 0, Math.PI * 2); ctx.fill();

    // Labels
    ctx.fillStyle = 'rgba(57,255,20,0.7)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${carry.toFixed(0)}y`, landX - 14, baseY + 14);
    ctx.fillText(shot.club || '', startX, baseY + 14);

    // Lateral drift
    if (Math.abs(lateral) > 1) {
      const dir = lateral > 0 ? 'R' : 'L';
      ctx.fillStyle = Math.abs(lateral) > 15 ? '#FF6B6B' : 'rgba(57,255,20,0.6)';
      ctx.fillText(`${Math.abs(lateral).toFixed(0)}y ${dir}`, landX - 14, baseY + 26);
    }

    // "Real physics" badge when using OGC trajectory
    if (hasReal) {
      ctx.fillStyle = 'rgba(57,255,20,0.5)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('OGC ✓', W - PAD_R + 4, PAD_T);
    }
  }, [shot]);

  const rankColor = {
    'S+': '#FFD700', S: '#FFD700', A: '#39FF14', B: '#7CB342',
    C: '#ADFF2F', D: '#FF6B6B', E: '#FF4444',
  };

  return (
    <motion.div className="glass-panel glow-green p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-1">
        <p className="section-title mb-0">Shot Trajectory</p>
        {shot?.shot_rank && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full border"
            style={{
              color: rankColor[shot.shot_rank] || '#94a3b8',
              borderColor: (rankColor[shot.shot_rank] || '#94a3b8') + '60',
              backgroundColor: (rankColor[shot.shot_rank] || '#94a3b8') + '18',
            }}
          >
            {shot.shot_name || shot.shot_shape}  ·  {shot.shot_rank}
          </span>
        )}
      </div>

      {!shot ? (
        <div className="flex items-center justify-center h-36 text-slate-600 text-sm">
          Waiting for shot data...
        </div>
      ) : (
        <canvas ref={canvasRef} width={480} height={190} className="w-full" />
      )}

      {shot && (
        <div className="flex gap-4 mt-2 text-xs text-slate-400 flex-wrap">
          <span>Apex: <span className="text-neon-teal">{shot.apex_height?.toFixed(0)}y</span></span>
          <span>Lateral: <span className={Math.abs(shot.lateral_offset) > 15 ? 'text-red-400' : 'text-neon-green'}>
            {shot.lateral_offset > 0 ? '+' : ''}{shot.lateral_offset?.toFixed(1)}y
          </span></span>
          {shot.backspin_rpm > 0 && (
            <span>Backspin: <span className="text-white">{Math.round(shot.backspin_rpm).toLocaleString()}</span></span>
          )}
          {shot.sidespin_rpm !== 0 && (
            <span>Sidespin: <span className="text-white">{shot.sidespin_rpm > 0 ? '+' : ''}{Math.round(shot.sidespin_rpm).toLocaleString()}</span></span>
          )}
          {shot.source === 'nova' && (
            <span className="ml-auto text-xs font-bold text-neon-green">⚡ NOVA LIVE</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
