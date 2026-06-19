const B = "https://images.unsplash.com/";

interface Props {
  n: string;
  tag: string;
  title: string;
  titleRed?: string;
  desc: string;
  imgId: string;
  /** extra images shown as a strip below the main hero image */
  stripImgs?: { id: string; alt: string }[];
}

export default function PageHero({ n, tag, title, titleRed, desc, imgId, stripImgs }: Props) {
  const src = (id: string, w: number, h: number) =>
    `${B}${id}?w=${w}&h=${h}&fit=crop&auto=format`;

  const MONO  = "'JetBrains Mono', monospace";
  const SERIF = "'Playfair Display', serif";

  return (
    <>
      {/* Full-bleed header with background image */}
      <div className="relative overflow-hidden border-b border-border" style={{ minHeight: 420 }}>
        <img
          src={src(imgId, 1800, 840)}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "grayscale(40%) contrast(1.08) brightness(0.42)" }}
        />
        {/* directional gradient — content side darker */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,0.92) 50%, rgba(10,10,10,0.35) 100%)" }} />
        {/* bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24"
          style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />

        {/* number watermark */}
        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black select-none pointer-events-none"
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(6rem, 18vw, 14rem)",
            color: "rgba(196,18,48,0.12)",
            lineHeight: 1,
          }}>
          {n.padStart(2, "0")}
        </span>

        {/* content */}
        <div className="relative z-10 px-6 md:px-14 pt-16 pb-14">
          <p className="text-xs tracking-[0.35em] text-primary mb-4" style={{ fontFamily: MONO }}>
            {n.padStart(2, "0")} — {tag}
          </p>
          <h1 className="font-black mb-5 leading-tight"
            style={{ fontFamily: SERIF, color: "#f0ece4", fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            {title}
            {titleRed && <><br /><span className="text-primary">{titleRed}</span></>}
          </h1>
          <p className="text-base text-muted-foreground max-w-lg leading-relaxed" style={{ fontWeight: 300 }}>
            {desc}
          </p>
        </div>
      </div>

      {/* Optional image strip */}
      {stripImgs && stripImgs.length > 0 && (
        <div className={`grid border-b border-border`}
          style={{ gridTemplateColumns: `repeat(${stripImgs.length}, 1fr)`, height: 180 }}>
          {stripImgs.map((img) => (
            <div key={img.id} className="relative overflow-hidden">
              <img
                src={src(img.id, 600, 360)}
                alt={img.alt}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "grayscale(30%) contrast(1.05) brightness(0.55)" }}
              />
              <div className="absolute inset-0"
                style={{ background: "rgba(10,10,10,0.35)" }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
