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
          style={{ opacity, transition: "opacity 0.7s ease" }}
        />
        <span
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none font-black"
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(7rem, 20vw, 15.5rem)",
            color: "rgba(196,18,48,0.95)",
            lineHeight: 1,
            textShadow: "0 4px 18px rgba(0,0,0,0.85)",
            WebkitTextStroke: "1px rgba(255,255,255,0.55)",
          }}
        >
          {n.padStart(2, "0")}
        </span>

        <div className="relative z-10 px-6 pb-14 pt-16 md:px-14">
          <p
            className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-primary md:text-base"
            style={{ fontFamily: MONO, textShadow: "0 3px 12px rgba(0,0,0,0.95)" }}
          >
            {n.padStart(2, "0")} — {tag}
          </p>
          <h1
            className="mb-5 font-black leading-tight"
            style={{
              fontFamily: SERIF,
              color: "#fffaf0",
              fontSize: "clamp(3.25rem, 7vw, 6.25rem)",
              textShadow: "0 5px 22px rgba(0,0,0,0.95)",
            }}
          >
            {title}
            {titleRed ? (
              <>
                <br />
                <span className="text-primary" style={{ textShadow: "0 5px 20px rgba(0,0,0,0.95)" }}>
                  {titleRed}
                </span>
              </>
            ) : null}
          </h1>
          <p
            className="max-w-2xl text-lg font-semibold leading-relaxed md:text-xl"
            style={{ color: "#fffaf0", textShadow: "0 3px 14px rgba(0,0,0,0.95)" }}
          >
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
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
