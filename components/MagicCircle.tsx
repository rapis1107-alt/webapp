"use client";

export default function MagicCircle({ size = 280, color = "#6b21a8" }: { size?: number; color?: string }) {
  const cx = size / 2;
  const R = size / 2;

  // radii
  const rOuter   = R * 0.90;
  const rRune1   = R * 0.80;
  const rRune1in = R * 0.72;
  const rMid     = R * 0.70;
  const rRune2   = R * 0.62;
  const rRune2in = R * 0.55;
  const rInner   = R * 0.53;
  const rCore    = R * 0.32;

  const red   = "#cc1a1a";
  const white = "#e8d8ff";

  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;

  // spike diamond at cardinal point
  const spike = (deg: number, tipR: number, baseR: number, w: number) => {
    const a = toRad(deg);
    const pa = a + Math.PI / 2;
    const tx = cx + tipR * Math.cos(a);
    const ty = cx + tipR * Math.sin(a);
    const bx = cx + baseR * Math.cos(a);
    const by = cx + baseR * Math.sin(a);
    const mx = cx + (baseR - w * 3) * Math.cos(a);
    const my = cx + (baseR - w * 3) * Math.sin(a);
    const lx = bx + w * Math.cos(pa); const ly = by + w * Math.sin(pa);
    const rx = bx - w * Math.cos(pa); const ry = by - w * Math.sin(pa);
    // small secondary wings
    const wx = cx + (baseR + w * 0.5) * Math.cos(a);
    const wy = cx + (baseR + w * 0.5) * Math.sin(a);
    const wl = wx + w * 0.5 * Math.cos(pa); const wly = wy + w * 0.5 * Math.sin(pa);
    const wr = wx - w * 0.5 * Math.cos(pa); const wry = wy - w * 0.5 * Math.sin(pa);
    return `M${tx},${ty} L${lx},${ly} L${mx},${my} L${rx},${ry} Z
            M${wl},${wly} L${wx},${wy-w*1.5} L${wr},${wry} Z`;
  };

  // 8-pointed star polygon
  const star8pts = (scx: number, scy: number, r1: number, r2: number, offset = 0) =>
    Array.from({ length: 16 }, (_, i) => {
      const a = toRad(i * 22.5 + offset);
      const r = i % 2 === 0 ? r1 : r2;
      return `${scx + r * Math.cos(a)},${scy + r * Math.sin(a)}`;
    }).join(" ");

  // 4-pointed compass star
  const star4pts = (scx: number, scy: number, r1: number, r2: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = toRad(i * 45);
      const r = i % 2 === 0 ? r1 : r2;
      return `${scx + r * Math.cos(a)},${scy + r * Math.sin(a)}`;
    }).join(" ");

  // arc dash segments
  const arcDashes = (r: number, n: number, gap = 5) =>
    Array.from({ length: n }, (_, i) => {
      const s = toRad((i * 360) / n);
      const e = toRad((i * 360) / n + 360 / n - gap);
      return `M${cx + r * Math.cos(s)},${cx + r * Math.sin(s)} A${r},${r} 0 0,1 ${cx + r * Math.cos(e)},${cx + r * Math.sin(e)}`;
    }).join(" ");

  // rune tick band
  const runeBand = (r: number, count: number, h: number) =>
    Array.from({ length: count }, (_, i) => {
      const a = toRad((i * 360) / count);
      const tall = i % 5 === 0;
      const th = tall ? h * 2 : h;
      return `M${cx + (r - th / 2) * Math.cos(a)},${cx + (r - th / 2) * Math.sin(a)} L${cx + (r + th / 2) * Math.cos(a)},${cx + (r + th / 2) * Math.sin(a)}`;
    }).join(" ");

  // satellite circles at ordinal (45°×4)
  const ordinals = [45, 135, 225, 315];
  const satR = R * 0.11;

  const gId = `glow-${Math.round(size)}`;
  const gId2 = `glow2-${Math.round(size)}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id={gId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b1" />
          <feGaussianBlur stdDeviation="9" result="b2" />
          <feMerge>
            <feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={gId2} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── 外周レイヤー（順回転） ── */}
      <g className="magic-circle" filter={`url(#${gId})`}>
        {/* 4 cardinal spikes */}
        {[0, 90, 180, 270].map(deg => (
          <path key={deg}
            d={spike(deg, R * 0.99, rOuter, R * 0.028)}
            fill={white} stroke={color} strokeWidth="0.6" opacity="0.95" />
        ))}

        {/* 外周二重リング */}
        <circle cx={cx} cy={cx} r={rOuter} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={cx} cy={cx} r={rOuter - R * 0.012} fill="none" stroke={white} strokeWidth="0.4" opacity="0.5" />

        {/* 外周アーク分割 */}
        <path d={arcDashes(rOuter - R * 0.006, 32, 4)} fill="none" stroke={color} strokeWidth="2.5" opacity="0.3" />

        {/* ルーン文字帯 1 */}
        <circle cx={cx} cy={cx} r={rRune1} fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />
        <path d={runeBand((rRune1 + rRune1in) / 2, 160, R * 0.022)} stroke={color} strokeWidth="0.7" opacity="0.55" />
        <circle cx={cx} cy={cx} r={rRune1in} fill="none" stroke={color} strokeWidth="0.8" opacity="0.6" />

        {/* 衛星円 × 4（斜め45°） */}
        {ordinals.map(deg => {
          const a = toRad(deg);
          const sx = cx + rOuter * Math.cos(a);
          const sy = cx + rOuter * Math.sin(a);
          return (
            <g key={deg}>
              <circle cx={sx} cy={sy} r={satR} fill="#0a0008" stroke={color} strokeWidth="1.4" />
              <circle cx={sx} cy={sy} r={satR * 0.7} fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
              <polygon points={star8pts(sx, sy, satR * 0.62, satR * 0.32)}
                fill="none" stroke={white} strokeWidth="0.9" opacity="0.9" />
              <circle cx={sx} cy={sy} r={satR * 0.14} fill={white} opacity="0.9" />
            </g>
          );
        })}

        {/* 中間リング */}
        <circle cx={cx} cy={cx} r={rMid} fill="none" stroke={color} strokeWidth="1.2" opacity="0.8" />
      </g>

      {/* ── 内周レイヤー（逆回転） ── */}
      <g className="magic-circle-inner" filter={`url(#${gId})`}>
        {/* ルーン文字帯 2（赤） */}
        <circle cx={cx} cy={cx} r={rRune2} fill="none" stroke={red} strokeWidth="0.8" opacity="0.7" />
        <path d={runeBand((rRune2 + rRune2in) / 2, 120, R * 0.020)} stroke={red} strokeWidth="0.7" opacity="0.5" />
        <circle cx={cx} cy={cx} r={rRune2in} fill="none" stroke={red} strokeWidth="0.8" opacity="0.7" />

        {/* 内周リング */}
        <circle cx={cx} cy={cx} r={rInner} fill="none" stroke={red} strokeWidth="1.5" />
        <circle cx={cx} cy={cx} r={rInner - R * 0.015} fill="none" stroke={red} strokeWidth="0.4" opacity="0.4" />

        {/* 内部ジオメトリ：8芒星 */}
        <polygon points={star8pts(cx, cx, rInner * 0.88, rInner * 0.50)}
          fill="none" stroke={red} strokeWidth="1.2" opacity="0.85" />
        <polygon points={star8pts(cx, cx, rInner * 0.75, rInner * 0.42, 22.5)}
          fill="none" stroke={color} strokeWidth="0.7" opacity="0.55" />

        {/* 四方向スパイク（内側） */}
        {[0, 90, 180, 270].map(deg => {
          const a = toRad(deg);
          const px = cx + rInner * Math.cos(a);
          const py = cx + rInner * Math.sin(a);
          const pa = a + Math.PI / 2;
          return (
            <path key={deg}
              d={`M${px},${py} L${cx + R * 0.035 * Math.cos(pa)},${cx + R * 0.035 * Math.sin(pa)} L${cx + rInner * 0.55 * Math.cos(a)},${cx + rInner * 0.55 * Math.sin(a)} L${cx - R * 0.035 * Math.cos(pa)},${cx - R * 0.035 * Math.sin(pa)} Z`}
              fill={red} stroke={white} strokeWidth="0.4" opacity="0.75" />
          );
        })}
      </g>

      {/* ── コアレイヤー（独立ゆっくり逆回転） ── */}
      <g style={{ transformOrigin: `${cx}px ${cx}px`, animation: "rotate-slow 50s linear infinite reverse" }}
        filter={`url(#${gId2})`}>
        <circle cx={cx} cy={cx} r={rCore} fill="none" stroke={color} strokeWidth="1" opacity="0.8" />
        {/* 4芒星コンパス */}
        <polygon points={star4pts(cx, cx, rCore * 0.95, rCore * 0.35)}
          fill="none" stroke={white} strokeWidth="1.2" opacity="0.9" />
        {/* 斜め4芒星 */}
        <polygon points={star4pts(cx, cx, rCore * 0.7, rCore * 0.28)}
          fill="none" stroke={color} strokeWidth="0.8" opacity="0.7"
          transform={`rotate(45 ${cx} ${cx})`} />
        {/* 中心円 */}
        <circle cx={cx} cy={cx} r={rCore * 0.25} fill={color} opacity="0.9" />
      </g>

      {/* 中心輝点 */}
      <circle cx={cx} cy={cx} r={R * 0.045} fill={color} filter={`url(#${gId2})`} opacity="1" />
      <circle cx={cx} cy={cx} r={R * 0.022} fill={white} opacity="1" />
    </svg>
  );
}
