type NavBarProps = {
  onNavigateHome: () => void;
  onNavigateDeputado: () => void;
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

export default function NavBar({ onNavigateHome, onNavigateDeputado }: NavBarProps) {
  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border px-6 md:px-14"
      style={{ background: "rgba(10,10,10,0.96)", backdropFilter: "blur(14px)" }}
    >
      <button
        onClick={onNavigateHome}
        className="text-muted-foreground transition-colors hover:text-foreground"
        style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.2em" }}
      >
        ← INÍCIO
      </button>

      <button className="flex items-center gap-2.5" onClick={onNavigateHome}>
        <span className="h-5 w-1.5 bg-primary" />
        <span className="text-sm font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          QUEM<span className="text-primary">GOVERNA</span>
        </span>
      </button>

      <button
        onClick={onNavigateDeputado}
        className="border border-primary px-3 py-1.5 text-xs tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        style={{ fontFamily: MONO }}
      >
        DEPUTADOS →
      </button>
    </nav>
  );
}
