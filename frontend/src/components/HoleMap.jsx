import { useEffect, useRef } from 'react';

export default function HoleMap({ holeData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !holeData) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const { path = [], distance = 400, par = 4 } = holeData;

    // Background
    ctx.fillStyle = '#080C10';
    ctx.fillRect(0, 0, W, H);

    // Fairway gradient strip
    const pad = 40;
    const fw = ctx.createLinearGradient(0, 0, 0, H);
    fw.addColorStop(0, 'rgba(39,80,30,0.6)');
    fw.addColorStop(1, 'rgba(20,50,15,0.3)');
    ctx.fillStyle = fw;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 30, pad, 60, H - pad * 2, 8);
    ctx.fill();

    if (!path.length) return;

    const maxY = Math.max(...path.map(p => p.y), distance);
    const scaleY = (H - pad * 2) / maxY;
    const cx = W / 2;
    const toCanvas = (p) => ({
      cx: cx + p.x * 0.8,
      cy: H - pad - p.y * scaleY,
    });

    // Tee box
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, H - pad, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hole cup
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx + (path[path.length - 1]?.x || 0) * 0.8, pad, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Flag
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + (path[path.length - 1]?.x || 0) * 0.8, pad);
    ctx.lineTo(cx + (path[path.length - 1]?.x || 0) * 0.8, pad - 20);
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cx + (path[path.length - 1]?.x || 0) * 0.8, pad - 20);
    ctx.lineTo(cx + (path[path.length - 1]?.x || 0) * 0.8 + 12, pad - 16);
    ctx.lineTo(cx + (path[path.length - 1]?.x || 0) * 0.8, pad - 12);
    ctx.fill();

    // Shot path
    const pts = path.slice(0, -1).map(toCanvas);
    pts.unshift({ cx, cy: H - pad });

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      ctx.strokeStyle = `rgba(34,211,238,${0.8 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(p0.cx, p0.cy);
      ctx.lineTo(p1.cx, p1.cy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Shot dot
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(p1.cx, p1.cy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(34,211,238,0.7)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(path[i - 1]?.label || '', p1.cx + 5, p1.cy - 4);
    }

    // Distance labels
    ctx.fillStyle = 'rgba(100,116,139,0.8)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`${distance}y`, cx - 14, pad - 6);
    ctx.fillText(`Par ${par}`, 8, 16);
  }, [holeData]);

  return (
    <div className="glass-panel glow-green p-4">
      <p className="section-title">Hole Map</p>
      {!holeData ? (
        <div className="flex items-center justify-center h-64 text-slate-600 text-sm">No hole data</div>
      ) : (
        <canvas ref={canvasRef} width={220} height={340} className="w-full max-w-[220px] mx-auto block" />
      )}
    </div>
  );
}
