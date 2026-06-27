import { useEffect, useState } from "react";

type StripImage = {
  id: string;
  alt: string;
};

type PageHeroProps = {
  n: string;
  tag: string;
  title: string;
  titleRed?: string;
  desc: string;
  imgId: string;
  bgImages?: string[];
  stripImgs?: StripImage[];
  hideStrip?: boolean;
};

const UNSPLASH_BASE = "https://images.unsplash.com/";
const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Playfair Display', serif";

const imageUrl = (id: string, width: number, height: number) => {
  if (id.startsWith("/") || id.startsWith("./")) return id;
  if (!id.startsWith("photo-")) return `/backgrounds/${id}`;
  return `${UNSPLASH_BASE}${id}?w=${width}&h=${height}&fit=crop&auto=format`;
};

export default function PageHero({ n, tag, title, titleRed, desc, imgId, bgImages, stripImgs, hideStrip }: PageHeroProps) {
  const images = bgImages && bgImages.length > 0 ? bgImages : [imgId];
  const [currentSrc, setCurrentSrc] = useState(images[0]);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (images.length <= 1) return;
    let idx = 0;
    const cycle = () => {
      setOpacity(0);
      setTimeout(() => {
        idx = (idx + 1) % images.length;
        setCurrentSrc(images[idx]);
        setOpacity(1);
      }, 700);
    };
    const id = setInterval(cycle, 3000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="relative min-h-[420px] overflow-hidden border-b border-border">
        <img
          src={imageUrl(currentSrc, 1800, 840)}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(20%) contrast(1.05) brightness(0.68)", opacity, transition: "opacity 0.7s ease" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,0.92) 50%, rgba(10,10,10,0.35) 100%)" }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-24"
          style={{ background: "linear-gradient(to top, var(--background), transparent)" }}
        />
        <span
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none font-black"
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(6rem, 18vw, 14rem)",
            color: "rgba(196,18,48,0.12)",
            lineHeight: 1,
          }}
        >
          {n.padStart(2, "0")}
        </span>

        <div className="relative z-10 px-6 pb-14 pt-16 md:px-14">
          <p className="mb-4 text-xs tracking-[0.35em] text-primary" style={{ fontFamily: MONO }}>
            {n.padStart(2, "0")} — {tag}
          </p>
          <h1
            className="mb-5 font-black leading-tight"
            style={{ fontFamily: SERIF, color: "#f0ece4", fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            {title}
            {titleRed ? (
              <>
                <br />
                <span className="text-primary">{titleRed}</span>
              </>
            ) : null}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground" style={{ fontWeight: 300 }}>
            {desc}
          </p>
        </div>
      </div>

      {!hideStrip && stripImgs && stripImgs.length > 0 ? (
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `repeat(${stripImgs.length}, minmax(0, 1fr))`, height: 180 }}
        >
          {stripImgs.map((img) => (
            <div key={img.id} className="relative overflow-hidden">
              <img
                src={imageUrl(img.id, 600, 360)}
                alt={img.alt}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: "grayscale(30%) contrast(1.05) brightness(0.55)" }}
              />
              <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.35)" }} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
