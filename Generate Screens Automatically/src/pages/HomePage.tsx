import { useNavigate } from "react-router";
import { img, heroStats, analyses, stripPhotos } from "../data";
import { useState, useEffect, useCallback } from "react";

const s1 = [...stripPhotos, ...stripPhotos];
const s2 = [...stripPhotos, ...stripPhotos].reverse();
const s3 = [...stripPhotos, ...stripPhotos];

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
  const [flash, setFlash] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setBlink((v) => !v), 550);
    return () => clearInterval(t);
  }, []);

  const enter = useCallback(() => {
    setFlash(true);
    setTimeout(() => navigate("/home"), 350);
  }, [navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes sl  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
        @keyframes sr  { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes fl  { 0% { opacity:0; } 50% { opacity:1; } 100% { opacity:0; } }
        @keyframes pb  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        .sl1 { animation: sl 28s linear infinite; }
        .sl2 { animation: sr 22s linear infinite; }
        .sl3 { animation: sl 34s linear infinite; }
        .flash-anim { animation: fl 0.35s ease-out forwards; }
        .pulse-h { animation: pb 2s ease-in-out infinite; }
      `}</style>

      {flash && (
        <div className="flash-anim fixed inset-0 z-50 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, #c41230 0%, #0a0a0a 80%)" }} />
      )}

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-14 h-14 border-b border-border"
        style={{ background: "rgba(10,10,10,0.93)", backdropFilter: "blur(14px)" }}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/intro")}>
          <span className="w-1.5 h-6 bg-primary" />
          <span className="text-base font-black tracking-wider"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
            QUEM<span className="text-primary">GOVERNA</span>
          </span>
        </div>
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

      {/* SOCIAL BG + 7 CARDS */}
      <section className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="grid grid-cols-3 grid-rows-2 w-full h-full">
            {socialBg.map((s, i) => (
              <div key={i} className="overflow-hidden">
                <img src={img(s.id, 700, 500)} alt={s.alt}
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(100%) contrast(1.15) brightness(0.5)" }} />
              </div>
            ))}
          </div>
          <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.84)" }} />
          <div className="absolute top-0 inset-x-0 h-28" style={{ background: "linear-gradient(to bottom, #0a0a0a, transparent)" }} />
          <div className="absolute bottom-0 inset-x-0 h-28" style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />
        </div>

        <div className="relative z-10 px-6 md:px-14 pt-20 pb-10">
          <p className="text-xs tracking-[0.35em] text-primary mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>AS 7 ANÁLISES</p>
          <h3 className="text-3xl font-black"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>O que está em jogo</h3>
        </div>

        {/* 2-col grid — pairs per row */}
        <div className="relative z-10 px-6 md:px-14 pb-20 grid grid-cols-2 gap-4">
          {analyses.map((a) => (
            <button
              key={a.n}
              onClick={() => navigate(a.route)}
              className="group relative overflow-hidden text-left transition-all duration-300 hover:ring-1 hover:ring-primary"
              style={{ height: "clamp(200px, 24vw, 340px)", background: "#141414" }}
            >
              <img src={img(a.imgId, 800, 600)} alt={a.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "grayscale(45%) contrast(1.05)" }} />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.97) 35%, rgba(10,10,10,0.12) 100%)" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, rgba(196,18,48,0.2) 0%, transparent 60%)" }} />

              {/* number */}
              <span className="absolute top-4 left-5 font-black leading-none select-none"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 4.5vw, 4rem)", color: "rgba(196,18,48,0.85)" }}>
                {String(a.n).padStart(2, "0")}
              </span>

              {/* label */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.99), transparent)" }}>
                <span className="block text-xs tracking-[0.25em] text-primary mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.tag}</span>
                <span className="block font-black leading-tight text-foreground mb-1.5"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1rem, 1.8vw, 1.4rem)" }}>
                  {a.title}
                </span>
                <span className="block text-xs text-muted-foreground leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {a.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer className="px-6 md:px-14 py-10 border-t border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-primary" />
            <span className="text-base font-black"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4" }}>
              QUEM<span className="text-primary">GOVERNA</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Dados: Portal da Câmara dos Deputados, TSE, Portal da Transparência e SIAFI.
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 · 57ª LEGISLATURA
          </p>
        </div>
      </footer>
    </div>
  );
}
