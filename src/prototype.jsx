import { useState, useMemo, useEffect } from "react";

const PHASES = [
  { id: 1, name: "Entrada Terreno", months: [0, 4], color: "#e74c3c" },
  { id: 2, name: "Pré-entrega + Casamento", months: [5, 11], color: "#e67e22" },
  { id: "3a", name: "Pré-entrega", months: [12, 26], color: "#f1c40f" },
  { id: "3b", name: "Pré-entrega (casa quitada)", months: [27, 32], color: "#2ecc71" },
  { id: "4a", name: "Pós-entrega", months: [33, 43], color: "#1abc9c" },
  { id: "4b", name: "Acumula p/ quitação", months: [44, 55], color: "#3498db" },
  { id: 5, name: "Terreno quitado", months: [56, 57], color: "#9b59b6" },
  { id: 6, name: "Obra", months: [58, 73], color: "#8e44ad" },
  { id: 7, name: "Casa pronta!", months: [74, 74], color: "#27ae60" },
];

const MILESTONES = [
  { month: 0, icon: "🚀", label: "Início", type: "start" },
  { month: 4, icon: "⚠️", label: "Entrada 4/4 (apertado)", type: "warning" },
  { month: 11, icon: "🎉", label: "Fim casamento", type: "celebration" },
  { month: 12, icon: "🏦", label: "Abrir conta Caixa", type: "action" },
  { month: 16, icon: "✅", label: "Reserva R$126k completa", type: "milestone" },
  { month: 26, icon: "✅", label: "Casa quitada", type: "milestone" },
  { month: 28, icon: "🏦", label: "1ª visita correspondente", type: "action" },
  { month: 32, icon: "🏠", label: "Habite-se terreno", type: "milestone" },
  { month: 33, icon: "🏗️", label: "Cotar construtoras", type: "action" },
  { month: 43, icon: "🔀", label: "Decisão amortização", type: "decision" },
  { month: 47, icon: "✍️", label: "Fechar construtora", type: "action" },
  { month: 55, icon: "💰", label: "Quitar terreno", type: "milestone" },
  { month: 57, icon: "🏦", label: "2ª visita correspondente", type: "action" },
  { month: 58, icon: "🏗️", label: "Início obra (otimista)", type: "milestone" },
  { month: 67, icon: "🏗️", label: "Início obra (conservador)", type: "milestone" },
  { month: 74, icon: "🏠", label: "Casa pronta!", type: "celebration" },
];

const TIMELINE_DATA = [
  { month: 0, reserva: 2500, casa: 0, livre: 0, acoes: 2500 },
  { month: 4, reserva: -500, casa: 0, livre: 0, acoes: 5700 },
  { month: 5, reserva: 10107, casa: 0, livre: 0, acoes: 6500 },
  { month: 11, reserva: 73749, casa: 0, livre: 0, acoes: 11300 },
  { month: 12, reserva: 73606, casa: 0, livre: 0, acoes: 12100 },
  { month: 16, reserva: 126000, casa: 34, livre: 0, acoes: 15300 },
  { month: 24, reserva: 126000, casa: 87674, livre: 0, acoes: 21700 },
  { month: 26, reserva: 126000, casa: 110000, livre: 7854, acoes: 23300 },
  { month: 32, reserva: 126000, casa: 110000, livre: 63596, acoes: 28100 },
  { month: 33, reserva: 126000, casa: 110000, livre: 76455, acoes: 28900 },
  { month: 43, reserva: 126000, casa: 110000, livre: 205045, acoes: 36900 },
  { month: 47, reserva: 126000, casa: 110000, livre: 183056, acoes: 40100 },
  { month: 55, reserva: 126000, casa: 110000, livre: 78228, acoes: 46500 },
  { month: 58, reserva: 126000, casa: 110000, livre: 124375, acoes: 48900 },
  { month: 67, reserva: 126000, casa: 110000, livre: 222497, acoes: 56100 },
  { month: 74, reserva: 126000, casa: 110000, livre: 268125, acoes: 61700 },
];

const PONTUAIS = [
  { month: 1, valor: 10000, desc: "Entrada 1/4" },
  { month: 2, valor: 10000, desc: "Entrada 2/4" },
  { month: 3, valor: 10000, desc: "Entrada 3/4" },
  { month: 4, valor: 23000, desc: "Entrada 4/4" },
  { month: 12, valor: 13250, desc: "Anual pré 1" },
  { month: 24, valor: 13250, desc: "Anual pré 2" },
  { month: 32, valor: 26500, desc: "Habite-se" },
  { month: 44, valor: 33125, desc: "Anual pós 1" },
  { month: 55, valor: 248000, desc: "Quitação terreno (desc 10%)" },
];

function formatBRL(v) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getMonthYear(monthOffset) {
  const base = new Date(2026, 2); // March 2026 = month 0
  const d = new Date(base.getFullYear(), base.getMonth() + monthOffset);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function interpolateData(month) {
  let before = TIMELINE_DATA[0];
  let after = TIMELINE_DATA[TIMELINE_DATA.length - 1];
  for (let i = 0; i < TIMELINE_DATA.length - 1; i++) {
    if (month >= TIMELINE_DATA[i].month && month <= TIMELINE_DATA[i + 1].month) {
      before = TIMELINE_DATA[i];
      after = TIMELINE_DATA[i + 1];
      break;
    }
  }
  if (month >= after.month) return after;
  if (month <= before.month) return before;
  const t = (month - before.month) / (after.month - before.month);
  return {
    month,
    reserva: Math.round(before.reserva + t * (after.reserva - before.reserva)),
    casa: Math.round(before.casa + t * (after.casa - before.casa)),
    livre: Math.round(before.livre + t * (after.livre - before.livre)),
    acoes: Math.round(before.acoes + t * (after.acoes - before.acoes)),
  };
}

function getCurrentPhase(month) {
  for (const p of PHASES) {
    if (month >= p.months[0] && month <= p.months[1]) return p;
  }
  return PHASES[PHASES.length - 1];
}

function ProgressRing({ value, max, size = 80, stroke = 6, color, children }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function FundCard({ label, current, target, color, done }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "20px 24px",
      border: `1px solid ${done ? color + "44" : "rgba(255,255,255,0.06)"}`,
      flex: 1, minWidth: 200,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        {done && <span style={{ fontSize: 11, background: color + "22", color, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>Completo</span>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
        {formatBRL(current)}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        meta {formatBRL(target)}
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6, textAlign: "right", fontFamily: "'Space Mono', monospace" }}>
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

export default function FinancialDashboard() {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const data = useMemo(() => interpolateData(currentMonth), [currentMonth]);
  const phase = getCurrentPhase(currentMonth);
  const totalPatrimonio = data.reserva + Math.max(data.casa, 0) + data.livre + data.acoes;
  const nextMilestones = MILESTONES.filter((m) => m.month >= currentMonth).slice(0, 3);
  const nextPontual = PONTUAIS.find((p) => p.month >= currentMonth);
  const totalMonths = 74;

  // Stack chart data
  const chartData = TIMELINE_DATA.map((d) => ({
    ...d,
    total: Math.max(d.reserva, 0) + Math.max(d.casa, 0) + d.livre + d.acoes,
  }));
  const maxTotal = Math.max(...chartData.map((d) => d.total));

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0b0e", color: "#fff",
      fontFamily: "'DM Sans', sans-serif", padding: "0 0 60px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f1117 0%, #151820 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "32px 40px 28px",
        opacity: animate ? 1 : 0, transform: animate ? "translateY(0)" : "translateY(-10px)",
        transition: "all 0.6s ease",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Planejamento Financeiro</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Harmonia Jardins</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Lote 100 · Chave na Mão + Caixa · R$ 1.2M</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <ProgressRing value={currentMonth} max={totalMonths} size={72} stroke={5} color={phase.color}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{currentMonth}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>/{totalMonths}</div>
                </div>
              </ProgressRing>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Fase atual</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: phase.color }}>{phase.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>{getMonthYear(currentMonth)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>

        {/* Month Slider */}
        <div style={{
          margin: "32px 0 16px", padding: "20px 28px", background: "rgba(255,255,255,0.02)",
          borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)",
          opacity: animate ? 1 : 0, transition: "opacity 0.6s 0.2s ease",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Simular mês</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              Mês {currentMonth} · {getMonthYear(currentMonth)}
            </span>
          </div>
          <input type="range" min={0} max={totalMonths} value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            style={{ width: "100%", accentColor: phase.color, cursor: "pointer" }} />
          {/* Phase bar */}
          <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", marginTop: 10, gap: 1 }}>
            {PHASES.map((p) => (
              <div key={p.id} style={{
                flex: p.months[1] - p.months[0] + 1, background: p.color,
                opacity: currentMonth >= p.months[0] && currentMonth <= p.months[1] ? 1 : 0.2,
                transition: "opacity 0.3s ease",
              }} title={p.name} />
            ))}
          </div>
        </div>

        {/* Fund Cards */}
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24,
          opacity: animate ? 1 : 0, transition: "opacity 0.6s 0.3s ease",
        }}>
          <FundCard label="🛡 Reserva" current={Math.max(data.reserva, 0)} target={126000} color="#f59e0b" done={data.reserva >= 126000} />
          <FundCard label="🏠 Casa Atual" current={Math.max(data.casa, 0)} target={110000} color="#10b981" done={data.casa >= 110000} />
          <FundCard label="💰 Livre" current={Math.max(data.livre, 0)} target={248000} color="#3b82f6" done={false} />
          <FundCard label="📈 Ações" current={data.acoes} target={62000} color="#a855f7" done={false} />
        </div>

        {/* Patrimônio + Next milestone + Next pontual */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap",
          opacity: animate ? 1 : 0, transition: "opacity 0.6s 0.35s ease",
        }}>
          {/* Total */}
          <div style={{
            flex: "1 1 240px", background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))",
            borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(245,158,11,0.12)",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Patrimônio acumulado</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#f59e0b" }}>
              {formatBRL(totalPatrimonio)}
            </div>
          </div>

          {/* Next milestones */}
          <div style={{
            flex: "1 1 340px", background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "20px 24px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Próximos marcos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nextMilestones.map((m, i) => (
                <div key={m.month} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 1 - i * 0.25 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <div>
                    <span style={{ fontSize: 13, color: "#fff" }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8, fontFamily: "'Space Mono', monospace" }}>
                      mês {m.month} · {getMonthYear(m.month)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next pontual */}
          {nextPontual && (
            <div style={{
              flex: "1 1 220px", background: "rgba(239,68,68,0.04)", borderRadius: 16, padding: "20px 24px",
              border: "1px solid rgba(239,68,68,0.1)",
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Próximo pagamento pontual</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#ef4444", marginBottom: 4 }}>
                {formatBRL(nextPontual.valor)}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {nextPontual.desc} · mês {nextPontual.month}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
                em {nextPontual.month - currentMonth > 0 ? `${nextPontual.month - currentMonth} meses` : "agora"}
              </div>
            </div>
          )}
        </div>

        {/* Stacked area chart */}
        <div style={{
          background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "24px 28px",
          border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24,
          opacity: animate ? 1 : 0, transition: "opacity 0.6s 0.4s ease",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Evolução patrimonial</div>
          <div style={{ position: "relative", height: 200, display: "flex", alignItems: "flex-end", gap: 2 }}>
            {chartData.map((d, i) => {
              const h = (d.total / (maxTotal * 1.1)) * 200;
              const rPct = d.total > 0 ? (Math.max(d.reserva, 0) / d.total) * 100 : 0;
              const cPct = d.total > 0 ? (Math.max(d.casa, 0) / d.total) * 100 : 0;
              const lPct = d.total > 0 ? (d.livre / d.total) * 100 : 0;
              const aPct = d.total > 0 ? (d.acoes / d.total) * 100 : 0;
              const isActive = d.month <= currentMonth;
              return (
                <div key={d.month} style={{
                  flex: 1, height: h, borderRadius: "4px 4px 0 0", overflow: "hidden",
                  opacity: isActive ? 1 : 0.2, transition: "opacity 0.5s ease",
                  display: "flex", flexDirection: "column-reverse", position: "relative",
                  cursor: "pointer",
                }} title={`Mês ${d.month}: ${formatBRL(d.total)}`}
                  onClick={() => setCurrentMonth(d.month)}>
                  <div style={{ height: `${rPct}%`, background: "#f59e0b", transition: "height 0.5s" }} />
                  <div style={{ height: `${cPct}%`, background: "#10b981", transition: "height 0.5s" }} />
                  <div style={{ height: `${lPct}%`, background: "#3b82f6", transition: "height 0.5s" }} />
                  <div style={{ height: `${aPct}%`, background: "#a855f7", transition: "height 0.5s" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {chartData.filter((_, i) => i % 3 === 0 || i === chartData.length - 1).map((d) => (
              <span key={d.month} style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono', monospace" }}>
                M{d.month}
              </span>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {[
              { color: "#f59e0b", label: "Reserva" },
              { color: "#10b981", label: "Casa" },
              { color: "#3b82f6", label: "Livre" },
              { color: "#a855f7", label: "Ações" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline milestones */}
        <div style={{
          background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "24px 28px",
          border: "1px solid rgba(255,255,255,0.05)",
          opacity: animate ? 1 : 0, transition: "opacity 0.6s 0.5s ease",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Timeline completa</div>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "rgba(255,255,255,0.06)" }} />
            {MILESTONES.map((m, i) => {
              const isPast = m.month < currentMonth;
              const isCurrent = m.month === currentMonth;
              const typeColors = {
                start: "#6366f1", warning: "#f59e0b", celebration: "#22c55e",
                action: "#3b82f6", milestone: "#10b981", decision: "#ef4444",
              };
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16,
                  opacity: isPast ? 0.35 : 1, transition: "opacity 0.3s ease",
                  cursor: "pointer",
                }} onClick={() => setCurrentMonth(m.month)}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                    background: isCurrent ? typeColors[m.type] : isPast ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                    border: `2px solid ${isCurrent ? typeColors[m.type] : isPast ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, position: "relative", zIndex: 1,
                    boxShadow: isCurrent ? `0 0 12px ${typeColors[m.type]}44` : "none",
                  }}>
                    {isPast && <span style={{ color: "rgba(255,255,255,0.4)" }}>✓</span>}
                  </div>
                  <div style={{ paddingTop: 1 }}>
                    <span style={{ fontSize: 14 }}>{m.icon} </span>
                    <span style={{
                      fontSize: 13, fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? "#fff" : "rgba(255,255,255,0.7)",
                    }}>{m.label}</span>
                    <span style={{
                      fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8,
                      fontFamily: "'Space Mono', monospace",
                    }}>
                      mês {m.month} · {getMonthYear(m.month)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}