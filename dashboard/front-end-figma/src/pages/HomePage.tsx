import { useRef } from "react";
import { useNavigate } from "react-router";
import { img, heroStats, analyses } from "../data";

const socialBg = [
  { id: "photo-1607920609380-4ce0f52486a9", alt: "Desigualdade social" },
  { id: "photo-1517120026326-d87759a7b63b", alt: "Crise na saúde" },
  { id: "photo-1635068741358-ab1b9813623f", alt: "Estradas esburacadas" },
  { id: "photo-1601195496005-f4f6092b0c69", alt: "Pobreza urbana" },
  { id: "photo-1611587266391-2e1605329537", alt: "Hospital precário" },
  { id: "photo-1572506532104-a982a90beccc", alt: "Vulnerabilidade social" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement>(null);

  const scrollToCard = (n: number) => {
    document.getElementById(`analise-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-14 h-14 border-b border-border"
        style={{ background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)" }}>
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 bg-primary" />
          <span className="text-base font-black tracking-wider cursor-pointer"
            onClick={() => navigate("/")}
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
            QUEM<span className="text-primary">GOVERNA</span>
          </span>
        </div>
        <button
          onClick={() => navigate("/deputado")}
          className="text-xs tracking-widest px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          PESQUISAR DEPUTADO →
        </button>
      </nav>

      {/* HERO */}
      <section className="relative px-6 md:px-14 pt-24 pb-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #c41230, transparent 70%)" }} />
        <p className="text-xs tracking-[0.35em] text-primary mb-5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ANÁLISE DE DADOS LEGISLATIVOS — BRASIL 2023–2026
        </p>
        <h2 className="text-6xl md:text-8xl font-black leading-[0.92] mb-8 max-w-4xl"
          style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
          QUEM<br /><span className="text-primary">GOVERNA?</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-4"
          style={{ fontWeight: 300 }}>
          Uma análise de dados legislativos para revelar contradições entre gastos,
          votos, proposições, ideologia e comportamento parlamentar.
        </p>
        <p className="text-xs tracking-widest text-muted-foreground mb-14 flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="inline-block w-4 h-px bg-muted-foreground" />
          Pesquisa restrita a Deputados Federais.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-border"
          style={{ background: "rgba(240,236,228,0.08)" }}>
          {heroStats.map((s) => (
            <div key={s.label} className="bg-background px-8 py-8">
              <span className="block text-4xl md:text-5xl font-black text-primary mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</span>
              <span className="block text-sm font-medium text-foreground mb-0.5">{s.label}</span>
              <span className="block text-xs text-muted-foreground"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL BG + CARDS GRID */}
      <section className="relative">
        {/* B&W mosaic background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="grid grid-cols-3 grid-rows-2 w-full h-full">
            {socialBg.map((s, i) => (
              <div key={i} className="relative overflow-hidden">
                <img src={img(s.id, 700, 500)} alt={s.alt}
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(100%) contrast(1.15) brightness(0.55)" }} />
              </div>
            ))}
          </div>
          <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.82)" }} />
          <div className="absolute top-0 inset-x-0 h-28" style={{ background: "linear-gradient(to bottom, #0a0a0a, transparent)" }} />
          <div className="absolute bottom-0 inset-x-0 h-28" style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />
        </div>

        {/* header */}
        <div className="relative z-10 px-6 md:px-14 pt-20 pb-10 flex items-baseline justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-primary mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>AS 13 ANÁLISES</p>
            <h3 className="text-3xl font-black"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>O que está em jogo</h3>
          </div>
        </div>

        {/* 2-col cards grid */}
        <div ref={cardsRef} className="relative z-10 px-6 md:px-14 pb-20 grid grid-cols-2 gap-4">
          {analyses.map((a) => (
            <button key={a.n} onClick={() => scrollToCard(a.n)}
              className="group relative overflow-hidden text-left transition-all duration-300 hover:ring-1 hover:ring-primary"
              style={{ height: "clamp(220px, 28vw, 380px)", background: "#141414" }}>
              <img src={img(a.imgId, 800, 600)} alt={a.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "grayscale(45%) contrast(1.05)" }} />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.96) 30%, rgba(10,10,10,0.15) 100%)" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, rgba(196,18,48,0.18) 0%, transparent 60%)" }} />
              <span className="absolute top-4 left-5 font-black leading-none select-none"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "rgba(196,18,48,0.85)" }}>
                {String(a.n).padStart(2, "0")}
              </span>
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.98), transparent)" }}>
                <span className="block text-xs tracking-[0.25em] text-primary mb-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.tag}</span>
                <span className="block font-black leading-tight text-foreground"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1rem, 1.8vw, 1.4rem)" }}>
                  {a.title}
                </span>
                <span className="block text-xs text-muted-foreground mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.highlight}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 13 ANALYSIS SECTIONS */}
      <div>
        {analyses.map((a, i) => {
          const alignRight = i % 2 !== 0;
          return (
            <section key={a.n} id={`analise-${a.n}`}
              className="relative overflow-hidden border-t border-border"
              style={{ minHeight: "clamp(480px, 70vh, 720px)" }}>
              <img src={img(a.imgId, 1600, 900)} alt={a.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "grayscale(60%) contrast(1.08) brightness(0.6)" }} />
              <div className="absolute inset-0" style={{
                background: alignRight
                  ? "linear-gradient(to left, rgba(10,10,10,0.97) 40%, rgba(10,10,10,0.25) 100%)"
                  : "linear-gradient(to right, rgba(10,10,10,0.97) 40%, rgba(10,10,10,0.25) 100%)"
              }} />
              <div className="absolute bottom-0 inset-x-0 h-32"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.8), transparent)" }} />
              <span className="absolute select-none pointer-events-none font-black leading-none"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(8rem, 22vw, 18rem)",
                  color: "rgba(196,18,48,0.12)",
                  top: "50%", transform: "translateY(-50%)",
                  ...(alignRight ? { right: "-0.05em" } : { left: "-0.05em" }),
                }}>
                {String(a.n).padStart(2, "0")}
              </span>
              <div className={`relative z-10 h-full flex flex-col justify-end md:justify-center px-8 md:px-16 py-14 ${alignRight ? "md:items-end md:text-right" : "md:items-start"}`}
                style={{ minHeight: "inherit" }}>
                <div className={`max-w-lg ${alignRight ? "md:ml-auto" : ""}`}>
                  <div className={`flex items-center gap-3 mb-4 ${alignRight ? "md:flex-row-reverse" : ""}`}>
                    <span className="text-xs tracking-[0.35em] text-primary"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>{String(a.n).padStart(2, "0")}</span>
                    <span className="h-px w-8 bg-primary flex-shrink-0" />
                    <span className="text-xs tracking-[0.25em] text-muted-foreground"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.tag}</span>
                  </div>
                  <h3 className="font-black leading-tight mb-5"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4", fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
                    {a.title}
                  </h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(240,236,228,0.65)" }}>
                    {a.summary}
                  </p>
                  <div className={`inline-flex items-center gap-2 mb-8 px-3 py-1.5 border border-primary/30 ${alignRight ? "md:ml-auto" : ""}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-xs text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.highlight}</span>
                  </div>
                  <div className={`flex ${alignRight ? "md:justify-end" : ""}`}>
                    <button
                      onClick={() => navigate("/deputado")}
                      className="px-6 py-3 bg-primary text-primary-foreground text-xs tracking-widest hover:opacity-90 transition-opacity"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      EXPLORAR {String(a.n).padStart(2, "0")} →
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="px-6 md:px-14 py-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-primary" />
            <span className="text-base font-black"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
              QUEM<span className="text-primary">GOVERNA</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Dados extraídos de fontes públicas: Portal da Câmara dos Deputados, TSE, Portal da Transparência e SIAFI.
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 · 57ª LEGISLATURA
          </p>
        </div>
      </footer>
    </div>
  );
}
