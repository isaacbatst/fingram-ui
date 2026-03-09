import { useState } from "react";

// ═══════════════════════════════════════════════════════
// DUNA TYPE TEST — Serif Font Comparison (Caminho B)
// ═══════════════════════════════════════════════════════

interface FontCandidate {
  id: string;
  name: string;
  family: string;
  weights: string;
  style: string;
}

const FONTS: FontCandidate[] = [
  {
    id: "playfair",
    name: "Playfair Display",
    family: "'Playfair Display', Georgia, serif",
    weights: "400;600;700",
    style: "Current — transicional clássica, alto contraste",
  },
  {
    id: "instrument",
    name: "Instrument Serif",
    family: "'Instrument Serif', Georgia, serif",
    weights: "400",
    style: "Afiada, contemporânea, contraste alto mas geométrica",
  },
  {
    id: "newsreader",
    name: "Newsreader",
    family: "'Newsreader', Georgia, serif",
    weights: "400;500;600;700",
    style: "Editorial moderna, desenhada para tela, menos ornamental",
  },
  {
    id: "dm-serif",
    name: "DM Serif Text",
    family: "'DM Serif Text', Georgia, serif",
    weights: "400",
    style: "Compacta, robusta, moderna",
  },
  {
    id: "fraunces",
    name: "Fraunces",
    family: "'Fraunces', Georgia, serif",
    weights: "400;500;600;700",
    style: "Óptica variável, soft serif com personalidade orgânica",
  },
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,600&family=Instrument+Serif&family=Newsreader:wght@400;500;600;700&family=DM+Serif+Text&family=Fraunces:wght@400;500;600;700&family=Libre+Franklin:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap";

// ── Specimen Card ──

function SpecimenCard({
  font,
  isSelected,
  onSelect,
}: {
  font: FontCandidate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="text-left w-full"
      style={{
        background: isSelected
          ? "rgba(217,175,120,0.06)"
          : "rgba(217,175,120,0.02)",
        border: `1px solid ${isSelected ? "rgba(217,175,120,0.2)" : "rgba(217,175,120,0.06)"}`,
        borderRadius: 14,
        padding: "24px",
        transition: "all 200ms ease",
        cursor: "pointer",
      }}
    >
      {/* Font name label */}
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase" as const,
          letterSpacing: 3,
          color: isSelected ? "#d9af78" : "rgba(240,232,220,0.35)",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        {font.name}
        {font.id === "playfair" && " (atual)"}
      </div>

      {/* Large specimen */}
      <div
        style={{
          fontFamily: font.family,
          fontSize: 48,
          fontWeight: font.id === "instrument" || font.id === "dm-serif" ? 400 : 700,
          color: "#f0e8dc",
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        Aa
      </div>

      {/* Wordmark test */}
      <div
        style={{
          fontFamily: font.family,
          fontSize: 28,
          fontWeight: font.id === "instrument" || font.id === "dm-serif" ? 400 : 600,
          fontStyle: "italic",
          color: "#d9af78",
          marginBottom: 16,
          letterSpacing: -0.3,
        }}
      >
        duna
      </div>

      {/* Heading test */}
      <div
        style={{
          fontFamily: font.family,
          fontSize: 20,
          fontWeight: font.id === "instrument" || font.id === "dm-serif" ? 400 : 600,
          color: "#f0e8dc",
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        Camada por camada.
      </div>

      {/* Body context */}
      <div
        style={{
          fontFamily: "'Libre Franklin', sans-serif",
          fontSize: 13,
          color: "rgba(240,232,220,0.55)",
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        Planejamento financeiro de longo prazo. Transforme objetivos de anos em
        progresso visível.
      </div>

      {/* Monetary value context */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: font.family,
            fontSize: 12,
            fontWeight: font.id === "instrument" || font.id === "dm-serif" ? 400 : 600,
            color: "rgba(240,232,220,0.35)",
            textTransform: "uppercase" as const,
            letterSpacing: 1,
          }}
        >
          Patrimônio
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 24,
            fontWeight: 700,
            color: "#d9af78",
            letterSpacing: -0.5,
          }}
        >
          R$ 215.800
        </span>
      </div>

      {/* Style description */}
      <div
        style={{
          fontSize: 11,
          color: "rgba(240,232,220,0.3)",
          fontFamily: "'Libre Franklin', sans-serif",
          fontStyle: "italic",
        }}
      >
        {font.style}
      </div>
    </button>
  );
}

// ── Full Preview ──

function FullPreview({ font }: { font: FontCandidate }) {
  return (
    <div
      style={{
        background: "rgba(217,175,120,0.02)",
        border: "1px solid rgba(217,175,120,0.08)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Simulated app header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(217,175,120,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "rgba(217,175,120,0.1)",
          }}
        />
        <span
          style={{
            fontFamily: font.family,
            fontSize: 18,
            fontWeight: font.id === "instrument" || font.id === "dm-serif" ? 400 : 600,
            fontStyle: "italic",
            color: "#d9af78",
          }}
        >
          duna
        </span>
      </div>

      {/* Simulated hero card */}
      <div style={{ padding: 20 }}>
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(217,175,120,0.08), rgba(217,175,120,0.02))",
            border: "1px solid rgba(217,175,120,0.15)",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase" as const,
              letterSpacing: 3,
              color: "rgba(240,232,220,0.35)",
              fontFamily: "'Libre Franklin', sans-serif",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Saldo total
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 32,
              fontWeight: 700,
              color: "#d9af78",
              textShadow: "0 0 24px rgba(217,175,120,0.15)",
            }}
          >
            R$ 215.800,00
          </div>
        </div>

        {/* Section heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#f0e8dc",
              fontFamily: "'Libre Franklin', sans-serif",
            }}
          >
            Carteiras
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(217,175,120,0.08)",
            }}
          />
        </div>

        {/* Simulated box cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            { name: "Nubank", value: "R$ 12.400", pct: 100 },
            { name: "Reserva", value: "R$ 126.000", pct: 84 },
          ].map((box) => (
            <div
              key={box.name}
              style={{
                background: "rgba(217,175,120,0.03)",
                border: "1px solid rgba(217,175,120,0.06)",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(240,232,220,0.4)",
                  fontFamily: "'Libre Franklin', sans-serif",
                  marginBottom: 4,
                }}
              >
                {box.name}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#f0e8dc",
                  letterSpacing: -0.3,
                }}
              >
                {box.value}
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: "rgba(217,175,120,0.08)",
                  marginTop: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${box.pct}%`,
                    background: box.pct >= 100 ? "#7bad6e" : "#d9af78",
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Simulated empty state — this is where font-display WOULD appear */}
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            background: "rgba(217,175,120,0.02)",
            borderRadius: 10,
            border: "1px dashed rgba(217,175,120,0.08)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(217,175,120,0.06)",
              margin: "0 auto 12px",
            }}
          />
          <div
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#f0e8dc",
              marginBottom: 6,
            }}
          >
            Plano em construção
          </div>
          <div
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 12,
              color: "rgba(240,232,220,0.4)",
              lineHeight: 1.5,
            }}
          >
            Quando estiver pronto, o Duna acompanha com você.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function TypeTest() {
  const [selectedId, setSelectedId] = useState("playfair");
  const selectedFont = FONTS.find((f) => f.id === selectedId) || FONTS[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08090c",
        color: "#f0e8dc",
        fontFamily: "'Libre Franklin', sans-serif",
      }}
    >
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />

      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid rgba(217,175,120,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 600,
              fontStyle: "italic",
              color: "#d9af78",
            }}
          >
            duna
          </span>
          <span
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "rgba(240,232,220,0.25)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Type Test — Caminho B
          </span>
        </div>
        <a
          href="/"
          style={{
            fontSize: 12,
            color: "rgba(240,232,220,0.4)",
            textDecoration: "none",
          }}
        >
          ← Voltar ao app
        </a>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        {/* Intro */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 8,
              color: "#f0e8dc",
            }}
          >
            Teste de serifs alternativas
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(240,232,220,0.5)",
              lineHeight: 1.6,
              maxWidth: 600,
            }}
          >
            Compare como cada font display se comporta nos contextos do Duna:
            wordmark, headings, ao lado de dados em monospace, e em elementos de
            marca. Clique em um specimen para ver o preview completo.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Left: Specimen grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {FONTS.map((font) => (
              <SpecimenCard
                key={font.id}
                font={font}
                isSelected={selectedId === font.id}
                onSelect={() => setSelectedId(font.id)}
              />
            ))}
          </div>

          {/* Right: Full preview */}
          <div style={{ position: "sticky", top: 32 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 3,
                color: "rgba(240,232,220,0.25)",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 12,
              }}
            >
              Preview — {selectedFont.name}
            </div>
            <FullPreview font={selectedFont} />
          </div>
        </div>
      </div>
    </div>
  );
}
