import { useEffect, useRef } from 'react';

// ─── Side View ──────────────────────────────────────────────────────────────

function drawSideView(ctx, W, H, shot) {
  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(34,211,238,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const padL = 36, padR = 20, padT = 22, padB = 28;
  const carry = shot?.carry_distance || 160;
  const apex  = shot?.apex_height   || 32;

  const scaleX = (W - padL - padR) / (carry * 1.08);
  const scaleY = (H - padT - padB) / (apex  * 2.4);
  const baseY  = H - padB;
  const startX = padL;
  const landX  = startX + carry * scaleX;

  // Ground
  ctx.strokeStyle = 'rgba(34,211,238,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(W, baseY); ctx.stroke();

  if (!shot) return;

  const steps = 100;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return {
      x: startX + t * carry * scaleX,
      y: baseY - (4 * apex * t * (1 - t)) * scaleY,
    };
  });

  // Glow trail
  ctx.strokeStyle = 'rgba(59,130,246,0.08)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Main gradient line
  const grad = ctx.createLinearGradient(startX, baseY, landX, baseY);
  grad.addColorStop(0, '#22d3ee');
  grad.addColorStop(0.45, '#3b82f6');
  grad.addColorStop(1, '#22d3ee66');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Descent dashed line
  const apexPt = pts[Math.floor(steps / 2)];
  ctx.strokeStyle = 'rgba(255,214,0,0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(apexPt.x, apexPt.y); ctx.lineTo(apexPt.x, baseY); ctx.stroke();
  ctx.setLineDash([]);

  // Descent angle arc at landing
  if (shot.apex_height > 5) {
    const descent = Math.atan2(apex * scaleY, carry * scaleX * 0.5) * (180 / Math.PI);
    const arcR = 18;
    const landAngle = Math.atan2(-(pts[steps].y - pts[steps - 5].y), pts[steps].x - pts[steps - 5].x);
    ctx.strokeStyle = 'rgba(255,214,0,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(landX, baseY, arcR, -Math.PI / 2, -landAngle, true);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,0,0.7)';
    ctx.font = '8px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`${descent.toFixed(0)}°`, landX + arcR + 8, baseY - 8);
  }

  // Apex dot
  ctx.fillStyle = '#3b82f6';
  ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(apexPt.x, apexPt.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(59,130,246,0.8)';
  ctx.font = '9px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText(`${apex.toFixed(0)}y`, apexPt.x + 5, apexPt.y - 4);

  // Hang-time label
  if (shot.apex_height > 0) {
    const hangTime = (2 * Math.sqrt(2 * apex * 0.9144 / 9.81)).toFixed(1);
    ctx.fillStyle = 'rgba(255,214,0,0.55)';
    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`~${hangTime}s`, apexPt.x, baseY - 5);
  }

  // Start dot
  ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(startX, baseY, 5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Landing dot
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath(); ctx.arc(landX, baseY, 5, 0, Math.PI * 2); ctx.fill();

  // Distance label
  ctx.fillStyle = 'rgba(34,211,238,0.8)';
  ctx.font = 'bold 10px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText(`${carry.toFixed(0)}y carry`, landX, baseY + 14);

  // Total distance tick
  const totalX = startX + (shot.total_distance || carry * 1.05) * scaleX;
  ctx.strokeStyle = 'rgba(34,211,238,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(totalX, baseY - 6); ctx.lineTo(totalX, baseY + 6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(34,211,238,0.5)';
  ctx.font = '8px JetBrains Mono';
  ctx.fillText(`${(shot.total_distance || carry * 1.05).toFixed(0)}y total`, totalX, baseY + 22);

  // Axis label
  ctx.fillStyle = 'rgba(34,211,238,0.3)';
  ctx.font = '8px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText('SIDE VIEW', 4, 12);
}


// ─── Top View ────────────────────────────────────────────────────────────────

function drawTopView(ctx, W, H, shot) {
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(34,211,238,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const padL = 24, padR = 24, padT = 20, padB = 20;
  const carry   = shot?.carry_distance  || 160;
  const lateral = shot?.lateral_offset  || 0;
  const shape   = shot?.shot_shape      || 'straight';

  const scaleY = (H - padT - padB) / (carry * 1.1);
  const maxLat = Math.max(Math.abs(lateral) * 1.6, 30);
  const scaleX = (W - padL - padR) / (maxLat * 2);
  const originX = W / 2;
  const originY = H - padB;

  // Target line (straight ahead)
  ctx.strokeStyle = 'rgba(34,211,238,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(originX, padT); ctx.stroke();
  ctx.setLineDash([]);

  // Fairway zone (±18y band)
  const fwHalf = 18 * scaleX;
  ctx.fillStyle = 'rgba(34,211,238,0.04)';
  ctx.fillRect(originX - fwHalf, padT, fwHalf * 2, H - padT - padB);

  if (!shot) return;

  // Build curved flight path based on shot shape
  const steps = 80;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    // Quadratic curve: starts straight, curves toward lateral offset
    const curvature = lateral * t * t;
    return {
      x: originX + curvature * scaleX,
      y: originY - t * carry * scaleY,
    };
  });

  // Shape color
  const shapeColor = shape.includes('slice') || shape.includes('fade')
    ? '#FF6B35' : shape.includes('hook') || shape.includes('draw')
    ? '#3b82f6' : '#22d3ee';

  // Glow trail
  ctx.strokeStyle = shapeColor + '18';
  ctx.lineWidth = 7;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Main line
  ctx.strokeStyle = shapeColor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = shapeColor; ctx.shadowBlur = 8;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();
  ctx.shadowBlur = 0;

  const landX = originX + lateral * scaleX;
  const landY = originY - carry * scaleY;

  // Landing circle
  ctx.beginPath(); ctx.arc(landX, landY, 6, 0, Math.PI * 2);
  ctx.fillStyle = shapeColor; ctx.shadowColor = shapeColor; ctx.shadowBlur = 10; ctx.fill();
  ctx.shadowBlur = 0;

  // Offline dashed line
  if (Math.abs(lateral) > 2) {
    ctx.strokeStyle = 'rgba(255,100,50,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(originX, landY); ctx.lineTo(landX, landY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,150,80,0.8)';
    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = lateral > 0 ? 'right' : 'left';
    const offLabel = lateral > 0 ? 'R' : 'L';
    ctx.fillText(`${Math.abs(lateral).toFixed(0)}y ${offLabel}`, lateral > 0 ? landX - 3 : landX + 3, landY - 4);
  }

  // Tee dot
  ctx.beginPath(); ctx.arc(originX, originY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;

  // Labels
  ctx.fillStyle = shapeColor;
  ctx.font = 'bold 9px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText(shape.toUpperCase(), landX, landY - 10);

  ctx.fillStyle = 'rgba(34,211,238,0.3)';
  ctx.font = '8px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText('TOP VIEW', 4, 12);

  // Scale ruler at bottom
  const ruler10y = 10 * scaleY;
  ctx.strokeStyle = 'rgba(34,211,238,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, H - 8); ctx.lineTo(padL + ruler10y, H - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(padL, H - 6); ctx.lineTo(padL, H - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(padL + ruler10y, H - 6); ctx.lineTo(padL + ruler10y, H - 10); ctx.stroke();
  ctx.fillStyle = 'rgba(34,211,238,0.3)'; ctx.font = '7px JetBrains Mono'; ctx.textAlign = 'center';
  ctx.fillText('10y', padL + ruler10y / 2, H - 1);
}


// ─── Exports ─────────────────────────────────────────────────────────────────

export function FlightSideView({ shot }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    drawSideView(c.getContext('2d'), c.width, c.height, shot);
  }, [shot]);

  return (
    <div className="flex flex-col gap-1">
      <canvas ref={ref} width={480} height={180} className="w-full rounded" />
      {shot && (
        <div className="flex gap-4 text-xs text-slate-400 flex-wrap px-1">
          <span>Carry <span className="text-neon-green">{shot.carry_distance?.toFixed(0)}y</span></span>
          <span>Total <span className="text-neon-green">{shot.total_distance?.toFixed(0)}y</span></span>
          <span>Apex <span className="text-neon-teal">{shot.apex_height?.toFixed(0)}y</span></span>
          <span>VLA <span className="text-white">{shot.launch_angle?.toFixed(1)}°</span></span>
        </div>
      )}
    </div>
  );
}

export function FlightTopView({ shot }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    drawTopView(c.getContext('2d'), c.width, c.height, shot);
  }, [shot]);

  const shape = shot?.shot_shape || '';
  const shapeColor = shape.includes('slice') || shape.includes('fade') ? 'text-orange-400'
    : shape.includes('hook') || shape.includes('draw') ? 'text-neon-teal' : 'text-neon-green';

  return (
    <div className="flex flex-col gap-1">
      <canvas ref={ref} width={320} height={220} className="w-full rounded" />
      {shot && (
        <div className="flex gap-4 text-xs text-slate-400 flex-wrap px-1">
          <span>Shape <span className={`capitalize font-bold ${shapeColor}`}>{shot.shot_shape}</span></span>
          <span>HLA <span className="text-white">{(shot.lateral_offset >= 0 ? '+' : '')}{shot.lateral_offset?.toFixed(1)}y</span></span>
        </div>
      )}
    </div>
  );
}
