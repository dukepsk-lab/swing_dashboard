import { useEffect, useRef } from 'react';

const CLUB_SHAPES = {
  Driver:   { rx: 58, ry: 34, faceColor: '#1a2a3a', groove: true, label: 'DR' },
  '3 Wood': { rx: 46, ry: 28, faceColor: '#1a2a3a', groove: true, label: '3W' },
  '5 Iron': { rx: 36, ry: 20, faceColor: '#2a2a2a', groove: true, label: '5I' },
  '6 Iron': { rx: 34, ry: 19, faceColor: '#2a2a2a', groove: true, label: '6I' },
  '7 Iron': { rx: 32, ry: 18, faceColor: '#2a2a2a', groove: true, label: '7I' },
  '8 Iron': { rx: 30, ry: 17, faceColor: '#2a2a2a', groove: true, label: '8I' },
  '9 Iron': { rx: 28, ry: 16, faceColor: '#2a2a2a', groove: true, label: '9I' },
  PW:       { rx: 28, ry: 16, faceColor: '#2a2a2a', groove: true, label: 'PW' },
  SW:       { rx: 30, ry: 17, faceColor: '#2a2a2a', groove: true, label: 'SW' },
};

function impactColor(h, v) {
  const d = Math.sqrt(h * h + v * v);
  if (d < 0.25) return '#39FF14';
  if (d < 0.5)  return '#ADFF2F';
  if (d < 0.75) return '#FFD600';
  return '#FF4444';
}

export default function ClubFaceView({ shot }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const shape = CLUB_SHAPES[shot?.club] ?? CLUB_SHAPES['7 Iron'];
    const { rx, ry } = shape;

    // Outer bezel
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 6, ry + 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0D1117';
    ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,20,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Face background
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    const faceGrad = ctx.createRadialGradient(cx - rx * 0.2, cy - ry * 0.2, 2, cx, cy, rx);
    faceGrad.addColorStop(0, '#2a3a4a');
    faceGrad.addColorStop(1, '#0e1a24');
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,20,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grooves
    const grooveCount = 7;
    const grooveSpacing = (ry * 1.6) / (grooveCount + 1);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 1; i <= grooveCount; i++) {
      const gy = cy - ry + i * grooveSpacing + ry * 0.2;
      ctx.beginPath();
      ctx.moveTo(cx - rx + 4, gy);
      ctx.lineTo(cx + rx - 4, gy);
      ctx.strokeStyle = 'rgba(57,255,20,0.08)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();

    // Crosshair
    ctx.strokeStyle = 'rgba(57,255,20,0.15)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy - ry + 4); ctx.lineTo(cx, cy + ry - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - rx + 4, cy); ctx.lineTo(cx + rx - 4, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Ideal sweet-spot ring
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(rx, ry) * 0.28, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(57,255,20,0.20)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!shot) return;

    const hx = shot.h_face_impact ?? 0;
    const vy = shot.v_face_impact ?? 0;
    const ipx = cx + hx * rx * 0.85;
    const ipy = cy - vy * ry * 0.85;
    const col = impactColor(hx, vy);
    const dist = Math.sqrt(hx * hx + vy * vy);

    // Impact ripple rings
    [0.55, 0.38, 0.22].forEach((scale, i) => {
      ctx.beginPath();
      ctx.arc(ipx, ipy, dist < 0.3 ? 14 * scale : 20 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = col.replace(')', `, ${0.12 - i * 0.03})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(')', ', 0.12)');
      ctx.strokeStyle = `${col}${Math.round((0.18 - i * 0.04) * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Impact dot
    const ipGrad = ctx.createRadialGradient(ipx - 2, ipy - 2, 0, ipx, ipy, 9);
    ipGrad.addColorStop(0, '#ffffff');
    ipGrad.addColorStop(0.3, col);
    ipGrad.addColorStop(1, col + '44');
    ctx.beginPath();
    ctx.arc(ipx, ipy, 7, 0, Math.PI * 2);
    ctx.fillStyle = ipGrad;
    ctx.fill();
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ipx, ipy, 4, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Offset labels
    ctx.font = 'bold 9px JetBrains Mono';
    ctx.fillStyle = 'rgba(226,232,240,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('TOE', cx + rx + 14, cy + 3);
    ctx.fillText('HEEL', cx - rx - 14, cy + 3);
    ctx.fillText('HIGH', cx, cy - ry - 8);
    ctx.fillText('LOW', cx, cy + ry + 14);

    // Impact position label
    const hLabel = hx > 0.1 ? `${(hx * 100).toFixed(0)}% toe` : hx < -0.1 ? `${(-hx * 100).toFixed(0)}% heel` : 'center';
    const vLabel = vy > 0.1 ? `${(vy * 100).toFixed(0)}% high` : vy < -0.1 ? `${(-vy * 100).toFixed(0)}% low` : '';
    ctx.fillStyle = col;
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.fillText(hLabel + (vLabel ? ' · ' + vLabel : ''), cx, H - 6);
  }, [shot]);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="section-title w-full text-center">Club Face Impact</p>
      <canvas ref={canvasRef} width={200} height={130} className="w-full max-w-[200px]" />
      {shot && (
        <div className="flex gap-3 text-xs text-slate-400 mt-1">
          <span>H: <span className="text-white">{shot.h_face_impact > 0 ? '+' : ''}{((shot.h_face_impact ?? 0) * 100).toFixed(0)}%</span></span>
          <span>V: <span className="text-white">{shot.v_face_impact > 0 ? '+' : ''}{((shot.v_face_impact ?? 0) * 100).toFixed(0)}%</span></span>
        </div>
      )}
    </div>
  );
}
