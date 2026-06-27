import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const recortes = [
  { n: "01", label: "Panorama Geral",                path: "/q/q1" },
  { n: "02", label: "Quem é seu deputado?",          path: "/q/q2" },
  { n: "03", label: "Partidos e como se comportam?", path: "/q/q3" },
  { n: "04", label: "Gastos e problemas sociais",    path: "/q/q4" },
  { n: "05", label: "Fornecedores e deputados",      path: "/q/q5" },
  { n: "06", label: "Influência na Câmara",          path: "/q/q6" },
  { n: "07", label: "Ideologia e deputado",          path: "/q/q7" },
  { n: "08", label: "Escolaridade",                  path: "/q/q8" },
];

type NavBarProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateRecorte: (path: string) => void;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

export default function NavBar({ onNavigateHome, onNavigateRecortes, onNavigateRecorte }: NavBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 md:px-14"
      style={{
        background: "var(--surface-glass)",
        borderColor: "var(--surface-glass-border)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Esquerda: INICIO + logo */}
      <div className="flex items-center gap-5">
        <button
          onClick={onNavigateHome}
          className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          style={{ fontFamily: MONO, letterSpacing: "0.22em" }}
        >
          INICIO
        </button>
        <button className="flex items-center gap-2.5" onClick={onNavigateHome}>
          <span className="h-5 w-1.5 bg-primary" />
          <span className="text-[16px] font-black text-foreground" style={{ fontFamily: SERIF }}>
            QUEM<span className="text-primary">GOVERNA</span>
          </span>
        </button>
      </div>

      {/* Direita: dropdown recortes + roteiro + tema */}
      <div className="flex items-center gap-3">

        {/* Dropdown RECORTES */}
        <div className="relative" onMouseLeave={() => setOpen(false)}>
          <button
            onMouseEnter={() => setOpen(true)}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 border px-4 py-2 text-[13px] font-medium tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            style={{ fontFamily: MONO, borderColor: "var(--border)" }}
          >
            RECORTES
            <svg
              width="10" height="7" viewBox="0 0 10 7" fill="none"
              style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M1 1L5 5.5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div
              className="absolute right-0 top-full z-50 min-w-[300px] border shadow-2xl"
              style={{
                background: "var(--surface-glass)",
                borderColor: "var(--surface-glass-border)",
                backdropFilter: "blur(18px)",
              }}
            >
              {recortes.map((r) => (
                <button
                  key={r.path}
                  onClick={() => { onNavigateRecorte(r.path); setOpen(false); }}
                  className="flex w-full items-center gap-4 border-b px-5 py-3.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary last:border-b-0"
                  style={{ fontFamily: MONO, letterSpacing: "0.06em", borderColor: "var(--border)" }}
                >
                  <span className="w-6 font-black text-primary">{r.n}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ROTEIRO DE ANÁLISE */}
        <button
          onClick={onNavigateRecortes}
          className="border px-4 py-2 text-[13px] font-medium tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          style={{ fontFamily: MONO, borderColor: "var(--border)" }}
        >
          ROTEIRO DE ANÁLISE
        </button>

        {/* Tema */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          style={{ fontSize: "1rem" }}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </nav>
  );
}
