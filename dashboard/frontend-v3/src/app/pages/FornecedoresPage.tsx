import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NavBar from "../components/NavBar";
import {
  backgroundImages,
  deputySuppliers,
  formatCurrency,
  mockDeputies,
  suppliers,
  unsplashImage,
  type MockDeputy,
  type Supplier,
} from "../data/fornecedoresMock";

type FornecedoresPageProps = {
  onNavigateHome: () => void;
  onNavigateRecortes: () => void;
  onNavigateDeputado: () => void;
};

type SectionBgProps = {
  imgId: string;
  alt: string;
  children: ReactNode;
  className?: string;
};

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

type SupplierDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (supplier: Supplier) => void;
};

type TooltipValue = string | number | Array<string | number>;

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

function SectionBg({ imgId, alt, children, className = "" }: SectionBgProps) {
  return (
    <div className={`relative ${className}`}>
      <img
        src={unsplashImage(imgId, 1600, 900)}
        alt={alt}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ filter: "grayscale(30%) contrast(1.05) brightness(0.38)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(10,10,10,0.88) 50%, rgba(10,10,10,0.55) 100%)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative max-w-xl">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
        ⌕
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      {value ? (
        <button onClick={() => onChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
          ×
        </button>
      ) : null}
    </div>
  );
}

function SupplierDropdown({ value, onChange, onSelect }: SupplierDropdownProps) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? suppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(value.toLowerCase()) ||
          supplier.category.toLowerCase().includes(value.toLowerCase()),
      )
    : suppliers;

  return (
    <div className="relative max-w-xl">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
        ⌕
      </span>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Nome ou categoria do fornecedor..."
        className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      {value ? (
        <button
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      ) : null}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 max-h-72 overflow-y-auto border border-border" style={{ background: "#141414" }}>
          {filtered.map((supplier) => (
            <button
              key={supplier.id}
              onClick={() => {
                onSelect(supplier);
                onChange(supplier.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  {supplier.name}
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {supplier.category} · {supplier.deputies} dep. · {formatCurrency(supplier.total)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-primary" style={{ fontFamily: MONO }}>
                VER →
              </span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              NENHUM RESULTADO
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function FornecedoresPage({ onNavigateHome, onNavigateRecortes, onNavigateDeputado }: FornecedoresPageProps) {
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deputyQuery, setDeputyQuery] = useState("");
  const [selectedDeputy, setSelectedDeputy] = useState<MockDeputy | null>(null);
  const [showDeputyDrop, setShowDeputyDrop] = useState(false);
  const [contractsQuery, setContractsQuery] = useState("");

  const suppliersByDeputies = useMemo(() => [...suppliers].sort((a, b) => b.deputies - a.deputies), []);
  const suppliersByTotal = useMemo(() => [...suppliers].sort((a, b) => b.total - a.total), []);
  const selectedCategorySuppliers = selectedSupplier ? suppliers.filter((supplier) => supplier.category === selectedSupplier.category) : [];
  const maxSupplierTotal = suppliersByTotal[0]?.total ?? 1;

  const filteredDeputies = mockDeputies.filter(
    (deputy) =>
      deputy.name.toLowerCase().includes(deputyQuery.toLowerCase()) ||
      deputy.party.toLowerCase().includes(deputyQuery.toLowerCase()),
  );

  const deputyLinks = selectedDeputy
    ? (deputySuppliers[selectedDeputy.id] ?? [])
        .map((link) => ({ ...link, supplier: suppliers.find((supplier) => supplier.id === link.supplierId) }))
        .filter((link): link is typeof link & { supplier: Supplier } => Boolean(link.supplier))
    : [];

  const filteredContracts = contractsQuery
    ? suppliersByTotal.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(contractsQuery.toLowerCase()) ||
          supplier.category.toLowerCase().includes(contractsQuery.toLowerCase()),
      )
    : suppliersByTotal;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <NavBar onNavigateHome={onNavigateHome} onNavigateRecortes={onNavigateRecortes} onNavigateDeputado={onNavigateDeputado} />

      <SectionBg imgId={backgroundImages[4].id} alt={backgroundImages[4].alt}>
        <div className="border-b border-border px-6 pb-12 pt-16 md:px-14">
          <p className="mb-3 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            05 — CONTRATOS
          </p>
          <h1 className="mb-4 text-5xl font-black md:text-7xl" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Fornecedores
            <br />
            <span className="text-primary">× Deputados</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Quem recebeu dinheiro público, quais empresas dominam os contratos e o que cada deputado comprou.
          </p>
        </div>
      </SectionBg>

      <SectionBg imgId={backgroundImages[0].id} alt={backgroundImages[0].alt}>
        <section className="border-b border-border px-6 py-14 md:px-14">
          <div className="mb-2 flex items-baseline gap-4">
            <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
              01
            </span>
            <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              BUSCA POR FORNECEDOR
            </p>
          </div>
          <h2 className="mb-2 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Quanto foi gasto com esse fornecedor?
          </h2>
          <p className="mb-8 max-w-lg text-sm text-muted-foreground">
            Pesquise pelo nome ou categoria para ver o total recebido e o comparativo com outros fornecedores do mesmo setor.
          </p>

          <SupplierDropdown value={supplierQuery} onChange={setSupplierQuery} onSelect={setSelectedSupplier} />

          {selectedSupplier ? (
            <div className="mt-8">
              <div className="mb-8 flex items-center gap-4 border-l-4 border-primary px-6 py-5" style={{ background: "#141414" }}>
                <div>
                  <h3 className="mb-0.5 text-2xl font-black text-foreground" style={{ fontFamily: SERIF }}>
                    {selectedSupplier.name}
                  </h3>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    {selectedSupplier.category}
                  </p>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-px border border-border sm:grid-cols-3" style={{ background: "rgba(240,236,228,0.07)" }}>
                {[
                  { label: "TOTAL RECEBIDO", value: formatCurrency(selectedSupplier.total) },
                  { label: "DEPUTADOS", value: `${selectedSupplier.deputies}` },
                  { label: "TICKET MÉDIO", value: formatCurrency(Math.round(selectedSupplier.total / selectedSupplier.deputies)) },
                ].map((metric) => (
                  <div key={metric.label} className="bg-background px-6 py-7">
                    <p className="mb-2 text-xs tracking-widest text-muted-foreground" style={{ fontFamily: MONO }}>
                      {metric.label}
                    </p>
                    <p className="text-2xl font-black text-primary" style={{ fontFamily: SERIF }}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {selectedCategorySuppliers.length > 1 ? (
                <div>
                  <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    COMPARATIVO — {selectedSupplier.category.toUpperCase()}
                  </p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedCategorySuppliers} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => `R$${(value / 1_000_000).toFixed(0)}M`}
                        />
                        <YAxis type="category" dataKey="name" tick={{ fill: "#f0ece4", fontSize: 10, fontFamily: SERIF }} axisLine={false} tickLine={false} width={150} />
                        <Tooltip
                          contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                          formatter={(value: TooltipValue) => [formatCurrency(Number(value)), "Total"]}
                        />
                        <Bar dataKey="total" radius={[0, 2, 2, 0]} maxBarSize={18}>
                          {selectedCategorySuppliers.map((supplier) => (
                            <Cell key={supplier.id} fill={supplier.id === selectedSupplier.id ? "#c41230" : "rgba(196,18,48,0.25)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </SectionBg>

      <SectionBg imgId={backgroundImages[1].id} alt={backgroundImages[1].alt}>
        <section className="border-b border-border px-6 py-14 md:px-14">
          <div className="mb-2 flex items-baseline gap-4">
            <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
              02
            </span>
            <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              ALCANCE
            </p>
          </div>
          <h2 className="mb-10 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Fornecedores com mais deputados
          </h2>

          <div className="mb-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suppliersByDeputies} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#888880", fontSize: 10, fontFamily: MONO }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#f0ece4", fontSize: 10, fontFamily: SERIF }} axisLine={false} tickLine={false} width={170} />
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid rgba(240,236,228,0.1)", fontFamily: MONO, fontSize: 11 }}
                  formatter={(value: TooltipValue) => [`${value} deputados`, ""]}
                />
                <Bar dataKey="deputies" radius={[0, 2, 2, 0]} maxBarSize={18}>
                  {suppliersByDeputies.map((supplier, index) => (
                    <Cell key={supplier.id} fill={index === 0 ? "#c41230" : index < 3 ? "#d4841a" : "rgba(196,18,48,0.3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-px overflow-x-auto border border-border" style={{ background: "rgba(240,236,228,0.06)" }}>
            <div className="grid min-w-[720px] grid-cols-4 bg-background px-6 py-3">
              {["#", "FORNECEDOR", "CATEGORIA", "DEPUTADOS"].map((heading) => (
                <span key={heading} className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {heading}
                </span>
              ))}
            </div>
            {suppliersByDeputies.map((supplier, index) => (
              <div key={supplier.id} className="grid min-w-[720px] grid-cols-4 items-center bg-background px-6 py-3.5 transition-colors hover:bg-card">
                <span className="text-2xl font-black" style={{ fontFamily: SERIF, color: index === 0 ? "#c41230" : "rgba(240,236,228,0.25)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                  {supplier.name}
                </span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  {supplier.category}
                </span>
                <span className="text-sm font-bold" style={{ fontFamily: MONO, color: index === 0 ? "#c41230" : "#f0ece4" }}>
                  {supplier.deputies}
                </span>
              </div>
            ))}
          </div>
        </section>
      </SectionBg>

      <SectionBg imgId={backgroundImages[2].id} alt={backgroundImages[2].alt}>
        <section className="border-b border-border px-6 py-14 md:px-14">
          <div className="mb-2 flex items-baseline gap-4">
            <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
              03
            </span>
            <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              POR DEPUTADO
            </p>
          </div>
          <h2 className="mb-2 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Quais são os fornecedores desse deputado?
          </h2>
          <p className="mb-8 max-w-lg text-sm text-muted-foreground">
            Busque um deputado para ver com quais empresas ele mais gastou a cota parlamentar.
          </p>

          <div className="relative max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
              ⌕
            </span>
            <input
              value={deputyQuery}
              onChange={(event) => {
                setDeputyQuery(event.target.value);
                setShowDeputyDrop(true);
              }}
              onFocus={() => setShowDeputyDrop(true)}
              placeholder="Nome ou partido do deputado..."
              className="w-full border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {deputyQuery ? (
              <button
                onClick={() => {
                  setDeputyQuery("");
                  setShowDeputyDrop(false);
                  setSelectedDeputy(null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            ) : null}
            {showDeputyDrop ? (
              <div className="absolute left-0 right-0 top-full z-20 border border-border" style={{ background: "#141414" }}>
                {(deputyQuery ? filteredDeputies : mockDeputies).map((deputy) => (
                  <button
                    key={deputy.id}
                    onClick={() => {
                      setSelectedDeputy(deputy);
                      setDeputyQuery(deputy.name);
                      setShowDeputyDrop(false);
                    }}
                    className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden">
                      <img src={unsplashImage(deputy.img, 72, 72)} alt={deputy.name} className="h-full w-full object-cover" style={{ filter: "grayscale(40%)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                        {deputy.name}
                      </p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {deputy.party} · {deputy.state}
                      </p>
                    </div>
                  </button>
                ))}
                {deputyQuery && filteredDeputies.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                    NENHUM RESULTADO
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {selectedDeputy ? (
            <div className="mt-8">
              <div className="relative mb-8 h-[320px] overflow-hidden border border-primary">
                <img
                  src={unsplashImage(selectedDeputy.img, 1400, 640)}
                  alt={selectedDeputy.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  style={{ filter: "grayscale(30%) contrast(1.05)" }}
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.2) 100%)" }} />
                <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 60px rgba(196,18,48,0.15)" }} />
                <div className="relative z-10 flex h-full flex-col justify-end px-8 pb-8">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="bg-primary px-2 py-0.5 text-xs text-primary-foreground" style={{ fontFamily: MONO }}>
                      {selectedDeputy.party}
                    </span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {selectedDeputy.state} · {selectedDeputy.mandate}
                    </span>
                  </div>
                  <h3 className="text-4xl font-black text-foreground" style={{ fontFamily: SERIF, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                    {selectedDeputy.name}
                  </h3>
                </div>
              </div>

              {deputyLinks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {deputyLinks.map((link, index) => (
                    <div key={link.supplierId} className="flex items-center gap-5 border border-border px-5 py-4 transition-colors hover:border-primary" style={{ background: "#111111" }}>
                      <span className="shrink-0 text-3xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.4)" }}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-baseline justify-between gap-4">
                          <p className="truncate text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                            {link.supplier.name}
                          </p>
                          <p className="shrink-0 text-sm font-black text-primary" style={{ fontFamily: MONO }}>
                            {formatCurrency(link.total)}
                          </p>
                        </div>
                        <p className="mb-2 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                          {link.supplier.category} · {link.percent}% do gasto total
                        </p>
                        <div className="h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                          <div style={{ width: `${Math.min(link.percent * 5, 100)}%`, background: "#c41230", height: "100%" }} />
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
          ) : null}
        </section>
      </SectionBg>

      <SectionBg imgId={backgroundImages[3].id} alt={backgroundImages[3].alt}>
        <section className="px-6 py-14 md:px-14">
          <div className="mb-2 flex items-baseline gap-4">
            <span className="text-4xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.25)" }}>
              04
            </span>
            <p className="text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
              CONTRATOS
            </p>
          </div>
          <h2 className="mb-2 text-3xl font-black" style={{ fontFamily: SERIF, color: "#f0ece4" }}>
            Quanto esse fornecedor ganhou em contratos?
          </h2>
          <p className="mb-8 max-w-lg text-sm text-muted-foreground">
            Filtre pelo nome para encontrar um fornecedor específico e ver o total de contratos recebidos.
          </p>

          <SearchInput value={contractsQuery} onChange={setContractsQuery} placeholder="Filtrar por nome ou categoria..." />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filteredContracts.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground" style={{ fontFamily: MONO }}>
                NENHUM FORNECEDOR ENCONTRADO PARA "{contractsQuery.toUpperCase()}"
              </p>
            ) : (
              filteredContracts.map((supplier) => {
                const rank = suppliersByTotal.findIndex((item) => item.id === supplier.id);
                return (
                  <div key={supplier.id} className="border border-border p-5 transition-colors hover:border-primary" style={{ background: "#141414" }}>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 text-2xl font-black" style={{ fontFamily: SERIF, color: "rgba(196,18,48,0.4)" }}>
                          {String(rank + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground" style={{ fontFamily: SERIF }}>
                            {supplier.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                            {supplier.category}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 border border-border px-2 py-0.5 text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                        {supplier.deputies} dep.
                      </span>
                    </div>

                    <p className="mb-3 text-3xl font-black text-primary" style={{ fontFamily: SERIF }}>
                      {formatCurrency(supplier.total)}
                    </p>

                    <div className="mb-2 h-1.5 overflow-hidden" style={{ background: "rgba(240,236,228,0.07)" }}>
                      <div style={{ width: `${(supplier.total / maxSupplierTotal) * 100}%`, background: "#c41230", height: "100%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                      {((supplier.total / maxSupplierTotal) * 100).toFixed(0)}% do maior contratado
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </SectionBg>
    </div>
  );
}
