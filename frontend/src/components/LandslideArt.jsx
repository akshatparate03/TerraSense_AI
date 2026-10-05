import React from "react";

/**
 * Original, decorative landslide illustrations (inline SVG, no image files to
 * host). Use <LandslideArt variant="slope" className="w-64" /> anywhere; size
 * it with Tailwind width classes. Variants: slope | mudflow | rockfall | cracked
 * To use real photos instead, swap a variant for an <img src="..."> tag.
 */
const SKY = ["#0b2a3a", "#164e63"];

function Defs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SKY[0]} />
        <stop offset="1" stopColor={SKY[1]} />
      </linearGradient>
      <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4d7c3a" />
        <stop offset="1" stopColor="#2f5a2a" />
      </linearGradient>
      <linearGradient id={`${id}-earth`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a16207" />
        <stop offset="1" stopColor="#6b4423" />
      </linearGradient>
    </defs>
  );
}

function Pine({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="0" width="3" height="9" fill="#4a3320" />
      <polygon points="0,-22 -9,0 9,0" fill="#1f5130" />
      <polygon points="0,-30 -7,-12 7,-12" fill="#2a6a3d" />
    </g>
  );
}

function Rock({ x, y, r = 5, c = "#78716c" }) {
  return <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill={c} stroke="#44403c" strokeWidth="0.8" />;
}

function Slope({ id }) {
  return (
    <>
      <rect width="320" height="200" fill={`url(#${id}-sky)`} />
      <circle cx="262" cy="40" r="14" fill="#fde68a" opacity="0.85" />
      <path d="M0 200 V120 Q70 60 150 70 Q230 80 320 40 V200 Z" fill={`url(#${id}-hill)`} />
      {/* scar where the slope slid */}
      <path d="M120 74 Q150 100 140 140 Q175 170 200 200 H120 Q95 150 112 110 Z" fill={`url(#${id}-earth)`} />
      <path d="M135 120 Q165 150 190 196 H150 Q140 160 135 120Z" fill="#8b5e34" opacity="0.7" />
      <Pine x={40} y={118} s={1.1} /><Pine x={64} y={128} /><Pine x={250} y={96} s={1.2} /><Pine x={280} y={84} />
      <Rock x={165} y={186} r={6} /><Rock x={185} y={192} r={4} /><Rock x={130} y={190} r={5} />
    </>
  );
}

function Mudflow({ id }) {
  return (
    <>
      <rect width="320" height="200" fill={`url(#${id}-sky)`} />
      {/* rain */}
      {Array.from({ length: 26 }).map((_, i) => (
        <line key={i} x1={i * 13 + 5} y1={(i * 17) % 60} x2={i * 13 - 2} y2={((i * 17) % 60) + 14} stroke="#93c5fd" strokeWidth="1" opacity="0.5" />
      ))}
      <path d="M0 200 V100 Q80 50 170 80 Q250 100 320 60 V200 Z" fill={`url(#${id}-hill)`} />
      <path d="M150 78 Q175 110 160 150 Q190 175 230 200 H120 Q135 150 130 110 Z" fill="#7c4a21" />
      <path d="M0 200 Q100 170 200 188 T320 180 V200 Z" fill="#8b5a2b" opacity="0.85" />
      {/* buried house */}
      <g transform="translate(230 150)">
        <rect x="0" y="10" width="34" height="22" fill="#d6d3d1" />
        <polygon points="-4,10 17,-6 38,10" fill="#9a3412" />
        <rect x="12" y="18" width="9" height="14" fill="#44403c" />
      </g>
      <path d="M215 178 Q240 165 270 180 L270 200 H215 Z" fill="#7c4a21" opacity="0.9" />
      <Pine x={36} y={110} s={1.2} /><Pine x={290} y={92} />
    </>
  );
}

function Rockfall({ id }) {
  return (
    <>
      <rect width="320" height="200" fill={`url(#${id}-sky)`} />
      <polygon points="0,200 0,30 90,20 120,70 100,110 140,150 130,200" fill="#57534e" />
      <polygon points="0,200 0,30 40,28 60,90 30,140 70,200" fill="#44403c" />
      <polygon points="320,200 320,90 250,110 210,160 230,200" fill="#6b6560" />
      <path d="M120 200 Q220 150 320 190 V200 Z" fill="#7c6f64" />
      {/* falling rocks with motion trails */}
      {[[130, 60, 7], [150, 100, 9], [172, 140, 6], [160, 170, 10], [196, 182, 7], [115, 120, 5]].map(([x, y, r], i) => (
        <g key={i}>
          <line x1={x - 14} y1={y - 22} x2={x - 3} y2={y - 4} stroke="#a8a29e" strokeWidth="1.2" opacity="0.5" strokeDasharray="3 3" />
          <Rock x={x} y={y} r={r} c={i % 2 ? "#78716c" : "#8a8179"} />
        </g>
      ))}
      <rect x="215" y="150" width="70" height="4" fill="#292524" opacity="0.8" />
      <rect x="230" y="136" width="26" height="14" rx="3" fill="#b45309" />
      <circle cx="238" cy="152" r="3" fill="#1c1917" /><circle cx="250" cy="152" r="3" fill="#1c1917" />
    </>
  );
}

function Cracked({ id }) {
  return (
    <>
      <rect width="320" height="200" fill={`url(#${id}-sky)`} />
      <path d="M0 200 V110 Q100 70 200 90 Q270 100 320 70 V200 Z" fill={`url(#${id}-hill)`} />
      {/* crack lines across the slope */}
      <path d="M70 112 L100 102 L128 112 L160 98 L190 108" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinejoin="round" />
      <path d="M85 135 L118 124 L150 136 L176 124" fill="none" stroke="#292524" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M100 160 L130 150 L162 160" fill="none" stroke="#292524" strokeWidth="1.8" strokeLinejoin="round" />
      {/* tilted houses */}
      <g transform="translate(210 100) rotate(8)">
        <rect x="0" y="14" width="30" height="20" fill="#e7e5e4" />
        <polygon points="-4,14 15,0 34,14" fill="#7f1d1d" />
      </g>
      <g transform="translate(250 92) rotate(5)">
        <rect x="0" y="12" width="24" height="16" fill="#d6d3d1" />
        <polygon points="-3,12 12,0 27,12" fill="#9a3412" />
      </g>
      <Pine x={34} y={120} s={1.1} /><Pine x={56} y={128} />
      <Pine x={292} y={92} />
    </>
  );
}

const SCENES = { slope: Slope, mudflow: Mudflow, rockfall: Rockfall, cracked: Cracked };
const TITLES = {
  slope: "Hillside slope failure",
  mudflow: "Rain-triggered mudflow",
  rockfall: "Rockfall on a mountain road",
  cracked: "Cracked, unstable slope above homes",
};

export default function LandslideArt({ variant = "slope", className = "", rounded = true }) {
  const Scene = SCENES[variant] || Slope;
  const id = `ls-${variant}`;
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label={TITLES[variant]}
      className={`block h-auto ${rounded ? "rounded-2xl" : ""} ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs id={id} />
      <Scene id={id} />
    </svg>
  );
}
