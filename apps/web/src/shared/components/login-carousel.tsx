"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/Container.png", alt: "Container cargo transport", label: "Containers" },
  { src: "/Carga Geral.png", alt: "General cargo transport", label: "General cargo" },
  { src: "/Granel.png", alt: "Bulk cargo transport", label: "Bulk cargo" },
];

export function LoginCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      50_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="relative hidden min-h-screen overflow-hidden bg-slate-950 lg:block"
      aria-label="LUMAC transport services"
    >
      {slides.map((slide, index) => (
        <figure
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === active ? "z-10 opacity-100" : "z-0 opacity-0"}`}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.src}
            alt={index === active ? slide.alt : ""}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 65vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/5 to-slate-950/10" />
        </figure>
      ))}

      <div className="absolute inset-x-10 bottom-10 z-20 flex items-end justify-between gap-6">
        <div className="max-w-md text-white">
          <p className="text-xl font-semibold">Logistics that follows every shipment.</p>
          <p className="mt-1.5 text-sm text-white/75">Operations, tracking, and delivery in one place.</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 p-2 backdrop-blur-md" role="tablist" aria-label="Select cargo type">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={slide.label}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2 bg-white/45 hover:bg-white/75"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
