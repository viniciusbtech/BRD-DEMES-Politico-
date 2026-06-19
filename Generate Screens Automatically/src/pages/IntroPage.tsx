import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { img, stripPhotos } from "../data";

const s1 = [...stripPhotos, ...stripPhotos];
const s2 = [...stripPhotos, ...stripPhotos].reverse();
const s3 = [...stripPhotos, ...stripPhotos];

export default function IntroPage() {
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
    <div
      onClick={enter}
      className="fixed inset-0 flex flex-col justify-center cursor-pointer select-none overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      <style>{`
        @keyframes sl  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
        @keyframes sr  { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes fl  { 0% { opacity:0; } 50% { opacity:1; } 100% { opacity:0; } }
        @keyframes pb  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        .sl1 { animation: sl 28s linear infinite; }
        .sl2 { animation: sr 22s linear infinite; }
        .sl3 { animation: sl 34s linear infinite; }
        .flash-anim { animation: fl 0.35s ease-out forwards; }
        .pulse { animation: pb 2s ease-in-out infinite; }
      `}</style>

      {flash && (
        <div className="flash-anim fixed inset-0 z-50 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, #c41230 0%, #0a0a0a 80%)" }} />
      )}

      {/* grain */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-25"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />

      {/* vignettes */}
      <div className="absolute top-0 inset-x-0 h-44 z-20 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0a0a0a, transparent)" }} />
      <div className="absolute bottom-0 inset-x-0 h-44 z-20 pointer-events-none" style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />
      <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 48% at 50% 50%, transparent 25%, rgba(10,10,10,0.75) 100%)" }} />

      {/* scrolling strips */}
      <div className="flex flex-col gap-2.5">
        {[{ data: s1, cls: "sl1" }, { data: s2, cls: "sl2" }, { data: s3, cls: "sl3" }].map(({ data, cls }, ri) => (
          <div key={ri} className="overflow-hidden">
            <div className={`${cls} flex gap-2.5`} style={{ width: "max-content" }}>
              {data.map((p, i) => (
                <div key={i} className="relative flex-shrink-0 w-32 h-44 overflow-hidden bg-card"
                  style={{ filter: "grayscale(75%) contrast(1.1)" }}>
                  <img src={img(p.id, 256, 352)} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(196,18,48,0.2), transparent 60%)" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* center text */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-xs tracking-[0.4em] text-muted-foreground mb-5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          REPÚBLICA FEDERATIVA DO BRASIL — 57ª LEGISLATURA
        </p>
        <h1 className="text-7xl md:text-9xl font-black leading-none text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece4", textShadow: "0 0 100px rgba(196,18,48,0.5)" }}>
          QUEM
        </h1>
        <h1 className="text-7xl md:text-9xl font-black leading-none text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: "#c41230", textShadow: "0 0 120px rgba(196,18,48,0.9)" }}>
          GOVERNA?
        </h1>
        <div className="mt-4 h-px w-20 bg-primary opacity-50" />
      </div>

      {/* click hint */}
      <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center pointer-events-none">
        <p className="pulse text-xs tracking-[0.35em] text-muted-foreground"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {blink ? "▶  CLIQUE PARA ENTRAR  ◀" : "   CLIQUE PARA ENTRAR   "}
        </p>
      </div>
    </div>
  );
}
