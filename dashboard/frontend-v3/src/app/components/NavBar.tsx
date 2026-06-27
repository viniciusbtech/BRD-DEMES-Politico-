import { useTheme } from "../../contexts/ThemeContext";

type NavBarProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

export default function NavBar({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: NavBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b px-6 md:px-14"
      style={{
        background: "var(--surface-glass)",
        borderColor: "var(--surface-glass-border)",
        backdropFilter: "blur(14px)",
      }}
    >
      <button
        onClick={onNavigateHome}
        className="text-muted-foreground transition-colors hover:text-foreground"
        style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.2em" }}
      >
        INICIO
      </button>

      <button className="flex items-center gap-2.5" onClick={onNavigateHome}>
        <span className="h-5 w-1.5 bg-primary" />
        <span className="text-sm font-black text-foreground" style={{ fontFamily: SERIF }}>
          QUEM<span className="text-primary">GOVERNA</span>
        </span>
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={onNavigateRecortes}
          className="border border-border px-3 py-1.5 text-xs tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          style={{ fontFamily: MONO }}
        >
          RECORTES
        </button>
        <button
          onClick={onNavigateDeputado}
          className="border border-primary px-3 py-1.5 text-xs tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          style={{ fontFamily: MONO }}
        >
          DEPUTADOS
        </button>
        <button
          onClick={toggleTheme}
          className="ml-1 flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </nav>
  );
}
