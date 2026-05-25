import { useEffect, useRef } from 'react';

// ── Club head silhouettes ────────────────────────────────────────────────────
// Returns { top, side } drawing functions for each club type

function isWood(club) { return club === 'Driver' || club === '3 Wood'; }
function isWedge(club) { return club === 'PW' || club === 'SW'; }

function drawIronSide(ctx, cx, cy, scale, aoa, faceAngle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((aoa * Math.PI) / 180);

  // Hosel
  ctx.beginPath();
  ctx.rect(-2 * scale, -28 * scale, 4 * scale, 28 * scale);
  ctx.fillStyle = '#8899aa';
  ctx.fill();

  // Head body
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 0);
  ctx.lineTo(-6 * scale, 12 * scale);
  ctx.lineTo(22 * scale, 10 * scale);
  ctx.lineTo(22 * scale, 2 * scale);
  ctx.lineTo(8 * scale, 0);
  ctx.closePath();
  const headGrad = ctx.createLinearGradient(-6 * scale, 0, 22 * scale, 12 * scale);
  headGrad.addColorStop(0, '#3a4a5a');
  headGrad.addColorStop(1, '#1a2530');
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,20,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Face line (highlighted)
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 0);
  ctx.lineTo(-6 * scale, 12 * scale);
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#39FF14'; ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Sole
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 12 * scale);
  ctx.lineTo(22 * scale, 10 * scale);
  ctx.strokeStyle = 'rgba(57,255,20,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawWoodSide(ctx, cx, cy, scale, aoa, faceAngle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((aoa * Math.PI) / 180);

  // Hosel
  ctx.beginPath();
  ctx.rect(-3 * scale, -30 * scale, 5 * scale, 30 * scale);
  ctx.fillStyle = '#8899aa';
  ctx.fill();

  // Head — rounded crown
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 0);
  ctx.quadraticCurveTo(-12 * scale, -8 * scale, 8 * scale, -10 * scale);
  ctx.lineTo(28 * scale, -2 * scale);
  ctx.lineTo(28 * scale, 12 * scale);
  ctx.quadraticCurveTo(14 * scale, 18 * scale, -6 * scale, 14 * scale);
  ctx.lineTo(-10 * scale, 0);
  ctx.closePath();
  const woodGrad = ctx.createLinearGradient(-10 * scale, -10 * scale, 28 * scale, 14 * scale);
  woodGrad.addColorStop(0, '#2a3a4a');
  woodGrad.addColorStop(1, '#0e1820');
  ctx.fillStyle = woodGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,20,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Face line
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 0);
  ctx.lineTo(-6 * scale, 14 * scale);
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#39FF14'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;

  ctx.restore();
}

function drawIronTop(ctx, cx, cy, scale, clubPath, faceTarget) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((clubPath * Math.PI) / 180);

  // Shaft
  ctx.beginPath();
  ctx.rect(-2 * scale, -36 * scale, 4 * scale, 36 * scale);
  ctx.fillStyle = '#8899aa';
  ctx.fill();

  // Head — top view: thin rectangle
  ctx.beginPath();
  ctx.moveTo(-4 * scale, 0);
  ctx.lineTo(-4 * scale, 8 * scale);
  ctx.lineTo(26 * scale, 6 * scale);
  ctx.lineTo(26 * scale, -2 * scale);
  ctx.closePath();
  const tGrad = ctx.createLinearGradient(-4 * scale, 0, 26 * scale, 0);
  tGrad.addColorStop(0, '#3a4a5a');
  tGrad.addColorStop(1, '#1a2530');
  ctx.fillStyle = tGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,20,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Face angle indicator (separate rotation on face line)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((faceTarget * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(-4 * scale, 0);
  ctx.lineTo(-4 * scale, 8 * scale);
  ctx.strokeStyle = '#00FFD1';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00FFD1'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
}

function drawWoodTop(ctx, cx, cy, scale, clubPath, faceTarget) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((clubPath * Math.PI) / 180);

  // Shaft
  ctx.beginPath();
  ctx.rect(-2.5 * scale, -38 * scale, 5 * scale, 38 * scale);
  ctx.fillStyle = '#8899aa';
  ctx.fill();

  // Head — pear shape from top
  ctx.beginPath();
  ctx.ellipse(12 * scale, 4 * scale, 20 * scale, 12 * scale, 0, 0, Math.PI * 2);
  const wGrad = ctx.createRadialGradient(8 * scale, 0, 2 * scale, 12 * scale, 4 * scale, 20 * scale);
  wGrad.addColorStop(0, '#2a3a4a');
  wGrad.addColorStop(1, '#0e1820');
  ctx.fillStyle = wGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,20,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Face angle
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((faceTarget * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(-8 * scale, -2 * scale);
  ctx.lineTo(-8 * scale, 10 * scale);
  ctx.strokeStyle = '#00FFD1';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00FFD1'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
}

function drawAngleLabel(ctx, cx, cy, angle, color, label, offsetX, offsetY) {
  ctx.fillStyle = color;
  ctx.font = 'bold 9px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText(`${label}: ${angle > 0 ? '+' : ''}${angle.toFixed(1)}°`, cx + offsetX, cy + offsetY);
}

function drawAngleArc(ctx, cx, cy, radius, fromAngle, toAngle, color) {
  if (Math.abs(toAngle - fromAngle) < 0.001) return;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, fromAngle, toAngle, toAngle < fromAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}


// ── Component ────────────────────────────────────────────────────────────────

export default function ClubHeadView({ shot }) {
  const sideRef = useRef(null);
  const topRef  = useRef(null);

  const club      = shot?.club ?? '7 Iron';
  const aoa       = shot?.angle_of_attack ?? -4.5;
  const clubPath  = shot?.club_path       ?? 0;
  const faceTgt   = shot?.face_to_target  ?? 0;
  const facePath  = shot?.face_to_path    ?? 0;
  const wood      = isWood(club);
  const scale     = 1.2;

  // Side view: AoA
  useEffect(() => {
    const canvas = sideRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.42, cy = H * 0.56;

    // Grid
    ctx.strokeStyle = 'rgba(57,255,20,0.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Ground line
    ctx.strokeStyle = 'rgba(57,255,20,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cy + 14 * scale); ctx.lineTo(W, cy + 14 * scale); ctx.stroke();

    // Swing path direction arrow (at AoA)
    const pathAngle = (aoa * Math.PI) / 180;
    const arrowLen = 60;
    const ax = cx - Math.cos(pathAngle) * arrowLen;
    const ay = cy - Math.sin(pathAngle) * arrowLen;
    ctx.strokeStyle = 'rgba(57,255,20,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx + Math.cos(pathAngle) * 20, cy + Math.sin(pathAngle) * 20); ctx.stroke();
    ctx.setLineDash([]);

    // AoA angle arc
    const horizAngle = 0;
    drawAngleArc(ctx, cx, cy, 28, horizAngle, pathAngle, 'rgba(57,255,20,0.45)');

    // Club head
    if (wood) drawWoodSide(ctx, cx, cy, scale, aoa, faceTgt);
    else drawIronSide(ctx, cx, cy, scale, aoa, faceTgt);

    // AoA label
    drawAngleLabel(ctx, W * 0.75, cy - 8, aoa, '#39FF14', 'AoA', 0, 0);

    // View label
    ctx.fillStyle = 'rgba(57,255,20,0.3)'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText('SIDE VIEW · ATTACK ANGLE', 4, 10);
  }, [shot, aoa, faceTgt, wood, scale]);

  // Top view: club path & face angle
  useEffect(() => {
    const canvas = topRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.4, cy = H * 0.55;

    // Grid
    ctx.strokeStyle = 'rgba(57,255,20,0.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Target line (straight ahead — upward = away)
    ctx.strokeStyle = 'rgba(57,255,20,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, H); ctx.lineTo(cx, 0); ctx.stroke();
    ctx.setLineDash([]);

    // Club path arrow
    const cpAngle = (clubPath * Math.PI) / 180 - Math.PI / 2;
    const arrowLen = 55;
    const bx = cx + Math.cos(cpAngle) * arrowLen;
    const by = cy + Math.sin(cpAngle) * arrowLen;
    ctx.strokeStyle = 'rgba(57,255,20,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(cpAngle) * 25, cy - Math.sin(cpAngle) * 25); ctx.lineTo(bx, by); ctx.stroke();
    // arrowhead
    ctx.fillStyle = '#39FF14';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 8 * Math.cos(cpAngle - 0.35), by - 8 * Math.sin(cpAngle - 0.35));
    ctx.lineTo(bx - 8 * Math.cos(cpAngle + 0.35), by - 8 * Math.sin(cpAngle + 0.35));
    ctx.closePath(); ctx.fill();

    // Path angle arc from target line
    drawAngleArc(ctx, cx, cy, 26, -Math.PI / 2, cpAngle, 'rgba(57,255,20,0.4)');

    // Face angle arc
    const faceAngle = (faceTgt * Math.PI) / 180 - Math.PI / 2;
    drawAngleArc(ctx, cx, cy, 16, -Math.PI / 2, faceAngle, 'rgba(0,255,209,0.5)');

    // Club head top view
    if (wood) drawWoodTop(ctx, cx, cy, scale, clubPath, faceTgt);
    else drawIronTop(ctx, cx, cy, scale, clubPath, faceTgt);

    // Labels
    drawAngleLabel(ctx, W * 0.78, cy - 20, clubPath, '#39FF14', 'Path', 0, 0);
    drawAngleLabel(ctx, W * 0.78, cy,       faceTgt, '#00FFD1', 'Face', 0, 0);
    drawAngleLabel(ctx, W * 0.78, cy + 18,  facePath, clubPath - faceTgt > 0 ? '#FF6B35' : '#ADFF2F', 'F/P', 0, 0);

    ctx.fillStyle = 'rgba(57,255,20,0.3)'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText('TOP VIEW · PATH & FACE', 4, 10);
  }, [shot, clubPath, faceTgt, facePath, wood, scale]);

  return (
    <div className="flex flex-col gap-2">
      <p className="section-title">Club Head Analysis</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-slate-500 mb-1 text-center tracking-widest uppercase">Attack Angle</p>
          <canvas ref={sideRef} width={220} height={150} className="w-full rounded" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1 text-center tracking-widest uppercase">Path & Face</p>
          <canvas ref={topRef} width={220} height={150} className="w-full rounded" />
        </div>
      </div>
      {shot && (
        <div className="grid grid-cols-4 gap-2 text-xs text-center">
          {[
            { label: 'AoA', value: aoa, color: aoa > 0 ? 'text-neon-teal' : 'text-amber-400' },
            { label: 'Path', value: clubPath, color: 'text-neon-green' },
            { label: 'Face', value: faceTgt, color: 'text-neon-teal' },
            { label: 'F/P', value: facePath, color: Math.abs(facePath) > 3 ? 'text-amber-400' : 'text-neon-green' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-slate-500 text-[10px]">{label}</div>
              <div className={`font-bold ${color}`}>{value > 0 ? '+' : ''}{value.toFixed(1)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
