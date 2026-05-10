"use client";

export default function MagicCircle({ size = 280, color = "#6b21a8" }: { size?: number; color?: string }) {
  const cx = size / 2;
  const R = size / 2 - 4;

  const poly = (sides: number, r: number, offsetDeg = 0) =>
    Array.from({ length: sides }, (_, i) => {
      const a = ((i * 360) / sides + offsetDeg - 90) * (Math.PI / 180);
      return `${cx + r * Math.cos(a)},${cx + r * Math.sin(a)}`;
    }).join(" ");

  const star = (sides: number, r: number, r2: number, offsetDeg = 0) => {
    const pts: string[] = [];
    for (let i = 0; i < sides * 2; i++) {
      const a = ((i * 180) / sides + offsetDeg - 90) * (Math.PI / 180);
      const radius = i % 2 === 0 ? r : r2;
      pts.push(`${cx + radius * Math.cos(a)},${cx + radius * Math.sin(a)}`);
    }
    return pts.join(" ");
  };

  const tickMarks = (count: number, r: number, len: number, offsetDeg = 0) =>
    Array.from({ length: count }, (_, i) => {
      const a = ((i * 360) / count + offsetDeg) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(a);
      const y1 = cx + r * Math.sin(a);
      const x2 = cx + (r + len) * Math.cos(a);
      const y2 = cx + (r + len) * Math.sin(a);
      return `M${x1},${y1}L${x2},${y2}`;
    }).join(" ");

  const arcDashes = (r: number, count: number, gapDeg = 4) =>
    Array.from({ length: count }, (_, i) => {
      const startA = ((i * 360) / count - 90) * (Math.PI / 180);
      const endA = ((i * 360) / count + 360 / count - gapDeg - 90) * (Math.PI / 180);
      const lx = cx + r * Math.cos(startA);
      const ly = cx + r * Math.sin(startA);
      const ex = cx + r * Math.cos(endA);
      const ey = cx + r * Math.sin(endA);
      return `M${lx},${ly} A${r},${r} 0 0,1 ${ex},${ey}`;
    }).join(" ");

  const glowId = `glow-${size}`;
  const redGlowId = `red-glow-${size}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={redGlowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 最外周リング + 目盛り — ゆっくり回転 */}
      <g className="magic-circle" filter={`url(#${glowId})`}>
        {/* 外枠二重円 */}
        <circle cx={cx} cy={cx} r={R} fill="none" stroke={color} strokeWidth="2" opacity="0.9" />
        <circle cx={cx} cy={cx} r={R - 6} fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />

        {/* 外周アーク分割（24分割） */}
        <path d={arcDashes(R - 3, 24, 3)} fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" />

        {/* 目盛り（外側長/短） */}
        <path d={tickMarks(72, R - 7, -6)} stroke={color} strokeWidth="0.5" opacity="0.5" />
        <path d={tickMarks(24, R - 7, -10)} stroke={color} strokeWidth="1" opacity="0.8" />

        {/* 六芒星（外） */}
        <polygon points={poly(6, R - 18)} fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
        <polygon points={poly(6, R - 18, 60)} fill="none" stroke={color} strokeWidth="0.5" opacity="0.35" />

        {/* 中間円 */}
        <circle cx={cx} cy={cx} r={R - 30} fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* 中層 — 逆回転 */}
      <g className="magic-circle-inner" filter={`url(#${redGlowId})`}>
        {/* 赤ライン円 */}
        <circle cx={cx} cy={cx} r={R - 44} fill="none" stroke="#cc1a1a" strokeWidth="1.5" opacity="0.9" />
        <circle cx={cx} cy={cx} r={R - 50} fill="none" stroke="#cc1a1a" strokeWidth="0.5" opacity="0.4" />

        {/* 赤スター（五芒星） */}
        <polygon points={star(5, R - 44, R * 0.38)} fill="none" stroke="#cc1a1a" strokeWidth="1.2" opacity="0.85" />

        {/* 五角形（反転） */}
        <polygon points={poly(5, R - 50, 36)} fill="none" stroke="#cc1a1a" strokeWidth="0.6" opacity="0.45" />

        {/* 内側アーク分割（12分割） */}
        <path d={arcDashes(R - 46, 12, 8)} fill="none" stroke="#cc1a1a" strokeWidth="1.5" opacity="0.5" />

        {/* 細かい目盛り */}
        <path d={tickMarks(60, R - 52, 5)} stroke="#cc1a1a" strokeWidth="0.5" opacity="0.4" />
      </g>

      {/* 最内層 — ゆっくり順回転（別速度） */}
      <g style={{ transformOrigin: `${cx}px ${cx}px`, animation: "rotate-slow 35s linear infinite reverse" }}>
        <circle cx={cx} cy={cx} r={R * 0.28} fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
        <polygon points={poly(3, R * 0.24, 0)} fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
        <polygon points={poly(3, R * 0.24, 180)} fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
        {/* 六芒星ミニ */}
        <polygon points={poly(6, R * 0.18)} fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
      </g>

      {/* 中心コア */}
      <circle cx={cx} cy={cx} r="5" fill={color} opacity="0.9" filter={`url(#${glowId})`} />
      <circle cx={cx} cy={cx} r="2.5" fill="#ffffff" opacity="0.8" />

      {/* コーナー装飾ダイヤ（四隅のルーン的アクセント） */}
      {[0, 90, 180, 270].map((deg) => {
        const a = (deg - 90) * (Math.PI / 180);
        const rx = cx + (R - 24) * Math.cos(a);
        const ry = cx + (R - 24) * Math.sin(a);
        return (
          <g key={deg} transform={`rotate(${deg} ${cx} ${cx})`}>
            <circle cx={rx} cy={ry} r="3.5" fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
            <circle cx={rx} cy={ry} r="1.5" fill={color} opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}
