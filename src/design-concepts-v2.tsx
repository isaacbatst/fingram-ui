import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════
// DUNA BRAND BOOK V2 — Editorial Gallery
// ═══════════════════════════════════════════════════════════

// ── TYPES ──

interface ProposalTheme {
  id: string;
  name: string;
  subtitle: string;
  philosophy: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  cardBg: string;
  text: string;
  textSec: string;
  textMut: string;
  accent: string;
  accentAlt: string;
  success: string;
  info: string;
  subtle: string;
  danger: string;
  fontBody: string;
  fontMono: string;
  fontDisplay: string;
  logoCase: string;
  radius: number;
  tagline: string;
  ctaBg: string;
  ctaColor: string;
}

// ── PROPOSALS ──

const P1: ProposalTheme = {
  id: "estratos", name: "Estratos", subtitle: "O tempo como profundidade",
  philosophy: "A duna não é superfície — é acúmulo de camadas. Cada mês é um estrato geológico. O tempo não passa, ele se deposita. A identidade visual trata o patrimônio como geologia: camadas visíveis, sedimentadas, permanentes.",
  bg: "#08090c", surface: "rgba(217,175,120,0.04)", surfaceHover: "rgba(217,175,120,0.08)",
  border: "rgba(217,175,120,0.08)", cardBg: "rgba(217,175,120,0.03)",
  text: "#f0e8dc", textSec: "rgba(240,232,220,0.55)", textMut: "rgba(240,232,220,0.25)",
  accent: "#d9af78", accentAlt: "#a67c4a", success: "#7bad6e", info: "#6a9fba",
  subtle: "#8e7b6a", danger: "#c45c4a",
  fontBody: "'Libre Franklin', sans-serif", fontMono: "'JetBrains Mono', monospace",
  fontDisplay: "'Playfair Display', serif", logoCase: "capitalize", radius: 12,
  tagline: "Camada por camada.", ctaBg: "#d9af78", ctaColor: "#08090c",
};

const P2: ProposalTheme = {
  id: "litoral", name: "Litoral", subtitle: "O amanhecer na costa potiguar",
  philosophy: "Natal ao amanhecer: areia quente, oceano calmo, luz dourada. O app financeiro que não intimida — acolhe. Tipografia serifada, cores terrosas, espaço generoso. Finanças como algo natural, não técnico. A duna como paisagem de pertencimento.",
  bg: "#faf5ee", surface: "rgba(160,120,70,0.05)", surfaceHover: "rgba(160,120,70,0.09)",
  border: "rgba(160,120,70,0.10)", cardBg: "rgba(160,120,70,0.04)",
  text: "#2a1f14", textSec: "#7d664a", textMut: "#b8a48c",
  accent: "#c17826", accentAlt: "#8f5510", success: "#2a7a52", info: "#2563a8",
  subtle: "#a89278", danger: "#b83d2e",
  fontBody: "'Source Serif 4', serif", fontMono: "'IBM Plex Mono', monospace",
  fontDisplay: "'Fraunces', serif", logoCase: "lowercase", radius: 16,
  tagline: "Construa no tempo.", ctaBg: "#2a1f14", ctaColor: "#faf5ee",
};

const P3: ProposalTheme = {
  id: "cartografia", name: "Cartografia", subtitle: "Mapeando o terreno financeiro",
  philosophy: "Um plano financeiro é um mapa topográfico: curvas de nível mostrando onde subir e onde é plano. A duna como terreno a ser mapeado e navegado. Linhas finas, precisão cartográfica, estética de atlas. O app como instrumento de navegação, não de registro.",
  bg: "#0c0f14", surface: "rgba(100,180,160,0.04)", surfaceHover: "rgba(100,180,160,0.08)",
  border: "rgba(100,180,160,0.08)", cardBg: "rgba(100,180,160,0.03)",
  text: "#dce8e4", textSec: "rgba(220,232,228,0.50)", textMut: "rgba(220,232,228,0.25)",
  accent: "#3dbfa0", accentAlt: "#28a085", success: "#3dbfa0", info: "#5b8fd9",
  subtle: "#5a7a70", danger: "#e06050",
  fontBody: "'DM Sans', sans-serif", fontMono: "'Fira Code', monospace",
  fontDisplay: "'Space Grotesk', sans-serif", logoCase: "uppercase", radius: 6,
  tagline: "Seu terreno, mapeado.", ctaBg: "#3dbfa0", ctaColor: "#0c0f14",
};

const P4: ProposalTheme = {
  id: "noturna", name: "Noturna", subtitle: "As dunas sob o céu de Natal",
  philosophy: "As dunas de Genipabu à noite: silhuetas suaves contra um céu estrelado. O horizonte longo como metáfora de longo prazo. Azul profundo, prata lunar, pontos de luz como marcos no caminho. Elegância silenciosa. O app como contemplação do horizonte — calmo, profundo, vasto.",
  bg: "#070b14", surface: "rgba(140,160,220,0.04)", surfaceHover: "rgba(140,160,220,0.08)",
  border: "rgba(140,160,220,0.07)", cardBg: "rgba(140,160,220,0.03)",
  text: "#d8dff0", textSec: "rgba(216,223,240,0.50)", textMut: "rgba(216,223,240,0.25)",
  accent: "#a0b8e8", accentAlt: "#7090d0", success: "#68c0a0", info: "#a0b8e8",
  subtle: "#5a6888", danger: "#d87070",
  fontBody: "'Nunito Sans', sans-serif", fontMono: "'JetBrains Mono', monospace",
  fontDisplay: "'Cormorant Garamond', serif", logoCase: "lowercase", radius: 14,
  tagline: "Olhe longe.", ctaBg: "#a0b8e8", ctaColor: "#070b14",
};

const P5: ProposalTheme = {
  id: "aresta", name: "Aresta", subtitle: "A duna como geometria pura",
  philosophy: "A crista da duna é uma aresta perfeita: a linha mais afiada da natureza. Reduzir tudo ao essencial. Preto absoluto, um único acento em laranja-fogo. Tipografia pesada, sem decoração. O app como ferramenta, não como experiência. Brutalista, direto, sem concessões estéticas.",
  bg: "#0a0a0a", surface: "rgba(255,255,255,0.03)", surfaceHover: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.07)", cardBg: "rgba(255,255,255,0.025)",
  text: "#f0f0f0", textSec: "rgba(240,240,240,0.50)", textMut: "rgba(240,240,240,0.22)",
  accent: "#ff6b2b", accentAlt: "#cc4a10", success: "#40d080", info: "#60a0f0",
  subtle: "#666", danger: "#ff4444",
  fontBody: "'Inter Tight', sans-serif", fontMono: "'Space Mono', monospace",
  fontDisplay: "'Inter Tight', sans-serif", logoCase: "uppercase", radius: 2,
  tagline: "Grão a grão.", ctaBg: "#ff6b2b", ctaColor: "#0a0a0a",
};

const ALL: ProposalTheme[] = [P1, P2, P3, P4, P5];

// ── CSS ANIMATIONS ──

const GALLERY_STYLES = `
  @keyframes dv2-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dv2-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes dv2-scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes dv2-slideRight {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes dv2-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes dv2-glow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes dv2-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes dv2-numberSlide {
    from { opacity: 0; transform: translateY(-40px) scale(0.8); }
    to { opacity: 0.04; transform: translateY(0) scale(1); }
  }

  .dv2-stagger-1 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.1s; }
  .dv2-stagger-2 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.2s; }
  .dv2-stagger-3 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.35s; }
  .dv2-stagger-4 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.5s; }
  .dv2-stagger-5 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.65s; }
  .dv2-stagger-6 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.8s; }
  .dv2-stagger-7 { animation: dv2-fadeUp 0.6s ease both; animation-delay: 0.95s; }

  .dv2-card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .dv2-card-hover:hover {
    transform: translateY(-2px);
  }

  .dv2-nav-dot {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dv2-nav-dot:hover {
    transform: scale(1.3);
  }

  .dv2-phone-float {
    animation: dv2-float 6s ease-in-out infinite;
  }

  .dv2-swatch {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    cursor: default;
  }
  .dv2-swatch:hover {
    transform: scale(1.15) translateY(-2px);
  }
`;

// ── LOGOS (same SVGs as v1) ──

function LogoEstratos({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="v2-le1" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stopColor="#8a6035" />
          <stop offset="100%" stopColor="#d9af78" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0e1015" />
      <path d="M8 48 Q18 36 32 40 Q46 44 56 35" stroke="#d9af78" strokeWidth="1.8" fill="none" opacity="0.2" />
      <path d="M8 48 Q18 36 32 40 Q46 44 56 35 L56 50 Q46 48 32 50 Q18 52 8 48 Z" fill="#d9af78" opacity="0.06" />
      <path d="M8 42 Q20 28 34 34 Q48 40 56 28" stroke="#d9af78" strokeWidth="1.8" fill="none" opacity="0.4" />
      <path d="M8 42 Q20 28 34 34 Q48 40 56 28 L56 35 Q46 44 32 40 Q18 36 8 48 Z" fill="#d9af78" opacity="0.08" />
      <path d="M8 36 Q22 20 36 28 Q50 36 56 22" stroke="url(#v2-le1)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M8 36 Q22 20 36 28 Q50 36 56 22 L56 28 Q48 40 34 34 Q20 28 8 42 Z" fill="#d9af78" opacity="0.1" />
      <circle cx="56" cy="22" r="2" fill="#d9af78" opacity="0.6" />
    </svg>
  );
}

function LogoLitoral({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="v2-ll1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c17826" /><stop offset="100%" stopColor="#8f5510" />
        </linearGradient>
        <linearGradient id="v2-ll2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563a8" /><stop offset="100%" stopColor="#1a4a80" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#2a1f14" />
      <path d="M6 38 Q14 32 22 36 Q30 40 38 34 Q46 28 56 32" stroke="url(#v2-ll2)" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M6 44 C16 26 28 22 34 30 C40 38 48 24 58 20" stroke="url(#v2-ll1)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M6 44 C16 26 28 22 34 30 C40 38 48 24 58 20 L58 48 C48 46 36 50 24 48 C16 46 10 47 6 44 Z" fill="#c17826" opacity="0.12" />
      <circle cx="52" cy="16" r="5" fill="#c17826" opacity="0.25" />
      <circle cx="52" cy="16" r="3" fill="#c17826" opacity="0.4" />
    </svg>
  );
}

function LogoCartografia({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="6" fill="#0c0f14" stroke="#3dbfa0" strokeWidth="0.5" />
      <path d="M10 48 Q22 42 32 44 Q42 46 54 40" stroke="#3dbfa0" strokeWidth="0.7" fill="none" opacity="0.15" />
      <path d="M10 44 Q24 36 32 39 Q42 42 54 34" stroke="#3dbfa0" strokeWidth="0.7" fill="none" opacity="0.2" />
      <path d="M12 40 Q24 30 34 34 Q44 38 54 28" stroke="#3dbfa0" strokeWidth="0.9" fill="none" opacity="0.3" />
      <path d="M14 36 Q26 24 36 30 Q44 34 54 22" stroke="#3dbfa0" strokeWidth="1.0" fill="none" opacity="0.45" />
      <path d="M16 32 Q28 18 38 26 Q46 30 54 16" stroke="#3dbfa0" strokeWidth="1.3" fill="none" opacity="0.65" />
      <path d="M20 28 Q30 14 40 22 Q48 26 54 12" stroke="#3dbfa0" strokeWidth="1.6" fill="none" opacity="0.85" strokeLinecap="round" />
      <line x1="54" y1="12" x2="54" y2="8" stroke="#3dbfa0" strokeWidth="1.2" />
      <circle cx="54" cy="7" r="1.5" fill="none" stroke="#3dbfa0" strokeWidth="1" />
      {[16, 28, 40, 52].map((x) =>
        [16, 28, 40, 52].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" fill="#3dbfa0" opacity="0.12" />
        ))
      )}
    </svg>
  );
}

function LogoNoturna({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="v2-ln1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1428" /><stop offset="100%" stopColor="#070b14" />
        </linearGradient>
        <linearGradient id="v2-ln2" x1="0" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#5a6888" /><stop offset="100%" stopColor="#c0cce8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#v2-ln1)" />
      {([[14,12],[28,8],[44,14],[52,10],[20,18],[38,6],[8,20],[50,22]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%3===0?1.2:0.7} fill="#a0b8e8" opacity={0.2+i*0.06} />
      ))}
      <circle cx="48" cy="12" r="4" fill="#a0b8e8" opacity="0.08" />
      <circle cx="50" cy="11" r="3.5" fill="#0d1428" />
      <path d="M0 52 C8 42 16 34 26 38 C36 42 42 30 52 26 C58 24 64 28 64 28 L64 52 Z" fill="#a0b8e8" opacity="0.06" />
      <path d="M0 52 C8 42 16 34 26 38 C36 42 42 30 52 26 C58 24 64 28 64 28" stroke="url(#v2-ln2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="37" r="1" fill="#a0b8e8" opacity="0.15" />
      <circle cx="52" cy="26" r="1.2" fill="#a0b8e8" opacity="0.25" />
    </svg>
  );
}

function LogoAresta({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="2" fill="#0a0a0a" />
      <polygon points="8,48 32,16 40,28 56,12 56,48" fill="#ff6b2b" opacity="0.08" />
      <polyline points="8,48 32,16 40,28 56,12" stroke="#ff6b2b" strokeWidth="3" fill="none" strokeLinejoin="bevel" strokeLinecap="square" />
      <line x1="8" y1="48" x2="56" y2="48" stroke="#ff6b2b" strokeWidth="1" opacity="0.3" />
      <rect x="54" y="10" width="4" height="4" fill="#ff6b2b" opacity="0.8" />
    </svg>
  );
}

const LOGOS: Record<string, React.FC<{ size?: number }>> = {
  estratos: LogoEstratos, litoral: LogoLitoral, cartografia: LogoCartografia,
  noturna: LogoNoturna, aresta: LogoAresta,
};

// ── GRAIN OVERLAY ──

function GrainOverlay({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, opacity, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <filter id="dv2-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dv2-grain)" />
      </svg>
    </div>
  );
}

// ── ACCENT GLOW ──

function AccentGlow({ color, size = 300 }: { color: string; size?: number }) {
  return (
    <div style={{
      position: "absolute", width: size, height: size,
      borderRadius: "50%", background: color, opacity: 0.04,
      filter: `blur(${size * 0.4}px)`, pointerEvents: "none",
      top: "10%", right: "5%",
      animation: "dv2-glow 4s ease-in-out infinite",
    }} />
  );
}

// ── LOGO WITH NAME ──

function Logo({ p, height = 32 }: { p: ProposalTheme; height?: number }) {
  const s = height / 32;
  const LogoSVG = LOGOS[p.id];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 * s }}>
      <LogoSVG size={height} />
      <span style={{
        fontFamily: p.fontDisplay, fontSize: 22 * s, fontWeight: p.id === "aresta" ? 800 : 600,
        color: p.text, letterSpacing: p.id === "aresta" ? 4 * s : p.id === "cartografia" ? 3 * s : -0.3 * s,
        textTransform: p.logoCase as React.CSSProperties["textTransform"],
      }}>
        duna
      </span>
    </div>
  );
}

// ── FLOATING NAVIGATION ──

function FloatingNav({ proposals, current, onSelect }: {
  proposals: ProposalTheme[]; current: number; onSelect: (i: number) => void;
}) {
  return (
    <div style={{
      position: "fixed", right: 28, top: "50%", transform: "translateY(-50%)",
      zIndex: 200, display: "flex", flexDirection: "column", gap: 16,
      animation: "dv2-fadeIn 1s ease 0.5s both",
    }}>
      {proposals.map((pr, i) => (
        <button
          key={pr.id}
          className="dv2-nav-dot"
          onClick={() => onSelect(i)}
          title={pr.name}
          style={{
            width: i === current ? 28 : 10,
            height: 10,
            borderRadius: 5,
            border: "none",
            background: i === current ? pr.accent : `${proposals[current].textMut}`,
            cursor: "pointer",
            padding: 0,
            opacity: i === current ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

// ── FUND CARD (enhanced) ──

function FundCard({ p, label, value, pct, color, done }: {
  p: ProposalTheme; label: string; value: string; pct: number; color: string; done: boolean;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: "12px 12px 10px",
      background: done ? `${color}08` : p.cardBg,
      borderRadius: p.radius * 0.65,
      border: `1px solid ${done ? color + "30" : p.border}`,
    }}>
      <div style={{
        fontSize: 8, color: p.textMut, textTransform: "uppercase",
        letterSpacing: 1.5, fontFamily: p.fontBody, fontWeight: 600, marginBottom: 4,
      }}>
        {label} {done && <span style={{ color, fontSize: 9 }}>&#10003;</span>}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: p.text,
        fontFamily: p.fontMono, letterSpacing: -0.3,
      }}>{value}</div>
      <div style={{
        height: 3, background: p.border, borderRadius: 2, marginTop: 7, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color, borderRadius: 2,
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  );
}

// ── PHONE MOCKUP (enhanced with perspective) ──

function PhoneMockup({ p }: { p: ProposalTheme }) {
  const isLight = p.id === "litoral";
  return (
    <div className="dv2-phone-float" style={{ perspective: 1200 }}>
      <div style={{
        width: 300, background: p.bg, borderRadius: 32,
        border: `2px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        overflow: "hidden", position: "relative",
        boxShadow: isLight
          ? "0 24px 80px rgba(80,60,30,0.15), 0 8px 20px rgba(80,60,30,0.08)"
          : "0 24px 80px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.3)",
        transform: "rotateY(-3deg) rotateX(1deg)",
        transition: "all 0.5s ease",
      }}>
        {/* Dynamic Island */}
        <div style={{
          display: "flex", justifyContent: "center", padding: "8px 0 2px",
        }}>
          <div style={{
            width: 90, height: 22, borderRadius: 11,
            background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)",
          }} />
        </div>

        {/* Status bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", padding: "4px 22px 4px",
          fontSize: 11, fontWeight: 600, color: p.textSec, fontFamily: p.fontBody,
        }}>
          <span>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill={p.textMut} />
              <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill={p.textMut} />
              <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill={p.textMut} />
              <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill={p.textMut} opacity="0.3" />
            </svg>
            <div style={{
              width: 20, height: 9, border: `1.2px solid ${p.textMut}`,
              borderRadius: 2.5, position: "relative",
            }}>
              <div style={{ position: "absolute", inset: 1.5, borderRadius: 1, background: p.success, width: "65%" }} />
              <div style={{
                position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)",
                width: 1.5, height: 4, borderRadius: "0 1px 1px 0", background: p.textMut,
              }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "6px 16px",
        }}>
          <Logo p={p} height={22} />
          <div style={{
            width: 28, height: 28, borderRadius: p.radius * 0.5,
            background: p.surface, border: `1px solid ${p.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 600, color: p.textSec, fontFamily: p.fontBody,
          }}>IB</div>
        </div>

        {/* Phase */}
        <div style={{ padding: "8px 16px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{
                fontSize: 8, color: p.textMut, fontFamily: p.fontBody,
                textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600,
              }}>Mês 14 de 74</div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: p.accent,
                fontFamily: p.fontDisplay, marginTop: 2,
              }}>Pré-entrega</div>
            </div>
            <span style={{ fontSize: 9, color: p.textMut, fontFamily: p.fontMono }}>mai 2027</span>
          </div>
          <div style={{
            display: "flex", height: 3, borderRadius: 1.5,
            overflow: "hidden", marginTop: 8, gap: 1,
          }}>
            {[5,7,15,6,11,12,2,16].map((w, i) => (
              <div key={i} style={{
                flex: w, borderRadius: 1,
                background: i===2 ? p.accent : i<2 ? p.danger : p.subtle,
                opacity: i===2?1:0.2,
              }} />
            ))}
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", gap: 6, padding: "10px 16px" }}>
          <FundCard p={p} label="Reserva" value="R$ 126.000" pct={100} color={p.accent} done />
          <FundCard p={p} label="Casa" value="R$ 62.400" pct={57} color={p.success} done={false} />
          <FundCard p={p} label="Livre" value="R$ 12.100" pct={5} color={p.info} done={false} />
        </div>

        {/* Patrimônio */}
        <div style={{ padding: "4px 16px" }}>
          <div style={{
            background: `linear-gradient(135deg, ${p.accent}10, ${p.accent}04)`,
            borderRadius: p.radius * 0.6, padding: "11px 13px",
            border: `1px solid ${p.accent}18`,
          }}>
            <div style={{
              fontSize: 8, color: p.textMut, textTransform: "uppercase",
              letterSpacing: 1.2, fontFamily: p.fontBody, fontWeight: 600,
            }}>Patrimônio acumulado</div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: p.accent,
              fontFamily: p.fontMono, marginTop: 3, letterSpacing: -0.5,
            }}>R$ 215.800</div>
          </div>
        </div>

        {/* Milestones */}
        <div style={{ padding: "8px 16px 10px" }}>
          <div style={{
            fontSize: 8, color: p.textMut, textTransform: "uppercase",
            letterSpacing: 1.2, fontFamily: p.fontBody, fontWeight: 600, marginBottom: 6,
          }}>Próximos marcos</div>
          {([
            ["✅","Casa quitada","mês 26"],
            ["🏦","1ª visita correspondente","mês 28"],
            ["🏠","Habite-se terreno","mês 32"],
          ] as [string,string,string][]).map(([ic,lb,wh]) => (
            <div key={lb} style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 5, padding: "3px 0",
            }}>
              <span style={{ fontSize: 11 }}>{ic}</span>
              <span style={{
                fontSize: 11, color: p.textSec, fontFamily: p.fontBody, flex: 1,
              }}>{lb}</span>
              <span style={{
                fontSize: 8.5, color: p.textMut, fontFamily: p.fontMono,
              }}>{wh}</span>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: "8px 0 20px",
          background: isLight ? `${p.bg}f5` : `${p.bg}f0`,
          borderTop: `1px solid ${p.border}`,
        }}>
          {([["💬","IA"],["💰","Input"],["🎯","Plano"],["👛","Contas"],["📊","Orçam."]] as [string,string][]).map(([ic,lb], i) => (
            <div key={lb} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, opacity: i===2?1:0.3,
            }}>
              <span style={{ fontSize: 14 }}>{ic}</span>
              <span style={{
                fontSize: 7.5, fontFamily: p.fontBody,
                fontWeight: i===2?700:400, color: i===2?p.accent:p.textSec,
              }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LANDING PREVIEW (enhanced) ──

function LandingPreview({ p }: { p: ProposalTheme }) {
  const isLight = p.id === "litoral";
  return (
    <div style={{
      width: 360, borderRadius: p.radius * 0.8, overflow: "hidden",
      border: `1px solid ${p.border}`,
      boxShadow: isLight
        ? "0 16px 50px rgba(80,60,30,0.1), 0 4px 12px rgba(80,60,30,0.06)"
        : "0 16px 50px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
    }}>
      {/* Browser chrome */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: isLight ? "#ede5da" : "#141418", padding: "9px 14px",
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, marginLeft: 8,
          background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
          borderRadius: 4, padding: "3px 10px",
          fontSize: 9, color: p.textMut, fontFamily: p.fontMono,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <circle cx="4" cy="4" r="3" stroke={p.textMut} strokeWidth="0.8" fill="none" />
            <line x1="6" y1="6" x2="7.5" y2="7.5" stroke={p.textMut} strokeWidth="0.8" />
          </svg>
          duna.com.br
        </div>
      </div>

      {/* Page content */}
      <div style={{ background: p.bg, padding: "36px 28px 40px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo p={p} height={28} />
        </div>
        <div style={{
          marginTop: 24, fontSize: 26,
          fontWeight: p.id==="aresta"?800:700, color: p.text,
          fontFamily: p.fontDisplay, lineHeight: 1.15,
          letterSpacing: p.id==="aresta"?1.5:p.id==="cartografia"?0.5:-0.3,
        }}>
          {p.tagline}
        </div>
        <div style={{
          marginTop: 12, fontSize: 12.5, color: p.textSec,
          fontFamily: p.fontBody, lineHeight: 1.6,
          maxWidth: 260, margin: "12px auto 0",
        }}>
          Planejamento financeiro de longo prazo. Transforme objetivos de anos em progresso visível.
        </div>
        <div style={{
          marginTop: 22, display: "inline-block",
          borderRadius: p.radius*0.5, padding: "10px 28px",
          fontSize: 13, fontWeight: 700, fontFamily: p.fontBody,
          background: p.ctaBg, color: p.ctaColor,
          letterSpacing: p.id==="aresta"?1.5:0.3,
          boxShadow: `0 4px 16px ${p.ctaBg}30`,
        }}>
          Comece agora
        </div>
        <div style={{
          marginTop: 20, display: "flex", justifyContent: "center", gap: 20,
          fontSize: 9, color: p.textMut, fontFamily: p.fontBody,
        }}>
          {["Gratuito", "Sem cartão", "Seus dados seguros"].map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ color: p.success, fontSize: 10 }}>&#10003;</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PALETTE (enhanced) ──

function PalettePanel({ p }: { p: ProposalTheme }) {
  const colors = [
    { c: p.accent, n: "Primária", hex: p.accent },
    { c: p.success, n: "Sucesso", hex: p.success },
    { c: p.info, n: "Info", hex: p.info },
    { c: p.subtle, n: "Sutil", hex: p.subtle },
    { c: p.danger, n: "Alerta", hex: p.danger },
    { c: p.bg, n: "Fundo", hex: p.bg, hasBorder: true },
  ];

  return (
    <div>
      {/* Gradient strip */}
      <div style={{
        height: 6, borderRadius: 3, marginBottom: 20, overflow: "hidden",
        display: "flex", gap: 2,
      }}>
        {colors.filter(c => !c.hasBorder).map(({ c, n }) => (
          <div key={n} style={{ flex: 1, background: c, borderRadius: 3 }} />
        ))}
      </div>
      {/* Swatches */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {colors.map(({ c, n, hex, hasBorder }) => (
          <div key={n} className="dv2-swatch" style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: p.radius * 0.5,
              background: c, border: hasBorder ? `1px solid ${p.border}` : "none",
              boxShadow: `0 2px 8px ${c}30`,
            }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: p.textSec, fontFamily: p.fontBody, fontWeight: 500 }}>{n}</div>
              <div style={{ fontSize: 7.5, color: p.textMut, fontFamily: p.fontMono, marginTop: 1 }}>{hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TYPOGRAPHY SPECIMEN (enhanced) ──

function TypographyPanel({ p }: { p: ProposalTheme }) {
  const displayName = p.fontDisplay.split("'")[1];
  const bodyName = p.fontBody.split("'")[1];
  const monoName = p.fontMono.split("'")[1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Large specimen */}
      <div>
        <div style={{
          fontFamily: p.fontDisplay, fontSize: 48, fontWeight: p.id==="aresta"?800:700,
          color: p.text, lineHeight: 1, letterSpacing: p.id==="aresta"?3:p.id==="cartografia"?1:-0.5,
          textTransform: p.logoCase as React.CSSProperties["textTransform"],
        }}>
          Aa
        </div>
        <div style={{
          fontFamily: p.fontDisplay, fontSize: 13, color: p.textSec,
          marginTop: 4, fontWeight: 500,
        }}>
          {displayName}
        </div>
      </div>

      {/* Body sample */}
      <div style={{
        fontFamily: p.fontBody, fontSize: 13, color: p.textSec,
        lineHeight: 1.65, maxWidth: 280,
      }}>
        Planejamento financeiro de longo prazo. Transforme objetivos de anos em progresso visível, grão por grão.
      </div>

      {/* Mono sample */}
      <div style={{
        fontFamily: p.fontMono, fontSize: 18, color: p.accent,
        fontWeight: 700, letterSpacing: -0.5,
      }}>
        R$ 215.800,00
      </div>

      {/* Font list */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 6,
        borderTop: `1px solid ${p.border}`, paddingTop: 12,
      }}>
        {[
          ["Display", displayName, p.fontDisplay],
          ["Body", bodyName, p.fontBody],
          ["Mono", monoName, p.fontMono],
        ].map(([role, name, family]) => (
          <div key={role} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
          }}>
            <span style={{
              fontSize: 8, color: p.textMut, fontFamily: p.fontBody,
              textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600,
            }}>{role}</span>
            <span style={{
              fontSize: 11, color: p.textSec, fontFamily: family as string,
            }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──

export default function DunaBrandBookV2() {
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const p = ALL[idx];
  const isLight = p.id === "litoral";

  useEffect(() => { setTimeout(() => setReady(true), 150); }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        switchTo((idx + 1) % ALL.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        switchTo((idx - 1 + ALL.length) % ALL.length);
      } else if (e.key >= "1" && e.key <= "5") {
        switchTo(parseInt(e.key) - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const switchTo = useCallback((i: number) => {
    if (i === idx || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setIdx(i);
      setAnimKey(k => k + 1);
      contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
      setTimeout(() => setTransitioning(false), 50);
    }, 300);
  }, [idx, transitioning]);

  return (
    <div style={{
      minHeight: "100vh", background: p.bg, color: p.text, fontFamily: p.fontBody,
      transition: "background 0.5s ease, color 0.5s ease",
      position: "relative", overflow: "hidden",
    }}>
      <style>{GALLERY_STYLES}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Libre+Franklin:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Source+Serif+4:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;700&family=Fraunces:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <GrainOverlay opacity={isLight ? 0.02 : 0.04} />
      <AccentGlow color={p.accent} />

      {/* Floating nav dots */}
      <FloatingNav proposals={ALL} current={idx} onSelect={switchTo} />

      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 28px",
        background: `linear-gradient(to bottom, ${p.bg}, ${p.bg}00)`,
        transition: "background 0.5s ease",
        pointerEvents: "none",
      }}>
        <div style={{ pointerEvents: "auto", animation: "dv2-fadeIn 0.8s ease both" }}>
          <Logo p={p} height={24} />
        </div>
        <div style={{
          pointerEvents: "auto",
          fontSize: 9, fontFamily: p.fontMono, color: p.textMut,
          textTransform: "uppercase", letterSpacing: 2,
        }}>
          Brand Book
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} style={{
        minHeight: "100vh",
        opacity: ready && !transitioning ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}>
        <div key={animKey} style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 32px 100px",
        }}>
          {/* ── HERO SECTION ── */}
          <div style={{
            minHeight: "85vh", display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            position: "relative", textAlign: "center",
            padding: "80px 0 40px",
          }}>
            {/* Giant watermark number */}
            <div style={{
              position: "absolute", top: "10%", left: "50%",
              transform: "translateX(-50%)",
              fontFamily: p.fontDisplay, fontSize: "clamp(150px, 25vw, 280px)",
              fontWeight: p.id === "aresta" ? 800 : 700,
              color: p.text, opacity: 0.03,
              lineHeight: 1, pointerEvents: "none",
              animation: "dv2-numberSlide 0.8s ease both",
            }}>
              {String(idx + 1).padStart(2, "0")}
            </div>

            {/* Proposal label */}
            <div className="dv2-stagger-1" style={{
              fontSize: 10, textTransform: "uppercase", letterSpacing: 5,
              color: p.textMut, fontFamily: p.fontMono, marginBottom: 16,
            }}>
              Proposta {idx + 1} / 5
            </div>

            {/* Name */}
            <div className="dv2-stagger-2" style={{
              fontSize: "clamp(42px, 8vw, 72px)",
              fontWeight: p.id === "aresta" ? 800 : 700,
              color: p.text, fontFamily: p.fontDisplay, lineHeight: 1.05,
              letterSpacing: p.id === "aresta" ? 6 : p.id === "cartografia" ? 2 : -1,
              textTransform: p.logoCase as React.CSSProperties["textTransform"],
            }}>
              {p.name}
            </div>

            {/* Subtitle */}
            <div className="dv2-stagger-3" style={{
              fontSize: "clamp(16px, 2.5vw, 20px)", color: p.accent,
              fontFamily: p.fontDisplay, marginTop: 12,
              fontStyle: p.id === "noturna" || p.id === "litoral" ? "italic" : "normal",
              fontWeight: 400,
            }}>
              {p.subtitle}
            </div>

            {/* Divider */}
            <div className="dv2-stagger-3" style={{
              width: 40, height: 2, background: p.accent,
              margin: "28px auto", borderRadius: 1, opacity: 0.5,
            }} />

            {/* Philosophy */}
            <div className="dv2-stagger-4" style={{
              maxWidth: 520, fontSize: 14.5, color: p.textSec,
              lineHeight: 1.8, fontFamily: p.fontBody, textAlign: "center",
            }}>
              {p.philosophy}
            </div>

            {/* Tagline */}
            <div className="dv2-stagger-5" style={{
              marginTop: 36, fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: p.id === "aresta" ? 800 : 600, color: p.accent,
              fontFamily: p.fontDisplay,
              letterSpacing: p.id === "aresta" ? 3 : p.id === "cartografia" ? 1 : -0.3,
            }}>
              &ldquo;{p.tagline}&rdquo;
            </div>

            {/* Scroll hint */}
            <div className="dv2-stagger-7" style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)", display: "flex",
              flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <span style={{
                fontSize: 8, color: p.textMut, fontFamily: p.fontMono,
                textTransform: "uppercase", letterSpacing: 2,
              }}>Scroll</span>
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none" style={{ animation: "dv2-float 2s ease-in-out infinite" }}>
                <rect x="5" y="0" width="6" height="10" rx="3" stroke={p.textMut} strokeWidth="1" fill="none" />
                <line x1="8" y1="3" x2="8" y2="5" stroke={p.textMut} strokeWidth="1" strokeLinecap="round" />
                <path d="M4 13 L8 17 L12 13" stroke={p.textMut} strokeWidth="1" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* ── LOGO SHOWCASE ── */}
          <section className="dv2-stagger-5" style={{ paddingBottom: 60 }}>
            <SectionLabel p={p} label="Identidade" />
            <div style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: 40, flexWrap: "wrap", marginTop: 32,
            }}>
              <Logo p={p} height={52} />
              <div style={{
                width: 1, height: 48, background: p.border,
              }} />
              <div style={{
                display: "flex", gap: 20, alignItems: "flex-end",
              }}>
                {[16, 24, 32, 48, 64].map(s => {
                  const L = LOGOS[p.id];
                  return (
                    <div key={s} style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 6,
                    }}>
                      <L size={s} />
                      <span style={{
                        fontSize: 8, color: p.textMut, fontFamily: p.fontMono,
                      }}>{s}px</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── TYPOGRAPHY + PALETTE ── */}
          <section style={{ paddingBottom: 60 }}>
            <SectionLabel p={p} label="Sistema Visual" />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 20, marginTop: 32,
            }}>
              {/* Typography card */}
              <GlassCard p={p}>
                <CardLabel p={p}>Tipografia</CardLabel>
                <TypographyPanel p={p} />
              </GlassCard>

              {/* Palette card */}
              <GlassCard p={p}>
                <CardLabel p={p}>Paleta de cores</CardLabel>
                <PalettePanel p={p} />
              </GlassCard>
            </div>
          </section>

          {/* ── MOCKUPS ── */}
          <section style={{ paddingBottom: 60 }}>
            <SectionLabel p={p} label="Aplicações" />
            <div style={{
              display: "flex", gap: 40, justifyContent: "center",
              flexWrap: "wrap", marginTop: 40, alignItems: "flex-start",
            }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              }}>
                <PhoneMockup p={p} />
                <MockupLabel p={p}>App — Dashboard</MockupLabel>
              </div>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              }}>
                <LandingPreview p={p} />
                <MockupLabel p={p}>Landing Page</MockupLabel>
              </div>
            </div>
          </section>

          {/* ── BRAND VOCABULARY ── */}
          <section style={{ paddingBottom: 40 }}>
            <SectionLabel p={p} label="Vocabulário de Marca" />
            <div style={{
              display: "flex", justifyContent: "center", gap: 10,
              flexWrap: "wrap", marginTop: 32,
            }}>
              {([
                ["Grão", "cada aporte"],
                ["Vento", "o plano em ação"],
                ["Crista", "o marco final"],
                ["Rastro", "sua timeline"],
                ["Maré", "desvios"],
              ] as [string, string][]).map(([word, meaning]) => (
                <div key={word} className="dv2-card-hover" style={{
                  background: `${p.cardBg}`,
                  backdropFilter: "blur(12px)",
                  borderRadius: p.radius * 0.6,
                  padding: "14px 22px",
                  border: `1px solid ${p.border}`,
                  textAlign: "center",
                  minWidth: 110,
                }}>
                  <div style={{
                    fontSize: 18, fontWeight: 600, color: p.accent,
                    fontFamily: p.fontDisplay, marginBottom: 4,
                  }}>{word}</div>
                  <div style={{
                    fontSize: 10, color: p.textMut, fontFamily: p.fontBody,
                    fontStyle: "italic",
                  }}>{meaning}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── KEYBOARD HINT ── */}
          <div style={{
            textAlign: "center", padding: "20px 0 0",
            fontSize: 10, color: p.textMut, fontFamily: p.fontMono,
            letterSpacing: 1,
          }}>
            <span style={{ opacity: 0.5 }}>
              ← → ou 1-5 para navegar
            </span>
          </div>
        </div>
      </div>

      {/* Bottom proposal switcher */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", justifyContent: "center",
        padding: "12px 20px 16px",
        background: `linear-gradient(to top, ${p.bg}, ${p.bg}e0, ${p.bg}00)`,
        transition: "background 0.5s ease",
      }}>
        <div style={{
          display: "flex", gap: 4,
          background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
          borderRadius: 24, padding: 4,
          backdropFilter: "blur(20px)",
          border: `1px solid ${p.border}`,
        }}>
          {ALL.map((pr, i) => (
            <button
              key={pr.id}
              onClick={() => switchTo(i)}
              style={{
                background: i === idx ? p.accent : "transparent",
                color: i === idx
                  ? (isLight ? "#fff" : p.bg)
                  : p.textSec,
                border: "none",
                borderRadius: 20, padding: "7px 18px",
                fontSize: 12, fontWeight: 600,
                fontFamily: p.fontBody, cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                letterSpacing: 0.3, whiteSpace: "nowrap",
                opacity: i === idx ? 1 : 0.7,
              }}
            >
              {pr.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS ──

function SectionLabel({ p, label }: { p: ProposalTheme; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        fontSize: 9, textTransform: "uppercase", letterSpacing: 4,
        color: p.textMut, fontFamily: p.fontMono, fontWeight: 600,
        whiteSpace: "nowrap",
      }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: p.border }} />
    </div>
  );
}

function GlassCard({ p, children }: { p: ProposalTheme; children: React.ReactNode }) {
  const isLight = p.id === "litoral";
  return (
    <div className="dv2-card-hover" style={{
      background: isLight ? "rgba(255,255,255,0.5)" : p.cardBg,
      backdropFilter: "blur(16px)",
      borderRadius: p.radius,
      padding: "28px 28px 24px",
      border: `1px solid ${p.border}`,
      boxShadow: isLight
        ? "0 4px 24px rgba(0,0,0,0.04)"
        : "0 4px 24px rgba(0,0,0,0.15)",
    }}>
      {children}
    </div>
  );
}

function CardLabel({ p, children }: { p: ProposalTheme; children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 8, color: p.textMut, textTransform: "uppercase",
      letterSpacing: 3, marginBottom: 20, fontWeight: 600,
      fontFamily: p.fontMono,
    }}>
      {children}
    </div>
  );
}

function MockupLabel({ p, children }: { p: ProposalTheme; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, color: p.textMut, textTransform: "uppercase",
      letterSpacing: 2, fontWeight: 600, fontFamily: p.fontMono,
    }}>
      {children}
    </span>
  );
}
