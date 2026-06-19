import { useNavigate } from "react-router";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-14 h-14 border-b border-border"
      style={{ background: "rgba(10,10,10,0.96)", backdropFilter: "blur(14px)" }}
    >
      <button onClick={() => navigate("/home")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
        ← INÍCIO
      </button>

      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/home")}>
        <span className="w-1.5 h-5 bg-primary" />
        <span className="text-sm font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          QUEM<span className="text-primary">GOVERNA</span>
        </span>
      </div>

      <button
        onClick={() => navigate("/deputado")}
        className="text-xs tracking-widest px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        style={{ fontFamily: MONO }}>
        DEPUTADOS →
      </button>
    </nav>
  );
}
