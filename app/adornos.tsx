// Adornos navideños dibujados en SVG: no dependen de imágenes externas.

const BOMBILLOS: [number, number, string][] = [
  [20, 31, '#E5463B'],
  [62, 38, '#F2C14E'],
  [104, 27, '#FFFDF8'],
  [146, 18, '#E5463B'],
  [195, 29, '#F2C14E'],
  [244, 40, '#FFFDF8'],
  [286, 31, '#E5463B'],
  [328, 18, '#F2C14E'],
  [370, 17, '#FFFDF8'],
];

export function Luces() {
  return (
    <svg className="luces" viewBox="0 0 390 64" aria-hidden="true">
      <path
        d="M0 14 Q 48 44 97 22 T 195 22 T 292 22 T 390 14"
        fill="none"
        stroke="#06241B"
        strokeWidth="2"
      />
      {BOMBILLOS.map(([x, y, color]) => (
        <ellipse key={x} cx={x} cy={y} rx="5" ry="7" fill={color} />
      ))}
    </svg>
  );
}

const COPOS: [number, number, number, number][] = [
  [8, 0, 3, 0.5],
  [22, 0, 2, 0.6],
  [37, 0, 3, 0.35],
  [51, 0, 2, 0.5],
  [66, 0, 2, 0.4],
  [79, 0, 3, 0.3],
  [92, 0, 2, 0.55],
];

export function Nieve() {
  return (
    <svg className="nieve" aria-hidden="true">
      {COPOS.map(([x, y, r, o]) => (
        <circle key={x} cx={`${x}%`} cy={y} r={r} fill="#FFFFFF" opacity={o} />
      ))}
    </svg>
  );
}

export function Regalo({ lado = 112 }: { lado?: number }) {
  return (
    <svg className="regalo" width={lado} height={lado} viewBox="0 0 112 112" aria-hidden="true">
      <rect x="18" y="48" width="76" height="52" rx="6" fill="#C5302A" />
      <rect x="12" y="34" width="88" height="20" rx="5" fill="#E5463B" />
      <rect x="49" y="34" width="14" height="66" fill="#F2C14E" />
      <path d="M56 34 C 40 10 22 18 30 30 C 36 38 50 36 56 34 Z" fill="#F2C14E" />
      <path d="M56 34 C 72 10 90 18 82 30 C 76 38 62 36 56 34 Z" fill="#F2C14E" />
    </svg>
  );
}

export function IconoX() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 5 L15 15 M15 5 L5 15" />
    </svg>
  );
}

export function IconoMas() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M9 3 V15 M3 9 H15" />
    </svg>
  );
}
