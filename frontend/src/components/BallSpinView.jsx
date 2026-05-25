import { useEffect, useRef } from 'react';

function drawTP5xBall(ctx, cx, cy, r) {
  // Base ball gradient (white/off-white)
  const ballGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
  ballGrad.addColorStop(0, '#ffffff');
  ballGrad.addColorStop(0.4, '#e8edf2');
  ballGrad.addColorStop(0.75, '#c8d0d8');
  ballGrad.addColorStop(1, '#9aa4ae');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ballGrad;
  ctx.fill();

  // TP5x dimple pattern — draw small recessed dimples
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const dimpleRows = [
    { count: 4,  radiusFactor: 0.18, yOffset: -0.65 },
    { count: 8,  radiusFactor: 0.17, yOffset: -0.42 },
    { count: 12, radiusFactor: 0.16, yOffset: -0.18 },
    { count: 14, radiusFactor: 0.15, yOffset:  0.08 },
    { count: 12, radiusFactor: 0.16, yOffset:  0.33 },
    { count: 8,  radiusFactor: 0.17, yOffset:  0.58 },
    { count: 4,  radiusFactor: 0.17, yOffset:  0.78 },
  ];

  dimpleRows.forEach(({ count, radiusFactor, yOffset }) => {
    const dr = r * radiusFactor;
    const dy = cy + yOffset * r;
    const rowR = Math.sqrt(Math.max(0, r * r - (yOffset * r) * (yOffset * r)));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dx = cx + Math.cos(angle) * rowR * 0.88;
      // Shadow half
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80,100,120,0.28)';
      ctx.fill();
      // Highlight half
      ctx.beginPath();
      ctx.arc(dx - dr * 0.3, dy - dr * 0.3, dr * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
    }
  });
  ctx.restore();

  // TaylorMade branding strip (horizontal band)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // Blue band
  ctx.fillStyle = 'rgba(0,80,160,0.72)';
  ctx.fillRect(cx - r, cy - r * 0.18, r * 2, r * 0.36);
  // "TP5x" text on band
  ctx.font = `bold ${r * 0.28}px Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TP5x', cx, cy);
  // TaylorMade small text
  ctx.font = `${r * 0.15}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('TaylorMade', cx, cy - r * 0.28);
  ctx.restore();

  // Specular highlight
  const specGrad = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.32, 0, cx - r * 0.28, cy - r * 0.32, r * 0.55);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
  specGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  specGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();

  // Outer edge shadow
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSpinArrow(ctx, cx, cy, r, spinAxis, backspin, sidespin) {
  const totalSpin = Math.sqrt(backspin * backspin + sidespin * sidespin) || 1;
  const spinDeg   = Math.abs(spinAxis) || 0;

  // Arrow size scales with spin magnitude
  const arrowLen = r * 0.85 + (totalSpin / 12000) * r * 0.4;
  // Arrow direction: spin_axis angle, rotated so 0 = pure backspin (upward arrow)
  const arrowAngle = (spinAxis * Math.PI) / 180 - Math.PI / 2;

  const ax = cx + Math.cos(arrowAngle) * (r + 10);
  const ay = cy + Math.sin(arrowAngle) * (r + 10);
  const bx = cx + Math.cos(arrowAngle) * (r + 10 + arrowLen);
  const by = cy + Math.sin(arrowAngle) * (r + 10 + arrowLen);

  const arrowColor = spinDeg < 10 ? '#39FF14' : Math.abs(sidespin) > backspin * 0.5 ? '#FF6B35' : '#00FFD1';

  ctx.save();
  ctx.strokeStyle = arrowColor;
  ctx.fillStyle   = arrowColor;
  ctx.lineWidth   = 2.5;
  ctx.shadowColor = arrowColor;
  ctx.shadowBlur  = 8;
  ctx.lineCap     = 'round';

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Arrowhead
  const headSize = 8;
  const perpAngle = arrowAngle + Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - headSize * Math.cos(arrowAngle - 0.4), by - headSize * Math.sin(arrowAngle - 0.4));
  ctx.lineTo(bx - headSize * Math.cos(arrowAngle + 0.4), by - headSize * Math.sin(arrowAngle + 0.4));
  ctx.closePath();
  ctx.fill();

  // Spin axis rotation indicator arc
  ctx.shadowBlur = 0;
  ctx.strokeStyle = arrowColor + '44';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, -Math.PI / 2, arrowAngle, spinAxis < 0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export default function BallSpinView({ shot }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const r  = 46;
    const cx = W / 2;
    const cy = H / 2 + 4;

    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 14;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#888';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.shadowOffsetY = 0;

    drawTP5xBall(ctx, cx, cy, r);

    if (!shot) return;

    const spinAxis = shot.spin_axis ?? 0;
    const backspin = shot.backspin ?? shot.spin_rate ?? 3000;
    const sidespin = shot.sidespin ?? 0;

    drawSpinArrow(ctx, cx, cy, r, spinAxis, backspin, sidespin);
  }, [shot]);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="section-title w-full text-center">Ball · Spin Direction</p>
      <canvas ref={canvasRef} width={200} height={160} className="w-full max-w-[200px]" />
      {shot && (
        <div className="grid grid-cols-3 gap-2 text-xs text-center w-full mt-1">
          <div>
            <div className="text-slate-500 text-[10px]">BACKSPIN</div>
            <div className="text-neon-teal font-bold">{(shot.backspin ?? 0).toLocaleString()}</div>
            <div className="text-slate-600 text-[10px]">rpm</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px]">SIDESPIN</div>
            <div className={`font-bold ${Math.abs(shot.sidespin ?? 0) > 800 ? 'text-amber-400' : 'text-neon-green'}`}>
              {(shot.sidespin ?? 0) > 0 ? '+' : ''}{(shot.sidespin ?? 0).toLocaleString()}
            </div>
            <div className="text-slate-600 text-[10px]">rpm</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px]">AXIS</div>
            <div className={`font-bold ${Math.abs(shot.spin_axis ?? 0) > 15 ? 'text-amber-400' : 'text-neon-green'}`}>
              {(shot.spin_axis ?? 0) > 0 ? '+' : ''}{(shot.spin_axis ?? 0).toFixed(1)}°
            </div>
            <div className="text-slate-600 text-[10px]">{(shot.spin_axis ?? 0) > 5 ? 'fade' : (shot.spin_axis ?? 0) < -5 ? 'draw' : 'neutral'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
