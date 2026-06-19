import { useState } from "react";
import NavBar from "../components/NavBar";
import { fmt, DEPUTIES, img } from "../data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const B = "https://images.unsplash.com/";
const bgImg = (id: string) => `${B}${id}?w=1600&h=900&fit=crop&auto=format`;

const BG_IMAGES = [
  { id: "photo-1603796846097-bee99e4a601f", alt: "Assinatura de contrato" },
  { id: "photo-1526304640581-d334cdbbf45e", alt: "Dinheiro — gastos públicos" },
  { id: "photo-1681505531034-8d67054e07f6", alt: "Acordo comercial" },
  { id: "photo-1521791055366-0d553872125f", alt: "Contrato empresarial" },
  { id: "photo-1551135049-8a33b5883817", alt: "Reunião de negócios" },
];

function SectionBg({ imgId, alt, children, className = "" }: {
  imgId: string; alt: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <img src={bgImg(imgId)} alt={alt}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ filter: "grayscale(30%) contrast(1.05) brightness(0.38)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(10,10,10,0.88) 50%, rgba(10,10,10,0.55) 100%)" }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

const SUPPLIERS = [
  { id: 1,  name: "Azul Linhas Aéreas",     category: "Transporte Aéreo", deputies: 312, total: 48_200_000 },
  { id: 2,  name: "LATAM Airlines",           category: "Transporte Aéreo", deputies: 287, total: 41_800_000 },
  { id: 3,  name: "Gol Linhas Aéreas",        category: "Transporte Aéreo", deputies: 261, total: 36_500_000 },
  { id: 4,  name: "Correios",                 category: "Postagem",         deputies: 401, total: 8_700_000  },
  { id: 5,  name: "Auto Posto Brasília",      category: "Combustível",      deputies: 198, total: 12_400_000 },
  { id: 6,  name: "Hotel Nacional Brasília",  category: "Hospedagem",       deputies: 176, total: 9_800_000  },
  { id: 7,  name: "Restaurant Congresso",     category: "Alimentação",      deputies: 389, total: 5_400_000  },
  { id: 8,  name: "Claro S.A.",               category: "Telecom",          deputies: 234, total: 7_200_000  },
  { id: 9,  name: "Vivo / Telefônica",        category: "Telecom",          deputies: 218, total: 6_900_000  },
  { id: 10, name: "Locadora Prime Cars",      category: "Veículos",         deputies: 142, total: 4_800_000  },
];

const DEPUTY_SUPPLIERS: Record<number, { supplierId: number; total: number; pct: number }[]> = {
  1: [{ supplierId: 1, total: 98_400,  pct: 9.1 }, { supplierId: 2, total: 72_100,  pct: 6.7 }, { supplierId: 8, total: 15_600, pct: 1.4 }, { supplierId: 5, total: 32_800, pct: 3.0 }, { supplierId: 4, total: 18_200, pct: 1.7 }],
  2: [{ supplierId: 2, total: 142_600, pct: 10.5 }, { supplierId: 3, total: 89_200, pct: 6.6 }, { supplierId: 6, total: 54_300, pct: 4.0 }, { supplierId: 9, total: 21_400, pct: 1.6 }, { supplierId: 10,total: 48_700, pct: 3.6 }],
  3: [{ supplierId: 1, total: 61_200,  pct: 8.8 }, { supplierId: 4, total: 9_800,  pct: 1.4 }, { supplierId: 8, total: 11_200, pct: 1.6 }, { supplierId: 7, total: 24_600, pct: 3.5 }, { supplierId: 5, total: 18_400, pct: 2.6 }],
  4: [{ supplierId: 2, total: 178_400, pct: 11.8 }, { supplierId: 1, total: 124_600, pct: 8.3 }, { supplierId: 10, total: 68_200, pct: 4.5 }, { supplierId: 6, total: 72_400, pct: 4.8 }, { supplierId: 9, total: 34_800, pct: 2.3 }],
};

/* ── Shared search input ────────────────────────── */
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative max-w-xl">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
        style={{ fontFamily: MONO }}>⌕</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
      {value && (
        <button onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
      )}
    </div>
  );
}

/* ── Supplier dropdown ─────────────────────────── */
function SupplierDropdown({ value, onChange, onSelect }: {
  value: string; onChange: (v: string) => void; onSelect: (s: typeof SUPPLIERS[0]) => void;
}) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? SUPPLIERS.filter((s) => s.name.toLowerCase().includes(value.toLowerCase()) || s.category.toLowerCase().includes(value.toLowerCase()))
    : SUPPLIERS;

  return (
    <div className="relative max-w-xl">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
        style={{ fontFamily: MONO }}>⌕</span>
      <input value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Nome ou categoria do fornecedor..."
        className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
      {value && (
        <button onClick={() => { onChange(""); setOpen(false); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 border border-border z-20 max-h-72 overflow-y-auto"
          style={{ background: "#141414" }}>
          {filtered.map((s) => (
            <button key={s.id} onClick={() => { onSelect(s); onChange(s.name); setOpen(false); }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{s.name}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {s.category} · {s.deputies} dep. · {fmt(s.total)}
                </p>
              </div>
              <span className="text-xs text-primary flex-shrink-0" style={{ fontFamily: MONO }}>VER →</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>NENHUM RESULTADO</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────── */
export default function FornecedoresPage() {
  // Section 01 — gasto por fornecedor
  const [supQuery1, setSupQuery1]         = useState("");
  const [selectedSup1, setSelectedSup1]   = useState<typeof SUPPLIERS[0] | null>(null);

  // Section 03 — fornecedores do deputado
  const [depQuery, setDepQuery]           = useState("");
  const [selectedDep, setSelectedDep]     = useState<typeof DEPUTIES[0] | null>(null);
  const [showDepDrop, setShowDepDrop]     = useState(false);

  // Section 04 — quanto ganhou em contratos (com filtro)
  const [supQuery4, setSupQuery4]         = useState("");

  const filteredSup4 = supQuery4
    ? SUPPLIERS.filter((s) => s.name.toLowerCase().includes(supQuery4.toLowerCase()) || s.category.toLowerCase().includes(supQuery4.toLowerCase()))
    : SUPPLIERS;

  const depLinks = selectedDep
    ? (DEPUTY_SUPPLIERS[selectedDep.id] ?? [])
        .map((l) => ({ ...l, supplier: SUPPLIERS.find((s) => s.id === l.supplierId)! }))
        .filter((l) => l.supplier)
    : [];

  const filteredDeps = DEPUTIES.filter((d) =>
    d.name.toLowerCase().includes(depQuery.toLowerCase()) ||
    d.party.toLowerCase().includes(depQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      {/* Header */}
      <SectionBg imgId={BG_IMAGES[4].id} alt={BG_IMAGES[4].alt}>
      <div className="px-6 md:px-14 pt-16 pb-12 border-b border-border">
        <p className="text-xs tracking-[0.35em] text-primary mb-3" style={{ fontFamily: MONO }}>05 — CONTRATOS</p>
        <h1 className="text-5xl md:text-7xl font-black mb-4" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Fornecedores<br /><span className="text-primary">× Deputados</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
          Quem recebeu dinheiro público, quais empresas dominam os contratos e o que cada deputado comprou.
        </p>
      </div>
      </SectionBg>

      {/* ── 01 — Quanto foi gasto com esse fornecedor ── */}
      <SectionBg imgId={BG_IMAGES[0].id} alt={BG_IMAGES[0].alt}>
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>01</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>BUSCA POR FORNECEDOR</p>
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Quanto foi gasto com esse fornecedor?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          Pesquise pelo nome ou categoria para ver o total recebido e comparativo com outros do mesmo setor.
        </p>

        <SupplierDropdown value={supQuery1} onChange={setSupQuery1} onSelect={setSelectedSup1} />

        {selectedSup1 && (
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-6 px-6 py-5 border-l-4 border-primary"
              style={{ background: "#141414" }}>
              <div>
                <h3 className="text-2xl font-black text-foreground mb-0.5" style={{ fontFamily: SERIF }}>
                  {selectedSup1.name}
                </h3>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{selectedSup1.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px border border-border mb-8"
              style={{ background: "rgba(240,236,228,0.07)" }}>
              {[
                { label: "TOTAL RECEBIDO", val: fmt(selectedSup1.total) },
                { label: "DEPUTADOS",       val: `${selectedSup1.deputies}` },
                { label: "TICKET MÉDIO",    val: fmt(Math.round(selectedSup1.total / selectedSup1.deputies)) },
              ].map((m) => (
                <div key={m.label} className="bg-background px-6 py-7">
                  <p className="text-xs tracking-widest text-muted-foreground mb-2" style={{ fontFamily: MONO }}>{m.label}</p>
                  <p className="text-2xl font-black text-primary" style={{ fontFamily: SERIF }}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* same-category comparison */}
            {SUPPLIERS.filter((s) => s.category === selectedSup1.category).length > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: MONO }}>
                  COMPARATIVO — {selectedSup1.category.toUpperCase()}
                </p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SUPPLIERS.filter((s) => s.category === selectedSup1.category)} layout="vertical"
                      margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                        axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1_000_000).toFixed(0)}M`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#f0ece4", fontSize: 10, fontFamily: SERIF }}
                        axisLine={false} tickLine={false} width={150} />
                      <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                        formatter={(v: number) => [fmt(v), "Total"]} />
                      <Bar dataKey="total" radius={[0, 2, 2, 0]} maxBarSize={18}>
                        {SUPPLIERS.filter((s) => s.category === selectedSup1.category).map((s) => (
                          <Cell key={s.id} fill={s.id === selectedSup1.id ? "#c41230" : "rgba(196,18,48,0.25)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      </SectionBg>

      {/* ── 02 — Fornecedores com mais deputados ── */}
      <SectionBg imgId={BG_IMAGES[1].id} alt={BG_IMAGES[1].alt}>
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>02</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>ALCANCE</p>
        </div>
        <h2 className="text-3xl font-black mb-10" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Fornecedores com mais deputados
        </h2>

        <div className="h-64 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...SUPPLIERS].sort((a, b) => b.deputies - a.deputies)} layout="vertical"
              margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#f0ece4", fontSize: 10, fontFamily: SERIF }}
                axisLine={false} tickLine={false} width={170} />
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                formatter={(v: number) => [`${v} deputados`, ""]} />
              <Bar dataKey="deputies" radius={[0, 2, 2, 0]} maxBarSize={18}>
                {[...SUPPLIERS].sort((a, b) => b.deputies - a.deputies).map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#c41230" : i < 3 ? "#d4841a" : "rgba(196,18,48,0.3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-px border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
          <div className="grid grid-cols-4 px-6 py-3 bg-background">
            {["#", "FORNECEDOR", "CATEGORIA", "DEPUTADOS"].map((h) => (
              <span key={h} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{h}</span>
            ))}
          </div>
          {[...SUPPLIERS].sort((a, b) => b.deputies - a.deputies).map((s, i) => (
            <div key={s.id} className="grid grid-cols-4 px-6 py-3.5 bg-background hover:bg-card transition-colors items-center">
              <span className="text-2xl font-black"
                style={{ fontFamily: SERIF, color: i === 0 ? "#c41230" : "rgba(240,236,228,0.25)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{s.name}</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{s.category}</span>
              <span className="text-sm font-bold" style={{ fontFamily: MONO, color: i === 0 ? "#c41230" : "#f0ece4" }}>
                {s.deputies}
              </span>
            </div>
          ))}
        </div>
      </section>
      </SectionBg>

      {/* ── 03 — Fornecedores do deputado ── */}
      <SectionBg imgId={BG_IMAGES[2].id} alt={BG_IMAGES[2].alt}>
      <section className="px-6 md:px-14 py-14 border-b border-border">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>03</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>POR DEPUTADO</p>
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Quais são os fornecedores desse deputado?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          Busque um deputado para ver com quais empresas ele mais gastou a cota parlamentar.
        </p>

        {/* deputy search */}
        <div className="relative max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
            style={{ fontFamily: MONO }}>⌕</span>
          <input value={depQuery}
            onChange={(e) => { setDepQuery(e.target.value); setShowDepDrop(true); }}
            onFocus={() => setShowDepDrop(true)}
            placeholder="Nome ou partido do deputado..."
            className="w-full pl-10 pr-10 py-3.5 border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {depQuery && (
            <button onClick={() => { setDepQuery(""); setShowDepDrop(false); setSelectedDep(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
          )}
          {showDepDrop && (
            <div className="absolute top-full left-0 right-0 border border-border z-20"
              style={{ background: "#141414" }}>
              {(depQuery ? filteredDeps : DEPUTIES).map((d) => (
                <button key={d.id} onClick={() => { setSelectedDep(d); setDepQuery(d.name); setShowDepDrop(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0">
                  <div className="w-9 h-9 overflow-hidden flex-shrink-0">
                    <img src={img(d.img, 72, 72)} alt={d.name} className="w-full h-full object-cover" style={{ filter: "grayscale(40%)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>{d.name}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>{d.party} · {d.state}</p>
                  </div>
                </button>
              ))}
              {depQuery && filteredDeps.length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>NENHUM RESULTADO</p>
              )}
            </div>
          )}
        </div>

        {selectedDep && (
          <div className="mt-8">
            {/* Deputy hero banner — large photo */}
            <div className="relative overflow-hidden mb-8 border border-primary" style={{ height: 320 }}>
              <img
                src={img(selectedDep.img, 1400, 640)}
                alt={selectedDep.name}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ filter: "grayscale(30%) contrast(1.05)" }}
              />
              {/* gradient overlay */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.2) 100%)" }} />
              {/* glow behind primary border */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: "inset 0 0 60px rgba(196,18,48,0.15)" }} />

              {/* content over photo */}
              <div className="relative z-10 flex flex-col justify-end h-full px-8 pb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground"
                    style={{ fontFamily: MONO }}>{selectedDep.party}</span>
                  <span className="text-xs text-muted-foreground"
                    style={{ fontFamily: MONO }}>{selectedDep.state} · {selectedDep.mandate}</span>
                </div>
                <h3 className="text-4xl font-black text-foreground"
                  style={{ fontFamily: SERIF, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                  {selectedDep.name}
                </h3>
              </div>
            </div>

            {depLinks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {depLinks.map((link, i) => (
                  <div key={link.supplierId}
                    className="flex items-center gap-5 border border-border px-5 py-4 hover:border-primary transition-colors"
                    style={{ background: "#111" }}>
                    <span className="text-3xl font-black flex-shrink-0"
                      style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.4)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1 gap-4">
                        <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: SERIF }}>
                          {link.supplier.name}
                        </p>
                        <p className="text-sm font-black text-primary flex-shrink-0" style={{ fontFamily: MONO }}>
                          {fmt(link.total)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: MONO }}>
                        {link.supplier.category} · {link.pct}% do gasto total
                      </p>
                      <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                        <div style={{ width: `${Math.min(link.pct * 5, 100)}%`, background: "#c41230", height: "100%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
                DADOS NÃO DISPONÍVEIS PARA ESTE DEPUTADO.
              </p>
            )}
          </div>
        )}
      </section>
      </SectionBg>

      {/* ── 04 — Quanto esse fornecedor ganhou em contratos ── */}
      <SectionBg imgId={BG_IMAGES[3].id} alt={BG_IMAGES[3].alt}>
      <section className="px-6 md:px-14 py-14">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>04</span>
          <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>CONTRATOS</p>
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
          Quanto esse fornecedor ganhou em contratos?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-lg">
          Filtre pelo nome para encontrar um fornecedor específico e ver o total de contratos recebidos.
        </p>

        <SearchInput value={supQuery4} onChange={setSupQuery4} placeholder="Filtrar por nome ou categoria..." />

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {filteredSup4.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-2" style={{ fontFamily: MONO }}>
              NENHUM FORNECEDOR ENCONTRADO PARA "{supQuery4.toUpperCase()}"
            </p>
          ) : filteredSup4.map((s, i) => {
            const rank = SUPPLIERS.findIndex((x) => x.id === s.id);
            return (
              <div key={s.id} className="border border-border p-5 hover:border-primary transition-colors"
                style={{ background: "#141414" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-black flex-shrink-0"
                      style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.4)" }}>
                      {String(rank + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: MONO }}>{s.category}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 border border-border text-muted-foreground flex-shrink-0"
                    style={{ fontFamily: MONO }}>{s.deputies} dep.</span>
                </div>

                <p className="text-3xl font-black text-primary mb-3" style={{ fontFamily: SERIF }}>{fmt(s.total)}</p>

                <div className="h-1.5 overflow-hidden mb-2" style={{ background: "rgba(240,236,228,0.07)" }}>
                  <div style={{ width: `${(s.total / SUPPLIERS[0].total) * 100}%`, background: "#c41230", height: "100%" }} />
                </div>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {((s.total / SUPPLIERS[0].total) * 100).toFixed(0)}% do maior contratado
                </p>
              </div>
            );
          })}
        </div>
      </section>
      </SectionBg>
    </div>
  );
}
